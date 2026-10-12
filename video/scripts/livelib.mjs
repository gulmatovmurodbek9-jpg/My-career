// Сабти зинда: курсори намоён, ҳаракати нарм ва оҳиста, клик бо доира, навиштани ҳарф ба ҳарф ва
// сабти экран (captureScreenshot → ffmpeg → MP4). Ҳар элементе, ки курсор ба он меравад, ҳамчун
// «нишона» (mark) бо вақт ва ҷояш нигоҳ дошта мешавад — Remotion ба он зум мекунад ва гирдашро
// равшан нишон медиҳад, то бинанда донад, ки куҷоро бинад.
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { BASE, ROOT, helpers } from "./lib.mjs";

export const FFMPEG = path.join(ROOT, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function installCursor(page, mobile = false) {
    await page.evaluateOnNewDocument((mobile) => {
        const add = () => {
            if (document.getElementById("__cursor")) return;
            const c = document.createElement("div");
            c.id = "__cursor";
            // Телефон: «ангушт» — доираи нимшаффоф; компютер: тирчаи калони курсор.
            c.innerHTML = mobile
                ? '<div style="width:40px;height:40px;border-radius:50%;background:rgba(37,99,235,.30);border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35)"></div>'
                : '<svg width="40" height="40" viewBox="0 0 24 24"><path d="M5 2l14 10.5-6.2 1.1 3.9 7.4-2.9 1.5-3.9-7.5L5 19.5z" fill="#0f172a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
            const last = window.__cursorPos || { x: 640, y: 400 };
            const base = mobile ? "translate(-20px,-20px)" : "translate(-7px,-4px)";
            Object.assign(c.style, { position: "fixed", left: `${last.x}px`, top: `${last.y}px`, zIndex: 2147483647, pointerEvents: "none", transform: base, filter: "drop-shadow(0 4px 6px rgba(0,0,0,.35))", transition: "transform .12s" });
            document.documentElement.appendChild(c);
            document.addEventListener("mousemove", (e) => { c.style.left = `${e.clientX}px`; c.style.top = `${e.clientY}px`; }, true);
            document.addEventListener("mousedown", (e) => {
                c.style.transform = `${base} scale(.8)`;
                const r = document.createElement("div");
                Object.assign(r.style, { position: "fixed", left: `${e.clientX - 26}px`, top: `${e.clientY - 26}px`, width: "52px", height: "52px", borderRadius: "50%", border: "4px solid #2563eb", background: "rgba(37,99,235,.18)", zIndex: 2147483646, pointerEvents: "none", transition: "all .6s ease-out", opacity: "1" });
                document.documentElement.appendChild(r);
                requestAnimationFrame(() => Object.assign(r.style, { transform: "scale(2)", opacity: "0" }));
                setTimeout(() => r.remove(), 700);
            }, true);
            document.addEventListener("mouseup", () => { c.style.transform = base; }, true);
        };
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add();
    }, mobile);
}

// Сабт: Page.captureScreenshot пай дар пай (бо пикселҳои дастгоҳ — 1920×1080 ё 780×1688),
// ~25–35 кадр/с → ffmpeg (concat бо давомнокии ҳар кадр) → MP4.
// pause()/resume(): корҳои такрорӣ (масалан, се вазифаи дигар) сабт намешаванд — видео кӯтоҳ мемонад.
export async function startRecording(page, file) {
    const dir = `${file}.frames`;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const cdp = await page.createCDPSession();
    const frames = [];
    let running = true;
    let paused = false;
    let pausedAt = 0;
    let skipped = 0; // сонияҳои таваққуф
    const clock = () => Date.now() / 1000 - skipped;
    const loop = (async () => {
        while (running) {
            if (paused) { await sleep(30); continue; }
            const t = clock();
            try {
                const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 90, optimizeForSpeed: true });
                if (paused) continue;
                const name = `f${String(frames.length).padStart(6, "0")}.jpg`;
                fs.writeFileSync(path.join(dir, name), Buffer.from(data, "base64"));
                frames.push({ name, t });
            } catch {
                await sleep(30); // ҳангоми гузариши саҳифа
            }
        }
    })();
    while (!frames.length) await sleep(20);
    const wall0 = frames[0].t;
    return {
        // Сонияҳо аз оғози видео (кадри аввал), бе вақти таваққуф.
        now: () => (paused ? pausedAt : clock()) - wall0,
        pause: () => { if (!paused) { pausedAt = clock(); paused = true; } },
        resume: () => { if (paused) { skipped += clock() - pausedAt; paused = false; } },
        stop: async () => {
            // Охир — лаҳзаи даъват (на баъди скриншоти охирин, ки баъзан дер меояд).
            const end = clock();
            running = false;
            await Promise.race([loop, sleep(5000)]);
            while (frames.length > 1 && frames[frames.length - 1].t > end) frames.pop();
            const list = frames.map((f, i) => `file '${f.name}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? end) - f.t)).toFixed(4)}`).join("\n");
            fs.writeFileSync(path.join(dir, "list.txt"), `${list}\nfile '${frames[frames.length - 1].name}'\n`);
            const run = spawnSync(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-r", "30", "-vf", "scale=in_range=pc:out_range=tv", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-crf", "18", "-g", "15", "-bf", "0", "-preset", "medium", "-movflags", "+faststart", path.resolve(file)], { cwd: dir, encoding: "utf8" });
            if (run.status !== 0) throw new Error(run.stderr.slice(-500));
            fs.rmSync(dir, { recursive: true, force: true });
            return { frames: frames.length, duration: end - wall0 };
        },
    };
}

