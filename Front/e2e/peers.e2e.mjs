// E2E: «Дӯстон маро чӣ гуна мебинанд» (360°) — хонанда худро баҳо медиҳад ва пайванд месозад;
// дӯсти 1 ҷавоб медиҳад (натиҷа ҳанӯз пинҳон); дӯсти 2 → натиҷа: миёна, сифатҳои пинҳон, самт.
//   BASE_URL=http://localhost:5173 node e2e/peers.e2e.mjs
// Дар охир PEER_CODE чоп мешавад — барои нест кардани сатрҳои санҷишӣ.
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
const open = async () => {
    const page = await (await browser.createBrowserContext()).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.emulate(KnownDevices["iPhone 13"]);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { localStorage.setItem("app_lang", "tj"); localStorage.setItem("assistant_greeted_v1", "1"); });
    return page;
};
// Баҳо: { trait: 1..5 } → тугмаҳо.
const rate = async (page, values) => {
    for (const [trait, n] of Object.entries(values)) {
        await page.evaluate((t, v) => document.querySelectorAll(`[data-peer-trait="${t}"] [role=radio]`)[v - 1].click(), trait, n);
    }
};
const SELF = { leader: 2, accurate: 4, creative: 2, helpful: 3, logical: 5, patient: 2, brave: 2, social: 3 };
const FRIEND = { leader: 4, accurate: 4, creative: 4, helpful: 4, logical: 4, patient: 4, brave: 4, social: 4 };

// 1. Хонанда.
const me = await open();
await me.goto(`${BASE}/peers`, { waitUntil: "networkidle2" });
await me.waitForSelector("[data-peer-name]");
await me.type("[data-peer-name]", "Ҷамшед");
check("Тугма то баҳои ҳамаи 8 сифат хира аст", await me.$eval("[data-peer-create]", (b) => b.disabled));
await rate(me, SELF);
await me.click("[data-peer-create]");
await me.waitForSelector("[data-peer-share]", { timeout: 15000 });
const link = await me.$eval("[data-peer-share] code", (n) => n.innerText.trim());
const code = link.split("/").pop();
console.log(`PEER_CODE=${code}`);
check("Пайванд сохта шуд", /\/peer\/[A-Z2-9]{8}$/.test(link), link);

// 2. Дӯсти якум.
const f1 = await open();
await f1.goto(`${BASE}/peer/${code}`, { waitUntil: "networkidle2" });
await f1.waitForSelector("[data-peer-answer]");
check("Дӯст: «Ҷамшед аз шумо мепурсад»", (await f1.evaluate(() => document.body.innerText)).includes("Ҷамшед аз шумо мепурсад"));
await f1.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.trim() === "Ҳамсинф").click());
await rate(f1, FRIEND);
if (SHOTS) await f1.screenshot({ path: `${SHOTS}/peer-friend.png`, fullPage: true });
await f1.click("[data-peer-send]");
await f1.waitForSelector("[data-peer-thanks]", { timeout: 10000 });
check("Дӯсти 1: ташаккур", true);

// Пас аз 1 ҷавоб натиҷа пинҳон.
await me.reload({ waitUntil: "networkidle2" });
await me.waitForSelector("[data-peer-share]");
check("Пас аз 1 ҷавоб натиҷа пинҳон аст", !(await me.$("[data-peer-result]")) && (await me.$eval("[data-peer-share]", (n) => n.innerText)).includes("Ҷавоб доданд: 1"));

// 3. Дӯсти дуюм → натиҷа.
const f2 = await open();
await f2.goto(`${BASE}/peer/${code}`, { waitUntil: "networkidle2" });
await f2.waitForSelector("[data-peer-answer]");
await rate(f2, { ...FRIEND, leader: 5, creative: 5 });
await f2.click("[data-peer-send]");
await f2.waitForSelector("[data-peer-thanks]", { timeout: 10000 });
await me.reload({ waitUntil: "networkidle2" });
await me.waitForSelector("[data-peer-result]", { timeout: 15000 });
await sleep(1500);
const result = await me.$eval("[data-peer-result]", (n) => n.innerText);
check("Натиҷа: 2 ҷавоб ва миёнаи дигарон", result.includes("2 ҷавоб") && /4\.5/.test(result));
check("Сифатҳои пинҳон: Роҳбарӣ ва Эҷодкорӣ", /Сифатҳои пинҳон[\s\S]*Роҳбарӣ[\s\S]*\+2\.5/.test(result) && result.includes("Эҷодкорӣ"));
check("Фикри шумо баландтар: Мантиқ", /Фикри шумо баландтар[\s\S]*Мантиқ/.test(result));
check("Самт ва ихтисосҳо", /Самти мувофиқ/i.test(result) && (await me.$$eval("[data-peer-result] a[href^='/info/']", (n) => n.length)) > 0);
if (SHOTS) await me.screenshot({ path: `${SHOTS}/peer-result.png`, fullPage: true });

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
