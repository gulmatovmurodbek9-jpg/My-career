// «Дӯстон маро чӣ гуна мебинанд» (360°): 8 сифат, матнҳо ва ҳисоби натиҷа.
export const PEER_TRAITS = [
    { key: "leader", icon: "👑", c: "c4", tj: ["Роҳбарӣ", "Дигаронро ба кор ҷалб мекунад ва қарор қабул мекунад"], ru: ["Лидерство", "Ведёт за собой и принимает решения"], en: ["Leadership", "Gets others going and makes decisions"] },
    { key: "accurate", icon: "🎯", c: "c2", tj: ["Дақиқӣ", "Корро бодиққат ва бе хато иҷро мекунад"], ru: ["Точность", "Делает всё аккуратно и без ошибок"], en: ["Precision", "Works carefully and without mistakes"] },
    { key: "creative", icon: "🎨", c: "c3", tj: ["Эҷодкорӣ", "Фикрҳои нав ва ғайриоддӣ меёбад"], ru: ["Творчество", "Находит новые и необычные идеи"], en: ["Creativity", "Comes up with new, unusual ideas"] },
    { key: "helpful", icon: "❤️", c: "c5", tj: ["Ғамхорӣ", "Ба дигарон бо омодагӣ кӯмак мекунад"], ru: ["Забота", "Охотно помогает другим"], en: ["Caring", "Is glad to help others"] },
    { key: "logical", icon: "🧠", c: "c1", tj: ["Мантиқ", "Масъалаҳои душворро қадам ба қадам ҳал мекунад"], ru: ["Логика", "Решает сложные задачи шаг за шагом"], en: ["Logic", "Solves hard problems step by step"] },
    { key: "patient", icon: "🌱", c: "c3", tj: ["Сабр", "Ором аст ва бо кӯдакону дигарон ҳавсала дорад"], ru: ["Терпение", "Спокоен и терпелив с детьми и другими"], en: ["Patience", "Calm and patient with kids and others"] },
    { key: "brave", icon: "🦁", c: "c4", tj: ["Далерӣ", "Аз нав ва душворӣ наметарсад, фикрашро мегӯяд"], ru: ["Смелость", "Не боится нового и трудного, говорит своё мнение"], en: ["Courage", "Not afraid of new or hard things, speaks up"] },
    { key: "social", icon: "💬", c: "c4", tj: ["Муошират", "Бо ҳама зуд забон меёбад ва хуб гап мезанад"], ru: ["Общение", "Легко находит общий язык и хорошо говорит"], en: ["Communication", "Easily connects with people and speaks well"] },
];

