// Ёвар ҳар саҳифаро худаш муаррифӣ мекунад — мисли Jarvis.
// Матнҳо собитанд, пас садояшон пешакӣ сохта мешавад ва фаврӣ мебарояд
// (prewarm-voice.js). Ҳар муаррифӣ бо савол тамом мешавад, то сӯҳбат идома ёбад.
//
// Агар матнро иваз кунед, дар prewarm-voice.js низ иваз кунед.

export const PAGE_GUIDES = [
    {
        id: "clusters",
        en: "All specialties are divided into five clusters: natural and technical sciences, economics, philology and arts, law and society, medicine and sport. Which one is closer to you? If you are not sure, it is better to take the test once.",
        ru: "Все специальности делятся на пять кластеров: естественные и технические науки, экономика, филология и искусство, право и общество, медицина и спорт. Какой из них вам ближе? Если не знаете, лучше один раз пройти тест.",
        match: (path, hash) => path === "/" && hash === "#cluster-groups",
        text: "Ҳамаи ихтисосҳо ба панҷ кластер тақсим мешаванд: табиӣ ва техникӣ, иқтисод, филология ва санъат, ҳуқуқ ва ҷомеа, тиб ва варзиш. Кадомаш ба шумо наздик аст? Агар намедонед, беҳтар аст як бор санҷиш гузаред.",
    },
    {
        id: "home",
        en: "This is the home page. We help you choose the right specialty out of eight hundred eighty four specialties in Tajikistan. Shall we choose a specialty, look at universities or take the test?",
        guestEn: "This is the home page. We help you choose the right specialty out of eight hundred eighty four specialties in Tajikistan. To keep your test results, it is better to sign up. Shall we choose a specialty or take the test?",
        ru: "Это главная страница. Мы помогаем выбрать правильную специальность из восьмисот восьмидесяти четырёх специальностей Таджикистана. Выберем специальность, посмотрим университеты или пройдём тест?",
        match: (path) => path === "/",
        text: "Ин саҳифаи асосист. Мо ба шумо кӯмак мекунем, ки аз ҳаштсаду ҳаштоду чор ихтисоси Тоҷикистон дурусташро интихоб кунед. Ихтисос интихоб кунем, донишгоҳҳоро бинем ё санҷиш гузарем?",
        guestRu: "Это главная страница. Мы помогаем выбрать правильную специальность из восьмисот восьмидесяти четырёх специальностей Таджикистана. Чтобы сохранить результаты теста, лучше зарегистрироваться. Выберем специальность или пройдём тест?",
        guestText: "Ин саҳифаи асосист. Мо ба шумо кӯмак мекунем, ки аз ҳаштсаду ҳаштоду чор ихтисоси Тоҷикистон дурусташро интихоб кунед. Барои он ки натиҷаи санҷиш ва захираҳоятон нигоҳ дошта шаванд, беҳтар аст сабти ном кунед. Ихтисос интихоб кунем ё санҷиш гузарем?",
    },
    {
        id: "careers",
        en: "Here are all the specialties. A specialty is the profession you study at university. Tell me who you want to become, for example a doctor or a programmer, and I will show you the directions.",
        ru: "Здесь собраны все специальности. Специальность — это профессия, которую вы изучаете в университете. Скажите, кем вы хотите стать, например врачом или программистом, и я покажу направления.",
        match: (path) => path === "/careers",
        text: "Ин ҷо ҳамаи ихтисосҳо ҳастанд. Ихтисос — касбест, ки дар донишгоҳ меомӯзед. Бигӯед, кӣ шудан мехоҳед, масалан духтур ё барномасоз, ва ман самтҳоро нишон медиҳам.",
    },
    {
        id: "universities",
        en: "Here are all the universities of Tajikistan on the map. I can find the nearest university to you or show the universities of one city. Which would you like?",
        ru: "Здесь на карте все университеты Таджикистана. Я могу найти ближайший к вам университет или показать университеты одного города. Что выберете?",
        match: (path) => path === "/universities",
        text: "Ин ҷо ҳамаи донишгоҳҳои Тоҷикистон дар харита ҳастанд. Ман донишгоҳи наздиктарин ба шуморо ёфта метавонам, ё донишгоҳҳои як шаҳрро нишон медиҳам. Кадомашро мехоҳед?",
    },
    {
        id: "about",
        en: "We are the My Career project. Our goal is to help young people in Tajikistan choose a profession with accurate data: passing scores, universities and prices from official sources.",
        ru: "Мы — проект «Моя специальность». Наша цель — помочь молодёжи Таджикистана выбрать профессию по точным данным: проходные баллы, университеты и цены из официальных источников.",
        match: (path) => path === "/about",
        text: "Мо лоиҳаи Ихтисоси ман ҳастем. Мақсади мо — ба ҷавонони Тоҷикистон дар интихоби касб бо маълумоти дақиқ кӯмак кардан: балҳои гузариш, донишгоҳҳо ва нархҳо аз манбаъҳои расмӣ.",
    },
    {
        id: "advisor",
        en: "This is the recommendation of artificial intelligence. It tells you which specialties suit you and where to apply.",
        ru: "Это рекомендация искусственного интеллекта. Он подскажет, какие специальности вам подходят и куда подать документы.",
        match: (path) => path === "/dashboard/ai-advisor",
        text: "Ин тавсияи AI аст. Вай аз рӯи санҷиши шумо мегӯяд, ки кадом ихтисосҳо беҳтар мувофиқанд ва ба кадом донишгоҳ ҳуҷҷат супоред.",
    },
    {
        id: "chat",
        en: "This is the chat. Ask anything about a specialty, salary or university.",
        ru: "Это чат. Спрашивайте о специальности, зарплате или университете.",
        match: (path) => path === "/dashboard/ai-chat",
        text: "Ин чати AI аст. Ҳар саволе, ки дар бораи ихтисос, маош ё донишгоҳ доред, бемалол пурсед.",
    },
    {
        id: "compare",
        en: "Here you can compare specialties. For example, say: compare a programmer and an economist.",
        ru: "Здесь можно сравнить специальности. Например, скажите: сравни программиста и экономиста.",
        match: (path) => path === "/dashboard/compare",
        text: "Ин ҷо ихтисосҳоро муқоиса мекунед. Масалан бигӯед: барномасоз ва иқтисодчиро муқоиса кун.",
    },
    {
        id: "plan",
        en: "This is your application list. I can sort it from near to far, or free places first. How should I sort it?",
        ru: "Это ваш список подачи документов. Я могу отсортировать его от ближнего к дальнему или сначала бесплатные. Как отсортировать?",
        match: (path) => path === "/dashboard/plan",
        text: "Ин рӯйхати ҳуҷҷатсупории шумост. Ман онро ҷобаҷо карда метавонам: аз наздик то дур, ё аввал ройгон. Чӣ хел ҷобаҷо кунам?",
    },
    {
        id: "dashboard",
        en: "This is your dashboard: test results, recommendations, chat, comparison and the application list. What should I open?",
        ru: "Это ваша панель: результаты теста, рекомендации, чат, сравнение и список подачи документов. Что открыть?",
        match: (path) => path === "/dashboard",
        text: "Ин панели шумост. Ин ҷо натиҷаи санҷиш, тавсияи AI, чат, муқоиса ва рӯйхати ҳуҷҷатсупорӣ ҳаст. Кадомашро кушоям?",
    },
    {
        id: "favorites",
        en: "These are the specialties you saved. Would you like to compare them?",
        ru: "Это специальности, которые вы сохранили. Хотите их сравнить?",
        match: (path) => path === "/favorites",
        text: "Ин ихтисосҳоест, ки шумо захира кардаед. Мехоҳед онҳоро муқоиса кунем?",
    },
    {
        id: "quiz",
        en: "The test has started. Answer honestly, there are no right or wrong answers.",
        ru: "Тест начался. Отвечайте честно — правильных и неправильных ответов нет.",
        match: (path) => path === "/quiz",
        text: "Санҷиш сар шуд. Ба ҳар савол ростқавлона ҷавоб диҳед — ҷавоби дуруст ё нодуруст нест.",
    },
];

