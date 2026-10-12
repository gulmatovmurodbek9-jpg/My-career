// 17 видеои омӯзишӣ: ҳар саҳна — амал дар сайт + скриншот + матни садо (tj / ru / en).
// focus — элементе, ки курсор ба он меравад ва доира мегирад; click — нишони клик.
export { setup } from "./setup.mjs";

const T = (tj, ru, en) => ({ text: [tj, ru, en] });
const N = (tj, ru, en) => ({ tj, ru, en });

// Ҷавобҳои дурусти санҷиши ихтисос (аз /check — он ҳеҷ чиз сабт намекунад), то дар видео
// ҷавоби дуруст интихоб шавад ва натиҷа «0 аз 4» набошад.
const API_URL = process.env.API_URL || "http://localhost:3005/api";
const keysCache = {};
async function trialKeys(careerId, lang) {
    const cacheKey = `${careerId}:${lang}`;
    if (!keysCache[cacheKey]) {
        const sc = await (await fetch(`${API_URL}/trial/career/${careerId}?lang=${lang}`)).json();
        keysCache[cacheKey] = [];
        for (const task of sc.tasks || []) {
            const r = await (await fetch(`${API_URL}/trial/career/${careerId}/check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: task.id, answer: null, lang }) })).json();
            keysCache[cacheKey].push({ kind: task.kind, title: task.title, answer: r.answer, options: (task.options || []).map((o) => ({ id: o.id, text: o.text })) });
        }
    }
    return keysCache[cacheKey];
}
// Вазифаи ҳозира (аз рӯи сарлавҳа) ва матни вариантҳои дуруст бо тартиб.
async function currentKey(h) {
    const m = h.page.url().match(/\/trial\/career\/([0-9a-f-]{36})/);
    if (!m) return null;
    const lang = await h.page.evaluate(() => localStorage.getItem("app_lang") || "tj");
    const keys = await trialKeys(m[1], lang).catch(() => []);
    const body = await h.page.evaluate(() => document.querySelector("main")?.innerText || "");
    const key = keys.find((k) => k.title && body.includes(k.title));
    if (!key) return null;
    const ids = Array.isArray(key.answer) ? key.answer : [key.answer];
    return { ...key, texts: ids.map((id) => key.options.find((o) => o.id === id)?.text).filter(Boolean) };
}
// Варианти дурусти аввалро бо data-v="opt" қайд мекунад (барои курсор ва зум).
async function markAnswer(h) {
    const key = await currentKey(h);
    await h.page.evaluate((text) => {
        const buttons = [...document.querySelectorAll("main button")].filter((b) => /^([A-FА-Г]|·)\s/.test(b.innerText.trim()));
        const pick = (text && buttons.find((b) => b.innerText.includes(text))) || buttons[0];
        if (pick) pick.dataset.v = "opt";
    }, key?.texts?.[0] || null);
}

// Ёрдамчӣ: дар вазифаи санҷиш ҷавоби дурустро интихоб мекунад (ё ягон вариантро), то тугмаи
// «Санҷидан» фаъол шавад.
async function answerTask(h) {
    const key = await currentKey(h);
    if (key?.kind === "number") {
        const input = await h.page.$("main input");
        if (input) { await input.click({ clickCount: 3 }); await h.page.keyboard.type(String(key.answer)); await h.wait(300); return; }
    } else if (key?.texts?.length) {
        for (const text of key.texts) {
            await h.page.evaluate((text) => {
                const b = [...document.querySelectorAll("main button")].find((x) => x.innerText.includes(text));
                if (b && b.getAttribute("aria-pressed") !== "true") b.click();
            }, text);
            await h.wait(300);
        }
        return;
    }
    // Вазифаи рақамӣ: ягон рақам менависем.
    const num = await h.page.$('main input[type="number"], main input[inputmode="decimal"], main input[inputmode="numeric"]');
    if (num && !(await num.evaluate((n) => n.value))) { await num.click(); await h.page.keyboard.type("10"); await h.wait(300); }
    for (let i = 0; i < 5; i += 1) {
        const done = await h.page.evaluate(() => {
            const check = [...document.querySelectorAll("button")].find((b) => /^(санҷидан|проверить|check)$/i.test(b.innerText.trim()));
            if (!check) return true;
            if (!check.disabled) return true;
            const options = [...document.querySelectorAll("main button")].filter((b) => /^([A-FА-Г]|·)\s/.test(b.innerText.trim()) && b.getAttribute("aria-pressed") !== "true" && !b.dataset.picked);
            const next = options[0];
            if (!next) return true;
            next.dataset.picked = "1";
            next.click();
            return false;
        });
        await h.wait(300);
        if (done) break;
    }
    await h.wait(300);
}
const CHECK = T("Санҷидан", "Проверить", "Check");
const LIKE_YES = T("Ҳа, шавқовар", "Да, интересно", "Yes, interesting");

// Натиҷаи захирашудаи тест: «Натиҷаро бинед» (ба ҷои аз нав гузаштан).
async function viewPrevious(h) {
    await h.page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /натиҷа|результат|result/i.test(b.innerText) && /бин|пешин|қаблӣ|посмотр|предыд|view|previous|see/i.test(b.innerText))?.click());
    await h.wait(1500);
}

// Тест: як саволро ҷавоб медиҳад (варианти аввал) ва ба саволи навбатӣ мегузарад.
async function answerQuestion(h, index = 0) {
    await h.page.evaluate((index) => {
        const buttons = [...document.querySelectorAll("main button")].filter((b) => /^([A-FА-Г]|·)\s/.test(b.innerText.trim()) || b.dataset.option);
        (buttons[index] || buttons[0])?.click();
    }, index);
    await h.wait(900);
}

export const VIDEOS = [
    {
        id: "00",
        title: N("«Ихтисоси ман» дар 1 дақиқа", "«Ихтисоси ман» за 1 минуту", "“Ikhtisosi man” in 1 minute"),
        auth: "student",
        next: N("Тестро гузаред ва касби худро ёбед", "Пройдите тест и найдите свою профессию", "Take the test and find your career"),
        storage: (ctx) => ({ quiz_results_v1: { ...ctx.quiz, rawAnswers: ctx.quizAnswers, answers: [], quizLang: "tj" } }),
        scenes: [
            { go: "/", narr: N(
                "Шумо синфи 9 ё 11 ҳастед ва намедонед кадом касбро интихоб кунед? «Ихтисоси ман» ба шумо ройгон кӯмак мекунад.",
                "Вы в 9 или 11 классе и не знаете, какую профессию выбрать? «Ихтисоси ман» поможет вам бесплатно.",
                "Are you in grade 9 or 11 and not sure which career to choose? “Ikhtisosi man” helps you for free.") },
            { do: async (h) => { await h.show('main a[href="/quiz"]'); }, focus: 'main a[href="/quiz"]', narr: N(
                "Аввал тести кӯтоҳро гузаред. Он нишон медиҳад, ки кадоме аз панҷ самти ММТ ба шумо наздиктар аст.",
                "Сначала пройдите короткий тест. Он покажет, какое из пяти направлений ЕГЭ вам ближе.",
                "First take a short test. It shows which of the five national exam directions suits you best.") },
            { go: "/quiz", do: async (h) => { await viewPrevious(h); await h.show(T("Ҳамаи панҷ самт", "Все пять направлений", "All five directions")); }, focus: T("Ҳамаи панҷ самт", "Все пять направлений", "All five directions"), narr: N(
                "Баъд натиҷа пайдо мешавад: самти шумо ва 12 ихтисоси мувофиқ бо фоиз.",
                "Потом появляется результат: ваше направление и 12 подходящих специальностей с процентами.",
                "Then you get your result: your direction and 12 matching specialties with percentages.") },
            { go: (ctx) => `/trial/career/${ctx.trialCareerId}`, focus: "main h1", narr: N(
                "Пеш аз интихоб касбро худатон санҷед: дар 10 дақиқа 4 вазифаи воқеии ҳамон мутахассисро ҳал мекунед.",
                "Перед выбором попробуйте профессию сами: за 10 минут вы решите 4 настоящие задачи этого специалиста.",
                "Before choosing, try the career yourself: in 10 minutes you solve 4 real tasks of that specialist.") },
            { go: (ctx) => `/info/${ctx.careerId}`, do: async (h) => { await h.show(T("Дар куҷо омӯхтан мумкин аст", "Где можно учиться", "Where to study")); }, focus: T("Дар куҷо омӯхтан мумкин аст", "Где можно учиться", "Where to study"), narr: N(
                "Донишгоҳ, ҷои буҷетӣ ё пулакиро интихоб кунед ва рӯйхати ҳуҷҷатсупориро тайёр созед.",
                "Выберите вуз, бюджетное или платное место и составьте список подачи документов.",
                "Choose a university, a state-funded or paid place, and build your application list.") },
            { go: "/dashboard/ai-chat", focus: "textarea", narr: N(
                "Савол доред? Ба маслиҳатчии AI нависед ё бо тугмаи 🎤 бо овоз пурсед.",
                "Есть вопрос? Напишите AI-консультанту или спросите голосом кнопкой 🎤.",
                "Have a question? Write to the AI advisor or ask by voice with the 🎤 button.") },
        ],
    },
    {
        id: "01",
        title: N("Саҳифаи асосӣ", "Главная страница", "Home page"),
        next: N("Тестро гузаред", "Пройдите тест", "Take the test"),
        scenes: [
            { go: "/", narr: N(
                "Саҳифаи асосӣ нуқтаи оғоз аст. Аз ин ҷо ба ҳамаи қисмҳои сайт рафтан мумкин аст.",
                "Главная страница — точка старта. Отсюда можно перейти в любой раздел сайта.",
                "The home page is your starting point. From here you can reach every part of the site.") },
            { do: async (h) => { await h.show('main a[href="/quiz"]'); }, focus: 'main a[href="/quiz"]', click: true, narr: N(
                "Агар бори аввал бошад, «Тестро оғоз кунед»-ро пахш кунед. Тест тақрибан 10 дақиқа мегирад.",
                "Если вы здесь впервые, нажмите «Начать тест». Он занимает около 10 минут.",
                "If it is your first time, press “Start the test”. It takes about 10 minutes.") },
            { do: async (h) => { await h.show("#cluster-groups", "start"); }, focus: '#cluster-groups a[href^="/careers?clusterId"]', narr: N(
                "Поёнтар панҷ самти ММТ ҳаст. Ҳар кадомро пахш кунед ва ихтисосҳои онро бинед.",
                "Ниже — пять направлений ЕГЭ. Нажмите любое, чтобы увидеть его специальности.",
                "Below are the five exam directions. Press any of them to see its specialties.") },
            { do: async (h) => { await h.top(); }, focus: 'header a[href="/careers"]', narr: N(
                "Дар менюи боло Ихтисосҳо, Донишгоҳҳо ва Кластерҳо ҳастанд. Дар телефон онҳо дар панели поён мебошанд.",
                "В верхнем меню — Специальности, Вузы и Кластеры. На телефоне они на нижней панели.",
                "The top menu has Specialties, Universities and Clusters. On a phone they are in the bottom bar.") },
        ],
    },
    {
        id: "02",
        title: N("Тести касбинтихобкунӣ", "Тест профориентации", "Career test"),
        auth: "student",
        next: N("Натиҷаи тестро бинед", "Посмотрите результат теста", "See your test result"),
        scenes: [
            { go: "/quiz", focus: T("баъди синфи 11", "После 11 класса", "After grade 11"), narr: N(
                "Аввал синфи худро интихоб кунед. Баъди синфи 9 коллеҷҳо, баъди синфи 11 донишгоҳҳо ҳам пешниҳод мешаванд.",
                "Сначала выберите свой класс. После 9-го предлагаются колледжи, после 11-го — и вузы.",
                "First choose your grade. After grade 9 you get colleges, after grade 11 universities too.") },
            { do: async (h) => { await h.click(T("баъди синфи 11", "После 11 класса", "After grade 11")); await h.wait(800); }, focus: "main h2, main h3", narr: N(
                "Ҳар савол вазъияти ҳаётӣ аст. Ҷавоби дуруст ё нодуруст нест — он чиро интихоб кунед, ки ба шумо наздиктар аст.",
                "Каждый вопрос — жизненная ситуация. Правильных и неправильных ответов нет — выберите то, что вам ближе.",
                "Each question is a real-life situation. There are no right or wrong answers — pick what feels closest to you.") },
            { do: async (h) => { await answerQuestion(h, 1); }, focus: "textarea, main input[type=text]", narr: N(
                "Агар ҳеҷ вариант мувофиқ набошад, бо калимаҳои худ нависед. AI варианти наздиктаринро меёбад.",
                "Если ни один вариант не подходит, напишите своими словами — AI найдёт ближайший.",
                "If no option fits, write in your own words — AI finds the closest one.") },
            { do: async (h) => { await answerQuestion(h, 2); await answerQuestion(h, 0); }, focus: "[role=progressbar], main .h-2, main .h-1\\.5", narr: N(
                "Хати болоӣ пешрафтро нишон медиҳад. Қисми дуюм бо самти шумо мувофиқ мешавад ва ихтисосҳоро аниқтар интихоб мекунад.",
                "Полоса сверху показывает прогресс. Вторая часть подстраивается под ваше направление и точнее подбирает специальности.",
                "The bar at the top shows your progress. The second part adapts to your direction and picks specialties more precisely.") },
            { do: async (h) => { await answerQuestion(h, 3); }, narr: N(
                "Бо шитоб ҷавоб надиҳед — ростқавлона ҷавоб диҳед, натиҷа дақиқтар мешавад.",
                "Не спешите — отвечайте честно, тогда результат будет точнее.",
                "Do not rush — answer honestly and the result will be more accurate.") },
        ],
    },
    {
        id: "03",
        title: N("Натиҷаи тест", "Результат теста", "Test result"),
        auth: "student",
        storage: (ctx) => ({ quiz_results_v1: { ...ctx.quiz, rawAnswers: ctx.quizAnswers, answers: [], quizLang: "tj" } }),
        next: N("Касберо, ки маъқул шуд, худатон санҷед", "Попробуйте понравившуюся профессию сами", "Try the career you liked yourself"),
        before: async (h) => { await h.go("/quiz"); await viewPrevious(h); },
        scenes: [
            { do: async (h) => { await h.top(); }, focus: "main h1", narr: N(
                "Дар боло самти ба шумо мувофиқ ва тавсифи он ҳаст.",
                "Наверху — подходящее вам направление и его описание.",
                "At the top you see the direction that suits you and its description.") },
            { do: async (h) => { await h.show(T("Ҳамаи панҷ самт", "Все пять направлений", "All five directions")); }, focus: T("Чаро ин фоиз?", "Почему такой процент?", "Why this percentage?"), click: true, narr: N(
                "Ҳамаи панҷ самт бо фоиз нишон дода шудаанд. «Чаро ин фоиз?»-ро пахш кунед, то бинед, ки кадом ҷавобҳо онро доданд.",
                "Все пять направлений показаны с процентами. Нажмите «Почему такой процент?», чтобы увидеть, какие ответы его дали.",
                "All five directions are shown with percentages. Press “Why this percentage?” to see which answers produced it.") },
            { do: async (h) => { await h.show("main article", "start"); }, focus: "main article", narr: N(
                "Поёнтар 12 ихтисос аз мувофиқтарин ҳастанд. Фоиз: нисфаш мувофиқати самт, нисфаш мувофиқат бо ҷавобҳои шумо.",
                "Ниже — 12 специальностей, от самой подходящей. Процент: половина — совпадение направления, половина — ваши ответы.",
                "Below are 12 specialties, best match first. The percentage is half direction match, half match with your answers.") },
            { do: async (h) => {
                await h.click(T("Донишгоҳ ва ҳуҷҷатсупорӣ", "Вуз и подача документов", "University and application"));
                await h.wait(1200);
                await h.click(T("Буҷетӣ", "Бюджет", "State-funded"));
                await h.show("main article li", "center");
            }, focus: T("Ба рӯйхат", "В список", "Add to list"), click: true, narr: N(
                "Зери ҳар ихтисос донишгоҳҳоро бинед, «Буҷетӣ» ё «Пулакӣ»-ро интихоб кунед ва бо як тугма ба рӯйхати ҳуҷҷатсупорӣ илова кунед.",
                "Под каждой специальностью откройте вузы, выберите «Бюджет» или «Платно» и одной кнопкой добавьте в список подачи.",
                "Under each specialty open the universities, choose “State-funded” or “Paid” and add it to your application list with one button.") },
            { do: async (h) => { await h.top(); await h.click(T("Натиҷаро фиристед", "Поделиться результатом", "Share your result")); await h.wait(1500); }, focus: '[role="dialog"] img', narr: N(
                "Натиҷаро ҳамчун тасвири зебо ба Telegram ё Instagram фиристед. Рангашро худатон интихоб кунед.",
                "Отправьте результат красивой картинкой в Telegram или Instagram. Цвет выберите сами.",
                "Share your result as a nice image on Telegram or Instagram. Pick the colour yourself.") },
        ],
    },
    {
        id: "04",
        title: N("Ихтисосҳо ва ҷустуҷӯ", "Специальности и поиск", "Specialties and search"),
        next: N("Саҳифаи ихтисосро кушоед", "Откройте страницу специальности", "Open a specialty page"),
        scenes: [
            { go: "/careers", focus: "main h1", narr: N(
                "Дар ин ҷо ҳамаи 884 ихтисоси ММТ-и Тоҷикистон ҳастанд.",
                "Здесь все 884 специальности ЕГЭ Таджикистана.",
                "Here are all 884 national exam specialties of Tajikistan.") },
            { do: async (h, lang) => { await h.type("input[placeholder]", { tj: "табиб", ru: "врач", en: "doctor" }[lang]); await h.wait(1500); }, focus: "input[placeholder]", narr: N(
                "Номи ихтисосро нависед — натиҷа ҳангоми навиштан пайдо мешавад.",
                "Напишите название специальности — результаты появятся сразу.",
                "Type a specialty name — results appear as you type.") },
            { do: async (h, lang) => {
                await h.type("input[placeholder]", { tj: "Тарҷумони забони англисӣ ва арабӣ", ru: "Переводчик английского и арабского", en: "Translator of English and Arabic" }[lang]);
            }, focus: "[data-ai-search]", click: true, after: async (h) => { await h.click("[data-ai-search]"); await h.wait(2500); await h.page.waitForFunction(() => document.querySelectorAll('main a[href^="/info/"]').length > 0, { timeout: 90000 }).catch(() => {}); await h.wait(1500); await h.show('main a[href^="/info/"]'); }, narr: N(
                "Агар номи ихтисосро намедонед, хоҳиши худро бо калимаҳои оддӣ нависед ва «Ҷустуҷӯи AI»-ро пахш кунед.",
                "Если не знаете названия, опишите желание простыми словами и нажмите «AI-поиск».",
                "If you do not know the name, describe what you want in plain words and press “AI search”.") },
            { focus: 'main a[href^="/info/"]', narr: N(
                "AI ихтисосҳои мувофиқро меёбад ва мефаҳмонад, ки чӣ тавр хоҳиши шуморо фаҳмид.",
                "AI находит подходящие специальности и объясняет, как понял ваш запрос.",
                "AI finds matching specialties and explains how it understood your request.") },
            { go: "/careers", do: async (h) => { await h.show(T("Категорияҳо", "Категории", "Categories")); }, focus: T("Категорияҳо", "Категории", "Categories"), narr: N(
                "Аз рӯи самт, шаҳр ва нархи таҳсил филтр кунед.",
                "Фильтруйте по направлению, городу и стоимости обучения.",
                "Filter by direction, city and tuition fee.") },
        ],
    },
    {
        id: "05",
        title: N("Саҳифаи ихтисос", "Страница специальности", "Specialty page"),
        auth: "student",
        next: N("Касбро худатон санҷед", "Попробуйте профессию сами", "Try the career yourself"),
        scenes: [
            { go: (ctx) => `/info/${ctx.careerId}`, focus: "main h1", narr: N(
                "Ин ҷо ҳама чиз дар бораи ихтисос ҳаст: рамзи ММТ, самт ва муддати таҳсил.",
                "Здесь всё о специальности: код ЕГЭ, направление и срок обучения.",
                "Everything about the specialty is here: exam code, direction and length of study.") },
            { do: async (h) => { await h.show(T("Як рӯзи корӣ", "Рабочий день", "working day")); }, focus: T("Як рӯзи корӣ", "Рабочий день", "working day"), narr: N(
                "Бинед, ки рӯзи кории ин мутахассис чӣ гуна мегузарад ва ҷиҳатҳои мусбат ва манфии касб кадомҳоянд.",
                "Посмотрите, как проходит рабочий день этого специалиста и какие у профессии плюсы и минусы.",
                "See what a working day of this specialist looks like and the pros and cons of the career.") },
            { do: async (h) => { await h.show(T("Дар куҷо омӯхтан мумкин аст", "Где можно учиться", "Where to study")); }, focus: T("+ Илова", "+ Добавить", "+ Add"), click: true, narr: N(
                "Дар ҷадвал донишгоҳҳо, ҷойҳои буҷетӣ, нарх ва шумораи ҷой ҳастанд. Бо тугма ба рӯйхати ҳуҷҷатсупорӣ илова кунед.",
                "В таблице — вузы, бюджетные места, цена и число мест. Кнопкой добавьте в список подачи.",
                "The table lists universities, state-funded places, fees and seats. Add one to your application list with the button.") },
            { do: async (h) => { await h.top(); }, focus: "main h1", narr: N(
                "Ихтисосро захира кунед, то баъд дар «Захирашудаҳо» зуд ёбед.",
                "Сохраните специальность, чтобы потом быстро найти её в «Сохранённых».",
                "Save the specialty to find it quickly later in “Saved”.") },
        ],
    },
    {
        id: "06",
        title: N("«Худро дар касб санҷед»", "«Попробуйте себя в профессии»", "“Try yourself in a career”"),
        next: N("Касби дигарро санҷед ва муқоиса кунед", "Попробуйте другую профессию и сравните", "Try another career and compare"),
        // Тарзи нав: як ҷумла — як амал. hint — дастури кӯтоҳ дар болои экран; target — элементе,
        // ки зум ва равшан мешавад; action — click / type / point.
        scenes: [
            { go: "/trial", target: "input[placeholder]", action: "type", text: N("Информатика", "Информатика", "Informatics"),
                hint: N("Номи ихтисосро нависед", "Введите название специальности", "Type a specialty name"), narr: N(
                "Дар сатри ҷустуҷӯ номи ихтисосро нависед. Масалан, «Информатика».",
                "В строке поиска введите название специальности. Например, «Информатика».",
                "Type a specialty name in the search box. For example, “Informatics”.") },
            { prep: async (h) => { await h.wait(800); }, target: 'main a[href^="/trial/career/"]', action: "click",
                hint: N("Ихтисосро интихоб кунед", "Выберите специальность", "Choose the specialty"), narr: N(
                "Аз рӯйхат ихтисосро интихоб кунед.",
                "Выберите специальность из списка.",
                "Choose the specialty from the list.") },
            { prep: async (h) => { await h.wait(1200); }, target: "main h1", action: "point",
                hint: N("Рӯзи кориро хонед", "Прочитайте о рабочем дне", "Read about the working day"), narr: N(
                "Аввал мехонед, ки рӯзи кории ин мутахассис чӣ гуна мегузарад.",
                "Сначала вы читаете, как проходит рабочий день этого специалиста.",
                "First, you read how this specialist’s working day goes.") },
            { target: { text: ["Намедонам", "Не знаю", "Not sure"], tag: "button" }, action: "click",
                hint: N("Боварии худро интихоб кунед", "Отметьте свою уверенность", "Pick how sure you are"), narr: N(
                "Интихоб кунед, ки ба ин касб чӣ қадар боварӣ доред.",
                "Отметьте, насколько вы уверены в этой профессии.",
                "Pick how sure you are about this career.") },
            { target: T("Оғоз", "Начать", "Start"), action: "click",
                hint: N("«Оғоз»-ро пахш кунед", "Нажмите «Начать»", "Press “Start”"), narr: N(
                "Тугмаи «Оғоз»-ро пахш кунед. Санҷиш чор вазифа дорад.",
                "Нажмите кнопку «Начать». В пробе четыре задачи.",
                "Press the “Start” button. The try-out has four tasks.") },
            { prep: async (h) => { await h.wait(1200); await markAnswer(h); }, target: 'main button[data-v="opt"]', action: "click",
                hint: N("Ҷавобро интихоб кунед", "Выберите ответ", "Choose an answer"), narr: N(
                "Вазифаро хонед ва ҷавобро интихоб кунед.",
                "Прочитайте задачу и выберите ответ.",
                "Read the task and choose an answer.") },
            { prep: async (h) => { await answerTask(h); }, target: CHECK, action: "click",
                hint: N("«Санҷидан»-ро пахш кунед", "Нажмите «Проверить»", "Press “Check”"), narr: N(
                "Тугмаи «Санҷидан»-ро пахш кунед.",
                "Нажмите кнопку «Проверить».",
                "Press the “Check” button.") },
            { prep: async (h) => { await h.wait(600); }, target: LIKE_YES, action: "point",
                hint: N("Шарҳро хонед", "Прочитайте объяснение", "Read the explanation"), narr: N(
                "Ин ҷо мебинед, ки ҷавоби дуруст кадом аст ва мутахассис чӣ тавр фикр мекунад.",
                "Здесь вы видите правильный ответ и как рассуждает специалист.",
                "Here you see the right answer and how a specialist thinks.") },
            { target: LIKE_YES, action: "click",
                hint: N("Бигӯед: писанд омад?", "Скажите: понравилось?", "Say: did you like it?"), narr: N(
                "Баъд бигӯед, ки ин кор ба шумо писанд омад ё не.",
                "Затем скажите, понравилась ли вам эта работа.",
                "Then say whether you liked this work.") ,
                // Се вазифаи дигар ҳамин тавр ҳал мешаванд — онҳоро сабт намекунем.
                cut: async (h) => {
                    // То пайдо шудани саволҳои охир (на маҳз 3 давр — як қадами хато тартибро вайрон намекунад).
                    for (let i = 0; i < 10; i += 1) {
                        if (await h.find(T("Хеле!", "Очень!", "A lot!"))) break;
                        await answerTask(h);
                        await h.click(CHECK).catch(() => {});
                        await h.click(LIKE_YES).catch(() => {});
                    }
                    await h.click(T("Хеле!", "Очень!", "A lot!")).catch(() => {});
                    await h.click(T("Асосан ҳа", "Скорее да", "Mostly yes")).catch(() => {});
                    await h.show(T("Хулосаро бинед", "Посмотреть итог", "See the result"));
                } },
            { target: T("Хулосаро бинед", "Посмотреть итог", "See the result"), action: "click",
                hint: N("Хулосаро бинед", "Посмотрите итог", "See the result"), narr: N(
                "Баъди чор вазифа тугмаи «Хулосаро бинед»-ро пахш кунед.",
                "После четырёх задач нажмите «Посмотреть итог».",
                "After four tasks, press “See the result”.") },
            { prep: async (h) => { await h.wait(1500); await h.top(); }, target: T("Ба шумо мувофиқ аст", "Вам подходит", "This suits you"), action: "point",
                hint: N("Натиҷаи шумо", "Ваш результат", "Your result"), narr: N(
                "Ин ҷо мебинед, ки касб ба шумо мувофиқ аст ё не. Агар не, ин ҳам натиҷаи муҳим аст.",
                "Здесь вы видите, подходит ли вам профессия. Если нет, это тоже важный результат.",
                "Here you see whether the career suits you. If not, that is an important result too.") },
        ],
    },
    {
        id: "07",
        title: N("Донишгоҳҳо", "Вузы", "Universities"),
        next: N("Ихтисосҳои донишгоҳро бинед", "Посмотрите специальности вуза", "See the university’s specialties"),
        scenes: [
            { go: "/universities", focus: ".leaflet-container", zoom: 1.04, narr: N(
                "Ҳамаи 128 донишгоҳ ва коллеҷи Тоҷикистон дар харита ҳастанд.",
                "Все 128 вузов и колледжей Таджикистана — на карте.",
                "All 128 universities and colleges of Tajikistan are on the map.") },
            { do: async (h, lang) => { await h.click(T("Рӯйхат", "Список", "List")); await h.type("input[placeholder]", { tj: "Хуҷанд", ru: "Худжанд", en: "Khujand" }[lang]); }, focus: "input[placeholder]", narr: N(
                "Ба «Рӯйхат» гузаред ва шаҳр ё номи донишгоҳро ҷустуҷӯ кунед.",
                "Переключитесь на «Список» и ищите город или название вуза.",
                "Switch to “List” and search by city or university name.") },
            { focus: T("Коллеҷҳо", "Колледжи", "Colleges"), narr: N(
                "Танҳо коллеҷҳо ё танҳо донишгоҳҳоро интихоб кунед.",
                "Выберите только колледжи или только вузы.",
                "Show only colleges or only universities.") },
            { do: async (h) => { await h.click('main a[href^="/universities/"]'); await h.wait(1200); }, focus: "main h1", narr: N(
                "Дар саҳифаи донишгоҳ ҳамаи ихтисосҳо, нарх ва ҷойҳои буҷетӣ ҳастанд.",
                "На странице вуза — все специальности, цены и бюджетные места.",
                "The university page lists all specialties, fees and state-funded places.") },
        ],
    },
    {
        id: "08",
        greet: true,
        title: N("Ёвари овозӣ", "Голосовой помощник", "Voice assistant"),
        next: N("Бо овоз ихтисос ҷустуҷӯ кунед", "Найдите специальность голосом", "Search for a specialty by voice"),
        scenes: [
            { go: "/", focus: 'button[aria-label="Ёвари овозӣ"], button[aria-label="Голосовой помощник"], button[aria-label="Voice assistant"]', narr: N(
                "Агар навиштан душвор бошад, бо овоз пурсед. Тугмаи микрофонро пахш кунед.",
                "Если писать неудобно, спросите голосом. Нажмите кнопку микрофона.",
                "If typing is hard, ask by voice. Press the microphone button.") },
            { go: "/careers?ai=%D1%82%D0%B0%D0%B1%D0%B8%D0%B1&voice=1", do: async (h) => { await h.wait(6000); }, focus: "input[placeholder]", narr: N(
                "Масалан, бигӯед: «Ихтисосҳои табибиро нишон деҳ». Ёвар саҳифаи лозимиро худаш мекушояд.",
                "Например, скажите: «Покажи медицинские специальности». Помощник сам откроет нужную страницу.",
                "For example, say “Show me medical specialties”. The assistant opens the right page by itself.") },
            { go: "/universities?q=%D0%A5%D1%83%D2%B7%D0%B0%D0%BD%D0%B4&view=list", focus: "input[placeholder]", narr: N(
                "Бо тоҷикӣ, русӣ ё англисӣ гап занед. Дар ҷои ором ёвар шуморо беҳтар мефаҳмад.",
                "Говорите по-таджикски, по-русски или по-английски. В тихом месте помощник понимает лучше.",
                "Speak Tajik, Russian or English. In a quiet place the assistant understands you better.") },
        ],
    },
    {
        id: "09",
        title: N("Бақайдгирӣ ва ворид шудан", "Регистрация и вход", "Sign up and sign in"),
        next: N("Тестро гузаред", "Пройдите тест", "Take the test"),
        scenes: [
            { go: "/register", focus: "form input", narr: N(
                "Барои нигоҳ доштани натиҷа ва рӯйхати ҳуҷҷатсупорӣ ба қайд гиред — ройгон аст.",
                "Чтобы сохранить результат и список подачи, зарегистрируйтесь — это бесплатно.",
                "Sign up to keep your result and application list — it is free.") },
            { focus: 'form button[type="submit"]', narr: N(
                "Ном, почта ва паролро нависед. Ба почтаи шумо рамзи 6-рақама меояд — онро ворид кунед.",
                "Укажите имя, почту и пароль. На почту придёт 6-значный код — введите его.",
                "Enter your name, email and password. A 6-digit code arrives by email — enter it.") },
            { go: "/login", focus: 'a[href="/forgot-password"]', narr: N(
                "Агар паролро фаромӯш кунед, онро бо почта барқарор кунед.",
                "Если забыли пароль, восстановите его по почте.",
                "If you forget your password, reset it by email.") },
        ],
    },
    {
        id: "10",
        title: N("Панели шахсӣ", "Личный кабинет", "Dashboard"),
        auth: "student",
        next: N("Бо маслиҳатчии AI гап занед", "Поговорите с AI-консультантом", "Talk to the AI advisor"),
        scenes: [
            { go: "/dashboard", do: async (h) => { await h.wait(2500); }, focus: "main h1", narr: N(
                "Панел ҷойи шахсии шумост. Ҳамаи абзорҳо дар як ҷо ҳастанд.",
                "Кабинет — ваше личное пространство. Все инструменты в одном месте.",
                "The dashboard is your personal space. All tools are in one place.") },
            { focus: 'aside a[href="/dashboard/plan"], a[href="/dashboard/plan"]', narr: N(
                "Аз ин ҷо ба тест, маслиҳатчии AI, муқоиса, нақшаи ҳуҷҷатсупорӣ ва захираҳо гузаред.",
                "Отсюда — тест, AI-консультант, сравнение, план подачи и сохранённое.",
                "From here go to the test, AI advisor, comparison, application plan and saved items.") },
            { do: async (h) => { await h.show(T("Холҳо аз рӯи самтҳо", "Баллы по направлениям", "Scores by direction"), "center"); }, focus: T("Холҳо аз рӯи самтҳо", "Баллы по направлениям", "Scores by direction"), narr: N(
                "Натиҷаи тест ва ихтисосҳои мувофиқ ҳамеша дар ин ҷо ҳастанд.",
                "Результат теста и подходящие специальности всегда здесь.",
                "Your test result and matching specialties are always here.") },
            { do: async (h) => { await h.top(); }, focus: 'a[href="/class"]', narr: N(
                "Агар омӯзгор рамзи синф дода бошад, дар ин ҷо ҳамроҳ шавед.",
                "Если учитель дал код класса, присоединитесь здесь.",
                "If your teacher gave you a class code, join here.") },
        ],
    },
    {
        id: "11",
        title: N("Маслиҳатчии AI", "AI-консультант", "AI advisor"),
        auth: "student",
        next: N("Ихтисосҳоро муқоиса кунед", "Сравните специальности", "Compare specialties"),
        scenes: [
            { go: "/dashboard/ai-chat", focus: "textarea", narr: N(
                "Ба маслиҳатчии AI ҳар саволро дар бораи касб, ихтисос ва донишгоҳ нависед.",
                "Задайте AI-консультанту любой вопрос о профессии, специальности или вузе.",
                "Ask the AI advisor anything about careers, specialties or universities.") },
            { focus: T("🎓", "🎓", "🎓"), click: true, narr: N(
                "Ё яке аз саволҳои тайёрро пахш кунед.",
                "Или нажмите один из готовых вопросов.",
                "Or press one of the ready-made questions.") },
            { do: async (h) => {
                await h.click(T("🎓", "🎓", "🎓"));
                await h.page.focus("textarea").catch(() => {});
                await h.page.keyboard.press("Enter");
                await h.page.waitForFunction(() => document.querySelectorAll("main .prose, main [class*=whitespace-pre]").length > 0 || document.body.innerText.length > 4000, { timeout: 60000 }).catch(() => {});
                await h.wait(8000);
            }, narr: N(
                "Ҷавоб натиҷаи тести шуморо ба назар мегирад. Саволро аниқ нависед: шаҳр, буҷет ва синф.",
                "Ответ учитывает результат вашего теста. Пишите точнее: город, бюджет, класс.",
                "The answer takes your test result into account. Be specific: city, budget and grade.") },
        ],
    },
    {
        id: "12",
        title: N("Муқоисаи ихтисосҳо", "Сравнение специальностей", "Compare specialties"),
        auth: "student",
        next: N("Нақшаи ҳуҷҷатсупориро созед", "Составьте план подачи", "Build your application plan"),
        scenes: [
            { go: "/dashboard/compare", focus: "main h1", narr: N(
                "Дар ин ҷо 2–3 ихтисосро паҳлӯ ба паҳлӯ муқоиса мекунед.",
                "Здесь вы сравниваете 2–3 специальности бок о бок.",
                "Here you compare 2–3 specialties side by side.") },
            { do: async (h) => { await h.page.evaluate(() => [...document.querySelectorAll("main button")].filter((b) => b.innerText.length > 30).slice(0, 2).forEach((b) => b.click())); await h.wait(600); }, focus: "main button", narr: N(
                "Аз захирашудаҳо интихоб кунед ё номи ихтисосро нависед.",
                "Выберите из сохранённых или введите название специальности.",
                "Pick from your saved list or type a specialty name.") },
            { focus: T("Муқоиса кунед", "Сравнить", "Compare"), narr: N(
                "Саволро нависед, масалан аз рӯи маош ва ҷойҳои кор, ва «Муқоиса кунед»-ро пахш кунед.",
                "Напишите, что важно, например зарплата и рабочие места, и нажмите «Сравнить».",
                "Write what matters, for example salary and jobs, and press “Compare”.") },
        ],
    },
    {
        id: "13",
        title: N("Нақшаи ҳуҷҷатсупорӣ", "План подачи документов", "Application plan"),
        auth: "student",
        next: N("Рӯйхатро ба волидайн нишон диҳед", "Покажите список родителям", "Show the list to your parents"),
        scenes: [
            { go: "/dashboard/plan", focus: "main h1", narr: N(
                "Ин рӯйхати ҳуҷҷатсупории шумо барои ММТ аст.",
                "Это ваш список подачи документов на ЕГЭ.",
                "This is your application list for the national exam.") },
            { do: async (h) => { await h.show("main table, main ol, main ul", "start"); }, focus: "main table tr, main li", narr: N(
                "Ҷойҳои буҷетӣ аввал, баъд пулакӣ меоянд. Ҳуҷҷат танҳо ба як кластер супорида мешавад ва то 12 интихоб мумкин аст.",
                "Сначала бюджетные места, потом платные. Подать можно только в один кластер, до 12 вариантов.",
                "State-funded places come first, then paid ones. You apply to one cluster only, up to 12 choices.") },
            { do: async (h) => { await h.top(); }, focus: T("Чоп / PDF", "Печать / PDF", "Print / PDF"), narr: N(
                "Рӯйхатро чоп кунед ё ҳамчун PDF гиред ва ба волидайн нишон диҳед.",
                "Распечатайте список или сохраните в PDF и покажите родителям.",
                "Print the list or save it as a PDF and show it to your parents.") },
        ],
    },
    {
        id: "14",
        title: N("Захирашудаҳо", "Сохранённые", "Saved"),
        auth: "student",
        next: N("Касберо аз рӯйхат санҷед", "Попробуйте профессию из списка", "Try a career from the list"),
        scenes: [
            { go: "/favorites", do: async (h) => { await h.click(T("Захирашуда (", "Сохранённые (", "Saved (")).catch(() => {}); }, focus: "main table, main ul.divide-y", zoom: 1.04, narr: N(
                "Ҳамаи ихтисосҳои захирашуда ва писандида дар як ҷадвал ҳастанд.",
                "Все сохранённые и понравившиеся специальности — в одной таблице.",
                "All saved and liked specialties are in one table.") },
            { focus: 'main a[href^="/trial/career/"]', narr: N(
                "Аз ин ҷо касбро санҷед, саҳифаи онро кушоед ё аз рӯйхат бароред.",
                "Отсюда можно попробовать профессию, открыть её страницу или убрать из списка.",
                "From here you can try a career, open its page or remove it from the list.") },
        ],
    },
    {
        id: "15",
        title: N("Ҳамроҳ шудан ба синф", "Вступление в класс", "Join a class"),
        next: N("Тестро оғоз кунед", "Начните тест", "Start the test"),
        scenes: [
            { go: "/class", focus: "#class-code", narr: N(
                "Омӯзгор ба шумо рамз ё QR-код медиҳад. QR-ро скан кунед ё рамзро дар ин ҷо нависед.",
                "Учитель даёт код или QR. Отсканируйте QR или введите код здесь.",
                "Your teacher gives you a code or QR. Scan the QR or type the code here.") },
            { go: (ctx) => `/class/${ctx.classroom.code}`, do: async (h, lang) => { await h.type("#class-name", { tj: "Ҷамшед Раҳимов", ru: "Джамшед Рахимов", en: "Jamshed Rahimov" }[lang]); }, focus: "#class-name", narr: N(
                "Номи худро нависед — почта лозим нест. Омӯзгор натиҷаи шуморо мебинад.",
                "Напишите своё имя — почта не нужна. Учитель увидит ваш результат.",
                "Type your name — no email needed. Your teacher will see your result.") },
            { do: async (h) => { await h.click('form button[type="submit"]'); await h.wait(1500); }, focus: 'a[href="/quiz"]', narr: N(
                "Баъд тест ва санҷиши касбро гузаред — натиҷа ба омӯзгор худкор меравад. Онҳоро дар ҳамон телефон гузаред.",
                "Потом пройдите тест и пробу профессии — результат сам попадёт к учителю. Делайте это на том же телефоне.",
                "Then take the test and a career try — results go to your teacher automatically. Use the same phone.") },
        ],
    },
    {
        id: "16",
        title: N("Ҳуҷраи омӯзгор", "Кабинет учителя", "Teacher room"),
        auth: "teacher",
        next: N("Синфи худро созед", "Создайте свой класс", "Create your class"),
        scenes: [
            { go: "/dashboard/teacher", focus: "main h1", narr: N(
                "Омӯзгор дархост мефиристад ва баъди тасдиқ «Ҳуҷраи омӯзгор» кушода мешавад.",
                "Учитель отправляет заявку, и после подтверждения открывается «Кабинет учителя».",
                "A teacher sends a request, and after approval the Teacher room opens.") },
            { focus: T("Синф созед", "Создать класс", "Create a class"), click: true, narr: N(
                "Синф созед: ном, мактаб ва синф.",
                "Создайте класс: название, школа и класс.",
                "Create a class: name, school and grade.") },
            { go: (ctx) => `/dashboard/teacher/${ctx.classroom.id}`, focus: "img[alt^='QR']", narr: N(
                "Рамз ва QR-ро ба хонандагон диҳед ё бо як тугма ба гурӯҳи Telegram фиристед.",
                "Дайте ученикам код и QR или отправьте одной кнопкой в группу Telegram.",
                "Give students the code and QR, or send it to your Telegram group with one button.") },
            { do: async (h) => { await h.show(T("Пешрафт", "Прогресс", "Progress")); }, focus: T("Боварӣ ба интихоб", "Уверенность в выборе", "Confidence in the choice"), narr: N(
                "Бинед, ки чанд нафар тест гузаштанд, кадом самтҳо бештаранд ва боварии хонандагон чӣ тавр тағйир ёфт.",
                "Смотрите, сколько учеников прошли тест, какие направления чаще и как изменилась их уверенность.",
                "See how many took the test, which directions are most common and how confidence changed.") },
            { do: async (h) => { await h.show("main ul li button", "center"); await h.click("main ul li button"); await h.wait(600); }, focus: "main ul li", narr: N(
                "Натиҷаи ҳар хонандаро кушоед. Ба онҳое, ки ҳанӯз нагузаштаанд, ёдраскунӣ фиристед.",
                "Откройте результат каждого ученика. Тем, кто ещё не прошёл, отправьте напоминание.",
                "Open each student’s result. Send a reminder to those who have not finished yet.") },
            { do: async (h) => { await h.top(); }, focus: T("Excel (CSV)", "Excel (CSV)", "Excel (CSV)"), narr: N(
                "Натиҷаҳоро ба Excel гиред ё чоп кунед. Барои экран номҳоро пинҳон кардан мумкин аст.",
                "Выгрузите результаты в Excel или распечатайте. Для показа на экране имена можно скрыть.",
                "Export results to Excel or print them. Names can be hidden for showing on a screen.") },
        ],
    },
];

// Дастурҳои кӯтоҳ (зард, дар болои экран) барои ҳар саҳна — то бинанда донад, ки чӣ кор кунад.
const H = (tj, ru, en) => ({ tj, ru, en });
const HINTS = {
    "00": [H("«Ихтисоси ман» — ройгон", "«Ихтисоси ман» — бесплатно", "“Ikhtisosi man” is free"), H("Тестро гузаред", "Пройдите тест", "Take the test"), H("Натиҷаи тест", "Результат теста", "Your test result"), H("Касбро худатон санҷед", "Попробуйте профессию", "Try the career"), H("Донишгоҳро интихоб кунед", "Выберите вуз", "Choose a university"), H("Ба AI савол диҳед", "Спросите AI", "Ask the AI")],
    "01": [H("Саҳифаи асосӣ", "Главная страница", "Home page"), H("«Тестро оғоз кунед»", "«Начать тест»", "“Start the test”"), H("Панҷ самти ММТ", "Пять направлений ЕГЭ", "Five exam directions"), H("Менюи сайт", "Меню сайта", "Site menu")],
    "02": [H("Синфи худро интихоб кунед", "Выберите свой класс", "Choose your grade"), H("Ҷавоберо интихоб кунед", "Выберите ответ", "Pick an answer"), H("Ё бо калимаҳои худ нависед", "Или напишите своими словами", "Or write in your own words"), H("Пешрафти тест", "Прогресс теста", "Test progress"), H("Ростқавлона ҷавоб диҳед", "Отвечайте честно", "Answer honestly")],
    "03": [H("Самти шумо", "Ваше направление", "Your direction"), H("«Чаро ин фоиз?»", "«Почему такой процент?»", "“Why this percentage?”"), H("12 ихтисоси мувофиқ", "12 подходящих специальностей", "12 matching specialties"), H("Ба рӯйхат илова кунед", "Добавьте в список", "Add to your list"), H("Натиҷаро фиристед", "Поделитесь результатом", "Share your result")],
    "04": [H("884 ихтисос", "884 специальности", "884 specialties"), H("Номи ихтисосро нависед", "Введите название", "Type a specialty name"), H("«Ҷустуҷӯи AI»-ро пахш кунед", "Нажмите «AI-поиск»", "Press “AI search”"), H("Натиҷаи AI", "Результат AI", "AI results"), H("Филтрҳо", "Фильтры", "Filters")],
    "05": [H("Маълумоти ихтисос", "О специальности", "About the specialty"), H("Рӯзи корӣ", "Рабочий день", "Working day"), H("Дар куҷо хондан мумкин", "Где учиться", "Where to study"), H("Ихтисосро захира кунед", "Сохраните специальность", "Save the specialty")],
    "07": [H("Харитаи донишгоҳҳо", "Карта вузов", "University map"), H("Шаҳрро ҷустуҷӯ кунед", "Найдите город", "Search for a city"), H("Коллеҷ ё донишгоҳ", "Колледж или вуз", "College or university"), H("Саҳифаи донишгоҳ", "Страница вуза", "University page")],
    "08": [H("Тугмаи микрофонро пахш кунед", "Нажмите кнопку микрофона", "Press the microphone"), H("Бо овоз пурсед", "Спросите голосом", "Ask by voice"), H("Се забон", "Три языка", "Three languages")],
    "09": [H("Ба қайд гиред — ройгон", "Регистрация — бесплатно", "Sign up — it’s free"), H("Рамзи 6-рақамаро ворид кунед", "Введите 6-значный код", "Enter the 6-digit code"), H("Паролро фаромӯш кардед?", "Забыли пароль?", "Forgot your password?")],
    "10": [H("Панели шахсӣ", "Личный кабинет", "Your dashboard"), H("Ҳамаи абзорҳо", "Все инструменты", "All tools"), H("Натиҷаи тести шумо", "Ваш результат теста", "Your test result"), H("Рамзи синф", "Код класса", "Class code")],
    "11": [H("Саволи худро нависед", "Напишите вопрос", "Type your question"), H("Ё саволи тайёрро пахш кунед", "Или нажмите готовый вопрос", "Or press a ready question"), H("Ҷавоби AI", "Ответ AI", "The AI answer")],
    "12": [H("Муқоисаи ихтисосҳо", "Сравнение специальностей", "Compare specialties"), H("Ихтисосҳоро интихоб кунед", "Выберите специальности", "Pick specialties"), H("«Муқоиса кунед»-ро пахш кунед", "Нажмите «Сравнить»", "Press “Compare”")],
    "13": [H("Рӯйхати ҳуҷҷатсупорӣ", "Список подачи", "Application list"), H("Аввал буҷетӣ, баъд пулакӣ", "Сначала бюджет, потом платно", "State-funded first"), H("Чоп ё PDF", "Печать или PDF", "Print or PDF")],
    "14": [H("Ихтисосҳои захирашуда", "Сохранённые специальности", "Saved specialties"), H("Санҷед ё кушоед", "Попробуйте или откройте", "Try or open")],
    "15": [H("Рамзи синфро нависед", "Введите код класса", "Enter the class code"), H("Номи худро нависед", "Введите своё имя", "Type your name"), H("Тестро гузаред", "Пройдите тест", "Take the test")],
    "16": [H("Ҳуҷраи омӯзгор", "Кабинет учителя", "Teacher room"), H("Синф созед", "Создайте класс", "Create a class"), H("Рамз ва QR-ро диҳед", "Дайте код и QR", "Share the code and QR"), H("Пешрафти синф", "Прогресс класса", "Class progress"), H("Натиҷаи ҳар хонанда", "Результат каждого ученика", "Each student’s result"), H("Excel ё чоп", "Excel или печать", "Excel or print")],
};
for (const video of VIDEOS) {
    const list = HINTS[video.id];
    if (!list) continue;
    if (list.length !== video.scenes.length) throw new Error(`HINTS ${video.id}: ${list.length} ≠ ${video.scenes.length}`);
    video.scenes.forEach((scene, i) => { if (!scene.hint) scene.hint = list[i]; });
}
