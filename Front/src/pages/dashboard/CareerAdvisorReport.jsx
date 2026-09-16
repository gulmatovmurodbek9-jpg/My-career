import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    Sparkles,
    Target,
    TrendingUp,
    Route,
    ChevronRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Star,
    Zap,
    GraduationCap,
    BookOpen,
    Video,
    ExternalLink,
    ListChecks,
    CalendarDays,
} from "lucide-react";
import { Link } from "react-router";
import AiBotIcon from "../../components/AiBotIcon";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API, AI_TIMEOUT_MS, isTimeout } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { MMT_CLUSTERS, MMT_MAX } from "../../lib/mmtClusters";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const labels = {
    tj: {
        title: "AI Маслиҳатгари Касбӣ",
        subtitle: "Таҳлили мушаххас дар асоси профили психологии шумо",
        badge: "AI Маслиҳатгар",
        generating: "AI таҳлил мекунад...",
        generatingDesc: "Натиҷаи санҷиши шумо бо зеҳни сунъӣ таҳлил карда мешавад",
        section1: "Таҳлили Шахсият",
        section2: "Тавсияи Ихтисосҳо",
        section3: "Далелнокӣ",
        section4: "Пешбинии Муваффақият",
        section5: "Нақшаи Роҳ",
        section6: "Манбаъҳо ва омӯзиш",
        section7: "Пешбинии 10 сола",
        section8: "Ҷавобҳои тести шумо",
        match: "Мувофиқат",
        probability: "Эҳтимол",
        step: "Қадам",
        duration: "Давомнокӣ",
        back: "Бозгашт",
        noQuiz: "Аввал тестро гузаред",
        noQuizDesc: "Барои гирифтани тавсияи AI, тести психологиро гузаред.",
        startQuiz: "Оғоз кардани тест",
        error: "Хатогӣ рӯй дод",
        errorTimeout: "Ҷавоб дер монд. Шабакаро санҷед ва дубора кӯшиш кунед.",
        errorNetwork: "Пайваст бо сервер канда шуд. Интернетро санҷед ва дубора кӯшиш кунед.",
        retry: "Дубора кӯшиш кунед",
        targetCareer: "Ихтисоси мақсад",
        successChance: "Шонси муваффақият",
        books: "Китобҳо",
        videos: "Видео-урокҳо",
        courses: "Курсҳо",
        sources: "Манбаъҳо",
        answered: "Ҷавоб дода шуд",
        shortTerm: "1-3 сол",
        midTerm: "4-7 сол",
        longTerm: "8-10 сол",
        opportunities: "Имкониятҳо",
        risks: "Хатарҳо",
        salaryOutlook: "Маоши тахминӣ",
        salaryUp: "Чӣ маошро зиёд мекунад",
        salaryDown: "Чӣ маошро кам мекунад",
        demandOutlook: "Талабот ба мутахассис",
        now: "Ҳозир",
        in10Years: "10 сол баъд",
        demandLevels: {
            "very low": "Хеле паст",
            low: "Паст",
            "below average": "Аз миёна паст",
            medium: "Миёна",
            moderate: "Миёна",
            average: "Миёна",
            "above average": "Аз миёна баланд",
            high: "Баланд",
            "very high": "Хеле баланд",
            growing: "Афзоишёбанда",
            stable: "Устувор",
            declining: "Камшаванда",
        },
        reasons: "Сабабҳо",
        beginner: "Навомӯз",
        middle: "Миёна",
        senior: "Пешқадам",
        open: "Кушодан",
    },
    ru: {
        title: "AI Карьерный Советник",
        subtitle: "Подробный анализ на основе вашего психологического профиля",
        badge: "AI Советник",
        generating: "AI анализирует...",
        generatingDesc: "Результат вашего теста анализируется искусственным интеллектом",
        section1: "Анализ Личности",
        section2: "Рекомендации Профессий",
        section3: "Обоснование",
        section4: "Прогноз Успеха",
        section5: "Дорожная Карта",
        section6: "Ресурсы и обучение",
        section7: "Прогноз на 10 лет",
        section8: "Ваши ответы",
        match: "Совпадение",
        probability: "Вероятность",
        step: "Шаг",
        duration: "Длительность",
        back: "Назад",
        noQuiz: "Сначала пройдите тест",
        noQuizDesc: "Для получения AI рекомендации пройдите психологический тест.",
        startQuiz: "Начать тест",
        error: "Произошла ошибка",
        errorTimeout: "Ответ занял слишком много времени. Проверьте сеть и попробуйте снова.",
        errorNetwork: "Соединение с сервером прервалось. Проверьте интернет и попробуйте снова.",
        retry: "Попробовать снова",
        targetCareer: "Целевая профессия",
        successChance: "Шанс на успех",
        books: "Книги",
        videos: "Видеоуроки",
        courses: "Курсы",
        sources: "Источники",
        answered: "Отвечено",
        shortTerm: "1-3 года",
        midTerm: "4-7 лет",
        longTerm: "8-10 лет",
        opportunities: "Возможности",
        risks: "Риски",
        salaryOutlook: "Примерная зарплата",
        salaryUp: "Что увеличивает зарплату",
        salaryDown: "Что уменьшает зарплату",
        demandOutlook: "Востребованность специалиста",
        now: "Сейчас",
        in10Years: "Через 10 лет",
        demandLevels: {
            "very low": "Очень низкая",
            low: "Низкая",
            "below average": "Ниже средней",
            medium: "Средняя",
            moderate: "Средняя",
            average: "Средняя",
            "above average": "Выше средней",
            high: "Высокая",
            "very high": "Очень высокая",
            growing: "Растущая",
            stable: "Стабильная",
            declining: "Снижающаяся",
        },
        reasons: "Причины",
        beginner: "Начинающий",
        middle: "Средний",
        senior: "Старший",
        open: "Открыть",
    },
    en: {
        title: "AI Career Advisor",
        subtitle: "Detailed analysis based on your psychological profile",
        badge: "AI Advisor",
        generating: "AI is analyzing...",
        generatingDesc: "Your quiz result is being analyzed by artificial intelligence",
        section1: "Personality Analysis",
        section2: "Career Recommendations",
        section3: "Explanation",
        section4: "Success Prediction",
        section5: "Career Roadmap",
        section6: "Resources & Learning",
        section7: "10-Year Outlook",
        section8: "Your Quiz Answers",
        match: "Match",
        probability: "Probability",
        step: "Step",
        duration: "Duration",
        back: "Back",
        noQuiz: "Take the quiz first",
        noQuizDesc: "To get an AI recommendation, complete the psychological test.",
        startQuiz: "Start Quiz",
        error: "An error occurred",
        errorTimeout: "The response took too long. Check your connection and try again.",
        errorNetwork: "The connection to the server was lost. Check your internet and try again.",
        retry: "Try again",
        targetCareer: "Target Career",
        successChance: "Success Chance",
        books: "Books",
        videos: "Video Lessons",
        courses: "Courses",
        sources: "Sources",
        answered: "Answered",
    },
};

