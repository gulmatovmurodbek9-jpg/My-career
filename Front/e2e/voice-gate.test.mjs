// Тести «дарвозаи гап» (бе браузер): node e2e/voice-gate.test.mjs
import { createVoiceGate } from "../src/components/voice/voiceGate.js";

let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// Пайдарпайи порчаҳо (~128 мс): [rms, шумора]
const run = (plan) => {
    const gate = createVoiceGate();
    let now = 0;
    let sent = 0;
    let frames = 0;
    const events = [];
    for (const [rms, count] of plan) {
        for (let i = 0; i < count; i += 1) {
            const step = gate.push(rms, now, frames);
            sent += step.send.length;
            if (step.event) events.push(`${step.event}@${(now / 1000).toFixed(1)}`);
            now += 128;
            frames += 1;
        }
    }
    return { events, sent, frames };
};

const s = (sec) => Math.round(sec / 0.128);

// 1) Хонаи ором: 2 с хомӯшӣ, 2 с гап, 2 с хомӯшӣ.
let r = run([[0.004, s(2)], [0.12, s(2)], [0.004, s(2)]]);
check("Хонаи ором: гап ёфт ва тамом шуд", r.events.length === 2 && r.events[0].startsWith("start") && r.events[1].startsWith("end"), r.events.join(" "));
check("Хомӯшӣ фиристода намешавад", r.sent < r.frames * 0.6, `${r.sent}/${r.frames} пора`);

// 2) Мошин мегузарад (садои 0.05 дар 6 с), баъд гап.
r = run([[0.006, s(2)], [0.05, s(6)], [0.006, s(1)], [0.15, s(2)], [0.006, s(2)]]);
const ends = r.events.filter((e) => !e.startsWith("start"));
check("Садои мошин беохир гӯш намекунонад", ends.length >= 1 && !r.events.some((e) => e.startsWith("max")) || r.events.filter((e) => e.startsWith("max")).length <= 1, r.events.join(" "));
check("Гапи баъд аз мошин шунида шуд", r.events.filter((e) => e.startsWith("start")).length >= 1 && r.events.at(-1).startsWith("end"), r.events.join(" "));

// 3) Садои доимии баланд (кӯча, 0.06) 30 с — ҳеҷ гоҳ «гап»-и беохир нест.
r = run([[0.06, s(30)]]);
check("Садои доимӣ: на зиёда аз як ҷумлаи бардурӯғ", r.events.filter((e) => e.startsWith("start")).length <= 1, r.events.join(" "));

// 4) Гап дар кӯча (садо 0.03, гап 0.2) — ёфта мешавад ва тамом мешавад.
r = run([[0.03, s(3)], [0.2, s(2)], [0.03, s(2)]]);
check("Гап дар кӯча шунида ва тамом шуд", r.events.length === 2 && r.events[1].startsWith("end"), r.events.join(" "));

// 5) Ҷумлаи бениҳоят дароз — дар 10 с бурида мешавад.
r = run([[0.005, s(1)], [0.2, s(15)]]);
check("Ҳадди аксари ҷумла 10 с", r.events.some((e) => e.startsWith("max")), r.events.join(" "));

console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
