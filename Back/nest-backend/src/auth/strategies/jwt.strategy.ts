import { ExtractJwt, Strategy } from 'passport-jwt';
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
            secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKey', // Fallback for dev
        });
    }

    async validate(payload: any) {
        /* Ҳар дархости воридшуда аз ин ҷо мегузарад — ҷои табиии қайд кардани
           он, ки корбар зинда аст. Худи навиштан дар хидмат маҳдуд карда
           шудааст (як бор дар 2 дақиқа), ва мо натиҷаро интизор намешавем:
           агар навиштан ноком шавад, дархост бояд ҳамон тавр иҷро гардад. */
        void this.usersService.touchLastSeen(payload.sub);
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}
