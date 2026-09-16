const STUDY_FORMS = {
    "рӯзона": "of_day",
    "шабона": "of_evening",
    "ғоибона": "of_distance",
    "фосилавӣ": "of_remote",
};

const PAYMENT_TYPES = {
    "ройгон": "of_free",
    "пулакӣ": "of_paid",
};

const LANGUAGES = {
    "тоҷикӣ": "of_lang_tj",
    "русӣ": "of_lang_ru",
    "англисӣ": "of_lang_en",
    "ӯзбекӣ": "of_lang_uz",
};

const lookup = (table) => (t, value) => {
    if (!value) return value;
    const key = table[value.trim()];
    return key ? t(`career_page.${key}`) : value;
};

export const studyFormLabel = lookup(STUDY_FORMS);
export const paymentTypeLabel = lookup(PAYMENT_TYPES);

export function languageLabel(t, value) {
    if (!value) return value;
    return value
        .split(",")
        .map((part) => {
            const key = LANGUAGES[part.trim()];
            return key ? t(`career_page.${key}`) : part.trim();
        })
        .join(", ");
}

const DEGREE_TYPES = {
    "бакалавр": "of_degree_bachelor",
    "миёнаи касбӣ": "of_degree_vocational",
};

export function degreeLabel(t, value) {
    if (!value) return value;
    const key = DEGREE_TYPES[value.trim().toLowerCase()];
    return key ? t(`career_page.${key}`) : value;
}
