import { joinBrokenList, joinBrokenLists } from './career-lists';

describe('joinBrokenList', () => {
    it('қавси канда бармегардад', () => {
        expect(joinBrokenList(['Нерӯгоҳҳои обӣ (Норак', 'Роғун', 'Сангтӯда)', 'Корхонаҳо'])).toEqual(['Нерӯгоҳҳои обӣ (Норак, Роғун, Сангтӯда)', 'Корхонаҳо']);
    });
    it('идомаи номи вергулдор бармегардад', () => {
        expect(joinBrokenList(['Баҳисобгирии бухгалтерӣ', ' таҳлил ва аудит', 'Молия'])).toEqual(['Баҳисобгирии бухгалтерӣ, таҳлил ва аудит', 'Молия']);
    });
    it('рӯйхати дуруст ва лотинӣ тағйир намеёбад', () => {
        expect(joinBrokenList(['SQL', '1С', 'iOS', 'pandas'])).toEqual(['SQL', '1С', 'iOS', 'pandas']);
    });
    it('майдони дигарро намерасонад', () => {
        const career = { name: 'A', technologies: ['SQL'] };
        expect(joinBrokenLists(career)).toEqual(career);
    });
});
