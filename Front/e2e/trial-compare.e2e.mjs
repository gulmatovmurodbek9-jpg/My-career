// E2E: «Муқоисаи касбҳои санҷидашуда» — ду касб санҷида мешавад (якум писанд, дуюм не),
// баъд дар хулоса ва дар /trial ҷадвал бо ⭐ барои касби писандида.
//   BASE_URL=http://localhost:5173 SHOTS=… node e2e/trial-compare.e2e.mjs
import puppeteer from "puppeteer-core";

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

const careerOf = async (code) => (await fetch(`${API}/careers?search=${code}&limit=5`).then((r) => r.json())).data.find((c) => c.code === code);
const first = await careerOf("1020505");
const second = await careerOf("1790101");

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const click = (re) => page.evaluate((src) => {
    const r = new RegExp(src, "i");
    const el = [...document.querySelectorAll("button")].find((b) => r.test(b.innerText.trim()) && !b.disabled);
    el?.click();
    return Boolean(el);
}, re.source);

async function runTrial(career, like) {
    await page.goto(`${BASE}/trial/career/${career.id}`, { waitUntil: "networkidle2" });
    await click(/^3\b/);
    await click(/^Оғоз/);
    await sleep(700);
    for (let t = 0; t < 4; t += 1) {
        for (let i = 0; i < 4; i += 1) {
            const ready = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "Санҷидан"); return b && !b.disabled; });
            if (ready) break;
            await page.evaluate((i) => { const o = [...document.querySelectorAll("main button")].filter((b) => /^[A-D]\s/.test(b.innerText.trim())); o[i]?.click(); }, i);
            await sleep(150);
        }
        await click(/^Санҷидан$/);
        await sleep(900);
        await click(like ? /^Ҳа, шавқовар/ : /^Не, шавқовар нест/);
        await sleep(700);
    }
    await click(like ? /Хеле!$/ : /Тамоман не$/);
    await click(like ? /Асосан ҳа$/ : /\sКам$/);
    await click(/^Хулосаро бинед/);
    await page.waitForFunction(() => /Ба шумо мувофиқ|Шояд касби дигар/.test(document.body.innerText), { timeout: 20000 }).catch(async (e) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/compare-fail.png`, fullPage: true }); throw e; });
    await sleep(800);
}

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem("assistant_greeted_v1", "1"); });

await runTrial(first, true);
check("Касби 1: ҷадвал ҳанӯз нест (танҳо як касб)", !(await page.evaluate(() => document.body.innerText.includes("Муқоисаи касбҳои санҷидашуда"))));

await runTrial(second, false);
const resultText = await page.evaluate(() => document.body.innerText);
check("Касби 2: ҷадвали муқоиса дар хулоса", resultText.includes("Муқоисаи касбҳои санҷидашуда"));
const rows = await page.evaluate(() => [...document.querySelectorAll("[data-trial-compare] ul li")].map((li) => li.innerText.replace(/\s+/g, " ").trim()));
check("Ду касб дар ҷадвал", rows.length === 2, rows.map((r) => r.slice(0, 40)).join(" | "));
check("⭐ «Ба шумо аз ҳама бештар мувофиқ» — касби писандида болост", (rows[0] || "").includes("Ба шумо аз ҳама бештар мувофиқ") && (rows[0] || "").includes(first.name.slice(0, 8)));
if (SHOTS) {
    await page.evaluate(() => [...document.querySelectorAll("h2")].find((h) => h.innerText.includes("Муқоисаи касбҳои"))?.scrollIntoView({ block: "start" }));
    await sleep(500);
    await page.screenshot({ path: `${SHOTS}/compare-desk.png` });
}

await page.goto(`${BASE}/trial`, { waitUntil: "networkidle2" });
await sleep(800);
check("/trial: муқоиса дар боло", (await page.evaluate(() => document.querySelectorAll("[data-trial-compare] table tbody tr").length)) === 2);

await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.reload({ waitUntil: "networkidle2" });
await sleep(800);
check("Телефон: кортҳо, бе лағжиши уфуқӣ", (await page.evaluate(() => document.querySelectorAll("[data-trial-compare] ul li").length)) >= 2 && !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
if (SHOTS) {
    await page.evaluate(() => [...document.querySelectorAll("h2")].find((h) => h.innerText.includes("Муқоисаи касбҳои"))?.scrollIntoView({ block: "start" }));
    await sleep(500);
    await page.screenshot({ path: `${SHOTS}/compare-mob.png` });
}

// «Аз рӯйхат бароред».
await page.evaluate(() => document.querySelector("[data-trial-compare] ul li button[aria-label]")?.click());
await sleep(500);
check("Баровардан аз рӯйхат", (await page.evaluate(() => document.querySelectorAll("[data-trial-compare] ul li").length)) === 1);

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
