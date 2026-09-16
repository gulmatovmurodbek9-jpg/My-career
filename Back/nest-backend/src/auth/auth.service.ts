import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { MailService } from '../mail/mail.service';

const RESET_THROTTLE_MS = 60 * 1000;

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    private readonly recentResets = new Map<string, number>();

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

    async register(createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return this.login(user);
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const message = 'Агар чунин ҳисоб бошад, дастур ба почтаи шумо фиристода шуд';

        const key = email.trim().toLowerCase();
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
