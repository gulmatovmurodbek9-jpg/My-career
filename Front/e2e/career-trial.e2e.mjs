// E2E: «Як рӯз дар ихтисос» барои ихтисоси мушаххас (8 вазифа) — аз корти ихтисос то хулоса:
// рӯзи корӣ → 8 вазифа (ҷавоб → шарҳ, «аз ҳозир машқ кунед» → 👍/👎) → плюс/минус → хулоса
// (кластер, рамз, дар куҷо хондан, захира). Бе ворид шудан.
//
//   npm run e2e:career-trial                         (маҳаллӣ)
//   BASE_URL=https://ikhtisosiman.qobus.tj npm run e2e:career-trial
//   CODE=1560201 — ихтисоси дигар (бояд сенарияи тайёр дошта бошад).
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || (BASE.includes("localhost") ? "http://localhost:3005/api" : `${BASE}/api`);
const CODE = process.env.CODE || "1740201";
const CHROME = process.env.CHROME || (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "/usr/bin/google-chrome");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const list = await fetch(`${API}/careers?search=${CODE}&limit=5`).then((r) => r.json());
const career = (list.data || []).find((item) => item.code === CODE);
if (!career) {
    console.error(`Ихтисос ${CODE} ёфт нашуд`);
    process.exit(2);
}
const scenario = await fetch(`${API}/trial/career/${career.id}?lang=tj`).then((r) => r.json());
check("API: 8 вазифа (5 + 3)", scenario.tasks?.length === 8 && scenario.tasks.filter((t) => t.skill === "soft").length === 3);
check("API: ҷавобҳо пинҳон", !/"feedback"|"answer"|"steps"|"tip"/.test(JSON.stringify(scenario)));
check("API: рӯзи корӣ ва плюс/минус", scenario.day?.length >= 5 && scenario.pros?.length >= 7 && scenario.cons?.length >= 7);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.evaluateOnNewDocument(() => localStorage.setItem("app_lang", "tj"));
    const text = () => page.evaluate(() => document.body.innerText);
    const click = (label) => page.evaluate((label) => {
        const el = [...document.querySelectorAll("button, a")].find((x) => x.innerText.trim().includes(label) && !x.disabled);
        el?.click();
        return Boolean(el);
    }, label);

    // Аз корти ихтисос (рӯйхат) — тугмаи «Як рӯз дар ихтисос».
    await page.goto(`${BASE}/careers`, { waitUntil: "networkidle2" });
    await sleep(1200);
    const chips = await page.evaluate(() => [...document.querySelectorAll("button")].filter((x) => x.innerText.includes("Як рӯз дар ихтисос")).length);
    check("Тугма дар ҳар корт", chips >= 6, `${chips} корт`);

    await page.goto(`${BASE}/trial/career/${career.id}`, { waitUntil: "networkidle2" });
    await sleep(1000);
    const intro = await text();
    check("Муқаддима: ном, рӯзи корӣ, огоҳии AI", intro.includes(scenario.role) && intro.includes("Як рӯзи корӣ") && intro.includes("AI"));
    await click("Намедонам");
    await click("Оғоз");
    await sleep(500);

    for (let i = 0; i < scenario.tasks.length; i += 1) {
        const task = scenario.tasks[i];
        // Ҷавоб: варианти аввал / ду варианти аввал / ҳамаи вариантҳо бо тартиб.
        const picks = task.kind === "choice" ? [task.options[0]] : task.kind === "multi" ? task.options.slice(0, 2) : task.options;
        for (const option of picks) {
            await page.evaluate((label) => {
                const el = [...document.querySelectorAll("button[aria-pressed]")].find((x) => x.innerText.includes(label));
                el?.click();
            }, option.text.slice(0, 40));
        }
        await click("Санҷидан");
        await sleep(900);
        const body = (await text()).toLowerCase();
        if (i === 0) check("Шарҳ: чаро, кори воқеӣ, машқ, малака", body.includes("чаро чунин аст") && body.includes("дар кори воқеӣ") && body.includes("аз ҳозир машқ кунед") && body.includes("малакае, ки шумо санҷидед"));
        if (!body.includes("ин қисми кор ба шумо шавқовар буд")) {
            check(`Вазифаи ${i + 1}: шарҳ пайдо нашуд`, false);
            break;
        }
        await click(i % 2 ? "Не, шавқовар нест" : "Ҳа, шавқовар");
        await sleep(500);
    }
    const end = await text();
    check("Плюсҳо ва минусҳо", end.includes("Ҷиҳатҳои мусбат") && end.includes("Ҷиҳатҳои манфӣ") && end.includes("Ба кӣ мувофиқ аст"));
    await page.evaluate(() => {
        const pick = (label) => [...document.querySelectorAll("button[aria-pressed]")].find((x) => x.innerText.includes(label))?.click();
        pick("Хуб");
        pick("Асосан ҳа");
    });
    await click("Хулосаро бинед");
    await sleep(1800);
    const result = await text();
    check("Хулоса: аз 8", /аз 8 вазифаро ҳал кардед/.test(result));
    check("Хулоса: касбӣ / бо одамон", result.toLowerCase().includes("малакаи касбӣ") && result.toLowerCase().includes("кор бо одамон"));
    check("Хулоса: кластер ва рамз", result.includes("Кластер:") && result.includes(`Рамз: ${CODE}`));
    check("Хулоса: дар куҷо хондан", result.includes("Дар куҷо таҳсил кардан мумкин"));
    check("Хулоса: захира (бе ворид — тугмаи ворид)", result.includes("Барои захира ворид шавед"));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check("Дар телефон уфуқӣ намелағжад", !overflow);
    check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
} finally {
    await browser.close();
}
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
