// Ҳамаи ҷумлаҳои собити ёварро пешакӣ ба садо табдил медиҳад,
// то дар намоиш ҳама чиз аз кеш ояд. Пеш аз демо як бор иҷро кунед:
//   node prewarm-voice.js
const API = process.env.VOICE_API || 'http://localhost:3005/api';

const PHRASES = [
    // Саломи аввал — бояд бо матни VoiceAssistant.jsx ҳарф ба ҳарф мувофиқ бошад.
    'Хуш омадед! Ман ёвари шумо ҳастам. Чӣ кор кунем — ихтисос интихоб кунем, донишгоҳҳоро бинем, ё санҷиш гузарем?',

    // Ҷавобҳои собит барои ҳар амал.
    'Ана ин ихтисосҳо.',
    'Кушодам.',
    'Муқоиса тайёр аст.',
    'Захира шуд.',
    'Санҷишро сар мекунам.',
    'Ана донишгоҳҳо.',
    'Ҳисоботи шуморо кушодам.',
    'Ана нақшаи ҳуҷҷатсупорӣ.',

    // Ҷавобҳои хатогӣ.
    'Мебахшед, ҳозир ҷавоб дода наметавонам. Бори дигар бигӯед.',
    'Мебахшед, нафаҳмидам. Бори дигар бигӯед.',
];

(async () => {
    let warmed = 0;
    let already = 0;

    for (const text of PHRASES) {
        const started = Date.now();
        try {
            const response = await fetch(`${API}/voice/speak?text=${encodeURIComponent(text)}`);
            if (!response.ok) {
                console.log(`НЕ  ${response.status}  ${text.slice(0, 45)}`);
                continue;
            }
            const cache = response.headers.get('x-voice-cache');
            const bytes = (await response.arrayBuffer()).byteLength;
            const seconds = ((Date.now() - started) / 1000).toFixed(2);
            if (cache === 'hit') already += 1; else warmed += 1;
            console.log(`OK  ${cache === 'hit' ? 'кеш' : 'нав'}  ${seconds}s  ${(bytes / 1024).toFixed(0)}KB  ${text.slice(0, 45)}`);
        } catch (error) {
            console.log(`ХАТО  ${text.slice(0, 45)}  ${error}`);
        }
    }

    console.log(`\nНав сохта шуд: ${warmed}   Аллакай дар кеш: ${already}`);
})();
