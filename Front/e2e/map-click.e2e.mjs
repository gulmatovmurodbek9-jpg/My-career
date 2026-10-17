// E2E: харитаи донишгоҳҳо — клик ба нишонаи донишгоҳ панелро мекушояд (дур ва наздик, компютер ва телефон).
//   BASE_URL=https://ikhtisosiman.qobus.tj node e2e/map-click.e2e.mjs
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
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];

async function run(mobile) {
    const label = mobile ? "Телефон" : "Компютер";
    const page = await (await browser.createBrowserContext()).newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    if (mobile) await page.emulate(KnownDevices["iPhone 13"]); else await page.setViewport({ width: 1366, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => { localStorage.setItem("app_lang", "tj"); localStorage.setItem("assistant_greeted_v1", "1"); });
    await page.goto(`${BASE}/universities`, { waitUntil: "networkidle2" });
    await page.waitForSelector(".university-map .leaflet-marker-icon", { timeout: 30000 });
    await page.evaluate(() => document.querySelector(".university-map").scrollIntoView({ block: "center" }));
    await sleep(800);

    // Нишонаи як донишгоҳ (на гурӯҳ): агар нест — гурӯҳи шаҳрро пахш мекунем, то наздик шавад.
    const singles = async () => page.$$(".university-map .leaflet-marker-icon .is-single");
    if (!(await singles()).length) {
        const cluster = await page.$(".university-map .leaflet-marker-icon");
        const box = await cluster.boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1500);
    }
    const list = await singles();
    check(`${label}: нишонаҳои донишгоҳ ҳастанд`, list.length > 0, String(list.length));
    if (!list.length) return;
    const marker = list[Math.min(1, list.length - 1)];
    const box = await marker.boundingBox();
    // Чӣ дар ҳамон нуқта болотар аст (агар чизи дигар нишонаро пӯшонад).
    const top = await page.evaluate((x, y) => {
        const el = document.elementFromPoint(x, y);
        return el ? `${el.tagName}.${String(el.className).slice(0, 60)}` : "нест";
    }, box.x + box.width / 2, box.y + box.height / 2);
    if (mobile) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(900);
    const panel = await page.evaluate(() => [...document.querySelectorAll("a")].some((a) => /^\/universities\/[0-9a-f-]{36}$/.test(a.getAttribute("href") || "") && a.closest(".university-map-shell")));
    check(`${label}: клик ба нишона панелро кушод`, panel, `элементи болоӣ: ${top}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/map-${mobile ? "phone" : "desk"}.png` });

    // Муассисаи шаҳри дигар дар ҳамон намуд (Ваҳдат дар харитаи Душанбе) — пештар панел дарҳол баста мешуд.
    await page.evaluate(() => document.querySelector('.university-map-shell button[aria-label]')?.click());
    await sleep(400);
    const other = await page.$$eval(".university-map .leaflet-marker-icon", (els) => els
        .map((el) => ({ title: el.getAttribute("title") || "", r: el.getBoundingClientRect() }))
        .filter((m) => /Ваҳдат/.test(m.title) && m.r.width > 0)
        .map((m) => ({ title: m.title, x: m.r.x + m.r.width / 2, y: m.r.y + m.r.height / 2 }))[0] || null);
    if (other) {
        if (mobile) await page.touchscreen.tap(other.x, other.y); else await page.mouse.click(other.x, other.y);
        await sleep(900);
        const title = await page.evaluate(() => document.querySelector(".university-map-shell .z-\\[800\\] p")?.innerText || "");
        check(`${label}: муассисаи Ваҳдат низ панелро мекушояд`, title === other.title, `${other.title} → ${title || "панел нест"}`);
    } else {
        console.log(`… ${label}: нишонаи Ваҳдат дар намуд нест`);
    }
}

await run(false);
await run(true);
check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲама гузашт");
process.exit(failed ? 1 : 0);
