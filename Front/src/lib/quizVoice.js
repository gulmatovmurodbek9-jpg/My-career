// Санҷиш бо овоз: матни хондани савол ва шинохтани ҷавоби гуфташуда (рақам, ҳарф ё худи
// ҷавоб). Ёвари овозӣ ва «Реҷаи овозӣ»-и тест ҳарду инро истифода мебаранд.
// ── Санҷиш бо овоз ──────────────────────────────────────────────
// Ёвар саволро бо ҷавобҳо мехонад; корбар рақам, ҳарф ё худи ҷавобро мегӯяд.
export const QUIZ_ORDINALS = {
    tj: ["Якум", "Дуюм", "Сеюм", "Чорум", "Панҷум"],
    ru: ["Первый", "Второй", "Третий", "Четвёртый", "Пятый"],
    en: ["One", "Two", "Three", "Four", "Five"],
};
const QUIZ_HEAD = { tj: "Саволи", ru: "Вопрос", en: "Question" };
const QUIZ_HINT = {
    tj: "Рақам ё ҷавобро гӯед. Агар ҷавоби шумо дар рӯйхат набошад, онро бо суханони худ гӯед.",
    ru: "Назовите номер или ответ. Если вашего ответа нет в списке, скажите его своими словами.",
    en: "Say the number or the answer. If your answer is not listed, say it in your own words.",
};
export const quizSpeech = (quiz, lang) => {
    const ord = QUIZ_ORDINALS[lang] || QUIZ_ORDINALS.tj;
    const clean = (value) => String(value || "").replace(/[«»"“”]/g, "").replace(/[.!?…\s]+$/, "").trim();
    const asked = String(quiz.question || "").trim();
    // step < 0 — саволи пеш аз санҷиш («баъди кадом синф?»), рақам надорад.
    const head = quiz.step >= 0 ? `${QUIZ_HEAD[lang] || QUIZ_HEAD.tj} ${quiz.step + 1}. ` : "";
    const parts = [
        `${head}${clean(asked)}${/\?$/.test(asked) ? "?" : "."}`,
        ...quiz.options.map((option, index) => `${ord[index] || index + 1}: ${clean(option)}.`),
    ];
    if (quiz.step === 0) parts.push(QUIZ_HINT[lang] || QUIZ_HINT.tj);
    return parts.join(" ");
};

// Ҳамон матн ҳамчун ҷумлаҳои алоҳида — барои «Реҷаи овозӣ»: ҷумлаи аввал зуд сохта ва хонда
// мешавад, боқимонда дар ҳамин вақт тайёр мешаванд. Рақами тартибӣ («Якум.») ва матни ҷавоб
// ҷудо: тартиби ҷавобҳо барои ҳар корбар тасодуфӣ аст, вале ҳар ҷумла дар кеши сервер якхела мемонад
// (Back/nest-backend/scripts/warm-quiz-voice.mjs онҳоро пешакӣ месозад).
export const quizSpeechParts = (quiz, lang) => {
    const ord = QUIZ_ORDINALS[lang] || QUIZ_ORDINALS.tj;
    const clean = (value) => String(value || "").replace(/[«»"“”]/g, "").replace(/[.!?…\s]+$/, "").trim();
    const asked = String(quiz.question || "").trim();
    const parts = [
        quiz.step >= 0 ? `${QUIZ_HEAD[lang] || QUIZ_HEAD.tj} ${quiz.step + 1}.` : "",
        `${clean(asked)}${/\?$/.test(asked) ? "?" : "."}`,
        ...quiz.options.flatMap((option, index) => [`${ord[index] || index + 1}.`, `${clean(option)}.`]),
        quiz.step === 0 ? QUIZ_HINT[lang] || QUIZ_HINT.tj : "",
    ];
    return parts.filter((part) => part && part !== ".");
};

export const foldQuiz = (value) => String(value || "").toLowerCase()
    .replace(/ё/g, "е").replace(/ӣ/g, "и").replace(/ӯ/g, "у").replace(/ҳ/g, "х")
    .replace(/ҷ/g, "ч").replace(/қ/g, "к").replace(/ғ/g, "г")
    .replace(/[^a-zа-я0-9\s]/g, " ").replace(/\s+/g, " ").trim();
// Решаҳои рақами тартибӣ (ҳар се забон) ва ҳарфҳо — ба тартиби экран A–E.
const QUIZ_PICK = [
    ["якум", "як", "1", "перв", "один", "одна", "first", "one", "a", "а", "эй"],
    ["дуюм", "ду", "2", "втор", "два", "две", "second", "two", "b", "б", "бэ", "бе", "би"],
    ["сеюм", "се", "3", "трет", "три", "third", "three", "c", "ц", "цэ", "си", "с"],
    ["чорум", "чор", "4", "четв", "четыр", "fourth", "four", "d", "д", "дэ", "де", "ди"],
    ["панчум", "панч", "5", "пят", "fifth", "five", "e", "е", "э", "и"],
];
// Инҳо танҳо пурра мувофиқ меоянд, на ҳамчун аввали калима («се» ≠ «сегодня»).
const QUIZ_EXACT = new Set(["як", "ду", "се", "чор", "панч", "a", "а", "b", "б", "c", "ц", "с", "d", "д", "e", "е", "э", "и",
    "1", "2", "3", "4", "5", "бе", "би", "си", "де", "ди", "дэ", "бэ", "цэ", "эй", "one", "two", "three", "four", "five",
    "один", "одна", "два", "две", "три"]);
const QUIZ_FILLER = new Set(["вариант", "ответ", "номер", "чавоби", "чавоб", "раками", "раками", "option", "answer",
    "number", "letter", "буква", "харфи", "мой", "мне", "я", "выбираю", "интихоб", "мекунам", "the", "is", "it", "ин",
    "это", "ман", "please", "пожалуйста"]);

export const matchQuizCommand = (text, quiz) => {
    const folded = foldQuiz(text);
    if (!folded) return null;
    const words = folded.split(" ");
    // Саволи синф: «баъди синфи 9», «после одиннадцатого» — аз рӯи рақам, на калимаҳои умумӣ.
    if (quiz.id === "grade") {
        if (/(^|\D)11(\D|$)|ездах|одиннадцат|eleven/.test(folded)) return { type: "answer", position: 1 };
        if (/(^|\D)9(\D|$)|нух|девят|ninth|nine/.test(folded)) return { type: "answer", position: 0 };
    }
    if (/(повтор|repeat|again|такрор|боз хон)/.test(folded) && words.length <= 4) return { type: "repeat" };
    if (/^(далее|дальше|следующ|next|навбати|баъди|бади)/.test(folded) && words.length <= 3) return { type: "next" };
    if (/^(назад|предыдущ|back|previous|кабли|ба кафо)/.test(folded) && words.length <= 3) return { type: "back" };

    // Рақам ё ҳарф: ибораи кӯтоҳ («второй», «вариант Б», «ҷавоби сеюм»).
    const meaningful = words.filter((word) => !QUIZ_FILLER.has(word));
    if (meaningful.length >= 1 && meaningful.length <= 2) {
        for (const word of meaningful) {
            const position = QUIZ_PICK.findIndex((stems) => stems.some((stem) =>
                (QUIZ_EXACT.has(stem) ? word === stem : word.startsWith(stem))));
            if (position >= 0 && position < quiz.options.length) return { type: "answer", position };
        }
    }

    // Худи матни ҷавоб: калимаҳои муҳим (≥ 4 ҳарф) бо 5 ҳарфи аввал муқоиса мешаванд.
    const said = new Set(words.filter((word) => word.length >= 4).map((word) => word.slice(0, 5)));
    if (said.size) {
        const scored = quiz.options.map((option, position) => {
            const keys = [...new Set(foldQuiz(option).split(" ").filter((word) => word.length >= 4).map((word) => word.slice(0, 5)))];
            const hits = keys.filter((key) => said.has(key)).length;
            return { position, score: keys.length ? hits / keys.length : 0, hits };
        }).sort((a, b) => b.score - a.score);
        const [best, second] = scored;
        // Ё аксари калимаҳои вариант, ё калимаи муҳиме, ки танҳо дар ҳамин вариант ҳаст («программирование»).
        const clear = best && best.hits >= 1 && (!second || second.hits === 0) && said.size <= 3;
        if (best && best.hits >= 1 && (clear || (best.score >= 0.4 && (!second || best.score - second.score >= 0.2)))) {
            return { type: "answer", position: best.position };
        }
    }
    // Ҷавоби озоди корбар («ман бештар дар бораи ҳайвонот мегуфтам») — AI варианти наздикро меёбад.
    return words.length >= 2 ? { type: "free", text } : null;
};
