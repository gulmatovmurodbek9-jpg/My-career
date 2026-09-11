/**
 * Тарҷумаи мазмуни ихтисосҳо ба русӣ ва англисӣ.
 *
 * Натиҷа ба сутуни `career.translations` навишта мешавад:
 *   { "ru": { name, description, ... }, "en": { ... } }
 *
 * Скрипт такроршаванда аст: сатрҳое, ки аллакай тарҷумаи ҳарду забонро
 * доранд, гузаронда мешаванд. Аз ин рӯ пас аз қатъ шудан (лимити API,
 * интернет) онро бе тарс дубора сар кардан мумкин аст.
 *
 * `code` ҳеҷ гоҳ тарҷума намешавад — шиносаи расмии ММТ аст.
 *
 * Истифода:
 *   node scripts/translate-careers.mjs            # ҳама
 *   node scripts/translate-careers.mjs --limit 20 # санҷиш
 *   node scripts/translate-careers.mjs --lang ru  # танҳо як забон
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENV = path.join(ROOT, "Back/nest-backend/.env");

/* Драйвери pg дар node_modules-и backend аст, на дар реша — скрипт аз он ҷо
   мегирад, то ки насби такрорӣ лозим нашавад. */
const require = createRequire(path.join(ROOT, "Back/nest-backend/package.json"));
const pg = require("pg");

const env = Object.fromEntries(
    fs.readFileSync(ENV, "utf8")
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => {
            const at = l.indexOf("=");
            return [l.slice(0, at).trim(), l.slice(at + 1).trim()];
        }),
);

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : fallback;
};

const LIMIT = Number(argValue("--limit", 0)) || null;
const ONLY_LANG = argValue("--lang", null);
const BATCH = Number(argValue("--batch", 4));

const LANGS = ONLY_LANG ? [ONLY_LANG] : ["ru", "en"];
const LANG_NAME = { ru: "Russian", en: "English" };

/* Майдонҳои тарҷумашаванда. `code` дида намешавад — қасдан. */
const TEXT_FIELDS = ["name", "description", "purpose", "advice"];
const LIST_FIELDS = ["technologies", "roadmap", "projectsExamples", "careerOpportunities", "relatedSpecializations", "certification"];
const NESTED_FIELDS = { skills: ["technical", "soft"], learningResources: ["books", "courses", "blogs"] };

const GROQ_KEY = env.GROQ_API_KEY;
const GROQ_MODEL = env.GROQ_MODEL || "openai/gpt-oss-120b";
const GEMINI_KEY = env.GEMINI_API_KEY;
const GEMINI_MODEL = env.GEMINI_MODEL || "gemini-flash-latest";
if (!GROQ_KEY && !GEMINI_KEY) {
    console.error("На GEMINI_API_KEY ва на GROQ_API_KEY дар .env нест");
    process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Танҳо майдонҳои холинабуда мефиристем — ҳар аломат вақт ва лимит аст. */
function payloadOf(career) {
    const out = {};
    for (const f of TEXT_FIELDS) if (career[f]) out[f] = career[f];
    for (const f of LIST_FIELDS) {
        const v = career[f];
        if (Array.isArray(v) && v.length) out[f] = v;
    }
    for (const [parent, keys] of Object.entries(NESTED_FIELDS)) {
        const v = career[parent];
        if (!v || typeof v !== "object") continue;
        const inner = {};
        for (const k of keys) if (Array.isArray(v[k]) && v[k].length) inner[k] = v[k];
        if (Object.keys(inner).length) out[parent] = inner;
    }
    return out;
}

function buildPrompt(items, lang) {
    return `You translate Tajik higher-education content into ${LANG_NAME[lang]}.

RULES
- Translate the MEANING, naturally, as a careers website would word it.
- Keep every key and the exact JSON shape. Arrays keep the same length and order.
- Never translate proper nouns of institutions or people (e.g. "Донишгоҳи миллии Тоҷикистон" stays recognisable; transliterate rather than invent).
- Technology names (Python, AutoCAD, SQL) stay as they are.
- Do not add, remove, explain or comment. Output JSON only.

INPUT (array of objects, each has an "id"):
${JSON.stringify(items, null, 0)}

Return a JSON object shaped {"items": [...]} where items has the same length and the same ids, each entry holding the translated fields.`;
}

/*
 * Gemini провайдери асосист, Groq — захира.
 *
 * Лимити ройгони Groq 8 000 токен дар як дақиқа ва 1 000 дархост дар рӯз
 * аст. Барои 884 ихтисос × 2 забон ин тақрибан 22 соат мешуд ва лимити
 * рӯзона аз миёна қатъ мекард. Gemini бо ҳамон кор дар нисфи соат мебарояд.
 */
async function callGemini(prompt, attempt = 1) {
    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
                /* Фикркунӣ хомӯш: тарҷума мулоҳиза намехоҳад ва ҳар токени
                   он аз лимити дақиқа мехӯрад. */
                thinkingConfig: { thinkingBudget: 0 },
            },
        }),
    });

    if (res.status === 429 || res.status >= 500) {
        if (attempt > 5) throw new Error(`Gemini ${res.status} пас аз 5 кӯшиш`);
        const wait = 4000 * attempt;
        process.stdout.write(`\n   … Gemini ${res.status}, ${wait / 1000}с интизор`);
        await sleep(wait);
        return callGemini(prompt, attempt + 1);
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 160)}`);

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function translate(prompt) {
    if (GEMINI_KEY) {
        try { return await callGemini(prompt); }
        catch (err) { process.stdout.write(`\n   Gemini афтод (${err.message}), Groq...`); }
    }
    return callGroq(prompt);
}

async function callGroq(prompt, attempt = 1) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" },
        }),
    });

    if (res.status === 429 || res.status >= 500) {
        if (attempt > 4) throw new Error(`Groq ${res.status} пас аз 4 кӯшиш`);
        const wait = 2000 * attempt;
        console.log(`   … ${res.status}, ${wait / 1000}с интизор`);
        await sleep(wait);
        return callGroq(prompt, attempt + 1);
    }
    if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 180)}`);

    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
}

