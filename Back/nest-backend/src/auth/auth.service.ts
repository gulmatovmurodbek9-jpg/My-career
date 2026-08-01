import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user?.password && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };

        // Fetch full user with relations so frontend knows which careers are liked/saved
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
