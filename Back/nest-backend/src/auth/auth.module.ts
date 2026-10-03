import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';

export function requireJwtSecret(secret?: string): string {
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET дар .env нест ё кӯтоҳ аст (камаш 16 аломат) — сервер бе он оғоз намешавад.');
  }
  return secret;
}

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // Калиди пешфарз нест: агар JWT_SECRET гум шавад, ҳар кас токени админ месохт.
        secret: requireJwtSecret(configService.get<string>('JWT_SECRET')),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
