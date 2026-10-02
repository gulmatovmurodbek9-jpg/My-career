// Овози русӣ (Piper Ruslan) ва англисӣ (Kokoro am_echo) — дар process-и АЛОҲИДА.
//
// Чаро алоҳида: sherpa-onnx ва onnxruntime-node (овози тоҷикӣ) ҳар кадом
// onnxruntime-и худро доранд. Дар як process онҳо ихтилоф мекарданд (модели
// тоҷикӣ кушода намешуд) ва Kokoro 4–7 баробар суст мешуд (санҷиш 02.10.2026).
//
// Пайваст: танҳо канали IPC-и process-и падар (fork). Ин process ягон порти
// шабака намекушояд — аз берун, ҳатто аз localhost, дастрас нест.
// Моделҳо танҳо бори аввал, ки забонашон лозим шуд, бор мешаванд.
const { existsSync } = require('fs');
const { join } = require('path');

const ROOT = process.env.VOICE_MODELS_DIR || join(__dirname, 'voice-models');

// Танзимоти моделҳо — ҳамон қиматҳое, ки дар сервер санҷида шуданд.
const MODELS = {
    ru: {
        sid: 0,
        config: (dir) => ({
            vits: {
                model: join(dir, 'ru_RU-ruslan-medium.onnx'),
                tokens: join(dir, 'tokens.txt'),
                dataDir: join(dir, 'espeak-ng-data'),
                // «Добро пожаловать» бо 0,3/0,4, 0,5/0,6 ва 0,667/0,8 — 12/12 дуруст; 0,5/0,6 табиӣ ва устувор.
                noiseScale: 0.5,
                noiseScaleW: 0.6,
            },
            numThreads: 1,
            provider: 'cpu',
        }),
        dir: 'vits-piper-ru_RU-ruslan-medium',
    },
    en: {
        sid: 12, // am_echo
        config: (dir) => ({
            kokoro: {
                model: join(dir, 'model.onnx'),
                voices: join(dir, 'voices.bin'),
                tokens: join(dir, 'tokens.txt'),
                dataDir: join(dir, 'espeak-ng-data'),
                lexicon: `${join(dir, 'lexicon-us-en.txt')},${join(dir, 'lexicon-zh.txt')}`,
            },
            // 1 thread дар сервер RTF 1,23 буд, 2 thread — 0,69.
            numThreads: 2,
            provider: 'cpu',
        }),
        dir: 'kokoro-multi-lang-v1_0',
    },
};

let sherpa = null;
const engines = {};

function engine(lang) {
    if (engines[lang]) return engines[lang];
    const spec = MODELS[lang];
    if (!spec) throw new Error(`забони номаълум: ${lang}`);
    const dir = join(ROOT, spec.dir);
    if (!existsSync(dir)) throw new Error(`модел нест: ${dir}`);
    sherpa = sherpa || require('sherpa-onnx-node');
    const started = Date.now();
    engines[lang] = new sherpa.OfflineTts({ model: spec.config(dir), maxNumSentences: 1 });
    process.send?.({ type: 'log', message: `модели ${lang} бор шуд — ${Date.now() - started} мс` });
    return engines[lang];
}

// float32 [-1..1] → WAV 16-bit mono бо sample rate-и худи модел (22050 / 24000).
function toWav(samples, rate) {
    const data = Buffer.alloc(samples.length * 2);
    for (let index = 0; index < samples.length; index += 1) {
        const clamped = Math.max(-1, Math.min(1, samples[index]));
        data.writeInt16LE(Math.round(clamped * 32767), index * 2);
    }
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + data.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(rate, 24);
    header.writeUInt32LE(rate * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(data.length, 40);
    return Buffer.concat([header, data]);
}

process.on('message', (message) => {
    if (!message || message.type !== 'synth') return;
    const { id, lang, text } = message;
    try {
        const tts = engine(lang);
        const started = Date.now();
        const audio = tts.generate({
            text,
            generationConfig: new sherpa.GenerationConfig({ sid: MODELS[lang].sid, speed: 1.0, silenceScale: 0.2 }),
        });
        const wav = toWav(audio.samples, audio.sampleRate);
        process.send({ type: 'result', id, ok: true, wav, ms: Date.now() - started, rate: audio.sampleRate });
    } catch (error) {
        process.send({ type: 'result', id, ok: false, error: String(error?.message || error).slice(0, 300) });
    }
});

// Санҷиш: «бигзор process афтад» — танҳо бо TTS_WORKER_TEST=1.
if (process.env.TTS_WORKER_TEST === '1') {
    process.on('message', (message) => {
        if (message?.type === 'crash') process.exit(7);
        if (message?.type === 'hang') { const until = Date.now() + 60000; while (Date.now() < until) { /* банд */ } }
    });
}

// Падар рафт — мо ҳам меравем (process-и ятим намемонад).
process.on('disconnect', () => process.exit(0));
process.send?.({ type: 'ready' });
