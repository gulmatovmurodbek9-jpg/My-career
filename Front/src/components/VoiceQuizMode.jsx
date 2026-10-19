import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Ear, Loader2, Mic, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { API } from "../lib/config";
import { recorderFor } from "../lib/network";
import { matchQuizCommand, quizSpeech, quizSpeechParts } from "../lib/quizVoice";

// «Реҷаи овозӣ»-и тест (барои нобиноён, камбиноён ва онҳое, ки хондан душвор аст):
// ҳар савол бо ҷавобҳо бо овози модел хонда мешавад, баъд микрофон худкор гӯш мекунад —
// «якум», «дуюм»… ё худи ҷавоб; интихоб бо овоз тасдиқ мешавад. Тугмаҳо ва рақамҳои 1–5
// ҳамеша кор мекунанд. Тест савол/ҷавобро тавассути `quiz:question` / `quiz:command` мебахшад.
const TEXT = {
    tj: {
        on: "Реҷаи овозӣ", off: "Хомӯш кардан", start: "Тестро бо овоз гузаред", startHint: "Барои нобиноён ва камбиноён: саволҳо хонда мешаванд, бо овоз ё рақамҳои 1–5 ҷавоб диҳед.",
        speaking: "Хонда истодаам…", listening: "Гӯш мекунам - рақам ё ҷавобро гӯед", thinking: "Мефаҳмам…", idle: "«Гап занед»-ро пахш кунед ва ҷавобро гӯед",
        repeat: "Такрор", speak: "Гап занед", heard: "Шунидам", chosen: "Шумо интихоб кардед", notUnderstood: "Нафаҳмидам. Рақамро гӯед: якум, дуюм ё сеюм.",
        noMic: "Микрофон дастрас нест. Бо тугмаҳо ё рақамҳои 1–5 ҷавоб диҳед.", ords: ["якум", "дуюм", "сеюм", "чорум", "панҷум"],
    },
    ru: {
        on: "Голосовой режим", off: "Выключить", start: "Пройти тест голосом", startHint: "Для незрячих и слабовидящих: вопросы читаются вслух, отвечайте голосом или цифрами 1–5.",
        speaking: "Читаю…", listening: "Слушаю - назовите номер или ответ", thinking: "Понимаю…", idle: "Нажмите «Говорить» и скажите ответ",
        repeat: "Повторить", speak: "Говорить", heard: "Услышал", chosen: "Вы выбрали", notUnderstood: "Не понял. Назовите номер: первый, второй или третий.",
        noMic: "Микрофон недоступен. Отвечайте кнопками или цифрами 1–5.", ords: ["первый", "второй", "третий", "четвёртый", "пятый"],
    },
    en: {
        on: "Voice mode", off: "Turn off", start: "Take the test by voice", startHint: "For blind and low-vision users: questions are read aloud, answer by voice or keys 1–5.",
        speaking: "Reading…", listening: "Listening - say the number or the answer", thinking: "Understanding…", idle: "Press “Speak” and say your answer",
        repeat: "Repeat", speak: "Speak", heard: "Heard", chosen: "You chose", notUnderstood: "Sorry, I didn't get that. Say a number: one, two or three.",
        noMic: "Microphone unavailable. Answer with the buttons or keys 1–5.", ords: ["one", "two", "three", "four", "five"],
    },
};
const KEY = "quiz_voice_mode";
// Садои ҷумлаҳо дар хотираи саҳифа: «Такрор» ва саволи такрорӣ фавран.
const clips = new Map();
const clip = (sentence, lang) => {
    const key = `${lang}|${sentence}`;
    if (!clips.has(key)) {
        if (clips.size > 400) clips.clear();
        const request = axios.post(`${API}/voice/speak`, { text: sentence, lang, format: "mp3" }, { responseType: "blob", timeout: 45000 })
            .then(({ data }) => data)
            .catch((error) => { clips.delete(key); throw error; });
        clips.set(key, request);
    }
    return clips.get(key);
};
const SILENCE_MS = 900;
const MAX_MS = 9000;

