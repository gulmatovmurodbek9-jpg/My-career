// Санҷиши объективии овози тоҷикӣ: матн → овоз (модели худамон) → ElevenLabs Scribe → матн.
// Муқоисаи калима ба калима: чанд калима гум ё хато шуд (WER), калимаи аввал/охир.
// Истифода: node voice-eval.js [old|new|both]
require('ts-node/register/transpile-only');
require('dotenv').config();
const { TajikTts } = require('./src/voice/tajik-tts.ts');
const { prepareTajikText } = require('./src/voice/tj-text.ts');
const { spellNumbers } = require('./src/voice/voice.service.ts');

const SENTENCES = [
    'Шумо AutoCAD Electrical, SCADA ва ETAP-ро меомӯзед.',
    'Маоши аввал аз 2000 то 5000 сомонӣ дар як моҳ аст.',
    'Барои барномасоз Python, JavaScript ва SQL лозим аст.',
    'Ихтисоси IT дар Донишгоҳи миллии Тоҷикистон омӯзонда мешавад.',
    'Холи гузариш дар соли 2025 ба 313 расид.',
    'Нархи таҳсил 12 300 сомонӣ дар як сол аст.',
    'Имтиҳони ММТ дар моҳи июн баргузор мешавад.',
    'Дар Тоҷикистон 884 ихтисос ва 128 донишгоҳу коллеҷ ҳаст.',
    'Салом, дӯстам! Ман ёвари овозии сайти «Ихтисоси ман» ҳастам.',
    'Кадом фанҳо дар мактаб ба шумо бештар маъқуланд?',
    'Духтур шудан шаш сол таҳсил ва сабри зиёд металабад.',
    'Барномасозӣ, тарроҳии веб ва амнияти киберӣ ихтисосҳои серталабанд.',
    'Дар Хуҷанд, Бохтар ва Кӯлоб низ донишгоҳҳои хуб ҳастанд.',
    'Агар математика ва физикаро дӯст доред, самти техникӣ ба шумо мувофиқ аст.',
    'Ҷойҳои ройгон маҳдуданд, бинобар ин барвақт тайёрӣ бинед.',
    'Ҳуқуқшинос бояд қонунҳоро хуб донад ва дуруст сухан гӯяд.',
    'Омӯзгори забони англисӣ дар мактабҳои деҳот хеле зарур аст.',
    'Ин ихтисос дар 30% донишгоҳҳо бо забони русӣ омӯзонда мешавад.',
    'Барои грант IELTS ё TOEFL лозим мешавад.',
    'Нерӯгоҳи Роғун ба муҳандисони барқ кори зиёд медиҳад.',
    'Дар соҳаи тиб ҳамшира, дорусоз ва стоматолог ниёз доранд.',
    'Шумо метавонед дар Google, YouTube ва Telegram маълумот ёбед.',
    'Ихтисосҳои кластери якум: математика, физика, информатика ва сохтмон.',
    'Пас аз хатм шумо метавонед дар бонк, андоз ё гумрук кор кунед.',
    'Ман ба шумо се ихтисоси мувофиқро пешниҳод мекунам.',
    'Санҷишро гузаред, то самти худро беҳтар шиносед.',
    'Дар коллеҷ таҳсил се сол давом мекунад ва баъд метавонед ба донишгоҳ дохил шавед.',
    'Ихтисоси психология ба онҳое мувофиқ аст, ки одамонро гӯш карда метавонанд.',
    'Барои рассом ва дизайнер Photoshop ва Figma муфиданд.',
    'Хатмкунандагони соли 2026 бояд то 15 июн ариза супоранд.',
];

