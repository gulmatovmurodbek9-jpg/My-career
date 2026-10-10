// Садо барои ҳар саҳна (овози худи лоиҳа: /api/voice/speak) ва давомнокӣ ба manifest.
//   node scripts/voice.mjs [id ...] [--lang tj]
import fs from "fs";
import path from "path";
import { API, ROOT, wavDuration, writeJson } from "./lib.mjs";

const args = process.argv.slice(2);
const langArg = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;
const ids = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--lang");
const LANGS = langArg ? langArg.split(",") : ["tj", "ru", "en"];
const base = path.join(ROOT, "public", "v");

async function speak(text, lang, file) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const response = await fetch(`${API}/voice/speak`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, lang, speed: lang === "tj" ? 1 : 1.05 }),
        });
        if (response.ok) {
            fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
            return wavDuration(file);
        }
        await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
    throw new Error(`овоз нашуд: ${text.slice(0, 40)}`);
}

for (const id of fs.readdirSync(base).filter((d) => !ids.length || ids.includes(d))) {
    for (const lang of LANGS) {
        const file = path.join(base, id, lang, "manifest.json");
        if (!fs.existsSync(file)) continue;
        const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
        for (const [i, scene] of manifest.scenes.entries()) {
            scene.audio = `a${String(i + 1).padStart(2, "0")}.wav`;
            scene.duration = await speak(scene.narr, lang, path.join(base, id, lang, scene.audio));
        }
        if (manifest.next) {
            manifest.nextAudio = "next.wav";
            manifest.nextDuration = await speak(manifest.next, lang, path.join(base, id, lang, "next.wav"));
        }
        writeJson(file, manifest);
        const total = manifest.scenes.reduce((s, x) => s + x.duration, 0) + (manifest.nextDuration || 0);
        console.log(`✓ ${id} ${lang} — ${Math.round(total)} с садо`);
    }
}