export const PEER_TEXT = {
    tj: {
        title: "Дӯстон маро чӣ гуна мебинанд?",
        intro: "Худро аз рӯи 8 сифат баҳо диҳед ва пайвандро ба 3–5 дӯст, ҳамсинф ё омӯзгор фиристед. Онҳо бе бақайдгирӣ баҳо медиҳанд — шумо мебинед, ки дигарон шуморо чӣ гуна мебинанд.",
        privacy: "Ҷавоби ҳар кас пинҳон аст: танҳо миёна нишон дода мешавад, ва танҳо вақте ки 2 нафар ё бештар ҷавоб доданд.",
        yourName: "Номи шумо", namePlaceholder: "Масалан: Ҷамшед",
        rateSelf: "Худро баҳо диҳед", scale: ["Кам", "", "Миёна", "", "Хеле"],
        create: "Пайванд созед", share: "Ба дӯстон фиристед", copy: "Нусха", copied: "Нусха шуд", copyFailed: "Пайвандро интихоб карда, нусха гиред",
        shareText: "Салом! Ман мехоҳам бидонам, ки ту маро чӣ гуна мебинӣ — 1 дақиқа: 8 сифатро баҳо деҳ.",
        waiting: "Ҷавоб доданд: {{n}}. Натиҷа аз {{m}} ҷавоб боло пайдо мешавад.", refresh: "Нав кардан",
        resultTitle: "Шумо ва дигарон", me: "Ман", others: "Дигарон", answers: "{{n}} ҷавоб",
        hidden: "Сифатҳои пинҳон", hiddenText: "Дигарон шуморо дар инҳо қавитар мебинанд, назар ба худатон:",
        blind: "Фикри шумо баландтар аст", blindText: "Дар инҳо худро беҳтар баҳо додед, назар ба дигарон — бо дӯстон гап занед:",
        strongest: "Сифатҳои аз ҳама қавӣ", direction: "Самти мувофиқ ба сифатҳои шумо", careers: "Ихтисосҳо барои шумо",
        newLink: "Пайванди нав", fullTest: "Тести пурра",
        friendTitle: "{{name}} аз шумо мепурсад", friendText: "Ӯро чӣ гуна мебинед? 8 сифатро ростқавлона баҳо диҳед — ҷавоби шумо пинҳон аст.",
        relation: "Шумо барои ӯ кӣ ҳастед?", relations: { friend: "Дӯст", classmate: "Ҳамсинф", teacher: "Омӯзгор", family: "Хешованд" },
        send: "Фиристодан", thanks: "Ташаккур! Ҷавоби шумо ба {{name}} кӯмак мекунад, ки худро беҳтар шиносад.", tryYourself: "Худатон ҳам санҷед",
        notFound: "Пайванд ёфт нашуд ё мӯҳлаташ гузаштааст.", error: "Хато шуд. Боз кӯшиш кунед.",
        none: "Ҳанӯз фарқи калон нест — шумо худро мисли дигарон мебинед.",
    },
    ru: {
        title: "Как меня видят друзья?",
        intro: "Оцените себя по 8 качествам и отправьте ссылку 3–5 друзьям, одноклассникам или учителю. Они оценят вас без регистрации — вы увидите, какими вас видят другие.",
        privacy: "Ответ каждого скрыт: показывается только среднее и только когда ответили 2 человека или больше.",
        yourName: "Ваше имя", namePlaceholder: "Например: Джамшед",
        rateSelf: "Оцените себя", scale: ["Мало", "", "Средне", "", "Очень"],
        create: "Создать ссылку", share: "Отправить друзьям", copy: "Копировать", copied: "Скопировано", copyFailed: "Выделите ссылку и скопируйте",
        shareText: "Привет! Хочу узнать, каким ты меня видишь — 1 минута: оцени 8 качеств.",
        waiting: "Ответили: {{n}}. Результат появится от {{m}} ответов.", refresh: "Обновить",
        resultTitle: "Вы и другие", me: "Я", others: "Другие", answers: "Ответов: {{n}}",
        hidden: "Скрытые сильные стороны", hiddenText: "Другие видят вас сильнее, чем вы сами:",
        blind: "Ваше мнение выше", blindText: "Здесь вы оценили себя выше, чем другие — поговорите с друзьями:",
        strongest: "Самые сильные качества", direction: "Направление под ваши качества", careers: "Специальности для вас",
        newLink: "Новая ссылка", fullTest: "Полный тест",
        friendTitle: "{{name}} спрашивает вас", friendText: "Каким вы его/её видите? Честно оцените 8 качеств — ваш ответ скрыт.",
        relation: "Кто вы для него/неё?", relations: { friend: "Друг", classmate: "Одноклассник", teacher: "Учитель", family: "Родственник" },
        send: "Отправить", thanks: "Спасибо! Ваш ответ поможет {{name}} лучше узнать себя.", tryYourself: "Попробуйте сами",
        notFound: "Ссылка не найдена или устарела.", error: "Ошибка. Попробуйте ещё раз.",
        none: "Большой разницы пока нет — вы видите себя так же, как другие.",
    },
    en: {
        title: "How do my friends see me?",
        intro: "Rate yourself on 8 qualities and send the link to 3–5 friends, classmates or a teacher. They rate you without signing up — and you see how others see you.",
        privacy: "Each answer is private: only the average is shown, and only once 2 or more people have answered.",
        yourName: "Your name", namePlaceholder: "For example: Jamshed",
        rateSelf: "Rate yourself", scale: ["Low", "", "Medium", "", "Very"],
        create: "Create link", share: "Send to friends", copy: "Copy", copied: "Copied", copyFailed: "Select the link and copy it",
        shareText: "Hi! I want to know how you see me — 1 minute: rate 8 qualities.",
        waiting: "Answered: {{n}}. The result appears after {{m}} answers.", refresh: "Refresh",
        resultTitle: "You and others", me: "Me", others: "Others", answers: "{{n}} answers",
        hidden: "Hidden strengths", hiddenText: "Others see you as stronger than you think:",
        blind: "You rate yourself higher", blindText: "Here you rated yourself above what others see — talk to your friends:",
        strongest: "Your strongest qualities", direction: "Direction that fits your qualities", careers: "Specialties for you",
        newLink: "New link", fullTest: "Full test",
        friendTitle: "{{name}} is asking you", friendText: "How do you see them? Honestly rate 8 qualities — your answer is private.",
        relation: "Who are you to them?", relations: { friend: "Friend", classmate: "Classmate", teacher: "Teacher", family: "Family" },
        send: "Send", thanks: "Thank you! Your answer helps {{name}} know themselves better.", tryYourself: "Try it yourself",
        notFound: "Link not found or expired.", error: "Something went wrong. Try again.",
        none: "No big difference yet — you see yourself the way others do.",
    },
};
export const peerText = (lang) => PEER_TEXT[String(lang || "tj").slice(0, 2)] || PEER_TEXT.tj;
export const peerLang = (lang) => (PEER_TEXT[String(lang || "tj").slice(0, 2)] ? String(lang).slice(0, 2) : "tj");
export const fill = (t, v) => String(t).replace(/\{\{(\w+)\}\}/g, (_, k) => v?.[k] ?? "");

// Таҳлил: сифатҳои пинҳон (дигарон ≥ +0.7), нуқтаҳои кӯр (худ ≥ +0.7), қавитаринҳо ва самт.
export function peerAnalysis(self, others) {
    const rows = PEER_TRAITS.map((t) => ({ ...t, self: Number(self?.[t.key] || 0), others: others ? Number(others[t.key] || 0) : null }));
    if (!others) return { rows, hidden: [], blind: [], strongest: [], cluster: null };
    const hidden = rows.filter((r) => r.others - r.self >= 0.7).sort((a, b) => (b.others - b.self) - (a.others - a.self)).slice(0, 3);
    const blind = rows.filter((r) => r.self - r.others >= 0.7).sort((a, b) => (b.self - b.others) - (a.self - a.others)).slice(0, 3);
    const strongest = [...rows].sort((a, b) => (b.self + b.others * 2) - (a.self + a.others * 2)).slice(0, 3);
    const clusters = {};
    strongest.forEach((r, i) => { clusters[r.c] = (clusters[r.c] || 0) + (3 - i); });
    const cluster = Object.entries(clusters).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return { rows, hidden, blind, strongest, cluster };
}
