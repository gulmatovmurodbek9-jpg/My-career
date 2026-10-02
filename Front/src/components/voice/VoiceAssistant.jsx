import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Keyboard, Mic, Send, Square, X } from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";
import { prefetchSttToken, RealtimeStt } from "./realtimeStt";
import { getGrade, setGrade } from "../../lib/grade";
import { voiceLog } from "./voiceLog";
import { guideFor, splitForSpeech } from "./pageGuide";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";

const Avatar3D = lazy(() => import("./Avatar3D"));

const GREETED_KEY = "assistant_greeted_v1";

// Версияи овоз дар URL. Браузер садоро нигоҳ медорад — агар моделро иваз
// кунем, ин рақамро зиёд кунед, вагарна корбар садои кӯҳнаро мешунавад.
// murod-7: овози ru (Piper Ruslan) ва en (Kokoro) — кеши браузери кӯҳна дигар дода намешавад.
const VOICE_VERSION = "murod-7";

// Садо аввал бо fetch гирифта мешавад: агар сервер «банд» (503 TTS_BUSY) ё «дер шуд»
// (504 TTS_TIMEOUT) гӯяд, корбар паёми фаҳмо мебинад, на «овоз нарасид»-и умумӣ.
// Ҷумлаи навбатӣ дар вақти гуфтани ҷумлаи ҷорӣ ҳамин тавр пешакӣ гирифта мешавад.
const voiceUrl = (text, lang) => `${API}/voice/speak?text=${encodeURIComponent(text)}&lang=${lang}&v=${VOICE_VERSION}`;
const fetchVoice = (text, lang) => fetch(voiceUrl(text, lang)).then(async (response) => {
    if (!response.ok) {
        let code = "";
        try { code = (await response.json())?.code || ""; } catch { /* JSON нест */ }
        const error = new Error("voice");
        error.code = code === "TTS_BUSY" ? "busy" : code === "TTS_TIMEOUT" ? "slow" : "off";
        throw error;
    }
    return URL.createObjectURL(await response.blob());
});

// Браузер садоро танҳо баъди пахши корбар иҷозат медиҳад. Ҳамин файли хомӯшро
// дар пахши аввал мешунавонем ва баъд ҳамон элементро дубора кор мефармоем.
const SILENT_WAV =
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

