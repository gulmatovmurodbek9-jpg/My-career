import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(root, "..", "src", "images", "logo-source.png");
const OUT = path.join(root, "..", "public");

const ICON_BG = "#05070d";

const trimmed = await sharp(SRC).trim({ threshold: 10 }).toBuffer();
const { width, height } = await sharp(trimmed).metadata();

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

for (const size of [96, 192]) {
  const info = await sharp(square)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, size === 96 ? "logo.png" : "logo-mark.png"));
  console.log((size === 96 ? "logo.png" : "logo-mark.png").padEnd(18) + (info.size / 1024).toFixed(1) + " КБ");
}

const mask = (s) =>
  Buffer.from(
    `<svg width="${s}" height="${s}"><rect width="${s}" height="${s}" rx="${Math.round(
      s * 0.22
    )}" ry="${Math.round(s * 0.22)}" fill="#fff"/></svg>`
  );

for (const size of [512, 192, 180, 32]) {
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
