import i18n from "./i18n";

/**
 * Забони ҷорӣ дар шакле, ки сервер интизор аст.
 *
 * i18n метавонад «ru-RU» ё «en-US» диҳад; сервер танҳо се код мешиносад.
 * Тоҷикӣ забони аслии база аст — барои он ҳеҷ параметр лозим нест ва
 * `null` бармегардад, то дархост бе барзиёдӣ монад.
 */
export function currentApiLang() {
    const raw = i18n.language || "tj";
    if (raw.startsWith("ru")) return "ru";
    if (raw.startsWith("en")) return "en";
    return null;
}

/** Параметрҳои дархостро бо забон пурра мекунад. */
export function withLang(params = {}) {
    const lang = currentApiLang();
    return lang ? { ...params, lang } : params;
}
