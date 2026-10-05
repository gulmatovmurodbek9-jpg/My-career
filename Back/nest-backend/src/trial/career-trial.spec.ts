import { HARD_TASKS, TASK_COUNT, publicTask, shuffleCareerTrial, validateCareerTrial } from './career-trial';
import { TrialService } from './trial.service';

// Сенарияи дуруст барои тест: 5 касбӣ + 3 бо одамон, се забон.
function fixture() {
    const keys = Array.from({ length: TASK_COUNT }, (_, i) => {
        const id = `t${i + 1}`;
        const skill = i < HARD_TASKS ? 'hard' : 'soft';
        if (i === 1) return { id, kind: 'order', skill, answer: ['c', 'a', 'b'], related: [] };
        if (i === 2) return { id, kind: 'multi', skill, answer: ['a', 'd'], related: [] };
        return { id, kind: 'choice', skill, answer: 'b', related: [] };
    });
    const words = { tj: 'Ҷавоби ҳақиқӣ ва қавӣ', ru: 'Это хороший ответ для ученика', en: 'This is a good answer for the student' };
    const lang = (l: 'tj' | 'ru' | 'en') => ({
        role: `${words[l]} role`, place: `${words[l]} place`, intro: `${words[l]} intro.`,
        day: Array.from({ length: 6 }, (_, i) => ({ time: `${8 + i}:00`, text: `${words[l]} ${i}` })),
        pros: Array.from({ length: 8 }, (_, i) => `${words[l]} плюс ${i}`.replace('плюс', l === 'en' ? 'plus' : 'плюс')),
        cons: Array.from({ length: 8 }, (_, i) => `${words[l]} ${i} минус`.replace('минус', l === 'en' ? 'minus' : 'минус')),
        goodFor: [1, 2, 3, 4].map((i) => `${words[l]} ${i}`),
        hardFor: [1, 2, 3, 4].map((i) => `${words[l]} ${i}`),
        tasks: keys.map((key, i) => ({
            title: `${words[l]} ${i}`, prompt: words[l], question: `${words[l]}?`,
            options: (key.kind === 'multi' ? ['a', 'b', 'c', 'd'] : ['a', 'b', 'c']).map((id) => ({ id, text: `${words[l]} ${id}`, feedback: `${words[l]} — ${id}` })),
            skillName: words[l], steps: [words[l], words[l], words[l]], realLife: words[l], tip: words[l],
        })),
    });
    return { keys, text: { tj: lang('tj'), ru: lang('ru'), en: lang('en') } } as any;
}

describe('Сенарияи ихтисос: санҷиш', () => {
    it('сенарияи дуруст мегузарад', () => {
        expect(validateCareerTrial(fixture())).toEqual([]);
    });

    it('3 вазифа кам аст — 8 лозим', () => {
        const content = fixture();
        content.keys = content.keys.slice(0, 3);
        expect(validateCareerTrial(content).join()).toMatch(/keys бояд 8/);
    });

    it('ҷавоби дуруст дар вариантҳо набошад — хато', () => {
        const content = fixture();
        content.keys[0].answer = 'z';
        expect(validateCareerTrial(content).join()).toMatch(/ҷавоби keys дар вариантҳо нест/);
    });

    it('рақами маош ва моддаи қонун манъ аст', () => {
        const content = fixture();
        content.text.tj.pros[0] = 'Маош аз 5000 сомонӣ сар мешавад';
        content.text.ru.tasks[0].prompt = 'Согласно статье 125 кодекса';
        const errors = validateCareerTrial(content).join();
        expect(errors).toMatch(/tj: рақами маош/);
        expect(errors).toMatch(/ru: рақами моддаи қонун/);
    });

    it('плюс/минус камтар аз 7 — хато', () => {
        const content = fixture();
        content.text.en.cons = content.text.en.cons.slice(0, 4);
        expect(validateCareerTrial(content).join()).toMatch(/en\.cons/);
    });

    it('id-и вариантҳо дар забонҳо бояд якхела бошанд', () => {
        const content = fixture();
        content.text.ru.tasks[3].options[0].id = 'x';
        expect(validateCareerTrial(content).join()).toMatch(/ru\.tasks\[3\].*фарқ/);
    });
});

describe('Сенарияи ихтисос: омехтан', () => {
    it('ҷавобҳо пас аз омехтан дар ҳамаи забонҳо ба ҳамон матн ишора мекунанд', () => {
        const original = fixture();
        const shuffled = shuffleCareerTrial(original, 'career-uuid-1');
        expect(validateCareerTrial(shuffled)).toEqual([]);
        shuffled.keys.forEach((key: any, i: number) => {
            const answers = Array.isArray(key.answer) ? key.answer : [key.answer];
            const originalAnswers = Array.isArray(original.keys[i].answer) ? original.keys[i].answer : [original.keys[i].answer];
            for (const lang of ['tj', 'ru', 'en'] as const) {
                const texts = answers.map((id: string) => shuffled.text[lang].tasks[i].options.find((o: any) => o.id === id).text);
                const expected = originalAnswers.map((id: string) => original.text[lang].tasks[i].options.find((o: any) => o.id === id).text);
                expect(texts).toEqual(expected);
            }
        });
    });

    it('ҷавоби дуруст на ҳамеша дар як ҷой', () => {
        const shuffled = shuffleCareerTrial(fixture(), 'career-uuid-2');
        const positions = new Set(shuffled.keys.filter((key: any) => key.kind === 'choice').map((key: any) => key.answer));
        expect(positions.size).toBeGreaterThan(1);
    });

    it('вазифаи «тартиб» дар ҳолати аввал ҳалшуда нест', () => {
        for (const seed of ['a', 'b', 'c', 'd', 'e']) {
            const shuffled = shuffleCareerTrial(fixture(), seed);
            const key = shuffled.keys[1];
            const shown = shuffled.text.tj.tasks[1].options.map((o: any) => o.id);
            expect(TrialService.grade(key, shown).solved).toBe(false);
        }
    });

    it('браузер ҷавоб ва шарҳро намегирад', () => {
        const content = shuffleCareerTrial(fixture(), 'x');
        const json = JSON.stringify(content.keys.map((key: any, i: number) => publicTask(key, content.text.tj.tasks[i])));
        expect(json).not.toMatch(/"feedback"|"answer"|"steps"|"realLife"|"tip"|"mustFirst"/);
    });
});

describe('parseAiJson', () => {
    it('нохунаки дохилиро таъмир мекунад', () => {
        const { parseAiJson } = require('./career-trial');
        const raw = '```json\n{"a": "Ӯ гуфт "салом" ва рафт", "b": ["x", "y"], "c": "сатри\nнав"}\n```';
        expect(parseAiJson(raw)).toEqual({ a: 'Ӯ гуфт "салом" ва рафт', b: ['x', 'y'], c: 'сатри\nнав' });
    });
});
