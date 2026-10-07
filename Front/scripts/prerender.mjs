// Пешсозии саҳифаҳои ихтисос ва донишгоҳ бо ҳамон компонентҳои React (SSR → HTML-и тайёр).
// Google саҳифаро айнан ҳамон тавр мебинад, ки корбар; браузер маълумоти тайёрро аз
// window.__SSR_DATA__ мегирад ва спиннер нишон намедиҳад.
//
//   npx vite build && npx vite build --ssr src/entry-server.jsx --outDir dist-ssr
//   node scripts/prerender.mjs --dist /var/www/ikhtisosiman [--api http://localhost:3005/api] [--limit 5]
//
// Баъди prerender-seo.js иҷро кунед (он саҳифаҳои рӯйхатро месозад; ин — ихтисос ва донишгоҳ).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (name, fallback) => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : fallback;
};
const API = arg("api", "http://localhost:3005/api");
const OUT = path.resolve(arg("dist", path.join(here, "..", "dist")));
const TEMPLATE = path.resolve(arg("template", path.join(here, "..", "dist", "index.html")));
const LIMIT = Number(arg("limit", 0)) || Infinity;
const CONCURRENCY = Number(arg("concurrency", 8));
const ORIGIN = "https://ikhtisosiman.qobus.tj";
const SITE = "Ихтисоси ман";

const { render } = await import(pathToFileURL(path.join(here, "..", "dist-ssr", "entry-server.js")).href);
const shell = fs.readFileSync(TEMPLATE, "utf8");
if (!shell.includes('<div id="root">')) throw new Error("Дар шаблон <div id=\"root\"> нест");
// Агар шаблон аллакай пешсозӣ шуда бошад (prerender-seo.js), #root-ро холӣ мекунем.
const blank = shell.replace(/<div id="root">[\s\S]*?<\/div>\s*(?=<\/body>|<script)/, '<div id="root"></div>');

const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cut = (text, max) => {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
};
// «<» → «\u003c»: матни маълумот (масалан «</script>») саҳифаро шикаста наметавонад.
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(new RegExp(String.fromCharCode(0x2028, 124, 0x2029), "g"), " ");
const get = async (url, optional = false) => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const response = await fetch(`${API}${url}`).catch(() => null);
        if (response?.ok) return response.json();
        if (response && optional && response.status === 404) return null;
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
    if (optional) return null;
    throw new Error(`${url} нашуд`);
};

