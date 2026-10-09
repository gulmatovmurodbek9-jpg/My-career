// E2E: Ҳуҷраи омӯзгор — омӯзгор синф месозад, хонанда бе почта бо рамз ҳамроҳ мешавад,
// тест ва санҷиши касбро мегузарад (тавассути API бо калиди браузер), омӯзгор натиҷаро мебинад.
//   TEACHER_TOKEN=… TEACHER_USER='{"id":…}' BASE_URL=http://localhost:5173 node e2e/classroom.e2e.mjs
// Дар охир CLASS_ID ва GUEST_ID чоп мешаванд — барои нест кардани сатрҳои санҷишӣ.
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || (BASE.includes("localhost") ? "http://localhost:3005/api" : `${BASE}/api`);
const TOKEN = process.env.TEACHER_TOKEN;
const USER = JSON.parse(process.env.TEACHER_USER || "{}");
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const clickByText = (page, selector, pattern) => page.evaluate((sel, source) => {
    const re = new RegExp(source);
    const el = [...document.querySelectorAll(sel)].find((node) => re.test(node.innerText));
    if (el) el.click();
    return Boolean(el);
}, selector, pattern.source);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];

// 1. Омӯзгор: синф месозад.
const teacher = await browser.newPage();
teacher.on("pageerror", (e) => errors.push(e.message));
await teacher.setViewport({ width: 1280, height: 900 });
await teacher.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await teacher.evaluate((token, user) => {
    localStorage.setItem("auth-storage", JSON.stringify({ state: { user, token, isAuthenticated: true }, version: 0 }));
}, TOKEN, USER);
await teacher.goto(`${BASE}/dashboard/teacher`, { waitUntil: "networkidle2" });
await teacher.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /Синф созед/.test(b.innerText)), { timeout: 15000 });
await clickByText(teacher, "button", /Синф созед/);
await teacher.waitForSelector('input[placeholder^="Масалан: 11"]');
await teacher.type('input[placeholder^="Масалан: 11"]', "11 «Б» (санҷиш)");
await clickByText(teacher, "button", /^Сохтан$/);
await teacher.waitForFunction(() => [...document.querySelectorAll("a[href^='/dashboard/teacher/']")].some((a) => a.innerText.includes("(санҷиш)")), { timeout: 15000 });
const classHref = await teacher.evaluate(() => [...document.querySelectorAll("a[href^='/dashboard/teacher/']")].find((a) => a.innerText.includes("(санҷиш)")).getAttribute("href"));
const classId = classHref.split("/").pop();
console.log(`CLASS_ID=${classId}`);
await teacher.goto(`${BASE}${classHref}`, { waitUntil: "networkidle2" });
await teacher.waitForSelector("img[alt^='QR']", { timeout: 15000 });
const code = await teacher.evaluate(() => [...document.querySelectorAll(".font-mono")].map((el) => el.innerText.trim()).find((value) => /^[A-Z2-9]{6}$/.test(value)));
check("Синф сохта шуд, рамз ва QR ҳаст", Boolean(code), code);

// 2. Хонанда (браузери алоҳида, бе ҳисоб) — телефон.
const context = await browser.createBrowserContext();
const student = await context.newPage();
student.on("pageerror", (e) => errors.push(e.message));
// Хонанда — iPhone (андоза, ламс ва User-Agent-и Safari; муҳаррики Chrome).
await student.emulate(KnownDevices["iPhone 13"]);
await student.goto(`${BASE}/class/${code}`, { waitUntil: "networkidle2" });
await student.waitForSelector("#class-name");
check("Саҳифаи ҳамроҳшавӣ: номи синф", await student.evaluate(() => document.body.innerText.includes("11 «Б» (санҷиш)")));
if (SHOTS) await student.screenshot({ path: `${SHOTS}/join-form.png`, fullPage: true });
await student.type("#class-name", "Ҷамшед Раҳимов");
await clickByText(student, "button", /Ҳамроҳ шудан/);
await student.waitForFunction(() => document.body.innerText.includes("Шумо дар синфи"), { timeout: 15000 });
if (SHOTS) await student.screenshot({ path: `${SHOTS}/join-done.png`, fullPage: true });
const guest = await student.evaluate(() => JSON.parse(localStorage.getItem("class_guest_v1") || "null"));
check("Калиди хонанда дар браузер", Boolean(guest?.token));

await student.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.getAttribute("href") === "/quiz").click());
await sleep(2500);
const quizPath = await student.evaluate(() => location.pathname);
check("Тест бе ҳисоб кушода шуд (на /login)", quizPath === "/quiz", quizPath);

// Тест ва санҷиш — бо ҳамон калид (ҳамон сарлавҳае, ки сайт мефиристад).
const headers = { "Content-Type": "application/json", "X-Class-Guest": guest.token };
const questions = await fetch(`${API}/quiz/questions`).then((r) => r.json());
const answers = questions.filter((q) => q.part === "mmt").map((q, i) => ({ questionId: q.id, selectedValue: String((i * 2) % q.options.length) }));
const quiz = await fetch(`${API}/quiz/submit`, { method: "POST", headers, body: JSON.stringify({ answers, lang: "tj", grade: 11 }) }).then((r) => r.json());
check("Тест сабт шуд", Boolean(quiz.attemptId));
const careers = await fetch(`${API}/careers?search=1020505&limit=3`).then((r) => r.json());
const careerId = careers.data?.[0]?.id;
const scenario = await fetch(`${API}/trial/career/${careerId}?lang=tj`).then((r) => r.json());
const finish = await fetch(`${API}/trial/career/${careerId}/finish`, {
    method: "POST",
    headers,
    body: JSON.stringify({ lang: "tj", tasks: scenario.tasks.map((t) => ({ id: t.id, answer: null, liked: true })), rating: 4, confBefore: 2, confAfter: 4 }),
}).then((r) => r.json());
check("Санҷиши касб сабт шуд", typeof finish.solved === "number");

// 3. Омӯзгор натиҷаро мебинад.
await teacher.reload({ waitUntil: "networkidle2" });
await teacher.waitForFunction(() => document.body.innerText.includes("Ҷамшед Раҳимов"), { timeout: 15000 });
const row = await teacher.evaluate(() => [...document.querySelectorAll("li")].find((li) => li.innerText.includes("Ҷамшед Раҳимов"))?.innerText || "");
check("Омӯзгор: хонанда ва 😊", row.includes("😊"), row.replace(/\n/g, " | ").slice(0, 120));
await clickByText(teacher, "li button", /Ҷамшед/);
await sleep(500);
const detail = await teacher.evaluate(() => document.body.innerText);
check("Ҷузъиёт: фоизҳо ва касби санҷидашуда", /\d+%/.test(detail) && detail.includes("Касбҳои санҷидашуда"));
check("Боварии синф 2 → 4", /2\s*\n*\s*4/.test(detail));
if (SHOTS) {
    await teacher.screenshot({ path: `${SHOTS}/class-desktop.png`, fullPage: true });
    await teacher.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await teacher.reload({ waitUntil: "networkidle2" });
    await sleep(1200);
    await teacher.screenshot({ path: `${SHOTS}/class-mobile.png`, fullPage: true });
}

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(`GUEST_ID=${guest?.token?.split(".")[0]}`);
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
