import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Appointment } from './appointment.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment, User])],
    providers: [AppointmentService],
    controllers: [AppointmentController],
    exports: [AppointmentService],
})
export class AppointmentModule { }
