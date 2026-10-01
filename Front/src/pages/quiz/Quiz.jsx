import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award,
    ArrowRight,
    Target,
    Zap,
    Users,
    ChevronLeft,
    ChevronRight,
    Check,
    Trophy,
    Sparkles,
    Search,
    Lightbulb,
    BarChart,
    Shield,
    FileText,
    TrendingUp,
    Bookmark,
    CheckCircle,
    Briefcase,
    Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { clusterLabel, clusterDescription } from "../../lib/clusterLabel";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";
import { MMT_CLUSTERS } from "../../lib/mmtClusters";
import { displayName } from "../../lib/careerName";

const QUIZ_STORAGE_KEY = "quiz_results_v1";

const SPEC_WINDOW = 8;
const CLUSTER_PAGE_SIZE = 12;

const LogoMark = ({ className = "" }) => (
    <img src="/logo.png" alt="" aria-hidden="true" className={`object-contain ${className}`} />
);

// Тартиби ҷавобҳо барои ҳар корбар омехта (ҷои ҷавоб ба самт ишора накунад),
// вале дар давоми як сессия барои ҳамон савол собит.
const SHUFFLE_SEED = Math.floor(Math.random() * 1e9);
const shuffledOrder = (id, count) => {
    let h = SHUFFLE_SEED;
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
        h = (h * 1103515245 + 12345) >>> 0;
        const j = h % (i + 1);
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
};
const STAGE2_COUNT = 5;

