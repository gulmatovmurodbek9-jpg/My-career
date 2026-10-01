import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: 'yusuf@gmail.com' })
    @IsEmail({}, { message: 'Имейл нодуруст аст' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    email: string;

    @ApiProperty({ example: '482915', description: 'Коди 6-рақамаи аз нома' })
    @IsString()
    @Matches(/^\d{6}$/, { message: 'Код бояд 6 рақам бошад' })
    @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value))
    code: string;

    @ApiProperty({ example: 'pareli-nav-123' })
    @IsString()
    @MinLength(6, { message: 'Парол бояд на кам аз 6 аломат бошад' })
    password: string;
}
