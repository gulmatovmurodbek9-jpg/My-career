import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic, MicOff, Send, Volume2, VolumeX, Bot, Sparkles,
    ArrowLeft, Loader2, Trash2, Languages, Copy, Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { API } from "../../lib/config";
import { Link } from "react-router";

const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const LANG_OPTIONS = [
    { code: "tj", label: "Тоҷикӣ", speechCode: "tg" },
    { code: "ru", label: "Русский", speechCode: "ru-RU" },
    { code: "en", label: "English", speechCode: "en-US" },
];

const VOICE_PREF_KEY = "mycareer_voice_uri";
const VOICE_FEATURE_ENABLED = true;

// Web Speech API — works in Chrome, Edge, Safari. Not supported in Firefox.
const SpeechRecognitionAPI =
    typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
const SPEECH_SUPPORTED = !!SpeechRecognitionAPI;

// BCP-47 codes for SpeechRecognition per UI language.
// Tajik Cyrillic is not a supported recognition locale, so we use ru-RU
// which handles Cyrillic script and code-switching common in TJ speech.
const LANG_TO_BCP47 = { tj: "ru-RU", ru: "ru-RU", en: "en-US" };

const splitSpeechText = (text, maxLength = 220) => {
    const clean = text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/#{1,4}\s*/g, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/^[-•]\s*/gm, "")
        .replace(/^\d+\.\s*/gm, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{2,}/g, ". ")
        .replace(/\n/g, ", ")
        .replace(/\s{2,}/g, " ")
        .trim();

    if (!clean) return [];

    const sentences = clean.match(/[^.!?。！？]+[.!?。！？]?/g) || [clean];
    const chunks = [];
    let current = "";

    sentences.forEach((sentence) => {
        const next = `${current} ${sentence}`.trim();
        if (next.length <= maxLength) {
            current = next;
            return;
        }
        if (current) chunks.push(current);
        if (sentence.length <= maxLength) {
            current = sentence.trim();
            return;
        }
        for (let i = 0; i < sentence.length; i += maxLength) {
            chunks.push(sentence.slice(i, i + maxLength).trim());
        }
        current = "";
    });

    if (current) chunks.push(current);
    return chunks.filter(Boolean);
};

