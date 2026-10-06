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
    // Нохунакҳои дохили ҳам бе пӯшиш: «Корти бонкӣ «Наврӯз» → «Корти бонкӣ „Наврӯз“».
    const balance = (s: string) => (s.match(/«/g) || []).length - (s.match(/»/g) || []).length;
    if (balance(out) > 0) out = out.replace(/«([^«»]*)«([^«»]*)»/g, '«$1„$2“»');
    if (balance(out) === 1 && out.lastIndexOf('«') > out.lastIndexOf('»')) out = out.replace(/([.!?…]?)\s*$/, '»$1');
    // Ихтисораи лотинӣ бо ҳарфи кириллии ҳамшакл: «VТ» → «VT».
    out = out.replace(/\b[A-Z]+[АВЕКМНОРСТХ][A-ZАВЕКМНОРСТХ]*(?![A-Za-zА-Яа-яЁё])/g, (word) => word.replace(/[АВЕКМНОРСТХ]/g, (ch) => CYR_TO_LATIN[ch] || ch));
    // Як ҳарфи лотинӣ дар калимаи кириллӣ, ки ҳамшакл нест: «Дарzмол» → «Дарзмол».
    out = out.replace(/([а-яёӣӯқғҳҷ])([zdfgijlqrsvw])(?=[а-яёӣӯқғҳҷ])/gi, (_, before, ch) => before + (LATIN_LETTER_TO_CYR[ch.toLowerCase()] || ch));
    // Калимаи такрорӣ (ҳарфҳо айнан якхела — «В в» дар «точки В в точку» дуруст аст):
    // пешояндҳо ва пайвандакҳо ҳеҷ гоҳ дукарата намеоянд. «муҳим муҳим», «калон калон» — метавонад дуруст бошад.
    out = out.replace(/(^|[\s(«“])(ба|аз|бо|дар|ва|то|and|an|or|to|the|a|in|of|и|на)\s+\2(?=[\s,.!?;:»”)]|$)/g, '$1$2');
    // «бинобар ин ин иҷозатнома» = «бинобар ин, ин иҷозатнома».
    out = out.replace(/([Бб]инобар|[Бб]арои|[Аа]з) ин ин(?=\s)/g, '$1 ин, ин');
    if (lang === 'en') {
        // «Vaҳdat», «Dustӣ» → «Vahdat», «Dusti» (танҳо дар калимаҳои лотинӣ).
        out = out.replace(/[A-Za-z]+[ӣӯқғҳҷӢӮҚҒҲҶ][A-Za-zӣӯқғҳҷӢӮҚҒҲҶ]*|[ӣӯқғҳҷӢӮҚҒҲҶ][A-Za-z]+/g, (word) =>
            word.replace(/[ӣӯқғҳҷӢӮҚҒҲҶ]/g, (ch) => TJ_TO_LATIN[ch] || ch));
        // «Guldaст», «Oriyоn», «Voх» → «Guldast», «Oriyon», «Vox» (калимаи лотинӣ бо ҳарфҳои кириллӣ дар охир/мобайн).
        out = out.replace(/\b[A-Za-z]{2,}[а-яё]+[A-Za-zа-яё]*(?![A-Za-zА-Яа-яЁё])/g, (word) => word.replace(/[а-яё]/g, (ch) => CYR_LETTER_TO_LATIN[ch] ?? ch));
    }
    return out;
}

const CYR_TO_LATIN: Record<string, string> = { А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X' };
const LATIN_LETTER_TO_CYR: Record<string, string> = { z: 'з', d: 'д', f: 'ф', g: 'г', i: 'и', j: 'ҷ', l: 'л', q: 'қ', r: 'р', s: 'с', v: 'в', w: 'в' };
const CYR_LETTER_TO_LATIN: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya', ь: '', ъ: '',
};

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
