// Синфи намоишӣ барои ҳакамон ва омӯзгорон: роҳбари синф, омӯзгори технология (ёрирасон,
// самти техникӣ), хонанда бо ҳисоб ва 24 хонандаи бе почта бо натиҷаҳои воқеӣ.
//   node scripts/seed-demo-class.js [файли-паролҳо]
// Чанд бор иҷро кардан бехатар аст: синфи «NAMUNA» ва маълумоти он аз нав сохта мешаванд.
// Парол: DEMO_PASSWORD ё тасодуфӣ; ба файл навишта мешавад (дар консол чоп намешавад).
require('dotenv').config({ quiet: true });
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Client } = require('pg');

const CODE = 'NAMUNA';
const OUT = process.argv[2] || '/root/demo-accounts.txt';
const PASSWORD = process.env.DEMO_PASSWORD || `Namuna-${crypto.randomBytes(3).toString('hex')}`;
const ACCOUNTS = {
    owner: { email: 'namuna.omuzgor@ikhtisosiman.tj', name: 'Мавлуда Каримова', role: 'teacher' },
    co: { email: 'namuna.texnologiya@ikhtisosiman.tj', name: 'Фирӯз Назаров', role: 'teacher' },
    student: { email: 'namuna.khonanda@ikhtisosiman.tj', name: 'Ҷамшед Раҳимов', role: 'user' },
};
// Номҳо ва самти асосии ҳар хонанда (null — ҳанӯз тест нагузаштааст).
const STUDENTS = [
    ['Фарзона Алиева', 3], ['Шаҳром Назаров', 1], ['Мадина Раҷабова', 5], ['Комрон Саидов', 1],
    ['Нигина Қодирова', 4], ['Бахтовар Юсупов', 2], ['Зарина Ҳасанова', 3], ['Далер Шарипов', 1],
    ['Меҳрона Каримова', 5], ['Исмоил Раҳмонов', 2], ['Сабрина Азизова', 4], ['Фирдавс Мирзоев', 1],
    ['Гулноза Шоева', 3], ['Умед Давлатов', 2], ['Парвина Сафарова', 5], ['Рустам Олимов', 1],
    ['Шаҳноза Нуриддинова', 4], ['Акмал Ғаниев', 2], ['Малика Холова', 3], ['Сино Бобоев', 1],
    ['Ситора Иброҳимова', 4], ['Наврӯз Ҷӯраев', null], ['Дилноза Усмонова', null], ['Абдулло Қурбонов', null],
];
const rand = (() => { let seed = 42; return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; })();
const pick = (list) => list[Math.floor(rand() * list.length)];
const daysAgo = (d) => new Date(Date.now() - d * 86_400_000 - Math.floor(rand() * 8) * 3_600_000).toISOString();
const currentYear = () => { const now = new Date(); const s = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; return `${s}-${s + 1}`; };

