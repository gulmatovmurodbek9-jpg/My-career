// «Касб-свайп»: 96 лаҳзаи воқеии кор; ҳар бозӣ 30-тои нодида (ниг. nextDeck). Ҳар корт — сурат (public/swipe/<id>.webp, бо
// Back/nest-backend/scripts/generate-swipe-images.mjs сохта мешавад), матн дар 3 забон,
// хусусиятҳо (traits) ва самтҳои ММТ (c1 техникӣ, c2 иқтисод ва география, c3 филология,
// педагогика ва санъат, c4 ҷомеашиносӣ ва ҳуқуқ, c5 тиб, биология ва варзиш).
// `kw` — аввали калимаҳо дар номи ихтисосҳо (барои ихтисосҳои мувофиқ аз суратҳои маъқул).
// `scene` — тавсифи сурат барои модели тасвирсоз (англисӣ).

export const TRAITS = {
    people: { tj: "Кор бо одамон", ru: "Работа с людьми", en: "Working with people" },
    tech: { tj: "Техника ва компютер", ru: "Техника и компьютер", en: "Tech and computers" },
    nature: { tj: "Табиат ва ҳаёт", ru: "Природа и живое", en: "Nature and living things" },
    numbers: { tj: "Рақам ва ҳисоб", ru: "Числа и расчёты", en: "Numbers and calculations" },
    creative: { tj: "Эҷодкорӣ", ru: "Творчество", en: "Creativity" },
    active: { tj: "Ҳаракат ва кори дастӣ", ru: "Движение и работа руками", en: "Movement and hands-on work" },
    office: { tj: "Кори ором дар идора", ru: "Спокойная работа в офисе", en: "Calm office work" },
    risk: { tj: "Таваккал ва ҳолатҳои тез", ru: "Риск и быстрые решения", en: "Risk and quick decisions" },
    helping: { tj: "Кӯмак ба дигарон", ru: "Помощь другим", en: "Helping others" },
    leading: { tj: "Роҳбарӣ ва қарор", ru: "Лидерство и решения", en: "Leading and deciding" },
    words: { tj: "Забон ва калима", ru: "Язык и слова", en: "Language and words" },
};

const C = (tj, ru, en) => ({ tj, ru, en });