/* ── markdown → html ── */
const renderMarkdown = (text) => {
    if (!text) return "";
    let html = text
        .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="ai-code-block"><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
        .replace(/### (.+)/g, '<h4 class="ai-h4">$1</h4>')
        .replace(/## (.+)/g, '<h3 class="ai-h3">$1</h3>')
        .replace(/# (.+)/g, '<h2 class="ai-h2">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^\d+\.\s+(.+)$/gm, '<li class="ai-ol-item">$1</li>')
        .replace(/^[-•]\s+(.+)$/gm, '<li class="ai-ul-item">$1</li>');
    // wrap consecutive li groups
    html = html.replace(/((?:<li class="ai-ul-item">.*?<\/li>\s*)+)/g, '<ul class="ai-ul">$1</ul>');
    html = html.replace(/((?:<li class="ai-ol-item">.*?<\/li>\s*)+)/g, '<ol class="ai-ol">$1</ol>');
    html = html.replace(/\n/g, "<br/>");
    return html;
};

/* ── Typewriter hook ── */
const useTypewriter = (text, isActive, speed = 12) => {
    const [displayed, setDisplayed] = useState(isActive ? "" : text);
    const [done, setDone] = useState(!isActive);
    const idx = useRef(0);

    useEffect(() => {
        if (!isActive) { setDisplayed(text); setDone(true); return; }
        setDisplayed(""); idx.current = 0; setDone(false);
        const id = setInterval(() => {
            idx.current += 1 + Math.floor(Math.random() * 2); // 1-2 chars at a time for natural feel
            if (idx.current >= text.length) {
                setDisplayed(text); setDone(true); clearInterval(id);
            } else {
                setDisplayed(text.slice(0, idx.current));
            }
        }, speed);
        return () => clearInterval(id);
    }, [text, isActive, speed]);

    return { displayed, done };
};

/* ── Single message bubble ── */
const MessageBubble = ({ msg, user, speakText, isSpeaking, speakingMsgId, voiceEnabled = true }) => {
    const isUser = msg.role === "user";
    const isNew = msg._isNew;
    const { displayed, done } = useTypewriter(msg.text, !isUser && isNew);
    const [copied, setCopied] = useState(false);

    const copyText = () => {
        navigator.clipboard.writeText(msg.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
            {/* Avatar */}
            {!isUser ? (
                <div className="flex-shrink-0 mb-5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary via-accent-blue to-primary p-[2px] shadow-lg shadow-primary/20">
                        <div className="w-full h-full rounded-[14px] bg-[hsl(var(--card))] flex items-center justify-center">
                            <Bot className="w-4.5 h-4.5 text-primary" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-shrink-0 mb-5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25">
                        <span className="text-[13px] font-black text-white">{user?.name?.charAt(0) || "У"}</span>
                    </div>
                </div>
            )}

            {/* Bubble */}
            <div className={`max-w-[82%] sm:max-w-[72%] group relative ${isUser ? "items-end" : "items-start"}`}>
                <div className={`relative px-4 py-3 text-[13.5px] leading-[1.65] ${
                    isUser
                        ? "bg-gradient-to-br from-primary to-violet-600 text-white rounded-[20px] rounded-br-[6px] shadow-xl shadow-primary/15"
                        : msg.isError
                        ? "bg-red-500/8 border border-red-500/15 text-red-300 rounded-[20px] rounded-bl-[6px] backdrop-blur-sm"
                        : "bg-[hsl(var(--card))]/80 border border-[hsl(var(--border))]/60 text-[hsl(var(--foreground))] rounded-[20px] rounded-bl-[6px] shadow-xl shadow-black/5 backdrop-blur-xl"
                }`}>
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                        <div className="ai-msg-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(displayed) }} />
                    )}
                    {!isUser && !done && (
                        <span className="inline-block w-[3px] h-[16px] bg-primary ml-0.5 rounded-full animate-pulse align-middle" />
                    )}
                </div>

                {/* Meta bar */}
                <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isUser ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]/40 font-semibold tabular-nums">
                        {formatTime(msg.time)}
                    </span>
                    {isUser && (
                        <svg className="w-3.5 h-3.5 text-primary/60" viewBox="0 0 16 16" fill="none">
                            <path d="M2 8.5L5.5 12L14 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5 8.5L8.5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                        </svg>
                    )}
                    {/* Actions for assistant */}
                    {voiceEnabled && !isUser && !msg.isError && done && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => speakText(msg.text, msg.id)} className="p-1 rounded-lg hover:bg-[hsl(var(--muted))]/60 transition-colors cursor-pointer" title="Баланд хондан">
                                {isSpeaking && speakingMsgId === msg.id
                                    ? <VolumeX className="w-3 h-3 text-primary" />
                                    : <Volume2 className="w-3 h-3 text-[hsl(var(--muted-foreground))]/60" />}
                            </button>
                            <button onClick={copyText} className="p-1 rounded-lg hover:bg-[hsl(var(--muted))]/60 transition-colors cursor-pointer" title="Нусхабардорӣ">
                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[hsl(var(--muted-foreground))]/60" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
const AiChat = () => {
    const { t, i18n } = useTranslation();
    const { user, token } = useAuthStore();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [lang, setLang] = useState(() => (i18n.language || "tj").slice(0, 2));
    const [remainingToday, setRemainingToday] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [interimText, setInterimText] = useState("");
    const [micError, setMicError] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState(() => localStorage.getItem(VOICE_PREF_KEY) || "");

    const localDict = {
        tj: {
            title: "AI Мушовир",
            online: "Онлайн",
            clearChat: "Тоза кардан",
            heroTitle: "AI Мушовири касбӣ",
            heroSubtitle: "Дар бораи ихтисосҳо, маош, донишгоҳҳо ва роҳи касбӣ савол диҳед",
            placeholder: "Паём нависед...",
            errorGeneric: "Хатогӣ рух дод. Лутфан дубора кӯшиш кунед.",
            voiceUserMsg: "🎙️ Паёми овозӣ...",
            voiceSentMsg: "🎙️ Овоз фиристода шуд",
            voiceError: "Хатогӣ рух дод.",
            quickPrompts: [
                { icon: "🎓", text: "Кадом ихтисос ба ман мувофиқ аст?" },
                { icon: "💰", text: "Маоши барномасоз чанд аст?" },
                { icon: "🏛️", text: "Донишгоҳҳои Душанбе" },
                { icon: "🚀", text: "Роҳи касбии Full-Stack Developer" }
            ],
            voiceEnabled: "Овоз: Фаъол",
            voiceDisabled: "Овоз: Хомӯш",
            voiceSend: "Фиристодан",
            voiceMessage: "Паёми овозӣ"
        },
        ru: {
            title: "AI Советник",
            online: "Онлайн",
            clearChat: "Очистить чат",
            heroTitle: "Профессиональный AI Советник",
            heroSubtitle: "Задайте вопросы о специальностях, зарплате, инструментах и карьерном пути",
            placeholder: "Напишите сообщение...",
            errorGeneric: "Произошла ошибка. Пожалуйста, попробуйте еще раз.",
            voiceUserMsg: "🎙️ Голосовое сообщение...",
            voiceSentMsg: "🎙️ Голос отправлен",
            voiceError: "Произошла ошибка.",
            quickPrompts: [
                { icon: "🎓", text: "Какая специальность мне подходит?" },
                { icon: "💰", text: "Какая зарплата у программиста?" },
                { icon: "🏛️", text: "Университеты Душанбе" },
                { icon: "🚀", text: "Карьерный путь Full-Stack разработчика" }
            ],
            voiceEnabled: "Голос: Вкл",
            voiceDisabled: "Голос: Выкл",
            voiceSend: "Отправить",
            voiceMessage: "Голосовое сообщение"
        },
        en: {
            title: "AI Career Advisor",
            online: "Online",
            clearChat: "Clear chat",
            heroTitle: "AI Career Advisor",
            heroSubtitle: "Ask about careers, salaries, universities, and career pathways",
            placeholder: "Type a message...",
            errorGeneric: "An error occurred. Please try again.",
            voiceUserMsg: "🎙️ Voice message...",
            voiceSentMsg: "🎙️ Voice sent",
            voiceError: "An error occurred.",
            quickPrompts: [
                { icon: "🎓", text: "Which career suits me?" },
                { icon: "💰", text: "What is a programmer's salary?" },
                { icon: "🏛️", text: "Universities in Dushanbe" },
                { icon: "🚀", text: "Full-Stack Developer roadmap" }
            ],
            voiceEnabled: "Voice: On",
            voiceDisabled: "Voice: Off",
            voiceSend: "Send",
            voiceMessage: "Voice message"
        }
    };

    const currentDict = localDict[lang] || localDict.tj;

    useEffect(() => {
        if (i18n.language) {
            setLang((i18n.language || "tj").slice(0, 2));
        }
    }, [i18n.language]);

    const handleLangChange = (newLang) => {
        setLang(newLang);
        i18n.changeLanguage(newLang);
    };

    const recognitionRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const speechQueueRef = useRef([]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        const synth = synthRef.current;
        if (!synth) return;

        const loadVoices = () => setVoices(synth.getVoices());
        loadVoices();
        synth.onvoiceschanged = loadVoices;

        return () => {
            if (synth.onvoiceschanged === loadVoices) synth.onvoiceschanged = null;
        };
    }, []);

    /* ── Load history ── */
    useEffect(() => {
        if (user?.chatHistory?.length) {
            const restored = user.chatHistory.flatMap((h, i) => [
                { id: `hq${i}`, role: "user", text: h.question, time: h.createdAt, _isNew: false },
                { id: `ha${i}`, role: "assistant", text: h.answer, time: h.createdAt, _isNew: false },
            ]);
            setMessages(restored);
        }
    }, []);

    /* ── Auto-scroll ── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    /* ── Voice Recording (Web Speech API — real-time, no upload) ── */
    const MIC_ERRORS = {
        "not-allowed": { tj: "Дастрасӣ ба микрофон рад шуд. Иҷозатро дар браузер диҳед.", ru: "Доступ к микрофону запрещён. Разрешите в браузере.", en: "Microphone access denied. Allow it in your browser." },
        "no-speech":   { tj: "Овоз ошкор нашуд. Дубора кӯшиш кунед.", ru: "Голос не обнаружен. Попробуйте ещё раз.", en: "No speech detected. Please try again." },
        "network":     { tj: "Хатогии шабака ҳангоми овозшиносӣ.", ru: "Ошибка сети при распознавании речи.", en: "Network error during speech recognition." },
        "unsupported": { tj: "Браузери шумо овозшиносиро дастгирӣ намекунад. Chrome ё Edge истифода баред.", ru: "Ваш браузер не поддерживает распознавание речи. Используйте Chrome или Edge.", en: "Your browser doesn't support speech recognition. Use Chrome or Edge." },
    };

    const getMicError = (code) =>
        MIC_ERRORS[code]?.[lang] || MIC_ERRORS[code]?.en || "";

    const startRecording = useCallback(() => {
        setMicError("");
        if (!SPEECH_SUPPORTED) {
            setMicError(getMicError("unsupported"));
            return;
        }
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = LANG_TO_BCP47[lang] || "ru-RU";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            let interim = "";
            let final = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) final += t + " ";
                else interim += t;
            }
            if (final) setInput(prev => (prev + final).trimStart());
            setInterimText(interim);
        };

        recognition.onerror = (e) => {
            if (e.error !== "no-speech") {
                setMicError(getMicError(e.error));
                setIsRecording(false);
                setInterimText("");
                clearInterval(recordingTimerRef.current);
            }
        };

        recognition.onend = () => {
            // Only clear recording state if we didn't manually stop (stopRecording does that)
            setIsRecording(false);
            setInterimText("");
            clearInterval(recordingTimerRef.current);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        setRecordingTime(0);
        recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    }, [lang]);

    // Stop recording — transcribed text stays in the input box
    const stopRecording = useCallback(() => {
        clearInterval(recordingTimerRef.current);
        // Commit any interim text before stopping
        if (interimText) {
            setInput(prev => (prev + interimText + " ").trimStart());
            setInterimText("");
        }
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsRecording(false);
    }, [interimText]);

    // Cancel recording — discard everything
    const cancelRecording = useCallback(() => {
        clearInterval(recordingTimerRef.current);
        recognitionRef.current?.abort();
        recognitionRef.current = null;
        setIsRecording(false);
        setInterimText("");
        setInput("");
        setMicError("");
    }, []);

    /* ── TTS — intelligent voice selection ── */
    const getBestVoice = useCallback((langCode) => {
        const synth = synthRef.current;
        if (!synth) return null;
        const voices = synth.getVoices();
        if (!voices.length) return null;

        const savedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (savedVoice) return savedVoice;

        // Priority keywords for higher-quality voices
        const premiumKeywords = ['Natural', 'Neural', 'Online', 'Google', 'Microsoft', 'Enhanced', 'Premium'];
        const langMap = { tj: ['tg', 'ru'], ru: ['ru'], en: ['en'] };
        const targetLangs = langMap[langCode] || ['ru'];

        // Find voices matching target language
        const matching = voices.filter(v => targetLangs.some(tl => v.lang.toLowerCase().startsWith(tl)));
        if (!matching.length) return null;

        // Prefer premium voices (Google, Microsoft Neural, etc.)
        const premium = matching.find(v => premiumKeywords.some(k => v.name.includes(k)));
        if (premium) return premium;

        // Prefer female voices (generally clearer for TTS)
        const female = matching.find(v => /female|женск/i.test(v.name));
        if (female) return female;

        return matching[0];
    }, [selectedVoiceURI]);

    const speakText = useCallback((text, msgId) => {
        const synth = synthRef.current;
        if (!synth) return;
        synth.cancel();
        speechQueueRef.current = [];

        if (isSpeaking && speakingMsgId === msgId) {
            setIsSpeaking(false); setSpeakingMsgId(null); return;
        }

        const chunks = splitSpeechText(text);
        if (!chunks.length) return;

        const selectedLang = LANG_OPTIONS.find(l => l.code === lang);
        const bestVoice = getBestVoice(lang);
        speechQueueRef.current = [...chunks];

        const speakNext = () => {
            const next = speechQueueRef.current.shift();
            if (!next) {
                setIsSpeaking(false);
                setSpeakingMsgId(null);
                return;
            }

            const utt = new SpeechSynthesisUtterance(next);
            utt.lang = selectedLang?.speechCode || 'ru-RU';
            if (bestVoice) utt.voice = bestVoice;
            utt.rate = lang === "en" ? 0.94 : 0.9;
            utt.pitch = 1.02;
            utt.volume = 1.0;
            utt.onend = speakNext;
            utt.onerror = () => {
                setIsSpeaking(false);
                setSpeakingMsgId(null);
                speechQueueRef.current = [];
            };
            synth.speak(utt);
        };

        speakNext();

        setIsSpeaking(true);
        setSpeakingMsgId(msgId);
    }, [lang, isSpeaking, speakingMsgId, getBestVoice]);

    const stopSpeech = useCallback(() => {
        speechQueueRef.current = [];
        synthRef.current?.cancel();
        setIsSpeaking(false);
        setSpeakingMsgId(null);
    }, []);

    const handleVoiceChange = (voiceURI) => {
        setSelectedVoiceURI(voiceURI);
        localStorage.setItem(VOICE_PREF_KEY, voiceURI);
        stopSpeech();
    };

    /* ── Send ── */
    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;
        const userMsg = { id: `u${Date.now()}`, role: "user", text, time: new Date().toISOString(), _isNew: true };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        // reset textarea height
        if (inputRef.current) inputRef.current.style.height = "48px";

        try {
            const { data } = await axios.post(`${API}/careers/ask`, { question: text, lang },
                { headers: { Authorization: `Bearer ${token}` } });
            const botMsg = { id: `a${Date.now()}`, role: "assistant", text: data.answer, time: new Date().toISOString(), _isNew: true };
            setMessages(prev => [...prev, botMsg]);
            if (data.remainingToday !== undefined) setRemainingToday(data.remainingToday);
        } catch (err) {
            const errText = err.response?.data?.message || currentDict.errorGeneric;
            setMessages(prev => [...prev, { id: `e${Date.now()}`, role: "assistant", text: `⚠️ ${errText}`, time: new Date().toISOString(), isError: true, _isNew: true }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => { stopSpeech(); setMessages([]); };
    const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

    const langPrefixes = lang === "en" ? ["en"] : lang === "ru" ? ["ru"] : ["tg", "ru"];
    const voiceOptions = voices.filter((voice) =>
        langPrefixes.some((prefix) => voice.lang.toLowerCase().startsWith(prefix))
    );
    const activeVoiceName = voices.find((voice) => voice.voiceURI === selectedVoiceURI)?.name || "Auto";

    return (
        <div className="ai-chat-wrapper">
            {/* ─── BG Decor ─── */}
            <div className="ai-chat-bg" />

            {/* ─── Header ─── */}
            <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="ai-chat-header">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard">
                        <button className="ai-chat-icon-btn cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-accent-blue to-primary p-[2px] shadow-lg shadow-primary/20">
                                <div className="w-full h-full rounded-[14px] bg-[hsl(var(--card))] flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[hsl(var(--background))]" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-[hsl(var(--foreground))] tracking-tight">{currentDict.title}</h1>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-500">{currentDict.online}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <div className="relative">
                        <select value={lang} onChange={e => handleLangChange(e.target.value)}
                            className="appearance-none pl-7 pr-2.5 py-2 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]/50 text-[11px] font-bold text-[hsl(var(--foreground))] cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30">
                            {LANG_OPTIONS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                        <Languages className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] pointer-events-none" />
                    </div>
                    {VOICE_FEATURE_ENABLED && (
                        <select
                            value={selectedVoiceURI}
                            onChange={e => handleVoiceChange(e.target.value)}
                            title={`Voice: ${activeVoiceName}`}
                            className="hidden lg:block max-w-[170px] px-2.5 py-2 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]/50 text-[11px] font-bold text-[hsl(var(--foreground))] cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="">Auto voice</option>
                            {voiceOptions.map((voice) => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {voice.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {remainingToday !== null && (
                        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-black text-primary">
                            <Sparkles className="w-3 h-3" />{remainingToday}
                        </div>
                    )}
                    {messages.length > 0 && (
                        <button onClick={clearChat} className="ai-chat-icon-btn group cursor-pointer" title={currentDict.clearChat}>
                            <Trash2 className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" />
                        </button>
                    )}
                </div>
            </motion.header>

            {/* ─── Messages ─── */}
            <div ref={chatContainerRef} className="ai-chat-messages custom-scrollbar">
                {messages.length === 0 && !loading && (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        className="flex flex-col items-center justify-center h-full gap-8 text-center px-4">
                        {/* Hero icon */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/15 to-accent-blue/15 flex items-center justify-center backdrop-blur-xl border border-primary/10">
                                <Bot className="w-12 h-12 text-primary" />
                            </div>
                            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center shadow-lg shadow-primary/30">
                                <Sparkles className="w-4 h-4 text-white" />
                            </motion.div>
                            {/* Orbiting dots */}
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-[-18px]">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary/50" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/40" />
                            </motion.div>
                        </div>
                        <div className="space-y-2 max-w-sm">
                            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-accent-blue bg-clip-text text-transparent">
                                {currentDict.heroTitle}
                            </h2>
                            <p className="text-[hsl(var(--muted-foreground))] text-sm font-medium leading-relaxed opacity-70">
                                {currentDict.heroSubtitle}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
                            {currentDict.quickPrompts.map(q => (
                                <motion.button key={q.text} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => { setInput(q.text); inputRef.current?.focus(); }}
                                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[hsl(var(--card))]/60 border border-[hsl(var(--border))]/50 text-[12px] font-semibold text-[hsl(var(--foreground))]/80 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer text-left backdrop-blur-sm">
                                    <span className="text-base flex-shrink-0">{q.icon}</span>
                                    <span className="line-clamp-2">{q.text}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map(msg => (
                        <MessageBubble key={msg.id} msg={msg} user={user}
                            speakText={speakText} isSpeaking={isSpeaking} speakingMsgId={speakingMsgId} voiceEnabled={VOICE_FEATURE_ENABLED} />
                    ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {loading && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary via-accent-blue to-primary p-[2px] shadow-lg shadow-primary/20 mb-5">
                            <div className="w-full h-full rounded-[14px] bg-[hsl(var(--card))] flex items-center justify-center">
                                <Bot className="w-4.5 h-4.5 text-primary" />
                            </div>
                        </div>
                        <div className="px-5 py-4 rounded-[20px] rounded-bl-[6px] bg-[hsl(var(--card))]/80 border border-[hsl(var(--border))]/60 shadow-xl shadow-black/5 backdrop-blur-xl mb-5">
                            <div className="flex items-center gap-1">
                                {[0, 1, 2].map(i => (
                                    <motion.div key={i}
                                        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15, ease: "easeInOut" }}
                                        className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-accent-blue" />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ─── Input ─── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ai-chat-input-area relative">
                {/* Recording overlay */}
                <AnimatePresence>
                    {isRecording && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className="absolute inset-0 z-20 flex items-center gap-3 px-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-primary/10 border border-red-500/20 backdrop-blur-xl">
                            {/* Pulsing mic indicator */}
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                                className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />

                            {/* Live transcript preview */}
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm text-[hsl(var(--foreground))] font-medium truncate">
                                    {input || <span className="text-[hsl(var(--muted-foreground))]/50 italic">{currentDict.voiceListening || "Listening…"}</span>}
                                </p>
                                {interimText && (
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]/60 italic truncate">{interimText}</p>
                                )}
                            </div>

                            {/* Timer */}
                            <span className="flex-shrink-0 text-xs font-bold text-[hsl(var(--muted-foreground))] tabular-nums">
                                {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                            </span>

                            {/* Confirm (stop + keep text in input) */}
                            <motion.button whileTap={{ scale: 0.9 }} onClick={stopRecording}
                                title={currentDict.voiceStop || "Stop & keep"}
                                className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white flex items-center justify-center shadow-lg shadow-primary/30 cursor-pointer">
                                <MicOff className="w-4 h-4" />
                            </motion.button>

                            {/* Cancel (discard everything) */}
                            <button onClick={cancelRecording}
                                title={currentDict.voiceCancel || "Cancel"}
                                className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center cursor-pointer hover:bg-red-500/25 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mic error banner */}
                <AnimatePresence>
                    {micError && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="absolute bottom-full left-0 right-0 mb-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/25 text-xs text-red-400 font-medium flex items-center justify-between gap-2">
                            <span>{micError}</span>
                            <button onClick={() => setMicError("")} className="flex-shrink-0 hover:text-red-300 transition-colors">✕</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="ai-chat-input-container">
                    {/* Voice Record Button */}
                    {VOICE_FEATURE_ENABLED && (
                        <button onClick={isRecording ? stopRecording : startRecording} disabled={loading || !SPEECH_SUPPORTED}
                            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                isRecording
                                    ? "bg-red-500/15 text-red-400 shadow-lg shadow-red-500/10"
                                    : "text-[hsl(var(--muted-foreground))]/60 hover:text-primary hover:bg-primary/10"
                            } ${(loading || !SPEECH_SUPPORTED) ? "opacity-30 pointer-events-none" : ""}`}
                            title={isRecording ? (currentDict.voiceStop || "Stop recording") : (currentDict.voiceMessage || "Start recording")}>
                            {isRecording ? (
                                <div className="relative">
                                    <MicOff className="w-5 h-5" />
                                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="absolute inset-0 rounded-full border-2 border-red-400" />
                                </div>
                            ) : <Mic className="w-5 h-5" />}
                        </button>
                    )}

                    {/* Text Input */}
                    <textarea ref={inputRef} value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={currentDict.placeholder}
                        rows={1} disabled={loading || isRecording}
                        className="flex-1 bg-transparent text-[14px] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/35 font-medium resize-none focus:outline-none disabled:opacity-40 py-2.5"
                        style={{ minHeight: "40px", maxHeight: "100px" }}
                        onInput={e => { e.target.style.height = "40px"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
                    />

                    {/* Auto-speak toggle */}
                    {VOICE_FEATURE_ENABLED && (
                        <button onClick={() => setAutoSpeak(!autoSpeak)}
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                autoSpeak ? "text-primary bg-primary/10" : "text-[hsl(var(--muted-foreground))]/40 hover:text-[hsl(var(--muted-foreground))]"
                            }`} title={autoSpeak ? currentDict.voiceEnabled : currentDict.voiceDisabled}>
                            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                    )}

                    {/* Send text */}
                    <motion.button onClick={sendMessage} disabled={!input.trim() || loading}
                        whileHover={input.trim() && !loading ? { scale: 1.08 } : {}}
                        whileTap={input.trim() && !loading ? { scale: 0.92 } : {}}
                        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            input.trim() && !loading
                                ? "bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/30"
                                : "text-[hsl(var(--muted-foreground))]/20 pointer-events-none"
                        }`}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default AiChat;
