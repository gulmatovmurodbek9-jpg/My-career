/**
 * Корбарони намоишӣ бо номҳои тоҷикӣ.
 *
 * Панели админ бо ҳафт сатр холӣ менамуд: диаграммаҳо сифр, «ҳозир дар сайт»
 * холӣ, тақсимоти лайкҳо бе маълумот. Ин скрипт ҳисобҳои воқеъбинона месозад
 * — бо натиҷаи санҷиш, ихтисосҳои захирашуда ва вақти охирин фаъолият — то
 * он чи дар экран аст, ба сайти кории ҳақиқӣ монанд бошад.
 *
 * Ҳамаи ҳисобҳо як пароли маълум доранд ва рӯйхати имейлҳояшон ба
 * `scripts/demo-users-remove.sql` навишта мешавад, то пас аз намоиш бо як
 * фармон тоза кардан мумкин бошад.
 *
 * ОГОҲӢ: суроғаҳо дар домени `gmail.com` сохта мешаванд ва метавонанд бо
 * ҳисоби воқеии касе рост оянд. Барои намоиш зарар надорад, вале дар кори
 * ҳақиқӣ чунин маълумот набояд монад.
 *
 * Истифода:
 *   node scripts/seed-demo-users.mjs            # 100 корбар
 *   node scripts/seed-demo-users.mjs --count 50
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const ROOT = path.resolve(import.meta.dirname, "..");
const BACKEND = path.join(ROOT, "Back/nest-backend");
const require = createRequire(path.join(BACKEND, "package.json"));
const pg = require("pg");
const bcrypt = require("bcrypt");

const env = Object.fromEntries(
    fs.readFileSync(path.join(BACKEND, ".env"), "utf8")
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const args = process.argv.slice(2);
const argValue = (flag, fallback) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : fallback; };
const COUNT = Number(argValue("--count", 100));
const PASSWORD = argValue("--password", "Demo-2026");

const MALE = [
    "Абдулло", "Азиз", "Акмал", "Алишер", "Амир", "Анвар", "Ардашер", "Аслам",
    "Баҳтиёр", "Бекзод", "Далер", "Диловар", "Дилшод", "Достон", "Зафар",
    "Икром", "Илҳом", "Искандар", "Комрон", "Мансур", "Маҳмуд", "Меҳроб",
    "Мирзо", "Муҳаммад", "Насим", "Нозим", "Нуриддин", "Парвиз", "Рустам",
    "Саид", "Сино", "Сомон", "Сӯҳроб", "Темур", "Умед", "Фаридун", "Фарҳод",
    "Фирдавс", "Хуршед", "Шоҳрух", "Ҷамшед", "Ҷаҳонгир", "Юсуф",
];

const FEMALE = [
    "Анора", "Гулнора", "Дилноза", "Зарина", "Зебо", "Зулфия", "Лола",
    "Мадина", "Малика", "Манижа", "Марям", "Меҳрангез", "Мунира", "Насиба",
    "Нигина", "Нилуфар", "Парвина", "Рухшона", "Сабрина", "Садбарг",
    "Сайёра", "Ситора", "Сурайё", "Таҳмина", "Фарзона", "Фирӯза", "Шаҳло",
    "Шаҳноза", "Ҷамила",
];

/** Фамилияҳо дар шакли мардона; барои занҳо «а» илова мешавад. */
const SURNAMES = [
    "Раҳимов", "Каримов", "Назаров", "Сафаров", "Шарипов", "Юсупов", "Холов",
    "Давлатов", "Мирзоев", "Саидов", "Бобоев", "Ғаффоров", "Қосимов",
    "Ҳакимов", "Ҷӯраев", "Умаров", "Раҷабов", "Нурматов", "Икромов",
    "Зоиров", "Латифов", "Маҳмудов", "Одинаев", "Пиров", "Рустамов",
    "Содиқов", "Тошматов", "Усмонов", "Файзиев", "Ҳайдаров", "Шодиев",
    "Эргашев", "Абдуллоев", "Аминов", "Бердиев",
];

/* Кириллии тоҷикӣ → лотинӣ барои имейл. Ҳарфҳои хос (ғ ӣ қ ӯ ҳ ҷ) бояд
   пеш аз ҳарфҳои оддӣ биёянд, вагарна «ҳ» ҳамчун «х» хонда мешавад. */
const TRANSLIT = {
    "ғ": "gh", "ӣ": "i", "қ": "q", "ӯ": "u", "ҳ": "h", "ҷ": "j",
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "ъ": "", "ь": "",
    "э": "e", "ю": "yu", "я": "ya",
};

const translit = (value) =>
    [...value.toLowerCase()].map((ch) => TRANSLIT[ch] ?? (/[a-z0-9]/.test(ch) ? ch : "")).join("");

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const between = (min, max) => min + Math.random() * (max - min);

const pool = new pg.Pool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
});

