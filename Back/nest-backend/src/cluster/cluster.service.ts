import { Injectable } from '@nestjs/common';
import { parseGrade } from '../common/grade';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cluster } from './cluster.entity';
import { CreateClusterDto } from './dto/create-cluster.dto';

@Injectable()
export class ClusterService {
    constructor(
        @InjectRepository(Cluster)
        private clusterRepository: Repository<Cluster>,
    ) { }

    async findAll(rawGrade?: string): Promise<Cluster[]> {
        const clusters = await this.clusterRepository
            .createQueryBuilder('cluster')
            .loadRelationCountAndMap('cluster.careerCount', 'cluster.careers')
            .orderBy('cluster.clusterId', 'ASC')
            .getMany();
        // Баъди синфи 9 — шумораи ихтисосҳо низ танҳо барои коллеҷ.
        const grade = parseGrade(rawGrade);
        if (!grade) return clusters;
        const rows: Array<{ clusterId: string; count: string }> = await this.clusterRepository.manager.query(
            `SELECT c."clusterId", count(DISTINCT c.id) AS count FROM career c
             WHERE EXISTS (SELECT 1 FROM career_offerings o WHERE o."careerId" = c.id AND o."basedOn" = $1)
             GROUP BY 1`,
            [grade],
        );
        const counts = new Map(rows.map((row) => [row.clusterId, Number(row.count)]));
        return clusters.map((cluster) => Object.assign(cluster, { careerCount: counts.get(cluster.id) ?? 0 }));
    }

    findOne(id: string): Promise<Cluster | null> {
        return this.clusterRepository.findOne({ where: { id }, relations: ['careers'] });
    }

    async create(dto: CreateClusterDto): Promise<Cluster> {
        const cluster = this.clusterRepository.create(dto);
        return this.clusterRepository.save(cluster);
    }

    async update(id: string, dto: CreateClusterDto): Promise<Cluster> {
        await this.clusterRepository.update(id, dto);
        return this.clusterRepository.findOne({ where: { id }, relations: ['careers'] });
    }

    async delete(id: string): Promise<void> {
        await this.clusterRepository.delete(id);
    }
}