const clusterName = (key, t) => {
    const cluster = MMT_CLUSTERS.find((c) => c.key === key);
    return cluster ? t(cluster.i18nKey, cluster.fallback) : key.toUpperCase();
};

const probColor = (p) => {
    if (p >= 85) return "from-emerald-500 to-green-400";
    if (p >= 70) return "from-blue-500 to-cyan-400";
    if (p >= 60) return "from-amber-500 to-yellow-400";
    return "from-rose-500 to-orange-400";
};

const probBg = (p) => {
    if (p >= 85) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (p >= 70) return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    if (p >= 60) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-rose-500/10 border-rose-500/20 text-rose-400";
};


const QUIZ_STORAGE_KEY = "quiz_results_v1";

const CareerAdvisorReport = () => {
    const { i18n, t: translate } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const t = labels[lang] || labels.tj;

    const { user, token, refreshProfile } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (token && !user?.quizResults) {
            refreshProfile();
        }
    }, [token, user?.quizResults, refreshProfile]);

    const getStoredQuiz = () => {
        try {
            const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (_) {
            return null;
        }
    };

    const getQuizScores = () => {
        if (user?.quizResults) {
            if (user.quizResults.scores && typeof user.quizResults.scores === "object") {
                return user.quizResults.scores;
            }
            return user.quizResults;
        }
        const parsed = getStoredQuiz();
        if (parsed) {
            if (parsed?.scores && typeof parsed.scores === "object") {
                return parsed.scores;
            }
            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        }
        return null;
    };

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

    const quizScores = getQuizScores();
    const storedQuiz = getStoredQuiz();
    const hasQuizProfile = isValidQuizScores(quizScores);

    const fetchingRef = useRef(false);

    // Ҳисоботи охирин дар браузер нигоҳ дошта мешавад ва фавран нишон дода мешавад.
    const cacheKey = quizScores ? `ai_advisor_report_v1:${lang}:${JSON.stringify(quizScores)}` : null;
    const readCachedReport = () => {
        if (!cacheKey) return null;
        try {
            const raw = localStorage.getItem(cacheKey);
            const parsed = raw ? JSON.parse(raw) : null;
            return parsed?.data?.report ? parsed.data : null;
        } catch (_) {
            return null;
        }
    };
    const writeCachedReport = (report) => {
        if (!cacheKey) return;
        try {
            localStorage.setItem(cacheKey, JSON.stringify({ data: report, savedAt: new Date().toISOString() }));
        } catch (_) {
        }
    };

    const fetchReport = async (options = {}) => {
        const silent = options?.silent === true;
        const attempt = Number.isInteger(options?.attempt) ? options.attempt : 0;
        if (!hasQuizProfile || !quizScores || (fetchingRef.current && attempt === 0)) return;
        fetchingRef.current = true;
        if (!silent) {
            setLoading(true);
            setError(null);
        }
        let retrying = false;
        try {
            const res = await axios.post(
                `${API}/careers/ai-advisor`,
                {
                    scores: quizScores,
                    lang,
                    quizProfile: {
                        answers: storedQuiz?.answers || [],
                        topCluster: storedQuiz?.topCluster || null,
                        topType: storedQuiz?.topType || null,
                        answeredAt: storedQuiz?.answeredAt || null,
                        quizLang: storedQuiz?.quizLang || lang,
                    },
                },
                { headers: { Authorization: `Bearer ${token}` }, timeout: AI_TIMEOUT_MS }
            );
            setData(res.data);
            writeCachedReport(res.data);
        } catch (err) {
            console.error("AI Advisor error:", err);
            if (!err?.response && !isTimeout(err) && attempt === 0) {
                retrying = true;
                await new Promise((resolve) => setTimeout(resolve, 1500));
                fetchingRef.current = false;
                return fetchReport({ silent, attempt: 1 });
            }
            if (silent) return;
            setError(
                isTimeout(err) ? t.errorTimeout
                    : !err?.response ? t.errorNetwork
                    : err.response.data?.message || t.error,
            );
        } finally {
            if (!retrying) {
                if (!silent) setLoading(false);
                fetchingRef.current = false;
            }
        }
    };

    useEffect(() => {
        if (!hasQuizProfile || !token) return;
        const cached = readCachedReport();
        if (cached) {
            setData(cached);
            setError(null);
            fetchReport({ silent: true });
        } else {
            fetchReport();
        }
    }, [hasQuizProfile, token, lang]);

    if (!hasQuizProfile) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-14 text-center flex flex-col items-center gap-6 max-w-md relative overflow-hidden"
                >
                    <div className="absolute inset-0 tajik-pattern opacity-10 pointer-events-none" />
                    <AiBotIcon size="lg" />
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

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-6"
                >
                    <AiBotIcon size="lg" />
                    <div className="text-center space-y-1.5">
                        <p className="text-foreground font-bold text-base flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t.generating}
                        </p>
                        <p className="text-muted-foreground text-sm">{t.generatingDesc}</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-12 text-center flex flex-col items-center gap-5 max-w-md"
                >
                    <div className="w-14 h-14 rounded-xl bg-rose-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-rose-500" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-lg font-black text-foreground">{t.error}</h3>
                        <p className="text-muted-foreground text-sm">{error}</p>
                    </div>
                    <button onClick={fetchReport} className="btn-primary px-6 py-2.5 text-sm cursor-pointer">
                        {t.retry}
                    </button>
                </motion.div>
            </div>
        );
    }

    if (!data) return null;

    const { report, mmtScores, dominantTypes } = data;

    return (
        <div className="pb-20">
            <motion.div key="report" variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

                <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4">
                    <div className="flex flex-col items-start gap-3">
                        <Link to="/dashboard" className="inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {t.back}
                        </Link>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold uppercase tracking-wide text-primary">
                            <Bot className="w-3.5 h-3.5" />
                            {t.badge}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter uppercase">
                            {t.title}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium opacity-60">{t.subtitle}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {dominantTypes?.map((dt, i) => (
                            <div
                                key={dt.type}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider ${i === 0
                                    ? "bg-gradient-to-r from-primary to-accent-blue text-white"
                                    : "glass-card-sm text-foreground"
                                    }`}
                            >
                                {clusterName(dt.type, translate)}: {dt.score}
                            </div>
                        ))}
                    </div>
                </motion.header>

                <motion.section variants={itemVariants}>
                    <SectionHeader icon={Bot} title={t.section1} />
                    <div className="glass-card p-6 md:p-8 mt-3">
                        <div className="flex items-start gap-4">
                            <p className="text-foreground text-base leading-relaxed font-medium">
                                {report.personalityAnalysis}
                            </p>
                        </div>

                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(mmtScores || {}).map(([key, val]) => (
                                <div key={key} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                            {clusterName(key, translate)}
                                        </span>
                                        <span className="text-sm font-black text-foreground">{val}</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (val / MMT_MAX) * 100)}%` }}
                                            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <motion.section variants={itemVariants}>
                    <SectionHeader icon={Target} title={t.section2} color="from-blue-500 to-cyan-500" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        {report.careerRecommendations?.map((career, idx) => (
                            <motion.div
                                key={idx}
                                variants={scaleIn}
                                className={`glass-card p-6 relative overflow-hidden ${idx === 0 ? "ring-1 ring-primary/30" : ""
                                    }`}
                            >
                                {idx === 0 && (
                                    <div className="absolute top-3 right-3 w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center">
                                        <Star className="w-3.5 h-3.5 text-white fill-white" />
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <GraduationCap className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h4 className="font-black text-foreground text-base uppercase tracking-tight">
                                        {career.name}
                                    </h4>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {career.shortDescription}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${career.matchPercentage}%` }}
                                                transition={{ duration: 1.2, delay: 0.5 + idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                            />
                                        </div>
                                        <span className="text-sm font-black text-blue-400 min-w-[40px] text-right">
                                            {career.matchPercentage}%
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                                        {t.match}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                <motion.section variants={itemVariants}>
                    <SectionHeader icon={Sparkles} title={t.section3} color="from-amber-500 to-orange-500" />
                    <div className="space-y-3 mt-3">
                        {report.explanation?.map((item, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="glass-card p-5 flex items-start gap-4"
                            >
                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-sm font-black text-amber-400">{idx + 1}</span>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <h5 className="text-base font-black text-foreground uppercase tracking-tight">
                                        {item.career}
                                    </h5>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {item.reason}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                <motion.section variants={itemVariants}>
                    <SectionHeader icon={TrendingUp} title={t.section4} color="from-emerald-500 to-green-500" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        {report.successPrediction?.map((pred, idx) => (
                            <motion.div
                                key={idx}
                                variants={scaleIn}
                                className="glass-card p-6 text-center space-y-4"
                            >
                                <h5 className="text-sm font-black text-foreground uppercase tracking-wider">
                                    {pred.career}
                                </h5>

                                <div className="relative w-28 h-28 mx-auto">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50" cy="50" r="42"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            className="text-white/5"
                                        />
                                        <motion.circle
                                            cx="50" cy="50" r="42"
                                            fill="none"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 42}`}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                            animate={{
                                                strokeDashoffset: 2 * Math.PI * 42 * (1 - pred.probability / 100),
                                            }}
                                            transition={{ duration: 1.5, delay: 0.5 + idx * 0.2, ease: [0.16, 1, 0.3, 1] }}
                                            className={`stroke-current ${pred.probability >= 80
                                                ? "text-emerald-400"
                                                : pred.probability >= 70
                                                    ? "text-blue-400"
                                                    : "text-amber-400"
                                                }`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-black text-foreground">{pred.probability}%</span>
                                    </div>
                                </div>

                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${probBg(pred.probability)}`}>
                                    <Zap className="w-3.5 h-3.5" />
                                    {t.probability}
                                </div>

                                {pred.reasoning && (
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {pred.reasoning}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                <motion.section variants={itemVariants}>
                    <SectionHeader icon={Route} title={t.section5} color="from-rose-500 to-pink-500" />
                    <div className="glass-card p-6 md:p-8 mt-3">
                        {report.careerRoadmap?.targetCareer && (
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center">
                                    <Target className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                                        {t.targetCareer}
                                    </span>
                                    <h4 className="text-base font-black text-foreground uppercase tracking-tight">
                                        {report.careerRoadmap.targetCareer}
                                    </h4>
                                </div>
                            </div>
                        )}

                        <div className="space-y-0">
                            {report.careerRoadmap?.steps?.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    className="flex gap-4 group"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-2 border-rose-500/30 flex items-center justify-center flex-shrink-0 group-hover:border-rose-500/60 transition-colors">
                                            <span className="text-xs font-black text-rose-400">{step.step || idx + 1}</span>
                                        </div>
                                        {idx < (report.careerRoadmap.steps.length - 1) && (
                                            <div className="w-0.5 flex-1 bg-gradient-to-b from-rose-500/20 to-transparent min-h-[24px]" />
                                        )}
                                    </div>

                                    <div className="pb-6 flex-1 flex items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h5 className="text-base font-bold text-foreground">
                                                {step.title}
                                            </h5>
                                            {step.description && (
                                                <p className="text-muted-foreground text-[15px] leading-relaxed mt-1.5">
                                                    {step.description}
                                                </p>
                                            )}
                                        </div>
                                        {step.duration && (
                                            <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[13px] font-semibold flex-shrink-0">
                                                <Clock className="w-3.5 h-3.5" />
                                                {step.duration}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {(report.learningResources || report.resources) && (
                    <motion.section variants={itemVariants}>
                        <SectionHeader icon={BookOpen} title={t.section6} color="from-cyan-500 to-blue-500" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <ResourceCard icon={BookOpen} title={t.books} items={(report.learningResources || report.resources)?.books} />
                            <ResourceCard icon={Video} title={t.videos} items={(report.learningResources || report.resources)?.videos} />
                            <ResourceCard icon={GraduationCap} title={t.courses} items={(report.learningResources || report.resources)?.courses} />
                            <ResourceCard icon={ExternalLink} title={t.sources} items={(report.learningResources || report.resources)?.sources} />
                        </div>
                    </motion.section>
                )}

                {report.tenYearOutlook && (
                    <motion.section variants={itemVariants}>
                        <SectionHeader icon={CalendarDays} title={t.section7} color="from-indigo-500 to-sky-500" />
                        <div className="glass-card p-6 md:p-8 mt-3 space-y-5">
                            {report.tenYearOutlook.summary && (
                                <p className="text-foreground text-base leading-relaxed font-medium">
                                    {report.tenYearOutlook.summary}
                                </p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <TextList title={t.shortTerm} items={report.tenYearOutlook.shortTerm} />
                                <TextList title={t.midTerm} items={report.tenYearOutlook.midTerm} />
                                <TextList title={t.longTerm} items={report.tenYearOutlook.longTerm} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextList title={t.opportunities} items={report.tenYearOutlook.opportunities} />
                                <TextList title={t.risks} items={report.tenYearOutlook.risks} />
                            </div>
                            {(report.tenYearOutlook.salaryOutlook || report.tenYearOutlook.demandOutlook) && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {report.tenYearOutlook.salaryOutlook && (
                                        <SalaryOutlookCard data={report.tenYearOutlook.salaryOutlook} t={t} />
                                    )}
                                    {report.tenYearOutlook.demandOutlook && (
                                        <DemandOutlookCard data={report.tenYearOutlook.demandOutlook} t={t} />
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.section>
                )}

                {(report.quizAnswerAnalysis?.length > 0 || storedQuiz?.answers?.length > 0) && (
                    <motion.section variants={itemVariants}>
                        <SectionHeader icon={ListChecks} title={t.section8} color="from-emerald-500 to-teal-500" />
                        <div className="glass-card p-5 md:p-6 mt-3 space-y-3">
                            {(report.quizAnswerAnalysis?.length ? report.quizAnswerAnalysis : storedQuiz.answers).map((item, idx) => (
                                <div key={idx} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-primary mb-2">
                                        {t.answered} #{idx + 1}
                                    </div>
                                    <h5 className="text-sm font-black text-foreground leading-snug">
                                        {item.question}
                                    </h5>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {item.selectedText || item.answer}
                                    </p>
                                    {item.insight && (
                                        <p className="text-xs text-emerald-300/80 mt-2 leading-relaxed">
                                            {item.insight}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}

            </motion.div>
        </div>
    );
};

const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-3">
        <AiBotIcon icon={Icon} size="sm" />
        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{title}</h3>
    </div>
);

const normalizeItems = (items) => {
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
};

const ResourceCard = ({ icon: Icon, title, items }) => {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const t = labels[lang] || labels.tj;

    const list = normalizeItems(items);
    if (!list.length) return null;

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
                <h4 className="text-sm font-black text-foreground uppercase tracking-wider">{title}</h4>
            </div>
            <div className="space-y-3">
                {list.map((item, idx) => {
                    const value = typeof item === "string" ? { title: item } : item;
                    return (
                        <div key={idx} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <div className="text-sm font-bold text-foreground">{value.title || value.name}</div>
                            {value.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{value.description}</p>}
                            {value.url && (
                                <a href={value.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary">
                                    {t.open || "Open"} <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TextList = ({ title, items }) => {
    const list = normalizeItems(items);
    if (!list.length) return null;

    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <h4 className="text-xs font-black uppercase tracking-[0.18em] text-primary mb-3">{title}</h4>
            <ul className="space-y-2">
                {list.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{typeof item === "string" ? item : item.text || item.title || item.description}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SalaryOutlookCard = ({ data, t }) => {
    const rows = [
        [t.beginner || "Beginner", data.current?.beginner, data.in10Years?.beginner],
        [t.middle || "Middle", data.current?.mid, data.in10Years?.mid],
        [t.senior || "Senior", data.current?.senior, data.in10Years?.senior],
    ].filter((row) => row[1] || row[2]);

    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t.salaryOutlook}</h4>
            <div className="space-y-2">
                {rows.map(([level, current, future]) => (
                    <div key={level} className="grid grid-cols-3 gap-2 rounded-lg bg-black/10 p-3 text-sm">
                        <span className="font-black text-foreground">{level}</span>
                        <span className="text-muted-foreground">{current || "..."}</span>
                        <span className="text-primary font-bold">{future || "..."}</span>
                    </div>
                ))}
            </div>
            {data.currency && <p className="text-xs text-muted-foreground">{data.currency}</p>}
            {data.note && <p className="text-xs text-muted-foreground leading-relaxed">{data.note}</p>}
            <TextList title={t.salaryUp} items={data.growthFactors} />
            <TextList title={t.salaryDown} items={data.riskFactors} />
        </div>
    );
};

const demandText = (value, t) => {
    if (!value) return "...";
    const key = String(value).trim().toLowerCase();
    return t.demandLevels?.[key] || value;
};

const DemandOutlookCard = ({ data, t }) => (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t.demandOutlook}</h4>
        <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[0.75rem] border border-border bg-muted/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">{t.now}</div>
                <div className="mt-0.5 text-lg font-bold text-foreground">{demandText(data.currentDemand, t)}</div>
            </div>
            <div className="rounded-[0.75rem] border border-primary/20 bg-primary/10 p-3">
                <div className="text-xs font-semibold text-primary">{t.in10Years}</div>
                <div className="mt-0.5 text-lg font-bold text-primary">{demandText(data.in10YearsDemand, t)}</div>
            </div>
        </div>
        {data.neededSpecialists && <p className="text-sm text-muted-foreground leading-relaxed">{data.neededSpecialists}</p>}
        <TextList title={t.reasons} items={data.why} />
    </div>
);

export default CareerAdvisorReport;
