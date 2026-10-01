import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyEmailDto {
    @ApiProperty({ example: 'nom@gmail.com' })
    @IsEmail({}, { message: 'Почта нодуруст аст' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @Matches(/^\d{6}$/, { message: 'Код бояд 6 рақам бошад' })
    @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value))
    code: string;
}

export class ResendCodeDto {
    @ApiProperty({ example: 'nom@gmail.com' })
    @IsEmail({}, { message: 'Почта нодуруст аст' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    email: string;
}
