import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './university.entity';

@Injectable()
export class UniversityService {
    constructor(
        @InjectRepository(University)
        private readonly universityRepo: Repository<University>,
    ) {}

    async findAll() {
        const universities = await this.universityRepo.find({
            relations: ['careers'],
        });

        return universities
            .map(uni => ({
                id: uni.id,
                name: uni.name,
                shortName: uni.shortName,
                city: uni.city,
                region: uni.region,
                isState: uni.isState,
                institutionType: uni.institutionType,
                website: uni.website,
                logo: uni.logo,
                description: uni.description,
                latitude: uni.latitude,
                longitude: uni.longitude,
                careerCount: uni.careers?.length || 0
            }))
            .sort((a, b) => b.careerCount - a.careerCount);
    }

    /** Distinct cities with how many institutions each has — used for the filter dropdown. */
    async findCities() {
        const rows = await this.universityRepo
            .createQueryBuilder('uni')
            .select('uni.city', 'city')
            .addSelect('uni.region', 'region')
            .addSelect('COUNT(*)', 'count')
            .where('uni.city IS NOT NULL')
            .groupBy('uni.city')
            .addGroupBy('uni.region')
            .orderBy('COUNT(*)', 'DESC')
            .getRawMany();

        return rows.map((row) => ({
            city: row.city,
            region: row.region,
            count: Number(row.count),
        }));
    }

    async findOne(id: string) {
        const uni = await this.universityRepo.findOne({
            where: { id },
            relations: ['careers', 'careers.cluster'],
        });
        if (!uni) throw new NotFoundException('University not found');
        return uni;
    }

    async findSpecialties(id: string) {
        const uni = await this.universityRepo.findOne({
            where: { id },
            relations: ['careers', 'careers.cluster'],
        });
        if (!uni) throw new NotFoundException('University not found');
        return uni.careers || [];
    }
}
