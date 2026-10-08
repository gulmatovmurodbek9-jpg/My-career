/* eslint-disable no-console */
// Сенарияҳои 8-вазифагиро ба 4 вазифа кӯтоҳ мекунад (2 касбӣ + 2 бо одамон) — бе AI:
// аз ҳар гурӯҳ соддатаринҳо (матни кӯтоҳтар, бе истилоҳи техникӣ) бо ҳамон тартиби рӯз.
//   npm run trials:shrink -- --dry     — танҳо ҳисобот
//   npm run trials:shrink              — нигоҳ доштан (ҳар сенария баъд аз нав санҷида мешавад)
import 'dotenv/config';
import { Client } from 'pg';
import { HARD_TASKS, LANGS, SOFT_TASKS, technicalIssues, validateCareerTrial } from './career-trial';

const DRY = process.argv.includes('--dry');

// Душворӣ: ҳарчи матн дарозтар — ҳамон қадар вазнинтар; истилоҳи техникӣ — тақрибан манъ.
export function difficulty(task: any, kind: string): number {
    const text = [task?.prompt, task?.quote, task?.code, task?.question, ...(task?.options || []).map((o: any) => o?.text),
        ...(task?.table ? [...(task.table.head || []), ...(task.table.rows || []).flat()] : [])].filter(Boolean).join(' ');
    return text.length + (technicalIssues(task).length ? 5000 : 0) + (kind === 'order' ? 150 : 0);
}

export function shrinkTrial(content: any): any {
    const keys = content.keys;
    if (keys.length === HARD_TASKS + SOFT_TASKS) return content;
    const tj = content.text.tj.tasks;
    const score = (i: number) => difficulty(tj[i], keys[i].kind);
    const hardPool = keys.map((_: any, i: number) => i).filter((i: number) => keys[i].skill === 'hard');
    const softPool = keys.map((_: any, i: number) => i).filter((i: number) => keys[i].skill === 'soft');
    const pick = (pool: number[], n: number) => [...pool].sort((a, b) => score(a) - score(b)).slice(0, n);
    let chosen = [...pick(hardPool, HARD_TASKS), ...pick(softPool, SOFT_TASKS)];
    // Камаш як вазифаи «тартиб» ё «чанд ҷавоб» — барои гуногунӣ.
    if (!chosen.some((i) => keys[i].kind !== 'choice')) {
        const swaps = [...hardPool, ...softPool]
            .filter((i) => !chosen.includes(i) && keys[i].kind !== 'choice')
            .map((i) => {
                const group = keys[i].skill === 'hard' ? hardPool : softPool;
                const out = chosen.filter((c) => group.includes(c)).sort((a, b) => score(b) - score(a))[0];
                return { in: i, out, cost: score(i) - score(out) };
            })
            .sort((a, b) => a.cost - b.cost);
        if (swaps[0]) chosen = chosen.map((i) => (i === swaps[0].out ? swaps[0].in : i));
    }
    chosen.sort((a, b) => a - b);
    const out = JSON.parse(JSON.stringify(content));
    out.keys = chosen.map((i, n) => ({ ...keys[i], id: `t${n + 1}` }));
    for (const lang of LANGS) out.text[lang].tasks = chosen.map((i) => content.text[lang].tasks[i]);
    return out;
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
    const { rows } = await db.query('SELECT "careerId", content FROM career_trials');
    let changed = 0;
    let bad = 0;
    for (const row of rows) {
        const next = shrinkTrial(row.content);
        if (next === row.content) continue;
        const errors = validateCareerTrial(next);
        if (errors.length) {
            bad += 1;
            console.log(`  ✗ ${row.careerId}: ${errors.slice(0, 3).join('; ')}`);
            continue;
        }
        changed += 1;
        if (!DRY) await db.query('UPDATE career_trials SET content = $2 WHERE "careerId" = $1', [row.careerId, JSON.stringify(next)]);
    }
    console.log(`${DRY ? 'Санҷиш' : 'Кӯтоҳ шуд'}: ${changed} сенария, нашуд: ${bad}, аллакай 4: ${rows.length - changed - bad}`);
    await db.end();
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
