// Prerender барои Google: ҳар саҳифаи ҷамъиятӣ файли HTML-и худро бо матни
// пурра мегирад. Бе ин Google ҳамаи 1016 саҳифаро якхела медид — сарлавҳаи
// умумӣ ва <div id="root"> холӣ — ва онҳоро индекс намекард.
//
//   node prerender-seo.js <index.html-и build> <папкаи сайт> [API]
//   масалан (сервер): node prerender-seo.js /root/My-career/Front/dist/index.html /var/www/ikhtisosiman
//
// nginx: try_files $uri $uri/ /index.html — файли info/<id>/index.html худкор дода мешавад.
// React бо createRoot мундариҷаи тайёрро иваз мекунад, пас корбар саҳифаи зиндаро мебинад.
// Баъд аз ҲАР build-и frontend аз нав иҷро кунед: номи файлҳои JS иваз мешаванд.
const fs = require('fs');
const path = require('path');

const [template, outDir, api = 'http://localhost:3005/api'] = process.argv.slice(2);
if (!template || !outDir) {
    console.error('Истифода: node prerender-seo.js <dist/index.html> <папкаи сайт> [API]');
    process.exit(1);
}
const ORIGIN = 'https://ikhtisosiman.qobus.tj';
const SITE = 'Ихтисоси ман';
const shell = fs.readFileSync(template, 'utf8');
if (!shell.includes('<div id="root"></div>')) throw new Error('Дар шаблон <div id="root"></div> нест');

const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = (value) => (Array.isArray(value) ? value : String(value || '').split(','))
    .map((item) => String(item).trim()).filter(Boolean);
const cut = (text, max) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};
const get = async (url) => {
    const response = await fetch(`${api}${url}`);
    if (!response.ok) throw new Error(`${url} → ${response.status}`);
    return response.json();
};

function page({ route, title, description, body, jsonLd, noIndex = false }) {
    const canonical = `${ORIGIN}${route}`;
    let html = shell
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`)
        .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(title)}" />`)
        .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(description)}" />`)
        .replace(/<link rel="canonical"[^>]*>\s*/g, '');
    const head = [
        `<link rel="canonical" href="${esc(canonical)}" />`,
        `<meta property="og:url" content="${esc(canonical)}" />`,
        // Тавсифи қолабӣ — noindex: Google онҳоро «thin content» меҳисобад.
        noIndex ? '<meta name="robots" content="noindex,follow" />' : '',
        jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : '',
    ].filter(Boolean).join('\n    ');
    html = html.replace('</head>', `    ${head}\n  </head>`);
    // Матн дар #root: Google онро фавран мебинад; React онро бо саҳифаи зинда иваз мекунад.
    html = html.replace('<div id="root"></div>', `<div id="root"><main class="seo-prerender" style="max-width:860px;margin:0 auto;padding:32px 16px;font-family:system-ui,sans-serif;line-height:1.6">${body}</main></div>`);
    const file = route === '/' ? path.join(outDir, 'index.html') : path.join(outDir, route, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
}

const nav = `<nav><a href="/">Асосӣ</a> · <a href="/careers">Ихтисосҳо</a> · <a href="/universities">Донишгоҳҳо</a> · <a href="/about">Дар бораи мо</a></nav>`;
const links = (items) => `<ul>${items.map(([href, text]) => `<li><a href="${esc(href)}">${esc(text)}</a></li>`).join('')}</ul>`;

