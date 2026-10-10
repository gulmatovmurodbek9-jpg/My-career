// 17 видеои омӯзишӣ: ҳар саҳна — амал дар сайт + скриншот + матни садо (tj / ru / en).
// focus — элементе, ки курсор ба он меравад ва доира мегирад; click — нишони клик.
export { setup } from "./setup.mjs";

const T = (tj, ru, en) => ({ text: [tj, ru, en] });
const N = (tj, ru, en) => ({ tj, ru, en });

// Ёрдамчӣ: дар вазифаи санҷиш вариантҳоро интихоб мекунад, то тугмаи «Санҷидан» фаъол шавад.
async function answerTask(h) {
    for (let i = 0; i < 5; i += 1) {
        const done = await h.page.evaluate(() => {
            const check = [...document.querySelectorAll("button")].find((b) => /^(санҷидан|проверить|check)$/i.test(b.innerText.trim()));
            if (!check) return true;
            if (!check.disabled) return true;
            const options = [...document.querySelectorAll("main button")].filter((b) => /^[A-DА-Г]\s/.test(b.innerText.trim()) && b.getAttribute("aria-pressed") !== "true" && !b.dataset.picked);
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
        const buttons = [...document.querySelectorAll("main button")].filter((b) => /^[A-DА-Г]\s/.test(b.innerText.trim()) || b.dataset.option);
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
            }, focus: T("Ҷустуҷӯи AI", "AI-поиск", "AI search"), click: true, after: async (h) => { await h.click(T("Ҷустуҷӯи AI", "AI-поиск", "AI search")); await h.wait(2500); await h.page.waitForFunction(() => document.querySelectorAll('main a[href^="/info/"]').length > 0, { timeout: 90000 }).catch(() => {}); await h.wait(1500); await h.show('main a[href^="/info/"]'); }, narr: N(
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
        scenes: [
            { go: "/trial", do: async (h, lang) => { await h.type("input[placeholder]", { tj: "Информатика", ru: "Информатика", en: "Informatics" }[lang]); await h.wait(1500); }, focus: "input[placeholder]", narr: N(
                "Ҳар яке аз 884 ихтисос санҷиши худро дорад. Ихтисосро ҷустуҷӯ кунед.",
                "У каждой из 884 специальностей своя проба. Найдите специальность.",
                "Each of the 884 specialties has its own try-out. Search for one.") },
            { go: (ctx) => `/trial/career/${ctx.trialCareerId}`, focus: "main h1", narr: N(
                "Аввал рӯзи кориро бинед. Санҷиш 4 вазифа дорад ва тақрибан 10 дақиқа мегирад.",
                "Сначала посмотрите рабочий день. В пробе 4 задачи, около 10 минут.",
                "First look at the working day. The try-out has 4 tasks and takes about 10 minutes.") },
            { do: async (h) => { await h.show(T("Намедонам", "Не знаю", "Not sure"), "center"); await h.click(T("Намедонам", "Не знаю", "Not sure")); }, focus: T("Оғоз", "Начать", "Start"), click: true, narr: N(
                "Гӯед, ки ба ин касб чӣ қадар боварӣ доред, ва «Оғоз»-ро пахш кунед.",
                "Отметьте, насколько вы уверены в этой профессии, и нажмите «Начать».",
                "Say how confident you are about this career and press “Start”.") },
            { do: async (h) => { await h.click(T("Оғоз", "Начать", "Start")); await answerTask(h); }, focus: CHECK, click: true, narr: N(
                "Вазифаро ҳал кунед. Ҳамаи маълумоти лозимӣ дар худи вазифа ҳаст.",
                "Решите задачу. Вся нужная информация есть в самой задаче.",
                "Solve the task. Everything you need is in the task itself.") },
            { do: async (h) => { await h.click(CHECK); await h.wait(800); await h.show(LIKE_YES, "center"); }, focus: LIKE_YES, click: true, narr: N(
                "Баъд мебинед, ки чаро ҷавоб дуруст аст ва мутахассис чӣ тавр фикр мекунад. Сипас бигӯед: ин кор писанд омад ё не?",
                "Затем вы увидите, почему ответ верный и как думает специалист. После скажите: понравилась ли эта работа?",
                "Then you see why the answer is right and how a specialist thinks. After that, say whether you liked this work.") },
            { do: async (h) => {
                await h.click(LIKE_YES);
                for (let i = 0; i < 3; i += 1) { await answerTask(h); await h.click(CHECK).catch(() => {}); await h.click(LIKE_YES).catch(() => {}); }
                await h.click(T("Хеле!", "Очень!", "A lot!")).catch(() => {});
                await h.click(T("Асосан ҳа", "Скорее да", "Mostly yes")).catch(() => {});
                await h.click(T("Хулосаро бинед", "Посмотреть итог", "See the result"));
                await h.wait(2000); await h.top();
            }, focus: T("Ба шумо мувофиқ аст", "Вам подходит", "This suits you"), narr: N(
                "Дар охир мебинед, ки касб ба шумо мувофиқ аст ё не. Агар не — ин ҳам натиҷаи муҳим аст.",
                "В конце вы узнаете, подходит ли вам профессия. Если нет — это тоже важный результат.",
                "At the end you learn whether the career suits you. If not, that is an important result too.") },
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
