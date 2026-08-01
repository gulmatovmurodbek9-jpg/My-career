import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Career } from '../career/career.entity';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    SPECIALIST = 'specialist',
}

export interface ChatMessage {
    question: string;
    answer: string;
    careerName?: string;
    createdAt: string;
}

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column('jsonb', { nullable: true })
    quizResults: {
        mmtClusters: {
            c1: number;
            c2: number;
            c3: number;
            c4: number;
            c5: number;
        };
        cognitive: Record<string, number>;
        motivation: Record<string, any>;
    };

    @Column('jsonb', { nullable: true, default: [] })
    chatHistory: ChatMessage[];

    @Column('jsonb', { nullable: true, default: () => '\'{"date": null, "count": 0}\'' })
    aiDailyUsage: { date: string | null; count: number };

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    specialization: string;

    @Column('text', { nullable: true })
    bio: string;

    @Column({ nullable: true })
    avatarUrl: string;

    @Column({ nullable: true })
    meetingLocation: string;

    @Column('jsonb', { nullable: true })
    weeklyAvailability: Record<string, string[]>;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
    ratingAverage: number;

    @Column({ type: 'int', default: 0 })
    ratingCount: number;

    @ManyToMany(() => Career, (career) => career.savedByUsers)
    @JoinTable({ name: 'user_saved_careers' })
    savedCareers: Career[];

    @ManyToMany(() => Career, (career) => career.likedByUsers)
    @JoinTable({ name: 'user_liked_careers' })
    likedCareers: Career[];

    @OneToMany('Appointment', 'user')
    appointments: any[];

    @OneToMany('Appointment', 'specialist')
    specialistAppointments: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