const fold = (text) => String(text || '').toLowerCase()
    .replace(/[ҳ]/g, 'х').replace(/[ҷ]/g, 'ч').replace(/[ӣ]/g, 'и').replace(/[ӯ]/g, 'у')
    .replace(/[қ]/g, 'к').replace(/[ғ]/g, 'г').replace(/ё/g, 'е').replace(/[ъь]/g, '')
    .replace(/[^a-zа-я0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const words = (text) => fold(text).split(' ').filter(Boolean);

// Масофаи Левенштейн байни калимаҳо → WER.
function wer(ref, hyp) {
    const d = Array.from({ length: ref.length + 1 }, (_, i) => [i, ...new Array(hyp.length).fill(0)]);
    for (let j = 1; j <= hyp.length; j++) d[0][j] = j;
    for (let i = 1; i <= ref.length; i++) {
        for (let j = 1; j <= hyp.length; j++) {
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1));
        }
    }
    return ref.length ? d[ref.length][hyp.length] / ref.length : 0;
}

async function transcribe(wav) {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(wav)], { type: 'audio/wav' }), 'speech.wav');
    form.append('model_id', process.env.ELEVENLABS_STT_MODEL || 'scribe_v1');
    form.append('language_code', 'tgk');
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, body: form,
    });
    if (!response.ok) throw new Error(`STT ${response.status}`);
    return String((await response.json()).text || '');
}

// Вариантҳо: [ном, папкаи модел, таваққуф дар вергул]
const CONFIGS = (process.argv[2] || 'voice-model:0,voice-model:1').split(',').map((item) => {
    const [folder, phrases] = item.split(':');
    return { name: `${folder.replace('voice-model', 'model') || 'model'}${phrases === '1' ? '+вергул' : ''}`, tts: new TajikTts(folder), phrases: phrases === '1' };
});
const REPEATS = Number(process.argv[3] || 2);

async function speakWith(config, text) {
    const tts = config.tts;
    await tts.warmup();
    const spoken = spellNumbers(prepareTajikText(text), 'tj');
    if (config.phrases) return tts.speak(spoken);
    const pieces = [];
    for (const chunk of TajikTts.split(spoken)) {
        const wave = await tts.synthesize(chunk);
        if (wave?.length) pieces.push(wave, new Float32Array(Math.round(tts.sampleRate * 0.35)));
    }
    const all = new Float32Array(pieces.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const p of pieces) { all.set(p, offset); offset += p.length; }
    return tts.toWav(all);
}

(async () => {
    const totals = {};
    const quiet = process.argv.includes('--quiet');
    for (const [index, sentence] of SENTENCES.entries()) {
        if (!quiet) console.log(`\n#${index + 1} ${sentence}`);
        const reference = words(spellNumbers(prepareTajikText(sentence), 'tj'));
        for (const config of CONFIGS) {
            for (let r = 0; r < REPEATS; r += 1) {
                const started = Date.now();
                const wav = await speakWith(config, sentence);
                const synthMs = Date.now() - started;
                const heard = await transcribe(wav);
                // Ҳарду тараф якхела: рақамҳо бо калима, лотинӣ бо кириллӣ.
                const hyp = words(spellNumbers(prepareTajikText(heard), 'tj'));
                const score = wer(reference, hyp);
                const firstOk = hyp.slice(0, 2).includes(reference[0]);
                const lastOk = hyp.slice(-2).includes(reference[reference.length - 1]);
                const t = (totals[config.name] ||= { wer: 0, first: 0, last: 0, ms: 0, n: 0, bad: 0 });
                t.wer += score; t.first += firstOk ? 1 : 0; t.last += lastOk ? 1 : 0; t.ms += synthMs; t.n += 1; t.bad += score > 0.3 ? 1 : 0;
                if (!quiet) console.log(`  ${config.name.padEnd(18)} WER ${(score * 100).toFixed(0).padStart(3)}% | ${firstOk ? '✓' : '✗'}${lastOk ? '✓' : '✗'} | ${heard}`);
            }
        }
    }
    console.log('\n=== ҶАМЪ ===');
    for (const [name, t] of Object.entries(totals)) {
        console.log(`${name.padEnd(18)} WER ${(t.wer / t.n * 100).toFixed(1)}% | ҷумлаи бад (>30%) ${t.bad}/${t.n} | аввал ${t.first}/${t.n} | охир ${t.last}/${t.n} | ~${Math.round(t.ms / t.n)} мс`);
    }
})().catch((error) => { console.error('FAIL', error.message); process.exit(1); });
