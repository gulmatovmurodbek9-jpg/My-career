// Манбаъҳои омӯзишӣ — ростқавлона:
// 1) сертификатҳое, ки дигар нестанд ё барои мактабхон нестанд, нишон дода намешаванд;
// 2) «китоб» танҳо вақте китоб аст, ки муаллиф ё номи маълум дорад. «SQL для начинающих»,
//    «Геодезия — учебник» — ин номи жанр аст, онҳо ҳамчун «мавзӯъ барои омӯзиш» меоянд.
const DEAD_OR_EXPERT_CERTS = [
    /tensorflow developer certificate/i, // Google соли 2024 баст
    /\bcissp\b/i, // 5 сол таҷрибаи корӣ лозим
    /\boscp\b/i, // барои мутахассисони ботаҷриба
];

const KNOWN_TITLES = [
    /pmbok guide/i,
    /фейнмановские лекции/i,
    /introduction to statistical learning/i,
    /web application hacker'?s handbook/i,
    /кодексҳои ҷумҳурии тоҷикистон/i,
];

export const usefulCertifications = (list) =>
    (Array.isArray(list) ? list : []).filter((item) => !DEAD_OR_EXPERT_CERTS.some((re) => re.test(String(item))));

// «Ном — Муаллиф» (на «— учебник»), ё номи маълуми бе муаллиф.
export const isRealBook = (item) => {
    const text = String(item || "");
    if (KNOWN_TITLES.some((re) => re.test(text))) return true;
    const author = text.split(/\s[—-]\s/)[1];
    return Boolean(author) && !/^(учебник|дастур|практическое пособие|пособие)/i.test(author.trim());
};

export const splitBooks = (list) => {
    const items = Array.isArray(list) ? list : [];
    return { books: items.filter(isRealBook), topics: items.filter((item) => !isRealBook(item)) };
};