export const SWIPE_CARDS = [
    { id: "code", text: C("Тамоми рӯз дар компютер барнома менависӣ", "Весь день пишешь программы за компьютером", "You write code at a computer all day"), traits: ["tech", "office"], c: { c1: 2 }, kw: ["барномав", "информатика", "низом"],
        scene: "a teenage boy writing code on a laptop with glowing code on the screen, modern bright workspace" },
    { id: "robot", text: C("Робот месозӣ ва онро ба ҳаракат медарорӣ", "Собираешь робота и оживляешь его", "You build a robot and bring it to life"), traits: ["tech", "creative"], c: { c1: 2 }, kw: ["дастгоҳҳои", "мошинсоз", "автоматон", "механика"],
        scene: "a teenage girl assembling a small friendly robot on a workbench with tools and wires" },
    { id: "build", text: C("Дар майдони сохтмон пул ва бино месозӣ", "Строишь мосты и здания на стройке", "You build bridges and buildings on site"), traits: ["tech", "active", "risk"], c: { c1: 2 }, kw: ["сохтмон", "кӯпрук", "лоиҳакашии", "банақшагирии"],
        scene: "a young engineer in a hard hat holding blueprints at a construction site with a crane and a bridge" },
    { id: "electric", text: C("Симу дастгоҳҳои барқиро таъмир мекунӣ", "Чинишь провода и электроприборы", "You repair wiring and electrical devices"), traits: ["tech", "active"], c: { c1: 2 }, kw: ["барқ", "васл", "энергетик"],
        scene: "a young electrician repairing an electrical panel with colorful wires and a screwdriver" },
    { id: "drone", text: C("Дрон ё ҳавопайморо идора мекунӣ", "Управляешь дроном или самолётом", "You pilot a drone or an aircraft"), traits: ["tech", "risk", "active"], c: { c1: 2 }, kw: ["бесарнишини", "беҳавонавард", "авиатсион", "дастгоҳҳои"],
        scene: "a young pilot flying a drone over green mountains of Tajikistan with a remote controller" },
    { id: "accounts", text: C("Бо рақамҳо ва ҳисобу китоб кор мекунӣ", "Работаешь с цифрами и расчётами", "You work with numbers and accounts"), traits: ["numbers", "office"], c: { c2: 2 }, kw: ["баҳисобгирии", "аудит", "ҳисоби"],
        scene: "a young accountant at a tidy desk with charts, a calculator and a tablet showing graphs" },
    { id: "shop", text: C("Мағоза ё тиҷорати худро мекушоӣ", "Открываешь свой магазин или бизнес", "You open your own shop or business"), traits: ["leading", "risk", "numbers"], c: { c2: 2 }, kw: ["тиҷорат", "соҳибкор", "бизнес"],
        scene: "a proud young shop owner opening a colorful small shop with an OPEN sign shape, no letters" },
    { id: "bank", text: C("Дар бонк ба мизоҷон дар бораи пул маслиҳат медиҳӣ", "Советуешь клиентам банка, как распорядиться деньгами", "You advise bank clients about money"), traits: ["people", "numbers", "office"], c: { c2: 2 }, kw: ["бонк", "молия", "қарз"],
        scene: "a young bank advisor talking with a family across a desk in a bright modern bank" },
    { id: "deal", text: C("Бо ширкатҳо гуфтушунид мекунӣ ва шартнома мебандӣ", "Ведёшь переговоры и заключаешь сделки", "You negotiate deals with companies"), traits: ["people", "leading"], c: { c2: 2 }, kw: ["тиҷорат", "менеҷмент", "иқтисодиёт"],
        scene: "two young business people shaking hands over a table in a glass office" },
    { id: "travel", text: C("Ҳар ҳафта ба шаҳри нав сафар мекунӣ", "Каждую неделю едешь в новый город", "You travel to a new city every week"), traits: ["active", "people", "risk"], c: { c2: 1, c4: 1 }, kw: ["сайёҳ", "туризм", "саёҳат"],
        scene: "a young traveller with a backpack and a map at a railway station with mountains in the distance" },
    { id: "write", text: C("Мақола ё китоб менависӣ", "Пишешь статьи или книги", "You write articles or books"), traits: ["words", "creative", "office"], c: { c3: 2 }, kw: ["рӯзноманигор", "адабиёти", "танқиди"],
        scene: "a young writer at a wooden desk writing in a notebook surrounded by books and a cup of tea" },
    { id: "translate", text: C("Ба меҳмонони хориҷӣ тарҷумонӣ мекунӣ", "Переводишь для иностранных гостей", "You interpret for foreign guests"), traits: ["words", "people"], c: { c3: 2 }, kw: ["тарҷума", "забони", "лингвистика"],
        scene: "a young interpreter with a headset translating between people of different countries at a conference" },
    { id: "design", text: C("Расм мекашӣ ё дизайн месозӣ", "Рисуешь или создаёшь дизайн", "You draw or create designs"), traits: ["creative"], c: { c3: 2 }, kw: ["дизайн", "графика", "санъати"],
        scene: "a young artist drawing on a graphics tablet with colorful sketches and paints around" },
    { id: "teach", text: C("Ба кӯдакон дарс медиҳӣ", "Ведёшь уроки у детей", "You teach a class of children"), traits: ["people", "helping", "words"], c: { c3: 2 }, kw: ["таҳсилоти", "педагогика", "омӯзгор"],
        scene: "a young teacher smiling in front of a bright classroom with children raising hands" },
    { id: "kids", text: C("Бо кӯдакони хурдсол бозӣ мекунӣ ва тарбия медиҳӣ", "Играешь и занимаешься с малышами", "You play with and care for little kids"), traits: ["helping", "people", "creative"], c: { c3: 2 }, kw: ["томактабӣ", "таҳсилоти", "тарбиявӣ"],
        scene: "a young kindergarten teacher playing with building blocks with small happy children" },
    { id: "news", text: C("Бо микрофон ва камера хабар тайёр мекунӣ", "Готовишь репортаж с микрофоном и камерой", "You report news with a mic and camera"), traits: ["people", "creative", "active"], c: { c3: 1, c4: 1 }, kw: ["рӯзноманигор", "журналист", "телевизион"],
        scene: "a young journalist holding a microphone in front of a camera on a city street" },
    { id: "court", text: C("Дар суд ҳуқуқи одамонро ҳимоя мекунӣ", "Защищаешь права людей в суде", "You defend people's rights in court"), traits: ["people", "leading", "words"], c: { c4: 2 }, kw: ["ҳуқуқ", "судӣ", "прокурор"],
        scene: "a young lawyer speaking confidently in a courtroom with wooden benches" },
    { id: "speech", text: C("Дар назди садҳо нафар суханронӣ мекунӣ", "Выступаешь перед сотнями людей", "You speak in front of hundreds of people"), traits: ["people", "leading"], c: { c4: 2 }, kw: ["сиёсат", "муносибатҳои", "идораи"],
        scene: "a young speaker on a stage with a microphone in front of a large audience" },
    { id: "psych", text: C("Ба одамон дар ҳалли мушкилоташон кӯмак мекунӣ", "Помогаешь людям справиться с трудностями", "You help people with their problems"), traits: ["people", "helping"], c: { c4: 2 }, kw: ["психология", "равоншиносии"],
        scene: "a young psychologist listening kindly to a person in a calm room with plants" },
    { id: "events", text: C("Чорабиниҳо ва лоиҳаҳои калон ташкил мекунӣ", "Организуешь мероприятия и большие проекты", "You organise events and big projects"), traits: ["leading", "people", "active"], c: { c4: 1, c2: 1 }, kw: ["менеҷменти", "ташкили", "идораи"],
        scene: "a young event organizer with a clipboard directing a team setting up a festival stage" },
    { id: "team", text: C("Дастаро роҳбарӣ мекунӣ ва қарор қабул мекунӣ", "Руководишь командой и принимаешь решения", "You lead a team and make decisions"), traits: ["leading", "people", "office"], c: { c2: 1, c4: 1 }, kw: ["менеҷмент", "идоракунии", "идораи"],
        scene: "a young team leader pointing at a whiteboard while a diverse team listens in a meeting room" },
    { id: "routine", text: C("Ҳар рӯз кори аниқ ва ором дар идора", "Каждый день — чёткая спокойная работа в офисе", "Clear, calm office work every day"), traits: ["office", "numbers"], c: { c2: 1 }, kw: ["ҳуҷҷатшиносӣ", "баҳисобгирии", "идораи"],
        scene: "a calm young office worker organizing neat folders on a tidy desk by a window" },
    { id: "doctor", text: C("Беморонро табобат мекунӣ", "Лечишь пациентов", "You treat patients"), traits: ["helping", "people"], c: { c5: 2 }, kw: ["табобат", "тибб"],
        scene: "a young doctor with a stethoscope kindly examining an elderly patient in a clinic" },
    { id: "night", text: C("Шабона дар беморхона навбатдорӣ мекунӣ", "Дежуришь ночью в больнице", "You work night shifts at a hospital"), traits: ["helping", "risk", "active"], c: { c5: 2 }, kw: ["ҳамширагӣ", "тибб"],
        scene: "a young nurse walking down a hospital corridor at night with soft lights" },
    { id: "lab", text: C("Дар лаборатория бо микроскоп озмоиш мегузаронӣ", "Ставишь опыты с микроскопом в лаборатории", "You run experiments with a microscope"), traits: ["nature", "office"], c: { c5: 2 }, kw: ["биология", "химия", "биохимия"],
        scene: "a young scientist looking into a microscope in a bright laboratory with test tubes" },
    { id: "farm", text: C("Растаниҳо мепарварӣ ва ҳосил мегирӣ", "Выращиваешь растения и собираешь урожай", "You grow plants and harvest crops"), traits: ["nature", "active"], c: { c5: 2 }, kw: ["агроном", "меваю", "растани"],
        scene: "a young farmer harvesting apples in a sunny orchard with mountains behind" },
    { id: "vet", text: C("Ҳайвонотро табобат мекунӣ", "Лечишь животных", "You treat animals"), traits: ["nature", "helping"], c: { c5: 2 }, kw: ["байтор", "ветеринар", "тибби"],
        scene: "a young veterinarian gently holding a puppy at a vet clinic" },
    { id: "coach", text: C("Варзишгаронро тамрин медиҳӣ", "Тренируешь спортсменов", "You coach athletes"), traits: ["active", "leading", "people"], c: { c5: 2 }, kw: ["тарбияи", "варзиш"],
        scene: "a young sports coach with a whistle training kids on a football field" },
    { id: "explore", text: C("Дар кӯҳҳо экспедитсия мекунӣ ва харита месозӣ", "Ходишь в экспедиции в горы и составляешь карты", "You go on mountain expeditions and make maps"), traits: ["nature", "active", "risk"], c: { c2: 1, c1: 1 }, kw: ["география", "геодезия", "геология"],
        scene: "a young geographer with a backpack and a map standing on a mountain ridge in the Pamirs" },
    { id: "chef", text: C("Таомҳои нав ихтироъ мекунӣ ва мепазӣ", "Придумываешь и готовишь новые блюда", "You invent and cook new dishes"), traits: ["creative", "active"], c: { c2: 1 }, kw: ["хӯроки", "тарабхона", "меҳмонхона"],
        scene: "a young chef in a white hat plating a colorful dish in a bright kitchen" },
    // ---- 17.10: 66 корти нав (ҳамагӣ 96) — дар се бозӣ ягон сурат такрор намешавад ----
    // c1 — техникӣ
    { id: "ai", text: C("Ба компютер меомӯзонӣ, ки суратҳоро шиносад", "Учишь компьютер узнавать картинки", "You teach a computer to recognise pictures"), traits: ["tech", "office"], c: { c1: 2 }, kw: ["зеҳни", "информатика", "барномав"],
        scene: "a young AI engineer at a computer with a glowing neural network diagram and photos of cats and cars being recognised on screen" },
    { id: "cyber", text: C("Сайтҳоро аз ҳакерҳо ҳифз мекунӣ", "Защищаешь сайты от хакеров", "You protect websites from hackers"), traits: ["tech", "risk"], c: { c1: 2 }, kw: ["амният", "бехатарии", "криптография", "киберӣ"],
        scene: "a young cybersecurity specialist in front of several monitors with a glowing shield and lock symbols, dark blue room" },
    { id: "games", text: C("Бозии компютерӣ месозӣ", "Создаёшь компьютерные игры", "You make video games"), traits: ["tech", "creative"], c: { c1: 2 }, kw: ["барномав", "графика", "информатика"],
        scene: "a young game developer designing a colorful fantasy game level on a large monitor with a game controller on the desk" },
    { id: "car", text: C("Мошинро таъмир мекунӣ ва беҳтар месозӣ", "Чинишь и улучшаешь машины", "You repair and tune cars"), traits: ["tech", "active"], c: { c1: 2 }, kw: ["автомобил", "автосервис", "муҳаррик"],
        scene: "a young mechanic working under the open hood of a car in a clean bright garage with tools on the wall" },
    { id: "architect", text: C("Хонаи навро дар компютер тарҳ мекашӣ", "Проектируешь новый дом на компьютере", "You design a new house on a computer"), traits: ["creative", "tech"], c: { c1: 2 }, kw: ["меъмор", "лоиҳакашии", "банақшагирии", "дизайни"],
        scene: "a young architect showing a 3D model of a modern house on a large screen next to a small physical paper model" },
    { id: "solar", text: C("Панелҳои офтобӣ насб мекунӣ", "Устанавливаешь солнечные панели", "You install solar panels"), traits: ["tech", "nature", "active"], c: { c1: 2 }, kw: ["энергетик", "манбаъҳои", "барқ", "нерӯгоҳ"],
        scene: "a young engineer installing solar panels on a rooftop on a sunny day with mountains in the background" },
    { id: "hydro", text: C("Дар нерӯгоҳи обии калон кор мекунӣ", "Работаешь на большой ГЭС", "You work at a big hydropower plant"), traits: ["tech", "risk"], c: { c1: 2 }, kw: ["гидро", "нерӯгоҳ", "энергетик", "истгоҳҳои"],
        scene: "a young engineer in a hard hat on top of a huge dam with rushing water and mountains, Tajikistan" },
    { id: "geology", text: C("Дар кӯҳҳо конҳои тилло меҷӯӣ", "Ищешь месторождения золота в горах", "You search the mountains for gold deposits"), traits: ["nature", "active", "risk"], c: { c1: 2 }, kw: ["геология", "конҳои", "кони", "металлург"],
        scene: "a young geologist with a hammer examining shiny rocks on a rocky mountain slope with a backpack" },
    { id: "plane", text: C("Ҳавопайморо пеш аз парвоз месанҷӣ", "Проверяешь самолёт перед вылетом", "You check an aircraft before take-off"), traits: ["tech", "active"], c: { c1: 2 }, kw: ["авиатсион", "ҳавоӣ", "киштиҳои", "парвоз"],
        scene: "a young aircraft technician inspecting a jet engine with a tablet at an airport at sunrise" },
    { id: "network", text: C("Интернети тезро ба деҳаҳо мекашӣ", "Проводишь быстрый интернет в сёла", "You bring fast internet to villages"), traits: ["tech", "active"], c: { c1: 2 }, kw: ["телекоммуникатсион", "шабака", "алоқа"],
        scene: "a young telecom engineer on a cell tower in a green mountain village, cables and antennas, sunny sky" },
    { id: "math", text: C("Масъалаҳои душвори математикиро ҳал мекунӣ", "Решаешь сложные математические задачи", "You solve hard maths problems"), traits: ["numbers", "office"], c: { c1: 2 }, kw: ["математика", "моделиронии", "механика"],
        scene: "a young mathematician thinking in front of a big chalkboard full of colorful formulas and geometric shapes" },
    { id: "factory", text: C("Хати истеҳсолро дар корхона идора мекунӣ", "Управляешь производственной линией на заводе", "You run a production line at a factory"), traits: ["tech", "leading"], c: { c1: 2 }, kw: ["автоматон", "истеҳсолот", "мошинсоз"],
        scene: "a young engineer with a tablet supervising robotic arms on a modern factory production line" },
    { id: "space", text: C("Ситораҳо ва кайҳонро бо телескоп меомӯзӣ", "Изучаешь звёзды и космос в телескоп", "You study stars and space with a telescope"), traits: ["nature", "numbers"], c: { c1: 2 }, kw: ["астроном", "физика", "метеорология"],
        scene: "a young astronomer looking through a big telescope under a starry night sky with the Milky Way over mountains" },
    { id: "tunnel", text: C("Роҳ ва нақбҳоро дар кӯҳ месозӣ", "Строишь дороги и тоннели в горах", "You build roads and tunnels in the mountains"), traits: ["active", "tech", "risk"], c: { c1: 2 }, kw: ["кӯпрук", "нақлиёт", "геодезия", "сохтмон"],
        scene: "a young road engineer in a hard hat at the entrance of a mountain tunnel with a winding road and trucks" },
    // c2 — иқтисод, география
    { id: "marketing", text: C("Барои маҳсулот реклама фикр мекунӣ", "Придумываешь рекламу для товаров", "You come up with ads for products"), traits: ["creative", "people"], c: { c2: 2 }, kw: ["маркетинг", "реклама"],
        scene: "a young marketer pinning colorful ad sketches on a board with a teammate in a bright creative office" },
    { id: "hotel", text: C("Меҳмонхонаро идора мекунӣ", "Управляешь гостиницей", "You run a hotel"), traits: ["people", "leading"], c: { c2: 2 }, kw: ["меҳмонхона", "саёҳат", "туризм", "хизматрасонии"],
        scene: "a young hotel manager welcoming guests with suitcases at a cozy hotel reception with plants" },
    { id: "guide", text: C("Сайёҳони хориҷиро ба Помир мебарӣ", "Водишь иностранных туристов по Памиру", "You guide foreign tourists in the Pamirs"), traits: ["people", "active", "words"], c: { c2: 2 }, kw: ["сайёҳ", "туризм", "кишваршиносӣ", "саёҳат"],
        scene: "a young tour guide showing a group of foreign hikers a turquoise mountain lake in the Pamirs" },
    { id: "logistics", text: C("Борҳоро аз Хитой то Душанбе мерасонӣ", "Доставляешь грузы из Китая в Душанбе", "You ship goods from China to Dushanbe"), traits: ["numbers", "leading"], c: { c2: 2 }, kw: ["логистика", "гумрук", "нақлиёт"],
        scene: "a young logistics manager with a tablet among cargo containers and trucks with a route map on a screen" },
    { id: "customs", text: C("Дар сарҳад борҳоро месанҷӣ", "Проверяешь грузы на границе", "You inspect cargo at the border"), traits: ["office", "risk"], c: { c2: 1, c4: 1 }, kw: ["гумрук"],
        scene: "a young customs officer in uniform checking documents next to a cargo truck at a mountain border post" },
    { id: "invest", text: C("Пулро ба лоиҳаҳои нав мегузорӣ", "Вкладываешь деньги в новые проекты", "You invest money in new projects"), traits: ["numbers", "risk"], c: { c2: 2 }, kw: ["инвеститсия", "бозори", "молия", "менеҷменти"],
        scene: "a young investor looking at rising charts on screens and a small plant growing out of coins on the desk" },
    { id: "tax", text: C("Ҳисоб мекунӣ, ки ширкат чӣ қадар андоз медиҳад", "Считаешь, сколько налогов платит фирма", "You work out a company's taxes"), traits: ["numbers", "office"], c: { c2: 2 }, kw: ["андоз", "аудит", "баҳисобгирии"],
        scene: "a young tax specialist with neat documents, a calculator and a laptop with tables in a calm office" },
    { id: "data", text: C("Аз рақамҳо хулоса мебарорӣ ва график месозӣ", "Делаешь выводы из цифр и строишь графики", "You turn numbers into charts and conclusions"), traits: ["numbers", "tech"], c: { c2: 2 }, kw: ["омор", "иқтисоди", "кибернетикаи", "информатикаи"],
        scene: "a young data analyst presenting colorful charts and graphs on a big screen to colleagues" },
    { id: "startup", text: C("Барномаи мобилии худро ба фурӯш мебарорӣ", "Выводишь своё мобильное приложение на рынок", "You launch your own mobile app"), traits: ["tech", "leading", "risk"], c: { c2: 2 }, kw: ["бизнес", "менеҷменти", "тиҷорат", "иқтисоди"],
        scene: "a young startup founder holding a phone with a colorful app, team celebrating behind in a small modern office" },
    { id: "restaurant", text: C("Тарабхонаи худро мекушоӣ", "Открываешь свой ресторан", "You open your own restaurant"), traits: ["leading", "people"], c: { c2: 2 }, kw: ["тарабхона", "хизматрасонии", "меҳмонхона"],
        scene: "a young restaurant owner standing proudly in a cozy restaurant with guests at tables and warm lights" },
    { id: "hr", text: C("Барои ширкат кормандони беҳтаринро интихоб мекунӣ", "Подбираешь лучших сотрудников для компании", "You pick the best staff for a company"), traits: ["people", "office"], c: { c2: 1, c4: 1 }, kw: ["ҳайати", "менеҷмент", "идоракунии"],
        scene: "a young HR manager interviewing a smiling candidate across a table in a bright office" },
    { id: "trade", text: C("Мол мехарӣ ва дар бозор мефурӯшӣ", "Закупаешь товар и продаёшь на рынке", "You buy goods and sell them at the market"), traits: ["numbers", "people", "risk"], c: { c2: 2 }, kw: ["тиҷорат", "молшиносӣ", "савдо"],
        scene: "a young trader at a colorful bazaar stall with fruits and fabrics talking with customers" },
    // c3 — филология, педагогика, санъат
    { id: "music", text: C("Дар саҳна суруд мехонӣ ё асбоб менавозӣ", "Поёшь или играешь на сцене", "You sing or play music on stage"), traits: ["creative", "people"], c: { c3: 2 }, kw: ["мусиқ", "сурудхонӣ", "санъати"],
        scene: "a young musician playing a traditional Tajik rubab on a stage with warm spotlights and an audience" },
    { id: "actor", text: C("Дар театр ё кино нақш мебозӣ", "Играешь роли в театре или кино", "You act in theatre or film"), traits: ["creative", "people", "active"], c: { c3: 2 }, kw: ["актёр", "режиссура", "театр"],
        scene: "a young actor performing dramatically on a theatre stage with red curtains and spotlights" },
    { id: "film", text: C("Филм мегирӣ ва монтаж мекунӣ", "Снимаешь и монтируешь фильмы", "You shoot and edit films"), traits: ["creative", "tech"], c: { c3: 2 }, kw: ["телеоператор", "режиссура", "кино"],
        scene: "a young filmmaker holding a cinema camera on a film set with lights, and an editing timeline on a laptop" },
    { id: "dance", text: C("Рақсҳои миллиро ба саҳна мегузорӣ", "Ставишь национальные танцы на сцене", "You stage national dances"), traits: ["creative", "active"], c: { c3: 2 }, kw: ["хореограф", "санъати"],
        scene: "a young choreographer leading dancers in colorful Tajik national dresses on a stage" },
    { id: "fashion", text: C("Либоси нав тарҳрезӣ мекунӣ", "Придумываешь новую одежду", "You design new clothes"), traits: ["creative"], c: { c3: 2 }, kw: ["дизайни", "костюм", "дӯзандагӣ", "бофандагии"],
        scene: "a young fashion designer pinning fabric on a mannequin, sketches and colorful atlas silk around" },
    { id: "interior", text: C("Ҳуҷраро зебо ва бароҳат ороиш медиҳӣ", "Делаешь комнату красивой и уютной", "You make rooms beautiful and cosy"), traits: ["creative"], c: { c3: 2 }, kw: ["дизайни", "дохили", "мебел"],
        scene: "a young interior designer holding color samples in a stylish bright living room with plants" },
    { id: "library", text: C("Китобҳои қадимаро меомӯзӣ ва нигоҳ медорӣ", "Изучаешь и хранишь старинные книги", "You study and preserve ancient books"), traits: ["words", "office"], c: { c3: 1, c4: 1 }, kw: ["китобхона", "мероси", "бойгон"],
        scene: "a young librarian carefully holding an old illuminated manuscript in a quiet library with tall shelves" },
    { id: "logoped", text: C("Ба кӯдак кӯмак мекунӣ, ки дуруст гап занад", "Помогаешь ребёнку правильно говорить", "You help a child learn to speak clearly"), traits: ["helping", "words", "people"], c: { c3: 2 }, kw: ["логопедия", "дефектология", "сурдопедагогика"],
        scene: "a young speech therapist smiling and practising sounds with a small child using picture cards" },
    { id: "blog", text: C("Барои ҳазорон нафар видео ва блог месозӣ", "Снимаешь видео и ведёшь блог для тысяч людей", "You make videos and a blog for thousands"), traits: ["creative", "words", "tech"], c: { c3: 2 }, kw: ["рӯзноманигор", "иттилоот", "web"],
        scene: "a young blogger recording a video with a ring light and a phone on a tripod in a cozy room" },
    { id: "pottery", text: C("Аз гил кӯза ва зарф месозӣ", "Лепишь кувшины и посуду из глины", "You make pots and bowls from clay"), traits: ["creative", "active"], c: { c3: 2 }, kw: ["сафоли", "ҳунарҳои", "бадеӣ"],
        scene: "a young potter shaping a clay pot on a pottery wheel, decorated ceramics on shelves" },
    { id: "painter", text: C("Девори калонро бо расм оро медиҳӣ", "Расписываешь большую стену", "You paint a big wall mural"), traits: ["creative", "active"], c: { c3: 2 }, kw: ["наққошӣ", "ҳайкал", "манзаранависии", "санъати"],
        scene: "a young artist on a ladder painting a colorful mural of mountains and flowers on a big wall" },
    { id: "languages", text: C("Забони хитоӣ ё кореягиро меомӯзӣ", "Учишь китайский или корейский язык", "You learn Chinese or Korean"), traits: ["words"], c: { c3: 2 }, kw: ["забони", "филология", "лингвистика"],
        scene: "a young student writing Chinese characters with a brush, language books and a globe on the desk" },
    // c4 — ҷомеашиносӣ, ҳуқуқ
    { id: "detective", text: C("Ҷиноятро тафтиш мекунӣ ва гунаҳкорро меёбӣ", "Расследуешь преступление и находишь виновного", "You investigate a crime and find the culprit"), traits: ["risk", "active", "leading"], c: { c4: 2 }, kw: ["санҷиши", "прокурор", "муфаттиш"],
        scene: "a young detective examining clues with a magnifying glass at a board with photos and red strings" },
    { id: "diplomat", text: C("Тоҷикистонро дар кишвари дигар намояндагӣ мекунӣ", "Представляешь Таджикистан в другой стране", "You represent Tajikistan abroad"), traits: ["people", "words", "leading"], c: { c4: 2 }, kw: ["дипломатия", "муносибатҳои", "консулӣ", "байналмилалӣ"],
        scene: "a young diplomat shaking hands at an international meeting with flags in the background (no text)" },
    { id: "history", text: C("Таърихи қадимаро аз рӯи ҳуҷҷатҳо меомӯзӣ", "Изучаешь древнюю историю по документам", "You study ancient history from documents"), traits: ["words", "office"], c: { c4: 2 }, kw: ["таърих", "сарчашмашиносӣ", "бойгон"],
        scene: "a young historian studying old maps and scrolls with ancient ruins of a Silk Road city in the background" },
    { id: "politics", text: C("Дар бораи қонуни нав баҳс мекунӣ", "Обсуждаешь новый закон", "You debate a new law"), traits: ["leading", "words", "people"], c: { c4: 2 }, kw: ["сиёсат", "идораи", "ҳуқуқ"],
        scene: "young people debating around a round table in a modern parliament hall" },
    { id: "contract", text: C("Барои одамон шартнома ва ҳуҷҷати ҳуқуқӣ тартиб медиҳӣ", "Составляешь договоры и юридические документы", "You draw up contracts and legal papers"), traits: ["words", "office"], c: { c4: 2 }, kw: ["ҳуқуқ", "таъмини", "танзими"],
        scene: "a young lawyer explaining a contract to a couple at a desk with scales of justice figurine" },
    { id: "family", text: C("Ба оилаҳо дар оштӣ шудан кӯмак мекунӣ", "Помогаешь семьям помириться", "You help families make peace"), traits: ["people", "helping"], c: { c4: 2 }, kw: ["психология", "равоншиносии"],
        scene: "a young family psychologist talking warmly with a family on a sofa in a calm room" },
    { id: "survey", text: C("Пурсиш мегузаронӣ, ки одамон чӣ фикр доранд", "Проводишь опросы о мнении людей", "You run surveys on what people think"), traits: ["people", "numbers"], c: { c4: 2 }, kw: ["сотсиология", "психологияи"],
        scene: "a young sociologist with a tablet interviewing people in a busy city park" },
    { id: "cybercop", text: C("Ҷинояткорони интернетиро меҷӯӣ", "Ловишь интернет-преступников", "You track down online criminals"), traits: ["tech", "risk"], c: { c4: 2 }, kw: ["киберҷинояткорӣ", "ҳуқуқи", "иттилоот"],
        scene: "a young cyber police officer tracking a glowing digital map of connections on large screens" },
    { id: "museum", text: C("Дар осорхона ёдгориҳои таърихиро нигоҳ медорӣ", "Хранишь исторические реликвии в музее", "You look after relics in a museum"), traits: ["words", "office"], c: { c4: 1, c3: 1 }, kw: ["осорхона", "таърих", "фарҳанг"],
        scene: "a young museum curator placing an ancient golden artifact in a glass case in a museum hall" },
    { id: "intlaw", text: C("Ба ширкатҳо дар шартномаҳои байналмилалӣ маслиҳат медиҳӣ", "Консультируешь компании по международным договорам", "You advise companies on international deals"), traits: ["words", "people", "office"], c: { c4: 2 }, kw: ["ҳуқуқи", "байналмилалии", "тиҷоратӣ"],
        scene: "a young international lawyer in a video call with partners from several countries in a glass office" },
    { id: "philosophy", text: C("Дар бораи адолат ва маънои ҳаёт фикр мекунӣ", "Размышляешь о справедливости и смысле жизни", "You think about justice and the meaning of life"), traits: ["words", "office"], c: { c4: 2 }, kw: ["фалсафа", "диншиносӣ", "фарҳангшиносӣ"],
        scene: "a young philosopher reading under a tree with old books, a thoughtful calm mood at golden hour" },
    { id: "pr", text: C("Хабарҳои ташкилотро ба мардум мерасонӣ", "Рассказываешь людям новости организации", "You share an organisation's news with the public"), traits: ["people", "words"], c: { c4: 2 }, kw: ["робита", "сиёсат", "иттилоотӣ"],
        scene: "a young press officer speaking at a press conference with microphones and cameras" },
    { id: "rights", text: C("Аз ҳуқуқи кӯдакон ва занон дифоъ мекунӣ", "Защищаешь права детей и женщин", "You defend the rights of children and women"), traits: ["helping", "people", "leading"], c: { c4: 2 }, kw: ["ҳуқуқ", "таъмини", "иҷтимоӣ"],
        scene: "a young human rights advocate speaking with mothers and children in a community center" },
    { id: "mayor", text: C("Ноҳия ё шаҳрро идора мекунӣ", "Управляешь районом или городом", "You run a district or a city"), traits: ["leading", "people", "office"], c: { c4: 1, c2: 1 }, kw: ["идораи", "давлатӣ", "мақомоти", "ташкили"],
        scene: "a young city manager looking at a city plan on a table with a view of a growing city through the window" },
    { id: "debate", text: C("Дар мусобиқаи мубоҳиса ғолиб меоӣ", "Побеждаешь в дебатах", "You win a debate competition"), traits: ["words", "leading"], c: { c4: 2 }, kw: ["ҳуқуқ", "сиёсатшиносӣ", "минтақашиносии"],
        scene: "a confident young debater at a podium gesturing while judges and an audience watch" },
    // c5 — тиб, биология, варзиш
    { id: "surgeon", text: C("Ҷарроҳӣ мекунӣ ва ҳаёт наҷот медиҳӣ", "Оперируешь и спасаешь жизни", "You perform surgery and save lives"), traits: ["helping", "risk", "active"], c: { c5: 2 }, kw: ["табобат", "тибб", "педиатрия"],
        scene: "a young surgeon in scrubs and mask in a bright operating room with a team" },
    { id: "dentist", text: C("Дандонҳои одамонро табобат мекунӣ", "Лечишь людям зубы", "You treat people's teeth"), traits: ["helping", "people"], c: { c5: 2 }, kw: ["стоматология", "дандон"],
        scene: "a young dentist smiling at a patient in a dental chair in a clean modern clinic" },
    { id: "pharma", text: C("Доруҳои нав месозӣ", "Создаёшь новые лекарства", "You create new medicines"), traits: ["nature", "office"], c: { c5: 2 }, kw: ["фарматсия", "дору", "фармасевт"],
        scene: "a young pharmacist scientist holding a capsule in a bright lab with colorful pills and flasks" },
    { id: "kidsdoc", text: C("Кӯдакони беморро табобат мекунӣ", "Лечишь заболевших детей", "You treat sick children"), traits: ["helping", "people"], c: { c5: 2 }, kw: ["педиатрия", "тибб"],
        scene: "a young pediatrician listening to a smiling child's heartbeat with a stethoscope, toys around" },
    { id: "ambulance", text: C("Бо мошини ёрии таъҷилӣ ба беморон мерасӣ", "Спешишь к больным на скорой помощи", "You rush to patients in an ambulance"), traits: ["helping", "risk", "active"], c: { c5: 2 }, kw: ["ҳамширагӣ", "тибб", "табобат"],
        scene: "a young paramedic jumping out of an ambulance with a medical bag on a city street" },
    { id: "eco", text: C("Дарёҳо ва ҷангалҳоро аз ифлосшавӣ ҳифз мекунӣ", "Защищаешь реки и леса от загрязнения", "You protect rivers and forests from pollution"), traits: ["nature", "helping"], c: { c5: 2 }, kw: ["экология", "ҳифзи", "муҳити"],
        scene: "a young ecologist taking a water sample from a clear mountain river, green forest around" },
    { id: "bees", text: C("Занбӯри асал ва боғ парвариш мекунӣ", "Разводишь пчёл и ухаживаешь за садом", "You keep bees and tend an orchard"), traits: ["nature", "active"], c: { c5: 2 }, kw: ["занбӯри", "меваю", "боғ"],
        scene: "a young beekeeper in a protective hat holding a honeycomb frame in a blooming orchard" },
    { id: "chemistry", text: C("Дар лаборатория моддаҳои нав омехта мекунӣ", "Смешиваешь новые вещества в лаборатории", "You mix new substances in a lab"), traits: ["nature", "risk"], c: { c5: 2 }, kw: ["химия", "биохимия", "фарматсевт"],
        scene: "a young chemist in goggles pouring a colorful glowing liquid between flasks in a lab" },
    { id: "seeds", text: C("Тухмии гандуми беҳтар месозӣ", "Выводишь сорта пшеницы получше", "You breed better wheat"), traits: ["nature", "office"], c: { c5: 2 }, kw: ["селексия", "биотехнология", "агроном"],
        scene: "a young agricultural scientist examining wheat sprouts in a greenhouse with labelled trays (no text)" },
    { id: "fitness", text: C("Одамонро бо варзиш солим мекунӣ", "Делаешь людей здоровее с помощью спорта", "You help people get healthy through sport"), traits: ["active", "helping", "people"], c: { c5: 2 }, kw: ["тарбияи", "варзиш"],
        scene: "a young fitness coach leading an energetic outdoor workout class in a park" },
    { id: "livestock", text: C("Дар ферма гову гӯсфандонро нигоҳубин мекунӣ", "Ухаживаешь за коровами и овцами на ферме", "You look after cows and sheep on a farm"), traits: ["nature", "active"], c: { c5: 2 }, kw: ["зоотехния", "байтор", "паррандапарварӣ"],
        scene: "a young farmer feeding sheep and cows on a green mountain pasture with a farmhouse" },
    { id: "midwife", text: C("Ба модарон дар таваллуди кӯдак кӯмак мекунӣ", "Помогаешь мамам при рождении ребёнка", "You help mothers give birth"), traits: ["helping", "people", "risk"], c: { c5: 2 }, kw: ["момодоягӣ", "ҳамширагӣ"],
        scene: "a young midwife gently holding a newborn baby wrapped in a blanket next to a happy mother in a hospital" },
    { id: "forest", text: C("Ҷангал мекорӣ ва дарахтонро нигоҳ медорӣ", "Сажаешь лес и ухаживаешь за деревьями", "You plant forests and care for trees"), traits: ["nature", "active"], c: { c5: 2 }, kw: ["ҷангал", "дендрология", "бунёди"],
        scene: "a young forester planting a sapling on a hillside with rows of young trees and mountains" },
];

