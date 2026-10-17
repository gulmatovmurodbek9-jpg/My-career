// E2E: «Бо оила маслиҳат кунед» (17.10) — як пайванд барои тамоми оила.
// Волид ихтисосҳоро фавран мебинад (бе 10 савол), ба фарзанд менависад ва аз AI мепурсад;
// фарзанд ҳамаашро дар кабинет мебинад; баъди тести нав ҳамон пайванд нав мешавад.
//   TOKENS=D:/tmp/demo-tokens.json API_URL=http://localhost:3005 BASE_URL=http://localhost:5175 node e2e/family.e2e.mjs
import fs from "fs";
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || "http://localhost:3005";
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const T = process.env.TOKENS ? JSON.parse(fs.readFileSync(process.env.TOKENS, "utf8")) : {};
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const json = async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    return { status: res.status, data: await res.json().catch(() => null) };
};

// Се ихтисоси воқеӣ аз база.
const list = await json("/careers?limit=3&lang=tj");
const items = (list.data?.data || list.data?.items || list.data || []).slice(0, 3);
check("Ихтисосҳо барои тест ҳастанд", items.length === 3, String(items.length));
const careers = items.map((c, i) => ({ id: c.id, name: c.name, percent: 80 - i * 10 }));
const scores = { c1: 24, c2: 6, c3: 4, c4: 3, c5: 3 };

const created = await json("/parents/invites", { method: "POST", body: JSON.stringify({ childName: "Санҷиш", scores, lang: "tj", careers }) });
const { code, secret } = created.data || {};
check("Пайванди оила сохта шуд", created.status === 201 && code && secret, String(created.status));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];
const context = await browser.createBrowserContext();
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.emulate(KnownDevices["iPhone 13"]);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.evaluate(() => { localStorage.setItem("app_lang", "tj"); localStorage.setItem("assistant_greeted_v1", "1"); });

// 1. Волид: ихтисосҳо фавран, бе 10 савол.
await page.goto(`${BASE}/parent/${code}`, { waitUntil: "networkidle2" });
await page.waitForSelector("[data-family-career]", { timeout: 20000 });
let body = await page.evaluate(() => document.body.innerText);
check("Волид ихтисосҳоро фавран мебинад", (await page.$$("[data-family-career]")).length === 3 && body.includes("Санҷиш ихтисосҳояшро бо шумо мубодила кард"));
check("10 савол ихтиёрист (корт, на монеа)", !!(await page.$("[data-family-survey]")));

// 2. «Модар» → паём ба фарзанд.
await page.tap('[data-author="mother"]');
const first = await page.$("[data-family-career]");
const area = await first.$("textarea");
await area.tap();
await area.type("Писарам, ин ихтисос ба ту хеле мувофиқ аст!");
await (await first.$("[data-family-write]")).tap();
await page.waitForSelector("[data-family-note]", { timeout: 10000 });
const note = await page.$eval("[data-family-note]", (n) => n.innerText);
check("Паёми модар зери ихтисос пайдо шуд", /Модар/.test(note) && /мувофиқ аст/.test(note), note.replace(/\n/g, " "));

// 3. Саволи тайёр ба AI.
await page.evaluate(() => [...document.querySelectorAll("[data-family-career]")][0].querySelectorAll("button")
    .forEach((b) => { if (/Ин чист\?/.test(b.innerText)) b.click(); }));
const aiOk = await page.waitForFunction(() => /Модар пурсид/.test(document.querySelector("[data-family-career]").innerText) && !/AI фикр мекунад/.test(document.querySelector("[data-family-career]").innerText), { timeout: 50000 }).then(() => true).catch(() => false);
check("AI ба саволи модар ҷавоб дод", aiOk);
if (SHOTS) await page.screenshot({ path: `${SHOTS}/family-parent.png`, fullPage: true });

// 4. Пас аз аз нав кушодан ҳама чиз мемонад (дар база).
await page.reload({ waitUntil: "networkidle2" });
await page.waitForSelector("[data-family-note]", { timeout: 15000 });
check("Паём ва савол баъди аз нав кушодан мемонанд", /Модар пурсид/.test(await page.evaluate(() => document.body.innerText)));

