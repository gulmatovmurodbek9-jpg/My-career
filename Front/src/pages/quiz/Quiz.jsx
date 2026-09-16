import React, { useEffect, useMemo, useState } from "react";
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

const QUIZ_STORAGE_KEY = "quiz_results_v1";

const SPEC_WINDOW = 8;
const CLUSTER_PAGE_SIZE = 12;

const LogoMark = ({ className = "" }) => (
    <img src="/logo.png" alt="" aria-hidden="true" className={`object-contain ${className}`} />
);

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

    useEffect(() => {
        if (showResults && results?.topCluster?.id && clusterCareers.length === 0) {
            fetchClusterCareers();
        }
    }, [showResults, results]);

    const handleSaveCareer = async (career) => {
        if (!token) { navigate("/login"); return; }
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
            alert("Error saving career: " + (err.response?.data?.message || err.message));
        } finally {
            setSavingId(null);
        }
    };

    const handleAnswer = async (selectedValue) => {
        const questionId = questions[currentStep].id;
        const newAnswers = [
            ...answers.filter((answer) => answer.questionId !== questionId),
            { questionId, selectedValue },
        ];
        setAnswers(newAnswers);

        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else if (quizStage === 1) {
            setStageLoading(true);
            try {
                const url = token ? `${API}/quiz/submit-authenticated` : `${API}/quiz/submit`;
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const { data: stage1Result } = await axios.post(
                    url,
                    { answers: newAnswers, lang: i18n.language },
                    { headers }
                );
                const clusterNumber =
                    stage1Result.topCluster?.clusterNumber ||
                    stage1Result.topType?.replace(/[^0-9]/g, '') ||
                    '1';
                const { data: stage2Qs } = await axios.get(
                    `${API}/quiz/specialty-questions`,
                    { params: { clusterNumber } }
                );
                if (stage2Qs?.length > 0) {
                    setQuestions(prev => [...prev, ...stage2Qs]);
                    setQuizStage(2);
                    setCurrentStep(prev => prev + 1);
                } else {
                    submitQuiz(newAnswers);
                }
            } catch (err) {
                console.error('Stage 1 error:', err);
                submitQuiz(newAnswers);
            } finally {
                setStageLoading(false);
            }
        } else {
            submitQuiz(newAnswers);
        }
    };

    const submitQuiz = async (finalAnswers) => {
        setIsAnalyzing(true);
        try {
            const url = token ? `${API}/quiz/submit-authenticated` : `${API}/quiz/submit`;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await axios.post(url, { answers: finalAnswers, lang: i18n.language }, { headers });
            const answeredQuestions = finalAnswers.map((answer) => {
                const question = questions.find((q) => q.id === answer.questionId);
                const selectedOption = question?.options?.[Number(answer.selectedValue)];
                const activeLang = i18n.language || "tj";
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
            const enrichedData = {
                ...data,
                answers: answeredQuestions,
                rawAnswers: finalAnswers,
                answeredAt: new Date().toISOString(),
                quizLang: i18n.language || "tj",
            };

            setResults(enrichedData);
            localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(enrichedData));
            
            if (token) {
                updateUser({ quizResults: data.scores });
            }
            
            setIsAnalyzing(false);
            setShowResults(true);
        } catch (err) {
            console.error("Submit quiz error:", err);

            if (err.response?.status === 401 && token) {
                console.warn("Token expired, retrying as guest...");
                logout();
                try {
                    const { data } = await axios.post(`${API}/quiz/submit`, { answers: finalAnswers, lang: i18n.language });
                    const answeredQuestions = finalAnswers.map((answer) => {
                        const question = questions.find((q) => q.id === answer.questionId);
                        const selectedOption = question?.options?.[Number(answer.selectedValue)];
                        const activeLang = i18n.language || "tj";
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
                    const enrichedData = {
                        ...data,
                        answers: answeredQuestions,
                        rawAnswers: finalAnswers,
                        answeredAt: new Date().toISOString(),
                        quizLang: i18n.language || "tj",
                    };
                    setResults(enrichedData);
                    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(enrichedData));
                    setIsAnalyzing(false);
                    setShowResults(true);
                    return;
                } catch (retryErr) {
                    console.error("Retry submission failed:", retryErr);
                }
            }

            setIsAnalyzing(false);
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

    const progress = questions.length > 0 ? ((currentStep + 1) / questions.length) * 100 : 0;
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
        const uniqueSpecs = (topCluster?.specializations || []).filter(
            (spec, index, list) => list.findIndex((other) => other.name === spec.name) === index,
        );
        const visibleSpecs = uniqueSpecs.length > SPEC_WINDOW
            ? Array.from({ length: SPEC_WINDOW }, (_, k) => uniqueSpecs[(specOffset + k) % uniqueSpecs.length])
            : uniqueSpecs;
        const personalityDesc = results.personality || "";
        const aiAdvice = results.aiAdvice || "";
        const rankedClusters = Object.entries(results.scores?.mmtClusters || {})
            .map(([key, score]) => ({
                key,
                label: mmtClusterLabel(key),
                raw: Number(score) || 0,
                percent: Math.min(100, Math.round(((Number(score) || 0) / 40) * 100)),
            }))
            .sort((a, b) => b.raw - a.raw);
        const confidence = rankedClusters.length > 1
            ? Math.max(5, Math.min(95, 50 + (rankedClusters[0].percent - rankedClusters[1].percent)))
            : rankedClusters[0]?.percent || 0;
        const strongestTraits = rankedClusters.slice(0, 3);

        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card glass-card-glow p-8 text-center space-y-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                        <Trophy className="w-4 h-4" />
                        {t('quiz.analysis_success', "ТАҲЛИЛИ ПСИХОЛОГӢ БО МУВАФФАҚИЯТ АНҶОМ ЁФТ")}
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">
                            {t('quiz.your_results_title', "Натиҷаҳои Шумо")}
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto text-sm font-medium">
                            {t('quiz.your_results_desc', "Профили шумо муайян карда шуд. Дар асоси хоҳишҳо ва қобилиятҳои шумо, касби идеалии шумо дар соҳаи зерин аст:")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-2">
                            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
                                <Shield className="w-4 h-4" />
                                {t('quiz.confidence_label', 'Эътимоднокӣ')}
                            </div>
                            <div className="text-3xl font-black text-foreground">{confidence}%</div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {t('quiz.confidence_desc', 'Ин нишон медиҳад, ки натиҷаи аввалини шумо аз дуюм чанд қадар пеш аст.')}
                            </p>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-2 md:col-span-2">
                            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary">
                                <TrendingUp className="w-4 h-4" />
                                {t('quiz.top_matches_label', 'Беҳтарин мувофиқат')}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {strongestTraits.map((cluster) => (
                                    <span
                                        key={cluster.key}
                                        className="px-3 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-black uppercase tracking-wider text-primary"
                                    >
                                        {cluster.label} · {cluster.percent}%
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {t('quiz.top_matches_desc', 'Инҳо самтҳоеанд, ки аз рӯи ҷавобҳои шумо бештар қавӣ баромаданд.')}
                            </p>
                        </div>
                    </div>

                    {/* AI Advice Section (New) */}
                    {aiAdvice && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-8 rounded-3xl bg-primary/10 border border-primary/20 text-left space-y-4 relative overflow-hidden"
                        >
                            <div className="absolute -right-10 -top-10 opacity-10">
                                <Sparkles size={160} className="text-primary" />
                            </div>
                            <div className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest relative z-10">
                                <Sparkles className="w-4 h-4" />
                                {t('quiz.ai_advice_title', "Маслиҳати AI (MyCareer AI)")}
                            </div>
                            <p className="text-sm leading-relaxed font-medium text-foreground/90 relative z-10 whitespace-pre-line">
                                {aiAdvice}
                            </p>
                        </motion.div>
                    )}

                    {/* Top Cluster & Personality Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                <Award size={80} className="text-primary" />
                            </div>
                            <div className="inline-flex items-center gap-2 text-primary text-[9px] font-black uppercase tracking-widest">
                                <Target className="w-4 h-4" />
                                {t('quiz.suggested_cluster', "Кластери Тавсияшуда")}
                            </div>
                            {topCluster ? (
                                <>
                                    <h3 className="text-2xl font-black uppercase leading-tight">{clusterLabel(t, topCluster)}</h3>
                                    <p className="text-sm opacity-70 leading-relaxed italic">
                                        "{clusterDescription(t, topCluster, t('quiz.cluster_reason', "Ин кластер дар асоси профили RIASEC-и шумо интихоб шудааст."))}"
                                    </p>
                                    <div className="pt-4 space-y-2">
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40">
                                            {t('quiz.suggested_specializations', "Ихтисосҳои Пешниҳодшуда:")}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {visibleSpecs.map((spec) => (
                                                <Link key={spec.id || spec.name} to={spec.id ? `/info/${spec.id}` : '#'}>
                                                    <span className="block cursor-pointer rounded-full bg-primary px-3 py-1.5 text-[13px] font-semibold leading-snug text-white">
                                                        {spec.name}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm opacity-50 italic">{t('quiz.cluster_not_defined', "Кластер ҳанӯз муайян нашудааст.")}</div>
                            )}
                        </div>

                        <div className="p-8 rounded-3xl bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                <Users size={80} className="text-secondary" />
                            </div>
                            <div className="inline-flex items-center gap-2 text-secondary text-[9px] font-black uppercase tracking-widest">
                                <LogoMark className="w-4 h-4" />
                                {t('quiz.personality_type', "Навъи Шаксият")}: {results.topType}
                            </div>
                            <p className="text-sm leading-relaxed font-medium">
                                {personalityDesc}
                            </p>
                            <div className="pt-4 p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                <div className="text-[8px] font-black uppercase tracking-widest opacity-40">
                                    {t('quiz.reasoning_title', "Чаро ин касб? (Reasoning)")}
                                </div>
                                <p className="text-[10px] italic leading-tight opacity-70">
                                    "{t('quiz.analysis_match', { defaultValue: "Интихоби шумо дар асоси мувофиқати {{type}} ва талаботи кластери {{cluster}} анҷом дода шудааст.", type: results.topType, cluster: clusterLabel(t, topCluster) })}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MMT Clusters Chart Preview */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 py-4">
                        {results.scores?.mmtClusters && Object.entries(results.scores.mmtClusters).map(([cat, score], i) => (
                            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center group hover:bg-white/10 transition-colors">
                                <div className="text-[7px] font-black uppercase tracking-widest text-primary mb-1">{t('misc2.cluster_num', { number: cat.replace('c', '') })}</div>
                                <div className="text-xl font-black">{Math.round((score / 12) * 100)}%</div>
                                <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (score / 12) * 100)}%` }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ═══ Cluster Careers Section ═══ */}
                    {clusterCareers.length > 0 && (
                        <div className="pt-4 space-y-6 text-left">
                            <div className="rounded-[2rem] border border-primary/15 bg-primary/5 p-6 space-y-5">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-[0.25em] text-primary mb-1">
                                            {t('quiz.your_cluster_careers', "Ихтисосҳои тавсияшуда")}
                                        </div>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">
                                            {clusterLabel(t, topCluster)}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t('quiz.results_based', "Натиҷаҳо дар асоси 15 савол (Кластер + Ихтисос) муайян шудаанд.")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => fetchClusterCareers(true)}
                                            disabled={refreshingCareers}
                                            aria-busy={refreshingCareers}
                                            className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted disabled:cursor-wait cursor-pointer"
                                            title={t("misc.quiz_refresh")}
                                            aria-label={t("misc.quiz_refresh")}
                                        >
                                            {refreshingCareers
                                                ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                                : <Zap className="w-5 h-5 text-primary" />}
                                        </button>
                                        {savedIds.size > 0 && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                onClick={() => navigate("/favorites")}
                                                className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-secondary/20 cursor-pointer"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                {t('quiz.my_saves', "Захираҳои ман")} ({savedIds.size})
                                            </motion.button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {clusterCareers.slice(0, 12).map((career, idx) => {
                                        const isSaved = savedIds.has(career.id);
                                        return (
                                            <motion.div
                                                key={career.id}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                                className="p-5 flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-white/6 shadow-xl relative overflow-hidden group/card hover:bg-white/10 transition-colors"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none opacity-50 group-hover/card:opacity-100 transition-opacity" />

                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover/card:scale-110 transition-transform">
                                                        <Briefcase className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <button
                                                        onClick={() => handleSaveCareer(career)}
                                                        disabled={savingId === career.id}
                                                        className={"w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 " + (isSaved ? "bg-secondary/20 text-secondary border border-secondary/30" : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30")}
                                                    >
                                                        <Bookmark className={"w-4 h-4 " + (isSaved ? "fill-current" : "")} />
                                                    </button>
                                                </div>

                                                <div>
                                                    <h4 className="font-extrabold text-sm text-foreground leading-tight line-clamp-2">
                                                        {career.name}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed opacity-70">
                                                        {career.description || career.purpose || ""}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                                                        {career.tuitionFee ? (
                                                            <span className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-wider">
                                                                {t('misc2.per_year_long', { price: career.tuitionFee.toLocaleString('ru-RU') })}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-wider">
                                                                {t('quiz.no_price', 'Нархнома: Муайян нест')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <Link
                                                    to={"/info/" + career.id}
                                                    className="mt-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/80 hover:text-primary transition-colors group/link pt-2"
                                                >
                                                    {t('common.read_more', "Маълумоти бештар")}
                                                    <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-4 flex flex-col md:flex-row gap-4 justify-center">
                        <Link to="/careers" className="w-full md:w-auto">
                            <button className="btn-primary w-full !px-10 !py-4 font-jakarta text-sm cursor-pointer shadow-[0_20px_40px_rgba(99,102,241,0.2)]">
                                {t('quiz.view_careers', "ДИДАНИ ИХТИСОСҲО")}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                        <Link to="/dashboard" className="w-full md:w-auto">
                            <button className="glass-card !p-4 !px-10 w-full hover:bg-white/5 transition-colors text-sm font-black uppercase tracking-widest cursor-pointer">
                                {t('quiz.dashboard_btn', "ПАНЕЛИ ШАХСӢ")}
                            </button>
                        </Link>
                    </div>
                </motion.div>
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
                {/* Сарлавҳа. Навиштаҳои 6–7px дар телефон хонда намешуданд,
                    ва "Progress" / "answered" бо англисӣ сахт навишта шуда буданд. */}
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
                                {currentStep + 1}<span className="text-sm font-bold text-muted-foreground">/{questions.length}</span>
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{t('quiz.question')}</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-muted-foreground">
                    <span>{t('quiz.answered_of', { done: answeredCount, total: questions.length })}</span>
                    {typeLabel && <span>{typeLabel}</span>}
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-primary to-accent-blue"
                    />
                </div>

                {/* Question Card */}
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
                    {/* На glass-card: он ҳангоми hover тамоми кортро боло мебардошт ва
                        ҳошияашро медурахшонд. Саволи тест бояд ором истад. */}
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

                            {/* Ҷавобҳо бо ҳарфи хурди муқаррарӣ ва бе фосилаи калони ҳарфҳо —
                                UPPERCASE + tracking-[0.2em] матни дароз дар 10px хонда намешуд.
                                Ба ҷои тирча ҳарфи A/B/C; ҷавоби интихобшуда аломати ✓ мегирад. */}
                            <div className="grid grid-cols-1 gap-2.5">
                                {currentQuestion.options.map((option, idx) => {
                                    const selected = currentAnswer === idx;
                                    const optionText = typeof option.text === "string"
                                        ? option.text
                                        : option.text?.[activeLang] || option.text?.tj || "";
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleAnswer(idx)}
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
                                                {selected ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className="flex-1">{optionText}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Тугмаҳои поён дар як сатр. Пештар 8px буданд ва "Оянда" базӯр намоён буд. */}
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