// Натиҷа: хусусиятҳо (❤️ +1, ✖️ −1) ва самтҳо (танҳо аз ❤️).
export function swipeResult(choices, cards = SWIPE_CARDS) {
    const traits = Object.fromEntries(Object.keys(TRAITS).map((k) => [k, 0]));
    const clusters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
    for (const card of cards) {
        const choice = choices[card.id];
        if (choice === undefined) continue;
        for (const trait of card.traits) traits[trait] += choice ? 1 : -1;
        if (choice) for (const [key, weight] of Object.entries(card.c)) clusters[key] += weight;
    }
    const ranked = Object.entries(traits).sort((a, b) => b[1] - a[1]);
    const likes = ranked.filter(([, v]) => v > 0).slice(0, 3).map(([k]) => k);
    const dislikes = ranked.filter(([, v]) => v < 0).reverse().slice(0, 2).map(([k]) => k);
    const topCluster = Object.entries(clusters).sort((a, b) => b[1] - a[1])[0];
    const liked = Object.values(choices).filter(Boolean).length;
    return { traits, likes, dislikes, clusters, topCluster: topCluster[1] > 0 ? topCluster[0] : null, liked };
}

export const DECK_SIZE = 30;
export const CARD_BY_ID = Object.fromEntries(SWIPE_CARDS.map((card) => [card.id, card]));
const mainCluster = (card) => Object.entries(card.c).sort((a, b) => b[1] - a[1])[0][0];
const shuffle = (list) => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