// 5. Фарзанд (бо калид) ҳамаашро мегирад.
const child = await json(`/parents/invites/${code}/result?secret=${encodeURIComponent(secret)}`);
const kinds = (child.data?.notes || []).map((n) => `${n.author}:${n.kind}`);
check("Фарзанд паём ва саволи модарро мебинад", kinds.includes("mother:note") && kinds.includes("mother:ask"), kinds.join(", "));

// 6. 10 саволи волид → муқоиса.
await page.evaluate(() => document.querySelector("[data-family-survey]").click()); // tap метавонад зери ёвари сайт афтад
for (let i = 0; i < 10; i += 1) {
    await page.waitForFunction((n) => document.querySelectorAll("main button, body button").length > 3 && (n < 9 ? /Саволи/.test(document.body.innerText) : /Хоҳиши шумо/.test(document.body.innerText)), {}, i);
    await page.evaluate(() => {
        const options = [...document.querySelectorAll("button")].filter((b) => b.className.includes("py-4") && b.className.includes("w-full"));
        options[0].click();
    });
    await new Promise((r) => setTimeout(r, 150));
}
await page.waitForFunction(() => /Ташаккур/.test(document.body.innerText), { timeout: 15000 });
body = await page.evaluate(() => document.body.innerText);
check("Баъди 10 савол муқоиса ва паёмҳо дар як саҳифа", /Мувофиқат/.test(body) && /мувофиқ аст/.test(body));

// 7. Тести нав: ҳамон пайванд нав мешавад, 10 савол аз нав, паёмҳо мемонанд.
const refreshed = await json(`/parents/invites/${code}/refresh`, { method: "POST", body: JSON.stringify({ secret, scores: { c1: 3, c2: 4, c3: 5, c4: 6, c5: 22 }, careers }) });
check("Навсозӣ баъди тести нав", refreshed.status === 200 && refreshed.data?.answered === false && refreshed.data?.childScores?.c5 === 22 && refreshed.data?.notes?.length >= 2,
    `answered=${refreshed.data?.answered} c5=${refreshed.data?.childScores?.c5} notes=${refreshed.data?.notes?.length}`);
const wrongKey = await json(`/parents/invites/${code}/refresh`, { method: "POST", body: JSON.stringify({ secret: "xxx", scores }) });
check("Бе калид нав кардан мумкин нест", wrongKey.status === 404, String(wrongKey.status));

// 8. Фарзанд дар кабинет: паёми модар ва тугмаҳои фиристодан.
if (T.student?.token) {
    const kid = await context.newPage();
    kid.on("pageerror", (e) => errors.push(e.message));
    await kid.setViewport({ width: 1280, height: 900 });
    await kid.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await kid.evaluate((auth, invite) => {
        localStorage.setItem("auth-storage", JSON.stringify({ state: { user: auth.user, token: auth.token, isAuthenticated: true }, version: 0 }));
        localStorage.setItem("parent_invite_v1", JSON.stringify(invite));
    }, T.student, { code, secret, childName: "Санҷиш" });
    await kid.goto(`${BASE}/dashboard`, { waitUntil: "networkidle2" });
    const seen = await kid.waitForSelector("[data-family-note]", { timeout: 20000 }).then(() => true).catch(() => false);
    const kidText = await kid.evaluate(() => document.querySelector("[data-family]")?.innerText || "");
    check("Фарзанд дар кабинет паёми модарро мебинад", seen && /Модар/.test(kidText) && /WhatsApp/.test(kidText));
    check("Дар кабинет тугмаи «натиҷаи нав» нест (танҳо дар саҳифаи тест)", !(await kid.$("[data-family-retake]")));
    if (SHOTS) await kid.screenshot({ path: `${SHOTS}/family-child.png`, fullPage: true });
} else {
    console.log("… кабинети фарзанд санҷида нашуд (TOKENS нест)");
}

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲама гузашт");
console.log(`CODE=${code}`);
process.exit(failed ? 1 : 0);
