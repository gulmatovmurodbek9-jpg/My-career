import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { University } from './university.entity';

const TRANSLATABLE = ['city', 'region', 'institutionType', 'address', 'description'] as const;

function localizeUniversity<T extends Record<string, any>>(uni: T, lang?: string): T {
    if (!uni || !lang || lang === 'tj') return uni;

    const tr = uni.translations?.[lang];
    if (!tr) return uni;

    const out: any = { ...uni };
    if (tr.name) out.nameTranslated = tr.name;
    for (const field of TRANSLATABLE) {
        if (tr[field]) out[field] = tr[field];
    }
    delete out.translations;
    return out as T;
}

@Injectable()
export class UniversityService {
    constructor(
        @InjectRepository(University)
        private readonly universityRepo: Repository<University>,
    ) {}

    async findAll(lang?: string) {
        const universities = await this.universityRepo.find({
            relations: ['careers'],
        });

        return universities
            .map(uni => localizeUniversity({
                translations: uni.translations,
                id: uni.id,
                name: uni.name,
                shortName: uni.shortName,
                city: uni.city,
                address: uni.address,
                region: uni.region,
                isState: uni.isState,
                institutionType: uni.institutionType,
                website: uni.website,
                logo: uni.logo,
                description: uni.description,
                latitude: uni.latitude,
                longitude: uni.longitude,
                hasExactLocation: uni.hasExactLocation,
                careerCount: uni.careers?.length || 0
            }, lang))
            .sort((a, b) => b.careerCount - a.careerCount);
    }

    async findCities(lang?: string) {
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

        if (!lang || lang === 'tj') {
            return rows.map((row) => ({
                city: row.city,
                region: row.region,
                count: Number(row.count),
            }));
        }

        const all = await this.universityRepo.find({ select: ['city', 'region', 'translations'] });
        const cityNames = new Map<string, string>();
        const regionNames = new Map<string, string>();
        for (const uni of all) {
            const tr = uni.translations?.[lang];
            if (!tr) continue;
            if (uni.city && tr.city) cityNames.set(uni.city, tr.city);
            if (uni.region && tr.region) regionNames.set(uni.region, tr.region);
        }

        return rows.map((row) => ({
            city: cityNames.get(row.city) ?? row.city,
            region: regionNames.get(row.region) ?? row.region,
            count: Number(row.count),
        }));
    }

    async findOne(id: string, lang?: string) {
        const uni = await this.universityRepo.findOne({
            where: { id },
            relations: ['careers', 'careers.cluster'],
        });
        if (!uni) throw new NotFoundException('University not found');
        return localizeUniversity(uni as any, lang);
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
