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
        const universities = await this.universityRepo
            .createQueryBuilder('uni')
            .loadRelationCountAndMap('uni.careerCount', 'uni.careers')
            .getMany();

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
                careerCount: (uni as any).careerCount || 0
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
        const uni = await this.universityRepo
            .createQueryBuilder('uni')
            .where('uni.id = :id', { id })
            .loadRelationCountAndMap('uni.careerCount', 'uni.careers')
            .getOne();
        if (!uni) throw new NotFoundException('University not found');
        return localizeUniversity(uni as any, lang);
    }

    async findSpecialties(id: string, lang?: string) {
        const exists = await this.universityRepo.exists({ where: { id } });
        if (!exists) throw new NotFoundException('University not found');

        const careers = await this.universityRepo.manager
            .createQueryBuilder()
            .select(['career.id', 'career.code', 'career.name', 'career.translations'])
            .addSelect(['cluster.id', 'cluster.clusterId', 'cluster.clusterName'])
            .from('career', 'career')
            .innerJoin('career_universities', 'cu', 'cu."careerId" = career.id AND cu."universitiesId" = :id', { id })
            .leftJoin('cluster', 'cluster', 'cluster.id = career."clusterId"')
            .getRawMany();

        const useLang = lang && lang !== 'tj' ? lang : null;
        return careers.map((row) => {
            const tr = useLang ? row.career_translations?.[useLang] : null;
            return {
                id: row.career_id,
                code: row.career_code,
                name: tr?.name || row.career_name,
                nameOriginal: row.career_name,
                cluster: row.cluster_id
                    ? { id: row.cluster_id, clusterId: row.cluster_clusterId, clusterName: row.cluster_clusterName }
                    : null,
            };
        });
    }
}
