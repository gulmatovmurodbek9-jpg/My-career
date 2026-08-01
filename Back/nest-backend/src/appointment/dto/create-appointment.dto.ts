import { IsEnum, IsOptional, IsEmail, IsString } from 'class-validator';
import { AppointmentType, ContactMethod } from '../appointment.entity';

export class CreateAppointmentDto {
    @IsEnum(AppointmentType)
    type: AppointmentType;

    @IsOptional()
    @IsString()
    careerId?: string;

    @IsOptional()
    @IsString()
    specialistId?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsEnum(ContactMethod)
    contactMethod?: ContactMethod;

    @IsOptional()
    @IsString()
    appointmentDate?: string;

    @IsOptional()
    @IsString()
    appointmentTime?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