(async () => {
    const db = new Client({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
    await db.connect();
    const q = (sql, params) => db.query(sql, params).then((r) => r.rows);

    // 1. Ҳисобҳо (почта тасдиқшуда, бо парол).
    const hash = await bcrypt.hash(PASSWORD, 10);
    const users = {};
    for (const [key, a] of Object.entries(ACCOUNTS)) {
        await q(`INSERT INTO "user" (email, name, role, password, "emailVerified") VALUES ($1, $2, $3, $4, true)
                 ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, password = EXCLUDED.password, "emailVerified" = true`,
            [a.email, a.name, a.role, hash]);
        [users[key]] = await q('SELECT id FROM "user" WHERE email = $1', [a.email]);
    }

    // 2. Синфи пешина ва маълумоти он.
    const [old] = await q('SELECT id FROM classrooms WHERE code = $1', [CODE]);
    if (old) {
        const guests = (await q('SELECT "guestId" FROM classroom_members WHERE "classroomId" = $1 AND "guestId" IS NOT NULL', [old.id])).map((r) => r.guestId);
        await q('DELETE FROM quiz_attempts WHERE "guestId" = ANY($1::uuid[])', [guests]);
        await q('DELETE FROM trial_attempts WHERE "guestId" = ANY($1::uuid[])', [guests]);
        await q('DELETE FROM classrooms WHERE id = $1', [old.id]);
        await q('DELETE FROM classroom_guests WHERE id = ANY($1::uuid[])', [guests]);
    }
    await q('DELETE FROM quiz_attempts WHERE "userId" = $1', [users.student.id]);
    await q('DELETE FROM trial_attempts WHERE "userId" = $1', [users.student.id]);
    await q('DELETE FROM parent_invites WHERE "userId" = $1', [users.student.id]).catch(() => {});

    // 3. Ихтисосҳо аз рӯи самт (аввал онҳое, ки санҷиш доранд).
    const careers = {};
    for (let n = 1; n <= 5; n += 1) {
        careers[n] = await q(`SELECT c.id, c.name, EXISTS (SELECT 1 FROM career_trials t WHERE t."careerId" = c.id) AS trial
                              FROM career c WHERE c."mmtCluster" = $1
                              ORDER BY trial DESC, c."likesCount" DESC NULLS LAST, c.name LIMIT 10`, [n]);
    }

    // 4. Синф ва омӯзгори ёрирасон.
    const [room] = await q(`INSERT INTO classrooms (code, name, school, city, district, grade, "teacherId", "schoolYear")
                            VALUES ($1, '11 «А»', 'Мактаби №5', 'Хуҷанд', 'Шаҳри Хуҷанд', 11, $2, $3) RETURNING id`, [CODE, users.owner.id, currentYear()]);
    await q(`INSERT INTO classroom_teachers ("classroomId", "teacherId", subject, focus) VALUES ($1, $2, 'Технология', 'c1')`, [room.id, users.co.id]);

    const scoresFor = (top) => {
        const s = {};
        for (let n = 1; n <= 5; n += 1) s[`c${n}`] = n === top ? 24 + Math.round(rand() * 80) / 10 : 6 + Math.round(rand() * 110) / 10;
        return s;
    };
    const topCareersFor = (top) => {
        // Аз 6-тои аввал — то дар синф ихтисосҳои «маъмул» пайдо шаванд.
        const pool = careers[top].slice(0, 6);
        const chosen = [];
        while (chosen.length < Math.min(3, pool.length)) { const c = pick(pool); if (!chosen.includes(c)) chosen.push(c); }
        return chosen;
    };
    const addTrial = async (who, career, fit, day) => {
        const tasks = [1, 2, 3, 4].map((i) => ({ id: `t${i}`, solved: rand() < (fit ? 0.8 : 0.4), liked: rand() < (fit ? 0.85 : 0.25), perfect: false }));
        await q(`INSERT INTO trial_attempts (family, "careerId", solved, tasks, rating, "confBefore", "confAfter", "createdAt", "userId", "guestId")
                 VALUES ('career', $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [career.id, tasks.filter((t) => t.solved).length, JSON.stringify(tasks), fit ? 3 + Math.round(rand()) : 2, 2 + Math.round(rand()), fit ? 4 + Math.round(rand()) : 2 + Math.round(rand()), daysAgo(day), who.userId || null, who.guestId || null]);
    };

    // 5. Хонандагони бе почта.
    const members = [];
    for (const [index, [name, top]] of STUDENTS.entries()) {
        const [guest] = await q('INSERT INTO classroom_guests ("secretHash", "displayName") VALUES ($1, $2) RETURNING id', [crypto.randomBytes(32).toString('hex'), name]);
        const [member] = await q(`INSERT INTO classroom_members ("classroomId", "guestId", "displayName", "joinedAt") VALUES ($1, $2, $3, $4) RETURNING id`,
            [room.id, guest.id, name, daysAgo(12 - (index % 5))]);
        members.push({ id: member.id, name, top });
        if (!top) continue;
        const chosen = topCareersFor(top);
        await q(`INSERT INTO quiz_attempts (answers, scores, "topCluster", "topCareers", grade, "createdAt", "guestId") VALUES ('[]', $1, $2, $3, 11, $4, $5)`,
            [JSON.stringify(scoresFor(top)), `c${top}`, JSON.stringify(chosen.map(({ id, name: n }) => ({ id, name: n }))), daysAgo(8 - (index % 6)), guest.id]);
        if (index % 2 === 0) {
            const withTrial = chosen.find((c) => c.trial) || chosen[0];
            await addTrial({ guestId: guest.id }, withTrial, index % 6 !== 0, 3 + (index % 4));
        }
    }

    // 6. Хонанда бо ҳисоб: тест, захираҳо, рӯйхати ҳуҷҷатсупорӣ, санҷиш ва пайванди волидайн.
    const mine = careers[1].slice(0, 6);
    await q(`INSERT INTO classroom_members ("classroomId", "userId", "displayName", "joinedAt") VALUES ($1, $2, $3, $4)`, [room.id, users.student.id, ACCOUNTS.student.name, daysAgo(10)]);
    const studentScores = { c1: 31.5, c2: 14.2, c3: 9.8, c4: 12.1, c5: 7.4 };
    await q(`INSERT INTO quiz_attempts (answers, scores, "topCluster", "topCareers", grade, "createdAt", "userId") VALUES ('[]', $1, 'c1', $2, 11, $3, $4)`,
        [JSON.stringify(studentScores), JSON.stringify(mine.slice(0, 3).map(({ id, name }) => ({ id, name }))), daysAgo(6), users.student.id]);
    await q('DELETE FROM user_saved_careers WHERE "userId" = $1', [users.student.id]);
    for (const c of mine.slice(0, 3)) await q('INSERT INTO user_saved_careers ("userId", "careerId") VALUES ($1, $2) ON CONFLICT DO NOTHING', [users.student.id, c.id]);
    const offerings = [];
    for (const c of mine.slice(0, 4)) {
        const [o] = await q(`SELECT id FROM career_offerings WHERE "careerId" = $1 ORDER BY ("paymentType" = 'ройгон') DESC LIMIT 1`, [c.id]);
        if (o && offerings.length < 3) offerings.push(o.id);
    }
    await q(`UPDATE "user" SET "applicationChoices" = $2, "quizResults" = $3 WHERE id = $1`,
        [users.student.id, JSON.stringify(offerings), JSON.stringify({ mmtClusters: studentScores })]).catch(async () =>
        q(`UPDATE "user" SET "applicationChoices" = $2 WHERE id = $1`, [users.student.id, JSON.stringify(offerings)]));
    await addTrial({ userId: users.student.id }, mine.find((c) => c.trial) || mine[0], true, 2);

    const parentCode = Array.from({ length: 8 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[crypto.randomInt(31)]).join('');
    const parentScores = { c1: 33.3, c2: 22.2, c3: 0, c4: 11.1, c5: 33.3 };
    await q(`INSERT INTO parent_invites (code, "secretHash", "childName", "childScores", lang, relation, answers, "parentScores", wish, "answeredAt", "childCareers", "userId")
             VALUES ($1, $2, 'Ҷамшед', $3, 'tj', 'father', $4, $5, 'c1', now(), $6, $7)`,
        [parentCode, crypto.createHash('sha256').update(crypto.randomBytes(18).toString('base64url')).digest('hex'), JSON.stringify(studentScores),
            JSON.stringify(['c1', 'c1', 'c5', 'c2', 'c1', 'c5', 'c4', 'c5', 'c2']), JSON.stringify(parentScores),
            JSON.stringify(mine.slice(0, 6).map((c, i) => ({ id: c.id, name: c.name, percent: 88 - i * 5 }))), users.student.id]);

    // 7. Паёмҳо: роҳбари синф ба чанд нафар, омӯзгори технология ба ҳамаи самти техникӣ.
    const say = (member, author, body, authorId, day, read = true) => q(
        `INSERT INTO classroom_messages ("classroomId", "memberId", author, body, "authorId", "createdAt", "readAt") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [room.id, member.id, author, body, authorId, daysAgo(day), read ? daysAgo(day - 0.1 > 0 ? day - 0.1 : 0) : null]);
    const byName = (n) => members.find((m) => m.name === n);
    await say(byName('Фарзона Алиева'), 'teacher', 'Фарзона, натиҷаи шумо ба филология хеле наздик аст. Касби «Тарҷумон»-ро санҷед — фикри шуморо мехоҳам бидонам.', users.owner.id, 4);
    await say(byName('Фарзона Алиева'), 'student', 'Ташаккур, муаллима! Санҷидам, писандам омад. Дар Хуҷанд ҷойи буҷетӣ ҳаст?', null, 3, false);
    await say(byName('Наврӯз Ҷӯраев'), 'teacher', 'Наврӯз, лутфан то ҷумъа тестро гузаред — 10 дақиқа вақт мегирад.', users.owner.id, 2, false);
    for (const m of members.filter((x) => x.top === 1)) {
        await say(m, 'teacher', 'Ба шумо, ки самти техникиро гирифтед: пагоҳ соати 14:00 дар кабинети технология ҷамъ мешавем — бо 3D-принтер кор мекунем ва дар бораи ихтисосҳои муҳандисӣ гап мезанем.', users.co.id, 1, m.name !== 'Комрон Саидов');
    }
    await say(byName('Комрон Саидов'), 'student', 'Ман меоям! Метавонам дӯстамро ҳам биёрам?', null, 0.5, false);

    const site = process.env.FRONTEND_URL || 'https://ikhtisosiman.qobus.tj';
    const lines = [
        `Синфи намоишӣ «11 «А»» — рамз ${CODE} (${site}/class/${CODE})`,
        `Парол барои ҳамаи ҳисобҳо: ${PASSWORD}`,
        `Роҳбари синф: ${ACCOUNTS.owner.email}`,
        `Омӯзгори технология (ёрирасон): ${ACCOUNTS.co.email}`,
        `Хонанда: ${ACCOUNTS.student.email}`,
        `Саҳифаи волид (ҷавоб дода шудааст): ${site}/parent/${parentCode}`,
    ];
    fs.writeFileSync(OUT, `${lines.join('\n')}\n`, { mode: 0o600 });
    console.log(`Тайёр: ${STUDENTS.length + 1} хонанда, 2 омӯзгор. Паролҳо ва пайвандҳо → ${OUT}`);
    await db.end();
})().catch((error) => { console.error(error.message); process.exit(1); });
