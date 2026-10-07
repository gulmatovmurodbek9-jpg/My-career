// «Дарвозаи гап»: дар худи телефон муайян мекунад, ки корбар гап мезанад ё не.
// Ҳадди гап — на рақами доимӣ, балки N баробари садои атроф (noise floor), ки худкор
// омӯхта мешавад: садои доимии мошин ё вентилятор сатҳи атрофро баланд мекунад ва гап
// ҳисоб намешавад. Танҳо гап ба сервер фиристода мешавад (бо пора пеш аз он) — дар
// интернети суст ин сарфро чандин баробар кам мекунад.
//
//   const gate = createVoiceGate();
//   const step = gate.push(rms, now); // { send: [порчаҳо], commit: bool, speaking: bool }

export const GATE = {
    MIN_THRESHOLD: 0.018,   // ҳатто дар хонаи комилан ором аз ин камтар гап нест
    FLOOR_FACTOR: 3,        // гап = 3 баробари садои атроф
    FLOOR_MAX: 0.08,        // сатҳи атроф аз ин баланд намешавад (вагарна гапро намешунавем)
    START_FRAMES: 2,        // ин қадар пораи пайдарпай баланд — оғози гап (пора ~128 мс)
    END_SILENCE_MS: 900,    // ин қадар ором — ҷумла тамом
    MAX_UTTERANCE_MS: 10000, // ҳадди аксари як ҷумла — садои атроф ёварро беохир нигоҳ намедорад
    PREROLL: 3,             // ~0,4 с пеш аз гап (ҳарфи аввал гум намешавад)
    KEEPALIVE_MS: 3000,     // дар хомӯшӣ — пайваст набандад
};

export function createVoiceGate(options = {}) {
    const cfg = { ...GATE, ...options };
    let floor = null;
    let speaking = false;
    let loudFrames = 0;
    let speechStart = 0;
    let lastVoice = 0;
    let lastSent = 0;
    const preroll = [];

    return {
        get speaking() { return speaking; },
        get floor() { return floor; },
        get threshold() { return Math.max(cfg.MIN_THRESHOLD, (floor ?? 0) * cfg.FLOOR_FACTOR); },

        // rms — баландии пораи ҳозира; chunk — худи пора (ҳар чизе; гузаронида мешавад).
        push(rms, now, chunk) {
            if (floor === null) floor = Math.min(rms, cfg.FLOOR_MAX);
            const threshold = Math.max(cfg.MIN_THRESHOLD, floor * cfg.FLOOR_FACTOR);
            const loud = rms > threshold;
            // Сатҳи атроф: дар хомӯшӣ зуд, дар вақти «гап» хеле оҳиста (садои доимӣ
            // ҳам онро баланд мекунад ва дарвоза худ ба худ пӯшида мешавад).
            const rate = speaking ? 0.004 : loud ? 0.01 : 0.08;
            floor = Math.min(cfg.FLOOR_MAX, floor + (rms - floor) * rate);

            if (!speaking) {
                loudFrames = loud ? loudFrames + 1 : 0;
                preroll.push(chunk);
                if (preroll.length > cfg.PREROLL + cfg.START_FRAMES) preroll.shift();
                if (loudFrames >= cfg.START_FRAMES) {
                    speaking = true;
                    speechStart = now;
                    lastVoice = now;
                    lastSent = now;
                    const send = preroll.splice(0);
                    return { send, commit: false, speaking, event: 'start' };
                }
                if (now - lastSent >= cfg.KEEPALIVE_MS) {
                    lastSent = now;
                    return { send: [], commit: false, speaking, keepalive: true };
                }
                return { send: [], commit: false, speaking };
            }

            if (loud) lastVoice = now;
            lastSent = now;
            const ended = now - lastVoice >= cfg.END_SILENCE_MS;
            const tooLong = now - speechStart >= cfg.MAX_UTTERANCE_MS;
            if (ended || tooLong) {
                speaking = false;
                loudFrames = 0;
                return { send: [chunk], commit: true, speaking, event: ended ? 'end' : 'max' };
            }
            return { send: [chunk], commit: false, speaking };
        },

        reset() {
            speaking = false;
            loudFrames = 0;
            preroll.length = 0;
        },
    };
}
