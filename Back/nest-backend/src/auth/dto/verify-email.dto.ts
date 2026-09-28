import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';

export class VerifyEmailDto {
    @ApiProperty({ example: 'nom@gmail.com' })
    @IsEmail({}, { message: 'Почта нодуруст аст' })
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @Matches(/^\d{6}$/, { message: 'Код бояд 6 рақам бошад' })
    code: string;
}

export class ResendCodeDto {
    @ApiProperty({ example: 'nom@gmail.com' })
    @IsEmail({}, { message: 'Почта нодуруст аст' })
    email: string;
}
