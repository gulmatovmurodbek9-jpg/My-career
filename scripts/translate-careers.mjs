import fs from "fs";
import path from "path";
import { createRequire } from "module";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENV = path.join(ROOT, "Back/nest-backend/.env");

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

const REDO = args.includes("--redo");

const SHARD = (() => {
    const raw = argValue("--shard", null);
    if (!raw) return null;
    const [index, total] = raw.split("/").map(Number);
    if (!Number.isInteger(index) || !Number.isInteger(total) || total < 1 || index >= total) {
        console.error(`--shard нодуруст: ${raw} (интизор: 0/4)`);
        process.exit(1);
    }
    return { index, total };
})();
const ONLY_LANG = argValue("--lang", null);
const BATCH = Number(argValue("--batch", 4));

const LANGS = ONLY_LANG ? [ONLY_LANG] : ["ru", "en"];
const LANG_NAME = { ru: "Russian", en: "English" };

const FIELD_SETS = {
    core: {
        text: ["name", "description", "purpose"],
        list: [],
        nested: {},
    },
    all: {
        text: ["name", "description", "purpose", "advice"],
        list: ["technologies", "roadmap", "projectsExamples", "careerOpportunities", "relatedSpecializations", "certification"],
        nested: { skills: ["technical", "soft"], learningResources: ["books", "courses", "blogs"] },
    },
};

const TABLES = {
    career: {
        table: "career",
        order: '"codeSort"',
        columns: `id, name, description, purpose, advice, skills, technologies, roadmap,
                  "projectsExamples", "careerOpportunities", "relatedSpecializations",
                  certification, "learningResources", translations`,
        fieldSets: FIELD_SETS,
        subject: "Tajik higher-education specialty descriptions",
    },
    universities: {
        table: "universities",
        order: "name",
        columns: 'id, name, city, region, "institutionType", address, translations',
        fieldSets: {
            core: { text: ["name", "city", "region", "institutionType", "address"], list: [], nested: {} },
            all: { text: ["name", "city", "region", "institutionType", "address"], list: [], nested: {} },
        },
        subject: "Tajik university and college records",
    },
};

const TABLE_NAME = argValue("--table", "career");
const TABLE = TABLES[TABLE_NAME];
if (!TABLE) {
    console.error(`--table нодуруст: ${TABLE_NAME} (career ё universities)`);
    process.exit(1);
}

const FIELD_SET_NAME = argValue("--fields", "core");
const FIELDS = TABLE.fieldSets[FIELD_SET_NAME] || TABLE.fieldSets.core;
const TEXT_FIELDS = FIELDS.text;
const LIST_FIELDS = FIELDS.list;
const NESTED_FIELDS = FIELDS.nested;

const GROQ_KEY = env.GROQ_API_KEY;
const GROQ_MODEL = env.GROQ_MODEL || "openai/gpt-oss-120b";
const GEMINI_KEY = env.GEMINI_API_KEY;
const GEMINI_MODEL = env.GEMINI_MODEL || "gemini-flash-latest";
if (!GROQ_KEY && !GEMINI_KEY) {
    console.error("На GEMINI_API_KEY ва на GROQ_API_KEY дар .env нест");
    process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SIMPLE_ARRAY_FIELDS = new Set([
    "technologies",
    "projectsExamples",
    "careerOpportunities",
    "relatedSpecializations",
    "certification",
]);

const asList = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) {
        return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
};

function payloadOf(career) {
    const out = {};
    for (const f of TEXT_FIELDS) if (career[f]) out[f] = career[f];
    for (const f of LIST_FIELDS) {
        const v = SIMPLE_ARRAY_FIELDS.has(f) ? asList(career[f]) : career[f];
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

function buildPrompt(items, langs) {
    const names = langs.map((l) => `"${l}" (${LANG_NAME[l]})`).join(" and ");
    return `You translate ${TABLE.subject} into ${names}.

RULES
- Translate the MEANING, naturally, as a careers website would word it.
- Keep every key and the exact JSON shape. Arrays keep the same length and order.
- Never translate proper nouns of institutions or people (e.g. "Донишгоҳи миллии Тоҷикистон" stays recognisable; transliterate rather than invent).
- Technology names (Python, AutoCAD, SQL) stay as they are.
- Do not add, remove, explain or comment. Output JSON only.

INPUT (array of objects, each has an "id"):
${JSON.stringify(items, null, 0)}

Return a JSON object shaped {"items": [...]} with the same length and the same ids.
Each entry must be {"id": <id>, ${langs.map((l) => `"${l}": { ...translated fields... }`).join(", ")}}.`;
}

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

let geminiPausedUntil = 0;

let vertexClient = null;
if (env.VERTEX_PROJECT_ID && env.GOOGLE_APPLICATION_CREDENTIALS) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = env.GOOGLE_APPLICATION_CREDENTIALS;
    try {
        const { GoogleGenAI } = require("@google/genai");
        vertexClient = new GoogleGenAI({
            vertexai: true,
            project: env.VERTEX_PROJECT_ID,
            location: env.VERTEX_LOCATION || "global",
        });
        console.log(`Vertex: лоиҳаи ${env.VERTEX_PROJECT_ID}, минтақаи ${env.VERTEX_LOCATION || "global"}`);
    } catch (err) {
        console.log(`Vertex дастрас нест (${err.message}) — Groq истифода мешавад`);
    }
}

async function callVertex(prompt) {
    const res = await vertexClient.models.generateContent({
        model: env.VERTEX_MODEL || "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 },
        },
    });
    const text = res?.text ?? "";
    if (!text) throw new Error("Vertex ҷавоби холӣ дод");
    return text;
}

let vertexPausedUntil = 0;

