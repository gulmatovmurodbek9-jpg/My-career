// E2E: ҳамон роҳе, ки журӣ дар намоиш мебинад — ворид шудан → синф → ҳамаи саволҳо →
// натиҷа → «Что делать дальше?» → кушодани ихтисоси аввал.
//
//   E2E_EMAIL=… E2E_PASSWORD=… npm run e2e            (сайти маҳаллӣ: http://localhost:5173)
//   BASE_URL=https://ikhtisosiman.qobus.tj E2E_EMAIL=… E2E_PASSWORD=… npm run e2e
//   CHROME=/path/to/chrome — агар Chrome дар ҷои дигар бошад.
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const CHROME = process.env.CHROME || (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "/usr/bin/google-chrome");
if (!EMAIL || !PASSWORD) {
    console.error("E2E_EMAIL ва E2E_PASSWORD лозиманд (ҳисоби санҷишӣ).");
    process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluateOnNewDocument(() => {
        localStorage.setItem("app_lang", "ru");
        localStorage.removeItem("school_grade");
    });
    const text = () => page.evaluate(() => document.body.innerText);
    const click = (label) => page.evaluate((label) => {
        const el = [...document.querySelectorAll("button, a")].find((x) => x.innerText.trim().includes(label));
        el?.click();
        return Boolean(el);
    }, label);

    await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="email"]', EMAIL);
    await page.type('input[type="password"]', PASSWORD);
    await page.evaluate(() => document.querySelector('input[type="password"]').form.requestSubmit());
    await sleep(2500);

    await page.goto(`${BASE}/quiz`, { waitUntil: "networkidle2" });
    await sleep(1500);
    check("Саволи синф", (await text()).includes("После какого класса вы поступаете?"));
    await click("После 11 класса — колледж и вуз");
    await sleep(700);

    for (let step = 0; step < 60; step += 1) {
        const body = await text();
        if (body.includes("Что делать дальше?")) break;
        if (body.includes("Два направления вам одинаково близки")) {
            await click("Не знаю — мне близки оба");
            await sleep(2500);
            continue;
        }
        const clicked = await page.evaluate((letter) => {
            const btn = [...document.querySelectorAll("button[aria-pressed]")].find((x) => x.innerText.trim().startsWith(letter));
            btn?.click();
            return Boolean(btn);
        }, step % 3 === 0 ? "B" : "A");
        await sleep(clicked ? 450 : 1500);
    }
    for (let i = 0; i < 60 && !(await text()).includes("Что делать дальше?"); i += 1) await sleep(1000);

    const result = await text();
    check("Натиҷа: самт", result.includes("Подходящее вам направление"));
    check("Натиҷа: «Что делать дальше?»", result.includes("Что делать дальше?"));
    check("Натиҷа: бе «вероятность успеха»", !/вероятност/i.test(result));

    const href = await page.evaluate(() => document.querySelector('article a[href^="/info/"]')?.getAttribute("href"));
    check("Ихтисоси мувофиқ ҳаст", Boolean(href), href || "");
    if (href) {
        await page.goto(`${BASE}${href}`, { waitUntil: "networkidle2" });
        await sleep(1500);
        const title = await page.evaluate(() => document.querySelector("h1")?.innerText || "");
        check("Саҳифаи ихтисос кушода шуд", title.length > 2, title.slice(0, 60));
    }
    check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
} finally {
    await browser.close();
}
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
