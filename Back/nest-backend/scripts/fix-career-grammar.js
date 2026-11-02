// Ислоҳи забонии матни тоҷикии ихтисосҳо дар база (бе дубора seed, то тарҷумаҳо нигоҳ дошта шаванд).
//   node scripts/fix-career-grammar.js          — танҳо нишон медиҳад
//   node scripts/fix-career-grammar.js --apply  — менависад (аввал нусхаи заҳиравии база гиред)
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const MAP = require('./career-grammar-map.json');

const COLUMNS = ['description', 'purpose', 'skills', 'technologies', 'roadmap', 'projectsExamples', 'learningResources', 'careerOpportunities', 'salaryAndMarket', 'relatedSpecializations', 'advice', 'certification'];
const fix = (text) => MAP.reduce((out, [from, to]) => out.split(from).join(to), text);

const fixValue = (value) => {
    if (typeof value === 'string') return fix(value);
    if (Array.isArray(value)) return value.map(fixValue);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fixValue(v)]));
    return value;
};

(async () => {
    const apply = process.argv.includes('--apply');
    const client = process.env.DATABASE_URL
        ? new Client({ connectionString: process.env.DATABASE_URL })
        : new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 5432, user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
    await client.connect();
    const quoted = COLUMNS.map((c) => `"${c}"`).join(', ');
    const { rows } = await client.query(`SELECT id, ${quoted} FROM career`);
    let changed = 0;
    for (const row of rows) {
        const sets = [];
        const params = [row.id];
        for (const column of COLUMNS) {
            const next = fixValue(row[column]);
            if (JSON.stringify(next) === JSON.stringify(row[column])) continue;
            const isJson = next !== null && typeof next === 'object';
            params.push(isJson ? JSON.stringify(next) : next);
            sets.push(`"${column}" = $${params.length}${isJson ? '::jsonb' : ''}`);
        }
        if (!sets.length) continue;
        changed += 1;
        if (apply) await client.query(`UPDATE career SET ${sets.join(', ')} WHERE id = $1`, params);
    }
    console.log(`${changed} аз ${rows.length} ихтисос ${apply ? 'ислоҳ шуд' : 'ислоҳ мешавад (--apply иҷро нашуд)'}`);
    await client.end();
})().catch((error) => { console.error(error.message); process.exit(1); });
