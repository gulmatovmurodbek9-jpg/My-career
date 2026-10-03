// Маълумоти ихтиёрӣ пеш аз тест: фанҳои қавӣ, «танҳо ройгон», шаҳр.
// Тест танҳо хоҳишро мепурсад; ин се чиз қобилият, имкони молиявӣ ва минтақаро илова мекунанд.
const KEY = "quiz_context";

export const SUBJECTS = [
    { key: "math", tj: "Математика", ru: "Математика", en: "Maths" },
    { key: "physics", tj: "Физика", ru: "Физика", en: "Physics" },
    { key: "chemistry", tj: "Химия", ru: "Химия", en: "Chemistry" },
    { key: "biology", tj: "Биология", ru: "Биология", en: "Biology" },
    { key: "geography", tj: "География", ru: "География", en: "Geography" },
    { key: "history", tj: "Таърих", ru: "История", en: "History" },
    { key: "language", tj: "Забон ва адабиёт", ru: "Язык и литература", en: "Language & literature" },
    { key: "foreign", tj: "Забони хориҷӣ", ru: "Иностранный язык", en: "Foreign language" },
];

// Фанҳое, ки барои ҳар кластери ММТ асосӣ ҳастанд (имтиҳон ва таҳсил).
export const CLUSTER_SUBJECTS = {
    1: ["math", "physics"],
    2: ["math", "geography"],
    3: ["language", "foreign", "history"],
    4: ["history", "language"],
    5: ["biology", "chemistry"],
};

export function getQuizContext() {
    try {
        const value = JSON.parse(localStorage.getItem(KEY) || "{}");
        return {
            subjects: Array.isArray(value.subjects) ? value.subjects.filter((s) => SUBJECTS.some((x) => x.key === s)) : [],
            budget: value.budget === "free" ? "free" : "any",
            city: typeof value.city === "string" ? value.city : "",
        };
    } catch {
        return { subjects: [], budget: "any", city: "" };
    }
}

export function setQuizContext(context) {
    try {
        localStorage.setItem(KEY, JSON.stringify(context));
    } catch {
        /* нигоҳ дошта нашуд — танҳо дар ҳамин саҳифа */
    }
}

export const subjectName = (key, lang) => {
    const subject = SUBJECTS.find((s) => s.key === key);
    return subject ? subject[lang] || subject.tj : key;
};
