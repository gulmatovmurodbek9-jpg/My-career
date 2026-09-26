import { API } from "../../lib/config";

// Шинохти ҷараёнии нутқ: садо ҳангоми гап задан пора-пора фиристода мешавад
// ва матн ҳамон лаҳза бармегардад. Пештар мо интизор мешудем, то корбар
// тамом кунад — он тақрибан 2.5 сония вақт мехӯрд.
const WS_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";
const SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = 2048;

const LANG = { tj: "tgk", ru: "rus", en: "eng" };

// Калимаҳои соҳаи мо. Модел онҳоро афзалтар медонад — бе ин рӯйхат
// «ихтисос»-ро «эҳсос» ва «муҳандис»-ро «мультик» мешунид.
// ElevenLabs зиёда аз 50 калимаро рад мекунад (1008 invalid_request) — ва
// он гоҳ микрофон «гӯш мекард», вале ҳеҷ чиз намешунид. Калимаҳои умумӣ
// («не», «хуб») модел худаш медонад; ин ҷо танҳо номҳо ва истилоҳҳо.
const KEYTERMS = [
    "ихтисос", "ихтисосҳо", "кластер", "донишгоҳ", "донишгоҳҳо",
    "санҷиш", "ҳисобот", "муқоиса", "захира", "ҳуҷҷатсупорӣ",
    "бали гузариш", "сомонӣ", "ройгон", "пулакӣ",
    "барномасоз", "барномасозӣ", "муҳандис", "иқтисодчӣ",
    "иқтисодиёт", "ҳуқуқшинос", "омӯзгор", "духтур", "табиб",
    "педиатрия", "стоматология", "дорусоз",
    "информатика", "математика", "биология", "химия", "физика",
    "журналист", "психология", "меъмор", "тарҷумон",
    "Душанбе", "Хуҷанд", "Бохтар", "Кӯлоб", "Хоруғ", "Истаравшан", "Панҷакент",
    "нишон деҳ", "наздиктарин", "ассалому алайкум", "мехоҳам", "шудан",
].slice(0, 50);

const toBase64 = (bytes) => {
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
    }
    return btoa(binary);
};

// Float32 [-1..1] → PCM 16-bit little-endian.
const toPcm16 = (samples) => {
    const out = new Int16Array(samples.length);
    for (let index = 0; index < samples.length; index += 1) {
        const value = Math.max(-1, Math.min(1, samples[index]));
        out[index] = Math.round(value * 32767);
    }
    return new Uint8Array(out.buffer);
};

export class RealtimeStt {
    constructor({ lang = "tj", onPartial, onFinal, onLevel, onError } = {}) {
        this.lang = lang;
        this.onPartial = onPartial || (() => { });
        this.onFinal = onFinal || (() => { });
        this.onLevel = onLevel || (() => { });
        this.onError = onError || (() => { });
        this.ws = null;
        this.context = null;
        this.stream = null;
        this.node = null;
        this.stopped = false;
    }

    get active() {
        return !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    async start() {
        this.stopped = false;

        const response = await fetch(`${API}/voice/stt-token`);
        if (!response.ok) throw new Error(`токен нашуд (${response.status})`);
        const { token } = await response.json();

        const url = new URL(WS_URL);
        url.searchParams.set("token", token);
        url.searchParams.set("model_id", "scribe_v2_realtime");
        url.searchParams.set("language_code", LANG[this.lang] || LANG.tj);
        url.searchParams.set("audio_format", `pcm_${SAMPLE_RATE}`);
        url.searchParams.set("commit_strategy", "vad");
        url.searchParams.set("vad_silence_threshold_secs", "0.6");
        // Сервер танҳо такрори параметрро қабул мекунад, на рӯйхати JSON.
        KEYTERMS.forEach((word) => url.searchParams.append("keyterms", word));

        await new Promise((resolve, reject) => {
            const ws = new WebSocket(url.toString());
            this.ws = ws;
            const timer = setTimeout(() => reject(new Error("пайвастшавӣ дер кард")), 8000);

            ws.onopen = () => {
                clearTimeout(timer);
                resolve();
            };
            ws.onerror = () => {
                clearTimeout(timer);
                reject(new Error("WebSocket пайваст нашуд"));
            };
            ws.onclose = (event) => {
                if (!this.stopped) console.warn("Scribe пайвастро баст:", event.code, event.reason || "");
                if (!this.stopped) this.onError(new Error("пайваст қатъ шуд"));
            };
            ws.onmessage = (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                } catch {
                    return;
                }
                const kind = data.message_type || data.type;
                // Хатои сервер (квота, токен, формат) — дар консол нишон медиҳем,
                // вагарна фақат «гӯш карда истодаам» мемонд ва сабаб номаълум буд.
                if (kind && /error|invalid|quota|limit/i.test(kind)) {
                    console.warn("Scribe:", kind, data.error || data.message || "");
                    return;
                }
                if (kind === "partial_transcript" && data.text) {
                    this.onPartial(data.text);
                } else if (kind && kind.startsWith("committed") && data.text) {
                    this.onFinal(data.text.trim());
                }
            };
        });

        await this.openMicrophone();
    }

    async openMicrophone() {
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        });

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioCtx({ sampleRate: SAMPLE_RATE });
        const source = this.context.createMediaStreamSource(this.stream);

        // ScriptProcessor кӯҳна аст, вале дар ҳамаи браузерҳо кор мекунад
        // ва барои фиристодани пораҳои хом кифоя мебошад.
        this.node = this.context.createScriptProcessor(CHUNK_SAMPLES, 1, 1);
        this.node.onaudioprocess = (event) => {
            if (!this.active) return;
            const samples = event.inputBuffer.getChannelData(0);

            let sum = 0;
            for (let index = 0; index < samples.length; index += 1) sum += samples[index] * samples[index];
            this.onLevel(Math.sqrt(sum / samples.length));

            this.ws.send(JSON.stringify({
                message_type: "input_audio_chunk",
                audio_base_64: toBase64(toPcm16(samples)),
                commit: false,
                sample_rate: SAMPLE_RATE,
            }));
        };

        source.connect(this.node);
        // Бе пайваст ба destination ScriptProcessor кор намекунад;
        // ҳаҷмро сифр мекунем, то садо баргашта нашунавад.
        const mute = this.context.createGain();
        mute.gain.value = 0;
        this.node.connect(mute);
        mute.connect(this.context.destination);
    }

    stop() {
        this.stopped = true;
        try {
            if (this.node) this.node.onaudioprocess = null;
            this.node?.disconnect();
            this.stream?.getTracks().forEach((track) => track.stop());
            this.context?.close();
            if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
        } catch {
            /* аллакай пӯшида */
        }
        this.ws = null;
        this.node = null;
        this.stream = null;
        this.context = null;
    }
}
