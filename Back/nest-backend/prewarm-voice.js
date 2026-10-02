// Ҳамаи ҷумлаҳои собити ёварро пешакӣ ба садо табдил медиҳад,
// то дар намоиш ҳама чиз аз кеш ояд. Пеш аз демо як бор иҷро кунед:
//   node prewarm-voice.js
//
// Агар суръат ё модели овозро иваз кунед, кеш кӯҳна мешавад —
// voice-cache/-ро тоза кунед ва ин скриптро аз нав иҷро кунед.
const API = process.env.VOICE_API || 'http://localhost:3005/api';

const PHRASES = [
    // Саломи аввал — бояд бо матни VoiceAssistant.jsx ҳарф ба ҳарф мувофиқ бошад.
    'Хуш омадед! Ман ёвари шумо ҳастам. Чӣ кор кунем — ихтисос интихоб кунем, донишгоҳҳоро бинем, ё санҷиш гузарем?',

    // Ҷавобҳои собит (career.service.ts → ASSISTANT_REPLIES.tj).
    'Ана ин ихтисосҳо.',
    'Кушодам.',
    'Муқоиса мекунам, каме интизор шавед.',
    'Фаҳмидам: баъди синфи 9. Акнун танҳо коллеҷҳо ва ихтисосҳои онҳоро нишон медиҳам.',
    'Фаҳмидам: баъди синфи 11. Коллеҷҳо ва донишгоҳҳо ҳарду нишон дода мешаванд.',
    'Захира шуд.',
    'Санҷишро сар мекунам.',
    'Ана донишгоҳҳо.',
    'Ҳисоботи шуморо кушодам.',
    'Ана нақшаи ҳуҷҷатсупорӣ.',
    'Донишгоҳҳои наздиктаринро меҷӯям.',
    'Ана ин кластер.',
    'Чатро кушодам.',
    'Ана захираҳои шумо.',
    'Дар бораи мо.',
    'Ба саҳифаи асосӣ.',
    'Забон иваз шуд.',
    'Мавзӯъ иваз шуд.',

    // Ҷавобҳои хатогӣ.
    'Мебахшед, ҳозир ҷавоб дода наметавонам. Бори дигар бигӯед.',
    'Мебахшед, нафаҳмидам. Бори дигар бигӯед.',
];

// Ибораҳои русии ёвар (career.service.ts → ASSISTANT_REPLIES.ru + салом).
// Танҳо вақте садо мегиранд, ки модели русӣ дар voice-model-rus/ бошад.
const PHRASES_RU = [
    'Добро пожаловать! Я ваш помощник. Чем займёмся — выберем специальность, посмотрим университеты или пройдём тест?',
    'Вот эти специальности.', 'Открыл.', 'Сравниваю, подождите немного.',
    'Понял: после 9 класса. Теперь показываю только колледжи и их специальности.',
    'Понял: после 11 класса. Показываю и колледжи, и вузы.', 'Сохранено.', 'Начинаю тест.',
    'Вот университеты.', 'Открыл ваш отчёт.', 'Вот план подачи документов.', 'Ищу ближайшие университеты.',
    'Вот этот кластер.', 'Открыл чат.', 'Вот ваши сохранённые.', 'О нас.', 'На главную.',
    'Язык изменён.', 'Тема изменена.',
    'Извините, сейчас не могу ответить. Повторите, пожалуйста.',
];

// Ибораҳои англисии ёвар (ASSISTANT_REPLIES.en + салом) — модели voice-model-eng/.
const PHRASES_EN = [
    'Hello! Welcome. I am your assistant. What shall we do: choose a specialty, look at universities, or take the test?',
    'Here are the specialties.', 'Opened.', 'Comparing them now, one moment.',
    'Got it: after grade 9. Now I show only colleges and their specialties.',
    'Got it: after grade 11. I show both colleges and universities.', 'Saved.', 'Starting the test.',
    'Here are the universities.', 'I opened your report.', 'Here is the application plan.', 'Looking for the nearest universities.',
    'Here is that cluster.', 'Chat opened.', 'Here are your saved items.', 'About us.', 'Going home.',
    'Language changed.', 'Theme changed.',
    'Sorry, I cannot answer right now. Please say it again.',
];

