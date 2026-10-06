/* eslint-disable no-console */
// Ҳисобот: хатоҳои механикӣ дар ҳамаи сенарияҳои ихтисосҳо (бе AI).
//   npm run trials:scan            — ҷамъбаст аз рӯи қоида ва забон + 3 мисол
import 'dotenv/config';
import { Client } from 'pg';
import { LANGS } from './career-trial';
import { collectStrings, lintText } from './text-lint';

async function main() {
    const db = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'career_db',
    });
    await db.connect();
    const { rows } = await db.query('SELECT c.code, t.content FROM career_trials t JOIN career c ON c.id = t."careerId"');
    const summary = new Map<string, { count: number; careers: Set<string>; samples: string[] }>();
    let strings = 0;
    for (const row of rows) {
        for (const lang of LANGS) {
            for (const { path, text } of collectStrings(row.content.text[lang])) {
                if (/\.code$/.test(path) || /\.table\./.test(path)) continue;
                strings += 1;
                for (const issue of lintText(text, lang)) {
                    const key = `${lang} · ${issue.rule}`;
                    const entry = summary.get(key) || { count: 0, careers: new Set(), samples: [] };
                    entry.count += 1;
                    entry.careers.add(row.code);
                    if (entry.samples.length < 3) entry.samples.push(`${row.code} ${path}: «${issue.sample}»`);
                    summary.set(key, entry);
                }
            }
        }
    }
    console.log(`Сенарияҳо: ${rows.length} · сатрҳо: ${strings}`);
    for (const [key, entry] of [...summary.entries()].sort((a, b) => b[1].count - a[1].count)) {
        console.log(`\n${key}: ${entry.count} (дар ${entry.careers.size} сенария)`);
        entry.samples.forEach((sample) => console.log(`   ${sample}`));
    }
    await db.end();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
