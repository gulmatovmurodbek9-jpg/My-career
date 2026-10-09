// E2E: натиҷаи тест — 12 ихтисос бо фоиз (аз баланд ба паст), «Донишгоҳ ва ҳуҷҷатсупорӣ»:
// филтри буҷетӣ/пулакӣ ва «Ба рӯйхат» → дар «Нақшаи ҳуҷҷатсупорӣ» пайдо мешавад.
//   USER_TOKEN=… USER_JSON='{"id":…}' BASE_URL=http://localhost:5173 node e2e/quick-apply.e2e.mjs
// Натиҷаи тест тавассути API гирифта шуда, ба браузер (localStorage) гузошта мешавад.
// Пешниҳоди иловашуда дар охир аз рӯйхат бароварда мешавад.
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || (BASE.includes("localhost") ? "http://localhost:3005/api" : `${BASE}/api`);
const TOKEN = process.env.USER_TOKEN;
const USER = JSON.parse(process.env.USER_JSON || "{}");
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// Натиҷаи тест (бе сабт ба ҳисоб: /quiz/submit).
const questions = await fetch(`${API}/quiz/questions`).then((r) => r.json());
const mmt = questions.filter((q) => q.part === "mmt").map((q) => ({ questionId: q.id, selectedValue: "0" }));
const score = await fetch(`${API}/quiz/score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: mmt }) }).then((r) => r.json());
const top = Object.entries(score.mmtClusters || score.scores?.mmtClusters || { c1: 1 }).sort((a, b) => b[1] - a[1])[0][0];
const stage2 = await fetch(`${API}/quiz/specialty-questions?clusterNumber=${top.replace(/\D/g, "")}`).then((r) => r.json());
const answers = [...mmt, ...stage2.map((q) => ({ questionId: q.id, selectedValue: "0" }))];
const result = await fetch(`${API}/quiz/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, lang: "tj", grade: 11 }) }).then((r) => r.json());
const specs = result.topCluster?.specializations || [];
const names = new Set(specs.map((s) => s.name));
check("Сервер: 12 ихтисоси гуногун", specs.length === 12 && names.size === 12, `${specs.length} / ${names.size}`);
const pcts = specs.map((s) => s.matchPercentage);
check("Сервер: фоизи ҳар ихтисос", pcts.every((p) => Number.isFinite(p) && p > 0 && p <= 100), pcts.join(","));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.emulate(KnownDevices["iPhone 13"]);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.evaluate((token, user, stored) => {
    localStorage.setItem("auth-storage", JSON.stringify({ state: { user, token, isAuthenticated: true }, version: 0 }));
    localStorage.setItem("quiz_results_v1", JSON.stringify(stored));
}, TOKEN, USER, { ...result, rawAnswers: answers, answers: [], quizLang: "tj" });
await page.goto(`${BASE}/quiz`, { waitUntil: "networkidle2" });
// «Натиҷаи қаблиро бинед», агар пурсад.
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /натиҷа/i.test(b.innerText) && /бин|қаблӣ|пешин/i.test(b.innerText))?.click());
await page.waitForFunction(() => document.body.innerText.includes("Донишгоҳ ва ҳуҷҷатсупорӣ"), { timeout: 20000 });

const shown = await page.evaluate(() => [...document.querySelectorAll("article")]
    .filter((a) => a.innerText.includes("Донишгоҳ ва ҳуҷҷатсупорӣ"))
    .map((a) => Number((a.innerText.match(/(\d+)%/) || [])[1])));
check("Саҳифа: 12 корт бо фоиз", shown.length === 12 && shown.every(Number.isFinite), shown.join(","));
check("Саҳифа: аз баланд ба паст", shown.every((p, i) => i === 0 || shown[i - 1] >= p));

// Корти аввал: кушодан → филтри «Буҷетӣ» → «Ба рӯйхат».
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Донишгоҳ ва ҳуҷҷатсупорӣ")).click());
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^Буҷетӣ/.test(b.innerText.trim())), { timeout: 15000 });
const before = await page.evaluate(() => document.querySelectorAll("article li").length);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^Буҷетӣ/.test(b.innerText.trim())).click());
await sleep(300);
const freeText = await page.evaluate(() => [...document.querySelectorAll("article li")].map((li) => li.innerText).join("\n"));
const freeCount = await page.evaluate(() => document.querySelectorAll("article li").length);
check("Филтри «Буҷетӣ»", freeCount === 0 || !/сомонӣ\/сол/.test(freeText), `${before} → ${freeCount}`);
if (!freeCount) await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^Ҳама/.test(b.innerText.trim())).click());
await sleep(300);
if (SHOTS) await page.screenshot({ path: `${SHOTS}/quick-open.png`, fullPage: false });

const offeringCount = await page.evaluate(() => document.querySelectorAll("article li").length);
let addedOk = false;
if (offeringCount) {
    await page.evaluate(() => [...document.querySelectorAll("article li button")].find((b) => b.innerText.includes("Ба рӯйхат"))?.click());
    await page.waitForFunction(() => [...document.querySelectorAll("article li button")].some((b) => b.innerText.includes("Дар рӯйхат"))
        || document.body.innerText.includes("Тоза карда илова кунед"), { timeout: 10000 }).catch(() => {});
    if (await page.evaluate(() => document.body.innerText.includes("Тоза карда илова кунед"))) {
        console.log("   (рӯйхат кластери дигар дошт — санҷиш рӯйхатро иваз намекунад)");
        addedOk = true;
    } else {
        addedOk = await page.evaluate(() => [...document.querySelectorAll("article li button")].some((b) => b.innerText.includes("Дар рӯйхат")));
        const plan = await fetch(`${API}/users/application-plan`, { headers: { Authorization: `Bearer ${TOKEN}` } }).then((r) => r.json());
        check("Дар «Нақшаи ҳуҷҷатсупорӣ» пайдо шуд", (plan.items || []).length > 0);
        check("Пайванди «Нақшаро кушоед»", await page.evaluate(() => document.body.innerText.includes("Нақшаро кушоед")));
        if (SHOTS) { await page.evaluate(() => [...document.querySelectorAll("article")].find((a) => a.querySelector("li"))?.scrollIntoView({ block: "start" })); await sleep(400); await page.screenshot({ path: `${SHOTS}/quick-added.png`, fullPage: false }); }
        // Тоза: ҳамон пешниҳодро бароварем.
        await page.evaluate(() => [...document.querySelectorAll("article li button")].find((b) => b.innerText.includes("Дар рӯйхат"))?.click());
        await sleep(1200);
    }
}
check("«Ба рӯйхат» кор мекунад", addedOk || offeringCount === 0);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
check("Телефон: уфуқӣ намелағжад", !overflow);
check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
