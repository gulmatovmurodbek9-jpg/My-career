import { useEffect } from "react";

/*
 * Мета-маълумоти ҳар саҳифа барои ҷустуҷӯ ва шабакаҳои иҷтимоӣ.
 *
 * Тамоми сайт як `index.html` дорад, яъне ҳамаи 884 саҳифаи ихтисос ва 128
 * саҳифаи донишгоҳ дар Google бо ЯК сарлавҳа ва ЯК тавсиф менишастанд —
 * «Ихтисоси ман — Роҳнамоии Касбӣ». Довталабе, ки «Ҳуқуқшиносӣ Тоҷикистон»
 * меҷуст, ҳеҷ гоҳ ба саҳифаи мо намерасид, чунки барои Google ҳамаи онҳо як
 * саҳифаи такрорӣ буданд.
 *
 * Googlebot JavaScript-ро иҷро мекунад, аз ин рӯ тағйири мета баъд аз рендер
 * ҳисоб мешавад. Ин роҳи соддатарин аст: бе китобхонаи иловагӣ ва бе
 * пешрендери сервер.
 */

const SITE_NAME = "Ихтисоси ман";
const ORIGIN = "https://ikhtisosiman.qobus.tj";
const DEFAULT_IMAGE = `${ORIGIN}/logo.png`;

/** Тавсиф дар натиҷаи ҷустуҷӯ тақрибан дар 160 аломат бурида мешавад. */
const MAX_DESCRIPTION = 160;

function trim(text, limit = MAX_DESCRIPTION) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length <= limit) return clean;
    /* Дар мобайни калима намебурем — то нуқтаи фосилаи охирин. */
    const cut = clean.slice(0, limit - 1);
    const space = cut.lastIndexOf(" ");
    return `${(space > limit * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

function setTag(selector, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) {
        el = document.createElement(attrs.tag || "meta");
        document.head.appendChild(el);
    }
    for (const [key, value] of Object.entries(attrs)) {
        if (key === "tag") continue;
        if (value == null) el.removeAttribute(key);
        else el.setAttribute(key, value);
    }
    return el;
}

/**
 * @param {object} meta
 * @param {string} [meta.title]        Бе номи сайт — он худаш илова мешавад.
 * @param {string} [meta.description]
 * @param {string} [meta.path]         Роҳи каноникӣ, масалан `/info/<id>`.
 * @param {string} [meta.image]
 * @param {object|object[]} [meta.jsonLd] Маълумоти сохтории schema.org.
 * @param {boolean} [meta.noIndex]     Барои саҳифаҳои шахсӣ.
 * @param {boolean} [meta.ready]       Ҳангоми боргирӣ `false` — то маълумот
 *                                     наомадааст, мета иваз намешавад.
 */
export function usePageMeta({
    title,
    description,
    path,
    image,
    jsonLd,
    noIndex = false,
    ready = true,
} = {}) {
    const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : null;

    useEffect(() => {
        if (!ready) return;

        const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Роҳнамоии Касбӣ`;
        const desc = trim(
            description ||
            "Платформаи роҳнамоии касбӣ барои хатмкунандагони Тоҷикистон: санҷиши ММТ, ихтисосҳо, донишгоҳҳо ва нақшаи ҳуҷҷатсупорӣ.",
        );
        const url = path ? `${ORIGIN}${path}` : ORIGIN;
        const img = image || DEFAULT_IMAGE;

        document.title = fullTitle;
        setTag('meta[name="description"]', { name: "description", content: desc });

        /* Каноникӣ: ҳамон ихтисос метавонад бо `?from=...` кушода шавад ва
           Google онро саҳифаи алоҳидаи такрорӣ ҳисоб мекунад. */
        setTag('link[rel="canonical"]', { tag: "link", rel: "canonical", href: url });

        setTag('meta[name="robots"]', {
            name: "robots",
            content: noIndex ? "noindex, nofollow" : "index, follow",
        });

        setTag('meta[property="og:title"]', { property: "og:title", content: fullTitle });
        setTag('meta[property="og:description"]', { property: "og:description", content: desc });
        setTag('meta[property="og:url"]', { property: "og:url", content: url });
        setTag('meta[property="og:type"]', { property: "og:type", content: "website" });
        setTag('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
        setTag('meta[property="og:image"]', { property: "og:image", content: img });
        setTag('meta[property="og:locale"]', { property: "og:locale", content: "tg_TJ" });

        setTag('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
        setTag('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
        setTag('meta[name="twitter:description"]', { name: "twitter:description", content: desc });
        setTag('meta[name="twitter:image"]', { name: "twitter:image", content: img });

        /* Маълумоти сохторӣ ҳангоми гузаштан ба саҳифаи дигар бояд бурда
           шавад, вагарна аз ҳар саҳифа як блок ҷамъ мешавад ва Google
           ихтисоси кӯҳнаро ҳамроҳи нав мебинад. */
        const existing = document.head.querySelector('script[data-page-jsonld="true"]');
        if (existing) existing.remove();

        if (serializedJsonLd) {
            const script = document.createElement("script");
            script.type = "application/ld+json";
            script.dataset.pageJsonld = "true";
            script.textContent = serializedJsonLd;
            document.head.appendChild(script);
        }
    }, [title, description, path, image, serializedJsonLd, noIndex, ready]);
}

export { ORIGIN, SITE_NAME };