async function translate(prompt) {
    if (vertexClient && Date.now() > vertexPausedUntil) {
        try {
            return await callVertex(prompt);
        } catch (err) {
            vertexPausedUntil = Date.now() + 60 * 1000;
            process.stdout.write(`\n   Vertex афтод (${String(err.message).slice(0, 70)}) — Groq`);
        }
    }

    try {
        return await callGroq(prompt);
    } catch (groqError) {
        if (GEMINI_KEY && Date.now() > geminiPausedUntil) {
            try {
                return await callGemini(prompt, 4);
            } catch {
                geminiPausedUntil = Date.now() + 5 * 60 * 1000;
            }
        }
        throw groqError;
    }
}

const secondsFrom = (value) => {
    if (!value) return 0;
    const m = String(value).match(/(?:([\d.]+)m)?([\d.]+)s/);
    if (m) return (Number(m[1] || 0) * 60 + Number(m[2] || 0));
    return Number(value) || 0;
};

async function respectGroqBudget(headers) {
    const left = Number(headers.get("x-ratelimit-remaining-tokens"));
    if (!Number.isFinite(left)) return;

    if (left > 5000) return;

    const wait = Math.min(secondsFrom(headers.get("x-ratelimit-reset-tokens")) + 1, 65);
    if (wait > 0) {
        process.stdout.write(`\n   ⏸ ${left} токен мондааст — ${wait.toFixed(0)}с интизор`);
        await sleep(wait * 1000);
    }
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
        if (attempt > 6) throw new Error(`Groq ${res.status} пас аз 6 кӯшиш`);
        const wait = Math.min(
            (secondsFrom(res.headers.get("retry-after")) ||
                secondsFrom(res.headers.get("x-ratelimit-reset-tokens")) ||
                attempt * 8) + 1,
            70,
        );
        process.stdout.write(`\n   … ${res.status}, ${wait.toFixed(0)}с интизор`);
        await sleep(wait * 1000);
        return callGroq(prompt, attempt + 1);
    }
    if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 180)}`);

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    await respectGroqBudget(res.headers);
    return text;
}

function extractArray(raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    for (const v of Object.values(parsed)) if (Array.isArray(v)) return v;
    throw new Error("массив дар ҷавоб нест");
}

const alignList = (source, value) =>
    source.map((fallback, i) => {
        const item = value[i];
        return typeof item === "string" && item.trim() ? item.trim() : fallback;
    });

function validate(original, translated) {
    const clean = {};
    for (const [key, value] of Object.entries(translated || {})) {
        if (key === "id") continue;
        const source = original[key];
        if (typeof source === "string" && typeof value === "string" && value.trim()) {
            clean[key] = value.trim();
        } else if (Array.isArray(source) && Array.isArray(value) && value.length) {
            clean[key] = alignList(source, value);
        } else if (source && typeof source === "object" && value && typeof value === "object") {
            const inner = {};
            for (const [k, arr] of Object.entries(value)) {
                if (Array.isArray(source[k]) && Array.isArray(arr) && arr.length) {
                    inner[k] = alignList(source[k], arr);
                }
            }
            if (Object.keys(inner).length) clean[key] = inner;
        }
    }
    return clean;
}

function needsWork(row, lang) {
    if (REDO) return true;
    const existing = row.translations?.[lang];
    if (!existing) return true;
    return FIELD_SET_NAME === "all" && existing._fields !== "all";
}

const pool = new pg.Pool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
});

async function main() {
    const need = REDO ? "TRUE" : LANGS.map((l) =>
        FIELD_SET_NAME === "all"
            ? `(NOT (translations ? '${l}') OR translations->'${l}'->>'_fields' IS DISTINCT FROM 'all')`
            : `NOT (translations ? '${l}')`,
    ).join(" OR ");
    const shardFilter = SHARD
        ? `AND abs(hashtext(id::text)) % ${SHARD.total} = ${SHARD.index}`
        : "";

    const { rows } = await pool.query(
        `SELECT ${TABLE.columns}
           FROM ${TABLE.table}
          WHERE (${need}) ${shardFilter}
          ORDER BY ${TABLE.order}
          ${LIMIT ? `LIMIT ${LIMIT}` : ""}`,
    );

    console.log(`Коркарднашуда: ${rows.length} сатри ${TABLE_NAME} · забонҳо: ${LANGS.join(", ")} · бастаи ${BATCH}`);
    if (!rows.length) return;

    let done = 0;
    let failed = 0;
    const started = Date.now();

    for (let i = 0; i < rows.length; i += BATCH) {
        const slice = rows.slice(i, i + BATCH);

        const pending = slice.filter((r) => LANGS.some((l) => needsWork(r, l)));
        if (pending.length) {
            const items = pending.map((r) => ({ id: r.id, ...payloadOf(r) }));
            try {
                const raw = await translate(buildPrompt(items, LANGS));
                const list = extractArray(raw);
                const byId = new Map(list.map((x) => [x.id, x]));

                for (const row of pending) {
                    const got = byId.get(row.id);
                    if (!got) { failed += LANGS.length; continue; }

                    for (const lang of LANGS) {
                        if (!needsWork(row, lang)) continue;

                        const clean = validate(payloadOf(row), got[lang]);
                        if (!Object.keys(clean).length) { failed++; continue; }
                        clean._fields = FIELD_SET_NAME;

                        await pool.query(
                            `UPDATE ${TABLE.table}
                                SET translations = jsonb_set(COALESCE(translations,'{}'::jsonb), $2, $3::jsonb, true)
                              WHERE id = $1`,
                            [row.id, `{${lang}}`, JSON.stringify(clean)],
                        );
                        row.translations = { ...(row.translations || {}), [lang]: clean };
                    }
                }
            } catch (err) {
                failed += pending.length * LANGS.length;
                process.stdout.write(`\n   ✗ ${err.message}`);
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
