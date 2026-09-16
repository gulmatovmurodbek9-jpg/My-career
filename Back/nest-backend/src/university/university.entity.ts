import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, OneToMany, Index } from 'typeorm';
import { Career } from '../career/career.entity';
import { CareerOffering } from '../career/career-offering.entity';

@Entity('universities')
export class University {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    shortName: string;

    @Column({ nullable: true })
    @Index()
    city: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    region: string;

    @Column({ default: true })
    isState: boolean;

    @Column({ nullable: true })
    institutionType: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ nullable: true })
    website: string;

    @Column({ nullable: true })
    logo: string;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Column({ default: false })
    hasExactLocation: boolean;

    @ManyToMany(() => Career, career => career.universities)
    careers: Career[];

    @OneToMany(() => CareerOffering, (offering) => offering.university)
    offerings: CareerOffering[];

    @Column({ type: 'jsonb', default: {} })
    translations: Record<string, Record<string, any>>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
