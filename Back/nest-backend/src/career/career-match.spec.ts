import { careerFamily, diversifyCareers, maxFeeOf, undecidedDirections } from './career-match';

describe('maxFeeOf', () => {
    it('танҳо ҳадди рақамӣ медиҳад', () => {
        expect(maxFeeOf('5000')).toBe(5000);
        expect(maxFeeOf('free')).toBeNull();
        expect(maxFeeOf(undefined)).toBeNull();
    });
});

describe('careerFamily', () => {
    it('номҳои як навъро як оила мекунад', () => {
        expect(careerFamily('Биология. Экология')).toBe(careerFamily('Биология (аз рӯйи самтҳо)'));
    });
    it('калимаи умумиро бо калимаи дуюм ҷудо мекунад', () => {
        expect(careerFamily('Кори табобатӣ')).not.toBe(careerFamily('Кори ҳамширагӣ'));
    });
});

describe('diversifyCareers', () => {
    const names = ['Биология', 'Биология. Экология', 'Биология (самт)', 'Химия', 'Биология. Забон'];
    it('аз як навъ на бештар аз 2 то, боқимонда ба охир', () => {
        expect(diversifyCareers(names, (name) => name, 3)).toEqual(['Биология', 'Биология. Экология', 'Химия']);
        expect(diversifyCareers(names, (name) => name)).toEqual(['Биология', 'Биология. Экология', 'Химия', 'Биология (самт)', 'Биология. Забон']);
    });
});

describe('undecidedDirections', () => {
    const list = (...scores: number[]) => scores.map((score) => ({ score }));
    it('самти равшанро дудил намегӯяд', () => {
        expect(undecidedDirections(list(32, 10, 8, 5, 2))).toBeNull();
    });
    it('самти сустро дудил мегӯяд ва то 3 самт медиҳад', () => {
        const result = undecidedDirections(list(13.3, 11.7, 10, 5, 2.5))!;
        expect(result.map((entry) => entry.score)).toEqual([13.3, 11.7, 10]);
        expect(result[0].percent).toBe(33);
    });
    it('ду самти қавии наздикро низ дудил мегӯяд', () => {
        expect(undecidedDirections(list(30, 28, 5, 3, 1))!.length).toBe(2);
    });
});
