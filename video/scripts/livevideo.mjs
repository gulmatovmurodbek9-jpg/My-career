// Видеоҳои ЗИНДА: барои ҳар видео ва забон — аввал овози модел барои ҳар саҳна, баъд сабти
// зиндаи экран: саҳна ҳамон қадар давом мекунад, ки овозаш (амалҳо ҳангоми сухан иҷро мешаванд).
//   node scripts/livevideo.mjs 06 --lang tj        — сабт + овоз → public/v/06/tj/live.mp4, manifest-live.json
//   node scripts/livevideo.mjs --render 06 --lang tj — рендер → out/live/06-tj.mp4 (+ .jpg)
import fs from "fs";
import path from "path";
import { KnownDevices } from "puppeteer-core";
import { API, ROOT, launch, openPage, wavDuration, writeJson } from "./lib.mjs";
import { FFMPEG, installCursor, liveHelpers, startRecording } from "./livelib.mjs";
import { spawnSync } from "child_process";
import { VIDEOS, setup } from "./videos.mjs";

const args = process.argv.slice(2);
const render = args.includes("--render");
// --mobile: версияи телефон (iPhone 13, амудӣ); файлҳо бо пасванди «-m».
const MOBILE = args.includes("--mobile");
const SUFFIX = MOBILE ? "-m" : "";
// --skip-done: сабтҳои баъди SINCE сохташуда ва рендерҳои навтар аз manifest такрор намешаванд
// (батч баъди қатъ шудан аз ҳамон ҷо давом медиҳад).
const SKIP = args.includes("--skip-done");
const SINCE = Date.parse(process.env.SINCE || "2100-01-01");
const mtime = (f) => (fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0);
const langArg = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;
const ids = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--lang");
const LANGS = langArg ? langArg.split(",") : ["tj", "ru", "en"];
const list = VIDEOS.filter((v) => !ids.length || ids.includes(v.id));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAD = 1.3; // таваққуф баъди ҳар ҷумла — бинанда вақт дорад, ки натиҷаро бинад
// Овоз каме оҳистатар ва баландии якхела (atempo нигоҳ медорад, ки садо паст нашавад).
const TEMPO = { tj: 0.9, ru: 0.93, en: 0.93 };
const pick = (v, lang) => (v && typeof v === "object" && !Array.isArray(v) && !v.text && v[lang] != null ? v[lang] : v);

async function speak(text, lang, file) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const r = await fetch(`${API}/voice/speak`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang, speed: lang === "tj" ? 1 : 1.05 }) });
        if (r.ok) {
            const raw = `${file}.raw.wav`;
            fs.writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
            const run = spawnSync(FFMPEG, ["-y", "-i", raw, "-af", `atempo=${TEMPO[lang] || 0.92},loudnorm=I=-16:TP=-1.5:LRA=11`, "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", file], { encoding: "utf8" });
            fs.rmSync(raw, { force: true });
            if (run.status !== 0) throw new Error(run.stderr.slice(-300));
            return wavDuration(file);
        }
        await sleep(2000 * attempt);
    }
    throw new Error(`овоз нашуд: ${text.slice(0, 40)}`);
}

if (render) {
    const { bundle } = await import("@remotion/bundler");
    const { renderMedia, renderStill, selectComposition } = await import("@remotion/renderer");
    const outDir = path.join(ROOT, "out", "live");
    fs.mkdirSync(outDir, { recursive: true });
    const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public") });
    for (const video of list) {
        for (const lang of LANGS) {
            const file = path.join(ROOT, "public", "v", video.id, lang, `manifest-live${SUFFIX}.json`);
            if (!fs.existsSync(file)) continue;
            const outFile = path.join(outDir, `${video.id}-${lang}${SUFFIX}.mp4`);
            if (SKIP && mtime(outFile) > mtime(file)) continue;
            const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
            const inputProps = { manifest };
            const composition = await selectComposition({ serveUrl, id: "LiveTutorial", inputProps });
            const started = Date.now();
            await renderMedia({ composition, serveUrl, codec: "h264", crf: 22, outputLocation: path.join(outDir, `${video.id}-${lang}${SUFFIX}.mp4`), inputProps, concurrency: Number(process.env.CONC || 4) });
            await renderStill({ composition, serveUrl, output: path.join(outDir, `${video.id}-${lang}${SUFFIX}.jpg`), frame: 75 + 45, inputProps, imageFormat: "jpeg", jpegQuality: 80 });
            console.log(`✓ ${video.id}-${lang}${SUFFIX}.mp4 — ${Math.round(composition.durationInFrames / 30)} с, рендер ${Math.round((Date.now() - started) / 1000)} с`);
        }
    }
    process.exit(0);
}

