// Видеоҳои омӯзишӣ: файлҳо дар сервер — /videos/<id>-<lang>.mp4 (видео/скрипти video/ месозад).
export const HELP_VIDEOS = [
    { id: "00", title: { tj: "«Ихтисоси ман» дар 1 дақиқа", ru: "«Ихтисоси ман» за 1 минуту", en: "“Ikhtisosi man” in 1 minute" } },
    { id: "01", title: { tj: "Саҳифаи асосӣ", ru: "Главная страница", en: "Home page" } },
    { id: "02", title: { tj: "Тести касбинтихобкунӣ", ru: "Тест профориентации", en: "Career test" } },
    { id: "03", title: { tj: "Натиҷаи тест", ru: "Результат теста", en: "Test result" } },
    { id: "04", title: { tj: "Ихтисосҳо ва ҷустуҷӯ", ru: "Специальности и поиск", en: "Specialties and search" } },
    { id: "05", title: { tj: "Саҳифаи ихтисос", ru: "Страница специальности", en: "Specialty page" } },
    { id: "06", title: { tj: "«Худро дар касб санҷед»", ru: "«Попробуйте себя в профессии»", en: "“Try yourself in a career”" } },
    { id: "07", title: { tj: "Донишгоҳҳо", ru: "Вузы", en: "Universities" } },
    { id: "08", title: { tj: "Ёвари овозӣ", ru: "Голосовой помощник", en: "Voice assistant" } },
    { id: "09", title: { tj: "Бақайдгирӣ ва ворид шудан", ru: "Регистрация и вход", en: "Sign up and sign in" } },
    { id: "10", title: { tj: "Панели шахсӣ", ru: "Личный кабинет", en: "Dashboard" } },
    { id: "11", title: { tj: "Маслиҳатчии AI", ru: "AI-консультант", en: "AI advisor" } },
    { id: "12", title: { tj: "Муқоисаи ихтисосҳо", ru: "Сравнение специальностей", en: "Compare specialties" } },
    { id: "13", title: { tj: "Нақшаи ҳуҷҷатсупорӣ", ru: "План подачи документов", en: "Application plan" } },
    { id: "14", title: { tj: "Захирашудаҳо", ru: "Сохранённые", en: "Saved" } },
    { id: "15", title: { tj: "Ҳамроҳ шудан ба синф", ru: "Вступление в класс", en: "Join a class" } },
    { id: "16", title: { tj: "Ҳуҷраи омӯзгор", ru: "Кабинет учителя", en: "Teacher room" } },
];

// Кадом видео ба кадом саҳифа (аввалин мувофиқ).
const ROUTES = [
    [/^\/$/, "01"],
    [/^\/quiz/, "02"],
    [/^\/careers/, "04"],
    [/^\/info\//, "05"],
    [/^\/trial/, "06"],
    [/^\/universities/, "07"],
    [/^\/(register|login|forgot-password)/, "09"],
    [/^\/dashboard\/?$/, "10"],
    [/^\/dashboard\/ai-chat/, "11"],
    [/^\/dashboard\/compare/, "12"],
    [/^\/dashboard\/plan/, "13"],
    [/^\/favorites/, "14"],
    [/^\/class/, "15"],
    [/^\/dashboard\/teacher/, "16"],
];

export const videoForPath = (pathname) => ROUTES.find(([pattern]) => pattern.test(pathname))?.[1] || null;
// Дар компютер (localhost) файлҳои видео нестанд — аз сервер бор мешаванд.
const VIDEO_BASE = import.meta.env.VITE_VIDEO_BASE
    || (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? "https://ikhtisosiman.qobus.tj" : "");
export const videoSrc = (id, lang) => `${VIDEO_BASE}/videos/${id}-${lang}.mp4`;
export const videoPoster = (id, lang) => `${VIDEO_BASE}/videos/${id}-${lang}.jpg`;

export const HELP_TEXT = {
    tj: { button: "Чӣ тавр кор мекунад?", title: "Видеоҳои омӯзишӣ", intro: "Барои ҳар саҳифаи сайт видеои кӯтоҳ: чӣ кор мекунад ва чӣ тавр истифода бурдан мумкин аст.", close: "Пӯшидан", all: "Ҳамаи видеоҳо", watch: "Тамошо" },
    ru: { button: "Как это работает?", title: "Обучающие видео", intro: "Короткое видео для каждой страницы сайта: что она делает и как ею пользоваться.", close: "Закрыть", all: "Все видео", watch: "Смотреть" },
    en: { button: "How does it work?", title: "Tutorial videos", intro: "A short video for every page of the site: what it does and how to use it.", close: "Close", all: "All videos", watch: "Watch" },
};
