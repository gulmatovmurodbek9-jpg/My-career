/* eslint-disable no-console */
// Ислоҳҳои механикӣ (бе AI) дар ҳамаи сенарияҳо — баъди таҳрири AI:
//   npm run trials:fix            — ислоҳ ва нигоҳ доштан (ҳар сенария баъд аз ислоҳ аз нав санҷида мешавад)
//   npm run trials:fix -- --dry   — танҳо нишон додан
import 'dotenv/config';
import { Client } from 'pg';
import { LANGS, validateCareerTrial } from './career-trial';
import { Lang } from './trial.types';

const DRY = process.argv.includes('--dry');

// Ҳарфҳои лотинӣ, ки бо кириллӣ якхела менамоянд.
const LATIN_TO_CYR: Record<string, string> = { a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', x: 'х', y: 'у', A: 'А', E: 'Е', O: 'О', P: 'Р', C: 'С', X: 'Х', H: 'Н', K: 'К', M: 'М', T: 'Т', B: 'В' };
const TJ_TO_LATIN: Record<string, string> = { ӣ: 'i', Ӣ: 'I', ӯ: 'u', Ӯ: 'U', қ: 'q', Қ: 'Q', ғ: 'gh', Ғ: 'Gh', ҳ: 'h', Ҳ: 'H', ҷ: 'j', Ҷ: 'J' };

export function fixText(text: string, lang: Lang): string {
    let out = text
        // Markdown дар матни оддӣ намоиш дода намешавад: «*   Фоида» → «• Фоида», «*Salmonella*» → «Salmonella».
        .replace(/^[ \t]*[*-][ \t]+(?=\S)/gm, '• ')
        .replace(/\*\*?([A-Za-zА-Яа-яЁёӢӣӮӯҚқҒғҲҳҶҷ][^*\n]*?[A-Za-zА-Яа-яЁёӢӣӮӯҚқҒғҲҳҶҷ.)])\*?\*/g, '$1')
        .replace(/(\S) {2,}(?=\S)/g, '$1 ')
        // Калимаи кириллӣ бо як ҳарфи лотинии «ҳамшакл» дар дохилаш: «бояoед» → «бояоед» → (AI «бояд»-ро ислоҳ кардааст).
        // Танҳо як ҳарф, ки ҳарду тарафаш кириллӣ аст («стабилитронoв»); «PLCҳо» — ихтисора, бетағйир.
        .replace(/([а-яёӣӯқғҳҷ])([aeopcxyAEOPCXHKMTB])(?=[а-яёӣӯқғҳҷ])/gi, (_, before, ch) => before + (LATIN_TO_CYR[ch] || ch));
    if (lang === 'en') {
        // «Vaҳdat», «Dustӣ» → «Vahdat», «Dusti» (танҳо дар калимаҳои лотинӣ).
        out = out.replace(/[A-Za-z]+[ӣӯқғҳҷӢӮҚҒҲҶ][A-Za-zӣӯқғҳҷӢӮҚҒҲҶ]*|[ӣӯқғҳҷӢӮҚҒҲҶ][A-Za-z]+/g, (word) =>
            word.replace(/[ӣӯқғҳҷӢӮҚҒҲҶ]/g, (ch) => TJ_TO_LATIN[ch] || ch));
    }
    return out;
}

function walk(value: any, lang: Lang, onChange: (before: string, after: string) => void): any {
    if (typeof value === 'string') {
        const fixed = fixText(value, lang);
        if (fixed !== value) onChange(value, fixed);
        return fixed;
    }
    if (Array.isArray(value)) return value.map((item) => walk(item, lang, onChange));
    if (value && typeof value === 'object') {
        // id, расмҳо (code) ва ҷадвалҳо — бетағйир.
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, ['id', 'code', 'table', 'time'].includes(key) ? item : walk(item, lang, onChange)]));
    }
    return value;
}

async function main() {
    const db = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'career_db',
    });
    await db.connect();
    const { rows } = await db.query('SELECT t."careerId", c.code, t.content FROM career_trials t JOIN career c ON c.id = t."careerId"');
    let changed = 0;
    let fixes = 0;
    let shown = 0;
    for (const row of rows) {
        let local = 0;
        const text: any = {};
        for (const lang of LANGS) {
            text[lang] = walk(row.content.text[lang], lang, (before, after) => {
                local += 1;
                if (shown < 15) {
                    shown += 1;
                    console.log(`${row.code} [${lang}]\n  − ${before.slice(0, 140)}\n  + ${after.slice(0, 140)}`);
                }
            });
        }
        if (!local) continue;
        const updated = { keys: row.content.keys, text };
        const errors = validateCareerTrial(updated);
        if (errors.length) {
            console.log(`  ✗ ${row.code}: баъди ислоҳ санҷиш нагузашт (${errors[0]}) — гузаронида шуд`);
            continue;
        }
        changed += 1;
        fixes += local;
        if (!DRY) await db.query('UPDATE career_trials SET content = $2 WHERE "careerId" = $1', [row.careerId, JSON.stringify(updated)]);
    }
    console.log(`${DRY ? '[санҷиш] ' : ''}Ислоҳ шуд: ${fixes} сатр дар ${changed} сенария.`);
    await db.end();
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