async function warm(text, lang = 'tj') {
    const started = Date.now();
    const response = await fetch(`${API}/voice/speak?text=${encodeURIComponent(text)}&lang=${lang}`);
    if (!response.ok) return { ok: false, status: response.status };
    await response.arrayBuffer();
    return {
        ok: true,
        source: response.headers.get('x-voice-source'),
        seconds: ((Date.now() - started) / 1000).toFixed(2),
    };
}

(async () => {
    // Муаррифии саҳифаҳо — аз худи frontend, то матн ҳамеша якхела бошад.
    let split = (text) => [text];
    try {
        const guideUrl = require('url').pathToFileURL(
            require('path').join(__dirname, '../../Front/src/components/voice/pageGuide.js'),
        ).href;
        const { allGuideTexts, splitForSpeech } = await import(guideUrl);
        PHRASES.push(...allGuideTexts());
        PHRASES_RU.push(...allGuideTexts('ru'));
        PHRASES_EN.push(...allGuideTexts('en'));
        split = splitForSpeech;
    } catch (error) {
        console.log('муаррифиҳо хонда нашуданд:', String(error).slice(0, 120));
    }

    // Шарҳи панҷ кластер низ садо мегирад — онҳо аз база меоянд.
    for (let number = 1; number <= 6; number += 1) {
        try {
            const response = await fetch(`${API}/careers/assistant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Рақами 6 — «духтур шудан мехоҳам»: рӯйхати самтҳо собит аст.
            body: JSON.stringify({ message: number <= 5 ? `кластери ${number}` : 'духтур шудан мехоҳам', lang: 'tj' }),
            });
            const data = await response.json();
            if (data?.reply) PHRASES.push(data.reply);
        } catch {
            /* кластерро гузаронида мегузарем */
        }
    }

    let fresh = 0;
    let cached = 0;

    // Ёвар матнро ҷумла-ҷумла мегӯяд, пас кеш ҳам бояд ҷумла-ҷумла бошад.
    const pieces = [...new Set(PHRASES.flatMap((text) => split(text)))];
    for (const text of pieces) {
        const result = await warm(text);
        if (!result.ok) {
            console.log(`НЕ   ${result.status}  ${text.slice(0, 50)}`);
            continue;
        }
        if (result.source === 'model') fresh += 1; else cached += 1;
        console.log(`OK  ${result.source.padEnd(6)} ${result.seconds}s  ${text.slice(0, 50)}`);
    }

    console.log(`\nНав сохта шуд: ${fresh}   Аллакай дар кеш: ${cached}   Ҳамагӣ: ${pieces.length}`);

    // Русӣ ва англисӣ: агар модел набошад, сервер 503 медиҳад — як бор хабар дода мегузарем.
    const status = await (await fetch(`${API}/voice/status`)).json().catch(() => ({}));
    for (const [lang, phrases, label] of [['ru', PHRASES_RU, 'Русӣ'], ['en', PHRASES_EN, 'Англисӣ']]) {
        if (!(status.languages || []).includes(lang)) {
            console.log(`
${label}: модел нест (voice-model-${lang === 'ru' ? 'rus' : 'eng'}/) — гузаронида шуд.`);
            continue;
        }
        const list = [...new Set(phrases.flatMap((text) => split(text)))];
        let made = 0;
        for (const text of list) {
            const result = await warm(text, lang);
            if (!result.ok) {
                console.log(`НЕ   ${result.status}  ${text.slice(0, 50)}`);
                continue;
            }
            if (result.source === 'model') made += 1;
            console.log(`${lang.toUpperCase()}  ${String(result.source).padEnd(6)} ${result.seconds}s  ${text.slice(0, 50)}`);
        }
        console.log(`${label}: нав ${made}, ҳамагӣ ${list.length}`);
    }
})();
