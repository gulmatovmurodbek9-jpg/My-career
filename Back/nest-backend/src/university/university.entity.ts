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

    /** Region/oblast the city belongs to, e.g. "Суғд", "Хатлон". */
    @Column({ nullable: true })
    region: string;

    /** true for давлатӣ, false for ғайридавлатӣ (private). */
    @Column({ default: true })
    isState: boolean;

    /** Донишгоҳ | Донишкада | Коллеҷ | Академия | Филиал */
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

    @ManyToMany(() => Career, career => career.universities)
    careers: Career[];

    @OneToMany(() => CareerOffering, (offering) => offering.university)
    offerings: CareerOffering[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
