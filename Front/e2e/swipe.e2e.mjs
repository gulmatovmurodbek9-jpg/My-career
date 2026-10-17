// E2E: «Касб-свайп» — телефон: кашидан бо ангушт (рост/чап), тугмаҳо, «Бозгашт», натиҷа
// (хусусиятҳо, самт, ихтисосҳо бо сабаб, суратҳо); 3 бозӣ — 90 сурати гуногун; компютер: тугмаҳои ← →.
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
const saved = await phone.evaluate(() => JSON.parse(localStorage.getItem("swipe_round_v2")).choices);
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
await phone.waitForSelector("[data-swipe-career]", { timeout: 15000 }).catch(() => {});
const careerTexts = await phone.$$eval("[data-swipe-career]", (n) => n.map((a) => a.innerText));
check("Натиҷа: ихтисосҳо аз суратҳои маъқул (бо сабаб)", careerTexts.length >= 3 && careerTexts.some((t) => /Чунки маъқул шуд/.test(t)), `${careerTexts.length}: ${careerTexts[0]?.replace(/\n/g, " / ")}`);
check("Натиҷа: суратҳои маъқулшуда", (await phone.$$eval("[data-swipe-result] img", (n) => n.length)) >= 10);
if (SHOTS) await phone.screenshot({ path: `${SHOTS}/swipe-result.png`, fullPage: true });

// Се бозӣ паи ҳам — ягон сурат такрор намешавад.
const decks = [await phone.evaluate(() => JSON.parse(localStorage.getItem("swipe_round_v2")).deck)];
for (let round = 0; round < 2; round += 1) {
    await phone.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Аз нав/.test(b.innerText)).click());
    await phone.waitForSelector("[data-swipe-card]");
    for (let i = 0; i < 40; i += 1) {
        if (await phone.$("[data-swipe-result]")) break;
        await phone.evaluate(() => document.querySelector("[data-swipe-yes]").click());
        await sleep(280);
    }
    await phone.waitForSelector("[data-swipe-result]", { timeout: 10000 });
    decks.push(await phone.evaluate(() => JSON.parse(localStorage.getItem("swipe_round_v2")).deck));
}
const allIds = decks.flat();
check("Се бозӣ: 90 сурат, ҳеҷ кадом такрор нашуд", allIds.length === 90 && new Set(allIds).size === 90, `${allIds.length} / ${new Set(allIds).size}`);
const broken = await phone.evaluate(async (ids) => (await Promise.all(ids.map((id) => fetch(`/swipe/${id}.webp`).then((r) => (r.ok && (r.headers.get("content-type") || "").includes("image") ? null : id))))).filter(Boolean), allIds);
check("Ҳамаи суратҳо ҳастанд", broken.length === 0, broken.slice(0, 5).join(", "));

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
const choicesDesk = await desk.evaluate(() => JSON.parse(localStorage.getItem("swipe_round_v2")).choices);
check("Компютер: → маъқул, ← не", choicesDesk[a] === true && choicesDesk[b] === false && (await current(desk)) !== b);

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
