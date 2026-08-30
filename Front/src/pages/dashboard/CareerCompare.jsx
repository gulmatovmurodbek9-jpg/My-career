import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Search, Scale, Sparkles, Trophy, ThumbsUp, ThumbsDown,
    Target, TrendingUp, GraduationCap, DollarSign, BarChart3,
    Loader2, AlertCircle, CheckCircle, XCircle, Zap, Crown,
    BrainCircuit, ChevronRight, Plus, X, Star, ArrowUpRight
} from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";

const QUIZ_STORAGE_KEY = "quiz_results_v1";

/* ─── Animations ─── */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};
const chipVariants = {
    initial: { opacity: 0, scale: 0.7, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } },
    exit: { opacity: 0, scale: 0.7, y: -10, transition: { duration: 0.2 } },
};

/* ─── i18n labels ─── */
const labels = {
    tj: {
        title: "Муқоисаи Ихтисосҳо",
        subtitle: "Ихтисосҳоро бо зеҳни сунъӣ муқоиса кунед ва беҳтаринро ёбед",
        badge: "AI Муқоиса",
        searchPlaceholder: "Номи ихтисосро нависед...",
        addCareer: "Илова",
        compare: "Муқоиса кунед",
        comparing: "AI таҳлил мекунад...",
        comparingDesc: "Ихтисосҳо бо зеҳни сунъӣ муқоиса карда мешаванд",
        back: "Бозгашт",
        pros: "Бартариятҳо",
        cons: "Камбудиҳо",
        skills: "Маҳоратҳои зарурӣ",
        salary: "Маош",
        demand: "Талабот",
        difficulty: "Мушкилии омӯзиш",
        bestMatch: "Беҳтарин интихоб",
        match: "Мувофиқат",
        minCareers: "Ҳадди ақал 2 ихтисос илова кунед",
        noQuiz: "Аввал тестро гузаред",
        noQuizDesc: "Барои муқоисаи ихтисосҳо, тести психологиро гузаред.",
        startQuiz: "Оғоз кардани тест",
        error: "Хатогӣ рӯй дод",
        retry: "Дубора кӯшиш кунед",
        high: "Баланд",
        medium: "Миёна",
        low: "Паст",
        easy: "Осон",
        hard: "Мушкил",
        summary: "Хулоса",
        why: "Чаро ин беҳтарин аст",
        remove: "Нест кардан",
        selected: "Интихобшуда",
        maxCareers: "Максимум 5 ихтисос",
        inputHint: "Enter-ро пахш кунед ё тугмаро занед",
        suggestedTitle: "Ихтисосҳои пешнҳодшуда",
        suggestedDesc: "Дар асоси натиҷаи тести шумо",
        orManual: "Ё худатон нависед",
        loadingSuggestions: "Боргузорӣ...",
        rateLimitError: "Лимити рӯзонаи AI тамом шуд",
        rateLimitDesc: "Лутфан баъд аз чанд дақиқа кӯшиш кунед",
        retryIn: "Такрор баъд аз",
        seconds: "сония",
        compareQuestion: "Саволи муқоиса",
        compareQuestionPlaceholder: "Масалан: аз рӯи маош, ҷойҳои кор, фарқиятҳо, + / -, ва 10 соли оянда муқоиса кун...",
        quickCompareSalary: "Аз рӯи маош ва талабот муқоиса кун",
        quickCompareFuture: "10 соли оянда кадомаш беҳтар аст?",
        quickCompareProsCons: "Фарқиятҳо ва + / - ро нишон деҳ",
        customAnalysis: "Таҳлили иловагӣ",
        noCareers: "Ихтисоси захирашуда ё пешниҳодшуда ҳоло нест.",
        emptyData: "Маълумоти муқоиса холӣ аст. Лутфан ихтисосҳои дигарро интихоб кунед.",
        noComparisonData: "Маълумоти муқоисавӣ барои ин касбҳо ҳанӯз дастрас нест.",
    },
    ru: {
        title: "Сравнение Профессий",
        subtitle: "Сравните профессии с помощью AI и найдите лучшую",
        badge: "AI Сравнение",
        searchPlaceholder: "Введите название профессии...",
        addCareer: "Добавить",
        compare: "Сравнить",
        comparing: "AI анализирует...",
        comparingDesc: "Профессии сравниваются искусственным интеллектом",
        back: "Назад",
        pros: "Преимущества",
        cons: "Недостатки",
        skills: "Необходимые навыки",
        salary: "Зарплата",
        demand: "Востребованность",
        difficulty: "Сложность обучения",
        bestMatch: "Лучший выбор",
        match: "Совпадение",
        minCareers: "Добавьте минимум 2 профессии",
        noQuiz: "Сначала пройдите тест",
        noQuizDesc: "Для сравнения профессий пройдите психологический тест.",
        startQuiz: "Начать тест",
        error: "Произошла ошибка",
        retry: "Попробовать снова",
        high: "Высокий",
        medium: "Средний",
        low: "Низкий",
        easy: "Легко",
        hard: "Сложно",
        summary: "Резюме",
        why: "Почему это лучший выбор",
        remove: "Удалить",
        selected: "Выбранные",
        maxCareers: "Максимум 5 профессий",
        inputHint: "Нажмите Enter или кнопку",
        suggestedTitle: "Рекомендуемые профессии",
        suggestedDesc: "На основе результатов вашего теста",
        orManual: "Или введите вручную",
        loadingSuggestions: "Загрузка...",
        rateLimitError: "Дневной лимит AI исчерпан",
        rateLimitDesc: "Пожалуйста, попробуйте через несколько минут",
        retryIn: "Повтор через",
        seconds: "сек",
        compareQuestion: "Вопрос сравнения",
        compareQuestionPlaceholder: "Например: сравни по зарплате, рабочим местам, отличиям, + / -, и перспективе на 10 лет...",
        quickCompareSalary: "Сравни по зарплате и спросу",
        quickCompareFuture: "Что лучше через 10 лет?",
        quickCompareProsCons: "Покажи отличия и + / -",
        customAnalysis: "Дополнительный анализ",
        noCareers: "Нет сохраненных или рекомендуемых профессий.",
        emptyData: "Данные сравнения пусты. Пожалуйста, попробуйте другие профессии.",
        noComparisonData: "Данные для сравнения этих профессий пока недоступны.",
    },
    en: {
        title: "Career Comparison",
        subtitle: "Compare careers with AI and find the best match",
        badge: "AI Compare",
        searchPlaceholder: "Type a career name...",
        addCareer: "Add",
        compare: "Compare",
        comparing: "AI is analyzing...",
        comparingDesc: "Careers are being compared using artificial intelligence",
        back: "Back",
        pros: "Advantages",
        cons: "Disadvantages",
        skills: "Required Skills",
        salary: "Salary",
        demand: "Market Demand",
        difficulty: "Learning Difficulty",
        bestMatch: "Best Match",
        match: "Match",
        minCareers: "Add at least 2 careers",
        noQuiz: "Take the quiz first",
        noQuizDesc: "To compare careers, complete the psychological test.",
        startQuiz: "Start Quiz",
        error: "An error occurred",
        retry: "Try again",
        high: "High",
        medium: "Medium",
        low: "Low",
        easy: "Easy",
        hard: "Hard",
        summary: "Summary",
        why: "Why this is the best choice",
        remove: "Remove",
        selected: "Selected",
        maxCareers: "Maximum 5 careers",
        inputHint: "Press Enter or click the button",
        suggestedTitle: "Suggested Careers",
        suggestedDesc: "Based on your test results",
        orManual: "Or type manually",
        loadingSuggestions: "Loading...",
        rateLimitError: "AI daily limit reached",
        rateLimitDesc: "Please try again in a few minutes",
        retryIn: "Retry in",
        seconds: "sec",
        compareQuestion: "Comparison question",
        compareQuestionPlaceholder: "Example: compare by salary, jobs, differences, pros/cons, and 10-year future...",
        quickCompareSalary: "Compare salary and demand",
        quickCompareFuture: "Which is better in 10 years?",
        quickCompareProsCons: "Show differences and pros/cons",
        customAnalysis: "Custom Analysis",
        noCareers: "No saved or suggested careers yet.",
        emptyData: "Comparison data is empty. Please try different careers.",
        noComparisonData: "Comparison data is not available for these careers yet.",
    },
};