export default function VoiceQuizMode() {
    const { i18n } = useTranslation();
    const lang = ["tj", "ru", "en"].includes((i18n.language || "tj").slice(0, 2)) ? (i18n.language || "tj").slice(0, 2) : "tj";
    const text = TEXT[lang];
    const [on, setOn] = useState(() => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } });
    const [quiz, setQuiz] = useState(() => window.__quizVoice || null);
    const [status, setStatus] = useState("idle");
    const [line, setLine] = useState("");
    const [micOk, setMicOk] = useState(true);
    const audioRef = useRef(null);
    const recRef = useRef(null);
    const streamRef = useRef(null);
    const ctxRef = useRef(null); // Web Audio: ҷумлаҳо бе танаффуси тасодуфӣ паи ҳам
    const sourcesRef = useRef([]);
    const tokenRef = useRef(0); // ҳар савол — як «навбат»; ҷавобҳои дер омада партофта мешаванд
    const retriesRef = useRef(0);

    useEffect(() => {
        const onQuestion = (event) => setQuiz(event.detail || null);
        window.addEventListener("quiz:question", onQuestion);
        // Агар савол пеш аз пайдо шудани ин компонент нашр шуда бошад (масалан, «аз нав» аз натиҷа).
        if (window.__quizVoice) setQuiz(window.__quizVoice);
        return () => window.removeEventListener("quiz:question", onQuestion);
    }, []);

    const stopAll = useCallback(() => {
        tokenRef.current += 1;
        audioRef.current?.pause();
        sourcesRef.current.forEach((source) => { try { source.stop(); } catch { /* аллакай қатъ */ } });
        sourcesRef.current = [];
        if (recRef.current?.state === "recording") { recRef.current.onstop = null; recRef.current.stop(); }
        recRef.current = null;
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setStatus("idle");
    }, []);

    const play = useCallback(async (blob, token) => {
        if (token !== tokenRef.current) return false;
        const url = URL.createObjectURL(blob);
        const audio = audioRef.current || new Audio();
        audioRef.current = audio;
        audio.src = url;
        await new Promise((resolve) => {
            audio.onended = resolve;
            audio.onerror = resolve;
            audio.play().catch(resolve);
        });
        URL.revokeObjectURL(url);
        return token === tokenRef.current;
    }, []);

    // Якчанд ҷумла: ҳамаашон фавран дархост мешаванд, баъд бо навбат хонда мешаванд —
    // садои аввал баъди ~1–2 сония, на баъди сохтани тамоми савол (пештар ~7 сония).
    const audioContext = useCallback(() => {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        if (!ctxRef.current) { try { ctxRef.current = new Ctx(); } catch { return null; } }
        if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
        return ctxRef.current;
    }, []);

    // Якчанд ҷумла: ҳамаашон фавран дархост мешаванд ва бо Web Audio паи ҳам гузошта мешаванд —
    // пас аз «Якум.» паузаи кӯтоҳ, пас аз ҷумлаи пурра каме дарозтар (на танаффуси тасодуфии <audio>).
    // Агар Web Audio кор накунад — ҳамон пахши пештара бо <audio>.
    const sayParts = useCallback(async (parts, token) => {
        setStatus("speaking");
        const requests = parts.map((sentence) => clip(sentence, lang));
        requests.forEach((request) => request.catch(() => {}));
        const ctx = audioContext();
        // Танҳо агар AudioContext воқеан кор кунад (баъди клик); вагарна source.onended ҳеҷ гоҳ намеояд.
        if (ctx && ctx.state === "running") {
            try {
                let at = ctx.currentTime + 0.05;
                let lastEnd = Promise.resolve();
                for (const [index, request] of requests.entries()) {
                    if (token !== tokenRef.current) return false;
                    let blob = null;
                    try { blob = await request; } catch { blob = null; }
                    if (!blob) continue;
                    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
                    if (token !== tokenRef.current) return false;
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);
                    at = Math.max(at, ctx.currentTime + 0.02);
                    source.start(at);
                    sourcesRef.current.push(source);
                    lastEnd = new Promise((resolve) => { source.onended = resolve; });
                    const short = parts[index].length <= 12;
                    at += buffer.duration + (index === parts.length - 1 ? 0 : short ? 0.12 : 0.32);
                }
                // Эҳтиёт: агар onended наояд, баъди дарозии садо + 1,5 с идома медиҳем.
                await Promise.race([lastEnd, new Promise((resolve) => setTimeout(resolve, Math.max(0, at - ctx.currentTime) * 1000 + 1500))]);
                sourcesRef.current = [];
                return token === tokenRef.current;
            } catch {
                sourcesRef.current.forEach((source) => { try { source.stop(); } catch { /* холӣ */ } });
                sourcesRef.current = [];
                if (token !== tokenRef.current) return false;
                // Ба пахши <audio> мегузарем.
            }
        }
        for (const request of requests) {
            if (token !== tokenRef.current) return false;
            let blob = null;
            try { blob = await request; } catch { blob = null; }
            if (blob && !(await play(blob, token))) return false;
        }
        return token === tokenRef.current;
    }, [audioContext, lang, play]);
    const say = useCallback((sentence, token) => sayParts([sentence], token), [sayParts]);

    // Як навбат гӯш кардан: баъди хомӯшии кӯтоҳ ё 9 сония мебандад → /voice/stt.
    const listen = useCallback(async (token) => {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setMicOk(false); setStatus("idle"); return null; }
        let stream;
        try {
            stream = streamRef.current || await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            setMicOk(false);
            setStatus("idle");
            return null;
        }
        if (token !== tokenRef.current) return null;
        streamRef.current = stream;
        setStatus("listening");
        const recorder = recorderFor(stream);
        recRef.current = recorder;
        const chunks = [];
        recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
        const finished = new Promise((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" })); });
        recorder.start();
        // Хомӯширо бо AnalyserNode пайгирӣ мекунем.
        let context;
        let spoke = false;
        try {
            context = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = context.createAnalyser();
            analyser.fftSize = 1024;
            context.createMediaStreamSource(stream).connect(analyser);
            const data = new Uint8Array(analyser.fftSize);
            const startedAt = Date.now();
            let quietSince = Date.now();
            const tick = () => {
                if (recorder.state !== "recording") return;
                analyser.getByteTimeDomainData(data);
                const level = Math.max(...data.map((v) => Math.abs(v - 128)));
                if (level > 12) { spoke = true; quietSince = Date.now(); }
                const now = Date.now();
                if ((spoke && now - quietSince > SILENCE_MS) || now - startedAt > MAX_MS) recorder.stop();
                else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        } catch {
            setTimeout(() => recorder.state === "recording" && recorder.stop(), 5000);
            spoke = true;
        }
        const blob = await finished;
        context?.close().catch(() => {});
        if (token !== tokenRef.current || !spoke || blob.size < 700) return null; // Opus 24 кбит/с — порчаҳо хурданд
        setStatus("thinking");
        try {
            const form = new FormData();
            form.append("audio", blob, "speech.webm");
            const { data } = await axios.post(`${API}/voice/stt`, form, { timeout: 30000 });
            return token === tokenRef.current ? String(data?.text || "").trim() : null;
        } catch {
            return null;
        }
    }, []);

    const answerRound = useCallback(async (token, current) => {
        const heard = await listen(token);
        if (token !== tokenRef.current) return;
        if (!heard) { setStatus("idle"); return; }
        setLine(`${text.heard}: «${heard}»`);
        const command = matchQuizCommand(heard, current);
        if (command?.type === "answer") {
            const option = current.options[command.position];
            if (await say(`${text.chosen}: ${text.ords[command.position] || command.position + 1}. ${option}.`, token)) {
                window.dispatchEvent(new CustomEvent("quiz:command", { detail: command }));
            }
        } else if (command?.type === "repeat") {
            if (await sayParts(quizSpeechParts(current, lang), token)) answerRound(token, current);
        } else if (command?.type === "free" || command?.type === "next" || command?.type === "back") {
            window.dispatchEvent(new CustomEvent("quiz:command", { detail: command }));
            setStatus("idle");
        } else if (retriesRef.current < 2) {
            retriesRef.current += 1;
            if (await say(text.notUnderstood, token)) answerRound(token, current);
        } else setStatus("idle");
    }, [lang, listen, say, sayParts, text]);

    // Ҳар саволи нав: хондан → гӯш кардан.
    const run = useCallback(async (current) => {
        stopAll();
        if (!current) return;
        const token = tokenRef.current;
        retriesRef.current = 0;
        setLine("");
        if (await sayParts(quizSpeechParts(current, lang), token) && micOk) answerRound(token, current);
        else if (token === tokenRef.current) setStatus("idle");
    }, [answerRound, lang, micOk, sayParts, stopAll]);

    const quizKey = quiz ? `${quiz.id}|${quiz.lang}` : "";
    useEffect(() => {
        if (on && quiz) run(quiz);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [on, quizKey]);
    useEffect(() => () => stopAll(), [stopAll]);

    const toggle = () => {
        const next = !on;
        try { localStorage.setItem(KEY, next ? "1" : "0"); } catch { /* холӣ */ }
        if (!next) stopAll();
        else audioContext(); // AudioContext бояд аз клики корбар сар шавад (сиёсати autoplay)
        setOn(next);
    };
    const manual = () => {
        if (!quiz) return;
        stopAll();
        const token = tokenRef.current;
        retriesRef.current = 0;
        answerRound(token, quiz);
    };

    if (!quiz && !on) return null;
    if (!on) {
        return (
            <button type="button" onClick={toggle} data-voice-mode-start title={text.startHint}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[13.5px] font-bold text-foreground transition hover:border-primary hover:text-primary cursor-pointer">
                <Volume2 className="h-4 w-4 text-primary" aria-hidden />
                {text.start}
            </button>
        );
    }

    const statusText = { speaking: text.speaking, listening: text.listening, thinking: text.thinking, idle: text.idle }[status];
    return (
        <section className="rounded-2xl border border-primary/30 bg-card p-4" aria-label={text.on} data-voice-mode data-status={status}>
            <div className="flex flex-wrap items-center gap-3">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${status === "listening" ? "animate-pulse bg-rose-500 text-white" : "bg-primary text-primary-foreground"}`}>
                    {status === "speaking" ? <Volume2 className="h-6 w-6" aria-hidden /> : status === "listening" ? <Ear className="h-6 w-6" aria-hidden /> : status === "thinking" ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Mic className="h-6 w-6" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-muted-foreground">{text.on}</div>
                    <div className="text-[16px] font-bold text-foreground" aria-live="polite">{micOk ? statusText : text.noMic}</div>
                    {line && <div className="truncate text-[13px] text-muted-foreground">{line}</div>}
                </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => run(quiz)} disabled={!quiz} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-3 text-[14px] font-bold text-foreground hover:border-primary disabled:opacity-40 cursor-pointer">
                    <RotateCcw className="h-5 w-5" aria-hidden /> {text.repeat}
                </button>
                <button type="button" onClick={manual} disabled={!quiz || !micOk || status === "listening"} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-3 text-[14px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-40 cursor-pointer">
                    <Mic className="h-5 w-5" aria-hidden /> {text.speak}
                </button>
                <button type="button" onClick={toggle} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-3 text-[14px] font-bold text-foreground hover:border-rose-500 cursor-pointer">
                    <VolumeX className="h-5 w-5" aria-hidden /> {text.off}
                </button>
            </div>
            {/* Барои screen reader: матни пурраи савол. */}
            {quiz && <p className="sr-only" aria-live="polite">{quizSpeech(quiz, lang)}</p>}
        </section>
    );
}
