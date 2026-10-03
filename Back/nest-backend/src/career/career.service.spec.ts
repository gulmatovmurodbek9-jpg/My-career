import { CareerService } from './career.service';
import { parseGrade } from '../common/grade';

// Интихоби ихтисосҳо пас аз тест: самт, тартиб ва филтри синф.
const clusters = [1, 2, 3, 4, 5].map((n) => ({ id: `cl${n}`, clusterId: n, clusterName: `Кластер ${n}` }));

const career = (id: string, name: string, extra: any = {}) => ({
    id, name, description: '', purpose: '', skills: { technical: [], soft: [] }, likesCount: 0, ...extra,
});

function build(pool: any[]) {
    const where: string[] = [];
    const qb: any = {
        select: () => qb,
        where: (sql: string, params: any) => { where.push(`${sql} ${JSON.stringify(params)}`); return qb; },
        andWhere: (sql: string, params: any) => { where.push(`${sql} ${JSON.stringify(params)}`); return qb; },
        getMany: async () => pool,
    };
    const careerRepository: any = {
        createQueryBuilder: () => qb,
        find: async ({ where: { id } }: any) => pool.filter((c) => id._value.includes(c.id)).map((c) => ({ ...c, universities: [] })),
    };
    const clusterRepository: any = { find: async () => clusters };
    const service = new CareerService(careerRepository, {} as any, clusterRepository, {} as any, {} as any, {} as any, {} as any);
    return { service, where };
}

describe('CareerService.selectMatchedCareers', () => {
    const scores = (c: Record<string, number>, extra: any = {}) => ({ mmtClusters: { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, ...c }, ...extra });

    it('самти асосӣ — кластери холаш баландтар', async () => {
        const { service } = build([career('a', 'Барномасозӣ')]);
        const result = await service.selectMatchedCareers(scores({ c1: 30, c2: 10 }));
        expect(result.cluster?.clusterId).toBe(1);
        expect(result.matchPercentage).toBe(75);
    });

    it('интихоби корбар дар саволи «баробар» самтро муайян мекунад', async () => {
        const { service } = build([career('a', 'Иқтисод')]);
        const result = await service.selectMatchedCareers(scores({ c1: 25, c2: 24 }, { chosenCluster: 'c2' }));
        expect(result.cluster?.clusterId).toBe(2);
    });

    it('тартиб аз рӯи калимаҳои ҷавобҳо, на аз рӯи лайкҳо', async () => {
        const pool = [
            career('popular', 'Таърих', { likesCount: 999 }),
            career('match', 'Барномасозии компютерӣ', { likesCount: 0 }),
        ];
        const { service } = build(pool);
        const result = await service.selectMatchedCareers(scores({ c1: 30 }, { specialtyKeywords: ['барном'] }));
        expect(result.careers[0].id).toBe('match');
        expect(result.careerReasons.get('match')).toEqual(['барном']);
        expect(result.careerReasons.get('popular')).toEqual([]);
    });

    it('калимаи калидӣ танҳо аз аввали калима («ай» дар «ҳайвон» ҳисоб намешавад)', async () => {
        const { service } = build([career('a', 'Ҳайвонпарварӣ')]);
        const result = await service.selectMatchedCareers(scores({ c5: 30 }, { specialtyKeywords: ['ай'] }));
        expect(result.careerRanks.get('a') ?? 0).toBe(0);
    });

    it('синфи 9: дархост танҳо ихтисосҳои «баъди синфи 9»-ро мегирад', async () => {
        const { service, where } = build([career('a', 'Ҳамширагӣ')]);
        await service.selectMatchedCareers(scores({ c5: 30 }), 9);
        expect(where.some((sql) => sql.includes('"basedOn" = :grade') && sql.includes('"grade":9'))).toBe(true);
    });

    it('бе синф филтр нест', async () => {
        const { service, where } = build([career('a', 'Ҳамширагӣ')]);
        await service.selectMatchedCareers(scores({ c5: 30 }));
        expect(where.some((sql) => sql.includes('basedOn'))).toBe(false);
    });
});

describe('синф ва ёвар', () => {
    it('parseGrade танҳо 9 ва 11 қабул мекунад', () => {
        expect(parseGrade('9')).toBe(9);
        expect(parseGrade(11)).toBe(11);
        expect(parseGrade('10')).toBeNull();
        expect(parseGrade(undefined)).toBeNull();
    });

    it.each([
        ['Я после 9 класса', 9],
        ['Ман синфи 11-ро хатм мекунам', 11],
        ['I finished grade 9', 9],
        ['Покажи университеты', null],
    ])('detectGrade(%s) = %s', (message, expected) => {
        expect(CareerService.detectGrade(message as string)).toBe(expected);
    });

    it.each([
        ['На каком языке проходят занятия?', true],
        ['Дарсҳо бо кадом забон мегузаранд', true],
        ['How many years is the study', true],
        ['Покажи университеты', false],
        ['Ин ихтисосро захира кун', false],
    ])('isQuestion(%s) = %s', (message, expected) => {
        expect(CareerService.isQuestion(message as string)).toBe(expected);
    });
});
