// E2E: «Чаро ин касб?» ва «Касб дар соли 2035» (AI, саҳифаи ихтисос), «Ҳисоботи мактаб»
// (омӯзгори намоишӣ, синфи NAMUNA) ва сертификат бо QR (API → саҳифаи тасдиқ + кашидани canvas).
//   TEACHER_TOKEN=… TEACHER_USER='{…}' BASE_URL=http://localhost:5173 node e2e/insights.e2e.mjs
// Дар охир CERT_CODE чоп мешавад — барои нест кардани сатри санҷишӣ.
import fs from "fs";
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || (BASE.includes("localhost") ? "http://localhost:3005/api" : `${BASE}/api`);
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const errors = [];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const open = async (mobile, auth) => {
    const page = await (await browser.createBrowserContext()).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    if (mobile) await page.emulate(KnownDevices["iPhone 13"]); else await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate((a) => {
        localStorage.setItem("app_lang", "tj");
        localStorage.setItem("assistant_greeted_v1", "1");
        if (a) localStorage.setItem("auth-storage", JSON.stringify({ state: { user: a.user, token: a.token, isAuthenticated: true }, version: 0 }));
    }, auth || null);
    return page;
};

// 1–2. Саҳифаи ихтисос.
const careers = await fetch(`${API}/careers?search=Информатика&limit=1`).then((r) => r.json());
const careerId = careers.data[0].id;
const info = await open(true);
await info.goto(`${BASE}/info/${careerId}`, { waitUntil: "networkidle2" });
await info.waitForSelector("[data-career-why]", { timeout: 20000 });
await info.evaluate(() => [...document.querySelectorAll("[data-career-why] button")].find((b) => /Маоши хуб/.test(b.innerText)).click());
await info.type("[data-why-input]", " ва падарам мегӯяд, ки обрӯ дорад");
await info.click("[data-why-check]");
await info.waitForSelector("[data-why-result]", { timeout: 60000 });
const why = await info.$eval("[data-why-result]", (n) => n.innerText);
check("«Чаро ин касб?»: тип, хатар ва 3 савол", /Сабаби (берунӣ|омехта|дохилӣ)/.test(why) && /Хатари пушаймонӣ/.test(why) && (await info.$$eval("[data-why-result] ol li", (n) => n.length)) === 3, why.replace(/\n/g, " ").slice(0, 140));
await info.click("[data-future-show]");
await info.waitForSelector("[data-future-result]", { timeout: 90000 });
const future = await info.$eval("[data-future-result]", (n) => n.innerText);
check("«2035»: хатар, мошин ↔ одам, малакаҳо, қадамҳо", /Хатари автоматикунонӣ/.test(future) && /Ба одам мемонад/i.test(future) && /Малакаҳои нав/i.test(future), future.replace(/\n/g, " ").slice(0, 140));
const t0 = Date.now();
const again = await fetch(`${API}/career-insight/${careerId}/future?lang=tj`).then((r) => r.json());
check("«2035»: бори дуюм аз кеш (фаврӣ)", again.cached === true && Date.now() - t0 < 2000, `${Date.now() - t0} ms`);
if (SHOTS) await info.screenshot({ path: `${SHOTS}/insights.png`, fullPage: true });

// 7. Ҳисоботи мактаб.
const teacher = await open(false, { token: process.env.TEACHER_TOKEN, user: JSON.parse(process.env.TEACHER_USER) });
await teacher.goto(`${BASE}/dashboard/teacher`, { waitUntil: "networkidle2" });
await teacher.waitForSelector("[data-school-report-link]", { timeout: 20000 });
await teacher.click("[data-school-report-link]");
await teacher.waitForSelector("[data-report-sheet]", { timeout: 20000 });
const sheet = await teacher.$eval("[data-report-sheet]", (n) => n.innerText);
check("Ҳисобот: мактаб, рақамҳо, ҷадвал ва хулоса", sheet.includes("Мактаби №5") && /хонанда/.test(sheet) && sheet.includes("11 «А»") && /Хулоса/i.test(sheet), sheet.replace(/\n/g, " ").slice(0, 160));
check("Ҳисобот: ихтисосҳои маъмул ва имзо", /Ихтисосҳои маъмул/i.test(sheet) && /Директори мактаб/.test(sheet));
await teacher.emulateMediaType("print");
const printHidden = await teacher.evaluate(() => getComputedStyle(document.querySelector("[data-report-sheet]")).display !== "none" && [...document.querySelectorAll("nav, aside")].every((n) => getComputedStyle(n).display === "none"));
check("Чоп: танҳо варақи ҳисобот (меню пинҳон)", printHidden);
if (SHOTS) await teacher.pdf({ path: `${SHOTS}/school-report.pdf`, format: "A4", printBackground: true });

// 8. Сертификат.
const created = await fetch(`${API}/certificates`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Ҷамшед Раҳимов", scores: { c1: 31, c2: 12, c3: 9, c4: 14, c5: 8 }, careers: [{ name: "Информатика", percent: 88 }, { name: "Амнияти киберӣ", percent: 81 }], trials: [{ name: "Информатика", fit: true }], lang: "tj" }),
}).then((r) => r.json());
console.log(`CERT_CODE=${created.code}`);
check("Сертификат сохта шуд (рамз ва 78%)", /^[A-Z2-9]{8}$/.test(created.code) && created.percent === 78, `${created.code} ${created.percent}`);
const verify = await open(true);
await verify.goto(`${BASE}/cert/${created.code}`, { waitUntil: "networkidle2" });
await verify.waitForSelector("[data-cert-valid]", { timeout: 15000 });
const vText = await verify.evaluate(() => document.body.innerText);
check("Тасдиқ: ✅ ва номи кӯтоҳ «Ҷамшед Р.»", vText.includes("Сертификат воқеӣ аст") && vText.includes("Ҷамшед Р.") && !vText.includes("Раҳимов"));
await verify.goto(`${BASE}/cert/ZZZZZZZZ`, { waitUntil: "networkidle2" });
await verify.waitForSelector("[data-cert-invalid]", { timeout: 15000 });
check("Рамзи нодуруст: «ёфт нашуд»", true);
// Кашидани сертификат дар браузер (модули воқеии сайт).
const png = await verify.evaluate(async (data) => {
    const { drawCertificate } = await import("/src/lib/certificate.js");
    const canvas = await drawCertificate({ ...data, directionLabel: "Техникӣ", lang: "tj" });
    return canvas.toDataURL("image/png");
}, created);
check("Сертификат кашида шуд (PNG)", png.startsWith("data:image/png") && png.length > 100000, `${Math.round(png.length / 1024)} KB`);
if (SHOTS) fs.writeFileSync(`${SHOTS}/certificate.png`, Buffer.from(png.split(",")[1], "base64"));

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
