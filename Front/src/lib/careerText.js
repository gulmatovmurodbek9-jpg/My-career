/**
 * Номи ихтисос бо забони ҷорӣ, аз ҳар манбае, ки омада бошад.
 *
 * Ду роҳ ба клиент мерасад:
 *   • `/careers?lang=ru` — сервер аллакай `nameTranslated` мегузорад ва
 *     ҷадвали пурраи тарҷумаҳоро мебарорад, то вазни ҷавоб зиёд нашавад;
 *   • `/users/saved-careers` — забонро қабул намекунад ва сабтро ҳамон тавр,
 *     бо сутуни `translations`, бармегардонад.
 *
 * Бе ин ёрирасон дар як рӯйхат ду забон омехта мешуд: пешниҳодҳо русӣ,
 * захираҳо тоҷикӣ.
 *
 * Номи расмии тоҷикӣ ҳеҷ гоҳ гум намешавад — вай ҳамчун `career.name` мемонад
 * ва ҳамон ном ба сервер фиристода мешавад, зеро ариза маҳз бо ҳамон ном
 * супорида мешавад.
 */
const pick = (career, lang, field) => {
    if (!career) return "";
    if (!lang || lang === "tj") return career[field] || "";

    const translated = career.translations?.[lang]?.[field];
    return translated || career[field] || "";
};

/** Ном барои экран. */
export function careerName(career, lang) {
    if (!career) return "";
    return career.nameTranslated || pick(career, lang, "name");
}

/** Тавсифи кӯтоҳ барои экран. */
export function careerDescription(career, lang) {
    return pick(career, lang, "description");
}

/**
 * Номи муассиса бо забони ҷорӣ.
 *
 * Донишгоҳҳо ҳамчун муносибати дохили сабти ихтисос меоянд ва сервер онҳоро
 * тарҷума намекунад — вай танҳо худи ихтисосро мегардонад. Аз ин рӯ тарҷума
 * ин ҷо аз сутуни `translations` гирифта мешавад.
 */
export function universityName(university, lang) {
    if (!university) return "";
    return university.nameTranslated || pick(university, lang, "name");
}
