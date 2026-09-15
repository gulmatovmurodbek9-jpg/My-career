import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Search, Scale, Sparkles, Trophy, ThumbsUp, ThumbsDown,
    Target, TrendingUp, GraduationCap, DollarSign, BarChart3,
    Loader2, AlertCircle, CheckCircle, XCircle, Zap, Crown,
    ChevronRight, Plus, X, Star, ArrowUpRight, Bookmark, Lightbulb
} from "lucide-react";
import { Link } from "react-router";
import AiBotIcon from "../../components/AiBotIcon";
import { useTranslation } from "react-i18next";
import { clusterLabel } from "../../lib/clusterLabel";
import { careerName, careerDescription } from "../../lib/careerText";
import { withLang, currentApiLang } from "../../lib/apiLang";
import axios from "axios";
import { API, AI_TIMEOUT_MS, isTimeout } from "../../lib/config";
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
        errorTimeout: "Ҷавоб дер монд. Шабакаро санҷед ва дубора кӯшиш кунед.",
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
        factsTitle: "Далелҳо аз базаи мо",
        factCareer: "Ихтисос",
        factCode: "Коди ММТ",
        factDuration: "Муддат",
        factTuition: "Нарх (сомонӣ/сол)",
        factFree: "Ҷойи ройгон",
        factUniversities: "Донишгоҳҳо",
        factYears: "сол",
        factFreeYes: "Ҳаст",
        factFreeNo: "Нест",
        factsNote: "Ин рақамҳо аз базаи мо гирифта шудаанд, на аз AI.",
        alternativesTitle: "Вариантҳои беҳтар",
        alternativesDesc: "AI инҳоро аз базаи ихтисосҳои ММТ интихоб кард: шояд ба саволи шумо аз ихтисосҳои интихобшуда беҳтар мувофиқ бошанд. Ҳамаашон воқеӣ ҳастанд ва ба онҳо ҳуҷҷат супоридан мумкин аст.",
        viewSpecialty: "Дидани ихтисос",
        addToCompare: "Ба муқоиса илова кардан",
        addedToCompare: "Илова шуд",
        factsPurpose: "Ин ҷадвал ҷавоби AI-ро месанҷад. Коди ММТ, муддат, нарх, ҷойи ройгон ва шумораи донишгоҳҳо рост аз базаи расмии мо гирифта шудаанд, на аз AI. Агар AI дар боло чизи дигар гӯяд, ба ин ҷадвал бовар кунед.",
        savedTitle: "Захирашуда",
        savedDesc: "Ихтисосҳое, ки шумо захира кардаед",
        suggestedGroupTitle: "Аз рӯи натиҷаи санҷиш",
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
        errorTimeout: "Ответ занял слишком много времени. Проверьте сеть и попробуйте снова.",
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
        factsTitle: "Данные из нашей базы",
        factCareer: "Специальность",
        factCode: "Код НЦТ",
        factDuration: "Срок",
        factTuition: "Цена (сомони/год)",
        factFree: "Бюджет",
        factUniversities: "Вузы",
        factYears: "лет",
        factFreeYes: "Есть",
        factFreeNo: "Нет",
        factsNote: "Эти цифры взяты из нашей базы, а не от AI.",
        alternativesTitle: "Варианты получше",
        alternativesDesc: "AI выбрал их из базы специальностей НЦТ: возможно, они лучше подходят под ваш вопрос, чем выбранные. Все они реальные, и на них можно подать документы.",
        viewSpecialty: "Открыть специальность",
        addToCompare: "Добавить к сравнению",
        addedToCompare: "Добавлено",
        factsPurpose: "Эта таблица проверяет ответ AI. Код НЦТ, срок обучения, цена, бюджетные места и число университетов взяты прямо из нашей официальной базы, а не от AI. Если выше AI говорит иначе — верьте таблице.",
        savedTitle: "Сохранённые",
        savedDesc: "Специальности, которые вы сохранили",
        suggestedGroupTitle: "По результатам теста",
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
        errorTimeout: "The response took too long. Check your connection and try again.",
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
        factsTitle: "Facts from our database",
        factCareer: "Specialty",
        factCode: "NTC code",
        factDuration: "Duration",
        factTuition: "Tuition (TJS/year)",
        factFree: "State-funded",
        factUniversities: "Universities",
        factYears: "yrs",
        factFreeYes: "Yes",
        factFreeNo: "No",
        factsNote: "These figures come from our database, not from the AI.",
        alternativesTitle: "Better options",
        alternativesDesc: "The AI picked these from the NTC specialty database as possibly a better fit for your question than the ones you selected. All of them are real and open for applications.",
        viewSpecialty: "View specialty",
        addToCompare: "Add to comparison",
        addedToCompare: "Added",
        factsPurpose: "This table checks the AI's answer. The NTC code, duration, price, free places and number of universities come straight from our official database, not from the AI. If the AI says something different above, trust this table.",
        savedTitle: "Saved",
        savedDesc: "The specialties you saved",
        suggestedGroupTitle: "From your quiz result",
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

    const itemName = item.career || item.name || item.title || fallbackName;
    if (!itemName) return null;

    return {
        ...item,
        career: itemName,
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
        /* Вариантҳои беҳтар: сервер онҳоро бо база санҷида, id ва рамз илова кардааст. */
        alternatives: toArray(comparisonRoot.alternatives ?? rootData.alternatives ?? [])
            .filter((item) => item && typeof item.name === "string" && item.name.trim()),
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
    /* Забон барои тарҷумаи номҳо: сервер барои пешниҳодҳо `nameTranslated`
       медиҳад, вале захираҳо бо сутуни `translations` меоянд. */
    const apiLang = currentApiLang();
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
        axios.get(`${API}/careers`, { params: withLang({ clusterId, limit: 8, page: 1 }) })
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

        savedCareers.forEach((career) => {
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
    }, [savedCareers]);

    /* Захирашуда аввал, баъд пешниҳодҳои санҷиш. Сарлавҳаҳо ҳамчун сатри
       ҷадвал мераванд, то худи кортҳо бетағйир монанд. */
    const groupedCareers = displayCareers;

    /* Сабтҳои пурраи ихтисосҳои интихобшуда — барои ҷадвали далелҳо.
       Тартиб ҳамон аст, ки корбар интихоб кард. */
    const selectedFacts = useMemo(
        () => careers.map((name) => displayCareers.find((c) => c.name === name)).filter(Boolean),
        [careers, displayCareers],
    );

    /* Нарх аз ҳадди поён то боло: як ихтисос дар донишгоҳҳои гуногун
       нархи гуногун дорад. */
    const tuitionText = (career) => {
        const min = career.minTuitionFee ?? career.tuitionFee;
        const max = career.maxTuitionFee ?? career.tuitionFee;
        if (!min && !max) return "—";
        const fmt = (value) => Number(value).toLocaleString("ru-RU");
        return !max || min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
    };

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
                { headers: { Authorization: `Bearer ${token}` }, timeout: AI_TIMEOUT_MS }
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
            } else if (isTimeout(err)) {
                setError(t.errorTimeout);
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
                    <div className="absolute inset-0 tajik-pattern opacity-10 pointer-events-none" />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-blue/20 flex items-center justify-center relative">
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
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-accent-blue/10 to-primary/10 border border-secondary/20 text-xs font-bold uppercase tracking-wide text-secondary">
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
                    <SectionHeader icon={Bookmark} title={t.savedTitle} color="from-blue-500 to-cyan-500" />
                    <p className="text-muted-foreground text-xs font-medium opacity-60">{t.savedDesc}</p>

                    {loadingSuggestions || loadingSavedCareers ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-blue/20 flex items-center justify-center">
                                    <Scale className="w-8 h-8 text-primary" />
                                </div>
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent-blue"
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
                            {groupedCareers.map((career, idx) => {
                                if (career.__header) {
                                    return (
                                        <p
                                            key={`header-${idx}`}
                                            className="col-span-full mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                                        >
                                            {career.__header}
                                        </p>
                                    );
                                }

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
                                                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center shadow-lg shadow-primary/25"
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
                                                ? "bg-gradient-to-br from-primary/20 to-accent-blue/10 border border-primary/20"
                                                : "bg-primary/5 border border-border group-hover:bg-primary/10 group-hover:border-primary/20"
                                        }`}>
                                            <GraduationCap className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"} transition-colors`} />
                                        </div>

                                        {/* Career name */}
                                        <h4 className="text-sm font-black text-foreground uppercase tracking-normal leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
                                            {careerName(career, apiLang)}
                                        </h4>

                                        {/* Description */}
                                        {career.description && (
                                            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mt-2 opacity-70">
                                                {careerDescription(career, apiLang)}
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
                        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.orManual}</span>
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
                                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                disabled={careers.length >= 5}
                            />
                        </div>
                        <button
                            onClick={addCareer}
                            disabled={!inputValue.trim() || careers.length >= 5}
                            className="px-5 py-3 bg-gradient-to-r from-accent-blue to-primary text-white font-bold rounded-xl text-[15px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {t.addCareer}
                        </button>
                    </div>

                    {/* Career count & hint */}
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-muted-foreground">
                            {t.selected}: {careers.length}/5
                        </span>
                        {careers.length < 5 && (
                            <span className="text-[13px] text-muted-foreground">
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
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border text-[15px] font-semibold text-foreground"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-blue/20 to-primary/20 flex items-center justify-center">
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
                    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <label className="text-[15px] font-semibold text-foreground">
                                {t.compareQuestion}
                            </label>
                            <div className="flex flex-wrap gap-2 lg:justify-end">
                                {[t.quickCompareSalary, t.quickCompareFuture, t.quickCompareProsCons].map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => setCompareQuestion(prompt)}
                                        className="rounded-[0.625rem] border border-border bg-background px-3 py-2 text-[13px] font-medium text-foreground hover:border-primary/40"
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
                            className="w-full resize-none rounded-[0.75rem] border border-border bg-background px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        />
                    </div>

                    {/* Compare button */}
                    <motion.button
                        onClick={handleCompare}
                        disabled={careers.length < 2 || loading || retryCountdown > 0}
                        whileTap={careers.length >= 2 && !loading ? { scale: 0.99 } : {}}
                        className="w-full py-3.5 bg-gradient-to-r from-primary via-accent-blue to-primary bg-[length:200%_100%] text-white font-bold rounded-xl text-[15px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden"
                    >
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
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-primary/20 flex items-center justify-center">
                                    <Scale className="w-10 h-10 text-secondary" />
                                </div>
                                {/* Orbiting dots */}
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-accent-blue to-primary"
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
                                    <div className="glass-card p-5 md:p-6 mt-3 border border-primary/20 relative overflow-hidden">
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                                        <div className="flex items-start gap-4 relative">
                                            <AiBotIcon icon={Crown} size="md" />
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <h2 className="text-lg md:text-xl font-black text-foreground uppercase tracking-normal leading-tight">
                                                    {bestCareer.name}
                                                </h2>
                                                <p className="text-muted-foreground text-[15px] leading-relaxed">
                                                    {bestCareer.reason}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {comparisonData.customAnalysis && (
                                <motion.div variants={itemVariants}>
                                    <SectionHeader title={t.customAnalysis} color="from-violet-500 to-fuchsia-500" />
                                    <div className="glass-card p-5 mt-3">
                                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {comparisonData.customAnalysis}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Далелҳо аз база: рақами санҷидашуда пеш аз матни AI ── */}
                            {selectedFacts.length > 0 && (
                                <motion.div variants={itemVariants}>
                                    <SectionHeader icon={Scale} title={t.factsTitle} subtitle={t.factsPurpose} />
                                    <div className="glass-card mt-3 overflow-x-auto">
                                        <table className="w-full min-w-[600px] text-[15px]">
                                            <thead>
                                                <tr className="text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                                    <th className="px-4 py-3">{t.factCareer}</th>
                                                    <th className="px-4 py-3">{t.factCode}</th>
                                                    <th className="px-4 py-3">{t.factDuration}</th>
                                                    <th className="px-4 py-3">{t.factTuition}</th>
                                                    <th className="px-4 py-3">{t.factFree}</th>
                                                    <th className="px-4 py-3">{t.factUniversities}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedFacts.map((career) => (
                                                    <tr key={career.id || career.name} className="border-t border-border/60">
                                                        <td className="px-4 py-3 font-bold text-foreground">
                                                            {careerName(career, apiLang)}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-muted-foreground">
                                                            {career.code || "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                            {career.durationYears ? `${career.durationYears} ${t.factYears}` : "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                            {tuitionText(career)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {career.hasFreeSeats ? (
                                                                <span className="font-bold text-emerald-500">{t.factFreeYes}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">{t.factFreeNo}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {career.universities?.length ?? "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                                                className={`glass-card p-5 space-y-4 relative overflow-hidden ${isBest ? "ring-1 ring-primary/30" : ""
                                                    }`}
                                            >
                                                {/* Best badge */}
                                                {isBest && (
                                                    <div className="absolute top-4 right-4">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center shadow-lg shadow-primary/20">
                                                            <Trophy className="w-4 h-4 text-white" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Career name + match bar */}
                                                <div className="space-y-3 pr-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <GraduationCap className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-normal leading-snug">{career.career}</h3>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2.5 flex-1 bg-muted rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${career.matchPercentage}%` }}
                                                                transition={{ duration: 1.2, delay: 0.3 + idx * 0.2, ease: [0.16, 1, 0.3, 1] }}
                                                                className={`h-full rounded-full bg-gradient-to-r ${isBest
                                                                    ? "from-primary to-accent-blue"
                                                                    : matchGradient(career.matchPercentage)
                                                                    }`}
                                                            />
                                                        </div>
                                                        <span className="text-base font-black text-foreground min-w-[40px] text-right">{career.matchPercentage}%</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-muted-foreground">{t.match}</span>
                                                </div>

                                                {/* Summary */}
                                                {career.summary && (
                                                    <p className="text-muted-foreground text-[15px] leading-relaxed border-l-2 border-border pl-3">{career.summary}</p>
                                                )}

                                                {/* Pros */}
                                                {career.pros?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                                                            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                                                <ThumbsUp className="w-3 h-3" />
                                                            </div>
                                                            {t.pros}
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {career.pros.map((pro, i) => (
                                                                <li key={i} className="flex items-start gap-2.5 text-[15px] text-foreground">
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
                                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                                                            <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-600 flex items-center justify-center">
                                                                <ThumbsDown className="w-3 h-3" />
                                                            </div>
                                                            {t.cons}
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {career.cons.map((con, i) => (
                                                                <li key={i} className="flex items-start gap-2.5 text-[15px] text-foreground/80">
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
                                                        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 p-3 text-center text-foreground">
                                                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-xs font-semibold text-muted-foreground">{t.demand}</span>
                                                            <div className="flex items-center gap-1">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${dc.dot}`} />
                                                                <span className="text-sm font-bold">{t[career.marketDemand] || career.marketDemand}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {career.learningDifficulty && (
                                                        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 p-3 text-center text-foreground">
                                                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-xs font-semibold text-muted-foreground">{t.difficulty}</span>
                                                            <div className="flex items-center gap-1">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${dfc.dot}`} />
                                                                <span className="text-sm font-bold">{t[career.learningDifficulty] || career.learningDifficulty}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {career.salaryRange && (
                                                        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 p-3 text-center text-foreground">
                                                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-xs font-semibold text-muted-foreground">{t.salary}</span>
                                                            <span className="text-sm font-bold leading-snug">{career.salaryRange}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Skills */}
                                                {career.skillsRequired?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                                                            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                                                                <Zap className="w-3.5 h-3.5 text-primary" />
                                                            </div>
                                                            {t.skills}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {career.skillsRequired.map((skill, i) => (
                                                                <span key={i} className="px-2.5 py-1 rounded-lg border border-border bg-muted/40 text-[13px] text-foreground">{skill}</span>
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

                            {/* ── Вариантҳои беҳтар аз база ──
                                Танҳо ихтисосҳои воқеии ММТ: сервер ҳар номро бо база санҷидааст. */}
                            {comparisonData.alternatives?.length > 0 && (
                                <motion.div variants={itemVariants}>
                                    <SectionHeader icon={Lightbulb} title={t.alternativesTitle} subtitle={t.alternativesDesc} />
                                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                        {comparisonData.alternatives.map((alt) => {
                                            const alreadyAdded = careers.includes(alt.name);
                                            return (
                                                <div key={alt.id || alt.name} className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4">
                                                    <div className="space-y-1">
                                                        {alt.code && <span className="font-mono text-xs text-muted-foreground">{alt.code}</span>}
                                                        <h4 className="text-base font-bold leading-snug text-foreground">{alt.name}</h4>
                                                        {alt.cluster && <p className="text-[13px] text-muted-foreground">{alt.cluster}</p>}
                                                    </div>
                                                    {alt.reason && (
                                                        <p className="flex-1 text-[15px] leading-relaxed text-foreground/80">{alt.reason}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2">
                                                        {alt.id && (
                                                            <Link
                                                                to={`/info/${alt.id}`}
                                                                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-[13px] font-semibold text-foreground hover:border-primary/40"
                                                            >
                                                                {t.viewSpecialty}
                                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                                            </Link>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCareer(alt.name)}
                                                            disabled={alreadyAdded || careers.length >= 5}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-[13px] font-semibold text-primary disabled:opacity-50"
                                                        >
                                                            {alreadyAdded ? <CheckCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                                            {alreadyAdded ? t.addedToCompare : t.addToCompare}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    );
};

/* ─── Section Header Sub-component ─── */
/* Ҳамон нишони AI-и чат (AiBotIcon). Пештар ҳар бахш ҳалқаи ранги дигар
   дошт — зард, бунафш, сабз, кабуд — ва саҳифа ола менамуд. `color` дигар
   истифода намешавад; `subtitle` мақсади бахшро мефаҳмонад. */
const SectionHeader = ({ icon, title, subtitle }) => (
    <div className="flex items-start gap-3">
        <AiBotIcon icon={icon} size="sm" />
        <div className="min-w-0">
            <h3 className="text-lg md:text-xl font-black leading-10 text-foreground uppercase tracking-tight">{title}</h3>
            {subtitle && <p className="max-w-3xl text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
    </div>
);

export default CareerCompare;
