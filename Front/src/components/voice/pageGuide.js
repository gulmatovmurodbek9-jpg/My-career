// Ёвар ҳар саҳифаро худаш муаррифӣ мекунад — мисли Jarvis.
// Матнҳо собитанд, пас садояшон пешакӣ сохта мешавад ва фаврӣ мебарояд
// (prewarm-voice.js). Ҳар муаррифӣ бо савол тамом мешавад, то сӯҳбат идома ёбад.
//
// Агар матнро иваз кунед, дар prewarm-voice.js низ иваз кунед.

export const PAGE_GUIDES = [
    {
        id: "clusters",
        match: (path, hash) => path === "/" && hash === "#cluster-groups",
        text: "Ҳамаи ихтисосҳо ба панҷ кластер тақсим мешаванд: табиӣ ва техникӣ, иқтисод, филология ва санъат, ҳуқуқ ва ҷомеа, тиб ва варзиш. Кадомаш ба шумо наздик аст? Агар намедонед, беҳтар аст як бор санҷиш гузаред.",
    },
    {
        id: "home",
        match: (path) => path === "/",
        text: "Ин саҳифаи асосист. Мо ба шумо кӯмак мекунем, ки аз ҳаштсаду ҳаштоду чор ихтисоси Тоҷикистон дурусташро интихоб кунед. Ихтисос интихоб кунем, донишгоҳҳоро бинем ё санҷиш гузарем?",
        guestText: "Ин саҳифаи асосист. Мо ба шумо кӯмак мекунем, ки аз ҳаштсаду ҳаштоду чор ихтисоси Тоҷикистон дурусташро интихоб кунед. Барои он ки натиҷаи санҷиш ва захираҳоятон нигоҳ дошта шаванд, беҳтар аст сабти ном кунед. Ихтисос интихоб кунем ё санҷиш гузарем?",
    },
    {
        id: "careers",
        match: (path) => path === "/careers",
        text: "Ин ҷо ҳамаи ихтисосҳо ҳастанд. Ихтисос — касбест, ки дар донишгоҳ меомӯзед. Бигӯед, кӣ шудан мехоҳед, масалан духтур ё барномасоз, ва ман самтҳоро нишон медиҳам.",
    },
    {
        id: "universities",
        match: (path) => path === "/universities",
        text: "Ин ҷо ҳамаи донишгоҳҳои Тоҷикистон дар харита ҳастанд. Ман донишгоҳи наздиктарин ба шуморо ёфта метавонам, ё донишгоҳҳои як шаҳрро нишон медиҳам. Кадомашро мехоҳед?",
    },
    {
        id: "about",
        match: (path) => path === "/about",
        text: "Мо лоиҳаи Ихтисоси ман ҳастем. Мақсади мо — ба ҷавонони Тоҷикистон дар интихоби касб бо маълумоти дақиқ кӯмак кардан: балҳои гузариш, донишгоҳҳо ва нархҳо аз манбаъҳои расмӣ.",
    },
    {
        id: "advisor",
        match: (path) => path === "/dashboard/ai-advisor",
        text: "Ин тавсияи AI аст. Вай аз рӯи санҷиши шумо мегӯяд, ки кадом ихтисосҳо беҳтар мувофиқанд ва ба кадом донишгоҳ ҳуҷҷат супоред.",
    },
    {
        id: "chat",
        match: (path) => path === "/dashboard/ai-chat",
        text: "Ин чати AI аст. Ҳар саволе, ки дар бораи ихтисос, маош ё донишгоҳ доред, бемалол пурсед.",
    },
    {
        id: "compare",
        match: (path) => path === "/dashboard/compare",
        text: "Ин ҷо ихтисосҳоро муқоиса мекунед. Масалан бигӯед: барномасоз ва иқтисодчиро муқоиса кун.",
    },
    {
        id: "plan",
        match: (path) => path === "/dashboard/plan",
        text: "Ин рӯйхати ҳуҷҷатсупории шумост. Ман онро ҷобаҷо карда метавонам: аз наздик то дур, ё аввал ройгон. Чӣ хел ҷобаҷо кунам?",
    },
    {
        id: "dashboard",
        match: (path) => path === "/dashboard",
        text: "Ин панели шумост. Ин ҷо натиҷаи санҷиш, тавсияи AI, чат, муқоиса ва рӯйхати ҳуҷҷатсупорӣ ҳаст. Кадомашро кушоям?",
    },
    {
        id: "favorites",
        match: (path) => path === "/favorites",
        text: "Ин ихтисосҳоест, ки шумо захира кардаед. Мехоҳед онҳоро муқоиса кунем?",
    },
    {
        id: "quiz",
        match: (path) => path === "/quiz",
        text: "Санҷиш сар шуд. Ба ҳар савол ростқавлона ҷавоб диҳед — ҷавоби дуруст ё нодуруст нест.",
    },
];

// Барои саҳифаи ҷорӣ муаррифиро меёбад. Тартиб муҳим аст: кластерҳо пеш аз
// саҳифаи асосӣ, чунки ҳарду дар «/» ҳастанд.
export const guideFor = (path, hash = "", isGuest = false) => {
    const guide = PAGE_GUIDES.find((item) => item.match(path, hash));
    if (!guide) return null;
    return { id: guide.id, text: isGuest && guide.guestText ? guide.guestText : guide.text };
};

// Ҷумлаҳо; нуқта дар дохили «» (масалан «Таърих. Ҳуқуқ») ҷумларо намебурад.
const sentencesOf = (text) => {
    const result = [];
    let depth = 0;
    let start = 0;
    const value = String(text || "");
    for (let index = 0; index < value.length; index += 1) {
        const char = value[index];
        if (char === "«") depth += 1;
        else if (char === "»") depth = Math.max(0, depth - 1);
        else if (depth === 0 && ".!?".includes(char) && /\s/.test(value[index + 1] || " ")) {
            result.push(value.slice(start, index + 1).trim());
            start = index + 1;
        }
    }
    result.push(value.slice(start).trim());
    return result.filter(Boolean);
};

// Матнро ба қисмҳо барои гуфтан тақсим мекунад. Қисми аввал хурд — то садо
// зуд сар шавад; ҳар қисми навбатӣ то 2.5 баробари пешина калон мешавад:
// модел ~3 баробар тезтар аз садо месозад, пас қисми навбатӣ ҳамеша
// пеш аз тамом шудани гуфтаи ҷорӣ тайёр аст ва хомӯшӣ намешавад.
// prewarm-voice.js низ ҳаминро истифода мебарад, то кеш мувофиқ ояд.
export const splitForSpeech = (text) => {
    const chunks = [];
    for (const sentence of sentencesOf(text)) {
        const last = chunks[chunks.length - 1];
        const previous = chunks[chunks.length - 2];
        const limit = previous ? Math.min(200, previous.length * 2.5) : 60;
        if (last && last.length + sentence.length < Math.max(limit, 60)) chunks[chunks.length - 1] = `${last} ${sentence}`;
        else chunks.push(sentence);
    }
    return chunks;
};

// Ҳамаи матнҳо — барои пешакӣ сохтани садо.
export const allGuideTexts = () =>
    PAGE_GUIDES.flatMap((guide) => [guide.text, guide.guestText].filter(Boolean));
