import { Injectable } from '@nestjs/common';
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

    /**
     * Кластерҳо бо ШУМОРАИ ихтисосҳо, на бо худи ихтисосҳо.
     *
     * Пештар relations: ['careers'] ҳамаи 884 ихтисосро бо тавсиф, роҳнамо ва
     * тарҷумаҳо мефиристод — 10 МБ (1.4 МБ gzip, ~2.6 сония). Саҳифаи асосӣ,
     * ихтисосҳо ва админ аз он танҳо `careers.length`-ро мегирифтанд.
     */
    findAll(): Promise<Cluster[]> {
        return this.clusterRepository
            .createQueryBuilder('cluster')
            .loadRelationCountAndMap('cluster.careerCount', 'cluster.careers')
            .orderBy('cluster.clusterId', 'ASC')
            .getMany();
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
