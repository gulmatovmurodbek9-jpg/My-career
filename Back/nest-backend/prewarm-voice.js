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
    'Муқоиса тайёр аст.',
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

async function warm(text) {
    const started = Date.now();
    const response = await fetch(`${API}/voice/speak?text=${encodeURIComponent(text)}`);
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
    try {
        const guideUrl = require('url').pathToFileURL(
            require('path').join(__dirname, '../../Front/src/components/voice/pageGuide.js'),
        ).href;
        const { allGuideTexts } = await import(guideUrl);
        PHRASES.push(...allGuideTexts());
    } catch (error) {
        console.log('муаррифиҳо хонда нашуданд:', String(error).slice(0, 120));
    }

    // Шарҳи панҷ кластер низ садо мегирад — онҳо аз база меоянд.
    for (let number = 1; number <= 5; number += 1) {
        try {
            const response = await fetch(`${API}/careers/assistant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `кластери ${number}`, lang: 'tj' }),
            });
            const data = await response.json();
            if (data?.reply) PHRASES.push(data.reply);
        } catch {
            /* кластерро гузаронида мегузарем */
        }
    }

    let fresh = 0;
    let cached = 0;

    for (const text of PHRASES) {
        const result = await warm(text);
        if (!result.ok) {
            console.log(`НЕ   ${result.status}  ${text.slice(0, 50)}`);
            continue;
        }
        if (result.source === 'model') fresh += 1; else cached += 1;
        console.log(`OK  ${result.source.padEnd(6)} ${result.seconds}s  ${text.slice(0, 50)}`);
    }

    console.log(`\nНав сохта шуд: ${fresh}   Аллакай дар кеш: ${cached}   Ҳамагӣ: ${PHRASES.length}`);
})();
