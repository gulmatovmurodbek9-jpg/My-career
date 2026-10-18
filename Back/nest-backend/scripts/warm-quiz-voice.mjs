// «Реҷаи овозӣ»-и тест: ҳамаи ҷумлаҳои саволҳо пешакӣ сохта мешаванд ва дар voice-cache/ мемонанд,
// то корбари аввал ҳам интизор нашавад. Ҷумлаҳо айнан ҳамонҳоянд, ки саҳифа мефиристад
// (quizSpeechParts дар Front/src/lib/quizVoice.js).
//   node scripts/warm-quiz-voice.mjs [tj ru en]     (дар сервер; API дар localhost:3005)
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const voiceLib = path.resolve(here, '../../../Front/src/lib/quizVoice.js').replace(/\\/g, '/');
const { quizSpeechParts, QUIZ_ORDINALS } = await import(/^[A-Z]:/.test(voiceLib) ? `file:///${voiceLib}` : `file://${voiceLib}`);
const API = process.env.API_URL || 'http://127.0.0.1:3005/api';
const langs = process.argv.slice(2).filter((a) => ['tj', 'ru', 'en'].includes(a));
const pick = (value, lang) => (typeof value === 'string' ? value : value?.[lang] || value?.tj || '');

const part1 = await (await fetch(`${API}/quiz/questions`)).json();
const part2 = [];
for (let n = 1; n <= 5; n += 1) part2.push(...await (await fetch(`${API}/quiz/specialty-questions?clusterNumber=${n}`)).json());
const questions = [...(Array.isArray(part1) ? part1 : part1.data || []), ...part2].filter((q) => q?.options?.length);
console.log(`Саволҳо: ${questions.length}`);

for (const lang of langs.length ? langs : ['tj', 'ru', 'en']) {
    const sentences = new Set();
    questions.forEach((q, index) => {
        const options = q.options.map((o) => pick(o.text, lang)).filter(Boolean);
        quizSpeechParts({ step: index, question: pick(q.question, lang), options }, lang).forEach((s) => sentences.add(s));
    });
    // «Саволи N.» барои ҳамаи қадамҳо (+ саволи баробарӣ) ва рақамҳои тартибӣ.
    for (let step = 0; step < questions.length + 6; step += 1) quizSpeechParts({ step, question: '', options: [] }, lang).forEach((s) => sentences.add(s));
    (QUIZ_ORDINALS[lang] || []).forEach((o) => sentences.add(`${o}.`));
    let made = 0;
    let failed = 0;
    const started = Date.now();
    for (const text of sentences) {
        try {
            const res = await fetch(`${API}/voice/speak`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, lang }) });
            await res.arrayBuffer();
            if (res.ok) made += 1; else failed += 1;
        } catch {
            failed += 1;
        }
    }
    console.log(`${lang}: ${made}/${sentences.size} ҷумла тайёр (${failed} хато), ${Math.round((Date.now() - started) / 1000)} с`);
}