/** Холҳои ММТ: як кластер пеш меистад, боқӣ пасттар — мисли санҷиши воқеӣ. */
function quizResults(clusterIds) {
    const top = pick(clusterIds);
    const mmtClusters = {};
    for (const id of clusterIds) {
        mmtClusters[`c${id}`] = id === top
            ? Math.round(between(26, 40))
            : Math.round(between(4, 22));
    }
    return { mmtClusters, topCluster: `c${top}` };
}

async function main() {
    const { rows: clusters } = await pool.query('SELECT "clusterId" FROM cluster ORDER BY "clusterId"');
    const clusterIds = clusters.map((c) => c.clusterId);
    const { rows: careers } = await pool.query("SELECT id FROM career ORDER BY random() LIMIT 200");

    const hash = await bcrypt.hash(PASSWORD, 10);
    const now = Date.now();
    const used = new Set();
    const created = [];

    for (let i = 0; i < COUNT; i++) {
        const female = Math.random() < 0.5;
        const first = pick(female ? FEMALE : MALE);
        const surname = pick(SURNAMES) + (female ? "а" : "");
        const name = `${first} ${surname}`;

        /* Рақам барои ягонагӣ: бе он «Алишер Каримов» ду бор рост меояд ва
           дуюмаш ба маҳдудияти ягонагии имейл мехӯрад. */
        let email;
        do {
            email = `${translit(first)}.${translit(surname)}${Math.floor(between(10, 999))}@gmail.com`;
        } while (used.has(email));
        used.add(email);

        /* Санаи сабт дар шаш моҳи охир, ва «охирин фаъолият» пас аз он.
           Чоряки корбарон дар як рӯзи охир фаъол буданд — то панел зинда
           намояд, вале на ҳама якбора. */
        const createdAt = new Date(now - between(1, 180) * 86400000);
        const recent = Math.random() < 0.25;
        const lastSeenAt = new Date(
            recent ? now - between(1, 1440) * 60000 : createdAt.getTime() + between(0, 20) * 86400000,
        );

        const hasQuiz = Math.random() < 0.7;

        const { rows: [user] } = await pool.query(
            `INSERT INTO "user" (email, password, name, role, "quizResults", "createdAt", "updatedAt", "lastSeenAt")
             VALUES ($1, $2, $3, 'user', $4, $5, $5, $6)
             ON CONFLICT (email) DO NOTHING
             RETURNING id`,
            [email, hash, name, hasQuiz ? JSON.stringify(quizResults(clusterIds)) : null, createdAt, lastSeenAt],
        );
        if (!user) continue;

        /* Лайк ва захира: бе онҳо диаграммаҳои панел холӣ мемонанд. */
        const liked = new Set();
        for (let k = 0; k < Math.floor(between(0, 5)); k++) liked.add(pick(careers).id);
        const saved = new Set();
        for (let k = 0; k < Math.floor(between(0, 4)); k++) saved.add(pick(careers).id);

        for (const careerId of liked) {
            await pool.query(
                `INSERT INTO user_liked_careers ("userId", "careerId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [user.id, careerId],
            );
        }
        for (const careerId of saved) {
            await pool.query(
                `INSERT INTO user_saved_careers ("userId", "careerId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [user.id, careerId],
            );
        }

        created.push(email);
        process.stdout.write(`\r${created.length}/${COUNT} корбар   `);
    }

    /* Шумораи лайкҳо дар худи ихтисос нигоҳ дошта мешавад — панел маҳз онро
       мехонад, на ҷадвали пайвандро. */
    await pool.query(`
        UPDATE career c SET "likesCount" = sub.n
          FROM (SELECT "careerId", count(*)::int n FROM user_liked_careers GROUP BY "careerId") sub
         WHERE c.id = sub."careerId"`);

    const removal = [
        "-- Корбарони намоишӣ, ки бо scripts/seed-demo-users.mjs сохта шудаанд.",
        "-- Иҷро кунед, то пас аз намоиш ҳамаашонро тоза кунед.",
        "DELETE FROM user_liked_careers WHERE \"userId\" IN (SELECT id FROM \"user\" WHERE email = ANY(ARRAY[",
        created.map((e) => `    '${e}'`).join(",\n"),
        "]));",
        "DELETE FROM user_saved_careers WHERE \"userId\" IN (SELECT id FROM \"user\" WHERE email = ANY(ARRAY[",
        created.map((e) => `    '${e}'`).join(",\n"),
        "]));",
        "DELETE FROM \"user\" WHERE email = ANY(ARRAY[",
        created.map((e) => `    '${e}'`).join(",\n"),
        "]);",
        "",
    ].join("\n");
    fs.writeFileSync(path.join(ROOT, "scripts/demo-users-remove.sql"), removal);

    const { rows: [total] } = await pool.query('SELECT count(*)::int c FROM "user"');
    console.log(`\nсохта шуд: ${created.length} · ҳамагӣ дар система: ${total.c}`);
    console.log(`парол: ${PASSWORD}`);
    console.log("барои тоза кардан: scripts/demo-users-remove.sql");
}

main()
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(() => pool.end());
