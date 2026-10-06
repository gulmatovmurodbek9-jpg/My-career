/* eslint-disable no-console */
// Таҳрири грамматикии сенарияҳои ихтисосҳо (AI-муҳаррир) — танҳо имло, грамматика, пунктуатсия
// ва ибораҳои ғайритабиӣ; маъно, рақамҳо, сохтор ва id-ҳо тағйир намеёбанд. Натиҷа қатъӣ
// санҷида мешавад; агар нагузарад — матни аслӣ мемонад.
//   npm run trials:proofread -- --limit 3 --show      — пилот бо нишон додани тағйирот
//   npm run trials:proofread -- --concurrency 5       — ҳамаи сенарияҳое, ки ҳанӯз таҳрир нашудаанд
//   npm run trials:proofread -- --codes 1020206 --force
import 'dotenv/config';
import { Client } from 'pg';
import { GoogleGenAI } from '@google/genai';
import { CareerTrialContent, LANGS, parseAiJson, validateCareerTrial } from './career-trial';
import { collectStrings } from './text-lint';
import { Lang } from './trial.types';

const args = process.argv.slice(2);
const value = (name: string) => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : undefined;
};
const LIMIT = Number(value('limit')) || Infinity;
const CODES = value('codes')?.split(',').map((code) => code.trim()).filter(Boolean);
const FORCE = args.includes('--force');
const SHOW = args.includes('--show');
const CONCURRENCY = Math.max(1, Math.min(8, Number(value('concurrency')) || 4));
const MODEL = process.env.PROOFREAD_MODEL || 'gemini-2.5-flash';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GUIDE: Record<Lang, string> = {
    tj: `Забон: тоҷикии адабӣ (кириллица). Ислоҳ кун: имло (ӣ/и, ӯ/у, қ/к, ғ/г, ҳ/х, ҷ/ч дар ҷои дуруст), изофа (-и/-и), пасвандҳо (-ро, -ҳо, -ҳои), мувофиқати феъл бо фоил, шакли «шумо» (кунед, бифаҳмед), пунктуатсия, калимаҳои такрорӣ, калимаҳои русии нолозим (агар муодили маъмули тоҷикӣ бошад; истилоҳҳои техникӣ, ки дар Тоҷикистон бо русӣ маъмуланд, монанд), ибораҳои ғайритабиӣ ё калима ба калима аз русӣ/англисӣ. Имлои расмиро риоя кун: «хизмат», «хизматрасонӣ» (на «хидмат»), «талабот» (на «талаботҳо»), «шӯъба», «мӯҳлат», «истилоҳот/истилоҳҳо» ҳарду дуруст. Агар калима ё ибора аллакай дуруст бошад ё ду шакли маъмули дуруст дошта бошад — ба он даст назан; танҳо хатои аёнро ислоҳ кун.`,
    ru: `Язык: русский литературный. Исправь орфографию, грамматику, пунктуацию, согласование, канцелярит и кальки. Таджикские имена и топонимы пиши по-русски без таджикских букв (Фирӯза → Фируза, Ҳисор → Гиссар, Хуҷанд → Худжанд, Кӯлоб → Куляб, Ваҳдат → Вахдат, Турсунзода → Турсунзаде). Обращение на «вы».`,
    en: `Language: natural English. Fix spelling, grammar, punctuation, awkward or literal phrasing. Tajik names and places in Latin letters without Cyrillic or Tajik letters (Dustӣ → Dusti, Vaҳdat → Vahdat, Khujand, Kulob). Keep text in other languages ONLY where the task is about that language (e.g. a translation exercise).`,
};

const prompt = (lang: Lang, text: unknown) => `Ту муҳаррири касбӣ ҳастӣ. Ин JSON-и сенарияи касбинтихобкунӣ барои хонандагони 15–17-соларо таҳрир кун.
${GUIDE[lang]}

ҚОИДАҲОИ ҚАТЪӢ:
- Маъно, далелҳо ва дурустии ҷавобҳоро ИВАЗ НАКУН. Ҳамаи РАҚАМҲО, воҳидҳо, вақтҳо, рамзҳо ва номҳоро айнан нигоҳ дор.
- Сохтори JSON, ҳамаи калидҳо, тартиби элементҳо ва ҳамаи "id"-ҳо айнан ҳамон монанд.
- Майдонҳои "code" ва "table"-ро ба ҳамон шакл нигоҳ дор (танҳо ғалатҳои чопии аён).
- Агар ҷумла дуруст бошад — ба он даст назан. Услубро бе сабаб иваз накун.
- Дар дохили матн нохунаки дукабата (") нагузор.
- Ҷавоб — танҳо JSON-и таҳриршуда.

${JSON.stringify(text)}`;

// Рақамҳо набояд тағйир ёбанд — вагарна ҷавоби дурусти вазифа вайрон мешавад.
const numbers = (strings: Array<{ text: string }>) => strings.flatMap(({ text }) => text.match(/\d+(?:[.,]\d+)?/g) || []).sort().join('|');

