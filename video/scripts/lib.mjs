// Абзори сабт: браузер сайти воқеиро бо забони лозимӣ мекушояд, амалҳоро иҷро мекунад ва
// барои ҳар саҳна скриншот (1920×1080) ва ҷойи элементи асосӣ (барои курсор ва зум) нигоҳ медорад.
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { fileURLToPath } from "url";

export const BASE = process.env.BASE_URL || "http://localhost:5173";
export const API = process.env.API_URL || "http://localhost:3005/api";
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const VIEW = { width: 1280, height: 720, deviceScaleFactor: 1.5 };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch() {
    return puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars", "--font-render-hinting=none"] });
}

// Саҳифаи нав бо забон, мавзӯи равшан ва (ихтиёрӣ) ҳисоб ва натиҷаи тест.
export async function openPage(browser, { lang, auth, storage = {}, greet = false }) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(VIEW);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate((lang, auth, storage, greet) => {
        localStorage.clear();
        localStorage.setItem("app_lang", lang);
        localStorage.setItem("theme", "light");
        // Тирезаи салом-и ёвари AI саҳифаро мепӯшонад — ғайр аз видеои худи ёвар.
        if (!greet) localStorage.setItem("assistant_greeted_v1", "1");
        if (auth) localStorage.setItem("auth-storage", JSON.stringify({ state: { user: auth.user, token: auth.token, isAuthenticated: true }, version: 0 }));
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    }, lang, auth || null, storage, greet);
    return page;
}

// Ёрдамчиҳо барои сенарияҳо. Матнҳо дар се забон: ["тоҷикӣ", "русӣ", "англисӣ"] — ҳар кадом ёфт шавад.
export function helpers(page) {
    const asList = (t) => (Array.isArray(t) ? t : [t]).filter(Boolean);
    const find = async (target) => {
        if (!target) return null;
        // Сатр — ҳамеша селектори CSS; матн — танҳо { text: [...] }.
        if (typeof target === "string") {
            const all = await page.$$(target);
            for (const el of all) {
                if (await el.evaluate((n) => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; })) return el;
            }
            return null;
        }
        const texts = asList(target.text || target);
        const handle = await page.evaluateHandle((texts, tag) => {
            const nodes = [...document.querySelectorAll(tag || "button, a, [role=button], label, h1, h2, h3, input, li, th, summary, span, p, div")];
            const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
            for (const text of texts) {
                const low = text.toLowerCase();
                // Хурдтарин элементе, ки матн дорад (на ҳамаи саҳифа).
                const hits = nodes.filter((el) => visible(el) && (el.innerText || el.value || el.placeholder || "").toLowerCase().includes(low));
                hits.sort((a, b) => (a.innerText || "").length - (b.innerText || "").length);
                if (hits[0]) return hits[0];
            }
            return null;
        }, texts, target.tag || null);
        return handle.asElement();
    };
    const rect = async (target) => {
        const el = await find(target);
        if (!el) return null;
        return el.evaluate((node) => {
            const r = node.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
        });
    };
    return {
        page,
        find,
        rect,
        go: async (url) => {
            await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
            await page.waitForNetworkIdle({ idleTime: 600, timeout: 8000 }).catch(() => {});
            await sleep(700);
        },
        wait: (ms = 600) => sleep(ms),
        waitText: (t, timeout = 20000) => page.waitForFunction((texts) => texts.some((x) => document.body.innerText.toLowerCase().includes(x.toLowerCase())), { timeout }, asList(t)),
        click: async (target) => {
            const el = await find(target);
            if (!el) throw new Error(`ёфт нашуд: ${JSON.stringify(target)}`);
            await el.evaluate((n) => n.scrollIntoView({ block: "center" }));
            await sleep(200);
            await el.click();
            await sleep(900);
        },
        type: async (target, text) => {
            const el = await find(target);
            if (!el) throw new Error(`майдон ёфт нашуд: ${JSON.stringify(target)}`);
            await el.click();
            await page.keyboard.down("Control"); await page.keyboard.press("A"); await page.keyboard.up("Control");
            await page.keyboard.press("Backspace");
            await el.type(text, { delay: 15 });
            await sleep(800);
        },
        // Элементро ба мобайни экран меорад (scroll), то дар скриншот бошад.
        show: async (target, block = "center") => {
            const el = await find(target);
            if (el) await el.evaluate((n, b) => n.scrollIntoView({ block: b }), block);
            // Аниматсияи «пайдошавӣ ҳангоми scroll» тамом шавад.
            await sleep(1300);
        },
        scroll: async (y) => { await page.evaluate((y) => window.scrollTo(0, y), y); await sleep(500); },
        top: async () => { await page.evaluate(() => window.scrollTo(0, 0)); await sleep(400); },
    };
}

export function writeJson(file, data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 1));
}

// Давомнокии WAV (PCM) аз сарлавҳа.
export function wavDuration(file) {
    const buf = fs.readFileSync(file);
    let offset = 12;
    let byteRate = 32000;
    while (offset < buf.length - 8) {
        const id = buf.toString("ascii", offset, offset + 4);
        const size = buf.readUInt32LE(offset + 4);
        if (id === "fmt ") byteRate = buf.readUInt32LE(offset + 16);
        if (id === "data") return size / byteRate;
        offset += 8 + size + (size % 2);
    }
    return (buf.length - 44) / byteRate;
}
