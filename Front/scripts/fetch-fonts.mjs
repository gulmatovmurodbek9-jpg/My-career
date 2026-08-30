/**
 * Шрифтҳоро аз Google ба лоиҳа мекӯчонад ва фарогирии тоҷикиро тафтиш мекунад.
 *
 * Ду сабаб барои худмизбонӣ: пайвасти production ба хости бегона пеш аз кашидани
 * ягон ҳарф як DNS+TLS илова мекунад, ва кеш дар дасти мо намемонад.
 *
 * Тафтиши глифҳо ҳатмист. Google барои ҳар зермаҷмӯа `unicode-range`-и васеъ
 * эълон мекунад, вале файл метавонад глифҳоро НАДОШТА бошад: Unbounded, Onest,
 * Manrope ва Wix Madefor ҳамагӣ cyrillic-ext эълон мекунанд, аммо ҳарфҳои
 * тоҷикӣ надоранд. Rubik ҳатто «Ҳ» надорад. Бе ин тафтиш шрифт бесадо мешиканад.
 *
 * Иҷро:  node scripts/fetch-fonts.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { create as createFont } from "fontkit";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, "..", "src", "fonts");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FAMILIES = [
  { family: "Geologica", axis: "wght@300..800", slug: "geologica" }, // сарлавҳаҳо
  { family: "Golos Text", axis: "wght@400..700", slug: "golos" },    // матни асосӣ
];

const WANTED = new Set(["latin", "latin-ext", "cyrillic", "cyrillic-ext"]);

/** Ҳарфҳое, ки дар тоҷикӣ ҳастанд, вале дар русӣ не. */
const TAJIK = [
  ["Ғ", 0x0492], ["ғ", 0x0493], ["Ҳ", 0x04b2], ["ҳ", 0x04b3],
  ["Қ", 0x049a], ["қ", 0x049b], ["Ҷ", 0x04b6], ["ҷ", 0x04b7],
  ["Ӯ", 0x04ee], ["ӯ", 0x04ef], ["Ӣ", 0x04e2], ["ӣ", 0x04e3],
];

await mkdir(outDir, { recursive: true });

let css = `/* Худмизбонии шрифтҳо. Тавлидшуда бо scripts/fetch-fonts.mjs — дастӣ таҳрир накунед. */\n`;
let failed = false;

for (const { family, axis, slug } of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:${axis}&display=swap`;
  const sheet = await fetch(url, { headers: { "User-Agent": UA } }).then((r) => r.text());

  // Google CSS-ро ҳамчун блокҳои "/* subset */ @font-face {...}" бармегардонад.
  const blocks = sheet.split("/*").slice(1);

  for (const block of blocks) {
    const subset = block.slice(0, block.indexOf("*/")).trim();
    if (!WANTED.has(subset)) continue;

    const src = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
    const weight = block.match(/font-weight:\s*([^;]+);/)?.[1]?.trim() ?? "400";
    if (!src || !range) continue;

    const file = `${slug}-${subset}.woff2`;
    const bytes = Buffer.from(await fetch(src).then((r) => r.arrayBuffer()));
    await writeFile(path.join(outDir, file), bytes);

    let note = "";
    if (subset === "cyrillic-ext") {
      const missing = TAJIK.filter(([, cp]) => createFont(bytes).glyphForCodePoint(cp).id === 0);
      if (missing.length > 0) {
        note = `  ✘ НАРАСИД: ${missing.map(([ch]) => ch).join(" ")}`;
        failed = true;
      } else {
        note = "  ✔ ҳамаи 12 ҳарфи тоҷикӣ ҳаст";
      }
    }

    css +=
      `\n@font-face {\n` +
      `  font-family: '${family}';\n` +
      `  font-style: normal;\n` +
      `  font-weight: ${weight};\n` +
      `  font-display: swap;\n` +
      `  src: url('./fonts/${file}') format('woff2');\n` +
      `  unicode-range: ${range};\n` +
      `}\n`;

    console.log(`${file}  ${(bytes.length / 1024).toFixed(1)} КБ  [${subset}]${note}`);
  }
}

await writeFile(path.join(root, "..", "src", "fonts.css"), css);
console.log("\n→ src/fonts.css тавлид шуд");

if (failed) {
  console.error("\nХАТО: шрифт ҳарфҳои тоҷикиро надорад. Оилаи дигар интихоб кунед.");
  process.exit(1);
}
