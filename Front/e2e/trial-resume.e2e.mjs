// E2E: «Худро дар касб санҷед» — пешрафт нигоҳ дошта мешавад: вазифаи 1 → саҳифаи дигар →
// бозгашт (ва F5) → ҳамон вазифаи 2 бо ҳамон боварӣ.
//   CODE=1020505 BASE_URL=http://localhost:5173 node e2e/trial-resume.e2e.mjs
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || (BASE.includes("localhost") ? "http://localhost:3005/api" : `${BASE}/api`);
const CODE = process.env.CODE || "1020505";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const list = await fetch(`${API}/careers?search=${CODE}&limit=5`).then((r) => r.json());
const career = (list.data || []).find((c) => c.code === CODE);
const url = `${BASE}/trial/career/${career.id}`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const click = (re) => page.evaluate((src) => {
    const r = new RegExp(src, "i");
    const el = [...document.querySelectorAll("button")].find((b) => r.test(b.innerText.trim()) && !b.disabled);
    el?.click();
    return Boolean(el);
}, re.source);
const taskLabel = () => page.evaluate(() => (document.body.innerText.match(/ВАЗИФАИ\s+\d+\s+АЗ\s+\d+/i) || [""])[0]);

await page.goto(url, { waitUntil: "networkidle2" });
await page.evaluate(() => localStorage.removeItem && Object.keys(localStorage).filter((k) => k.startsWith("trial_progress")).forEach((k) => localStorage.removeItem(k)));
await page.reload({ waitUntil: "networkidle2" });
await click(/^4\b/);
await click(/^Оғоз/);
await sleep(800);
// Вазифаи 1: вариантҳо то фаъол шудани «Санҷидан».
for (let i = 0; i < 4; i += 1) {
    const ready = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "Санҷидан"); return b && !b.disabled; });
    if (ready) break;
    await page.evaluate((i) => { const o = [...document.querySelectorAll("main button")].filter((b) => /^[A-D]\s/.test(b.innerText.trim())); o[i]?.click(); }, i);
    await sleep(200);
}
await click(/^Санҷидан$/);
await sleep(1200);
await click(/^Ҳа, шавқовар/);
await sleep(800);
check("Баъди вазифаи 1 — вазифаи 2", /2\s+АЗ\s+4/i.test(await taskLabel()), await taskLabel());

await page.goto(`${BASE}/careers`, { waitUntil: "networkidle2" });
await page.goBack({ waitUntil: "networkidle2" });
await sleep(1500);
check("Ба қафо: ҳамон вазифаи 2", /2\s+АЗ\s+4/i.test(await taskLabel()), await taskLabel());

await page.reload({ waitUntil: "networkidle2" });
await sleep(1500);
check("F5: ҳамон вазифаи 2", /2\s+АЗ\s+4/i.test(await taskLabel()), await taskLabel());

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.goto(url, { waitUntil: "networkidle2" });
await sleep(1500);
check("Аз пайванд дубора кушодан: ҳамон вазифаи 2", /2\s+АЗ\s+4/i.test(await taskLabel()), await taskLabel());

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("trial_progress")).forEach((k) => localStorage.removeItem(k)));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
