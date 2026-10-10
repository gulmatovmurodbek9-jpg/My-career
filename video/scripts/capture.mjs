// Сабти скриншотҳо барои видеоҳо.
//   node scripts/capture.mjs                 — ҳамаи видеоҳо, ҳар се забон
//   node scripts/capture.mjs 00 02 --lang tj — танҳо инҳо
import fs from "fs";
import path from "path";
import { launch, openPage, helpers, writeJson, ROOT } from "./lib.mjs";
import { VIDEOS, setup } from "./videos.mjs";

const args = process.argv.slice(2);
const langArg = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;
const ids = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--lang");
const LANGS = langArg ? langArg.split(",") : ["tj", "ru", "en"];
const list = VIDEOS.filter((v) => !ids.length || ids.includes(v.id));

const ctx = await setup();
const browser = await launch();
let failed = 0;
for (const video of list) {
    for (const lang of LANGS) {
        const dir = path.join(ROOT, "public", "v", video.id, lang);
        const page = await openPage(browser, { lang, auth: video.auth ? ctx.auth[video.auth] : null, storage: video.storage ? video.storage(ctx) : {}, greet: !!video.greet });
        const h = helpers(page);
        fs.mkdirSync(dir, { recursive: true });
        fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
        const scenes = [];
        try {
            if (video.before) await video.before(h, lang, ctx);
            for (const [i, scene] of video.scenes.entries()) {
                if (scene.go) await h.go(typeof scene.go === "function" ? scene.go(ctx) : scene.go);
                if (scene.do) await scene.do(h, lang, ctx);
                const rect = scene.focus ? await h.rect(scene.focus) : null;
                if (scene.focus && !rect) console.log(`   ⚠ ${video.id}/${lang} саҳна ${i + 1}: элемент ёфт нашуд`);
                const img = `s${String(i + 1).padStart(2, "0")}.png`;
                await page.screenshot({ path: path.join(dir, img) });
                scenes.push({ img, rect, click: !!scene.click, zoom: scene.zoom ?? (rect ? 1.12 : 1), narr: scene.narr[lang] });
                if (scene.after) await scene.after(h, lang, ctx);
            }
            writeJson(path.join(dir, "manifest.json"), {
                id: video.id,
                lang,
                title: video.title[lang],
                next: video.next?.[lang] || null,
                scenes,
            });
            console.log(`✓ ${video.id} ${lang} — ${scenes.length} саҳна`);
        } catch (error) {
            failed += 1;
            console.log(`✗ ${video.id} ${lang}: ${error.message}`);
            await page.screenshot({ path: path.join(ROOT, "out", `error-${video.id}-${lang}.png`) }).catch(() => {});
        }
        await page.browserContext().close();
    }
}
await browser.close();
if (ctx.cleanup) await ctx.cleanup();
console.log(failed ? `${failed} нашуд` : "Тамом");
process.exit(failed ? 1 : 0);
