/**
 * Логотипи сайтро аз расми аслӣ месозад.
 *
 * Расми аслӣ канали alpha дорад — он чи сиёҳ менамояд, дар асл шаффоф аст.
 * Аз ин рӯ ду навъ файл лозим:
 *
 *   logo.png       шаффоф, барои навбар — дар ҳарду тема кор мекунад
 *   logo-<N>.png   рӯи заминаи торик бо кунҷҳои мудаввар, барои favicon ва PWA
 *
 * Иконкаи барнома наметавонад шаффоф бошад: браузер ва системаи амалиётӣ онро
 * рӯи заминаи номаълум мегузоранд, ва кулоҳи кабуди торик дар паси торик гум
 * мешавад.
 *
 * Ҳудуди мазмун бо trim() ёфта мешавад, на бо координатаи дастӣ — вагарна
 * ҳангоми иваз шудани расми аслӣ буриш китобро аз ду тараф мебурад.
 *
 * Иҷро:  node scripts/make-logo.mjs
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(root, "..", "src", "images", "logo-source.png");
const OUT = path.join(root, "..", "public");

/** Заминаи иконка — ҳамон ранге, ки сайт дар темаи торик дорад. */
const ICON_BG = "#05070d";

const trimmed = await sharp(SRC).trim({ threshold: 10 }).toBuffer();
const { width, height } = await sharp(trimmed).metadata();

// Ба мураббаъ мерасонем: мазмун аз баландӣ васеътар аст, пас боло ва поён
// фазои шаффоф илова мешавад.
const side = Math.max(width, height);
const padY = Math.round((side - height) / 2);
const padX = Math.round((side - width) / 2);

const square = await sharp(trimmed)
  .extend({
    top: padY,
    bottom: side - height - padY,
    left: padX,
    right: side - width - padX,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer();

// ── 1. Нусхаи шаффоф барои навбар ──
for (const size of [96, 192]) {
  const info = await sharp(square)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, size === 96 ? "logo.png" : "logo-mark.png"));
  console.log((size === 96 ? "logo.png" : "logo-mark.png").padEnd(18) + (info.size / 1024).toFixed(1) + " КБ");
}

// ── 2. Иконкаи барнома: замина + кунҷҳои мудаввар ──
const mask = (s) =>
  Buffer.from(
    `<svg width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${Math.round(
      s * 0.22
    )}" ry="${Math.round(s * 0.22)}" fill="#fff"/></svg>`
  );

for (const size of [512, 192, 180, 32]) {
  // Каме фазо дар канорҳо, то мазмун ба кунҷҳои мудаввар назанад.
  const inner = Math.round(size * 0.84);
  const pad = Math.round((size - inner) / 2);

  const art = await sharp(square).resize(inner, inner).toBuffer();

  const icon = await sharp({
    create: { width: size, height: size, channels: 4, background: ICON_BG },
  })
    .composite([{ input: art, left: pad, top: pad }])
    .png()
    .toBuffer();

  const info = await sharp(icon)
    .composite([{ input: mask(size), blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `icon-${size}.png`));
  console.log(`icon-${size}.png`.padEnd(18) + (info.size / 1024).toFixed(1) + " КБ");
}
