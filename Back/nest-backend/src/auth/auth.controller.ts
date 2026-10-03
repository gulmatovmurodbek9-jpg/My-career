import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendCodeDto, VerifyEmailDto } from './dto/verify-email.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Success' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async login(@Body() loginDto: LoginDto, @Req() req?: Request) {
        // Ҳимоя аз тахмини парол: ҳам барои почта, ҳам барои IP.
        const keys = [`e:${UsersService.normEmail(loginDto.email)}`, `ip:${req?.ip || 'unknown'}`];
        this.authService.assertLoginAllowed(keys);
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            this.authService.recordLoginFail(keys);
            throw new UnauthorizedException('Имейл ё рамз нодуруст аст');
        }
        this.authService.clearLoginFails([keys[0]]);
        await this.authService.assertVerified(user);
        return this.authService.login(user);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Тасдиқи почта бо коди 6-рақама → токен' })
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.email, dto.code);
    }

    @Post('resend-code')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Коди нави тасдиқи почта (як бор дар як дақиқа)' })
    async resendCode(@Body() dto: ResendCodeDto) {
        return this.authService.resendVerifyCode(dto.email);
    }

    @Post('google')
    @ApiOperation({ summary: 'Login or register with Google id token' })
    async google(@Body() body: { idToken: string }) {
        return this.authService.googleLogin(body.idToken);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Фиристодани пайванди барқарорсозии парол ба почта' })
    @ApiResponse({ status: 200, description: 'Ҷавоб ҳамеша якхела — новобаста аз мавҷудияти ҳисоб' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Гузоштани пароли нав аз рӯи коди нома' })
    @ApiResponse({ status: 400, description: 'Код нодуруст, кӯҳна ё кӯшишҳо зиёд' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.email, dto.code, dto.password);
    }
}