const Quiz = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { token, user, updateUser, logout } = useAuthStore();
    const { error: showError } = useToast();
    const [questions, setQuestions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [quizStage, setQuizStage] = useState(1);
    const [answers, setAnswers] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [askRetake, setAskRetake] = useState(false);

    const [clusterCareers, setClusterCareers] = useState([]);
    const [savedIds, setSavedIds] = useState(new Set());
    const [savingId, setSavingId] = useState(null);
    const [stageLoading, setStageLoading] = useState(false);
    const [clusterPage, setClusterPage] = useState(1);
    const [clusterLastPage, setClusterLastPage] = useState(1);
    const [refreshingCareers, setRefreshingCareers] = useState(false);
    const [specOffset, setSpecOffset] = useState(0);
    const [showAllMatched, setShowAllMatched] = useState(false);

    useEffect(() => {
        if (user?.savedCareers) {
            setSavedIds(new Set(user.savedCareers.map(c => c.id)));
        } else {
            setSavedIds(new Set());
        }
    }, [user?.savedCareers]);

    useEffect(() => {
        const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setResults(parsed);
                setAskRetake(true);
            } catch (_) {
                localStorage.removeItem(QUIZ_STORAGE_KEY);
            }
        }
    }, []);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const { data } = await axios.get(`${API}/quiz/questions`);
                setQuestions(data);
            } catch (err) {
                console.error("Fetch questions error:", err);
                showError(t('quiz.load_error_desc', 'Хатогӣ дар боргузорӣ. Лутфан дертар кӯшиш кунед.'));
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // Тугмаи ⚡ саҳифаи тасодуфии дигари кластерро меорад, на ҳамон 12-тои аввалро.
    const fetchClusterCareers = async (shuffle = false) => {
        if (!results?.topCluster?.id || refreshingCareers) return;
        setRefreshingCareers(shuffle);
        try {
            let page = 1;
            if (shuffle && clusterLastPage > 1) {
                do {
                    page = 1 + Math.floor(Math.random() * clusterLastPage);
                } while (page === clusterPage);
            }
            const { data } = await axios.get(`${API}/careers`, {
                params: { clusterId: results.topCluster.id, limit: CLUSTER_PAGE_SIZE, page },
            });
            let careers = data.data || [];
            if (shuffle) careers = [...careers].sort(() => Math.random() - 0.5);
            setClusterCareers(careers);
            setClusterPage(page);
            setClusterLastPage(data.meta?.lastPage || 1);
            if (shuffle) setSpecOffset((offset) => offset + SPEC_WINDOW);
        } catch (err) {
            console.error("Cluster careers fetch error:", err);
        } finally {
            setRefreshingCareers(false);
        }
    };


    const handleSaveCareer = async (career) => {
        if (!token) { navigate(`/login?next=${encodeURIComponent("/quiz")}`); return; }
        if (savingId) return;
        setSavingId(career.id);
        try {
            await axios.post(`${API}/users/save-career/${career.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSavedIds(prev => {
                const next = new Set(prev);
                if (next.has(career.id)) { next.delete(career.id); }
                else { next.add(career.id); }
                return next;
            });
            const currentSaved = user?.savedCareers || [];
            const alreadySaved = currentSaved.some(c => c.id === career.id);
            const updatedSaved = alreadySaved
                ? currentSaved.filter(c => c.id !== career.id)
                : [...currentSaved, career];
            updateUser({ savedCareers: updatedSaved });
        } catch (err) {
            console.error("Save career error:", err);
            showError(err.response?.data?.message || err.message || t("career_page.failed"));
        } finally {
            setSavingId(null);
        }
    };

    // Клики дубора ҳангоми боркунӣ саволҳои қадами 2-ро чанд бор илова мекард (15 → 570 савол).
    const busyRef = useRef(false);
    // Ҳолати охирин: тугмаҳои саволи қаблӣ ҳангоми аниматсияи гузариш ҳанӯз дар экран
    // ҳастанд ва бо маълумоти кӯҳна кор мекарданд (қадами 2 такрор илова мешуд).
    const latest = useRef({});
    latest.current = { questions, currentStep, quizStage, answers, idle: !showResults && !isAnalyzing && !askRetake && !loading };

    const handleAnswer = async (selectedValue, clickedQuestionId) => {
        if (busyRef.current) return;
        const { questions, currentStep, quizStage, answers } = latest.current;
        const questionId = questions[currentStep]?.id;
        if (!questionId || (clickedQuestionId && clickedQuestionId !== questionId)) return;
        if (questionId === "tiebreak") {
            selectedValue = questions[currentStep].options[Number(selectedValue)]?.value ?? selectedValue;
        }
        const newAnswers = [
            ...answers.filter((answer) => answer.questionId !== questionId),
            { questionId, selectedValue },
        ];
        setAnswers(newAnswers);

        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
            latest.current.currentStep = currentStep + 1;
        } else if (quizStage === 1 || quizStage === "tiebreak") {
            busyRef.current = true;
            setStageLoading(true);
            try {
                let clusterKey;
                if (quizStage === "tiebreak") {
                    clusterKey = String(selectedValue);
                } else {
                    // Танҳо холҳо (бе AI) — ҷавоб фавран.
                    const { data } = await axios.post(`${API}/quiz/score`, { answers: newAnswers });
                    const ranked = Object.entries(data?.scores?.mmtClusters || {})
                        .sort((a, b) => b[1] - a[1]);
                    const [first, second] = ranked;
                    // Ду самт қариб баробар — аз худи корбар мепурсем, на тасодуфан интихоб.
                    if (first && second && first[1] - second[1] < 0.15 * Math.max(first[1], 1)) {
                        const tiebreak = {
                            id: "tiebreak",
                            part: "tiebreak",
                            type: "refinement",
                            question: {
                                tj: "Ду самт ба шумо баробар наздик баромад. Кадомаш ба дилатон наздиктар аст?",
                                ru: "Два направления вам одинаково близки. Какое ближе вашему сердцу?",
                                en: "Two directions suit you equally. Which one is closer to your heart?",
                            },
                            options: [first, second].map(([key]) => ({ value: key, cluster: key })),
                        };
                        setQuestions((prev) => [...prev.filter((q) => q.id !== "tiebreak"), tiebreak]);
                        setQuizStage("tiebreak");
                        setCurrentStep((prev) => prev + 1);
                        return;
                    }
                    clusterKey = first?.[0] || "c1";
                }
                const { data: stage2Qs } = await axios.get(
                    `${API}/quiz/specialty-questions`,
                    { params: { clusterNumber: clusterKey.replace(/\D/g, "") || "1" } }
                );
                if (stage2Qs?.length > 0) {
                    setQuestions(prev => {
                        const known = new Set(prev.map((q) => q.id));
                        return [...prev, ...stage2Qs.filter((q) => !known.has(q.id))];
                    });
                    setQuizStage(2);
                    setCurrentStep(prev => prev + 1);
                } else {
                    busyRef.current = false;
                    submitQuiz(newAnswers);
                }
            } catch (err) {
                console.error('Stage 1 error:', err);
                busyRef.current = false;
                submitQuiz(newAnswers);
            } finally {
                setStageLoading(false);
                busyRef.current = false;
            }
        } else {
            submitQuiz(newAnswers);
        }
    };

    // Клавиатура: A–E ё 1–5 ҷавобро интихоб мекунад (ба ҳамон тартибе, ки дар экран аст).
    const answerRef = useRef(handleAnswer);
    answerRef.current = handleAnswer;
    useEffect(() => {
        const onKey = (event) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "")) return;
            const { questions: list, currentStep: step, idle } = latest.current;
            if (!idle) return;
            const question = list?.[step];
            if (!question?.options?.length) return;
            const key = event.key.toLowerCase();
            const position = /^[1-9]$/.test(key) ? Number(key) - 1 : "abcde".indexOf(key);
            if (position < 0 || position >= question.options.length) return;
            const idx = shuffledOrder(question.id, question.options.length)[position];
            answerRef.current(idx, question.id);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Ҷавобҳо бо матни савол ва интихоб — барои саҳифаи натиҷа ва ёвар.
    const enrich = (data, finalAnswers) => {
        const activeLang = i18n.language || "tj";
        const answeredQuestions = finalAnswers.map((answer) => {
            const question = questions.find((q) => q.id === answer.questionId);
            const selectedOption = question?.options?.[Number(answer.selectedValue)];
            return {
                questionId: answer.questionId,
                type: question?.type,
                part: question?.part,
                targetCluster: question?.targetCluster,
                question: question?.question?.[activeLang] || question?.question?.tj || question?.question?.en || "",
                selectedValue: answer.selectedValue,
                selectedText: selectedOption?.text?.[activeLang] || selectedOption?.text?.tj || selectedOption?.text?.en || "",
                scores: selectedOption?.scores || null,
                keywords: selectedOption?.keywords || [],
            };
        });
        return {
            ...data,
            answers: answeredQuestions,
            rawAnswers: finalAnswers,
            answeredAt: new Date().toISOString(),
            quizLang: activeLang,
        };
    };

    const showQuizResults = (data, finalAnswers) => {
        const enrichedData = enrich(data, finalAnswers);
        setResults(enrichedData);
        try {
            localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(enrichedData));
        } catch {
            /* хотираи браузер пур ё баста — натиҷа дар экран мемонад */
        }
        busyRef.current = false;
        setIsAnalyzing(false);
        setShowResults(true);
    };

    const submitQuiz = async (finalAnswers) => {
        if (busyRef.current) return;
        busyRef.current = true;
        setIsAnalyzing(true);
        const body = { answers: finalAnswers, lang: i18n.language };
        try {
            const url = token ? `${API}/quiz/submit-authenticated` : `${API}/quiz/submit`;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await axios.post(url, body, { headers });
            if (token) updateUser({ quizResults: data.scores });
            showQuizResults(data, finalAnswers);
        } catch (err) {
            console.error("Submit quiz error:", err);
            // Сессия гузашт — натиҷаро ҳамчун меҳмон ҳисоб мекунем, то ҷавобҳо гум нашаванд.
            if (err.response?.status === 401 && token) {
                logout();
                try {
                    const { data } = await axios.post(`${API}/quiz/submit`, body);
                    showQuizResults(data, finalAnswers);
                    return;
                } catch (retryErr) {
                    console.error("Retry submission failed:", retryErr);
                }
            }
            busyRef.current = false;
            setIsAnalyzing(false);
            // Пештар хато хомӯш буд: корбар намедонист, ки чӣ шуд. Ҷавобҳо мемонанд — метавон боз фиристод.
            showError(err.response?.data?.message || err.message || t("career_page.failed"));
        }
    };

    const handleRetake = () => {
        localStorage.removeItem(QUIZ_STORAGE_KEY);
        setResults(null);
        setAskRetake(false);
        setClusterCareers([]);
        setClusterPage(1);
        setClusterLastPage(1);
        setSpecOffset(0);
        setQuizStage(1);
        setSavedIds(new Set(user?.savedCareers?.map(c => c.id) || []));
        setAnswers([]);
        setCurrentStep(0);
        axios.get(`${API}/quiz/questions`).then(({ data }) => setQuestions(data)).catch(() => {});
    };

    const handleViewPrevious = () => {
        setAskRetake(false);
        setShowResults(true);
    };

    const totalExpected = quizStage === 2 ? questions.length : questions.filter((q) => q.id !== "tiebreak").length + STAGE2_COUNT;
    const progress = totalExpected > 0 ? Math.min(100, ((currentStep + 1) / totalExpected) * 100) : 0;
    const answeredCount = answers.length;
    const stageLabel = quizStage === 1 ? t('misc.quiz_stage_1') : t('misc.quiz_stage_2');

    const getIcon = (type) => {
        switch (type) {
            case "Realistic": return Zap;
            case "Investigative": return Search;
            case "Artistic": return Sparkles;
            case "Social": return Users;
            case "Enterprising": return Target;
            case "Conventional": return FileText;
            default: return LogoMark;
        }
    };

    if (askRetake && results) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card glass-card-glow p-10 text-center max-w-md w-full space-y-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
                            {t('quiz.previous_result_title', "Натиҷаи пештара мавҷуд аст")}
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            {t('quiz.previous_result_desc', "Шумо қаблан квизро гузаштед ва натиҷаҳо захира карда шудаанд. Мехоҳед натиҷаҳоро бубинед ё аз нав санҷиш гузаред?")}
                        </p>
                        {results.topCluster && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                                <Award className="w-3.5 h-3.5" />
                                {clusterLabel(t, results.topCluster)}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleViewPrevious}
                            className="btn-primary w-full !py-4 !text-sm cursor-pointer"
                        >
                            {t('quiz.view_results', "Натиҷаҳоро бубинед")}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleRetake}
                            className="glass-card w-full !p-4 hover:bg-white/5 transition-colors text-sm font-black uppercase tracking-widest cursor-pointer"
                        >
                            {t('quiz.retake', "Аз нав санҷиш гузаред")}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="p-8 glass-card text-center max-w-md">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-4">{t('quiz.load_error_title', "Хатогӣ дар боргузорӣ")}</h2>
                    <p className="text-muted-foreground text-sm mb-6">{t('quiz.load_error_desc', "Саволҳо ёфт нашуданд. Лутфан дертар кӯшиш кунед ё ба маъмурият хабар диҳед.")}</p>
                    <Link to="/">
                        <button className="btn-primary px-8 py-3 text-xs w-full cursor-pointer">
                            {t('quiz.back_home', "БА АСОСӢ")}
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    if (isAnalyzing) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="relative w-16 h-16">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full border-2 border-primary/10 border-t-primary rounded-full shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                    />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-black tracking-tight uppercase">{t('quiz.analyzing')}</h2>
                    <p className="text-muted-foreground text-[8px] font-black uppercase tracking-[0.3em] animate-pulse">
                        {t('quiz.analyzing', 'Таҳлили маълумот...')}
                    </p>
                </div>
            </div>
        );
    }

    const mmtClusterLabel = (key) => {
        const cluster = MMT_CLUSTERS.find((c) => c.key === key);
        return cluster ? t(cluster.i18nKey, cluster.fallback) : key.toUpperCase();
    };

    if (showResults && results) {
        const topCluster = results.topCluster;
        // Ихтисосҳое, ки аз рӯи ҷавобҳои қадами 2 интихоб шудаанд (на рӯйхати умумии кластер).
        const matched = (topCluster?.specializations || []).filter(
            (spec, index, list) => list.findIndex((other) => other.name === spec.name) === index,
        );
        const visibleMatched = showAllMatched ? matched : matched.slice(0, 6);
        const aiAdvice = results.aiAdvice || "";
        // Холҳо дар миқёси 0–40 (сервер ба ин миқёс мувофиқ мекунад).
        const rankedClusters = Object.entries(results.scores?.mmtClusters || {})
            .map(([key, score]) => ({
                key,
                number: Number(key.replace(/\D/g, "")),
                label: mmtClusterLabel(key),
                raw: Number(score) || 0,
                percent: Math.max(0, Math.min(100, Math.round(((Number(score) || 0) / 40) * 100))),
            }))
            .sort((a, b) => b.raw - a.raw);
        const [first, second] = rankedClusters;
        const isClose = first && second && first.raw - second.raw < 0.15 * Math.max(first.raw, 1);

        return (
            <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[2rem] border border-border bg-card p-6 sm:p-8 text-center"
                >
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                        <Trophy className="w-4 h-4" aria-hidden="true" />
                        {t('quiz.analysis_success')}
                    </div>
                    <p className="mt-5 text-sm font-semibold text-muted-foreground">{t('quiz.your_direction', 'Самти ба шумо мувофиқ')}</p>
                    <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                        {topCluster ? clusterLabel(t, topCluster) : t('quiz.cluster_not_defined')}
                    </h1>
                    {topCluster && (
                        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                            {clusterDescription(t, topCluster, "")}
                        </p>
                    )}
                    {isClose && second && (
                        <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
                            {t('quiz.close_second', { defaultValue: 'Самти «{{name}}» низ ба шумо хеле наздик аст — бо ихтисосҳои он ҳам шинос шавед.', name: second.label })}
                        </p>
                    )}
                </motion.section>

                <section className="rounded-[2rem] border border-border bg-card p-6 sm:p-8">
                    <h2 className="text-lg font-black text-foreground">{t('quiz.all_directions', 'Ҳамаи панҷ самт')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t('quiz.all_directions_hint', 'Чӣ қадар ҷавобҳои шумо ба ҳар самт мувофиқ омаданд.')}</p>
                    <ul className="mt-5 space-y-3.5">
                        {rankedClusters.map((cluster, index) => (
                            <li key={cluster.key}>
                                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                                    <span className={`font-bold ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                                        {cluster.number}. {cluster.label}
                                    </span>
                                    <span className="font-black tabular-nums text-foreground">{cluster.percent}%</span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted" role="presentation">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cluster.percent}%` }}
                                        transition={{ duration: 0.6, delay: index * 0.06 }}
                                        className={`h-full rounded-full ${index === 0 ? "bg-primary" : "bg-primary/35"}`}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {aiAdvice && (
                    <section className="rounded-[2rem] border border-primary/25 bg-primary/5 p-6 sm:p-8">
                        <div className="flex items-center gap-2 text-sm font-black text-primary">
                            <Sparkles className="w-4 h-4" aria-hidden="true" />
                            {t('quiz.ai_advice_title')}
                        </div>
                        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{aiAdvice}</p>
                    </section>
                )}

                {matched.length > 0 && (
                    <section className="rounded-[2rem] border border-border bg-card p-6 sm:p-8">
                        <h2 className="text-lg font-black text-foreground">{t('quiz.matched_careers', 'Ихтисосҳое, ки ба ҷавобҳои шумо мувофиқанд')}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t('quiz.matched_hint', 'Аз рӯи ҷавобҳои қисми дуюм интихоб шуданд — аввал мувофиқтаринҳо.')}</p>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {visibleMatched.map((career, index) => {
                                const isSaved = savedIds.has(career.id);
                                return (
                                    <article key={career.id || career.name} className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                                                <h3 className="text-[15px] font-bold leading-snug text-foreground">
                                                    <Link to={`/info/${career.id}`} className="hover:text-primary hover:underline">{displayName(career.name)}</Link>
                                                </h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleSaveCareer(career)}
                                                disabled={savingId === career.id}
                                                aria-pressed={isSaved}
                                                aria-label={t('career_page.save')}
                                                title={t('career_page.save')}
                                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors cursor-pointer ${isSaved ? "border-secondary/40 bg-secondary/15 text-secondary" : "border-border text-muted-foreground hover:text-secondary"}`}
                                            >
                                                <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                                            </button>
                                        </div>
                                        {(career.description || career.purpose) && (
                                            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{displayName(career.description || career.purpose)}</p>
                                        )}
                                        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                                            <span className="text-xs font-bold text-muted-foreground">
                                                {career.tuitionFee
                                                    ? t('misc2.per_year_long', { price: career.tuitionFee.toLocaleString('ru-RU') })
                                                    : ""}
                                            </span>
                                            <Link to={`/info/${career.id}`} className="inline-flex items-center gap-1 text-xs font-black text-primary-strong hover:underline">
                                                {t('common.read_more')}
                                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        {matched.length > 6 && (
                            <button
                                type="button"
                                onClick={() => setShowAllMatched((v) => !v)}
                                className="mt-4 w-full rounded-xl border border-border py-3 text-sm font-bold text-foreground hover:bg-muted cursor-pointer"
                            >
                                {showAllMatched ? t('quiz.show_less', 'Камтар нишон диҳед') : t('quiz.show_more', { defaultValue: 'Боз {{count}} ихтисос', count: matched.length - 6 })}
                            </button>
                        )}
                    </section>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                    {topCluster?.id && (
                        <Link to={`/careers?clusterId=${topCluster.id}`} className="btn-primary flex-1 justify-center !py-4 text-sm">
                            {t('quiz.more_in_cluster', 'Ҳамаи ихтисосҳои ин самт')}
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    )}
                    <Link to="/dashboard" className="flex-1 rounded-xl border border-border bg-card py-4 text-center text-sm font-bold text-foreground hover:bg-muted">
                        {t('quiz.dashboard_btn')}
                    </Link>
                    <button
                        type="button"
                        onClick={handleRetake}
                        className="flex-1 rounded-xl border border-border bg-card py-4 text-sm font-bold text-foreground hover:bg-muted cursor-pointer"
                    >
                        {t('quiz.retake')}
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentStep];
    if (!currentQuestion || !Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="p-8 glass-card text-center max-w-md">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-4">{t('quiz.load_error_title', "Хатогӣ дар боргузорӣ")}</h2>
                    <p className="text-muted-foreground text-sm mb-6">{t('quiz.load_error_desc', "Саволҳо ёфт нашуданд. Лутфан дертар кӯшиш кунед ё ба маъмурият хабар диҳед.")}</p>
                    <button onClick={handleRetake} className="btn-primary px-8 py-3 text-xs w-full cursor-pointer">
                        {t('quiz.retake', "Аз нав санҷиш гузаред")}
                    </button>
                </div>
            </div>
        );
    }

    const CurrentIcon = getIcon(currentQuestion.type);
    const currentAnswer = answers.find((answer) => answer.questionId === currentQuestion.id)?.selectedValue;
    const canGoNext = currentAnswer !== undefined && currentAnswer !== null;
    const activeLang = i18n.language || "tj";
    const questionText = typeof currentQuestion.question === "string"
        ? currentQuestion.question
        : currentQuestion.question?.[activeLang] || currentQuestion.question?.tj || "";
    const typeKey = String(currentQuestion.type || "").toLowerCase();
    const typeLabel = !typeKey ? ""
        : i18n.exists(`quiz.type_${typeKey}`) ? t(`quiz.type_${typeKey}`)
        : i18n.exists(`quiz.category.${typeKey}`) ? t(`quiz.category.${typeKey}`)
        : "";

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 relative">
            <div className="space-y-4 relative">
                <div className="flex items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                            <LogoMark className="w-4 h-4" />
                            {stageLabel}
                        </div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
                            {t('quiz.title')}
                        </h1>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-border bg-card px-4 py-2.5 flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-lg font-black text-primary leading-none">{Math.round(progress)}%</div>
                            <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{t('quiz.progress')}</div>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="text-center">
                            <div className="text-lg font-black text-foreground leading-none">
                                {currentStep + 1}<span className="text-sm font-bold text-muted-foreground">/{totalExpected}</span>
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{t('quiz.question')}</div>
                        </div>
                    </div>
                </div>

                {typeLabel && (
                    <div className="text-sm font-semibold text-muted-foreground">{typeLabel}</div>
                )}

                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-primary to-accent-blue"
                    />
                </div>

                <AnimatePresence mode="wait">
                            {stageLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-[2rem]"
                                >
                                    <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
                                    <h3 className="text-xl font-black uppercase tracking-widest text-primary">{t("misc2.cluster_analysis")}</h3>
                                    <p className="text-sm text-muted-foreground mt-2">{t("quiz.preparing")}</p>
                                </motion.div>
                            )}
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-[1.75rem] border border-border bg-card shadow-sm p-5 sm:p-8"
                    >
                        <div className="space-y-5 w-full max-w-lg mx-auto">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <CurrentIcon className="w-7 h-7 text-primary" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-snug">
                                    {questionText}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5">
                                {shuffledOrder(currentQuestion.id, currentQuestion.options.length).map((idx, position) => {
                                    const option = currentQuestion.options[idx];
                                    const selected = currentAnswer === (option.value ?? idx);
                                    const optionText = option.cluster
                                        ? clusterLabel(t, { clusterId: Number(String(option.cluster).replace(/\D/g, "")) })
                                        : typeof option.text === "string"
                                            ? option.text
                                            : option.text?.[activeLang] || option.text?.tj || "";
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAnswer(idx, currentQuestion?.id)}
                                            aria-pressed={selected}
                                            className={`w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border text-left text-[15px] sm:text-base font-semibold leading-snug text-foreground cursor-pointer ${
                                                selected
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border bg-muted/40 hover:border-primary/50"
                                            }`}
                                        >
                                            <span
                                                className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-black ${
                                                    selected
                                                        ? "bg-primary text-white"
                                                        : "bg-background border border-border text-muted-foreground"
                                                }`}
                                            >
                                                {selected ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + position)}
                                            </span>
                                            <span className="flex-1">{optionText}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center gap-3 pt-1">
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-bold text-foreground cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            {t('quiz.back')}
                        </button>
                    )}
                    {currentStep < questions.length - 1 && (
                        <button
                            type="button"
                            onClick={() => canGoNext && setCurrentStep(currentStep + 1)}
                            disabled={!canGoNext}
                            className={`ml-auto inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold ${
                                canGoNext
                                    ? "bg-primary text-white cursor-pointer"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            }`}
                        >
                            {t('common.next', "Next")}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Quiz;
