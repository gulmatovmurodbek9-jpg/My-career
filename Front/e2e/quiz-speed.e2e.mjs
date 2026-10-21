// E2E: суръати натиҷаи тест. Натиҷа бояд фавран пайдо шавад (бе интизори AI),
// маслиҳати AI баъдтар дар ҳамон ҷо (аввал хатҳои интизорӣ). Тест бо тоҷикӣ пурра гузаронида мешавад.
//   TOKENS=D:/tmp/family-tokens.json BASE_URL=http://localhost:5175 node e2e/quiz-speed.e2e.mjs
import fs from "fs";
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const T = JSON.parse(fs.readFileSync(process.env.TOKENS, "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.evaluate((a) => {
    localStorage.setItem("app_lang", "tj");
    localStorage.setItem("assistant_greeted_v1", "1");
    localStorage.removeItem("quiz_results_v1");
    localStorage.removeItem("school_grade");
    localStorage.setItem("auth-storage", JSON.stringify({ state: { user: a.user, token: a.token, isAuthenticated: true }, version: 0 }));
}, T.student);
await page.goto(`${BASE}/quiz`, { waitUntil: "networkidle2" });
await sleep(1200);
const body = () => page.evaluate(() => document.body.innerText);
// Саволҳои пешакӣ (синф, фанҳо, шаҳр): тугмаи «11» ва «Идома»/«Гузаштан».
for (let i = 0; i < 8; i += 1) {
    if (await page.$("button[aria-pressed]") && /Саволи|Қисми/.test(await body())) break;
    await page.evaluate(() => {
        const buttons = [...document.querySelectorAll("button")];
        const b = buttons.find((x) => /11/.test(x.innerText) && /синф/i.test(x.innerText))
            || buttons.find((x) => /^(Идома|Давом|Гузаштан|Оғоз|Санҷишро оғоз)/i.test(x.innerText.trim()));
        b?.click();
    });
    await sleep(900);
}
let lastClick = 0;
for (let step = 0; step < 70; step += 1) {
    if (await page.$("[data-ai-advice]")) break;
    const text = await body();
    if (/баробар наздик/.test(text)) {
        await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => /ҳарду/i.test(x.innerText))?.click());
        lastClick = Date.now();
        await sleep(1500);
        continue;
    }
    const clicked = await page.evaluate((letter) => {
        const btn = [...document.querySelectorAll("button[aria-pressed]")].find((x) => x.innerText.trim().startsWith(letter));
        btn?.click();
        return Boolean(btn);
    }, step % 3 === 0 ? "B" : "A");
    if (clicked) lastClick = Date.now();
    await sleep(clicked ? 350 : 1200);
}
await page.waitForSelector("[data-ai-advice]", { timeout: 30000 }).catch(() => {});
const resultMs = Date.now() - lastClick;
check("Натиҷа баъди ҷавоби охирин зуд пайдо шуд", resultMs < 2500, `${resultMs} ms`);
const skeleton = await page.$("[data-ai-advice] [aria-busy='true']");
console.log(`… маслиҳат дар аввал: ${skeleton ? "хатҳои интизорӣ" : "аллакай тайёр"}`);
const ok = await page.waitForFunction(() => (document.querySelector("[data-ai-advice] p")?.innerText || "").length > 40, { timeout: 45000 }).then(() => true).catch(() => false);
const adviceMs = Date.now() - lastClick;
const advice = await page.$eval("[data-ai-advice] p", (n) => n.innerText).catch(() => "");
check("Маслиҳати AI баъдтар омад (тоҷикӣ)", ok && /[ӣӯқғҳҷ]/.test(advice), `${adviceMs} ms: ${advice.slice(0, 80)}`);
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("quiz_results_v1") || "{}"));
check("Маслиҳат нигоҳ дошта шуд", Boolean(stored.aiAdviceByLang?.tj || stored.aiAdvice));
check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲама гузашт");
process.exit(failed ? 1 : 0);