/* ─── Demand/Difficulty badge helper ─── */
const demandConfig = {
    high: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
    low: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },
};
const difficultyConfig = {
    easy: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
    hard: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },
};

/* ─── Match percentage color ─── */
const matchGradient = (pct) => {
    if (pct >= 80) return "from-emerald-500 to-green-400";
    if (pct >= 60) return "from-blue-500 to-cyan-400";
    if (pct >= 40) return "from-amber-500 to-yellow-400";
    return "from-rose-500 to-orange-400";
};

const compareMetaKeys = new Set([
    "bestCareer",
    "bestCareerName",
    "careerComparison",
    "careers",
    "comparisons",
    "results",
    "summary",
    "reason",
    "message",
]);

const toObject = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
            return null;
        }
    }
    return typeof value === "object" ? value : null;
};

const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];

    return Object.entries(value).map(([name, details]) => {
        const parsed = toObject(details) || {};
        return {
            name,
            ...parsed,
        };
    });
};

const normalizeCareerItem = (item, fallbackName = "") => {
    if (!item) return null;

    if (typeof item === "string") {
        return {
            career: item,
            matchPercentage: 0,
            summary: "",
            pros: [],
            cons: [],
            skillsRequired: [],
        };
    }

    if (typeof item !== "object") return null;

    const careerName = item.career || item.name || item.title || fallbackName;
    if (!careerName) return null;

    return {
        ...item,
        career: careerName,
        matchPercentage: Number(
            item.matchPercentage ??
            item.match ??
            item.score ??
            item.compatibility ??
            item.percentage ??
            0
        ),
        summary: item.summary || item.reason || item.description || item.overview || "",
        pros: Array.isArray(item.pros) ? item.pros : Array.isArray(item.advantages) ? item.advantages : [],
        cons: Array.isArray(item.cons) ? item.cons : Array.isArray(item.disadvantages) ? item.disadvantages : [],
        skillsRequired: Array.isArray(item.skillsRequired)
            ? item.skillsRequired
            : Array.isArray(item.skills)
                ? item.skills
                : [],
        marketDemand: item.marketDemand || item.demand || item.demandLevel || "",
        learningDifficulty: item.learningDifficulty || item.difficulty || item.difficultyLevel || "",
        salaryRange: item.salaryRange || item.salary || item.salaryExpectation || "",
    };
};

