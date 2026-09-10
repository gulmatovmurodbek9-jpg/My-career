import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: 'yusuf@gmail.com' })
    @IsEmail({}, { message: 'Имейл нодуруст аст' })
    email: string;

    @ApiProperty({ example: '482915', description: 'Коди 6-рақамаи аз нома' })
    @IsString()
    @Matches(/^\d{6}$/, { message: 'Код бояд 6 рақам бошад' })
    code: string;

    @ApiProperty({ example: 'pareli-nav-123' })
    @IsString()
    @MinLength(6, { message: 'Парол бояд на кам аз 6 аломат бошад' })
    password: string;
}
