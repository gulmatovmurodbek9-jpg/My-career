// «Касб-свайп»: 30 лаҳзаи воқеии кор. Ҳар корт — сурат (public/swipe/<id>.webp, бо
// Back/nest-backend/scripts/generate-swipe-images.mjs сохта мешавад), матн дар 3 забон,
// хусусиятҳо (traits) ва самтҳои ММТ (c1 техникӣ, c2 иқтисод ва география, c3 филология,
// педагогика ва санъат, c4 ҷомеашиносӣ ва ҳуқуқ, c5 тиб, биология ва варзиш).
// `scene` — тавсифи сурат барои модели тасвирсоз (англисӣ).

export const TRAITS = {
    people: { icon: "🤝", tj: "Кор бо одамон", ru: "Работа с людьми", en: "Working with people" },
    tech: { icon: "💻", tj: "Техника ва компютер", ru: "Техника и компьютер", en: "Tech and computers" },
    nature: { icon: "🌿", tj: "Табиат ва ҳаёт", ru: "Природа и живое", en: "Nature and living things" },
    numbers: { icon: "🔢", tj: "Рақам ва ҳисоб", ru: "Числа и расчёты", en: "Numbers and calculations" },
    creative: { icon: "🎨", tj: "Эҷодкорӣ", ru: "Творчество", en: "Creativity" },
    active: { icon: "🏃", tj: "Ҳаракат ва кори дастӣ", ru: "Движение и работа руками", en: "Movement and hands-on work" },
    office: { icon: "🏢", tj: "Кори ором дар идора", ru: "Спокойная работа в офисе", en: "Calm office work" },
    risk: { icon: "⚡", tj: "Таваккал ва ҳолатҳои тез", ru: "Риск и быстрые решения", en: "Risk and quick decisions" },
    helping: { icon: "❤️", tj: "Кӯмак ба дигарон", ru: "Помощь другим", en: "Helping others" },
    leading: { icon: "👑", tj: "Роҳбарӣ ва қарор", ru: "Лидерство и решения", en: "Leading and deciding" },
    words: { icon: "📖", tj: "Забон ва калима", ru: "Язык и слова", en: "Language and words" },
};

const C = (tj, ru, en) => ({ tj, ru, en });