const ctx = await setup();
const browser = await launch();
let failed = 0;
for (const video of list) {
    for (const lang of LANGS) {
        const dir = path.join(ROOT, "public", "v", video.id, lang);
        fs.mkdirSync(dir, { recursive: true });
        if (SKIP && mtime(path.join(dir, `manifest-live${SUFFIX}.json`)) > SINCE) continue;
        try {
            // 1) Овоз барои ҳар саҳна.
            const voices = [];
            for (const [i, scene] of video.scenes.entries()) {
                const audio = `l${String(i + 1).padStart(2, "0")}.wav`;
                voices.push({ audio, duration: await speak(scene.narr[lang], lang, path.join(dir, audio)), narr: scene.narr[lang] });
            }
            const nextDuration = 0; // экрани охир нест

            // 2) Сабти зинда.
            const page = await openPage(browser, { lang, auth: video.auth ? ctx.auth[video.auth] : null, storage: video.storage ? video.storage(ctx) : {}, greet: !!video.greet });
            globalThis.__page = page;
            if (MOBILE) await page.emulate({ ...KnownDevices["iPhone 13"], viewport: { ...KnownDevices["iPhone 13"].viewport, deviceScaleFactor: 2 } });
            await installCursor(page, MOBILE);
            let rec = null;
            const h = liveHelpers(page, MOBILE, () => (rec ? rec.now() : 0));
            if (video.before) await video.before(h, lang, ctx);
            // Саҳифаи аввал пеш аз сабт кушода мешавад (то видео аз экрани сафед сар нашавад).
            const firstGo = video.scenes[0].go;
            if (firstGo) await h.go(typeof firstGo === "function" ? firstGo(ctx) : firstGo);
            await page.mouse.move(MOBILE ? 200 : 640, MOBILE ? 500 : 400);
            rec = await startRecording(page, path.join(dir, `live${SUFFIX}.mp4`));
            await sleep(400);
            const scenes = [];
            for (const [i, scene] of video.scenes.entries()) {
                const start = rec.now();
                if (scene.go && i > 0) await h.go(typeof scene.go === "function" ? scene.go(ctx) : scene.go);
                const until = async (sec) => { const left = sec - (rec.now() - start); if (left > 0) await sleep(left * 1000); };
                if (scene.prep) await scene.prep(h, lang, ctx);
                if (scene.do) await scene.do(h, lang, ctx);
                if (scene.target) {
                    // Як ҷумла — як амал: курсор ба элемент меравад (зум + равшанкунӣ),
                    // клик наздики охири ҷумла, вақте ки бинанда аллакай медонад, ки чӣ мешавад.
                    const target = pick(scene.target, lang);
                    if (scene.action === "type") {
                        await h.type(target, pick(scene.text, lang));
                    } else {
                        await h.point(target);
                        if (scene.action === "click") { await until(Math.max(1.8, voices[i].duration * 0.72)); await h.press(); }
                    }
                } else if (scene.focus) await h.hover(scene.focus);
                // То охири ҷумла интизор мешавем.
                await until(voices[i].duration + PAD);
                h.endMark();
                scenes.push({ start: Math.round(start * 100) / 100, duration: voices[i].duration, narr: voices[i].narr, hint: scene.hint?.[lang] || null, audio: voices[i].audio });
                // Корҳои такрорӣ сабт намешаванд.
                if (scene.cut) { const n = h.marks.length; rec.pause(); await scene.cut(h, lang, ctx); h.marks.splice(n); rec.resume(); }
                if (scene.after) await scene.after(h, lang, ctx);
            }
            await sleep(600);
            const { duration } = await rec.stop();
            await page.browserContext().close();
            writeJson(path.join(dir, `manifest-live${SUFFIX}.json`), {
                id: video.id, lang, title: video.title[lang], next: video.next?.[lang] || null,
                nextDuration,
                mobile: MOBILE, video: `live${SUFFIX}.mp4`, videoDuration: Math.round(duration * 100) / 100, scenes, marks: h.marks,
            });
            console.log(`✓ ${video.id} ${lang}${SUFFIX} — ${scenes.length} саҳна, ${Math.round(duration)} с`);
        } catch (error) {
            await globalThis.__page?.screenshot({ path: path.join(dir, "error.png") }).catch(() => {});
            failed += 1;
            console.log(`✗ ${video.id} ${lang}${SUFFIX}: ${error.message}`);
        }
    }
}
await browser.close();
await ctx.cleanup();
console.log(failed ? `${failed} нашуд` : "Тамом");
process.exit(failed ? 1 : 0);
