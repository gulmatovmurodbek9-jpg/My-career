// Суратҳои «Касб-свайп»: барои ҳар корт як тасвир бо Gemini (Vertex, gemini-2.5-flash-image)
// → Front/public/swipe/<id>.webp (720×960). Суратҳои мавҷуда такрор сохта намешаванд.
//   node scripts/generate-swipe-images.mjs [id ...] [--force] [--key]
// --key: Gemini API бо GEMINI_API_KEY (17.10: Vertex суратҳоро бо 403 рад мекард).
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { GoogleGenAI } from '@google/genai';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '../../../Front/public/swipe');
// sharp дар Front насб шудааст.
const sharp = createRequire(path.resolve(here, '../../../Front/package.json'))('sharp');
const { SWIPE_CARDS } = await import(path.resolve(here, '../../../Front/src/lib/swipeCards.js').replace(/\\/g, '/').replace(/^([A-Z]):/, 'file:///$1:'));

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
const ai = args.includes('--key')
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : new GoogleGenAI({ vertexai: true, project: process.env.VERTEX_PROJECT_ID, location: 'global' });
fs.mkdirSync(OUT, { recursive: true });

// Як услуб барои ҳама: тасвири ҳамвор, гарм, одамони тоҷик, бе матн, то канорҳо.
const STYLE = 'Full-bleed flat vector illustration. The background is a fully painted, colorful environment that reaches all four edges of the image — there is NO white space, NO empty background, NO border, NO frame, NO vignette, NO rounded card. '
    + 'Warm, friendly, modern editorial style with soft gradients and gentle light, rich but harmonious colors. '
    + 'Characters are young Central Asian (Tajik) people with friendly faces. Vertical portrait composition 3:4, main subject large and centered. '
    + 'Absolutely no text, no letters, no numbers, no logos, no watermarks.';

for (const card of SWIPE_CARDS) {
    if (only.length && !only.includes(card.id)) continue;
    const file = path.join(OUT, `${card.id}.webp`);
    if (!force && fs.existsSync(file)) continue;
    for (let attempt = 1; attempt <= 8; attempt += 1) {
        try {
            const r = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: `${STYLE}\nScene: ${card.scene}.`,
                config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '3:4' } },
            });
            const part = r.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
            if (!part) throw new Error('сурат нест');
            await sharp(Buffer.from(part.inlineData.data, 'base64')).resize(720, 960, { fit: 'cover' }).webp({ quality: 78 }).toFile(file);
            console.log(`✓ ${card.id}`);
            await new Promise((r) => setTimeout(r, 10000)); // квотаи модел
            break;
        } catch (error) {
            console.log(`✗ ${card.id} (${attempt}): ${String(error.message).slice(0, 120)}`);
            await new Promise((r) => setTimeout(r, 15000 * attempt));
        }
    }
}
