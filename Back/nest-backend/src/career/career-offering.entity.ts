import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Career } from './career.entity';
import { University } from '../university/university.entity';

/**
 * One row of the official admission table: a specific university offering a
 * specific specialty under a specific study form. Tuition, language and seat
 * count differ per row, which is why this cannot live on Career or University.
 */
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

    /** рӯзона | фосилавӣ | ғоибона | шабона */
    @Column({ default: 'рӯзона' })
    studyForm: string;

    /** пулакӣ | ройгон */
    @Column({ default: 'пулакӣ' })
    paymentType: string;

    /** Somoni per year. Null for state-funded (ройгон) seats. */
    @Column({ type: 'int', nullable: true })
    tuitionFee: number | null;

    /** Language of instruction, e.g. "тоҷикӣ, русӣ". */
    @Column({ default: 'тоҷикӣ' })
    language: string;

    @Column({ type: 'int', default: 0 })
    seats: number;

    /** School grades completed before admission: 9 or 11. */
    @Column({ type: 'int', default: 11 })
    basedOn: number;
}
