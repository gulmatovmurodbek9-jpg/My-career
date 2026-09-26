import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Keyboard, Mic, Send, Square, X } from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";
import { RealtimeStt } from "./realtimeStt";
import { guideFor, splitForSpeech } from "./pageGuide";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";

const Avatar3D = lazy(() => import("./Avatar3D"));

const GREETED_KEY = "assistant_greeted_v1";

// Версияи овоз дар URL. Браузер садоро нигоҳ медорад — агар моделро иваз
// кунем, ин рақамро зиёд кунед, вагарна корбар садои кӯҳнаро мешунавад.
const VOICE_VERSION = "murod-2";

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
    const { theme, toggleTheme } = useTheme();

    const [open, setOpen] = useState(false);
    const [started, setStarted] = useState(false);
    const [heard, setHeard] = useState("");
    // Самтҳое, ки ёвар пешниҳод кард («духтури дандон», …) — ҷавоби навбатӣ
    // аз байни инҳо интихоб мешавад.
    const [options, setOptions] = useState([]);
    const optionsRef = useRef([]);
    const [said, setSaid] = useState("");
    const [input, setInput] = useState("");
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [state, setState] = useState("idle");
    const [voiceWarning, setVoiceWarning] = useState(false);

    const playerRef = useRef(null);
    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const handsFreeRef = useRef(false);
    // Тугма бояд аз ҳолати React хонад: тағйири ref экранро аз нав намекашад
    // ва тугма «Истодан» нишон медод, вақте ёвар аслан кор намекард.
    const [handsFree, setHandsFree] = useState(false);
    const busyRef = useRef(false);
    const sendRef = useRef(null);
    const orbRef = useRef(null);
    const levelRef = useRef(0);
    const pulseRef = useRef(0);
    const listenRef = useRef(null);
    const sttRef = useRef(null);
    const greetedAloudRef = useRef(false);
    const greetRef = useRef(null);
    const speakDoneRef = useRef(null);
    // Кадом саҳифаҳо аллакай муаррифӣ шудаанд — ҳар кадомаш як бор.
    const spokenGuidesRef = useRef(new Set());
    const speakGuideRef = useRef(null);
    const realtimeFailedRef = useRef(0);
    const startingRef = useRef(false);
    const quickDropsRef = useRef(0);

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
        // Браузер садоро то пахши корбар манъ мекунад. Пас бо пахши аввал
        // дар ҳар ҷои саҳифа салом медиҳем — ба ҷуз худи панел, ки тугмаи
        // худашро дорад.
        const onGesture = (event) => {
            if (event?.target?.closest?.("[data-voice-panel]")) return;
            cleanup();
            greetRef.current?.();
        };
        const cleanup = () => {
            document.removeEventListener("pointerdown", onGesture, true);
            document.removeEventListener("keydown", onGesture, true);
        };

        const timer = setTimeout(() => {
            setOpen(true);
            try {
                sessionStorage.setItem(GREETED_KEY, "1");
            } catch {
                /* режими пинҳонӣ */
            }
            document.addEventListener("pointerdown", onGesture, true);
            document.addEventListener("keydown", onGesture, true);

            // Агар браузер аллакай иҷозат дода бошад (корбар пештар дар сайт
            // садо шунида бошад), фавран гап мезанем.
            const probe = new Audio(SILENT_WAV);
            probe.play().then(() => {
                cleanup();
                greetRef.current?.();
            }).catch(() => undefined);
        }, 1200);

        return () => {
            clearTimeout(timer);
            cleanup();
        };
    }, []);

    const setOrbLevel = useCallback((value) => {
        const level = Math.max(0, Math.min(1, value));
        levelRef.current = level;
        const node = orbRef.current;
        if (!node) return;
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
            player.onerror = null;
            player.pause();
        }
        const done = speakDoneRef.current;
        speakDoneRef.current = null;
        done?.(true);
    }, []);

    const unlockAudio = useCallback(() => {
        if (playerRef.current) return;
        const player = new Audio(SILENT_WAV);
        player.play().catch(() => { });
        playerRef.current = player;
    }, []);

    // Аввал овози МУРОД аз сервер; агар нашавад — овози браузер.
    // Ваъда вақте иҷро мешавад, ки садо тамом шуд — то баъдаш гӯш сар шавад.
    // Ваъда бо true иҷро мешавад, агар садо қатъ шуда бошад (стоп ё хато) —
    // он гоҳ ҷумлаҳои боқимонда гуфта намешаванд.
    const speakOne = useCallback((text) => new Promise((resolve) => {
        stopAudio();
        setState("speaking");
        startPulse();

        let settled = false;
        const finish = (interrupted = false) => {
            if (settled) return;
            settled = true;
            if (speakDoneRef.current === finish) speakDoneRef.current = null;
            stopPulse();
            resolve(interrupted);
        };
        speakDoneRef.current = finish;
        // Овози браузер русист ва тоҷикиро вайрон мехонад —
        // беҳтар аст хомӯш монем ва матнро нишон диҳем.
        const fallback = () => {
            if (settled) return;
            setVoiceWarning(true);
            finish(true);
        };

        const player = playerRef.current || new Audio();
        playerRef.current = player;
        player.onended = () => finish(false);
        player.onerror = fallback;
        player.src = `${API}/voice/speak?text=${encodeURIComponent(text)}&v=${VOICE_VERSION}`;
        player.play().then(() => setVoiceWarning(false)).catch(fallback);

        // Суғурта: агар садо ба ягон сабаб на тамом шавад, на хато диҳад,
        // ёвар набояд то абад интизор монад. 25 сония — аз ҳар ҷумла дарозтар.
        setTimeout(() => finish(false), 25000);
    }), [startPulse, stopAudio, stopPulse]);

    // Матни дарозро ҷумла-ҷумла мегӯем: ҷумлаи аввал зуд тайёр мешавад ва
    // дар вақти гуфтанаш сервер ҷумлаи навбатиро месозад — интизорӣ нест.
    const speak = useCallback(async (text) => {
        if (!text) return;
        const chunks = splitForSpeech(text);
        const prefetch = (chunk) => fetch(`${API}/voice/speak?text=${encodeURIComponent(chunk)}&v=${VOICE_VERSION}`)
            .then((response) => response.arrayBuffer())
            .catch(() => { });

        let next = null;
        for (let index = 0; index < chunks.length; index += 1) {
            if (next) await next;
            next = chunks[index + 1] ? prefetch(chunks[index + 1]) : null;
            const interrupted = await speakOne(chunks[index]);
            if (interrupted) return;
        }
    }, [speakOne]);

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

    // Муаррифии ихтисос аз база (~20 мс). Ҳар ихтисос дар сессия як бор;
    // агар саҳифа ихтисос набошад ё аллакай гуфта шуда бошад — null.
    const careerBrief = useCallback(async (path) => {
        const match = path.match(/^\/info\/([^/]+)$/);
        const id = match && `career:${match[1]}`;
        if (!id || spokenGuidesRef.current.has(id)) return null;
        spokenGuidesRef.current.add(id);
        try {
            const { data } = await axios.get(`${API}/careers/${match[1]}/brief`, { timeout: 5000 });
            return data?.text || null;
        } catch {
            return null;
        }
    }, []);

    const runAction = useCallback(async (action, params) => {
        const offered = action === "choose_direction" && Array.isArray(params?.options) ? params.options : [];
        optionsRef.current = offered;
        setOptions(offered);
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
            case "nearest_universities":
                // ?near=1 — харита худаш ҷойгиршавиро меҷӯяд.
                navigate("/universities?near=1");
                break;
            case "open_cluster":
                navigate(params?.id ? `/careers?clusterId=${params.id}` : "/careers");
                break;
            case "open_chat":
                navigate("/dashboard/ai-chat");
                break;
            case "open_favorites":
                navigate("/favorites");
                break;
            case "open_about":
                navigate("/about");
                break;
            case "go_home":
                navigate("/");
                break;
            case "set_language":
                if (params?.lang) i18n.changeLanguage(params.lang);
                break;
            case "set_theme":
                if (params?.theme && params.theme !== theme) toggleTheme();
                break;
            default:
                break;
        }
    }, [navigate, token, theme, toggleTheme, i18n]);

    const releaseMic = useCallback(() => {
        sttRef.current?.stop();
        sttRef.current = null;
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
        } catch (error) {
            // Лимит ё калид — боз гӯш кардан бефоида аст; ошкоро мегӯем.
            if (error?.response?.status === 503) {
                handsFreeRef.current = false;
                setHandsFree(false);
                setState("idle");
                setSaid(error.response.data?.message || "Шинохти нутқ ҳозир кор намекунад. Матн нависед.");
                setShowKeyboard(true);
                return;
            }
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

    const startRecording = useCallback(async () => {
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
            handsFreeRef.current = false; setHandsFree(false);
            setSaid(t("assistant.mic_denied", "Микрофон иҷозат надод. Дар браузер иҷозат диҳед ё матн нависед."));
            setShowKeyboard(true);
        }
    }, [setOrbLevel, stopAudio, t, transcribe, watchSilence]);

    // Шинохти ҷараёнӣ: матн ҳангоми гап задан меояд, на баъди он.
    // Агар нашавад, як бор қайд мекунем ва дигар кӯшиш намекунем.
    const openListening = useCallback(async () => {
        // Realtime як бор нашуд — 30 сония бо роҳи захиравӣ, баъд боз кӯшиш.
        if (realtimeFailedRef.current && Date.now() - realtimeFailedRef.current > 30000) {
            realtimeFailedRef.current = 0;
        }

        if (!realtimeFailedRef.current) {
            stopAudio();
            try {
                const openedAt = Date.now();
                const stt = new RealtimeStt({
                    lang,
                    onPartial: (text) => {
                        quickDropsRef.current = 0;
                        setHeard(text);
                    },
                    onLevel: (rms) => setOrbLevel(Math.min(1, rms * 7)),
                    onFinal: (text) => {
                        if (!text || busyRef.current || !handsFreeRef.current) return;
                        stt.stop();
                        sttRef.current = null;
                        setOrbLevel(0);
                        sendRef.current?.(text);
                    },
                    onError: () => {
                        sttRef.current = null;
                        setState("idle");
                        // Пайваст худ ба худ канда шуд (шабака, мӯҳлати токен) —
                        // агар корбар ҳанӯз дар сӯҳбат бошад, аз нав мепайвандем.
                        // Агар пайваст фавран канда шавад, ҳар дафъа дертар:
                        // пештар ҳар 0.6 с токени нав мегирифт ва лимит дар чанд
                        // сония тамом мешуд — микрофон «гӯш мекард», вале намешунид.
                        if (Date.now() - openedAt < 4000) quickDropsRef.current += 1;
                        else quickDropsRef.current = 0;
                        if (quickDropsRef.current >= 4) {
                            quickDropsRef.current = 0;
                            handsFreeRef.current = false;
                            setHandsFree(false);
                            setSaid(t("assistant.mic_lost", "Пайвасти микрофон канда шуд. Тугмаи микрофонро боз пахш кунед."));
                            return;
                        }
                        if (handsFreeRef.current && !busyRef.current) {
                            setTimeout(() => listenRef.current?.(), 600 * 2 ** quickDropsRef.current);
                        }
                    },
                });
                await stt.start();
                sttRef.current = stt;
                setState("listening");
                return;
            } catch (error) {
                console.warn("Realtime STT:", error?.message || error);
                realtimeFailedRef.current = Date.now();
                sttRef.current = null;
            }
        }

        await startRecording();
    }, [lang, setOrbLevel, startRecording, stopAudio, t]);

    const startListening = useCallback(async () => {
        if (busyRef.current || sttRef.current?.active || recorderRef.current || startingRef.current) return;
        // Дар вақти гирифтани токен sttRef ҳанӯз холист — бе ин қуфл
        // watchdog ва onError якҷоя ду пайвасти ҷудо мекушоданд.
        startingRef.current = true;
        try {
            await openListening();
        } finally {
            startingRef.current = false;
        }
    }, [openListening]);

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
                { message: text, lang, careerName, options: optionsRef.current },
                { timeout: 30000 },
            );
            reply = data?.reply || t("assistant.no_reply", "Мебахшед, нафаҳмидам. Бори дигар бигӯед.");
            setSaid(reply);

            const before = window.location.pathname + window.location.hash;
            await runAction(data?.action, data?.params);
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Амал ба саҳифаи нав бурд — «Ана донишгоҳҳо»-и кӯтоҳ ба ҷои
            // муаррифии пурраи ҳамон саҳифа. Ду бор гап задан лозим нест.
            if (window.location.pathname + window.location.hash !== before) {
                const guide = guideFor(window.location.pathname, window.location.hash, !token);
                if (guide && !spokenGuidesRef.current.has(guide.id)) {
                    spokenGuidesRef.current.add(guide.id);
                    reply = guide.text;
                    setSaid(reply);
                } else {
                    const brief = await careerBrief(window.location.pathname);
                    if (brief) {
                        reply = brief;
                        setSaid(reply);
                    }
                }
            }
        } catch {
            reply = t("assistant.failed", "Алоқа бо сервер нест. Backend-ро санҷед.");
            setSaid(reply);
        }

        await speak(reply);
        busyRef.current = false;
        setState("idle");
        if (handsFreeRef.current) startListening();
    }, [careerBrief, currentCareerName, lang, runAction, speak, startListening, t, token]);

    // Муаррифии саҳифа: пеш аз гап задан микрофонро мебандем, вагарна ёвар
    // садои худашро мешунавад ва онро ҳамчун гапи корбар мефаҳмад.
    const speakGuide = useCallback(async (text) => {
        busyRef.current = true;
        releaseMic();
        setSaid(text);
        setHeard("");
        await speak(text);
        busyRef.current = false;
        setState("idle");
        if (handsFreeRef.current) startListening();
    }, [releaseMic, speak, startListening]);

    useEffect(() => {
        speakGuideRef.current = speakGuide;
    }, [speakGuide]);

    // Корбар худаш ба саҳифаи нав гузашт (тугма ё истинод) — муаррифӣ мекунем.
    // Агар ин кор аз ҷониби ёвар бошад, send() онро аллакай кардааст.
    useEffect(() => {
        if (!open || !started) return undefined;
        const guide = guideFor(location.pathname, location.hash, !token);

        if (!guide && /^\/info\//.test(location.pathname)) {
            let cancelled = false;
            const timer = setTimeout(async () => {
                if (busyRef.current || cancelled) return;
                const brief = await careerBrief(location.pathname);
                if (brief && !cancelled && !busyRef.current) speakGuideRef.current?.(brief);
            }, 700);
            return () => {
                cancelled = true;
                clearTimeout(timer);
            };
        }

        if (!guide || spokenGuidesRef.current.has(guide.id)) return undefined;

        const timer = setTimeout(() => {
            if (busyRef.current || spokenGuidesRef.current.has(guide.id)) return;
            spokenGuidesRef.current.add(guide.id);
            speakGuideRef.current?.(guide.text);
        }, 700);
        return () => clearTimeout(timer);
    }, [careerBrief, location.pathname, location.hash, open, started, token]);

    useEffect(() => {
        sendRef.current = send;
        listenRef.current = startListening;
    }, [send, startListening]);

    // Як пахш — баъд ҳама чиз бо овоз меравад.
    const startConversation = useCallback(async () => {
        unlockAudio();
        setStarted(true);
        handsFreeRef.current = true; setHandsFree(true);
        setSaid(greeting);
        if (!greetedAloudRef.current) {
            greetedAloudRef.current = true;
            spokenGuidesRef.current.add("home");
            await speak(greeting);
        }
        startListening();
    }, [greeting, speak, startListening, unlockAudio]);

    // Саломи худкор: танҳо садо, микрофонро намекушоем — бе хости корбар
    // браузер иҷозати микрофон мепурсад, ки халал мерасонад.
    useEffect(() => {
        greetRef.current = () => {
            if (greetedAloudRef.current || handsFreeRef.current) return;
            greetedAloudRef.current = true;
            spokenGuidesRef.current.add("home");
            unlockAudio();
            speak(greeting).then(() => setState("idle"));
        };
    }, [greeting, speak, unlockAudio]);

    const resumeConversation = useCallback(() => {
        unlockAudio();
        // «Давом додан» ҳамеша бояд кор кунад: ҳар ҳолати кӯҳнаро тоза мекунем,
        // ҳатто агар ягон дархости пешина ҳанӯз овезон бошад.
        stopAudio();
        sttRef.current?.stop();
        sttRef.current = null;
        busyRef.current = false;
        handsFreeRef.current = true; setHandsFree(true);
        startListening();
    }, [startListening, stopAudio, unlockAudio]);

    // Посбон: агар ёвар дар сӯҳбат бошад, вале ҳеҷ кор накунад — на гӯш,
    // на фикр, на гап — пас ягон роҳ канда шудааст. Худаш аз нав гӯш мекунад.
    useEffect(() => {
        if (state !== "idle") return undefined;
        const timer = setTimeout(() => {
            if (handsFreeRef.current && !busyRef.current && !sttRef.current?.active && !recorderRef.current) {
                listenRef.current?.();
            }
        }, 2500);
        return () => clearTimeout(timer);
    }, [state]);

    const stopConversation = useCallback(() => {
        handsFreeRef.current = false; setHandsFree(false);
        releaseMic();
        stopAudio();
        busyRef.current = false;
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
        handsFreeRef.current = false; setHandsFree(false);
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

    const glow = {
        listening: "from-sky-400 to-primary",
        thinking: "from-amber-400 to-orange-500",
        speaking: "from-emerald-400 to-teal-500",
        idle: "from-primary to-sky-500",
    }[state];

    return (
        <>
            {open && (
                <div data-voice-panel className="fixed inset-x-4 bottom-24 z-[60] mx-auto w-auto max-w-[26rem] overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)] sm:inset-x-auto sm:right-5 sm:w-[26rem]">
                    <button
                        type="button"
                        onClick={close}
                        aria-label={t("assistant.close", "Пӯшидан")}
                        className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground focus-ring"
                    >
                        <X className="h-4 w-4" aria-hidden />
                    </button>

                    <div className="flex flex-col items-center px-6 pb-6 pt-9">
                        <div className="relative h-[15rem] w-full">
                            <span
                                ref={orbRef}
                                className={`pointer-events-none absolute inset-x-8 bottom-2 top-10 rounded-full bg-gradient-to-br ${glow} opacity-30 blur-3xl`}
                                style={{ willChange: "transform, opacity" }}
                            />
                            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-[1.25rem] bg-muted/40" />}>
                                <Avatar3D state={state} levelRef={levelRef} />
                            </Suspense>
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

                        {options.length > 0 && started && (
                            <div className="mt-2 flex flex-wrap justify-center gap-2">
                                {options.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            // Садоро қатъ мекунем ва рост мекушоем; муаррифии
                                            // ихтисосро эффекти саҳифа худаш мегӯяд.
                                            stopAudio();
                                            optionsRef.current = [];
                                            setOptions([]);
                                            navigate(`/info/${option.id}`);
                                        }}
                                        className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-[13px] font-semibold text-foreground focus-ring"
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}

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
                                                handsFreeRef.current = true; setHandsFree(true);
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
                                    onClick={() => (handsFree ? stopConversation() : resumeConversation())}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[15px] font-bold focus-ring ${
                                        handsFree
                                            ? "border border-border text-foreground"
                                            : "bg-primary text-primary-foreground"
                                    }`}
                                >
                                    {handsFree
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
                data-voice-panel
                className="fixed bottom-6 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(15,23,42,0.5)] focus-ring"
            >
                {open ? <X className="h-6 w-6" aria-hidden /> : <Mic className="h-6 w-6" aria-hidden />}
            </button>
        </>
    );
}
