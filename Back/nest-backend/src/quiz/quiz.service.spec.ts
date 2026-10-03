import { QuizService } from './quiz.service';
import { MMT_QUESTIONS } from './data/questions-mmt';

// Формулаи хол: ҳар хато дар ин ҷо ба ҳазорон хонанда тавсияи нодуруст медиҳад.
describe('QuizService.calculateScores', () => {
    const service = new QuizService({} as any, {} as any);
    const CLUSTERS = ['c1', 'c2', 'c3', 'c4', 'c5'] as const;

    // Барои ҳар савол варианте, ки ба кластери додашуда бештар хол медиҳад.
    const bestFor = (cluster: string) => MMT_QUESTIONS.map((question) => {
        const index = question.options
            .map((option, i) => ({ i, points: Number((option.scores as any)?.[cluster]) || 0 }))
            .sort((a, b) => b.points - a.points)[0].i;
        return { questionId: question.id, selectedValue: index };
    });

    it('ҳар саволи қисми 1 барои ҳар кластер вариант дорад (тест ягон самтро «гум» намекунад)', () => {
        for (const cluster of CLUSTERS) {
            const reachable = MMT_QUESTIONS.filter((q) => q.options.some((o) => Number((o.scores as any)?.[cluster]) > 0));
            expect(reachable.length).toBe(MMT_QUESTIONS.length);
        }
    });

    it.each(CLUSTERS)('агар ҳама ҷавобҳо ба %s ишора кунанд — ҳамон кластер 40 аз 40', (cluster) => {
        const scores = service.calculateScores({ answers: bestFor(cluster) } as any);
        expect(scores.mmtClusters[cluster]).toBe(40);
        for (const other of CLUSTERS.filter((c) => c !== cluster)) {
            expect(scores.mmtClusters[other]).toBeLessThan(40);
        }
    });

    it('холҳо ҳамеша дар миқёси 0–40', () => {
        for (let seed = 0; seed < 50; seed++) {
            const answers = MMT_QUESTIONS.map((q, i) => ({ questionId: q.id, selectedValue: (i * 7 + seed) % q.options.length }));
            const scores = service.calculateScores({ answers } as any);
            for (const cluster of CLUSTERS) {
                expect(scores.mmtClusters[cluster]).toBeGreaterThanOrEqual(0);
                expect(scores.mmtClusters[cluster]).toBeLessThanOrEqual(40);
            }
        }
    });

    it('ҷавобҳои такрорӣ ба як савол ду бор ҳисоб намешаванд', () => {
        const once = service.calculateScores({ answers: bestFor('c1') } as any);
        const twice = service.calculateScores({ answers: [...bestFor('c1'), ...bestFor('c1')] } as any);
        expect(twice.mmtClusters).toEqual(once.mmtClusters);
    });

    it('саволи «баробар» хол илова намекунад — танҳо интихобро сабт мекунад', () => {
        const answers = bestFor('c4');
        const without = service.calculateScores({ answers } as any);
        const withTie = service.calculateScores({ answers: [...answers, { questionId: 'tiebreak', selectedValue: 'c2' }] } as any);
        expect(withTie.mmtClusters).toEqual(without.mmtClusters);
        expect(withTie.chosenCluster).toBe('c2');
    });

    it('ҷавоби нодурусти «баробар» сарфи назар мешавад', () => {
        const scores = service.calculateScores({ answers: [{ questionId: 'tiebreak', selectedValue: 'c9' }] } as any);
        expect(scores.chosenCluster).toBeUndefined();
    });

    it('саволҳои «пинҳон» (m17–m24) ҳар вариант ба ду самт хол медиҳанд', () => {
        const hidden = MMT_QUESTIONS.filter((q) => Number(q.id.slice(1)) >= 17);
        expect(hidden.length).toBe(8);
        for (const question of hidden) {
            for (const option of question.options) {
                expect(Object.keys(option.scores || {}).length).toBe(2);
            }
        }
    });
});

describe('QuizService.hasInventedNumbers (санҷиши ҷавоби AI)', () => {
    const source = 'Кластер: Тиб. Холҳо: 32, 18. Ихтисосҳо: Ҳамширагӣ';
    it('рақами бофта (маош, бал) ошкор мешавад', () => {
        expect(QuizService.hasInventedNumbers('Маош 5000 сомонӣ аст.', source)).toBe(true);
        expect(QuizService.hasInventedNumbers('Бали гузариш 250 аст.', source)).toBe(true);
    });
    it('рақамҳои маълумот ва шумориши хурд иҷозатанд', () => {
        expect(QuizService.hasInventedNumbers('Холи шумо 32 аст. 3 қадам кунед.', source)).toBe(false);
        expect(QuizService.hasInventedNumbers('Бе рақам.', source)).toBe(false);
    });
});

import { QuizStatsService } from './quiz-stats.service';
describe('Cronbach alpha', () => {
    it('саволҳои ҳамоҳанг — α баланд', () => {
        const m = [[3, 3, 3], [0, 0, 0], [3, 3, 0], [0, 0, 3], [3, 3, 3], [0, 0, 0]];
        expect(QuizStatsService.cronbachAlpha(m)!).toBeGreaterThan(0.6);
    });
    it('маълумоти кам — null', () => {
        expect(QuizStatsService.cronbachAlpha([[1, 2]])).toBeNull();
    });
});
