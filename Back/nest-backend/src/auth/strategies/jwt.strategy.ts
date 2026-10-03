import { ExtractJwt, Strategy } from 'passport-jwt';
import { requireJwtSecret } from '../auth.module';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: requireJwtSecret(configService.get<string>('JWT_SECRET')),
        });
    }

    // Ҳар дархости бо токен аз ин ҷо мегузарад: аз токен id, email ва нақш гирифта мешавад.
    async validate(payload: any) {
        void this.usersService.touchLastSeen(payload.sub);
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}
