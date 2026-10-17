// E2E: маслиҳати AI дар натиҷаи тест бо забони сайт (17.10). Тест бо русӣ супорида мешавад,
// саҳифа бо тоҷикӣ кушода мешавад — маслиҳат бояд тоҷикӣ бошад, на русӣ.
//   TOKENS=D:/tmp/family-tokens.json API_URL=http://localhost:3005/api BASE_URL=http://localhost:5175 node e2e/advice-lang.e2e.mjs
// Саҳифаи тест воридшавиро талаб мекунад: TOKENS бо student.{token,user}.
import fs from "fs";
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || "http://localhost:3005/api";
const SHOTS = process.env.SHOTS || "";
const T = process.env.TOKENS ? JSON.parse(fs.readFileSync(process.env.TOKENS, "utf8")) : {};
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
// Матни тоҷикӣ ҳарфҳои ӣ ӯ қ ғ ҳ ҷ дорад; русӣ — ы э щ.
const tajik = (text) => /[ӣӯқғҳҷ]/i.test(text) && !/[ыэщ]/i.test(text);
const russian = (text) => /[ыэщ]/i.test(text) && !/[ӣӯқғҳҷ]/i.test(text);

// Ҷавобҳо: варианти аввали ҳар саволи қисми 1.
const questions = await (await fetch(`${API}/quiz/questions`)).json();
const answers = (Array.isArray(questions) ? questions : questions.data || []).filter((q) => q.options?.length)
    .slice(0, 24).map((q) => ({ questionId: q.id, selectedValue: 0 }));
const body = { answers, lang: "ru", grade: 11, context: null };
const res = await fetch(`${API}/quiz/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const data = await res.json();
check("Тест бо русӣ: маслиҳат русӣ", res.ok && russian(data.aiAdvice || ""), (data.aiAdvice || "").slice(0, 80));

const stored = { ...data, rawAnswers: answers, answers: [], quizLang: "ru", answeredAt: new Date().toISOString() };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.emulate(KnownDevices["iPhone 13"]);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.evaluate((value, auth) => {
    if (auth) localStorage.setItem("auth-storage", JSON.stringify({ state: { user: auth.user, token: auth.token, isAuthenticated: true }, version: 0 }));
    localStorage.setItem("app_lang", "tj");
    localStorage.setItem("assistant_greeted_v1", "1");
    localStorage.setItem("quiz_results_v1", JSON.stringify(value));
}, stored, T.student || null);
await page.goto(`${BASE}/quiz`, { waitUntil: "networkidle2" });
// Агар саҳифа «Натиҷаи пештара» пурсад — натиҷаро кушоем.
await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((b) => /натиҷа/i.test(b.innerText) && !/аз нав/i.test(b.innerText));
    if (button) button.click();
});
await page.waitForSelector("[data-ai-advice]", { timeout: 20000 }).catch(async () => {
    console.log("BODY:", (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 600));
});
const ok = await page.waitForFunction(() => {
    const box = document.querySelector("[data-ai-advice] p");
    return box && box.innerText.length > 40;
}, { timeout: 60000 }).then(() => true).catch(() => false);
const advice = await page.$eval("[data-ai-advice]", (n) => n.innerText).catch(() => "");
check("Саҳифа бо тоҷикӣ: маслиҳат тоҷикӣ шуд", ok && tajik(advice.replace(/^.*\n/, "")), advice.replace(/\n/g, " ").slice(0, 120));
const cached = await page.evaluate(() => JSON.parse(localStorage.getItem("quiz_results_v1")).aiAdviceByLang?.tj || "");
check("Маслиҳати тоҷикӣ нигоҳ дошта шуд (бори дуюм бе AI)", tajik(cached));
if (SHOTS) await page.screenshot({ path: `${SHOTS}/advice-tj.png`, fullPage: false });
check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲама гузашт");
process.exit(failed ? 1 : 0);
