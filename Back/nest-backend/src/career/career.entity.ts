import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable, Index } from 'typeorm';
import { Cluster } from '../cluster/cluster.entity';
import { User } from '../users/user.entity';
import { University } from '../university/university.entity';
import { CareerOffering } from './career-offering.entity';

@Entity()
export class Career {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    @Index()
    code: string;

    @Column({ type: 'text', nullable: true, select: false, insert: false, update: false })
    codeSort: string;

    @Column()
    name: string;

    @Column({ type: 'jsonb', default: {} })
    translations: Record<string, Record<string, any>>;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    purpose: string;

    @Column('jsonb', { nullable: true })
    skills: {
        technical: string[];
        soft: string[];
    };

    @Column('simple-array', { nullable: true })
    technologies: string[];

    @Column('jsonb', { nullable: true })
    roadmap: string[];

    @Column('simple-array', { nullable: true })
    projectsExamples: string[];

    @Column('jsonb', { nullable: true })
    learningResources: {
        books: string[];
        courses: string[];
        blogs: string[];
    };

    @Column('simple-array', { nullable: true })
    careerOpportunities: string[];

    @Column('jsonb', { nullable: true })
    salaryAndMarket: {
        junior: string;
        mid: string;
        senior: string;
    };

    @Column('simple-array', { nullable: true })
    relatedSpecializations: string[];

    @Column({ type: 'text', nullable: true })
    advice: string;

    @Column('simple-array', { nullable: true })
    certification: string[];

    @ManyToMany(() => University, (uni) => uni.careers, { cascade: true })
    // Алоқаи бисёр-ба-бисёр: як ихтисос дар чанд донишгоҳ, як донишгоҳ чанд ихтисос.
    @JoinTable({ name: 'career_universities' })
    universities: University[];


    @Column({ type: 'int', nullable: true })
    tuitionFee: number;

    @Column({ type: 'int', nullable: true })
    minTuitionFee: number;

    @Column({ type: 'int', nullable: true })
    maxTuitionFee: number;

    @Column({ default: false })
    hasFreeSeats: boolean;

    @Column({ default: false })
    contentWritten: boolean;

    @OneToMany(() => CareerOffering, (offering) => offering.career)
    offerings: CareerOffering[];

    @Column({ nullable: true })
    mmtCluster: number;

    @Column({ type: 'int', default: 4 })
    durationYears: number;

    @Column({ default: 'Бакалавр' })
    degreeType: string;

    @Column({ default: 0 })
    likesCount: number;

    @ManyToMany(() => User, (user) => user.likedCareers)
    likedByUsers: User[];

    @ManyToMany(() => User, (user) => user.savedCareers)
    savedByUsers: User[];


    @ManyToOne(() => Cluster, (cluster) => cluster.careers, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'clusterId' })
    cluster: Cluster;

    @Column({ nullable: true })
    clusterId: string;
}
