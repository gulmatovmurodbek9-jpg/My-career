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

    findAll(): Promise<Cluster[]> {
        return this.clusterRepository.find({ relations: ['careers'] });
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