const SPEECH_RMS = 0.035;      // аз ин баланд — яъне гап зада истодааст
// ── Санҷиш бо овоз ──────────────────────────────────────────────
// Ёвар саволро бо ҷавобҳо мехонад; корбар рақам, ҳарф ё худи ҷавобро мегӯяд.
const QUIZ_ORDINALS = {
    tj: ["Якум", "Дуюм", "Сеюм", "Чорум", "Панҷум"],
    ru: ["Первый", "Второй", "Третий", "Четвёртый", "Пятый"],
    en: ["One", "Two", "Three", "Four", "Five"],
};
const QUIZ_HEAD = { tj: "Саволи", ru: "Вопрос", en: "Question" };
const QUIZ_HINT = {
    tj: "Рақам ё ҷавобро гӯед. Агар ҷавоби шумо дар рӯйхат набошад, онро бо суханони худ гӯед.",
    ru: "Назовите номер или ответ. Если вашего ответа нет в списке, скажите его своими словами.",
    en: "Say the number or the answer. If your answer is not listed, say it in your own words.",
};
const quizSpeech = (quiz, lang) => {
    const ord = QUIZ_ORDINALS[lang] || QUIZ_ORDINALS.tj;
    const clean = (value) => String(value || "").replace(/[«»"“”]/g, "").replace(/[.!?…\s]+$/, "").trim();
    const asked = String(quiz.question || "").trim();
    // step < 0 — саволи пеш аз санҷиш («баъди кадом синф?»), рақам надорад.
    const head = quiz.step >= 0 ? `${QUIZ_HEAD[lang] || QUIZ_HEAD.tj} ${quiz.step + 1}. ` : "";
    const parts = [
        `${head}${clean(asked)}${/\?$/.test(asked) ? "?" : "."}`,
        ...quiz.options.map((option, index) => `${ord[index] || index + 1}: ${clean(option)}.`),
    ];
    if (quiz.step === 0) parts.push(QUIZ_HINT[lang] || QUIZ_HINT.tj);
    return parts.join(" ");
};

const foldQuiz = (value) => String(value || "").toLowerCase()
    .replace(/ё/g, "е").replace(/ӣ/g, "и").replace(/ӯ/g, "у").replace(/ҳ/g, "х")
    .replace(/ҷ/g, "ч").replace(/қ/g, "к").replace(/ғ/g, "г")
    .replace(/[^a-zа-я0-9\s]/g, " ").replace(/\s+/g, " ").trim();
// Решаҳои рақами тартибӣ (ҳар се забон) ва ҳарфҳо — ба тартиби экран A–E.
const QUIZ_PICK = [
    ["якум", "як", "1", "перв", "один", "одна", "first", "one", "a", "а", "эй"],
    ["дуюм", "ду", "2", "втор", "два", "две", "second", "two", "b", "б", "бэ", "бе", "би"],
    ["сеюм", "се", "3", "трет", "три", "third", "three", "c", "ц", "цэ", "си", "с"],
    ["чорум", "чор", "4", "четв", "четыр", "fourth", "four", "d", "д", "дэ", "де", "ди"],
    ["панчум", "панч", "5", "пят", "fifth", "five", "e", "е", "э", "и"],
];
// Инҳо танҳо пурра мувофиқ меоянд, на ҳамчун аввали калима («се» ≠ «сегодня»).
const QUIZ_EXACT = new Set(["як", "ду", "се", "чор", "панч", "a", "а", "b", "б", "c", "ц", "с", "d", "д", "e", "е", "э", "и",
    "1", "2", "3", "4", "5", "бе", "би", "си", "де", "ди", "дэ", "бэ", "цэ", "эй", "one", "two", "three", "four", "five",
    "один", "одна", "два", "две", "три"]);
const QUIZ_FILLER = new Set(["вариант", "ответ", "номер", "чавоби", "чавоб", "раками", "раками", "option", "answer",
    "number", "letter", "буква", "харфи", "мой", "мне", "я", "выбираю", "интихоб", "мекунам", "the", "is", "it", "ин",
    "это", "ман", "please", "пожалуйста"]);

const matchQuizCommand = (text, quiz) => {
    const folded = foldQuiz(text);
    if (!folded) return null;
    const words = folded.split(" ");
    // Саволи синф: «баъди синфи 9», «после одиннадцатого» — аз рӯи рақам, на калимаҳои умумӣ.
    if (quiz.id === "grade") {
        if (/(^|\D)11(\D|$)|ездах|одиннадцат|eleven/.test(folded)) return { type: "answer", position: 1 };
        if (/(^|\D)9(\D|$)|нух|девят|ninth|nine/.test(folded)) return { type: "answer", position: 0 };
    }
    if (/(повтор|repeat|again|такрор|боз хон)/.test(folded) && words.length <= 4) return { type: "repeat" };
    if (/^(далее|дальше|следующ|next|навбати|баъди|бади)/.test(folded) && words.length <= 3) return { type: "next" };
    if (/^(назад|предыдущ|back|previous|кабли|ба кафо)/.test(folded) && words.length <= 3) return { type: "back" };

    // Рақам ё ҳарф: ибораи кӯтоҳ («второй», «вариант Б», «ҷавоби сеюм»).
    const meaningful = words.filter((word) => !QUIZ_FILLER.has(word));
    if (meaningful.length >= 1 && meaningful.length <= 2) {
        for (const word of meaningful) {
            const position = QUIZ_PICK.findIndex((stems) => stems.some((stem) =>
                (QUIZ_EXACT.has(stem) ? word === stem : word.startsWith(stem))));
            if (position >= 0 && position < quiz.options.length) return { type: "answer", position };
        }
    }

    // Худи матни ҷавоб: калимаҳои муҳим (≥ 4 ҳарф) бо 5 ҳарфи аввал муқоиса мешаванд.
    const said = new Set(words.filter((word) => word.length >= 4).map((word) => word.slice(0, 5)));
    if (said.size) {
        const scored = quiz.options.map((option, position) => {
            const keys = [...new Set(foldQuiz(option).split(" ").filter((word) => word.length >= 4).map((word) => word.slice(0, 5)))];
            const hits = keys.filter((key) => said.has(key)).length;
            return { position, score: keys.length ? hits / keys.length : 0, hits };
        }).sort((a, b) => b.score - a.score);
        const [best, second] = scored;
        // Ё аксари калимаҳои вариант, ё калимаи муҳиме, ки танҳо дар ҳамин вариант ҳаст («программирование»).
        const clear = best && best.hits >= 1 && (!second || second.hits === 0) && said.size <= 3;
        if (best && best.hits >= 1 && (clear || (best.score >= 0.4 && (!second || best.score - second.score >= 0.2)))) {
            return { type: "answer", position: best.position };
        }
    }
    // Ҷавоби озоди корбар («ман бештар дар бораи ҳайвонот мегуфтам») — AI варианти наздикро меёбад.
    return words.length >= 2 ? { type: "free", text } : null;
};

const SILENCE_MS = 750;        // ин қадар хомӯшӣ — яъне ҷумла тамом шуд
const NO_SPEECH_MS = 8000;     // чизе нагуфт — боз гӯш мекунем
const MAX_RECORD_MS = 15000;   // ҳадди аксар як навбат

// path: 145 — тугмаи саҳифае, ки корбар аллакай дар он аст, нишон дода намешавад.
const QUICK_ACTIONS = [
    { key: "careers", text: "Ихтисос интихоб кунам", path: "/careers" },
    { key: "universities", text: "Донишгоҳҳо", path: "/universities" },
    { key: "quiz", text: "Санҷиш", path: "/quiz" },
];

export default function VoiceAssistant() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuthStore();
    const { theme, toggleTheme } = useTheme();

    const [open, setOpen] = useState(false);
    const [started, setStarted] = useState(false);
    // Телефон: панели паст дар поёни экран, бе модели 3D — саҳифа намоён мемонад
    // ва панел фавран мекушояд (модели 3D дар телефон дер бор мешуд).
    const [isPhone, setIsPhone] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches,
    );
    useEffect(() => {
        const query = window.matchMedia("(max-width: 639px)");
        const update = () => setIsPhone(query.matches);
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);
    const [heard, setHeard] = useState("");
    // Самтҳое, ки ёвар пешниҳод кард («духтури дандон», …) — ҷавоби навбатӣ
    // аз байни инҳо интихоб мешавад.
    const [options, setOptions] = useState([]);
    const optionsRef = useRef([]);
    const [said, setSaid] = useState("");
    const [input, setInput] = useState("");
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [state, setState] = useState("idle");
    useEffect(() => {
        voiceLog("state", { state });
    }, [state]);
    const [voiceWarning, setVoiceWarning] = useState(false);
    // Браузер садоро бе клик манъ кард — тугмаи «Гӯш кардан» ва амали он.
    const [needTap, setNeedTap] = useState(false);
    const tapPlayRef = useRef(null);

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
    const lastSaidRef = useRef("");
    const quizRef = useRef(null);
    const quizReadRef = useRef("");
    const quizReadingRef = useRef(false);
    const startingRef = useRef(false);
    const quickDropsRef = useRef(0);

    const lang = i18n.language || "tj";
    // Садо: тоҷикӣ, русӣ ва англисӣ — ҳар забон модели худашро дорад.
    const voiceLang = lang === "ru" || lang === "en" ? lang : "tj";
    const voiceLangRef = useRef(voiceLang);
    voiceLangRef.current = voiceLang;
    const greeting = voiceLang === "ru"
        ? "Добро пожаловать! Я ваш помощник. Чем займёмся — выберем специальность, посмотрим университеты или пройдём тест?"
        : voiceLang === "en"
            ? "Hello! Welcome. I am your assistant. What shall we do: choose a specialty, look at universities, or take the test?"
            : "Хуш омадед! Ман ёвари шумо ҳастам. Чӣ кор кунем — ихтисос интихоб кунем, донишгоҳҳоро бинем, ё санҷиш гузарем?";

    // Бори аввал худаш кушода мешавад. Садо то пахши аввали корбар
    // намебарояд — ин қоидаи худи браузер аст.
    useEffect(() => {
        let greeted = false;
        try {
            // sessionStorage, на localStorage: ҳар кушодани нави браузер
            // боз салом медиҳад. Дар рӯзи намоиш ин муҳим аст.
            greeted = localStorage.getItem(GREETED_KEY) === "1";
        } catch {
            greeted = false;
        }
        if (greeted) return undefined;
        // Дар телефон панел қариб тамоми экранро мепӯшонд (ҷустуҷӯ, меню) ва дар
        // саҳифаҳои дигар ҳисобкунакҳоро — худкор танҳо дар саҳифаи асосӣ ва калон.
        if (window.location.pathname !== "/" || window.innerWidth < 768) return undefined;
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
                localStorage.setItem(GREETED_KEY, "1");
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
    const speakOne = useCallback((text, ready) => new Promise((resolve) => {
        stopAudio();
        setState("speaking");
        startPulse();

        let settled = false;
        let safety = null;
        let objectUrl = null;
        const finish = (interrupted = false) => {
            if (settled) return;
            settled = true;
            clearTimeout(safety);
            if (objectUrl) {
                const url = objectUrl;
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            if (speakDoneRef.current === finish) speakDoneRef.current = null;
            stopPulse();
            resolve(interrupted);
        };
        speakDoneRef.current = finish;
        // Овози браузер русист ва тоҷикиро вайрон мехонад —
        // беҳтар аст хомӯш монем ва матнро нишон диҳем.
        const fallback = (reason = "off") => {
            if (settled) return;
            setVoiceWarning(typeof reason === "string" ? reason : "off");
            finish(true);
        };

        const player = playerRef.current || new Audio();
        playerRef.current = player;
        player.onended = () => finish(false);
        player.onerror = () => fallback("off");
        const asked = Date.now();
        player.onplaying = () => voiceLog("play", { wait: Date.now() - asked, text: text.slice(0, 40) });
        const started = () => {
            setVoiceWarning(false);
            setNeedTap(false);
        };
        const playNow = () => player.play().then(started).catch((error) => {
            if (settled) return;
            voiceLog("play-error", { name: error?.name, message: String(error?.message || "").slice(0, 80) });
            // AbortError: садои дигар ин play()-ро қатъ кард — хато нест, як бори дигар.
            // Пештар ин ёварро то охири гап хомӯш мегузошт.
            if (error?.name === "AbortError") {
                setTimeout(() => {
                    if (!settled && playerRef.current === player) player.play().then(started).catch(fallback);
                }, 150);
                return;
            }
            // Браузер бе клики нав садо намедиҳад (Safari, телефонҳо, баъди навсозӣ) —
            // тугмаи «🔊 Гӯш кардан» нишон медиҳем; клик ҳамин садоро бозӣ мекунад.
            if (error?.name === "NotAllowedError") {
                tapPlayRef.current = () => player.play().then(started).catch(fallback);
                setNeedTap(true);
                return;
            }
            fallback();
        });

        (ready || fetchVoice(text, voiceLangRef.current))
            .then((url) => {
                if (settled || playerRef.current !== player) {
                    URL.revokeObjectURL(url);
                    return;
                }
                objectUrl = url;
                player.src = url;
                playNow();
            })
            .catch((error) => fallback(error?.code || "off"));

        // Суғурта: агар садо ба ягон сабаб на тамом шавад, на хато диҳад,
        // ёвар набояд то абад интизор монад. 40 сония — аз timeout-и сервер (30 с) ва ҳар ҷумла дарозтар.
        safety = setTimeout(() => finish(false), 40000);
    }), [startPulse, stopAudio, stopPulse]);

    // Матни дарозро ҷумла-ҷумла мегӯем: ҷумлаи аввал зуд тайёр мешавад ва
    // дар вақти гуфтанаш сервер ҷумлаи навбатиро месозад — интизорӣ нест.
    const speak = useCallback(async (text) => {
        if (!text) return;
        const chunks = splitForSpeech(text);
        const lang = voiceLangRef.current;

        // Ҷумлаи аввал фавран; навбатӣ дар вақти гуфтани ҷорӣ сохта мешавад.
        let next = null;
        for (let index = 0; index < chunks.length; index += 1) {
            const current = next || fetchVoice(chunks[index], lang);
            current.catch(() => { });
            next = chunks[index + 1] ? fetchVoice(chunks[index + 1], lang) : null;
            next?.catch(() => { });
            const interrupted = await speakOne(chunks[index], current);
            if (interrupted) {
                next?.then((url) => URL.revokeObjectURL(url)).catch(() => { });
                return;
            }
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
        const id = match && `career:${match[1]}:${voiceLangRef.current}`;
        if (!id || spokenGuidesRef.current.has(id)) return null;
        spokenGuidesRef.current.add(id);
        try {
            const { data } = await axios.get(`${API}/careers/${match[1]}/brief`, { params: { lang: voiceLangRef.current }, timeout: 5000 });
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
                // voice=1: ҷавоби саҳифа бо забони сайт; said: гуфтаи корбар дар сатри ҷустуҷӯ.
                const said = encodeURIComponent(lastSaidRef.current || "");
                navigate(query ? `/careers?ai=${encodeURIComponent(query)}&voice=1&said=${said}` : "/careers");
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
            case "set_grade":
                setGrade(Number(params?.grade) === 9 ? 9 : Number(params?.grade) === 11 ? 11 : null);
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

    // Ҳангоми гапи ёвар: пайвасти ҷараёниро дар таваққуф мегузорем, сабтро мебандем.
    const pauseMic = useCallback(() => {
        if (sttRef.current?.active) sttRef.current.pause();
        else releaseMic();
    }, [releaseMic]);

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
                        // «.» ва садои бе калима фармон нест — идома медиҳем гӯш кардан.
                        if (!/\p{L}{2,}/u.test(text)) {
                            voiceLog("ignored", { text });
                            return;
                        }
                        stt.pause();
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
                // Дар вақти гирифтани токен ёвар шояд ба гап сар карда бошад (муаррифии
                // саҳифа). Он гоҳ микрофон набояд шунавад — вагарна ёвар садои худашро
                // ҳамчун фармон мегирад («Анъанавии ҳаёти ҳақиқӣ…»).
                if (busyRef.current) {
                    stt.pause();
                    voiceLog("listen-paused-busy");
                    return;
                }
                setState("listening");
                return;
            } catch (error) {
                console.warn("Realtime STT:", error?.message || error);
                voiceLog("realtime-fail", { error: String(error?.message || error) });
                realtimeFailedRef.current = Date.now();
                sttRef.current = null;
            }
        }

        await startRecording();
    }, [lang, setOrbLevel, startRecording, stopAudio, t]);

    const startListening = useCallback(async () => {
        // Пайваст кушода ва дар таваққуф аст — фавран идома медиҳем.
        if (!busyRef.current && sttRef.current?.active && sttRef.current.paused) {
            sttRef.current.resume();
            setHeard("");
            setState("listening");
            voiceLog("resume");
            return;
        }
        if (busyRef.current || sttRef.current?.active || recorderRef.current || startingRef.current) {
            voiceLog("listen-skip", {
                busy: busyRef.current,
                active: !!sttRef.current?.active,
                recorder: !!recorderRef.current,
                starting: startingRef.current,
            });
            return;
        }
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
        // Матни навишташуда ҳам: то ёвар гап занад, микрофон набояд шунавад.
        pauseMic();
        setInput("");
        setHeard(text);
        setState("thinking");

        let reply = "";
        const asked = Date.now();
        // Дар санҷиш: «второй», «Б», худи ҷавоб, «далее», «повтори» — фавран, бе AI;
        // ҷавоби озод ба саҳифаи санҷиш меравад — он ба варианти наздиктарин мепайвандад.
        const quiz = window.location.pathname === "/quiz" ? quizRef.current : null;
        const quizCommand = quiz ? matchQuizCommand(text, quiz) : null;
        if (quizCommand) {
            voiceLog("quiz", { text: text.slice(0, 60), type: quizCommand.type, position: quizCommand.position });
            setHeard(text);
            busyRef.current = false;
            setState("idle");
            if (quizCommand.type === "repeat") {
                quizReadRef.current = "";
                window.dispatchEvent(new CustomEvent("quiz:question", { detail: quiz }));
            } else {
                window.dispatchEvent(new CustomEvent("quiz:command", { detail: quizCommand }));
            }
            // Саволи нав худаш хонда мешавад ва баъд микрофон кушода мешавад;
            // агар савол иваз нашавад (ҷавоби охирин), микрофонро худамон мекушоем.
            setTimeout(() => {
                if (!busyRef.current && handsFreeRef.current) startListening();
            }, quizCommand.type === "free" ? 6000 : 1500);
            return;
        }

        voiceLog("send", { text: text.slice(0, 80) });
        lastSaidRef.current = text;
        try {
            const careerName = await currentCareerName();
            const { data } = await axios.post(
                `${API}/careers/assistant`,
                { message: text, lang, careerName, options: optionsRef.current, grade: getGrade() },
                { timeout: 30000 },
            );
            voiceLog("reply", { ms: Date.now() - asked, action: data?.action });
            reply = data?.reply || t("assistant.no_reply", "Мебахшед, нафаҳмидам. Бори дигар бигӯед.");
            setSaid(reply);

            const before = window.location.pathname + window.location.hash;
            await runAction(data?.action, data?.params);
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Амал ба саҳифаи нав бурд — «Ана донишгоҳҳо»-и кӯтоҳ ба ҷои
            // муаррифии пурраи ҳамон саҳифа. Ду бор гап задан лозим нест.
            if (window.location.pathname + window.location.hash !== before) {
                const guide = guideFor(window.location.pathname, window.location.hash, !token, voiceLangRef.current);
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
    }, [careerBrief, currentCareerName, lang, pauseMic, runAction, speak, startListening, t, token]);

    // Муаррифии саҳифа: пеш аз гап задан микрофонро мебандем, вагарна ёвар
    // садои худашро мешунавад ва онро ҳамчун гапи корбар мефаҳмад.
    const speakGuide = useCallback(async (text) => {
        busyRef.current = true;
        pauseMic();
        setSaid(text);
        setHeard("");
        await speak(text);
        busyRef.current = false;
        setState("idle");
        if (handsFreeRef.current) startListening();
    }, [pauseMic, speak, startListening]);

    useEffect(() => {
        speakGuideRef.current = speakGuide;
    }, [speakGuide]);

    // Санҷиш: ҳар саволи нав бо ҷавобҳояш хонда мешавад — ҳатто вақте корбар
    // бо муш интихоб кард. Агар саволи пешина ҳоло хонда шавад, онро мебурем.
    useEffect(() => {
        if (!open || !started) return undefined;
        let timer = null;
        const read = (quiz, waited = 0) => {
            if (quizRef.current !== quiz) return;
            if (busyRef.current) {
                if (quizReadingRef.current) stopAudio();
                if (waited < 20000) timer = setTimeout(() => read(quiz, waited + 300), 300);
                return;
            }
            quizReadRef.current = `${quiz.id}|${quiz.lang}`;
            quizReadingRef.current = true;
            Promise.resolve(speakGuideRef.current?.(quizSpeech(quiz, voiceLangRef.current)))
                .finally(() => { quizReadingRef.current = false; });
        };
        const onQuestion = (event) => {
            const quiz = event.detail || null;
            quizRef.current = quiz;
            clearTimeout(timer);
            if (!quiz || quizReadRef.current === `${quiz.id}|${quiz.lang}`) return;
            read(quiz);
        };
        // Ҷавоби озоди гуфташуда ба вариант пайваст шуд (ё не) — ба корбар мегӯем.
        const onMatched = (event) => {
            const { position, option } = event.detail || {};
            const lang = voiceLangRef.current;
            const text = position === null || position === undefined
                ? { tj: "Ҷавобро ба ягон вариант пайваст карда натавонистам. Рақами вариантро гӯед ё бо сухани дигар гӯед.",
                    ru: "Не понял ответ. Назовите номер варианта или скажите иначе.",
                    en: "I could not match that. Say the option number or rephrase it." }[lang]
                : { tj: `Ҷавоби шумо ба ин наздик аст: ${option}. Қабул шуд.`,
                    ru: `Ближе всего: ${option}. Принято.`,
                    en: `Closest option: ${option}. Accepted.` }[lang];
            speakGuideRef.current?.(text);
        };
        window.addEventListener("quiz:question", onQuestion);
        window.addEventListener("quiz:matched", onMatched);
        if (window.__quizVoice) onQuestion({ detail: window.__quizVoice });
        return () => {
            clearTimeout(timer);
            window.removeEventListener("quiz:question", onQuestion);
            window.removeEventListener("quiz:matched", onMatched);
        };
    }, [open, started, stopAudio]);

    // Корбар худаш ба саҳифаи нав гузашт (тугма ё истинод) — муаррифӣ мекунем.
    // Агар ин кор аз ҷониби ёвар бошад, send() онро аллакай кардааст.
    // Агар ёвар ҳоло гап занад ё фикр кунад, муаррифӣ гум намешавад — интизор
    // мешавем (то 20 с), то ӯ озод шавад. Пештар дар ин ҳол муаррифӣ намешуд.
    useEffect(() => {
        if (!open || !started) return undefined;
        const guide = guideFor(location.pathname, location.hash, !token, voiceLang);
        // Муаррифии ихтисос аз база — бо се забон (тарҷумаҳои база).
        const isCareer = !guide && /^\/info\//.test(location.pathname);
        if (!guide && !isCareer) return undefined;
        if (guide && spokenGuidesRef.current.has(guide.id)) return undefined;

        let cancelled = false;
        let waited = 0;
        let timer = null;
        const attempt = async () => {
            if (cancelled) return;
            if (busyRef.current) {
                waited += 400;
                if (waited < 20000) timer = setTimeout(attempt, 400);
                return;
            }
            if (isCareer) {
                const brief = await careerBrief(location.pathname);
                if (brief && !cancelled) speakGuideRef.current?.(brief);
                return;
            }
            if (spokenGuidesRef.current.has(guide.id)) return;
            spokenGuidesRef.current.add(guide.id);
            speakGuideRef.current?.(guide.text);
        };
        timer = setTimeout(attempt, 700);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [careerBrief, location.pathname, location.hash, open, started, token, voiceLang]);

    useEffect(() => {
        sendRef.current = send;
        listenRef.current = startListening;
    }, [send, startListening]);

    // Як пахш — баъд ҳама чиз бо овоз меравад.
    const startConversation = useCallback(async () => {
        unlockAudio();
        // То салом тамом шавад, токен тайёр аст — микрофон фавран мекушояд.
        prefetchSttToken();
        setStarted(true);
        handsFreeRef.current = true; setHandsFree(true);
        setSaid(greeting);
        if (!greetedAloudRef.current) {
            greetedAloudRef.current = true;
            spokenGuidesRef.current.add(`home:${voiceLangRef.current}`);
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
            spokenGuidesRef.current.add(`home:${voiceLangRef.current}`);
            unlockAudio();
            speak(greeting).then(() => setState("idle"));
        };
    }, [greeting, speak, unlockAudio]);

    const resumeConversation = useCallback(() => {
        unlockAudio();
        prefetchSttToken();
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
                <div data-voice-panel className="no-print fixed inset-x-0 bottom-0 z-[60] max-h-[60dvh] overflow-y-auto overscroll-contain rounded-t-[1.5rem] border border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.35)] sm:inset-x-auto sm:bottom-24 sm:right-5 sm:mx-auto sm:w-[26rem] sm:max-h-[calc(100dvh-7.5rem)] sm:rounded-[1.75rem] sm:pb-0 sm:shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)]">
                    <button
                        type="button"
                        onClick={close}
                        aria-label={t("assistant.close", "Пӯшидан")}
                        className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground focus-ring"
                    >
                        <X className="h-4 w-4" aria-hidden />
                    </button>

                    <div className="flex flex-col items-center px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-9">
                        {isPhone ? (
                            <div className="flex w-full items-center gap-3 pr-8">
                                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                                    <span
                                        ref={orbRef}
                                        className={`pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br ${glow} opacity-60 blur-md`}
                                        style={{ willChange: "transform, opacity" }}
                                    />
                                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <Mic className="h-4 w-4" aria-hidden />
                                    </span>
                                </span>
                                <p className="text-[13px] font-semibold text-muted-foreground" aria-live="polite">
                                    {statusText}
                                </p>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}

                        {heard && started && (
                            <p className="mt-3 w-full truncate text-[13px] text-muted-foreground sm:mt-4 sm:text-center">
                                «{heard}»
                            </p>
                        )}

                        <p className="mt-2 max-h-[24dvh] w-full overflow-y-auto text-[15px] leading-relaxed text-foreground sm:max-h-none sm:min-h-[3.5rem] sm:text-center sm:text-[16px]">
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

                        {needTap && (
                            <button
                                type="button"
                                onClick={() => {
                                    setNeedTap(false);
                                    tapPlayRef.current?.();
                                    tapPlayRef.current = null;
                                }}
                                className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25"
                            >
                                🔊 {t("assistant.tap_to_listen", "Гӯш кардан")}
                            </button>
                        )}

                        {voiceWarning && (
                            <p className="mt-1 text-center text-[12px] text-muted-foreground" role="status">
                                {voiceWarning === "busy"
                                    ? t("assistant.voice_busy", "Ёвар ҳоло банд аст, каме интизор шавед.")
                                    : voiceWarning === "slow"
                                        ? t("assistant.voice_slow", "Овоз дер кард — матнро хонед.")
                                        : t("assistant.voice_off", "Овоз нарасид — матнро хонед")}
                            </p>
                        )}

                        {!started ? (
                            <>
                                <button
                                    type="button"
                                    onClick={startConversation}
                                    className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full bg-primary py-3.5 text-[15px] font-bold text-primary-foreground focus-ring sm:mt-5"
                                >
                                    <Mic className="h-5 w-5" aria-hidden />
                                    {t("assistant.start", "Сӯҳбатро сар кунед")}
                                </button>
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    {QUICK_ACTIONS.filter((action) => action.path !== location.pathname).map((action) => (
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
                            <div className="mt-4 flex w-full items-center gap-2 sm:mt-5">
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
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    unlockAudio();
                                    setStarted(true);
                                    send(input);
                                }}
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
                className={`no-print fixed bottom-6 right-5 z-[60] h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(15,23,42,0.5)] focus-ring ${open ? "hidden sm:flex" : "flex"}`}
            >
                {open ? <X className="h-6 w-6" aria-hidden /> : <Mic className="h-6 w-6" aria-hidden />}
            </button>
        </>
    );
}
