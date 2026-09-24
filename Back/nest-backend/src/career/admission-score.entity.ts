import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// Балҳои гузариш аз портали расмии Маркази миллии тестӣ (stat.ntc.tj).
// Як сатр = як ихтисос дар як донишгоҳ дар як сол.
@Entity('admission_scores')
@Index(['code', 'year'])
export class AdmissionScore {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    year: number;

    // Коди ихтисоси НМТ — ҳамон коде, ки дар ҷадвали career аст.
    @Column({ type: 'varchar', length: 20 })
    code: string;

    @Column({ type: 'varchar', length: 300 })
    university: string;

    @Column({ type: 'varchar', length: 60, nullable: true })
    studyForm: string | null;

    @Column({ type: 'varchar', length: 60, nullable: true })
    paymentType: string | null;

    @Column({ type: 'int', nullable: true })
    seats: number | null;

    // Довталаб ба як ҷой.
    @Column({ type: 'real', nullable: true })
    competition: number | null;

    // Бали гузариш — пас аз тақсимот муайян мешавад.
    @Column({ type: 'real', nullable: true })
    score: number | null;
}