// now — соати сабт (rec.now); marks — рӯйхати нишонаҳо барои зум ва равшанкунӣ.
export function liveHelpers(page, mobile = false, now = () => 0) {
    const base = helpers(page);
    const marks = [];
    let pos = { x: 640, y: 400 };
    const endMark = () => {
        const last = marks[marks.length - 1];
        if (last && last.t1 == null) last.t1 = Math.round(now() * 100) / 100;
    };
    const smoothScroll = async (el, block = "center") => {
        const moved = await el.evaluate((n, b) => {
            const r = n.getBoundingClientRect();
            if (b === "start" || r.top < 90 || r.bottom > window.innerHeight - 60) { n.scrollIntoView({ block: b, behavior: "smooth" }); return true; }
            return false;
        }, block);
        if (moved) { endMark(); await sleep(1000); }
    };
    // Курсор оҳиста ба элемент меравад; баъд элемент нишона мешавад.
    const moveToEl = async (el, mark = true) => {
        await smoothScroll(el);
        const box = await el.boundingBox();
        if (!box) return;
        endMark();
        if (mark) {
            const view = await page.evaluate(() => ({ vw: window.innerWidth, vh: window.innerHeight }));
            marks.push({ t0: Math.round(now() * 100) / 100, t1: null, x: box.x, y: box.y, w: box.width, h: box.height, ...view });
        }
        const to = { x: box.x + Math.min(box.width / 2, mobile ? 120 : 80), y: box.y + Math.min(box.height / 2, 40) };
        const steps = 45;
        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
            await page.mouse.move(pos.x + (to.x - pos.x) * e, pos.y + (to.y - pos.y) * e);
            await sleep(18);
        }
        pos = to;
        await page.evaluate((p) => { window.__cursorPos = p; }, pos).catch(() => {});
    };
    const need = async (target) => {
        const el = await base.find(target);
        if (!el) throw new Error(`ёфт нашуд: ${JSON.stringify(target)}`);
        return el;
    };
    const press = async () => {
        await page.mouse.down(); await sleep(120); await page.mouse.up();
    };
    return {
        ...base,
        marks,
        endMark,
        hover: async (target) => { const el = await base.find(target); if (el) await moveToEl(el); },
        // Танҳо ба элемент ишора мекунад (бе клик).
        point: async (target) => { await moveToEl(await need(target)); },
        press: async () => { await press(); await sleep(250); endMark(); await sleep(900); },
        go: async (url) => {
            endMark();
            await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
            await page.waitForNetworkIdle({ idleTime: 500, timeout: 8000 }).catch(() => {});
            await page.mouse.move(pos.x, pos.y);
            await sleep(500);
        },
        click: async (target) => {
            const el = await need(target);
            await moveToEl(el);
            await sleep(500);
            await press();
            await sleep(250);
            endMark();
            await sleep(900);
        },
        type: async (target, text) => {
            const el = await need(target);
            await moveToEl(el);
            await press();
            await sleep(300);
            await page.keyboard.down("Control"); await page.keyboard.press("A"); await page.keyboard.up("Control");
            await page.keyboard.press("Backspace");
            await page.keyboard.type(text, { delay: 120 });
            await sleep(500);
            endMark();
            await sleep(400);
        },
        show: async (target, block = "center") => { const el = await base.find(target); if (el) await smoothScroll(el, block); },
        scroll: async (y) => { endMark(); await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), y); await sleep(1000); },
        top: async () => { endMark(); await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" })); await sleep(1000); },
    };
}
