import { useSyncExternalStore } from "react";

// Синфи хатмкарда: 9 — танҳо коллеҷ, 11 — коллеҷ ва донишгоҳ, null — нишон надодааст (ҳама).
// Дар браузер нигоҳ дошта мешавад; ҳамаи саҳифаҳо бо useGrade() худкор нав мешаванд.
const KEY = "school_grade";
const EVENT = "grade-change";

export function getGrade() {
    try {
        const value = localStorage.getItem(KEY);
        return value === "9" || value === "11" ? Number(value) : null;
    } catch {
        return null;
    }
}

export function setGrade(grade) {
    try {
        if (grade === 9 || grade === 11) localStorage.setItem(KEY, String(grade));
        else localStorage.removeItem(KEY);
    } catch {
        /* браузер нигоҳ дошта наметавонад — танҳо дар ҳамин саҳифа */
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: grade || null }));
}

const subscribe = (callback) => {
    window.addEventListener(EVENT, callback);
    window.addEventListener("storage", callback);
    return () => {
        window.removeEventListener(EVENT, callback);
        window.removeEventListener("storage", callback);
    };
};

export const useGrade = () => useSyncExternalStore(subscribe, getGrade, () => null);

export function withGrade(params = {}) {
    const grade = getGrade();
    return grade ? { ...params, grade } : params;
}

export const GRADE_EVENT = EVENT;

export const GRADE_TEXT = {
    tj: {
        label: "Баъди кадом синф?",
        all: "Ҳама",
        g9: "Баъди синфи 9",
        g11: "Баъди синфи 11",
        hint9: "Баъди синфи 9 танҳо ба коллеҷ дохил шудан мумкин аст — танҳо коллеҷҳо нишон дода мешаванд.",
        hint11: "Баъди синфи 11 — ҳам коллеҷ, ҳам донишгоҳ.",
        noCollege: "Ин ихтисосро баъди синфи 9 хондан мумкин нест — танҳо баъди синфи 11.",
        notForGrade9: "Ин муассиса баъди синфи 9 қабул намекунад — танҳо баъди синфи 11.",
        pickTitle: "Шумо баъди кадом синф дохил мешавед?",
        pickDesc: "Баъди синфи 9 танҳо ба коллеҷ дохил шудан мумкин аст. Баъди синфи 11 — ҳам ба коллеҷ, ҳам ба донишгоҳ. Аз рӯи ҷавоби шумо ихтисосҳо ва муассисаҳо интихоб мешаванд.",
        pick9: "Баъди синфи 9 — танҳо коллеҷ",
        pick11: "Баъди синфи 11 — коллеҷ ва донишгоҳ",
        results9: "Тавсияҳо танҳо барои коллеҷ — баъди синфи 9.",
    },
    ru: {
        label: "После какого класса?",
        all: "Все",
        g9: "После 9 класса",
        g11: "После 11 класса",
        hint9: "После 9 класса можно поступить только в колледж — показаны только колледжи.",
        hint11: "После 11 класса — и колледж, и вуз.",
        noCollege: "Эту специальность нельзя получить после 9 класса — только после 11.",
        notForGrade9: "Это учебное заведение не принимает после 9 класса — только после 11.",
        pickTitle: "После какого класса вы поступаете?",
        pickDesc: "После 9 класса можно поступить только в колледж. После 11 класса — и в колледж, и в вуз. По вашему ответу мы подберём специальности и учебные заведения.",
        pick9: "После 9 класса — только колледж",
        pick11: "После 11 класса — колледж и вуз",
        results9: "Рекомендации только для колледжа — после 9 класса.",
    },
    en: {
        label: "After which grade?",
        all: "All",
        g9: "After grade 9",
        g11: "After grade 11",
        hint9: "After grade 9 you can only enter a college — only colleges are shown.",
        hint11: "After grade 11 — both colleges and universities.",
        noCollege: "This specialty is not available after grade 9 — only after grade 11.",
        notForGrade9: "This institution does not admit after grade 9 — only after grade 11.",
        pickTitle: "After which grade are you applying?",
        pickDesc: "After grade 9 you can only enter a college. After grade 11 — both a college and a university. We will pick specialties and institutions based on your answer.",
        pick9: "After grade 9 — college only",
        pick11: "After grade 11 — college and university",
        results9: "Recommendations for colleges only — after grade 9.",
    },
};

export const gradeText = (lang) => GRADE_TEXT[String(lang || "tj").slice(0, 2)] || GRADE_TEXT.tj;