const normalizeCompareResponse = (payload, requestedCareers = []) => {
    const root = toObject(payload) || {};
    const rootData = toObject(root.data) || root;
    const comparisonRoot =
        toObject(rootData.comparison) ||
        toObject(rootData.result) ||
        rootData;

    let rawComparison =
        comparisonRoot.careerComparison ??
        comparisonRoot.careers ??
        comparisonRoot.comparisons ??
        comparisonRoot.results ??
        rootData.careerComparison ??
        rootData.careers ??
        rootData.comparisons ??
        rootData.results ??
        [];

    let comparisonItems = toArray(rawComparison)
        .map((item) => normalizeCareerItem(item))
        .filter(Boolean);

    if (comparisonItems.length === 0 && comparisonRoot && typeof comparisonRoot === "object") {
        comparisonItems = Object.entries(comparisonRoot)
            .filter(([key, value]) => !compareMetaKeys.has(key) && value && typeof value === "object")
            .map(([name, value]) => normalizeCareerItem({ name, ...(toObject(value) || {}) }, name))
            .filter(Boolean);
    }

    // Модел баъзан ҳар ихтисосро ду маротиба бармегардонад, ва саҳифа онро
    // бо худаш муқоиса мекард: ду корти якхела бо ҳамон 70%. Такрорҳо аз рӯи
    // ном бароварда мешаванд, аввалинаш мемонад.
    const seenCareers = new Set();
    comparisonItems = comparisonItems.filter((item) => {
        const key = String(item.career || "").trim().toLowerCase();
        if (!key || seenCareers.has(key)) return false;
        seenCareers.add(key);
        return true;
    });

    const bestCareerRaw =
        toObject(comparisonRoot.bestCareer) ||
        toObject(rootData.bestCareer) ||
        null;

    const inferredBestCareer = comparisonItems.reduce((best, current) => {
        if (!best) return current;
        return current.matchPercentage > best.matchPercentage ? current : best;
    }, null);

    const bestCareerName =
        bestCareerRaw?.name ||
        bestCareerRaw?.career ||
        comparisonRoot.bestCareerName ||
        rootData.bestCareerName ||
        inferredBestCareer?.career ||
        requestedCareers[0] ||
        "";

    const bestCareer = bestCareerName
        ? {
            ...(bestCareerRaw || {}),
            name: bestCareerName,
            reason:
                bestCareerRaw?.reason ||
                bestCareerRaw?.summary ||
                comparisonRoot.reason ||
                comparisonRoot.summary ||
                rootData.reason ||
                rootData.summary ||
                comparisonItems.find((item) => item.career === bestCareerName)?.summary ||
                "",
        }
        : null;

    return {
        bestCareer,
        careerComparison: comparisonItems,
        summary: comparisonRoot.summary || rootData.summary || "",
        customAnalysis:
            comparisonRoot.customAnalysis ||
            comparisonRoot.detailedAnswer ||
            comparisonRoot.additionalAnalysis ||
            rootData.customAnalysis ||
            rootData.detailedAnswer ||
            "",
        raw: root,
    };
};

