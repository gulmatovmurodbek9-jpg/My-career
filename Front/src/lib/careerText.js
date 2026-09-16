const pick = (career, lang, field) => {
    if (!career) return "";
    if (!lang || lang === "tj") return career[field] || "";

    const translated = career.translations?.[lang]?.[field];
    return translated || career[field] || "";
};

export function careerName(career, lang) {
    if (!career) return "";
    return career.nameTranslated || pick(career, lang, "name");
}

export function careerDescription(career, lang) {
    return pick(career, lang, "description");
}

export function universityName(university, lang) {
    if (!university) return "";
    return university.nameTranslated || pick(university, lang, "name");
}