export const SWIPE_CARDS = [
    { id: "code", text: C("Тамоми рӯз дар компютер барнома менависӣ", "Весь день пишешь программы за компьютером", "You write code at a computer all day"), traits: ["tech", "office"], c: { c1: 2 },
        scene: "a teenage boy writing code on a laptop with glowing code on the screen, modern bright workspace" },
    { id: "robot", text: C("Робот месозӣ ва онро ба ҳаракат медарорӣ", "Собираешь робота и оживляешь его", "You build a robot and bring it to life"), traits: ["tech", "creative"], c: { c1: 2 },
        scene: "a teenage girl assembling a small friendly robot on a workbench with tools and wires" },
    { id: "build", text: C("Дар майдони сохтмон пул ва бино месозӣ", "Строишь мосты и здания на стройке", "You build bridges and buildings on site"), traits: ["tech", "active", "risk"], c: { c1: 2 },
        scene: "a young engineer in a hard hat holding blueprints at a construction site with a crane and a bridge" },
    { id: "electric", text: C("Симу дастгоҳҳои барқиро таъмир мекунӣ", "Чинишь провода и электроприборы", "You repair wiring and electrical devices"), traits: ["tech", "active"], c: { c1: 2 },
        scene: "a young electrician repairing an electrical panel with colorful wires and a screwdriver" },
    { id: "drone", text: C("Дрон ё ҳавопайморо идора мекунӣ", "Управляешь дроном или самолётом", "You pilot a drone or an aircraft"), traits: ["tech", "risk", "active"], c: { c1: 2 },
        scene: "a young pilot flying a drone over green mountains of Tajikistan with a remote controller" },
    { id: "accounts", text: C("Бо рақамҳо ва ҳисобу китоб кор мекунӣ", "Работаешь с цифрами и расчётами", "You work with numbers and accounts"), traits: ["numbers", "office"], c: { c2: 2 },
        scene: "a young accountant at a tidy desk with charts, a calculator and a tablet showing graphs" },
    { id: "shop", text: C("Мағоза ё тиҷорати худро мекушоӣ", "Открываешь свой магазин или бизнес", "You open your own shop or business"), traits: ["leading", "risk", "numbers"], c: { c2: 2 },
        scene: "a proud young shop owner opening a colorful small shop with an OPEN sign shape, no letters" },
    { id: "bank", text: C("Дар бонк ба мизоҷон дар бораи пул маслиҳат медиҳӣ", "Советуешь клиентам банка, как распорядиться деньгами", "You advise bank clients about money"), traits: ["people", "numbers", "office"], c: { c2: 2 },
        scene: "a young bank advisor talking with a family across a desk in a bright modern bank" },
    { id: "deal", text: C("Бо ширкатҳо гуфтушунид мекунӣ ва шартнома мебандӣ", "Ведёшь переговоры и заключаешь сделки", "You negotiate deals with companies"), traits: ["people", "leading"], c: { c2: 2 },
        scene: "two young business people shaking hands over a table in a glass office" },
    { id: "travel", text: C("Ҳар ҳафта ба шаҳри нав сафар мекунӣ", "Каждую неделю едешь в новый город", "You travel to a new city every week"), traits: ["active", "people", "risk"], c: { c2: 1, c4: 1 },
        scene: "a young traveller with a backpack and a map at a railway station with mountains in the distance" },
    { id: "write", text: C("Мақола ё китоб менависӣ", "Пишешь статьи или книги", "You write articles or books"), traits: ["words", "creative", "office"], c: { c3: 2 },
        scene: "a young writer at a wooden desk writing in a notebook surrounded by books and a cup of tea" },
    { id: "translate", text: C("Ба меҳмонони хориҷӣ тарҷумонӣ мекунӣ", "Переводишь для иностранных гостей", "You interpret for foreign guests"), traits: ["words", "people"], c: { c3: 2 },
        scene: "a young interpreter with a headset translating between people of different countries at a conference" },
    { id: "design", text: C("Расм мекашӣ ё дизайн месозӣ", "Рисуешь или создаёшь дизайн", "You draw or create designs"), traits: ["creative"], c: { c3: 2 },
        scene: "a young artist drawing on a graphics tablet with colorful sketches and paints around" },
    { id: "teach", text: C("Ба кӯдакон дарс медиҳӣ", "Ведёшь уроки у детей", "You teach a class of children"), traits: ["people", "helping", "words"], c: { c3: 2 },
        scene: "a young teacher smiling in front of a bright classroom with children raising hands" },
    { id: "kids", text: C("Бо кӯдакони хурдсол бозӣ мекунӣ ва тарбия медиҳӣ", "Играешь и занимаешься с малышами", "You play with and care for little kids"), traits: ["helping", "people", "creative"], c: { c3: 2 },
        scene: "a young kindergarten teacher playing with building blocks with small happy children" },
    { id: "news", text: C("Бо микрофон ва камера хабар тайёр мекунӣ", "Готовишь репортаж с микрофоном и камерой", "You report news with a mic and camera"), traits: ["people", "creative", "active"], c: { c3: 1, c4: 1 },
        scene: "a young journalist holding a microphone in front of a camera on a city street" },
    { id: "court", text: C("Дар суд ҳуқуқи одамонро ҳимоя мекунӣ", "Защищаешь права людей в суде", "You defend people's rights in court"), traits: ["people", "leading", "words"], c: { c4: 2 },
        scene: "a young lawyer speaking confidently in a courtroom with wooden benches" },
    { id: "speech", text: C("Дар назди садҳо нафар суханронӣ мекунӣ", "Выступаешь перед сотнями людей", "You speak in front of hundreds of people"), traits: ["people", "leading"], c: { c4: 2 },
        scene: "a young speaker on a stage with a microphone in front of a large audience" },
    { id: "psych", text: C("Ба одамон дар ҳалли мушкилоташон кӯмак мекунӣ", "Помогаешь людям справиться с трудностями", "You help people with their problems"), traits: ["people", "helping"], c: { c4: 2 },
        scene: "a young psychologist listening kindly to a person in a calm room with plants" },
    { id: "events", text: C("Чорабиниҳо ва лоиҳаҳои калон ташкил мекунӣ", "Организуешь мероприятия и большие проекты", "You organise events and big projects"), traits: ["leading", "people", "active"], c: { c4: 1, c2: 1 },
        scene: "a young event organizer with a clipboard directing a team setting up a festival stage" },
    { id: "team", text: C("Дастаро роҳбарӣ мекунӣ ва қарор қабул мекунӣ", "Руководишь командой и принимаешь решения", "You lead a team and make decisions"), traits: ["leading", "people", "office"], c: { c2: 1, c4: 1 },
        scene: "a young team leader pointing at a whiteboard while a diverse team listens in a meeting room" },
    { id: "routine", text: C("Ҳар рӯз кори аниқ ва ором дар идора", "Каждый день — чёткая спокойная работа в офисе", "Clear, calm office work every day"), traits: ["office", "numbers"], c: { c2: 1 },
        scene: "a calm young office worker organizing neat folders on a tidy desk by a window" },
    { id: "doctor", text: C("Беморонро табобат мекунӣ", "Лечишь пациентов", "You treat patients"), traits: ["helping", "people"], c: { c5: 2 },
        scene: "a young doctor with a stethoscope kindly examining an elderly patient in a clinic" },
    { id: "night", text: C("Шабона дар беморхона навбатдорӣ мекунӣ", "Дежуришь ночью в больнице", "You work night shifts at a hospital"), traits: ["helping", "risk", "active"], c: { c5: 2 },
        scene: "a young nurse walking down a hospital corridor at night with soft lights" },
    { id: "lab", text: C("Дар лаборатория бо микроскоп озмоиш мегузаронӣ", "Ставишь опыты с микроскопом в лаборатории", "You run experiments with a microscope"), traits: ["nature", "office"], c: { c5: 2 },
        scene: "a young scientist looking into a microscope in a bright laboratory with test tubes" },
    { id: "farm", text: C("Растаниҳо мепарварӣ ва ҳосил мегирӣ", "Выращиваешь растения и собираешь урожай", "You grow plants and harvest crops"), traits: ["nature", "active"], c: { c5: 2 },
        scene: "a young farmer harvesting apples in a sunny orchard with mountains behind" },
    { id: "vet", text: C("Ҳайвонотро табобат мекунӣ", "Лечишь животных", "You treat animals"), traits: ["nature", "helping"], c: { c5: 2 },
        scene: "a young veterinarian gently holding a puppy at a vet clinic" },
    { id: "coach", text: C("Варзишгаронро тамрин медиҳӣ", "Тренируешь спортсменов", "You coach athletes"), traits: ["active", "leading", "people"], c: { c5: 2 },
        scene: "a young sports coach with a whistle training kids on a football field" },
    { id: "explore", text: C("Дар кӯҳҳо экспедитсия мекунӣ ва харита месозӣ", "Ходишь в экспедиции в горы и составляешь карты", "You go on mountain expeditions and make maps"), traits: ["nature", "active", "risk"], c: { c2: 1, c1: 1 },
        scene: "a young geographer with a backpack and a map standing on a mountain ridge in the Pamirs" },
    { id: "chef", text: C("Таомҳои нав ихтироъ мекунӣ ва мепазӣ", "Придумываешь и готовишь новые блюда", "You invent and cook new dishes"), traits: ["creative", "active"], c: { c2: 1 },
        scene: "a young chef in a white hat plating a colorful dish in a bright kitchen" },
];

// Натиҷа: хусусиятҳо (❤️ +1, ✖️ −1) ва самтҳо (танҳо аз ❤️).
export function swipeResult(choices) {
    const traits = Object.fromEntries(Object.keys(TRAITS).map((k) => [k, 0]));
    const clusters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
    for (const card of SWIPE_CARDS) {
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
