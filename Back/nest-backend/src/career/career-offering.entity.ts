import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Career } from './career.entity';
import { University } from '../university/university.entity';

@Entity('career_offerings')
@Index(['careerId', 'universityId', 'studyForm', 'paymentType'])
export class CareerOffering {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Career, (career) => career.offerings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'careerId' })
    career: Career;

    @Column()
    @Index()
    careerId: string;

    @ManyToOne(() => University, (university) => university.offerings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'universityId' })
    university: University;

    @Column()
    @Index()
    universityId: string;

    @Column({ default: 'рӯзона' })
    studyForm: string;

    @Column({ default: 'пулакӣ' })
    paymentType: string;

    @Column({ type: 'int', nullable: true })
    tuitionFee: number | null;

    @Column({ default: 'тоҷикӣ' })
    language: string;

    @Column({ type: 'int', default: 0 })
    seats: number;

    @Column({ type: 'int', default: 11 })
    basedOn: number;
}
