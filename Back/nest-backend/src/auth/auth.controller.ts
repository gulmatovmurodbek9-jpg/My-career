import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Success' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Имейл ё рамз нодуруст аст');
        }
        return this.authService.login(user);
    }

    @Post('signin')
    @ApiOperation({ summary: 'Login user (alternative)' })
    async signin(@Body() loginDto: LoginDto) {
        return this.login(loginDto);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
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
