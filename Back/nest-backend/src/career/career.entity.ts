import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable, Index } from 'typeorm';
import { Cluster } from '../cluster/cluster.entity';
import { User } from '../users/user.entity';
import { University } from '../university/university.entity';
import { CareerOffering } from './career-offering.entity';

@Entity()
export class Career {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Official NTC specialty code, e.g. "131030408". */
    @Column({ unique: true, nullable: true })
    @Index()
    code: string;

    @Column()
    name: string;

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
    @JoinTable({ name: 'career_universities' })
    universities: University[];

    // === NEW FIELDS ===

    /** Cheapest paid tuition across all universities. Kept in sync with minTuitionFee. */
    @Column({ type: 'int', nullable: true })
    tuitionFee: number;

    @Column({ type: 'int', nullable: true })
    minTuitionFee: number;

    @Column({ type: 'int', nullable: true })
    maxTuitionFee: number;

    /** True when at least one university offers a state-funded (ройгон) seat. */
    @Column({ default: false })
    hasFreeSeats: boolean;

    /** False while the specialty still carries generated placeholder content. */
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

    // === RELATIONS ===

    @ManyToOne(() => Cluster, (cluster) => cluster.careers, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'clusterId' })
    cluster: Cluster;

    @Column({ nullable: true })
    clusterId: string;
}