// Бозии нав: 30 корти нодида, аз ҳар самт баробар (6-тоӣ), бо тартиби тасодуфӣ.
// Вақте нодидаҳо намерасанд, давра аз нав сар мешавад (бе кортҳои ҳамин бозии охир).
export function nextDeck(seen = [], last = []) {
    let pool = SWIPE_CARDS.filter((card) => !seen.includes(card.id));
    let resetSeen = false;
    if (pool.length < DECK_SIZE) {
        resetSeen = true;
        const fresh = SWIPE_CARDS.filter((card) => !last.includes(card.id));
        pool = [...pool, ...shuffle(fresh.filter((card) => !pool.includes(card)))];
    }
    const byCluster = { c1: [], c2: [], c3: [], c4: [], c5: [] };
    shuffle(pool).forEach((card) => byCluster[mainCluster(card)].push(card));
    const deck = [];
    const per = Math.floor(DECK_SIZE / 5);
    Object.values(byCluster).forEach((list) => deck.push(...list.splice(0, per)));
    const rest = shuffle(Object.values(byCluster).flat());
    while (deck.length < DECK_SIZE && rest.length) deck.push(rest.shift());
    return { ids: shuffle(deck).map((card) => card.id), resetSeen };
}

// Аввали калима дар номи ихтисос (ҳарфҳои тоҷикӣ ба шакли оддӣ — мисли сервер).
const fold = (value) => String(value || "").toLowerCase().replace(/[ғӣқӯҳҷё]/g, (ch) => ({ ғ: "г", ӣ: "и", қ: "к", ӯ: "у", ҳ: "х", ҷ: "ч", ё: "е" })[ch]);
export const nameHas = (name, stem) => new RegExp(`(^|[^а-яёa-z])${fold(stem).replace(/[^а-яёa-z0-9]/g, "")}`).test(fold(name));

// Калимаҳои калидӣ аз суратҳои маъқул: ҳар калима — бо вазн (чанд сурат онро дорад).
export function likedKeywords(choices, cards) {
    const weights = {};
    cards.filter((card) => choices[card.id] && card.kw).forEach((card) => {
        card.kw.forEach((stem) => { weights[stem] = (weights[stem] || 0) + 1; });
    });
    return weights;
}
