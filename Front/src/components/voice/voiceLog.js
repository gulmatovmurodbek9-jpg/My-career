// Ташхиси ёвар: ҳодисаҳои микрофон ва вақтҳо ба backend (voice-debug.log).
// Backend онҳоро танҳо бо VOICE_DEBUG=1 нигоҳ медорад — дар сервер хомӯш аст.
import { API } from "../../lib/config";

const queue = [];
const started = Date.now();
let timer = null;

const flush = () => {
    timer = null;
    if (!queue.length) return;
    const events = queue.splice(0, queue.length);
    fetch(`${API}/voice/debug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
        keepalive: true,
    }).catch(() => { });
};

export const voiceLog = (event, data = {}) => {
    // Дар production ҳеҷ чиз намефиристем: пештар ҳар саҳифа POST /api/voice/debug мекард.
    if (!import.meta.env.DEV) return;
    queue.push({ t: ((Date.now() - started) / 1000).toFixed(2), event, ...data });
    if (!timer) timer = setTimeout(flush, 1500);
};
