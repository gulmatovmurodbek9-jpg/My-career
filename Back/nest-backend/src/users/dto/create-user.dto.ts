import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    // «Ному насаб» аз формаи бақайдгирӣ. Пештар дар DTO набуд ва whitelist онро мепартофт.
    @IsOptional()
    @IsString()
    @MaxLength(80)
    name?: string;
}
