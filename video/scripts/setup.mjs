// Ҳисобҳои намоишӣ ДАР БАЗАИ МАҲАЛЛӢ (на сервер): хонанда бо натиҷа, захира ва рӯйхат;
// омӯзгор бо синф ва 4 хонанда. Такрор зарар намерасонад — ҳар бор ҳолат аз нав сохта мешавад.
import path from "path";
import { createRequire } from "module";
import { API, ROOT } from "./lib.mjs";

const backend = process.env.BACKEND_DIR || "C:/Users/admin/Desktop/Projects/My Career/Back/nest-backend";
const require = createRequire(path.join(backend, "package.json"));
require("dotenv").config({ path: path.join(backend, ".env"), quiet: true });
const { Client } = require("pg");
const jwt = require("jsonwebtoken");

const STUDENT = { email: "demo.student@ikhtisosiman.local", name: "Ҷамшед Раҳимов" };
const TEACHER = { email: "demo.teacher@ikhtisosiman.local", name: "Мавлуда Каримова" };
const GUESTS = ["Фарзона Алиева", "Шаҳром Назаров", "Мадина Раҷабова", "Комрон Саидов"];

const call = async (method, url, body, headers = {}) => {
    const r = await fetch(`${API}${url}`, { method, headers: { "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
    const text = await r.text();
    if (!r.ok) throw new Error(`${method} ${url} → ${r.status} ${text.slice(0, 160)}`);
    try { return JSON.parse(text); } catch { return text; }
};

async function quizAnswers(pick) {
    const questions = await call("GET", "/quiz/questions");
    const mmt = questions.filter((q) => q.part === "mmt").map((q, i) => ({ questionId: q.id, selectedValue: String(pick(i, q.options.length)) }));
    const score = await call("POST", "/quiz/score", { answers: mmt });
    const scores = score.mmtClusters || score.scores?.mmtClusters || {};
    const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "c1";
    const stage2 = await call("GET", `/quiz/specialty-questions?clusterNumber=${top.replace(/\D/g, "")}`);
    return [...mmt, ...stage2.map((q) => ({ questionId: q.id, selectedValue: "0" }))];
}

export async function setup() {
    const db = new Client({ host: process.env.DB_HOST, port: +process.env.DB_PORT, user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
    await db.connect();
    const ensure = async ({ email, name }, role) => {
        await db.query(`INSERT INTO "user" (email, name, role, "emailVerified") VALUES ($1, $2, $3, true)
                        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role`, [email, name, role]);
        const { rows: [u] } = await db.query(`SELECT id, email, name, role FROM "user" WHERE email = $1`, [email]);
        const token = jwt.sign({ sub: u.id, email: u.email, role: u.role }, process.env.JWT_SECRET, { expiresIn: "6h" });
        return { token, user: u, headers: { Authorization: `Bearer ${token}` } };
    };
    const student = await ensure(STUDENT, "user");
    const teacher = await ensure(TEACHER, "teacher");

    // Хонанда: натиҷаи тест (самти филология), 4 захира, 3 интихоб дар рӯйхат, 2 санҷиши касб.
    await db.query(`UPDATE "user" SET "applicationChoices" = '[]', "chatHistory" = '[]' WHERE id = $1`, [student.user.id]);
    await db.query(`DELETE FROM user_saved_careers WHERE "userId" = $1`, [student.user.id]);
    await db.query(`DELETE FROM user_liked_careers WHERE "userId" = $1`, [student.user.id]);
    const answers = await quizAnswers((i, n) => (i * 2 + 1) % n);
    const quiz = await call("POST", "/quiz/submit-authenticated", { answers, lang: "tj", grade: 11 }, student.headers);
    const careers = quiz.topCluster?.specializations || [];
    for (const career of careers.slice(0, 4)) await call("POST", `/users/save-career/${career.id}`, {}, student.headers);
    for (const career of careers.slice(0, 2)) await call("POST", `/careers/${career.id}/like`, {}, student.headers).catch(() => {});
    let planned = 0;
    for (const career of careers.slice(0, 4)) {
        if (planned >= 3) break;
        const offerings = await call("GET", `/careers/${career.id}/offerings?grade=11`);
        const free = offerings.find((o) => o.paymentType === "ройгон") || offerings[0];
        if (!free) continue;
        await call("POST", `/users/application-plan/${free.id}`, {}, student.headers).catch(() => {});
        planned += 1;
    }

    // Омӯзгор: синфи «11 „А“» бо 4 хонанда (бе почта), ки тест ва санҷиш гузаштаанд.
    await db.query(`DELETE FROM classrooms WHERE "teacherId" = $1`, [teacher.user.id]);
    const room = await call("POST", "/classrooms", { name: "11 «А»", school: "Мактаби №5", city: "Хуҷанд", grade: 11 }, teacher.headers);
    const guestIds = [];
    for (const [i, name] of GUESTS.entries()) {
        const joined = await call("POST", "/classrooms/join", { code: room.code, displayName: name });
        const G = { "X-Class-Guest": joined.guest.token };
        guestIds.push(joined.guest.token.split(".")[0]);
        if (i === 3) continue; // як нафар ҳанӯз тест нагузаштааст
        const ans = await quizAnswers((k, n) => (k + i * 3) % n);
        const result = await call("POST", "/quiz/submit", { answers: ans, lang: "tj", grade: 11 }, G);
        const careerId = result.topCluster?.specializations?.[0]?.id;
        if (careerId && i < 2) {
            const sc = await call("GET", `/trial/career/${careerId}?lang=tj`);
            await call("POST", `/trial/career/${careerId}/finish`, { lang: "tj", tasks: sc.tasks.map((t, k) => ({ id: t.id, answer: null, liked: i === 0 || k < 1 })), rating: i === 0 ? 4 : 2, confBefore: 2, confAfter: i === 0 ? 4 : 3 }, G);
        }
    }
    const { rows: [scenario] } = await db.query(`SELECT c.id FROM career_trials t JOIN career c ON c.id = t."careerId" WHERE c.code = '1020505'`);

    return {
        auth: { student, teacher },
        quiz,
        quizAnswers: answers,
        careerId: careers[0]?.id,
        trialCareerId: scenario?.id || careers[0]?.id,
        classroom: room,
        cleanup: async () => {
            await db.query('DELETE FROM trial_attempts WHERE "guestId" = ANY($1)', [guestIds]);
            await db.query('DELETE FROM quiz_attempts WHERE "guestId" = ANY($1)', [guestIds]);
            await db.end();
        },
    };
}
