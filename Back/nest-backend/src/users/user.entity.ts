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

    /*
     * Барқарорсозии парол бо коди 6-рақама. Худи код нигоҳ дошта намешавад —
     * танҳо hash-и он, то дуздидани база имкони иваз кардани паролро надиҳад.
     */
    @Column({ nullable: true, select: false })
    resetTokenHash: string | null;

    @Column({ type: 'timestamptz', nullable: true, select: false })
    resetTokenExpiresAt: Date | null;

    /*
     * Шумораи кӯшишҳои нодуруст. Коди 6-рақама ҳамагӣ як миллион вариант
     * дорад — бе ин ҳисоб онро бо барнома дар чанд дақиқа ёфтан мумкин аст.
     */
    @Column({ type: 'int', default: 0, select: false })
    resetAttempts: number;

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

    /*
     * Рӯйхати ҳуҷҷатсупорӣ — id-ҳои `career_offerings`.
     *
     * Як «пешниҳод» аллакай ихтисос + донишгоҳ + шакли таҳсил + буҷа/шартнома
     * -ро дар як сатр мебандад, аз ин рӯ маҳз ҳамон интихоби воқеии довталаб
     * аст. Нигоҳ доштани танҳо id кофист: боқимонда ҳангоми хондан аз база
     * гирифта мешавад ва ҳамеша тоза мемонад.
     */
    @Column('jsonb', { nullable: true, default: [] })
    applicationChoices: string[];

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

    /* Охирин лаҳзае, ки корбар дархости воридшуда фиристод. Аз updatedAt
       фарқ мекунад: updatedAt танҳо ҳангоми навиштан дигар мешавад, вале
       корбаре, ки танҳо ихтисосҳоро мехонад, ҳеҷ чиз намениависад. */
    @Column({ type: 'timestamptz', nullable: true })
    lastSeenAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