/** Модел баъзан массивро дар калиди дилхоҳ мепечонад. */
function extractArray(raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    for (const v of Object.values(parsed)) if (Array.isArray(v)) return v;
    throw new Error("массив дар ҷавоб нест");
}

/**
 * Тарҷумаро бо сатри аслӣ месанҷад.
 *
 * Бе ин модел метавонад як элементи массивро партояд ва рӯйхати қадамҳо
 * кӯтоҳ шавад — дар база ин бесадо мемонад ва баъд дар экран пайдо мешавад.
 */
function validate(original, translated) {
    const clean = {};
    for (const [key, value] of Object.entries(translated || {})) {
        if (key === "id") continue;
        const source = original[key];
        if (typeof source === "string" && typeof value === "string" && value.trim()) {
            clean[key] = value.trim();
        } else if (Array.isArray(source) && Array.isArray(value) && value.length === source.length) {
            clean[key] = value.map((x, i) => (typeof x === "string" && x.trim() ? x.trim() : source[i]));
        } else if (source && typeof source === "object" && value && typeof value === "object") {
            const inner = {};
            for (const [k, arr] of Object.entries(value)) {
                if (Array.isArray(source[k]) && Array.isArray(arr) && arr.length === source[k].length) {
                    inner[k] = arr.map((x, i) => (typeof x === "string" && x.trim() ? x.trim() : source[k][i]));
                }
            }
            if (Object.keys(inner).length) clean[key] = inner;
        }
    }
    return clean;
}

const pool = new pg.Pool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
});

async function main() {
    const need = LANGS.map((l) => `NOT (translations ? '${l}')`).join(" OR ");
    const { rows } = await pool.query(
        `SELECT id, name, description, purpose, advice, skills, technologies, roadmap,
                "projectsExamples", "careerOpportunities", "relatedSpecializations",
                certification, "learningResources", translations
           FROM career
          WHERE ${need}
          ORDER BY "codeSort"
          ${LIMIT ? `LIMIT ${LIMIT}` : ""}`,
    );

    console.log(`Коркарднашуда: ${rows.length} ихтисос · забонҳо: ${LANGS.join(", ")} · бастаи ${BATCH}`);
    if (!rows.length) return;

    let done = 0;
    let failed = 0;
    const started = Date.now();

    for (let i = 0; i < rows.length; i += BATCH) {
        const slice = rows.slice(i, i + BATCH);

        for (const lang of LANGS) {
            const pending = slice.filter((r) => !r.translations?.[lang]);
            if (!pending.length) continue;

            const items = pending.map((r) => ({ id: r.id, ...payloadOf(r) }));
            try {
                const raw = await translate(buildPrompt(items, lang));
                const list = extractArray(raw);
                const byId = new Map(list.map((x) => [x.id, x]));

                for (const row of pending) {
                    const got = byId.get(row.id);
                    if (!got) { failed++; continue; }
                    const clean = validate(payloadOf(row), got);
                    if (!Object.keys(clean).length) { failed++; continue; }

                    await pool.query(
                        `UPDATE career
                            SET translations = jsonb_set(COALESCE(translations,'{}'::jsonb), $2, $3::jsonb, true)
                          WHERE id = $1`,
                        [row.id, `{${lang}}`, JSON.stringify(clean)],
                    );
                    row.translations = { ...(row.translations || {}), [lang]: clean };
                }
            } catch (err) {
                failed += pending.length;
                console.log(`   ✗ ${lang}: ${err.message}`);
            }
        }

        done += slice.length;
        const rate = done / ((Date.now() - started) / 1000);
        const left = Math.round((rows.length - done) / Math.max(rate, 0.01));
        process.stdout.write(
            `\r${done}/${rows.length} · хато ${failed} · ~${Math.floor(left / 60)} дақ мондааст   `,
        );
    }

    console.log(`\nТамом. Коркард: ${done}, хато: ${failed}`);
}

main()
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(() => pool.end());
