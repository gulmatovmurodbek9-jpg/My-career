// E2E: «Волидайн ҳам бигӯянд» (хонанда → пайванд → волид дар телефон → муқоиса дар ҳарду тараф)
// ва «Мусоҳиба бо мутахассис» (саволи тайёр → ҷавоби AI аз номи мутахассис).
//   BASE_URL=http://localhost:5173 SHOTS=… node e2e/parent-interview.e2e.mjs
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || (BASE.includes("localhost") ? "http://localhost:3005/api" : `${BASE}/api`);
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// Натиҷаи тест бе ворид шудан (ҳамон чизе, ки браузер нигоҳ медорад).
const questions = await fetch(`${API}/quiz/questions`).then((r) => r.json());
const answers = questions.filter((q) => q.part === "mmt").map((q, i) => ({ questionId: q.id, selectedValue: String(i % q.options.length) }));
const result = await fetch(`${API}/quiz/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, lang: "tj", grade: 11 }) }).then((r) => r.json());

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];

// 1. Хонанда (компютер): натиҷаи тест → «Волидайн чӣ фикр доранд?»
const childCtx = await browser.createBrowserContext();
const child = await childCtx.newPage();
child.on("pageerror", (e) => errors.push(`child: ${e.message}`));
await child.setViewport({ width: 1280, height: 900 });
await child.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
// Тест бе ҳисоб танҳо барои хонандаи синф кушода мешавад — ҳисоби муваққатии меҳмон.
const join = await fetch(`${API}/classrooms/code/XXXXXX`).catch(() => null);
void join;
await child.evaluate((stored) => {
    localStorage.setItem("assistant_greeted_v1", "1");
    localStorage.setItem("quiz_results_v1", JSON.stringify(stored));
    localStorage.setItem("class_guest_v1", JSON.stringify({ token: "00000000-0000-0000-0000-000000000000.e2e-dummy-key-for-route-guard" }));
}, { ...result, rawAnswers: answers, answers: [], quizLang: "tj" });
await child.goto(`${BASE}/quiz`, { waitUntil: "networkidle2" });
await child.evaluate(() => [...document.querySelectorAll("button")].find((b) => /натиҷа/i.test(b.innerText) && /бин|пешин|қаблӣ/i.test(b.innerText))?.click());
await child.waitForFunction(() => document.body.innerText.includes("Волидайн чӣ фикр доранд?"), { timeout: 20000 });
await child.type('input[aria-label^="Номи шумо"]', "Ҷамшед");
await child.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Пайванд барои волидайн")).click());
await child.waitForFunction(() => /\/parent\/[A-Z0-9]{8}/.test(document.body.innerText), { timeout: 15000 });
const link = await child.evaluate(() => (document.body.innerText.match(/https?:\/\/[^\s]+\/parent\/[A-Z0-9]{8}/) || [""])[0]);
check("Хонанда: пайванд сохта шуд", /\/parent\/[A-Z0-9]{8}$/.test(link), link);
check("Хонанда: «Интизори ҷавоби волидайн»", await child.evaluate(() => document.body.innerText.includes("Интизори ҷавоби волидайн")));

// 2. Волид (iPhone, бе ҳисоб).
const parentCtx = await browser.createBrowserContext();
const parent = await parentCtx.newPage();
parent.on("pageerror", (e) => errors.push(`parent: ${e.message}`));
await parent.emulate(KnownDevices["iPhone 13"]);
await parent.goto(link.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: "networkidle2" });
check("Волид: «Ҷамшед аз шумо маслиҳат мепурсад»", await parent.evaluate(() => document.body.innerText.includes("Ҷамшед аз шумо маслиҳат мепурсад")));
if (SHOTS) await parent.screenshot({ path: `${SHOTS}/parent-intro.png` });
await parent.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.trim() === "Модар").click());
await parent.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.trim() === "Оғоз").click());
await sleep(400);
if (SHOTS) await parent.screenshot({ path: `${SHOTS}/parent-question.png` });
for (let i = 0; i < 10; i += 1) {
    await parent.evaluate((i) => {
        const options = [...document.querySelectorAll("main button")].filter((b) => b.innerText.length > 12 && !/Бозгашт/.test(b.innerText));
        options[i < 6 ? 0 : 2]?.click();
    }, i);
    await sleep(350);
}
await parent.waitForFunction(() => document.body.innerText.includes("Ташаккур"), { timeout: 15000 }).catch(async (e) => { await parent.screenshot({ path: `${SHOTS}/parent-fail.png`, fullPage: true }); throw e; });
check("Волид: «Ташаккур» ва муқоиса", await parent.evaluate(() => document.body.innerText.includes("Фарзанд ва волидайн: муқоиса")));
if (SHOTS) await parent.screenshot({ path: `${SHOTS}/parent-compare.png`, fullPage: true });

// 3. Хонанда муқоисаро мебинад (тугмаи «Санҷидан»).
await child.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Санҷидан"))?.click());
await child.waitForFunction(() => document.body.innerText.includes("Фарзанд ва волидайн: муқоиса"), { timeout: 15000 });
const agree = await child.evaluate(() => (document.body.innerText.match(/(\d+)%\s*\n?\s*Мувофиқат/i) || [])[1]);
check("Хонанда: муқоиса бо мувофиқат", Boolean(agree), `${agree}%`);
if (SHOTS) {
    await child.evaluate(() => [...document.querySelectorAll("h2")].find((h) => h.innerText.includes("Фарзанд ва волидайн"))?.scrollIntoView({ block: "start" }));
    await sleep(500);
    await child.screenshot({ path: `${SHOTS}/child-compare.png` });
}

// 4. Мусоҳиба бо мутахассис.
const careers = await fetch(`${API}/careers?search=1020505&limit=3`).then((r) => r.json());
const page = await childCtx.newPage();
page.on("pageerror", (e) => errors.push(`interview: ${e.message}`));
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${BASE}/info/${careers.data[0].id}`, { waitUntil: "networkidle2" });
await page.waitForFunction(() => /мусоҳиба бо мутахассис/i.test(document.body.innerText), { timeout: 20000 });
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Дар кори шумо аз ҳама душвор"))?.click());
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.innerText.includes("Гӯш кардан")), { timeout: 60000 });
const answer = await page.evaluate(() => [...document.querySelectorAll("section div")].filter((d) => d.querySelector("button") && d.innerText.includes("Гӯш кардан")).pop()?.innerText.replace("Гӯш кардан", "").trim());
check("Мутахассис: ҷавоб аз номи худ", (answer || "").length > 60 && /ман|кори ман|мо/i.test(answer || ""), (answer || "").slice(0, 90));
if (SHOTS) {
    await page.evaluate(() => [...document.querySelectorAll("div")].find((d) => /^мусоҳиба бо мутахассис/i.test(d.innerText.trim()))?.scrollIntoView({ block: "start" }));
    await sleep(500);
    await page.screenshot({ path: `${SHOTS}/interview.png` });
}

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