// Барои саҳифаи ҷорӣ муаррифиро меёбад. Тартиб муҳим аст: кластерҳо пеш аз
// саҳифаи асосӣ, чунки ҳарду дар «/» ҳастанд.
// Бо русӣ — матни ru, бо англисӣ — en (модели англисии сабти худи корбар).
export const guideFor = (path, hash = "", isGuest = false, lang = "tj") => {
    const guide = PAGE_GUIDES.find((item) => item.match(path, hash));
    if (!guide) return null;
    const code = lang === "ru" || lang === "en" ? lang : "tj";
    const text = code === "ru"
        ? (isGuest && guide.guestRu) || guide.ru || guide.text
        : code === "en"
            ? (isGuest && guide.guestEn) || guide.en || guide.text
            : (isGuest && guide.guestText) || guide.text;
    return { id: `${guide.id}:${code}`, text };
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
    const sentences = sentencesOf(text);
    // Ҷумлаи аввали дароз дар вергул ё тире бурида мешавад: пораи хурд ~2 баробар
    // тезтар сохта мешавад ва садо зудтар сар мешавад.
    const first = sentences[0] || "";
    if (first.length > 55) {
        const cut = first.slice(15, 55).search(/(,| —|:) /);
        if (cut >= 0) {
            const at = 15 + cut + (first[15 + cut] === " " ? 2 : 1);
            sentences.splice(0, 1, first.slice(0, at).trim(), first.slice(at).trim());
        } else if (first.length > 75) {
            // Бе вергул: дар фосилаи байни калимаҳо (~30–50 ҳарф) — садо ~1 сония пештар сар мешавад.
            // Беҳтар пеш аз «ва / ки / то / барои»; ҳеҷ гоҳ пас аз калимаи «…у»
            // («ҳаштоду | чор» — рақамро намебурем).
            const spaces = [];
            for (let at = first.indexOf(" ", 30); at > 0 && at < 55; at = first.indexOf(" ", at + 1)) spaces.push(at);
            const before = (at) => first.slice(0, at).split(" ").pop();
            const after = (at) => first.slice(at + 1).split(" ")[0];
            const space = spaces.find((at) => /^(ва|ки|то|барои|аммо|вале)$/i.test(after(at)))
                ?? spaces.find((at) => !/у$/i.test(before(at)) && !/^(ва|ки|то|барои|аммо|вале|дар|ба|аз)$/i.test(before(at)));
            if (space) sentences.splice(0, 1, first.slice(0, space).trim(), first.slice(space).trim());
        }
    }
    for (const sentence of sentences) {
        const last = chunks[chunks.length - 1];
        const previous = chunks[chunks.length - 2];
        const limit = previous ? Math.min(200, previous.length * 2.5) : 60;
        if (last && last.length + sentence.length < Math.max(limit, 60)) chunks[chunks.length - 1] = `${last} ${sentence}`;
        else chunks.push(sentence);
    }
    return chunks;
};

// Ҳамаи матнҳо — барои пешакӣ сохтани садо.
export const allGuideTexts = (lang = "tj") =>
    PAGE_GUIDES.flatMap((guide) => (lang === "ru" ? [guide.ru, guide.guestRu] : lang === "en" ? [guide.en, guide.guestEn] : [guide.text, guide.guestText]).filter(Boolean));
