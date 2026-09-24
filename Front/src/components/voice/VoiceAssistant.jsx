import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Keyboard, Mic, Send, Square, X } from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";

const GREETED_KEY = "assistant_greeted_v1";

// Браузер садоро танҳо баъди пахши корбар иҷозат медиҳад. Ҳамин файли хомӯшро
// дар пахши аввал мешунавонем ва баъд ҳамон элементро дубора кор мефармоем.
const SILENT_WAV =
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

const SPEECH_RMS = 0.035;      // аз ин баланд — яъне гап зада истодааст
const SILENCE_MS = 750;        // ин қадар хомӯшӣ — яъне ҷумла тамом шуд
const NO_SPEECH_MS = 8000;     // чизе нагуфт — боз гӯш мекунем
const MAX_RECORD_MS = 15000;   // ҳадди аксар як навбат

const QUICK_ACTIONS = [
    { key: "careers", text: "Ихтисос интихоб кунам" },
    { key: "universities", text: "Донишгоҳҳо" },
    { key: "quiz", text: "Санҷиш" },
];

export default function VoiceAssistant() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuthStore();

    const [open, setOpen] = useState(false);
    const [started, setStarted] = useState(false);
    const [heard, setHeard] = useState("");
    const [said, setSaid] = useState("");
    const [input, setInput] = useState("");
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [state, setState] = useState("idle");
    const [voiceWarning, setVoiceWarning] = useState(false);

    const playerRef = useRef(null);
    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const handsFreeRef = useRef(false);
    const busyRef = useRef(false);
    const sendRef = useRef(null);
    const orbRef = useRef(null);
    const pulseRef = useRef(0);
    const listenRef = useRef(null);

    const lang = i18n.language || "tj";
    const greeting = t(
        "assistant.greeting",
        "Хуш омадед! Ман ёвари шумо ҳастам. Чӣ кор кунем — ихтисос интихоб кунем, донишгоҳҳоро бинем, ё санҷиш гузарем?",
    );

    // Бори аввал худаш кушода мешавад. Садо то пахши аввали корбар
    // намебарояд — ин қоидаи худи браузер аст.
    useEffect(() => {
        let greeted = false;
        try {
            // sessionStorage, на localStorage: ҳар кушодани нави браузер
            // боз салом медиҳад. Дар рӯзи намоиш ин муҳим аст.
            greeted = sessionStorage.getItem(GREETED_KEY) === "1";
        } catch {
            greeted = false;
        }
        if (greeted) return undefined;
        const timer = setTimeout(() => {
            setOpen(true);
            try {
                sessionStorage.setItem(GREETED_KEY, "1");
            } catch {
                /* режими пинҳонӣ */
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const setOrbLevel = useCallback((value) => {
        const node = orbRef.current;
        if (!node) return;
        const level = Math.max(0, Math.min(1, value));
        node.style.transform = `scale(${1 + level * 0.14})`;
        node.style.opacity = String(0.55 + level * 0.45);
    }, []);

    const stopPulse = useCallback(() => {
        if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
        pulseRef.current = 0;
        setOrbLevel(0);
    }, [setOrbLevel]);

    const startPulse = useCallback(() => {
        if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
        const startedAt = performance.now();
        const loop = (now) => {
            const seconds = (now - startedAt) / 1000;
            const wave = 0.34 * Math.sin(seconds * 11.3) + 0.22 * Math.sin(seconds * 4.7) + 0.12 * Math.sin(seconds * 23.1);
            setOrbLevel(0.32 + Math.abs(wave));
            pulseRef.current = requestAnimationFrame(loop);
        };
        pulseRef.current = requestAnimationFrame(loop);
    }, [setOrbLevel]);

    const stopAudio = useCallback(() => {
        const player = playerRef.current;
        if (player) {
            player.onended = null;
            player.pause();
        }
    }, []);

    const unlockAudio = useCallback(() => {
        if (playerRef.current) return;
        const player = new Audio(SILENT_WAV);
        player.play().catch(() => { });
        playerRef.current = player;
    }, []);

    // Аввал овози МУРОД аз сервер; агар нашавад — овози браузер.
    // Ваъда вақте иҷро мешавад, ки садо тамом шуд — то баъдаш гӯш сар шавад.
    const speak = useCallback((text) => new Promise((resolve) => {
        if (!text) {
            resolve();
            return;
        }
        stopAudio();
        setState("speaking");
        startPulse();

        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            stopPulse();
            resolve();
        };
        // Овози браузер русист ва тоҷикиро вайрон мехонад —
        // беҳтар аст хомӯш монем ва матнро нишон диҳем.
        const fallback = () => {
            if (settled) return;
            setVoiceWarning(true);
            finish();
        };

        const player = playerRef.current || new Audio();
        playerRef.current = player;
        player.onended = finish;
        player.onerror = fallback;
        player.src = `${API}/voice/speak?text=${encodeURIComponent(text)}`;
        player.play().then(() => setVoiceWarning(false)).catch(fallback);
    }), [startPulse, stopAudio, stopPulse]);

    // Номи ихтисоси кушодашуда, то «инро захира кун» маъно дошта бошад.
    const currentCareerName = useCallback(async () => {
        const match = location.pathname.match(/^\/info\/([^/]+)$/);
        if (!match) return undefined;
        try {
            const { data } = await axios.get(`${API}/careers/${match[1]}`, { timeout: 8000 });
            return data?.name;
        } catch {
            return undefined;
        }
    }, [location.pathname]);

    const runAction = useCallback(async (action, params) => {
        switch (action) {
            case "search": {
                const query = String(params?.query || "").trim();
                navigate(query ? `/careers?ai=${encodeURIComponent(query)}` : "/careers");
                break;
            }
            case "open_career":
                if (params?.id) navigate(`/info/${params.id}`);
                break;
            case "compare": {
                const names = Array.isArray(params?.names) ? params.names : [];
                navigate(names.length
                    ? `/dashboard/compare?names=${encodeURIComponent(names.join("|"))}`
                    : "/dashboard/compare");
                break;
            }
            case "save_career":
                if (params?.id && token) {
                    await axios.post(`${API}/users/save-career/${params.id}`, {}, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                }
                break;
            case "start_quiz":
                navigate("/quiz");
                break;
            case "open_universities":
                if (params?.id) {
                    navigate(`/universities/${params.id}`);
                } else {
                    navigate(params?.city
                        ? `/universities?q=${encodeURIComponent(params.city)}`
                        : "/universities");
                }
                break;
            case "open_report":
                navigate("/dashboard/ai-advisor");
                break;
            case "open_plan":
                navigate("/dashboard/plan");
                break;
            default:
                break;
        }
    }, [navigate, token]);

    const releaseMic = useCallback(() => {
        const recorder = recorderRef.current;
        recorderRef.current = null;
        if (recorder && recorder.state !== "inactive") {
            recorder.onstop = null;
            try {
                recorder.stop();
            } catch {
                /* аллакай истодааст */
            }
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    // Садоро ба сервер мефиристем — Scribe тоҷикиро мешиносад,
    // барои ҳамин аз шинохти браузер даст кашидем.
    const transcribe = useCallback(async (blob) => {
        setState("thinking");
        try {
            const form = new FormData();
            form.append("audio", blob, "speech.webm");
            const { data } = await axios.post(`${API}/voice/stt`, form, { timeout: 30000 });
            const text = String(data?.text || "").trim();
            if (text) {
                sendRef.current?.(text);
                return;
            }
        } catch {
            /* шинохт нашуд — боз гӯш мекунем */
        }
        setState("idle");
        if (handsFreeRef.current) listenRef.current?.();
    }, []);

    // Худаш мефаҳмад, ки ҷумла кай тамом шуд: баъди хомӯшии кӯтоҳ мебандад.
    const watchSilence = useCallback((stream, recorder, meta) => {
        let context;
        try {
            context = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
            return;
        }
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        const samples = new Uint8Array(analyser.fftSize);
        const startedAt = Date.now();
        let quietSince = startedAt;

        const finish = () => {
            context.close().catch(() => { });
            if (recorder.state === "recording") recorder.stop();
        };

        const tick = () => {
            if (recorder.state !== "recording") {
                context.close().catch(() => { });
                return;
            }
            analyser.getByteTimeDomainData(samples);
            let sum = 0;
            for (let index = 0; index < samples.length; index += 1) {
                const value = (samples[index] - 128) / 128;
                sum += value * value;
            }
            const rms = Math.sqrt(sum / samples.length);
            const now = Date.now();

            setOrbLevel(Math.min(1, rms * 7));
            if (rms > SPEECH_RMS) {
                meta.spoke = true;
                quietSince = now;
            }
            if (meta.spoke && now - quietSince > SILENCE_MS) return finish();
            if (!meta.spoke && now - startedAt > NO_SPEECH_MS) return finish();
            if (now - startedAt > MAX_RECORD_MS) return finish();
            requestAnimationFrame(tick);
            return undefined;
        };

        tick();
    }, [setOrbLevel]);

    const startListening = useCallback(async () => {
        if (busyRef.current || recorderRef.current) return;
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            setSaid(t("assistant.no_mic", "Браузери шумо микрофонро дастгирӣ намекунад. Матн нависед."));
            setShowKeyboard(true);
            return;
        }
        stopAudio();
        try {
            const stream = streamRef.current || await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const recorder = new MediaRecorder(stream);
            const chunks = [];
            const meta = { spoke: false };

            recorder.ondataavailable = (event) => {
                if (event.data?.size) chunks.push(event.data);
            };
            recorder.onstop = () => {
                recorderRef.current = null;
                setOrbLevel(0);
                const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
                if (meta.spoke && blob.size > 2000) {
                    transcribe(blob);
                } else {
                    setState("idle");
                    if (handsFreeRef.current) setTimeout(() => listenRef.current?.(), 300);
                }
            };

            recorderRef.current = recorder;
            recorder.start();
            setState("listening");
            watchSilence(stream, recorder, meta);
        } catch {
            setState("idle");
            handsFreeRef.current = false;
            setSaid(t("assistant.mic_denied", "Микрофон иҷозат надод. Дар браузер иҷозат диҳед ё матн нависед."));
            setShowKeyboard(true);
        }
    }, [setOrbLevel, stopAudio, t, transcribe, watchSilence]);

    const send = useCallback(async (rawText) => {
        const text = String(rawText || "").trim();
        if (!text || busyRef.current) return;
        busyRef.current = true;
        setInput("");
        setHeard(text);
        setState("thinking");

        let reply = "";
        try {
            const careerName = await currentCareerName();
            const { data } = await axios.post(
                `${API}/careers/assistant`,
                { message: text, lang, careerName },
                { timeout: 30000 },
            );
            reply = data?.reply || t("assistant.no_reply", "Мебахшед, нафаҳмидам. Бори дигар бигӯед.");
            setSaid(reply);
            await runAction(data?.action, data?.params);
        } catch {
            reply = t("assistant.failed", "Алоқа бо сервер нест. Backend-ро санҷед.");
            setSaid(reply);
        }

        await speak(reply);
        busyRef.current = false;
        setState("idle");
        if (handsFreeRef.current) startListening();
    }, [currentCareerName, lang, runAction, speak, startListening, t]);

    useEffect(() => {
        sendRef.current = send;
        listenRef.current = startListening;
    }, [send, startListening]);

    // Як пахш — баъд ҳама чиз бо овоз меравад.
    const startConversation = useCallback(async () => {
        unlockAudio();
        setStarted(true);
        handsFreeRef.current = true;
        setSaid(greeting);
        await speak(greeting);
        startListening();
    }, [greeting, speak, startListening, unlockAudio]);

    const resumeConversation = useCallback(() => {
        unlockAudio();
        handsFreeRef.current = true;
        startListening();
    }, [startListening, unlockAudio]);

    const stopConversation = useCallback(() => {
        handsFreeRef.current = false;
        releaseMic();
        stopAudio();
        setState("idle");
    }, [releaseMic, stopAudio]);

    const close = useCallback(() => {
        stopConversation();
        setOpen(false);
    }, [stopConversation]);

    // Панел кушода шуд ва сӯҳбат аллакай сар шуда буд — худаш боз гӯш мекунад.
    useEffect(() => {
        if (open && started && !handsFreeRef.current && !busyRef.current) {
            resumeConversation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => () => {
        handsFreeRef.current = false;
        releaseMic();
        stopAudio();
        stopPulse();
    }, [releaseMic, stopAudio, stopPulse]);

    const statusText = {
        listening: t("assistant.state_listening", "Гӯш карда истодаам"),
        thinking: t("assistant.state_thinking", "Фикр карда истодаам"),
        speaking: t("assistant.state_speaking", "Гап зада истодаам"),
        idle: t("assistant.state_idle", "Тайёрам"),
    }[state];

    const active = state === "listening" || state === "speaking";
    const glow = {
        listening: "from-sky-400 to-primary",
        thinking: "from-amber-400 to-orange-500",
        speaking: "from-emerald-400 to-teal-500",
        idle: "from-primary to-sky-500",
    }[state];

    return (
        <>
            {open && (
                <div className="fixed inset-x-4 bottom-24 z-[60] mx-auto w-auto max-w-[23rem] overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)] sm:inset-x-auto sm:right-5 sm:w-[23rem]">
                    <button
                        type="button"
                        onClick={close}
                        aria-label={t("assistant.close", "Пӯшидан")}
                        className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground focus-ring"
                    >
                        <X className="h-4 w-4" aria-hidden />
                    </button>

                    <div className="flex flex-col items-center px-6 pb-6 pt-9">
                        <div className="relative flex h-[7.5rem] w-[7.5rem] items-center justify-center">
                            {active && (
                                <span className={`absolute inset-0 animate-ping rounded-full bg-gradient-to-br ${glow} opacity-20`} />
                            )}
                            <span
                                ref={orbRef}
                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${glow} opacity-50 blur-xl`}
                                style={{ willChange: "transform, opacity" }}
                            />
                            <div className={`relative h-[6.5rem] w-[6.5rem] overflow-hidden rounded-full bg-gradient-to-br ${glow} p-[3px]`}>
                                <div className="h-full w-full overflow-hidden rounded-full bg-card">
                                    <img
                                        src="/persona.jpg"
                                        alt=""
                                        width={104}
                                        height={104}
                                        className="h-full w-full scale-[1.12] object-cover object-[50%_32%]"
                                        onError={(event) => { event.currentTarget.src = "/logo.png"; }}
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="mt-5 text-[13px] font-semibold text-muted-foreground" aria-live="polite">
                            {statusText}
                        </p>

                        {heard && started && (
                            <p className="mt-4 w-full truncate text-center text-[13px] text-muted-foreground">
                                «{heard}»
                            </p>
                        )}

                        <p className="mt-2 min-h-[3.5rem] text-center text-[16px] leading-relaxed text-foreground">
                            {started ? said : greeting}
                        </p>

                        {voiceWarning && (
                            <p className="mt-1 text-center text-[12px] text-muted-foreground">
                                {t("assistant.voice_off", "Овоз нарасид — матнро хонед")}
                            </p>
                        )}

                        {!started ? (
                            <>
                                <button
                                    type="button"
                                    onClick={startConversation}
                                    className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full bg-primary py-3.5 text-[15px] font-bold text-primary-foreground focus-ring"
                                >
                                    <Mic className="h-5 w-5" aria-hidden />
                                    {t("assistant.start", "Сӯҳбатро сар кунед")}
                                </button>
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    {QUICK_ACTIONS.map((action) => (
                                        <button
                                            key={action.key}
                                            type="button"
                                            onClick={() => {
                                                unlockAudio();
                                                setStarted(true);
                                                handsFreeRef.current = true;
                                                send(t(`assistant.quick.${action.key}`, action.text));
                                            }}
                                            className="rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground focus-ring"
                                        >
                                            {t(`assistant.quick.${action.key}`, action.text)}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="mt-5 flex w-full items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => (handsFreeRef.current ? stopConversation() : resumeConversation())}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[15px] font-bold focus-ring ${
                                        handsFreeRef.current
                                            ? "border border-border text-foreground"
                                            : "bg-primary text-primary-foreground"
                                    }`}
                                >
                                    {handsFreeRef.current
                                        ? <><Square className="h-4 w-4" aria-hidden />{t("assistant.stop", "Истодан")}</>
                                        : <><Mic className="h-4 w-4" aria-hidden />{t("assistant.resume", "Давом додан")}</>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowKeyboard((old) => !old)}
                                    aria-label={t("assistant.keyboard", "Бо матн навиштан")}
                                    className="shrink-0 rounded-full border border-border p-3 text-muted-foreground focus-ring"
                                >
                                    <Keyboard className="h-4 w-4" aria-hidden />
                                </button>
                            </div>
                        )}

                        {showKeyboard && (
                            <form
                                onSubmit={(event) => { event.preventDefault(); send(input); }}
                                className="mt-3 flex w-full items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    placeholder={t("assistant.placeholder", "Нависед…")}
                                    aria-label={t("assistant.placeholder", "Нависед…")}
                                    className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    aria-label={t("assistant.send", "Фиристодан")}
                                    className="shrink-0 rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-40 focus-ring"
                                >
                                    <Send className="h-4 w-4" aria-hidden />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={() => (open ? close() : setOpen(true))}
                aria-label={t("assistant.title", "Ёвари овозӣ")}
                className="fixed bottom-6 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(15,23,42,0.5)] focus-ring"
            >
                {open ? <X className="h-6 w-6" aria-hidden /> : <Mic className="h-6 w-6" aria-hidden />}
            </button>
        </>
    );
}
