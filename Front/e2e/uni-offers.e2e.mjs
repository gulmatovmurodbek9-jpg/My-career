// E2E: саҳифаи донишгоҳ — дар корти ҳар ихтисос «Буҷетӣ / Пулакӣ аз … сомонӣ» ва тугмаи
// «Ба рӯйхати ҳуҷҷатсупорӣ» (меҳмон → воридшавӣ; бо ҳисоб → илова ва баровардан).
//   TOKENS=D:/tmp/family-tokens.json API_URL=http://localhost:3005/api BASE_URL=http://localhost:5175 node e2e/uni-offers.e2e.mjs
import fs from "fs";
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || "http://localhost:3005/api";
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const T = process.env.TOKENS ? JSON.parse(fs.readFileSync(process.env.TOKENS, "utf8")) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// Донишгоҳе, ки ихтисосҳояш пешниҳод доранд.
const list = await (await fetch(`${API}/universities?limit=40`)).json();
const unis = list.data || list.items || list;
let uniId = null;
for (const uni of unis) {
    const specs = await (await fetch(`${API}/universities/${uni.id}/specialties`)).json();
    if (Array.isArray(specs) && specs.some((s) => s.offerings?.length === 1) && specs.some((s) => s.offerings?.some((o) => o.paymentType === "ройгон"))) { uniId = uni.id; break; }
}
check("Донишгоҳ бо пешниҳодҳо ёфт шуд", !!uniId, uniId || "");

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];
const open = async (auth) => {
    const page = await (await browser.createBrowserContext()).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.emulate(KnownDevices["iPhone 13"]);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate((a) => {
        localStorage.setItem("app_lang", "tj");
        localStorage.setItem("assistant_greeted_v1", "1");
        if (a) localStorage.setItem("auth-storage", JSON.stringify({ state: { user: a.user, token: a.token, isAuthenticated: true }, version: 0 }));
    }, auth);
    await page.goto(`${BASE}/universities/${uniId}`, { waitUntil: "networkidle2" });
    await page.waitForSelector("[data-offer-badges]", { timeout: 20000 });
    return page;
};

// 1. Меҳмон: нишонаҳо ва тугма ба воридшавӣ.
const guest = await open(null);
const badges = await guest.$$eval("[data-offer-badges]", (n) => n.map((x) => x.innerText).join(" | "));
check("Нишонаҳо: «Буҷетӣ» ва/ё «Пулакӣ · аз … сомонӣ/сол»", /Буҷетӣ/.test(badges) && /сомонӣ\/сол/.test(badges), badges.slice(0, 120));
const loginHref = await guest.$eval("a[href^='/login?next=']", (a) => a.getAttribute("href")).catch(() => null);
check("Меҳмон: тугма ба воридшавӣ мебарад", loginHref === `/login?next=${encodeURIComponent(`/universities/${uniId}`)}`, loginHref || "");
if (SHOTS) await guest.screenshot({ path: `${SHOTS}/uni-offers-guest.png` });

// 2. Бо ҳисоб: илова → «Дар рӯйхат», баъд баровардан (рӯйхати хонанда тағйир намеёбад).
if (T.student?.token) {
    const page = await open(T.student);
    const index = await page.$$eval("[data-offer-apply]", (els) => els.findIndex((el) => el.dataset.offerCount === "1" && !/Дар рӯйхат/.test(el.innerText)));
    check("Корти бо як пешниҳод ҳаст", index >= 0, String(index));
    if (index >= 0) {
        const click = () => page.evaluate((i) => document.querySelectorAll("[data-offer-apply]")[i].querySelector("button").click(), index);
        await click();
        await sleep(1500);
        const state = await page.evaluate((i) => document.querySelectorAll("[data-offer-apply]")[i].innerText, index);
        const conflict = /Тоза карда илова кунед/.test(state);
        check("Илова ба рӯйхат (ё огоҳии кластер)", /Дар рӯйхати ҳуҷҷатсупорӣ/.test(state) || conflict, state.replace(/\n/g, " ").slice(0, 100));
        if (SHOTS) await page.screenshot({ path: `${SHOTS}/uni-offers-added.png` });
        if (!conflict) {
            await click();
            await sleep(1500);
            const back = await page.evaluate((i) => document.querySelectorAll("[data-offer-apply]")[i].innerText, index);
            check("Баровардан аз рӯйхат", /Ба рӯйхати ҳуҷҷатсупорӣ/.test(back), back.replace(/\n/g, " ").slice(0, 60));
        }
        // Корт ҳанӯз ба саҳифаи ихтисос мебарад.
        const href = await page.evaluate((i) => document.querySelectorAll("[data-offer-apply]")[i].closest(".glass-card")?.querySelector("h3 a")?.getAttribute("href"), index);
        check("Номи ихтисос ба саҳифаи ихтисос мебарад", /^\/info\//.test(href || ""), href || "");
    }
}

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲама гузашт");
process.exit(failed ? 1 : 0);
