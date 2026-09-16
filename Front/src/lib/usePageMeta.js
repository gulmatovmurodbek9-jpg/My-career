import { useEffect } from "react";


import i18n from "./i18n";

const SITE_NAME = "Ихтисоси ман";
const ORIGIN = "https://ikhtisosiman.qobus.tj";
const DEFAULT_IMAGE = `${ORIGIN}/logo.png`;

const MAX_DESCRIPTION = 160;

function trim(text, limit = MAX_DESCRIPTION) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (clean.length <= limit) return clean;
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

        const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — ${i18n.t("misc2.meta_site_tagline")}`;
        const desc = trim(
            description || i18n.t("misc2.meta_site_desc"),
        );
        const url = path ? `${ORIGIN}${path}` : ORIGIN;
        const img = image || DEFAULT_IMAGE;

        document.title = fullTitle;
        setTag('meta[name="description"]', { name: "description", content: desc });

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
