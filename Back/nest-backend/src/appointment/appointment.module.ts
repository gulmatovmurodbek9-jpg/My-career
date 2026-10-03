import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from './appointment.service';
import { Appointment } from './appointment.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment, User])],
    providers: [AppointmentService],
    // Машваратҳо хомӯшанд (фронтенд онҳоро равона мекунад). Эндпоинтҳо низ хомӯш —
    // коди истифоданашаванда ҳадафи ҳамла набошад (пештар IDOR дар PATCH :id/status буд).
    controllers: [],
    exports: [AppointmentService],
})
export class AppointmentModule { }
