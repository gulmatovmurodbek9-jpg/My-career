import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, Between } from 'typeorm';
import { Appointment, AppointmentType, AppointmentStatus } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RateAppointmentDto } from './dto/rate-appointment.dto';
import { User, UserRole } from '../users/user.entity';

const ACTIVE_STATUSES = [AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS, AppointmentStatus.CONFIRMED];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const normalizeTime = (time?: string | null): string | null => {
    if (!time) return null;
    const [hours, minutes] = String(time).split(':');
    if (!hours || !minutes) return String(time);
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

const getDateRange = (date: string | Date): { start: Date; end: Date } => {
    const value = date instanceof Date ? date.toISOString().slice(0, 10) : date;
    const [year, month, day] = value.split('-').map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { start, end };
};

@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepo: Repository<Appointment>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async create(userId: string, dto: CreateAppointmentDto): Promise<Appointment> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Корбар ёфт нашуд');

        let specialist: User | null = null;
        if (dto.type !== AppointmentType.AI) {
            if (!dto.specialistId) throw new BadRequestException('Мутахассисро интихоб кунед');
            specialist = await this.userRepo.findOne({
                where: { id: dto.specialistId, role: UserRole.SPECIALIST, isActive: true },
            });
            if (!specialist) throw new NotFoundException('Мутахассис ёфт нашуд');
        }

        this.validateRequiredFields(dto);

        const normalizedAppointmentTime = normalizeTime(dto.appointmentTime);

        if (specialist && dto.appointmentDate && normalizedAppointmentTime) {
            const availability = await this.getSpecialistAvailability(specialist.id, dto.appointmentDate);
            const selectedSlot = availability.slots.find((slot) => slot.time === normalizedAppointmentTime);
            if (!selectedSlot || !selectedSlot.available) {
                throw new BadRequestException('Ин вақт дигар озод нест. Лутфан вақти дигарро интихоб кунед');
            }

            const { start, end } = getDateRange(dto.appointmentDate);
            const sameDayAppointments = await this.appointmentRepo.find({
                where: {
                    specialistId: specialist.id,
                    appointmentDate: Between(start, end),
                    status: In(ACTIVE_STATUSES),
                },
                select: ['appointmentTime'],
            });
            const isAlreadyBooked = sameDayAppointments.some(
                (appointment) => normalizeTime(appointment.appointmentTime) === normalizedAppointmentTime,
            );
            if (isAlreadyBooked) {
                throw new BadRequestException('Ин вақт аллакай брон шудааст. Лутфан вақти дигарро интихоб кунед');
            }
        }

        const queueCount = await this.appointmentRepo.count({
            where: {
                type: dto.type,
                specialistId: dto.specialistId || null,
                status: In([AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS]),
            },
        });

        const appointment = this.appointmentRepo.create({
            ...dto,
            user,
            userId,
            specialist: specialist || null,
            specialistId: specialist?.id || null,
            email: dto.email || user.email,
            phoneNumber: dto.phoneNumber || null,
            contactMethod: dto.contactMethod || null,
            appointmentDate: dto.appointmentDate ? getDateRange(dto.appointmentDate).start : null,
            appointmentTime: normalizedAppointmentTime,
            queuePosition: dto.type === AppointmentType.AI ? 0 : queueCount + 1,
        });

        return this.appointmentRepo.save(appointment);
    }

    async getSpecialistAvailability(specialistId: string, date: string) {
        const specialist = await this.userRepo.findOne({
            where: { id: specialistId, role: UserRole.SPECIALIST, isActive: true },
        });
        if (!specialist) throw new NotFoundException('Мутахассис ёфт нашуд');

        const parsedDate = new Date(`${date}T00:00:00`);
        if (Number.isNaN(parsedDate.getTime())) throw new BadRequestException('Сана нодуруст аст');

        const dayKey = DAY_KEYS[parsedDate.getDay()];
        const weeklyAvailability = specialist.weeklyAvailability || {};
        const daySlots = weeklyAvailability[dayKey] || [];
        const { start, end } = getDateRange(date);

        const appointments = await this.appointmentRepo.find({
            where: {
                specialistId,
                appointmentDate: Between(start, end),
                status: In(ACTIVE_STATUSES),
            },
        });
        const busyTimes = new Set(appointments.map((appointment) => normalizeTime(appointment.appointmentTime)));

        return {
            specialistId,
            date,
            dayKey,
            slots: daySlots.map((time) => {
                const normalizedTime = normalizeTime(time);
                return {
                    time: normalizedTime,
                    available: !busyTimes.has(normalizedTime),
                };
            }),
        };
    }

    async getUserAppointments(userId: string): Promise<Appointment[]> {
        return this.appointmentRepo.find({
            where: { userId },
            relations: ['career', 'user', 'specialist'],
            order: { createdAt: 'DESC' },
        });
    }

    async getSpecialistAppointments(specialistId: string): Promise<Appointment[]> {
        return this.appointmentRepo.find({
            where: { specialistId },
            relations: ['career', 'user', 'specialist'],
            order: { appointmentDate: 'ASC', appointmentTime: 'ASC', createdAt: 'DESC' },
        });
    }

    async getById(id: string): Promise<Appointment> {
        const appointment = await this.appointmentRepo.findOne({
            where: { id },
            relations: ['career', 'user', 'specialist'],
        });
        if (!appointment) throw new NotFoundException('Дархост ёфт нашуд');
        return appointment;
    }

    async getAll(type?: AppointmentType, status?: AppointmentStatus): Promise<Appointment[]> {
        const query = this.appointmentRepo.createQueryBuilder('appointment');

        if (type) query.where('appointment.type = :type', { type });
        if (status) query.andWhere('appointment.status = :status', { status });

        query.leftJoinAndSelect('appointment.user', 'user');
        query.leftJoinAndSelect('appointment.specialist', 'specialist');
        query.leftJoinAndSelect('appointment.career', 'career');
        query.orderBy('appointment.appointmentDate', 'ASC');
        query.addOrderBy('appointment.appointmentTime', 'ASC');
        query.addOrderBy('appointment.queuePosition', 'ASC');

        return query.getMany();
    }

    async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
        const appointment = await this.getById(id);
        const oldStatus = appointment.status;
        appointment.status = status;
        const saved = await this.appointmentRepo.save(appointment);

        if (
            [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(status) &&
            oldStatus !== status
        ) {
            await this.reorderQueue(appointment.type, appointment.specialistId);
        }

        return saved;
    }

    async cancel(id: string): Promise<Appointment> {
        const appointment = await this.getById(id);
        appointment.status = AppointmentStatus.CANCELLED;
        await this.reorderQueue(appointment.type, appointment.specialistId);
        return this.appointmentRepo.save(appointment);
    }

    async rate(id: string, userId: string, dto: RateAppointmentDto): Promise<Appointment> {
        const appointment = await this.getById(id);
        if (appointment.userId !== userId) {
            throw new ForbiddenException('Шумо танҳо дархости худро рейтинг дода метавонед');
        }
        if (appointment.status !== AppointmentStatus.COMPLETED) {
            throw new BadRequestException('Рейтинг танҳо баъди анҷоми машварат имкон дорад');
        }
        if (!appointment.specialistId) {
            throw new BadRequestException('Ин дархост мутахассис надорад');
        }

        appointment.rating = dto.rating;
        appointment.ratingComment = dto.comment || null;
        appointment.ratedAt = new Date();
        const saved = await this.appointmentRepo.save(appointment);

        await this.recalculateSpecialistRating(appointment.specialistId);
        return saved;
    }

    async getQueueStats(type: AppointmentType) {
        const pending = await this.appointmentRepo.count({ where: { type, status: AppointmentStatus.PENDING } });
        const confirmed = await this.appointmentRepo.count({ where: { type, status: AppointmentStatus.CONFIRMED } });
        const completed = await this.appointmentRepo.count({ where: { type, status: AppointmentStatus.COMPLETED } });

        return {
            type,
            pending,
            confirmed,
            completed,
            estimatedWaitMinutes: Math.ceil(pending * 30),
        };
    }

    private validateRequiredFields(dto: CreateAppointmentDto) {
        if (dto.type === AppointmentType.AI) return;

        if (!dto.email || !dto.phoneNumber) {
            throw new BadRequestException('Email ва рақами телефон зарур аст');
        }

        if (!dto.appointmentDate || !dto.appointmentTime) {
            throw new BadRequestException('Сана ва вақтро интихоб кунед');
        }

        if (dto.type === AppointmentType.OFFLINE && !dto.location) {
            throw new BadRequestException('Ҷои вохӯриро интихоб кунед');
        }
    }

    private async reorderQueue(type: AppointmentType, specialistId?: string): Promise<void> {
        const pending = await this.appointmentRepo.find({
            where: {
                type,
                specialistId: specialistId || null,
                status: In([AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS]),
            },
            order: { createdAt: 'ASC' },
        });

        for (let i = 0; i < pending.length; i++) {
            pending[i].queuePosition = i + 1;
            await this.appointmentRepo.save(pending[i]);
        }
    }

    private async recalculateSpecialistRating(specialistId: string): Promise<void> {
        const ratings = await this.appointmentRepo.find({
            where: { specialistId, rating: Not(null) },
            select: ['rating'],
        });

        const ratingCount = ratings.length;
        const ratingAverage = ratingCount
            ? Number((ratings.reduce((sum, item) => sum + item.rating, 0) / ratingCount).toFixed(2))
            : 0;

        await this.userRepo.update(specialistId, { ratingAverage, ratingCount });
    }
}
