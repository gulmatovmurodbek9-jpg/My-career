import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Career } from '../career/career.entity';

export enum AppointmentType {
    AI = 'AI',
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
}

export enum ContactMethod {
    WHATSAPP = 'whatsapp',
    TELEGRAM = 'telegram',
    VIBER = 'viber',
}

export enum AppointmentStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: AppointmentType })
    type: AppointmentType;

    @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.PENDING })
    status: AppointmentStatus;

    @ManyToOne(() => User, (user) => user.appointments)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => User, (user) => user.specialistAppointments, { nullable: true })
    @JoinColumn({ name: 'specialist_id' })
    specialist: User;

    @Column({ nullable: true })
    specialistId: string;

    @ManyToOne(() => Career, { nullable: true })
    @JoinColumn({ name: 'career_id' })
    career: Career;

    @Column({ nullable: true })
    careerId: string;

    // Contact info (for Online/Offline types)
    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phoneNumber: string;

    // For Online: preferred contact channel
    @Column({ type: 'enum', enum: ContactMethod, nullable: true })
    contactMethod: ContactMethod;

    // For Online/Offline: appointment date and time
    @Column({ type: 'timestamp', nullable: true })
    appointmentDate: Date;

    @Column({ type: 'time', nullable: true })
    appointmentTime: string;

    // For Offline: location
    @Column({ nullable: true })
    location: string;

    // Queue position
    @Column({ default: 0 })
    queuePosition: number;

    // Notes/description
    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'int', nullable: true })
    rating: number;

    @Column({ type: 'text', nullable: true })
    ratingComment: string;

    @Column({ type: 'timestamp', nullable: true })
    ratedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
