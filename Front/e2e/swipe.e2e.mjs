// E2E: «Касб-свайп» — телефон: кашидан бо ангушт (рост/чап), тугмаҳо, «Бозгашт», натиҷа
// (хусусиятҳо, самт, ихтисосҳо, суратҳо); компютер: тугмаҳои ← →.
//   BASE_URL=http://localhost:5173 node e2e/swipe.e2e.mjs
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const errors = [];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

const open = async (mobile) => {
    const page = await (await browser.createBrowserContext()).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    if (mobile) await page.emulate(KnownDevices["iPhone 13"]); else await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { localStorage.setItem("app_lang", "tj"); localStorage.setItem("assistant_greeted_v1", "1"); });
    return page;
};
const current = (page) => page.$eval("[data-swipe-card]", (n) => n.dataset.swipeCard).catch(() => null);

// 1. Телефон.
const phone = await open(true);
await phone.goto(`${BASE}/swipe`, { waitUntil: "networkidle2" });
check("Саҳифаи оғоз бо суратҳо", (await phone.$$eval("main img", (n) => n.filter((i) => i.complete && i.naturalWidth > 0).length)) >= 6);
await phone.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Оғоз/.test(b.innerText)).click());
await phone.waitForSelector("[data-swipe-card]");
const first = await current(phone);
const imgOk = await phone.$eval("[data-swipe-card] img", (i) => new Promise((res) => (i.complete ? res(i.naturalWidth > 0) : (i.onload = () => res(true), i.onerror = () => res(false)))));
check("Корти аввал бо сурат", imgOk, first);
if (SHOTS) await phone.screenshot({ path: `${SHOTS}/swipe-card.png` });

// Кашидан бо ангушт: рост → маъқул.
const swipe = async (dx) => {
    const box = await (await phone.$("[data-swipe-card]")).boundingBox();
    const y = box.y + box.height / 2;
    const x = box.x + box.width / 2;
    await phone.touchscreen.touchStart(x, y);
    for (let i = 1; i <= 8; i += 1) { await phone.touchscreen.touchMove(x + (dx * i) / 8, y); await sleep(16); }
    await phone.touchscreen.touchEnd();
    await sleep(600);
};
await swipe(220);
const second = await current(phone);
check("Кашидан ба рост — корти навбатӣ", second && second !== first, `${first} → ${second}`);
await swipe(-220);
check("Кашидан ба чап — корти навбатӣ", (await current(phone)) !== second);
const saved = await phone.evaluate(() => JSON.parse(localStorage.getItem("swipe_result_v1")).choices);
check("Интихобҳо: ❤️ ва ✖️ сабт шуданд", saved[first] === true && saved[second] === false, JSON.stringify(saved));
// «Бозгашт»
await phone.evaluate(() => document.querySelector('button[aria-label="Бозгашт"]').click());
await sleep(400);
check("«Бозгашт» корти пешинаро бармегардонад", (await current(phone)) === second);
// Боқимонда бо тугмаҳо: ҳар сеюм ✖️.
for (let i = 0; i < 40; i += 1) {
    if (await phone.$("[data-swipe-result]")) break;
    await phone.evaluate((like) => document.querySelector(like ? "[data-swipe-yes]" : "[data-swipe-no]").click(), i % 3 !== 0);
    await sleep(320);
}
await phone.waitForSelector("[data-swipe-result]", { timeout: 10000 });
await phone.waitForFunction(() => document.querySelector("[data-swipe-result]").innerText.includes("Ихтисосҳое, ки"), { timeout: 15000 }).catch(() => {});
const result = await phone.$eval("[data-swipe-result]", (n) => n.innerText);
check("Натиҷа: «Ба ту инҳо маъқуланд» ва самт", /ба ту инҳо маъқуланд/i.test(result) && /самти ба ту наздик/i.test(result));
check("Натиҷа: 5 ихтисос аз база", (await phone.$$eval("[data-swipe-result] a[href^='/info/']", (n) => n.length)) === 5);
check("Натиҷа: суратҳои маъқулшуда", (await phone.$$eval("[data-swipe-result] img", (n) => n.length)) >= 10);
if (SHOTS) await phone.screenshot({ path: `${SHOTS}/swipe-result.png`, fullPage: true });

// 2. Компютер: тугмаҳои клавиатура.
const desk = await open(false);
await desk.goto(`${BASE}/swipe`, { waitUntil: "networkidle2" });
await desk.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Оғоз/.test(b.innerText)).click());
await desk.waitForSelector("[data-swipe-card]");
const a = await current(desk);
await desk.keyboard.press("ArrowRight");
await sleep(500);
const b = await current(desk);
await desk.keyboard.press("ArrowLeft");
await sleep(500);
const choicesDesk = await desk.evaluate(() => JSON.parse(localStorage.getItem("swipe_result_v1")).choices);
check("Компютер: → маъқул, ← не", choicesDesk[a] === true && choicesDesk[b] === false && (await current(desk)) !== b);

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
