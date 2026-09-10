import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'yusuf@gmail.com' })
    @IsEmail({}, { message: 'Имейл нодуруст аст' })
    email: string;
}
