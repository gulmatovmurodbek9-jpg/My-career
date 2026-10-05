/* eslint-disable no-console */
// Тавлиди «Як рӯз дар ихтисос» барои ҳар ихтисос (884) — дар компютери худ, шабона:
//   npm run trials:generate                      — ҳамаи ихтисосҳое, ки ҳанӯз сенария надоранд
//   npm run trials:generate -- --limit 8         — пилот
//   npm run trials:generate -- --codes 1020501,1400101 --force
//   npm run trials:generate -- --concurrency 4
// Ҳар оғоз сенарияҳои тайёрро бо қоидаҳои ҳозира месанҷад ва нодурустҳоро аз нав месозад.
// Аз ҷои қатъшуда давом медиҳад: ихтисосе, ки сенарияи тайёр дорад, гузаронида мешавад.
// Қадами 1: keys + тоҷикӣ. Қадами 2: тарҷумаи русӣ ва англисӣ (ҳамзамон). Ҳар қадам
// бо validate санҷида мешавад; хатоҳо ба AI баргардонида, то 3 бор такрор мешавад.
import 'dotenv/config';
import { Client } from 'pg';
import { GoogleGenAI } from '@google/genai';
import {
    buildCareerTrialPrompt, buildTranslatePrompt, parseAiJson, shuffleCareerTrial,
    validateCareerTrial, validateKeys, validateLanguage,
} from './career-trial';
import { CREATE_TABLE } from './career-trials.table';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : undefined;
};

