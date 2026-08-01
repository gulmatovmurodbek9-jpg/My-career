import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Career } from '../career/career.entity';

@Entity()
export class Cluster {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    clusterName: string;

    @Column()
    clusterIcon: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    purpose: string;

    @Column({ nullable: true })
    clusterId: number;

    @OneToMany(() => Career, (career) => career.cluster)
    careers: Career[];
}