function write({ route, title, description, html, data, jsonLd, noIndex }) {
    const canonical = `${ORIGIN}${route}`;
    let page = blank
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`)
        .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(title)}" />`)
        .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(description)}" />`)
        .replace(/<link rel="canonical"[^>]*>\s*/g, "")
        .replace(/<meta name="robots"[^>]*>\s*/g, "");
    const head = [
        `<link rel="canonical" href="${esc(canonical)}" />`,
        `<meta property="og:url" content="${esc(canonical)}" />`,
        noIndex ? '<meta name="robots" content="noindex,follow" />' : "",
        jsonLd ? `<script type="application/ld+json">${json(jsonLd)}</script>` : "",
        `<script>window.__SSR_DATA__=${json(data)}</script>`,
    ].filter(Boolean).join("\n    ");
    page = page.replace("</head>", `    ${head}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    const file = path.join(OUT, route, "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, page);
}

async function pool(items, worker) {
    let next = 0;
    let done = 0;
    const failed = [];
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        while (next < items.length) {
            const item = items[next++];
            try {
                await worker(item);
            } catch (error) {
                failed.push(`${item.id}: ${error.message}`);
            }
            done += 1;
            if (done % 100 === 0) console.log(`  ${done}/${items.length}`);
        }
    }));
    return failed;
}

const started = Date.now();
const careers = (await get("/careers?limit=2000")).data.slice(0, LIMIT);
const universitiesRaw = await get("/universities?limit=2000");
const universities = (Array.isArray(universitiesRaw) ? universitiesRaw : universitiesRaw.data || []).slice(0, LIMIT);
console.log(`Пешсозӣ: ${careers.length} ихтисос, ${universities.length} донишгоҳ → ${OUT}`);

let indexed = 0;
const careerFailed = await pool(careers, async ({ id }) => {
    const [career, offerings, trialFull] = await Promise.all([
        get(`/careers/${id}?lang=tj`),
        get(`/careers/${id}/offerings?lang=tj`),
        get(`/trial/career/${id}?lang=tj`, true),
    ]);
    // Барои саҳифаи ихтисос танҳо рӯзи корӣ ва ҷиҳатҳо лозим (вазифаҳо — дар /trial).
    const trial = trialFull ? { role: trialFull.role, day: trialFull.day, pros: trialFull.pros, cons: trialFull.cons, goodFor: trialFull.goodFor, hardFor: trialFull.hardFor } : null;
    const route = `/info/${id}`;
    const data = { [`career:${id}:tj`]: { career, offerings: Array.isArray(offerings) ? offerings : [], trial } };
    const html = await render(route, data);
    const unis = [...new Map((Array.isArray(offerings) ? offerings : []).map((o) => [o.university?.id, o.university]).filter(([key]) => key)).values()];
    const about = cut(career.description || career.purpose, 300);
    // Индекс: тавсифи пурра ё сенарияи беназир (рӯзи корӣ, ҷиҳатҳо) — «thin content» нест.
    const noIndex = !career.contentWritten && !trial;
    if (!noIndex) indexed += 1;
    write({
        route,
        title: `${career.name}${career.code ? ` (${career.code})` : ""} — донишгоҳҳо, нарх ва як рӯзи корӣ | ${SITE}`,
        description: cut(`${career.name}: ${trial?.day?.[0]?.text ? `${trial.day[0].text} ` : ""}${about}${unis.length ? ` Дар ${unis.length} муассисаи Тоҷикистон.` : ""}`, 158),
        html,
        data,
        noIndex,
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalProgram",
            name: career.name,
            ...(career.code ? { programCode: String(career.code) } : {}),
            description: about || undefined,
            url: `${ORIGIN}${route}`,
            ...(career.durationYears ? { timeToComplete: `P${career.durationYears}Y` } : {}),
            provider: unis.slice(0, 20).map((u) => ({ "@type": "CollegeOrUniversity", name: u.name, address: u.city || undefined })),
        },
    });
});

const uniFailed = await pool(universities, async ({ id }) => {
    const [university, specialties] = await Promise.all([
        get(`/universities/${id}?lang=tj`),
        get(`/universities/${id}/specialties?lang=tj`),
    ]);
    const route = `/universities/${id}`;
    const data = { [`university:${id}:tj`]: { university, specialties: Array.isArray(specialties) ? specialties : [] } };
    const html = await render(route, data);
    const ru = university.translations?.ru?.name;
    write({
        route,
        title: `${university.name}${university.city ? ` — ${university.city}` : ""}: ихтисосҳо ва нарх | ${SITE}`,
        description: cut(university.description || `${university.name}${ru ? ` (${ru})` : ""}${university.city ? `, ${university.city}` : ""}. ${Array.isArray(specialties) ? specialties.length : 0} ихтисос: нарх, ҷойҳои ройгон ва бали гузариш.`, 158),
        html,
        data,
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "CollegeOrUniversity",
            name: university.name,
            ...(ru ? { alternateName: ru } : {}),
            ...(university.city ? { address: { "@type": "PostalAddress", addressLocality: university.city, addressCountry: "TJ" } } : {}),
            url: `${ORIGIN}${route}`,
        },
    });
});

console.log(`Тайёр: ${careers.length - careerFailed.length} ихтисос (индекс: ${indexed}), ${universities.length - uniFailed.length} донишгоҳ, ${((Date.now() - started) / 1000).toFixed(0)} с`);
[...careerFailed, ...uniFailed].slice(0, 10).forEach((line) => console.log(`  ✗ ${line}`));
process.exit(careerFailed.length + uniFailed.length ? 1 : 0);
