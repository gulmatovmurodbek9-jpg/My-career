// Маълумоти пешакии саҳифа (SSR/пешсозӣ): дар сервер — globalThis.__SSR_DATA__,
// дар браузер — window.__SSR_DATA__ (дар HTML-и саҳифа навишта шудааст). Саҳифа ҳолати
// аввалро аз ин мегирад: Google матни пурраро мебинад ва корбар спиннерро намебинад.
// Калид бо забон: пешсозӣ танҳо барои тоҷикӣ аст; дар забони дигар браузер худаш бор мекунад.
export const ssrKey = (type, id, lang) => `${type}:${id}:${String(lang || "tj").slice(0, 2)}`;

export function ssrData(key) {
    const store = typeof window !== "undefined" ? window.__SSR_DATA__ : globalThis.__SSR_DATA__;
    return store?.[key];
}
