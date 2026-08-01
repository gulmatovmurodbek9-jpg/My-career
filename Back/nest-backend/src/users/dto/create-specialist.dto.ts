import { IsBoolean, IsEmail, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSpecialistDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    specialization?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    meetingLocation?: string;

    @IsOptional()
    @IsObject()
    weeklyAvailability?: Record<string, string[]>;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
