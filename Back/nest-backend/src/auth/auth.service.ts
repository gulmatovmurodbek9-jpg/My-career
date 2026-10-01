import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { MailService } from '../mail/mail.service';

const RESET_THROTTLE_MS = 60 * 1000;

// Ҳадди кӯшишҳои нодурусти вуруд: 10 бор дар 15 дақиқа барои як почта ё як IP.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 10;

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    private readonly recentResets = new Map<string, number>();
    private readonly loginFails = new Map<string, { count: number; first: number }>();

    assertLoginAllowed(keys: string[]): void {
        const now = Date.now();
        for (const key of keys) {
            const entry = this.loginFails.get(key);
            if (entry && now - entry.first < LOGIN_WINDOW_MS && entry.count >= LOGIN_MAX_FAILS) {
                const minutes = Math.ceil((LOGIN_WINDOW_MS - (now - entry.first)) / 60000);
                throw new HttpException(`Кӯшишҳо зиёд шуданд. Баъд аз ${minutes} дақиқа боз кӯшиш кунед ё паролро барқарор кунед.`, HttpStatus.TOO_MANY_REQUESTS);
            }
        }
    }

    recordLoginFail(keys: string[]): void {
        const now = Date.now();
        if (this.loginFails.size > 10000) {
            for (const [key, entry] of this.loginFails) if (now - entry.first >= LOGIN_WINDOW_MS) this.loginFails.delete(key);
        }
        for (const key of keys) {
            const entry = this.loginFails.get(key);
            if (!entry || now - entry.first >= LOGIN_WINDOW_MS) this.loginFails.set(key, { count: 1, first: now });
            else entry.count += 1;
        }
    }

    clearLoginFails(keys: string[]): void {
        for (const key of keys) this.loginFails.delete(key);
    }

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        // Дар база танҳо hash-и парол ҳаст; bcrypt пароли воридшударо бо он муқоиса мекунад.
        if (user?.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };

        const fullUser = await this.usersService.findById(user.id);
        const { password, ...safeUser } = fullUser as any;

        return {
            access_token: this.jwtService.sign(payload),
            user: safeUser,
        };
    }

    // Бақайдгирӣ токен намедиҳад: аввал коди 6-рақамаи почта лозим аст.
    async register(createUserDto: CreateUserDto) {
        const { user, code } = await this.usersService.registerUnverified(createUserDto);
        this.markSent(`verify:${user.email}`);
        await this.sendVerifyMail(user.email, code, user.name);
        return { needsVerification: true, email: user.email };
    }

    async verifyEmail(email: string, code: string) {
        const { result, user } = await this.usersService.verifyEmail(email, code);
        if (result === 'expired') throw new BadRequestException('Мӯҳлати код гузашт. Коди навро дархост кунед.');
        if (result === 'too_many_attempts') throw new BadRequestException('Кӯшишҳо аз ҳад зиёд шуданд. Коди навро дархост кунед.');
        if (result === 'invalid' || !user) throw new BadRequestException('Код нодуруст аст. Онро аз нома санҷед.');
        return this.login(user);
    }

    // Як дақиқа танаффус байни номаҳо — то касе почтаи бегонаро пур накунад.
    async resendVerifyCode(email: string): Promise<{ message: string; waitSeconds?: number }> {
        const key = `verify:${UsersService.normEmail(email)}`;
        const last = this.recentResets.get(key);
        if (last !== undefined && Date.now() - last < RESET_THROTTLE_MS) {
            return { message: 'Каме сабр кунед', waitSeconds: Math.ceil((RESET_THROTTLE_MS - (Date.now() - last)) / 1000) };
        }
        const created = await this.usersService.newVerifyCode(email);
        if (created) {
            this.markSent(key);
            await this.sendVerifyMail(created.user.email, created.code, created.user.name);
        }
        return { message: 'Агар ҳисоб тасдиқ нашуда бошад, коди нав фиристода шуд' };
    }

    // Ҳисоби тасдиқнашуда ворид шуда наметавонад; коди нав худкор меравад.
    async assertVerified(user: any): Promise<void> {
        if (user?.emailVerified !== false) return;
        await this.resendVerifyCode(user.email).catch(() => undefined);
        throw new ForbiddenException({ code: 'EMAIL_NOT_VERIFIED', email: user.email, message: 'Почтаи шумо тасдиқ нашудааст. Кодро аз нома ворид кунед.' });
    }

    private async sendVerifyMail(email: string, code: string, name?: string): Promise<void> {
        try {
            await this.mailService.sendVerificationCode(email, code, name);
        } catch (err) {
            this.logger.error(`Коди тасдиқ ба ${email} нарафт: ${err.message}`);
            throw new BadRequestException('Нома фиристода нашуд. Почтаро санҷед ё баъдтар кӯшиш кунед.');
        }
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const message = 'Агар чунин ҳисоб бошад, дастур ба почтаи шумо фиристода шуд';

        const key = UsersService.normEmail(email);
        if (this.isThrottled(key)) {
            return { message };
        }

        const created = await this.usersService.createPasswordResetCode(email);
        if (!created) return { message };

        this.markSent(key);

        try {
            await this.mailService.sendPasswordResetCode(created.user.email, created.code, created.user.name);
        } catch (err) {
            this.logger.error(`Нома ба ${created.user.email} нарафт: ${err.message}`);
        }

        return { message };
    }

    async resetPassword(email: string, code: string, password: string): Promise<{ message: string }> {
        const result = await this.usersService.resetPasswordWithCode(email, code, password);

        if (result === 'expired') {
            throw new BadRequestException('Мӯҳлати код гузаштааст. Коди навро дархост кунед.');
        }
        if (result === 'too_many_attempts') {
            throw new BadRequestException('Кӯшишҳо аз ҳад зиёд шуданд. Коди навро дархост кунед.');
        }
        if (result === 'invalid') {
            throw new BadRequestException('Код нодуруст аст. Онро аз нома санҷед.');
        }

        this.clearLoginFails([`e:${UsersService.normEmail(email)}`]);
        return { message: 'Парол иваз шуд. Акнун бо пароли нав ворид шавед.' };
    }

    async googleLogin(idToken: string) {
        if (!idToken) {
            throw new BadRequestException('Google id token is required');
        }

        const clientIds = this.getGoogleClientIds();
        if (clientIds.length === 0) {
            throw new BadRequestException('Google auth is not configured on the server');
        }

        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: clientIds,
        }).catch(() => null);

        const payload = ticket?.getPayload();
        if (!payload?.email || payload.email_verified === false) {
            throw new UnauthorizedException('Google account could not be verified');
        }

        const user = await this.usersService.findOrCreateGoogleUser({
            email: payload.email,
            name: payload.name,
            avatarUrl: payload.picture,
        });

        return this.login(user);
    }

    private isThrottled(email: string): boolean {
        const last = this.recentResets.get(email);
        return last !== undefined && Date.now() - last < RESET_THROTTLE_MS;
    }

    private markSent(email: string): void {
        const now = Date.now();
        for (const [key, at] of this.recentResets) {
            if (now - at >= RESET_THROTTLE_MS) this.recentResets.delete(key);
        }
        this.recentResets.set(email, now);
    }

    private getGoogleClientIds(): string[] {
        const raw =
            this.configService.get<string>('GOOGLE_CLIENT_IDS') ||
            this.configService.get<string>('GOOGLE_CLIENT_ID') ||
            '';

        return raw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
}
