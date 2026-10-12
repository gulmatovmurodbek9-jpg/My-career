// E2E: синфи намоишӣ (scripts/seed-demo-class.js) — омӯзгори ёрирасон бо филтри самт ва паём
// ба ҳама, роҳбари синф омӯзгор илова мекунад, хонанда номи омӯзгорро мебинад, волид ихтисосҳои
// фарзандро мебинад ва аз AI мепурсад.
//   TOKENS=D:/tmp/demo-tokens.json PARENT_CODE=XXXXXXXX BASE_URL=http://localhost:5175 node e2e/coteacher-parent.e2e.mjs
import fs from "fs";
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const T = JSON.parse(fs.readFileSync(process.env.TOKENS, "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const clickByText = (page, selector, pattern) => page.evaluate((sel, source) => {
    const re = new RegExp(source);
    const el = [...document.querySelectorAll(sel)].find((node) => re.test(node.innerText));
    if (el) el.click();
    return Boolean(el);
}, selector, pattern.source);
const open = async (browser, who, mobile = false) => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    if (mobile) await page.emulate(KnownDevices["iPhone 13"]); else await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate((auth) => {
        localStorage.setItem("app_lang", "tj");
        localStorage.setItem("assistant_greeted_v1", "1");
        if (auth) localStorage.setItem("auth-storage", JSON.stringify({ state: { user: auth.user, token: auth.token, isAuthenticated: true }, version: 0 }));
    }, who);
    return page;
};
const text = (page) => page.evaluate(() => document.body.innerText);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];

// 1. Омӯзгори технология (ёрирасон).
const co = await open(browser, T.co);
await co.goto(`${BASE}/dashboard/teacher`, { waitUntil: "networkidle2" });
await co.waitForFunction(() => document.body.innerText.includes("11 «А»"), { timeout: 20000 });
check("Ёрирасон: синф бо нишонаи «Омӯзгори ёрирасон · Технология»", /ОМӮЗГОРИ ЁРИРАСОН · ТЕХНОЛОГИЯ|Омӯзгори ёрирасон · Технология/i.test(await text(co)));
await co.evaluate(() => [...document.querySelectorAll("a[href^='/dashboard/teacher/']")].find((a) => a.innerText.includes("11 «А»")).click());
await co.waitForSelector("[data-cluster-filter]", { timeout: 20000 });
await sleep(800);
const filterValue = await co.$eval("[data-cluster-filter]", (s) => s.value);
const coRows = await co.$$eval("main ul li button[aria-expanded]", (b) => b.length);
check("Ёрирасон: филтр бо самти техникӣ кушода шуд", filterValue === "c1", `${filterValue}, ${coRows} хонанда`);
const coPage = await text(co);
check("Ёрирасон: «Ба бойгонӣ» ва рамзи синф нест", !coPage.includes("Ба бойгонӣ") && !coPage.includes("Ба хонандагон фиристед"));
await clickByText(co, "[data-broadcast] button", /Ба ҳамаи \d+ хонанда паём/);
await co.waitForSelector("[data-broadcast] textarea");
await co.type("[data-broadcast] textarea", "Ҳафтаи оянда ба озмуни «Роботсозӣ» омодагӣ мебинем — номнавис шавед!");
await clickByText(co, "[data-broadcast] button[type=submit]", /Фиристодан/);
await co.waitForFunction(() => /фиристода шуд/.test(document.querySelector("[data-broadcast]")?.innerText || ""), { timeout: 10000 });
check("Ёрирасон: паём ба ҳамаи самти техникӣ рафт", true, (await co.$eval("[data-broadcast]", (n) => n.innerText)).trim());
if (SHOTS) await co.screenshot({ path: `${SHOTS}/co-teacher.png`, fullPage: true });

// 2. Роҳбари синф: омӯзгор илова мекунад ва паёми омӯзгори дигарро бо номаш мебинад.
const owner = await open(browser, T.owner);
await owner.goto(`${BASE}/dashboard/teacher/${T.classId}`, { waitUntil: "networkidle2" });
await owner.waitForSelector("[data-class-teachers]", { timeout: 20000 });
check("Роҳбар: «Фирӯз Назаров · Технология · Техникӣ» дар рӯйхат", /Фирӯз Назаров[\s\S]*Технология/.test(await owner.$eval("[data-class-teachers]", (n) => n.innerText)));
await clickByText(owner, "[data-class-teachers] button", /Омӯзгор илова кунед/);
await owner.type("[data-teacher-email]", T.extraEmail);
await owner.select("[data-teacher-focus]", "c5");
await clickByText(owner, "[data-class-teachers] button[type=submit]", /Илова кардан/);
await owner.waitForFunction((n) => document.querySelector("[data-class-teachers]")?.innerText.includes(n), { timeout: 10000 }, T.extraName);
check("Роҳбар: омӯзгори нав илова шуд", true);
await clickByText(owner, "li button", /Комрон Саидов/);
await sleep(300);
await clickByText(owner, "[role=tab]", /Фидбек/);
await owner.waitForFunction(() => document.querySelector("[data-class-chat]")?.innerText.includes("Фирӯз Назаров"), { timeout: 10000 });
check("Роҳбар: паёми омӯзгори технология бо номи ӯ", true);
if (SHOTS) await owner.screenshot({ path: `${SHOTS}/owner.png`, fullPage: true });

// 3. Хонанда (телефон): «Синфи ман» — паёмҳо аз ду омӯзгор бо номҳояшон.
const student = await open(browser, T.student, true);
await student.goto(`${BASE}/class/my/${T.studentMemberId}`, { waitUntil: "networkidle2" });
await student.waitForFunction(() => document.querySelector("[data-class-chat]")?.innerText.includes("Роботсозӣ"), { timeout: 20000 });
const studentText = await text(student);
check("Хонанда: паёми омӯзгори технология бо номаш", studentText.includes("Фирӯз Назаров") && studentText.includes("Роботсозӣ"));
check("Хонанда: омори синф (ихтисосҳои маъмул)", studentText.includes("Ихтисосҳои маъмул дар синф"));

// 4. Волид: ихтисосҳои фарзанд ва савол ба AI.
const parent = await open(browser, null, true);
await parent.goto(`${BASE}/parent/${process.env.PARENT_CODE}`, { waitUntil: "networkidle2" });
await parent.waitForSelector("[data-parent-careers]", { timeout: 20000 });
const parentText = await text(parent);
check("Волид: ихтисосҳои Ҷамшед (рӯйхати ҳуҷҷатсупорӣ, захира, тест)", /Ихтисосҳое, ки Ҷамшед интихоб кардааст/.test(parentText) && /рӯйхати ҳуҷҷатсупорӣ/i.test(parentText) && parentText.includes("захира кардааст"));
await parent.evaluate(() => [...document.querySelectorAll("[data-parent-ask] button")].find((b) => /Чаро мувофиқ/.test(b.innerText)).click());
await parent.waitForFunction(() => {
    const box = document.querySelector("[data-parent-ask]");
    return box && !/AI фикр мекунад/.test(box.innerText) && box.querySelectorAll("p").length >= 1;
}, { timeout: 60000 });
const answer = await parent.$eval("[data-parent-ask]", (n) => n.innerText);
check("Волид: AI ҷавоб дод", answer.length > 120, answer.replace(/\n/g, " ").slice(0, 160));
if (SHOTS) await parent.screenshot({ path: `${SHOTS}/parent-ai.png`, fullPage: true });

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
