// E2E: «Ба қафо» ба ҳамон ҷой — саҳифаи рӯйхат, филтр ва scroll баъди кушодани ихтисос
// нигоҳ дошта мешаванд (рӯйхати ихтисосҳо ва донишгоҳҳо).
//   BASE_URL=https://ikhtisosiman.qobus.tj node e2e/back-restore.e2e.mjs
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const CHROME = process.env.CHROME || (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "/usr/bin/google-chrome");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

const activePage = () => page.evaluate(() => document.querySelector("button.bg-primary.text-white")?.innerText?.trim() || "");
const firstCard = () => page.evaluate(() => document.querySelector('a[href^="/info/"]')?.getAttribute("href") || "");

// 1. Рӯйхати ихтисосҳо: саҳифаи 3, scroll, ихтисос, ба қафо.
await page.goto(`${BASE}/careers`, { waitUntil: "networkidle2" });
await page.waitForSelector('a[href^="/info/"]');
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.innerText.trim() === "3")?.click());
await sleep(1500);
const pageBefore = await activePage();
const cardBefore = await firstCard();
await page.evaluate(() => window.scrollTo(0, 1500));
await sleep(400);
const yBefore = await page.evaluate(() => Math.round(window.scrollY));
const target = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href^="/info/"]')];
    const link = links.find((a) => a.getBoundingClientRect().top > 0) || links[0];
    link.click();
    return link.getAttribute("href");
});
await page.waitForFunction((href) => location.pathname === href, {}, target);
await sleep(1200);
check("Ихтисос аз боло кушода шуд", (await page.evaluate(() => window.scrollY)) < 50);
await page.goBack();
await sleep(2000);
check("Ба қафо: ҳамон саҳифаи рӯйхат", (await activePage()) === pageBefore, `${pageBefore} → ${await activePage()}`);
check("Ба қафо: ҳамон ихтисосҳо", (await firstCard()) === cardBefore);
const yAfter = await page.evaluate(() => Math.round(window.scrollY));
check("Ба қафо: ҳамон ҷои scroll", Math.abs(yAfter - yBefore) < 60, `${yBefore} → ${yAfter}`);

// 2. Филтри кластер (replace) scroll-ро ба боло намепартояд ва саҳифаи нав аз 1 сар мешавад.
await page.goto(`${BASE}/careers`, { waitUntil: "networkidle2" });
await page.waitForSelector('a[href^="/info/"]');
check("Саҳифаи нав аз саҳифаи 1", (await activePage()) === "1", await activePage());

// 3. Донишгоҳҳо: scroll, донишгоҳ, ба қафо.
await page.goto(`${BASE}/universities?view=list`, { waitUntil: "networkidle2" });
await page.waitForSelector('a[href^="/universities/"]');
await page.evaluate(() => window.scrollTo(0, 1200));
await sleep(400);
const uniY = await page.evaluate(() => Math.round(window.scrollY));
await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href^="/universities/"]')];
    (links.find((a) => a.getBoundingClientRect().top > 0) || links[0]).click();
});
await sleep(1500);
await page.goBack();
await sleep(2000);
const uniYAfter = await page.evaluate(() => Math.round(window.scrollY));
check("Донишгоҳҳо: ба қафо ба ҳамон ҷо", Math.abs(uniYAfter - uniY) < 60, `${uniY} → ${uniYAfter}`);

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
