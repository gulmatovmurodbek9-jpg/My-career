// Балҳои гузаришро аз src/seed/data/ntc-scores.json ба база ворид мекунад.
// Ҷадвалро худаш месозад, барои ҳамин дар сервер ҳам кор мекунад
// (он ҷо synchronize хомӯш аст). Иҷро: node import-scores.js
const fs = require('path') && require('fs');
const path = require('path');
const { Client } = require('pg');

const DATA = path.join(__dirname, 'src', 'seed', 'data', 'ntc-scores.json');
const ENV_PATH = path.join(__dirname, '.env');

const ENV = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
const env = (key, fallback) =>
    process.env[key] || ENV.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim() || fallback;

const client = new Client({
    host: env('DB_HOST', 'localhost'),
    port: Number(env('DB_PORT', '5432')),
    user: env('DB_USERNAME', 'postgres'),
    password: env('DB_PASSWORD', 'postgres'),
    database: env('DB_NAME', 'career_db'),
});

const CREATE = `
CREATE TABLE IF NOT EXISTS admission_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    year int NOT NULL,
    code varchar(20) NOT NULL,
    university varchar(300) NOT NULL,
    "studyForm" varchar(60),
    "paymentType" varchar(60),
    seats int,
    competition real,
    score real
);
CREATE INDEX IF NOT EXISTS idx_admission_code_year ON admission_scores (code, year);
`;

(async () => {
    if (!fs.existsSync(DATA)) {
        console.error(`Файли маълумот нест: ${DATA}`);
        process.exit(1);
    }

    const pack = JSON.parse(fs.readFileSync(DATA, 'utf8'));
    const { universities, studyForms, paymentTypes, rows } = pack;
    console.log(`Файл: ${rows.length} сатр, манбаъ ${pack.source}, санаи ҷамъоварӣ ${pack.fetchedAt}`);

    await client.connect();
    await client.query(CREATE);
    await client.query('TRUNCATE admission_scores');

    // Дастаҳои 1000-сатрӣ: як дархост ба ҷойи 23 ҳазор.
    const CHUNK = 1000;
    let done = 0;

    for (let start = 0; start < rows.length; start += CHUNK) {
        const slice = rows.slice(start, start + CHUNK);
        const values = [];
        const holders = [];

        slice.forEach((row, index) => {
            const [year, code, uni, form, pay, seats, competition, score] = row;
            const base = index * 8;
            holders.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`);
            values.push(
                year,
                String(code),
                universities[uni] ?? '',
                studyForms[form] ?? null,
                paymentTypes[pay] ?? null,
                seats,
                competition,
                score,
            );
        });

        await client.query(
            `INSERT INTO admission_scores (year, code, university, "studyForm", "paymentType", seats, competition, score) VALUES ${holders.join(',')}`,
            values,
        );
        done += slice.length;
        process.stdout.write(`\r  ворид шуд: ${done}/${rows.length}`);
    }

    console.log('');

    const check = await client.query(`
        SELECT count(*)::int AS total,
               count(DISTINCT code)::int AS codes,
               min(year) AS aз,
               max(year) AS to
        FROM admission_scores
    `);
    const matched = await client.query(`
        SELECT count(DISTINCT c.id)::int AS n
        FROM career c JOIN admission_scores a ON a.code = c.code
    `);

    const r = check.rows[0];
    console.log(`Дар база: ${r.total} сатр, ${r.codes} код, солҳо ${r.aз}–${r.to}`);
    console.log(`Ихтисосҳои бо бал: ${matched.rows[0].n}`);

    await client.end();
})().catch((error) => {
    console.error(String(error).slice(0, 300));
    process.exit(1);
});