const LIMIT = Number(value('limit')) || Infinity;
const CODES = value('codes')?.split(',').map((code) => code.trim()).filter(Boolean);
const FORCE = flag('force');
const CONCURRENCY = Math.max(1, Math.min(8, Number(value('concurrency')) || 4));
const MODEL = process.env.TRIAL_MODEL || process.env.VERTEX_MODEL || 'gemini-2.5-flash';
const ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    const project = process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (!project) throw new Error('VERTEX_PROJECT_ID лозим аст');
    const ai = new GoogleGenAI({ vertexai: true, project, location: process.env.VERTEX_LOCATION || 'global' });

    const db = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'career_db',
    });
    await db.connect();
    await db.query(CREATE_TABLE);

    // Сенарияҳои тайёрро бо қоидаҳои ҳозира аз нав месанҷем; нодурустҳо аз нав сохта мешаванд.
    const { rows: existing } = await db.query('SELECT "careerId", content FROM career_trials');
    const stale = existing.filter((row) => validateCareerTrial(row.content).length > 0).map((row) => row.careerId);
    if (stale.length) {
        await db.query('DELETE FROM career_trials WHERE "careerId" = ANY($1)', [stale]);
        console.log(`Аз нав сохта мешаванд (қоидаҳои нав): ${stale.length}`);
    }

    const { rows: careers } = await db.query(`
        SELECT c.id, c.name, c.code, c."mmtCluster", c."degreeType", c."durationYears", c.description, c.purpose,
               c.skills, c.technologies, c."careerOpportunities",
               c.translations -> 'ru' ->> 'name' AS "nameRu", c.translations -> 'en' ->> 'name' AS "nameEn",
               cl."clusterName" AS cluster,
               (SELECT array_agg(DISTINCT u.name) FROM career_offerings o JOIN universities u ON u.id = o."universityId" WHERE o."careerId" = c.id) AS institutions,
               (SELECT array_agg(DISTINCT u.city) FROM career_offerings o JOIN universities u ON u.id = o."universityId" WHERE o."careerId" = c.id AND u.city IS NOT NULL) AS cities
        FROM career c
        LEFT JOIN cluster cl ON cl.id = c."clusterId"
        WHERE ($1::text[] IS NULL OR c.code = ANY($1))
          AND ($2 OR NOT EXISTS (SELECT 1 FROM career_trials t WHERE t."careerId" = c.id))
        ORDER BY c."contentWritten" DESC, c.code`, [CODES || null, FORCE]);

    const queue = careers.slice(0, LIMIT);
    console.log(`Тавлид: ${queue.length} ихтисос · модел ${MODEL} · ҳамзамон ${CONCURRENCY}`);

    const ask = async (prompt: string, thinking: number) => {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
                temperature: 0.8,
                maxOutputTokens: 60000,
                thinkingConfig: { thinkingBudget: thinking },
            },
        });
        return parseAiJson(response.text || '');
    };

    // Як қадам бо такрор: агар validate хато ёбад — хатоҳо ба промпт илова мешаванд.
    const step = async <T>(label: string, code: string, prompt: string, thinking: number, check: (value: any) => string[]): Promise<T> => {
        let feedback = '';
        let lastError = '';
        for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
            try {
                const result = await ask(prompt + feedback, thinking);
                const errors = check(result);
                if (!errors.length) return result as T;
                lastError = errors.slice(0, 4).join('; ');
                feedback = `\n\nДАФЪАИ ПЕШТАРА ИН ХАТОҲО БУДАНД — ҳатман ислоҳ кун:\n- ${errors.slice(0, 20).join('\n- ')}`;
                console.log(`  ↻ ${code} ${label} (кӯшиши ${attempt}): ${lastError}`);
            } catch (error) {
                lastError = (error as any)?.message?.slice(0, 160) || String(error);
                console.log(`  ✗ ${code} ${label} (кӯшиши ${attempt}): ${lastError}`);
                await sleep(4000 * attempt);
            }
        }
        throw new Error(`${label}: ${lastError}`);
    };

    const generateOne = async (career: any) => {
        const split = (value: any) => (typeof value === 'string' ? value.split(',') : value);
        const prompt = buildCareerTrialPrompt({ ...career, technologies: split(career.technologies), careerOpportunities: split(career.careerOpportunities) });

        const first = await step<any>('tj', career.code, prompt, 4096, (result) => {
            const keyErrors = validateKeys(result?.keys);
            return keyErrors.length ? keyErrors : validateLanguage(result?.tj, result.keys, 'tj');
        });
        const [ru, en] = await Promise.all((['ru', 'en'] as const).map((lang) =>
            step<any>(lang, career.code, buildTranslatePrompt(first.tj, lang), 0, (result) => validateLanguage(result, first.keys, lang, first.tj)),
        ));
        const content = { keys: first.keys, text: { tj: first.tj, ru, en } };
        const errors = validateCareerTrial(content);
        if (errors.length) throw new Error(errors.slice(0, 4).join('; '));
        const final = shuffleCareerTrial(content, career.id);
        await db.query(
            `INSERT INTO career_trials ("careerId", content, model, status) VALUES ($1, $2, $3, 'ai')
             ON CONFLICT ("careerId") DO UPDATE SET content = EXCLUDED.content, model = EXCLUDED.model, status = 'ai', "createdAt" = now()`,
            [career.id, JSON.stringify(final), MODEL],
        );
    };

    let done = 0;
    let failed = 0;
    const started = Date.now();
    let next = 0;
    const worker = async () => {
        while (next < queue.length) {
            const career = queue[next++];
            let ok = true;
            try {
                await generateOne(career);
                done += 1;
            } catch (error) {
                ok = false;
                failed += 1;
                console.log(`  ✗ ${career.code}: ${(error as any)?.message?.slice(0, 200)}`);
            }
            const minutes = (Date.now() - started) / 60000;
            const left = queue.length - done - failed;
            const eta = Math.round((minutes / (done + failed)) * left);
            console.log(`${ok ? '✓' : '✗'} [${done + failed}/${queue.length}] ${career.code} ${career.name} · ${Math.round(minutes)} дақ гузашт · боқӣ ~${eta} дақ`);
        }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log(`Тамом: ${done} тайёр, ${failed} нашуд, ${Math.round((Date.now() - started) / 60000)} дақ. Нашудаҳоро бо ҳамон фармон аз нав иҷро кунед.`);
    await db.end();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
