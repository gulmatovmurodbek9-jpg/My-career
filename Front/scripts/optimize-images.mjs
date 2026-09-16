import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(root, "..", "src", "images");
const outDir = path.join(srcDir, "optimized");

const RENAME = {
  "ImageHero2.png": "hero-1",
  "imageHero3.png": "hero-2",
  "imageHero4.png": "hero-3",
  "ImageHero5.png": "hero-4",
  "Flux_Dev_create_a_beautiful_image_of_Tajik_boys_and_girls_with_1.jpg": "hero-group",
  "imagAi.png": "ai-avatar",

  "cluster-1.png": "cluster-1",
  "cluster-2.png": "cluster-2",
  "cluster-3.png": "cluster-3",
  "cluster-4.png": "cluster-4",
  "cluster-5.png": "cluster-5",
};

const WIDTHS = [
  { w: 1600, suffix: "" },
  { w: 900, suffix: "@sm" },
];

const fmt = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} МБ`;

await mkdir(outDir, { recursive: true });

const files = (await readdir(srcDir)).filter((f) => /\.(png|jpe?g)$/i.test(f));

let before = 0;
let after = 0;

for (const file of files) {
  const name = RENAME[file];
  if (!name) {
    console.log(`⏭  ${file} — дар рӯйхат нест, гузаронда шуд`);
    continue;
  }

  const inPath = path.join(srcDir, file);
  const inSize = (await stat(inPath)).size;
  before += inSize;

  for (const { w, suffix } of WIDTHS) {
    const outPath = path.join(outDir, `${name}${suffix}.webp`);
    const info = await sharp(inPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(outPath);
    after += info.size;
    console.log(`✔  ${name}${suffix}.webp — ${fmt(info.size)} (${info.width}×${info.height})`);
  }

  console.log(`   ↳ асл: ${file} — ${fmt(inSize)}\n`);
}

console.log("─".repeat(46));
console.log(`Пеш:  ${fmt(before)}`);
console.log(`Баъд: ${fmt(after)}`);
console.log(`Сарфа: ${fmt(before - after)} (${Math.round((1 - after / before) * 100)}%)`);
