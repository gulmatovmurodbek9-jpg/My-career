// Санҷиш: чанд кадр аз видео ба PNG (бе рендери пурра).
//   node scripts/stills.mjs 00 tj 2 8 20
import fs from "fs";
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { ROOT } from "./lib.mjs";

const [id, lang, ...seconds] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "v", id, lang, "manifest.json"), "utf8"));
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public") });
const inputProps = { manifest };
const composition = await selectComposition({ serveUrl, id: "Tutorial", inputProps });
for (const s of seconds) {
    const out = path.join(ROOT, "out", `still-${id}-${lang}-${s}.png`);
    await renderStill({ composition, serveUrl, output: out, frame: Math.min(composition.durationInFrames - 1, Math.round(Number(s) * 30)), inputProps });
    console.log(out);
}
