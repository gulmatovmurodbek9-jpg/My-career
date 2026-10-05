import { Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FAMILIES, resolveFamily } from './families';
import { Lang, Scenario, TaskKey } from './trial.types';
import { IT } from './scenarios/it';
import { ECONOMICS } from './scenarios/economics';
import { TEACHER } from './scenarios/teacher';
import { LAW } from './scenarios/law';
import { MEDICINE } from './scenarios/medicine';

// «Як рӯз дар ихтисос»: хонанда 3 вазифаи кори воқеиро иҷро мекунад ва мегӯяд, ки
// кадом қисм писанд омад. Баҳодиҳӣ бе AI — арзон, фаврӣ ва ҳамеша кор мекунад.
// Барои ҳимоя: боварии хонанда ба интихобаш пеш ва баъд аз санҷиш (1–5) чен карда мешавад.
// Ном ва почта нигоҳ дошта намешаванд; 12 моҳ (ниг. /privacy).
export const SCENARIOS: Record<string, Scenario> = Object.fromEntries(
    [IT, ECONOMICS, TEACHER, LAW, MEDICINE].map((scenario) => [scenario.family, scenario]),
);

const KEEP_MONTHS = 12;

export type Verdict = 'strong' | 'interest' | 'ability' | 'other';

export interface FinishInput {
    family?: string;
    careerId?: string;
    lang?: string;
    tasks?: Array<{ id?: string; answer?: unknown; liked?: boolean }>;
    rating?: number;
    confBefore?: number;
    confAfter?: number;
}

const toLang = (lang: unknown): Lang => (lang === 'ru' || lang === 'en' ? lang : 'tj');
const isUuid = (id: unknown) => /^[0-9a-f-]{36}$/i.test(String(id || ''));
const scale = (value: unknown, max: number): number | null => {
    const n = Math.round(Number(value));
    return Number.isFinite(n) && n >= 1 && n <= max ? n : null;
};

@Injectable()
export class TrialService implements OnModuleInit, OnModuleDestroy {
    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor(private readonly dataSource: DataSource) { }

