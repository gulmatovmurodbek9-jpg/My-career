/* eslint-disable no-console */
// Интиқоли сенарияҳои ихтисосҳо байни компютер ва сервер (аз рӯи рамзи ихтисос,
// на id — id-ҳо дар ду база метавонанд фарқ кунанд):
//   npm run trials:export -- trials.json      (дар компютер)
//   npm run trials:import -- trials.json      (дар сервер; ҳар сенария аз нав санҷида мешавад)
import 'dotenv/config';
import * as fs from 'fs';
import { Client } from 'pg';
import { validateCareerTrial } from './career-trial';
import { CREATE_TABLE } from './career-trials.table';

async function main() {
    const [mode, file] = process.argv.slice(2);
    if (!['export', 'import'].includes(mode) || !file) throw new Error('Истифода: export|import <file.json>');
    const db = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'career_db',
    });
    await db.connect();
    await db.query(CREATE_TABLE);

    if (mode === 'export') {
        const { rows } = await db.query(`
            SELECT c.code, t.content, t.model, t.status, t."createdAt"
            FROM career_trials t JOIN career c ON c.id = t."careerId" ORDER BY c.code`);
        fs.writeFileSync(file, JSON.stringify(rows));
        console.log(`Содир шуд: ${rows.length} сенария → ${file}`);
    } else {
        const rows: any[] = JSON.parse(fs.readFileSync(file, 'utf8'));
        let saved = 0;
        const skipped: string[] = [];
        for (const row of rows) {
            const errors = validateCareerTrial(row.content);
            const { rows: found } = await db.query('SELECT id FROM career WHERE code = $1', [row.code]);
            if (errors.length || !found[0]) {
                skipped.push(`${row.code}: ${errors[0] || 'ихтисос ёфт нашуд'}`);
                continue;
            }
            await db.query(
                `INSERT INTO career_trials ("careerId", content, model, status, "createdAt") VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT ("careerId") DO UPDATE SET content = EXCLUDED.content, model = EXCLUDED.model, status = EXCLUDED.status, "createdAt" = EXCLUDED."createdAt"`,
                [found[0].id, JSON.stringify(row.content), row.model, row.status || 'ai', row.createdAt || new Date()],
            );
            saved += 1;
        }
        console.log(`Ворид шуд: ${saved}, гузаронида: ${skipped.length}`);
        skipped.slice(0, 20).forEach((line) => console.log(`  - ${line}`));
    }
    await db.end();
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
