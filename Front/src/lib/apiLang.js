import i18n from "./i18n";

export function currentApiLang() {
    const raw = i18n.language || "tj";
    if (raw.startsWith("ru")) return "ru";
    if (raw.startsWith("en")) return "en";
    return null;
}

export function withLang(params = {}) {
    const lang = currentApiLang();
    return lang ? { ...params, lang } : params;
}
