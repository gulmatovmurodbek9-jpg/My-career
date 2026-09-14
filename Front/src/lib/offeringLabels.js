/**
 * Қиматҳои ҷадвали пешниҳодҳо: шакли таҳсил, забон, намуди пардохт.
 *
 * Инҳо дар база маҷмӯи пӯшидаи чор-панҷ қимат доранд («рӯзона», «ғоибона»,
 * «ройгон»…), аз ин рӯ тарҷумаи онҳо ба база лозим нест — калидҳои i18n
 * бас аст. Дар акси ҳол ҳар сатри 5997 пешниҳод тарҷума мешуд.
 *
 * Қимати ношинос ҳамон тавр бармегардад: беҳтар аст матни тоҷикӣ монад, то
 * майдон холӣ шавад.
 */
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

/** Забон метавонад чандто бошад: «тоҷикӣ, русӣ» — ҳар яке алоҳида. */
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

/**
 * Дараҷаи таҳсил.
 *
 * Дар тамоми база ҳамагӣ ду қимат ҳаст — «Бакалавр» (692 ихтисос) ва
 * «Миёнаи касбӣ» (192). Мисли шакли таҳсил, ин маҷмӯи пӯшида аст ва
 * тарҷумаи базавӣ талаб намекунад.
 */
const DEGREE_TYPES = {
    "бакалавр": "of_degree_bachelor",
    "миёнаи касбӣ": "of_degree_vocational",
};

export function degreeLabel(t, value) {
    if (!value) return value;
    const key = DEGREE_TYPES[value.trim().toLowerCase()];
    return key ? t(`career_page.${key}`) : value;
}
