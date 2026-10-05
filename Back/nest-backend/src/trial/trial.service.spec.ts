import { NotFoundException } from '@nestjs/common';
import { SCENARIOS, TrialService } from './trial.service';
import { FAMILIES, resolveFamily } from './families';

function build(careers: any[] = []) {
    const queries: Array<{ sql: string; params: any[] }> = [];
    const dataSource: any = {
        query: async (sql: string, params: any[] = []) => {
            queries.push({ sql, params });
            return sql.includes('FROM career') ? careers : [];
        },
    };
    return { service: new TrialService(dataSource), queries };
}

describe('«Як рӯз дар ихтисос»: сенарияҳо', () => {
    const langs = ['tj', 'ru', 'en'] as const;

    it.each(Object.values(SCENARIOS).map((s) => [s.family, s]))('%s: се забон, 3 вазифа, ҷавобҳо дар вариантҳо ҳастанд', (_family, scenario: any) => {
        for (const lang of langs) {
            const text = scenario.text[lang];
            expect(text.tasks).toHaveLength(3);
            expect(text.reality.length).toBeGreaterThan(0);
            scenario.keys.forEach((key: any, index: number) => {
                const ids = (text.tasks[index].options || []).map((o: any) => o.id);
                if (key.kind === 'number') {
                    expect(typeof key.answer).toBe('number');
                    return;
                }
                const answers = Array.isArray(key.answer) ? key.answer : [key.answer];
                for (const id of answers) expect(ids).toContain(id);
                if (key.kind === 'order') expect([...ids].sort()).toEqual([...answers].sort());
                // Ҳамаи забонҳо ҳамон вариантҳоро доранд.
                expect(ids.sort()).toEqual((scenario.text.tj.tasks[index].options || []).map((o: any) => o.id).sort());
            });
        }
    });

    it('ҳар сенарияи тайёр дар рӯйхати оилаҳо ҳамчун ready қайд шудааст', () => {
        for (const family of Object.keys(SCENARIOS)) {
            expect(FAMILIES.find((item) => item.id === family)?.ready).toBe(true);
        }
        expect(FAMILIES.filter((item) => item.ready).map((item) => item.id).sort()).toEqual(Object.keys(SCENARIOS).sort());
    });

    it('вазифаи тартиб дар ҳолати аввал ҳалшуда нест (вариантҳо омехтаанд)', () => {
        for (const scenario of Object.values(SCENARIOS)) {
            scenario.keys.forEach((key, index) => {
                if (key.kind !== 'order') return;
                const shown = (scenario.text.tj.tasks[index].options || []).map((o) => o.id);
                expect(TrialService.grade(key, shown).solved).toBe(false);
            });
        }
    });
});

