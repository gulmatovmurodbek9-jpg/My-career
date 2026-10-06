/* eslint-disable no-console */
// Ҷадвалҳое, ки дар версияи русӣ/англисӣ тоҷикӣ монданд (тарҷумон ҷадвалро нагардонд), тарҷума мешаванд.
// Шакли ҷадвал ва рақамҳо бояд айнан монанд; вагарна ҷадвали аслӣ мемонад.
//   npm run trials:tables -- --dry      — танҳо шумора
//   npm run trials:tables
import 'dotenv/config';
import { Client } from 'pg';
import { GoogleGenAI } from '@google/genai';
import { parseAiJson, validateCareerTrial } from './career-trial';

const DRY = process.argv.includes('--dry');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Ихтисосҳои забон: дар онҳо матни тоҷикӣ дар ҷадвал метавонад қасдан бошад.
const LANGUAGE_CAREER = /забон|филолог|тарҷума|адабиёт|журналист|шарқшинос|лингвист/i;

const flagged = (table: any, lang: 'ru' | 'en') => [...(table?.head || []), ...(table?.rows || []).flat()]
    .map(String).filter((cell) => (lang === 'ru' ? /[ӣӯқғҳҷ]/i.test(cell) : /[а-яёӣӯқғҳҷ]{2,}/i.test(cell))).length;
const needs = (table: any, lang: 'ru' | 'en') => flagged(table, lang) > 0;
const shape = (table: any) => JSON.stringify([(table.head || []).length, (table.rows || []).map((row: any[]) => row.length)]);
const digits = (table: any) => [...(table.head || []), ...(table.rows || []).flat()].map(String).join(' ').match(/\d+(?:[.,]\d+)?/g)?.join('|') || '';

async function main() {
    const ai = new GoogleGenAI({ vertexai: true, project: process.env.VERTEX_PROJECT_ID!, location: process.env.VERTEX_LOCATION || 'global' });
    const db = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'career_db',
    });
    await db.connect();
    const { rows } = await db.query('SELECT t."careerId", c.code, c.name, t.content FROM career_trials t JOIN career c ON c.id = t."careerId"');
    const jobs: Array<{ row: any; lang: 'ru' | 'en'; index: number }> = [];
    for (const row of rows) {
        if (LANGUAGE_CAREER.test(row.name)) continue;
        for (const lang of ['ru', 'en'] as const) {
            row.content.text[lang].tasks.forEach((task: any, index: number) => {
                if (task.table && needs(task.table, lang)) jobs.push({ row, lang, index });
            });
        }
    }
    console.log(`Ҷадвалҳо барои тарҷума: ${jobs.length} (дар ${new Set(jobs.map((job) => job.row.code)).size} сенария)`);
    if (DRY) return db.end();

    let done = 0;
    let kept = 0;
    const changed = new Set<any>();
    let next = 0;
    const worker = async () => {
        while (next < jobs.length) {
            const { row, lang, index } = jobs[next++];
            const table = row.content.text[lang].tasks[index].table;
            const name = lang === 'ru' ? 'русский' : 'English';
            let ok = false;
            for (let attempt = 1; attempt <= 3 && !ok; attempt += 1) {
                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [{ role: 'user', parts: [{ text: `Translate every cell of this table into ${name}. Keep the same JSON shape (head, rows), the same number of rows and cells, and every number, unit and date exactly. Proper names: transliterate to ${name} script. Return only JSON.\n\n${JSON.stringify(table)}` }] }],
                        config: { responseMimeType: 'application/json', temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } },
                    });
                    const result = parseAiJson(response.text || '');
                    if (shape(result) === shape(table) && digits(result) === digits(table) && flagged(result, lang) < flagged(table, lang)) {
                        row.content.text[lang].tasks[index].table = { head: result.head, rows: result.rows };
                        changed.add(row);
                        ok = true;
                    }
                } catch (error) {
                    if (/429|RESOURCE_EXHAUSTED/i.test(String((error as any)?.message))) await sleep(30000);
                }
            }
            if (!ok) kept += 1;
            done += 1;
            if (done % 20 === 0) console.log(`  ${done}/${jobs.length}`);
        }
    };
    await Promise.all(Array.from({ length: 5 }, worker));
    let saved = 0;
    for (const row of changed) {
        if (validateCareerTrial(row.content).length) continue;
        await db.query('UPDATE career_trials SET content = $2 WHERE "careerId" = $1', [row.careerId, JSON.stringify(row.content)]);
        saved += 1;
    }
    console.log(`Тамом: ${done - kept} ҷадвал тарҷума шуд, ${kept} бетағйир монд; ${saved} сенария нигоҳ дошта шуд.`);
    await db.end();
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