/* ════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                          */
/* ════════════════════════════════════════════════════════ */

const CareerCompare = () => {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").split("-")[0];
    const t = labels[lang] || labels.tj;
    const user = useAuthStore((s) => s.user);
    const token = useAuthStore((s) => s.token);
    const refreshProfile = useAuthStore((s) => s.refreshProfile);

    const [careers, setCareers] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [compareQuestion, setCompareQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRateLimit, setIsRateLimit] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [data, setData] = useState(null);
    const [suggestedCareers, setSuggestedCareers] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [savedCareers, setSavedCareers] = useState([]);
    const [loadingSavedCareers, setLoadingSavedCareers] = useState(false);

    useEffect(() => {
        if (token && !user?.quizResults) {
            refreshProfile();
        }
    }, [token, user?.quizResults, refreshProfile]);

    /* ─── Check quiz results ─── */
    const extractScorePayload = (source) => {
        if (!source || typeof source !== "object") return null;
        if (source.scores && typeof source.scores === "object") return source.scores;
        if (source.riasec || source.mmtClusters) return source;
        return null;
    };

    /* ─── Get quiz results for cluster-based suggestions ─── */
    const quizData = useMemo(() => {
        try {
            const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch {
            return null;
        }
        return null;
    }, []);

    /* ─── Build full scores for compare API call ─── */
    const fullScores = useMemo(() => {
        return extractScorePayload(user?.quizResults) || extractScorePayload(quizData);
    }, [user?.quizResults, quizData]);

    const isValidQuizScores = (scores) => {
        if (!scores || typeof scores !== "object") return false;
        const mmt = scores.mmtClusters || scores;
        return (
            (mmt.c1 !== undefined && mmt.c1 !== null) ||
            (mmt.c2 !== undefined && mmt.c2 !== null) ||
            (mmt.c3 !== undefined && mmt.c3 !== null) ||
            (mmt.c4 !== undefined && mmt.c4 !== null) ||
            (mmt.c5 !== undefined && mmt.c5 !== null)
        );
    };

    const hasQuizProfile = isValidQuizScores(fullScores);

    useEffect(() => {
        if (!token) {
            setSavedCareers(user?.savedCareers || []);
            return;
        }

        setLoadingSavedCareers(true);
        axios.get(`${API}/users/saved-careers`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => setSavedCareers(Array.isArray(res.data) ? res.data : []))
            .catch((err) => {
                console.error("Failed to fetch saved careers:", err);
                setSavedCareers(user?.savedCareers || []);
            })
            .finally(() => setLoadingSavedCareers(false));
    }, [token, user?.savedCareers]);

    /* ─── Fetch suggested careers from the SAME cluster the quiz recommended ─── */
    useEffect(() => {
        const clusterId = quizData?.topCluster?.id;
        if (!clusterId) return;
        setLoadingSuggestions(true);
        axios.get(`${API}/careers`, { params: { clusterId, limit: 8, page: 1 } })
            .then(res => {
                const careers = (res.data?.data || []).map(c => ({
                    ...c,
                    matchPercentage: c.matchPercentage || 0,
                }));
                setSuggestedCareers(careers);
            })
            .catch(err => console.error("Failed to fetch cluster careers:", err))
            .finally(() => setLoadingSuggestions(false));
    }, [quizData]);

    const displayCareers = useMemo(() => {
        const unique = new Map();

        [...savedCareers, ...suggestedCareers].forEach((career) => {
            if (!career?.name) return;
            const key = career.id || career.name.toLowerCase();
            if (!unique.has(key)) {
                unique.set(key, {
                    ...career,
                    isSaved: savedCareers.some((saved) => saved.id === career.id || saved.name === career.name),
                });
            }
        });

        return Array.from(unique.values());
    }, [savedCareers, suggestedCareers]);

    useEffect(() => {
        if (careers.length > 0 || displayCareers.length < 2) return;

        const initialSelection = [...new Set(
            displayCareers
                .map((career) => career?.name)
                .filter(Boolean)
        )].slice(0, 2);

        if (initialSelection.length >= 2) {
            setCareers(initialSelection);
        }
    }, [displayCareers, careers.length]);

    /* ─── Toggle career from suggestions ─── */
    const toggleCareer = (name) => {
        setCareers((prev) => {
            if (prev.includes(name)) return prev.filter(c => c !== name);
            if (prev.length >= 5) return prev;
            return [...prev, name];
        });
    };

    /* ─── Add career manually ─── */
    const addCareer = () => {
        const name = inputValue.trim();
        if (!name || careers.includes(name)) return;
        if (careers.length >= 5) return;
        setCareers((prev) => [...prev, name]);
        setInputValue("");
    };

    const removeCareer = (idx) => {
        setCareers((prev) => prev.filter((_, i) => i !== idx));
    };

    /* ─── Handle Compare ─── */
    const handleCompare = async () => {
        if (careers.length < 2 || !fullScores || loading || retryCountdown > 0) return;
        setLoading(true);
        setError(null);
        setIsRateLimit(false);
        setData(null);

        try {
            const res = await axios.post(
                `${API}/careers/compare`,
                { scores: fullScores, careers, lang, compareQuestion: compareQuestion.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const normalized = normalizeCompareResponse(res.data, careers);

            if (!normalized.bestCareer && normalized.careerComparison.length === 0) {
                setError(t.emptyData || "Comparison data is empty. Please try different careers.");
                setData(null);
                return;
            }

            setData(normalized);
        } catch (err) {
            console.error("Compare error:", err);
            const status = err.response?.status;
            const code = err.response?.data?.code;

            if (status === 429 || code === 'AI_RATE_LIMIT') {
                setIsRateLimit(true);
                setError(t.rateLimitError);
                const retrySecs = err.response?.data?.retryAfterSeconds || 60;
                setRetryCountdown(retrySecs);
                // Start countdown
                const interval = setInterval(() => {
                    setRetryCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            setIsRateLimit(false);
                            setError(null);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setError(err.response?.data?.message || t.error);
            }
        } finally {
            setLoading(false);
        }
    };

    const comparisonData = useMemo(() => normalizeCompareResponse(data, careers), [data, careers]);
    const comparedCareers = comparisonData.careerComparison || [];
    const bestCareer = comparisonData.bestCareer;

    /* ═══════════════════════ RENDER ═══════════════════════ */

    /* ── No Quiz State ── */
    if (!hasQuizProfile) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-14 text-center flex flex-col items-center gap-6 max-w-md relative overflow-hidden"
                >
                    <div className="absolute inset-0 tajik-pattern opacity-10" />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
                        <Scale className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">{t.noQuiz}</h2>
                        <p className="text-muted-foreground text-sm font-medium">{t.noQuizDesc}</p>
                    </div>
                    <Link to="/quiz">
                        <button className="btn-primary px-8 py-3 text-sm group cursor-pointer">
                            {t.startQuiz}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="career-compare-page pb-10">
            <motion.div key="compare" variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

                {/* ═══ Header ═══ */}
                <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1.5">
                        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition text-xs font-bold mb-2">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {t.back}
                        </Link>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
                            <Scale className="w-3.5 h-3.5" />
                            {t.badge}
                        </div>
                        <h1 className="text-2xl md:text-[2rem] font-black text-foreground tracking-tight uppercase">
                            {t.title}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium opacity-60">{t.subtitle}</p>
                    </div>
                </motion.header>

                {/* ═══ Suggested Careers Grid ═══ */}
                <motion.div variants={itemVariants} className="space-y-3">
                    <SectionHeader icon={Target} title={t.suggestedTitle} color="from-blue-500 to-cyan-500" />
                    <p className="text-muted-foreground text-xs font-medium opacity-60">{t.suggestedDesc}</p>
                    {quizData?.topCluster?.clusterName && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-wider text-primary mb-4">
                            <GraduationCap className="w-3 h-3" />
                            {quizData.topCluster.clusterName}
                        </div>
                    )}

                    {loadingSuggestions || loadingSavedCareers ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                    <Scale className="w-8 h-8 text-primary" />
                                </div>
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-secondary"
                                        animate={{
                                            x: [0, 24 * Math.cos((i * 2 * Math.PI) / 3), 0],
                                            y: [0, 24 * Math.sin((i * 2 * Math.PI) / 3), 0],
                                        }}
                                        transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
                                        style={{ top: "50%", left: "50%", marginTop: -5, marginLeft: -5 }}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : displayCareers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                            {displayCareers.map((career, idx) => {
                                const isSelected = careers.includes(career.name);
                                return (
                                    <motion.button
                                        key={career.id || idx}
                                        variants={scaleIn}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => toggleCareer(career.name)}
                                        disabled={!isSelected && careers.length >= 5}
                                        className={`glass-card relative p-4 text-left transition-all duration-300 cursor-pointer group overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed ${
                                            isSelected
                                                ? "ring-2 ring-primary/40 border-primary/30"
                                                : "hover:border-primary/20"
                                        }`}
                                    >
                                        {/* Background glow */}
                                        <div className={`absolute -right-10 -top-10 w-32 h-32 blur-[60px] transition-all duration-500 ${
                                            isSelected ? "bg-primary/15" : "bg-primary/0 group-hover:bg-primary/8"
                                        }`} />

                                        {/* Checkmark badge */}
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -45 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    exit={{ scale: 0, rotate: 45 }}
                                                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25"
                                                >
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {career.isSaved && (
                                            <div className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                            </div>
                                        )}

                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300 ${
                                            isSelected
                                                ? "bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/20"
                                                : "bg-primary/5 border border-border group-hover:bg-primary/10 group-hover:border-primary/20"
                                        }`}>
                                            <GraduationCap className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"} transition-colors`} />
                                        </div>

                                        {/* Career name */}
                                        <h4 className="text-sm font-black text-foreground uppercase tracking-normal leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                                            {career.name}
                                        </h4>

                                        {/* Description */}
                                        {career.description && (
                                            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mt-2 opacity-70">
                                                {career.description}
                                            </p>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="glass-card p-8 text-center">
                            <p className="text-sm font-medium text-muted-foreground">
                                {t.noCareers}
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* ═══ Manual Input Divider ═══ */}
                <motion.div variants={itemVariants}>
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">{t.orManual}</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                </motion.div>
                <motion.div variants={itemVariants} className="glass-card p-4 md:p-5 space-y-4 relative overflow-hidden">
                    {/* Decorative gradient */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

                    {/* Input row */}
                    <div className="relative flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={t.searchPlaceholder}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCareer()}
                                className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-secondary/40 focus:bg-white/[0.05] transition-all duration-300"
                                disabled={careers.length >= 5}
                            />
                        </div>
                        <button
                            onClick={addCareer}
                            disabled={!inputValue.trim() || careers.length >= 5}
                            className="px-5 py-3 bg-gradient-to-r from-secondary to-primary text-white font-black rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            <Plus className="w-4 h-4" />
                            {t.addCareer}
                        </button>
                    </div>

                    {/* Career count & hint */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                            {t.selected}: {careers.length}/5
                        </span>
                        {careers.length < 5 && (
                            <span className="text-[10px] font-medium text-muted-foreground opacity-40">
                                {t.inputHint}
                            </span>
                        )}
                    </div>

                    {/* Selected careers chips */}
                    <AnimatePresence mode="popLayout">
                        {careers.length > 0 && (
                            <motion.div layout className="flex flex-wrap gap-2">
                                {careers.map((name, idx) => (
                                    <motion.div
                                        key={name}
                                        layout
                                        variants={chipVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/10 text-sm font-bold text-foreground group hover:border-secondary/30 transition-all duration-300"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                                            <GraduationCap className="w-3.5 h-3.5 text-secondary" />
                                        </div>
                                        {name}
                                        <button
                                            onClick={() => removeCareer(idx)}
                                            className="ml-1 w-5 h-5 rounded-md bg-white/[0.05] flex items-center justify-center text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Custom comparison question */}
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3.5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                {t.compareQuestion}
                            </label>
                            <div className="flex flex-wrap gap-2 lg:justify-end">
                                {[t.quickCompareSalary, t.quickCompareFuture, t.quickCompareProsCons].map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => setCompareQuestion(prompt)}
                                        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            value={compareQuestion}
                            onChange={(e) => setCompareQuestion(e.target.value)}
                            placeholder={t.compareQuestionPlaceholder}
                            rows={2}
                            className="w-full resize-none rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:bg-white/[0.04] transition-all"
                        />
                    </div>

                    {/* Compare button */}
                    <motion.button
                        onClick={handleCompare}
                        disabled={careers.length < 2 || loading || retryCountdown > 0}
                        whileHover={careers.length >= 2 && !loading ? { scale: 1.01 } : {}}
                        whileTap={careers.length >= 2 && !loading ? { scale: 0.99 } : {}}
                        className="w-full py-3.5 bg-gradient-to-r from-secondary via-primary to-secondary bg-[length:200%_100%] text-white font-black rounded-xl text-sm uppercase tracking-[0.12em] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-right transition-all duration-700 flex items-center justify-center gap-3 relative overflow-hidden group"
                    >
                        {/* Shimmer effect */}
                        {careers.length >= 2 && !loading && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        )}
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t.comparing}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                {careers.length < 2 ? t.minCareers : t.compare}
                            </>
                        )}
                    </motion.button>
                </motion.div>

                {/* ═══ Loading State ═══ */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 space-y-6"
                        >
                            <div className="relative">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                                    <Scale className="w-10 h-10 text-secondary" />
                                </div>
                                {/* Orbiting dots */}
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-secondary to-primary"
                                        animate={{
                                            rotate: 360,
                                            x: [0, 30 * Math.cos((i * 2 * Math.PI) / 3), 0],
                                            y: [0, 30 * Math.sin((i * 2 * Math.PI) / 3), 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.3,
                                            ease: "easeInOut",
                                        }}
                                        style={{ top: "50%", left: "50%", marginTop: -6, marginLeft: -6 }}
                                    />
                                ))}
                            </div>
                            <div className="text-center space-y-1.5">
                                <p className="text-foreground font-black text-sm uppercase tracking-[0.15em] flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t.comparing}
                                </p>
                                <p className="text-muted-foreground text-xs font-medium opacity-60">{t.comparingDesc}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ Error State ═══ */}
                <AnimatePresence>
                    {error && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass-card p-12 text-center flex flex-col items-center gap-5 max-w-md mx-auto"
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                isRateLimit ? "bg-amber-500/10" : "bg-rose-500/10"
                            }`}>
                                <AlertCircle className={`w-7 h-7 ${isRateLimit ? "text-amber-500" : "text-rose-500"}`} />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-lg font-black text-foreground">
                                    {isRateLimit ? t.rateLimitError : t.error}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {isRateLimit ? t.rateLimitDesc : error}
                                </p>
                            </div>
                            {retryCountdown > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                                    <span className="text-amber-400 text-sm font-black">
                                        {t.retryIn} {retryCountdown} {t.seconds}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={handleCompare}
                                disabled={retryCountdown > 0}
                                className="btn-primary px-6 py-2.5 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {retryCountdown > 0 ? `${t.retryIn} ${retryCountdown}s` : t.retry}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══════════════════ RESULTS ═══════════════════ */}
                <AnimatePresence>
                    {data && !loading && (
                        <motion.div
                            key="results"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-6"
                        >
                            {/* ── Best Career Banner ── */}
                            {bestCareer && (
                                <motion.div variants={scaleIn}>
                                    <SectionHeader icon={Crown} title={t.bestMatch} color="from-amber-500 to-yellow-500" />
                                    <div className="glass-card p-5 md:p-6 mt-3 border border-primary/20 relative overflow-hidden group">
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                                        <div className="flex items-start gap-4 relative">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 flex-shrink-0">
                                                <div className="w-full h-full rounded-[0.85rem] bg-card flex items-center justify-center">
                                                    <Crown className="w-6 h-6 text-primary" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{t.bestMatch}</span>
                                                <h2 className="text-lg md:text-xl font-black text-foreground uppercase tracking-normal leading-tight">
                                                    {bestCareer.name}
                                                </h2>
                                                <p className="text-muted-foreground text-sm leading-relaxed">
                                                    {bestCareer.reason}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {comparisonData.customAnalysis && (
                                <motion.div variants={itemVariants}>
                                    <SectionHeader icon={BrainCircuit} title={t.customAnalysis} color="from-violet-500 to-fuchsia-500" />
                                    <div className="glass-card p-5 mt-3">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {comparisonData.customAnalysis}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Career Comparison Cards ── */}
                            <motion.div variants={itemVariants}>
                                <SectionHeader icon={Scale} title={t.title} color="from-blue-500 to-cyan-500" />
                                {comparedCareers.length > 0 ? (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
                                    {comparedCareers.map((career, idx) => {
                                        const isBest = career.career === bestCareer?.name;
                                        const dc = demandConfig[career.marketDemand] || demandConfig.medium;
                                        const dfc = difficultyConfig[career.learningDifficulty] || difficultyConfig.medium;

                                        return (
                                            <motion.div
                                                key={idx}
                                                variants={scaleIn}
                                                className={`glass-card p-5 space-y-4 relative overflow-hidden group transition-transform duration-300 ${isBest ? "ring-1 ring-primary/30" : ""
                                                    }`}
                                            >
                                                {/* Best badge */}
                                                {isBest && (
                                                    <div className="absolute top-4 right-4">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                                                            <Trophy className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Career name + match bar */}
                                                <div className="space-y-3 pr-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isBest ? "bg-gradient-to-br from-primary/20 to-secondary/20" : "bg-blue-500/10"}`}>
                                                            <GraduationCap className={`w-5 h-5 ${isBest ? "text-primary" : "text-blue-400"}`} />
                                                        </div>
                                                        <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-normal leading-snug">{career.career}</h3>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${career.matchPercentage}%` }}
                                                                transition={{ duration: 1.2, delay: 0.3 + idx * 0.2, ease: [0.16, 1, 0.3, 1] }}
                                                                className={`h-full rounded-full bg-gradient-to-r ${isBest
                                                                    ? "from-primary to-secondary"
                                                                    : matchGradient(career.matchPercentage)
                                                                    }`}
                                                            />
                                                        </div>
                                                        <span className="text-base font-black text-foreground min-w-[40px] text-right">{career.matchPercentage}%</span>
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.18em] opacity-35">{t.match}</span>
                                                </div>

                                                {/* Summary */}
                                                {career.summary && (
                                                    <p className="text-muted-foreground text-sm leading-relaxed border-l-2 border-white/10 pl-3">{career.summary}</p>
                                                )}

                                                {/* Pros */}
                                                {career.pros?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                                            <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                                                                <ThumbsUp className="w-3 h-3" />
                                                            </div>
                                                            {t.pros}
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {career.pros.map((pro, i) => (
                                                                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                                                                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                                    {pro}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Cons */}
                                                {career.cons?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                                            <div className="w-5 h-5 rounded-md bg-rose-500/10 flex items-center justify-center">
                                                                <ThumbsDown className="w-3 h-3" />
                                                            </div>
                                                            {t.cons}
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {career.cons.map((con, i) => (
                                                                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/60">
                                                                    <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                                                    {con}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Meta badges */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    {career.marketDemand && (
                                                        <div className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border ${dc.bg} ${dc.border} ${dc.text}`}>
                                                            <BarChart3 className="w-4 h-4" />
                                                            <span className="text-[8px] font-black uppercase tracking-wider">{t.demand}</span>
                                                            <div className="flex items-center gap-1">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${dc.dot}`} />
                                                                <span className="text-xs font-bold">{t[career.marketDemand] || career.marketDemand}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {career.learningDifficulty && (
                                                        <div className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border ${dfc.bg} ${dfc.border} ${dfc.text}`}>
                                                            <GraduationCap className="w-4 h-4" />
                                                            <span className="text-[8px] font-black uppercase tracking-wider">{t.difficulty}</span>
                                                            <div className="flex items-center gap-1">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${dfc.dot}`} />
                                                                <span className="text-xs font-bold">{t[career.learningDifficulty] || career.learningDifficulty}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {career.salaryRange && (
                                                        <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                                                            <DollarSign className="w-4 h-4" />
                                                            <span className="text-[8px] font-black uppercase tracking-wider">{t.salary}</span>
                                                            <span className="text-[10px] font-bold text-center leading-tight">{career.salaryRange}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Skills */}
                                                {career.skillsRequired?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                                                            <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
                                                                <Zap className="w-3 h-3 text-amber-400" />
                                                            </div>
                                                            {t.skills}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {career.skillsRequired.map((skill, i) => (
                                                                <span key={i} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-foreground/70 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200">{skill}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                    </div>
                                ) : (
                                    <div className="glass-card p-8 mt-4 text-center">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t.noComparisonData}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    );
};

/* ─── Section Header Sub-component ─── */
const SectionHeader = ({ icon: Icon, title, color }) => (
    <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} p-0.5`}>
            <div className="w-full h-full rounded-[0.5rem] bg-card flex items-center justify-center">
                <Icon className="w-[18px] h-[18px] text-foreground" />
            </div>
        </div>
        <h3 className="text-lg md:text-xl font-black text-foreground uppercase tracking-normal">{title}</h3>
    </div>
);

export default CareerCompare;