describe('TrialService', () => {
    it('браузер ҷавоби дуруст ва шарҳро намегирад', () => {
        const { service } = build();
        for (const family of Object.keys(SCENARIOS)) {
            const json = JSON.stringify(service.get(family, 'tj'));
            expect(json).not.toMatch(/"feedback"|"answer"|"steps"|"realLife"|"wrongNumbers"|"mustFirst"|"related"/);
        }
    });

    it('сенарияи номавҷуд — 404', () => {
        const { service } = build();
        expect(() => service.get('nope')).toThrow(NotFoundException);
        expect(() => service.check('it', 't9', 'a')).toThrow(NotFoundException);
    });

    it('баҳодиҳӣ: интихоб, якчанд, тартиб, рақам', () => {
        const [it1, it2] = SCENARIOS.it.keys;
        expect(TrialService.grade(it1, 'b').solved).toBe(true);
        expect(TrialService.grade(it1, 'a').solved).toBe(false);
        expect(TrialService.grade(it2, ['a', 'c', 'b'])).toEqual({ solved: true, perfect: true });
        expect(TrialService.grade(it2, ['a', 'b', 'c'])).toEqual({ solved: true, perfect: false });
        expect(TrialService.grade(it2, ['c', 'a', 'b']).solved).toBe(false);

        const law2 = SCENARIOS.law.keys[1];
        expect(TrialService.grade(law2, ['c', 'a']).solved).toBe(true);
        expect(TrialService.grade(law2, ['a', 'c', 'd']).solved).toBe(false);
        expect(TrialService.grade(law2, ['a', 'a']).solved).toBe(false);

        const med2 = SCENARIOS.medicine.keys[1];
        expect(TrialService.grade(med2, '20').solved).toBe(true);
        expect(TrialService.grade(med2, 10).solved).toBe(false);
        expect(TrialService.grade(med2, '').solved).toBe(false);
        expect(TrialService.grade(med2, null).solved).toBe(false);
    });

    it('check шарҳи хатои маъмулро медиҳад', () => {
        const { service } = build();
        const wrong = service.check('medicine', 't2', 10, 'tj');
        expect(wrong.solved).toBe(false);
        expect(wrong.numberFeedback).toMatch(/ду таблетка/);
        const right = service.check('it', 't1', 'b', 'ru');
        expect(right.solved).toBe(true);
        expect(Object.keys(right.feedback)).toEqual(['a', 'b', 'c', 'd']);
    });

    it('хулоса: «ҳал кард × писанд омад»', () => {
        expect(TrialService.verdict(true, true)).toBe('strong');
        expect(TrialService.verdict(false, true)).toBe('interest');
        expect(TrialService.verdict(true, false)).toBe('ability');
        expect(TrialService.verdict(false, false)).toBe('other');
    });

    it('finish: дар сервер аз нав баҳо медиҳад ва маълумоти нодурустро рад мекунад', async () => {
        const { service, queries } = build([{ id: 'c1', code: '1400101', name: 'Таъмини барномавӣ', tr: null }]);
        const result = await service.finish({
            family: 'it',
            careerId: 'not-a-uuid',
            tasks: [
                { id: 't1', answer: 'b', liked: true },
                { id: 't2', answer: ['b', 'c', 'a'], liked: false },
                { id: 't3', answer: 'c', liked: true },
            ],
            rating: 9,
            confBefore: 2,
            confAfter: 4,
        });
        expect(result.solved).toBe(2);
        expect(result.tasks.map((task) => task.verdict)).toEqual(['strong', 'other', 'strong']);
        expect(result.tasks[0].related).toEqual([{ id: 'c1', code: '1400101', name: 'Таъмини барномавӣ' }]);
        expect(result.rating).toBeNull();
        const insert = queries.find((q) => q.sql.includes('INSERT INTO trial_attempts'))!;
        expect(insert.params[1]).toBeNull(); // careerId
        expect(insert.params[2]).toBe(2);
        expect(insert.params[5]).toBe(2);
        expect(insert.params[6]).toBe(4);
    });

    it('finish: агар ҳеҷ қисм писанд наояд — самти дигарро пешниҳод мекунад', async () => {
        const { service } = build();
        const result = await service.finish({ family: 'law', tasks: [], rating: 3 });
        expect(result.solved).toBe(0);
        expect(result.suggestOther).toBe(true);
    });
});

describe('resolveFamily', () => {
    it('ихтисоси IT → барномасоз (дақиқ)', () => {
        expect(resolveFamily('1400101', 1)).toEqual({ family: 'it', exact: true, own: 'it' });
    });
    it('омӯзгори математика (кластери 1) → омӯзгор, на IT', () => {
        expect(resolveFamily('1020501', 1).family).toBe('teacher');
    });
    it('рамзи 6-рақама бо кластери дигар → аз рӯи кластер', () => {
        expect(resolveFamily('380301', 2)).toEqual({ family: 'economics', exact: false, own: null });
    });
    it('оилаи ҳанӯз тайёрнашуда → наздиктарин аз ҳамон самт', () => {
        expect(resolveFamily('1430103', 1)).toEqual({ family: 'it', exact: false, own: 'energy' });
    });
    it('бе рамз ва кластер → ҳеҷ чиз', () => {
        expect(resolveFamily(null, null)).toEqual({ family: null, exact: false, own: null });
    });
});
