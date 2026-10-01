import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail({}, { message: 'Почта нодуруст аст' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'Парол бояд на камтар аз 6 аломат бошад' })
    password: string;

    // «Ному насаб» аз формаи бақайдгирӣ. Пештар дар DTO набуд ва whitelist онро мепартофт.
    @IsOptional()
    @IsString()
    @MaxLength(80, { message: 'Ном аз 80 ҳарф зиёд набошад' })
    name?: string;
}
