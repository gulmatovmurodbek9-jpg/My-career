// Рендери MP4: out/<id>-<lang>.mp4 (1920×1080, 30 fps).
//   node scripts/render.mjs [id ...] [--lang tj]
import fs from "fs";
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { ROOT } from "./lib.mjs";

const args = process.argv.slice(2);
const langArg = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;
const ids = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--lang");
const LANGS = langArg ? langArg.split(",") : ["tj", "ru", "en"];
const base = path.join(ROOT, "public", "v");
const outDir = path.join(ROOT, "out");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public") });
for (const id of fs.readdirSync(base).filter((d) => !ids.length || ids.includes(d))) {
    for (const lang of LANGS) {
        const file = path.join(base, id, lang, "manifest.json");
        if (!fs.existsSync(file)) continue;
        const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
        if (!manifest.scenes.every((s) => s.audio)) { console.log(`⚠ ${id} ${lang}: аввал voice.mjs`); continue; }
        const inputProps = { manifest };
        const composition = await selectComposition({ serveUrl, id: "Tutorial", inputProps });
        const started = Date.now();
        await renderMedia({
            composition,
            serveUrl,
            codec: "h264",
            crf: 22,
            outputLocation: path.join(outDir, `${id}-${lang}.mp4`),
            inputProps,
            concurrency: 4,
        });
        // Муқова: кадри саҳнаи аввал (баъди муқаддима).
        await renderStill({ composition, serveUrl, output: path.join(outDir, `${id}-${lang}.jpg`), frame: Math.min(composition.durationInFrames - 1, 75 + 40), inputProps, imageFormat: "jpeg", jpegQuality: 80 });
        console.log(`✓ ${id}-${lang}.mp4 — ${Math.round(composition.durationInFrames / 30)} с видео, ${Math.round((Date.now() - started) / 1000)} с рендер`);
    }
}