export function checkEdit(before: any, after: any): string | null {
    const a = collectStrings(before);
    const b = collectStrings(after);
    if (a.length !== b.length) return `шумораи сатрҳо ${a.length} → ${b.length}`;
    for (let i = 0; i < a.length; i += 1) {
        if (a[i].path !== b[i].path) return `сохтор: ${a[i].path} → ${b[i].path}`;
        const ratio = b[i].text.length / Math.max(1, a[i].text.length);
        if (a[i].text.length > 20 && (ratio < 0.6 || ratio > 1.5)) return `дарозӣ: ${a[i].path}`;
    }
    if (numbers(a) !== numbers(b)) return 'рақамҳо тағйир ёфтанд';
    const ids = (t: any) => JSON.stringify((t?.tasks || []).map((task: any) => (task?.options || []).map((o: any) => o?.id)));
    if (ids(before) !== ids(after)) return 'id-ҳо тағйир ёфтанд';
    return null;
}

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
    const { rows } = await db.query(`
        SELECT t."careerId", c.code, c.name, t.content FROM career_trials t JOIN career c ON c.id = t."careerId"
        WHERE ($1::text[] IS NULL OR c.code = ANY($1)) AND ($2 OR t.status <> 'proofread')
        ORDER BY c.code`, [CODES || null, FORCE]);
    const queue = rows.slice(0, LIMIT);
    console.log(`Таҳрир: ${queue.length} сенария · модел ${MODEL} · ҳамзамон ${CONCURRENCY}`);

    const edit = async (lang: Lang, text: any) => {
        for (let attempt = 1, waits = 0; attempt <= 3; attempt += 1) {
            try {
                const response = await ai.models.generateContent({
                    model: MODEL,
                    contents: [{ role: 'user', parts: [{ text: prompt(lang, text) }] }],
                    config: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 60000, thinkingConfig: { thinkingBudget: 1024 } },
                });
                const result = parseAiJson(response.text || '');
                const problem = checkEdit(text, result);
                if (!problem) return { text: result, kept: false };
                console.log(`  ↻ ${lang} (кӯшиши ${attempt}): ${problem}`);
            } catch (error) {
                if (/429|RESOURCE_EXHAUSTED/i.test(String((error as any)?.message)) && waits < 12) {
                    waits += 1;
                    attempt -= 1;
                    await sleep(30000 + Math.random() * 60000);
                    continue;
                }
                console.log(`  ✗ ${lang} (кӯшиши ${attempt}): ${String((error as any)?.message || error).slice(0, 140)}`);
                await sleep(3000 * attempt);
            }
        }
        return { text, kept: true };
    };

    let done = 0;
    let changedStrings = 0;
    let keptLangs = 0;
    const started = Date.now();
    let next = 0;
    const worker = async () => {
        while (next < queue.length) {
            const row = queue[next++];
            const content: CareerTrialContent = row.content;
            const results = await Promise.all(LANGS.map((lang) => edit(lang, content.text[lang])));
            const updated: CareerTrialContent = { keys: content.keys, text: { tj: results[0].text, ru: results[1].text, en: results[2].text } };
            const errors = validateCareerTrial(updated);
            let changes = 0;
            if (!errors.length) {
                LANGS.forEach((lang, i) => {
                    const a = collectStrings(content.text[lang]);
                    const b = collectStrings(updated.text[lang]);
                    a.forEach((item, j) => {
                        if (item.text !== b[j].text) {
                            changes += 1;
                            if (SHOW && changes <= 12) console.log(`   [${lang}] ${item.path}\n     − ${item.text.slice(0, 160)}\n     + ${b[j].text.slice(0, 160)}`);
                        }
                    });
                    if (results[i].kept) keptLangs += 1;
                });
                await db.query(`UPDATE career_trials SET content = $2, status = 'proofread' WHERE "careerId" = $1`, [row.careerId, JSON.stringify(updated)]);
            } else {
                console.log(`  ✗ ${row.code}: баъди таҳрир санҷиш нагузашт (${errors.slice(0, 2).join('; ')}) — аслӣ монд`);
                await db.query(`UPDATE career_trials SET status = 'proofread' WHERE "careerId" = $1`, [row.careerId]);
            }
            done += 1;
            changedStrings += changes;
            const minutes = (Date.now() - started) / 60000;
            console.log(`✓ [${done}/${queue.length}] ${row.code} ${row.name} · ${changes} сатр ислоҳ шуд · боқӣ ~${Math.round((minutes / done) * (queue.length - done))} дақ`);
        }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log(`Тамом: ${done} сенария, ${changedStrings} сатр ислоҳ шуд, ${keptLangs} забон бе тағйир монд (таҳрир санҷишро нагузашт).`);
    await db.end();
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