(async () => {
    const started = Date.now();
    const careers = (await get('/careers?limit=2000')).data;
    const universitiesRaw = await get('/universities?limit=2000');
    const universities = Array.isArray(universitiesRaw) ? universitiesRaw : universitiesRaw.data || [];
    console.log(`Ихтисос: ${careers.length}, донишгоҳ: ${universities.length}`);

    const byUniversity = new Map();
    for (const career of careers) {
        for (const university of career.universities || []) {
            if (!byUniversity.has(university.id)) byUniversity.set(university.id, []);
            byUniversity.get(university.id).push(career);
        }
    }
    const clusters = new Map();
    for (const career of careers) {
        const name = career.cluster?.clusterName || 'Дигар';
        if (!clusters.has(name)) clusters.set(name, []);
        clusters.get(name).push(career);
    }

    // ── Ихтисосҳо
    for (const career of careers) {
        const about = cut(career.description || career.purpose, 400);
        const unis = career.universities || [];
        const salary = career.salaryAndMarket || {};
        const body = [
            nav,
            `<h1>${esc(career.name)}${career.code ? ` <small>(коди ${esc(career.code)})</small>` : ''}</h1>`,
            career.cluster?.clusterName ? `<p><strong>Кластер:</strong> ${esc(career.cluster.clusterName)}</p>` : '',
            about ? `<p>${esc(about)}</p>` : '',
            career.purpose && career.purpose !== career.description ? `<h2>Мақсади ихтисос</h2><p>${esc(cut(career.purpose, 500))}</p>` : '',
            list(career.careerOpportunities).length ? `<h2>Дар куҷо кор кардан мумкин аст</h2><ul>${list(career.careerOpportunities).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '',
            list(career.technologies).length ? `<h2>Технологияҳо ва абзорҳо</h2><p>${esc(list(career.technologies).join(', '))}</p>` : '',
            salary.junior || salary.mid ? `<h2>Маош</h2><p>${[salary.junior && `Навкор: ${salary.junior}`, salary.mid && `Миёна: ${salary.mid}`, salary.senior && `Таҷрибадор: ${salary.senior}`].filter(Boolean).map(esc).join(' · ')}</p>` : '',
            unis.length ? `<h2>Дар куҷо омӯхтан мумкин аст (${unis.length})</h2>${links(unis.map((u) => [`/universities/${u.id}`, `${u.name}${u.city ? ` — ${u.city}` : ''}`]))}` : '',
            list(career.relatedSpecializations).length ? `<h2>Ихтисосҳои монанд</h2><p>${esc(list(career.relatedSpecializations).join(', '))}</p>` : '',
        ].join('');
        page({
            route: `/info/${career.id}`,
            noIndex: !career.contentWritten,
            title: `${career.name}${career.code ? ` (${career.code})` : ''} — донишгоҳҳо, маош ва бал | ${SITE}`,
            description: cut(`${career.name}: ${about || 'ихтисоси ММТ'}${unis.length ? ` Дар ${unis.length} донишгоҳи Тоҷикистон.` : ''}`, 158),
            body,
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'EducationalOccupationalProgram',
                name: career.name,
                ...(career.code ? { programCode: String(career.code) } : {}),
                description: about || undefined,
                url: `${ORIGIN}/info/${career.id}`,
                provider: unis.slice(0, 20).map((u) => ({ '@type': 'CollegeOrUniversity', name: u.name, address: u.city || undefined })),
            },
        });
    }

    // ── Донишгоҳҳо
    for (const university of universities) {
        const offered = byUniversity.get(university.id) || [];
        const ru = university.translations?.ru?.name;
        const about = cut(university.description, 400);
        page({
            route: `/universities/${university.id}`,
            title: `${university.name}${university.city ? ` — ${university.city}` : ''}: ихтисосҳо ва нарх | ${SITE}`,
            description: cut(`${university.name}${ru ? ` (${ru})` : ''}${university.city ? `, ${university.city}` : ''}. ${university.institutionType ? `${university.institutionType}, ` : ''}${university.isState ? 'давлатӣ' : 'ғайридавлатӣ'}. ${offered.length} ихтисос.`, 158),
            body: [
                nav,
                `<h1>${esc(university.name)}</h1>`,
                ru ? `<p>${esc(ru)}</p>` : '',
                `<p>${[university.institutionType, university.city, university.isState ? 'давлатӣ' : 'ғайридавлатӣ'].filter(Boolean).map(esc).join(' · ')}</p>`,
                about ? `<p>${esc(about)}</p>` : '',
                offered.length ? `<h2>Ихтисосҳо (${offered.length})</h2>${links(offered.map((c) => [`/info/${c.id}`, `${c.name}${c.code ? ` (${c.code})` : ''}`]))}` : '',
            ].join(''),
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'CollegeOrUniversity',
                name: university.name,
                ...(ru ? { alternateName: ru } : {}),
                address: university.city || undefined,
                url: `${ORIGIN}/universities/${university.id}`,
            },
        });
    }

    // ── Рӯйхатҳо: Google аз онҳо ҳамаи саҳифаҳоро меёбад
    page({
        route: '/careers',
        title: `Ҳамаи ${careers.length} ихтисоси ММТ-и Тоҷикистон | ${SITE}`,
        description: `Рӯйхати пурраи ${careers.length} ихтисоси Маркази миллии тестӣ бо коди расмӣ, кластер, донишгоҳҳо, маош ва балҳои гузариш.`,
        body: nav + `<h1>Ихтисосҳои Тоҷикистон</h1><p>${careers.length} ихтисоси расмии ММТ</p>` + [...clusters].map(([name, items]) =>
            `<h2>${esc(name)} (${items.length})</h2>${links(items.map((c) => [`/info/${c.id}`, `${c.name}${c.code ? ` (${c.code})` : ''}`]))}`).join(''),
    });
    page({
        route: '/universities',
        title: `Донишгоҳҳои Тоҷикистон — ${universities.length} муассиса дар харита | ${SITE}`,
        description: `${universities.length} донишгоҳ ва коллеҷи Тоҷикистон дар харита: шаҳр, навъи муассиса ва ихтисосҳо.`,
        body: nav + `<h1>Донишгоҳҳои Тоҷикистон дар як харита</h1>` + links(universities.map((u) => [`/universities/${u.id}`, `${u.name}${u.city ? ` — ${u.city}` : ''}`])),
    });
    page({
        route: '/about',
        title: `Дар бораи мо | ${SITE}`,
        description: 'Ихтисоси ман — платформаи роҳнамоии касбӣ барои ҷавонони Тоҷикистон: санҷиши ММТ, 884 ихтисос, донишгоҳҳо ва балҳои гузариш.',
        body: nav + '<h1>Дар бораи «Ихтисоси ман»</h1><p>Мо ба ҷавонони Тоҷикистон дар интихоби касб бо маълумоти дақиқ кӯмак мекунем: ихтисосҳои расмии ММТ, донишгоҳҳо, нархи таҳсил, ҷойҳои ройгон ва балҳои гузариши солҳои 2021–2025.</p>',
    });
    page({
        route: '/',
        title: `${SITE} — интихоби касб ва донишгоҳ дар Тоҷикистон`,
        description: `Санҷиши касбӣ, ${careers.length} ихтисоси ММТ, ${universities.length} донишгоҳ, маош ва балҳои гузариш — ҳама дар як ҷо барои хатмкунандагони Тоҷикистон.`,
        body: nav + `<h1>${SITE} — кадом касб ба шумо мувофиқ аст?</h1><p>Дар Тоҷикистон ${careers.length} ихтисоси расмии ММТ ва ${universities.length} донишгоҳу коллеҷ ҳаст. Санҷиш гузаред, ихтисосҳоро муқоиса кунед ва донишгоҳи наздиктаринро ёбед.</p>`
            + [...clusters].map(([name, items]) => `<h2>${esc(name)}</h2>${links(items.slice(0, 12).map((c) => [`/info/${c.id}`, c.name]))}`).join(''),
    });

    console.log(`noindex (тавсифи қолабӣ): ${careers.filter((c) => !c.contentWritten).length}`);
    console.log(`Тайёр: ${careers.length + universities.length + 4} саҳифа, ${((Date.now() - started) / 1000).toFixed(1)} с → ${outDir}`);
})().catch((error) => {
    console.error('Prerender нашуд:', error.message);
    process.exit(1);
});