    async onModuleInit(): Promise<void> {
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS trial_attempts (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                family varchar(20) NOT NULL,
                "careerId" uuid NULL,
                solved smallint NOT NULL,
                tasks jsonb NOT NULL,
                rating smallint NULL CHECK (rating BETWEEN 1 AND 4),
                "confBefore" smallint NULL CHECK ("confBefore" BETWEEN 1 AND 5),
                "confAfter" smallint NULL CHECK ("confAfter" BETWEEN 1 AND 5),
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )`);
        await this.cleanup();
        this.cleanupTimer = setInterval(() => void this.cleanup(), 24 * 60 * 60 * 1000);
    }

    onModuleDestroy(): void {
        if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    }

    private async cleanup(): Promise<void> {
        try {
            await this.dataSource.query(`DELETE FROM trial_attempts WHERE "createdAt" < now() - interval '${KEEP_MONTHS} months'`);
        } catch (error) {
            console.error('trial cleanup:', (error as any)?.message || error);
        }
    }

    private scenario(family: string): Scenario {
        const scenario = SCENARIOS[String(family || '')];
        if (!scenario) throw new NotFoundException('Сенария ёфт нашуд');
        return scenario;
    }

    list(lang?: string) {
        const l = toLang(lang);
        return {
            scenarios: Object.values(SCENARIOS).map((scenario) => ({
                family: scenario.family,
                icon: scenario.icon,
                minutes: scenario.minutes,
                role: scenario.text[l].role,
                place: scenario.text[l].place,
                familyName: FAMILIES.find((family) => family.id === scenario.family)?.name[l],
            })),
            families: FAMILIES.map((family) => ({ id: family.id, name: family.name[l], ready: family.ready })),
        };
    }

    resolve(code?: string, cluster?: number | string, lang?: string) {
        const l = toLang(lang);
        const result = resolveFamily(code, Number(cluster) || null);
        const name = (id: string | null) => (id ? FAMILIES.find((family) => family.id === id)?.name[l] || null : null);
        const scenario = result.family ? SCENARIOS[result.family] : null;
        return {
            ...result,
            familyName: name(result.family),
            ownName: name(result.own),
            role: scenario?.text[l].role || null,
            icon: scenario?.icon || null,
        };
    }

    // Сенария барои браузер — бе ҷавобҳои дуруст ва бе шарҳҳо.
    get(family: string, lang?: string) {
        const scenario = this.scenario(family);
        const text = scenario.text[toLang(lang)];
        return {
            family: scenario.family,
            icon: scenario.icon,
            minutes: scenario.minutes,
            familyName: FAMILIES.find((item) => item.id === scenario.family)?.name[toLang(lang)],
            role: text.role,
            place: text.place,
            intro: text.intro,
            disclaimer: text.disclaimer || null,
            reality: text.reality,
            tasks: scenario.keys.map((key, index) => {
                const task = text.tasks[index];
                return {
                    id: key.id,
                    kind: key.kind,
                    skill: key.skill,
                    pick: key.kind === 'multi' ? (key.answer as string[]).length : undefined,
                    title: task.title,
                    prompt: task.prompt,
                    quote: task.quote,
                    code: task.code,
                    table: task.table,
                    question: task.question,
                    unit: task.unit,
                    options: task.options?.map(({ id, text: label }) => ({ id, text: label })),
                };
            }),
        };
    }

    static grade(key: TaskKey, answer: unknown): { solved: boolean; perfect: boolean } {
        if (key.kind === 'choice') {
            const solved = String(answer ?? '') === key.answer;
            return { solved, perfect: solved };
        }
        if (key.kind === 'number') {
            const solved = answer !== null && answer !== '' && Number(answer) === key.answer;
            return { solved, perfect: solved };
        }
        const list = Array.isArray(answer) ? answer.map(String) : [];
        const expected = key.answer as string[];
        if (key.kind === 'multi') {
            const unique = new Set(list);
            const solved = unique.size === expected.length && expected.every((id) => unique.has(id));
            return { solved, perfect: solved };
        }
        // order: ҳалшуда — агар муҳимтарин аввал бошад; беҳтарин — тартиби пурра.
        const perfect = list.length === expected.length && expected.every((id, index) => list[index] === id);
        return { solved: list[0] === (key.mustFirst ?? expected[0]), perfect };
    }

    // Баъди ҷавоб: дуруст буд ё не, ҷавоби дуруст ва шарҳи ҳамаи вариантҳо.
    check(family: string, taskId: string, answer: unknown, lang?: string) {
        const scenario = this.scenario(family);
        const index = scenario.keys.findIndex((key) => key.id === taskId);
        if (index < 0) throw new NotFoundException('Вазифа ёфт нашуд');
        const key = scenario.keys[index];
        const task = scenario.text[toLang(lang)].tasks[index];
        const { solved, perfect } = TrialService.grade(key, answer);
        const feedback = Object.fromEntries((task.options || []).filter((option) => option.feedback).map((option) => [option.id, option.feedback]));
        return {
            solved,
            perfect,
            answer: key.answer,
            feedback,
            numberFeedback: key.kind === 'number' && !solved ? task.wrongNumbers?.[String(Number(answer))] || null : null,
            explain: task.explain,
        };
    }

    static verdict(solved: boolean, liked: boolean): Verdict {
        if (liked) return solved ? 'strong' : 'interest';
        return solved ? 'ability' : 'other';
    }

    async finish(input: FinishInput) {
        const scenario = this.scenario(String(input?.family || ''));
        const lang = toLang(input?.lang);
        const given = Array.isArray(input?.tasks) ? input.tasks : [];
        const tasks = scenario.keys.map((key, index) => {
            const item = given.find((task) => task?.id === key.id);
            const { solved, perfect } = TrialService.grade(key, item?.answer);
            const liked = item?.liked === true;
            return { id: key.id, skill: key.skill, solved, perfect, liked, verdict: TrialService.verdict(solved, liked), index };
        });
        const solvedCount = tasks.filter((task) => task.solved).length;
        const rating = scale(input?.rating, 4);
        const confBefore = scale(input?.confBefore, 5);
        const confAfter = scale(input?.confAfter, 5);

        try {
            await this.dataSource.query(
                `INSERT INTO trial_attempts (family, "careerId", solved, tasks, rating, "confBefore", "confAfter") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    scenario.family,
                    isUuid(input?.careerId) ? input.careerId : null,
                    solvedCount,
                    JSON.stringify(tasks.map(({ id, solved, perfect, liked }) => ({ id, solved, perfect, liked }))),
                    rating,
                    confBefore,
                    confAfter,
                ],
            );
        } catch (error) {
            console.error('trial_attempts:', (error as any)?.message || error);
        }

        const codes = [...new Set(scenario.keys.flatMap((key) => key.related))];
        const careers: Array<{ id: string; code: string; name: string; tr: string | null }> = codes.length
            ? await this.dataSource.query(
                `SELECT id, code, name, translations -> $2::text ->> 'name' AS tr FROM career WHERE code = ANY($1)`,
                [codes, lang],
            )
            : [];
        const byCode = new Map(careers.map((career) => [career.code, { id: career.id, code: career.code, name: career.tr || career.name }]));
        const text = scenario.text[lang];

        return {
            family: scenario.family,
            role: text.role,
            solved: solvedCount,
            total: tasks.length,
            rating,
            confBefore,
            confAfter,
            tasks: tasks.map((task) => ({
                id: task.id,
                skill: task.skill,
                title: text.tasks[task.index].title,
                solved: task.solved,
                liked: task.liked,
                verdict: task.verdict,
                related: scenario.keys[task.index].related.map((code) => byCode.get(code)).filter(Boolean),
            })),
            // Агар писанд наомад — самти дигарро санҷидан пешниҳод мешавад.
            suggestOther: (rating !== null && rating <= 2) || tasks.every((task) => !task.liked),
        };
    }

    // Барои админ ва ҳимоя: чанд нафар, писанд омадан ва тағйири боварӣ.
    async stats() {
        const rows: Array<{ family: string; solved: number; rating: number | null; confBefore: number | null; confAfter: number | null; tasks: Array<{ liked: boolean }> }> =
            await this.dataSource.query('SELECT family, solved, rating, "confBefore", "confAfter", tasks FROM trial_attempts');
        const average = (list: number[]) => (list.length ? Math.round((list.reduce((sum, value) => sum + value, 0) / list.length) * 10) / 10 : null);
        const summarize = (list: typeof rows) => {
            const paired = list.filter((row) => row.confBefore && row.confAfter);
            const ratings = list.map((row) => row.rating).filter((value): value is number => !!value);
            return {
                count: list.length,
                solvedAverage: average(list.map((row) => Number(row.solved))),
                rating: average(ratings),
                likedShare: list.length
                    ? Math.round((list.reduce((sum, row) => sum + (row.tasks || []).filter((task) => task.liked).length, 0) / (list.length * 3)) * 100)
                    : null,
                confidence: {
                    count: paired.length,
                    before: average(paired.map((row) => Number(row.confBefore))),
                    after: average(paired.map((row) => Number(row.confAfter))),
                    up: paired.filter((row) => Number(row.confAfter) > Number(row.confBefore)).length,
                    down: paired.filter((row) => Number(row.confAfter) < Number(row.confBefore)).length,
                    same: paired.filter((row) => Number(row.confAfter) === Number(row.confBefore)).length,
                },
            };
        };
        return {
            all: summarize(rows),
            byFamily: Object.keys(SCENARIOS).map((family) => ({ family, ...summarize(rows.filter((row) => row.family === family)) })),
        };
    }
}
