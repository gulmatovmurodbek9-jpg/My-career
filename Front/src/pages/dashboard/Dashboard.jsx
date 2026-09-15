import React, { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import {
    ClipboardCheck,
    Heart,
    Bookmark,
    Award,
    ArrowRight,
    Loader2,
    LayoutDashboard,
    Scale,
    MessageSquare,
    FileText,
    ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LazyPsychologicalProfile } from "../../components/PsychologicalProfile";
import { MMT_MAX, topCluster } from "../../lib/mmtClusters";
import MatchCard from "../../components/MatchCard";
import SpecialtyCard from "../../components/jobCard";
import MatchExplainModal from "../../components/MatchExplainModal";
import { currentApiLang } from "../../lib/apiLang";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";
import axios from "axios";
import { API } from "../../lib/config";
import { Link } from "react-router";
import AiBotIcon from "../../components/AiBotIcon";

const Dashboard = () => {
    const { t } = useTranslation();
    const { error: showError } = useToast();
    const { user, token, refreshProfile } = useAuthStore();

    // Refresh profile on mount to ensure we have the latest data (e.g. quizResults)
    useEffect(() => {
        if (token) {
            refreshProfile();
        }
    }, [token, refreshProfile]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likedIds, setLikedIds] = useState(new Set());
    const [savedIds, setSavedIds] = useState(new Set());
    /* Худи сабтҳо, на танҳо шиносаҳо: рӯйхат дар поёни саҳифа нишон
       дода мешавад. */
    const [savedCareers, setSavedCareers] = useState([]);

    /*
     * Ҳисоби бо қайд сабтшуда `name` надорад, ва корт `user.name` -ро рост
     * нишон медод: аватар холӣ мемонд ва сарлавҳа тамоман намебаромад, аз ин
     * рӯ дар байни корт ҷои холии калон пайдо мешуд. Ном аз почта гирифта
     * мешавад, вақте ки худи ном нест.
     */
    const displayName = user?.name?.trim() || user?.email?.split("@")[0] || t('dashboard.guest', 'Меҳмон');
    const leadingCluster = topCluster(user?.quizResults?.mmtClusters, t);
    const [explainData, setExplainData] = useState(null);
    const [explainOpen, setExplainOpen] = useState(false);

    useEffect(() => {
        const fetchMatches = async () => {
            if (!user?.quizResults) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await axios.post(`${API}/careers/match`, {
                    scores: user.quizResults,
                    /* Тавсияҳо бо забони интерфейс меоянд — вагарна
                       дар дошборди русӣ кортҳо тоҷикӣ мемонанд. */
                    lang: currentApiLang() ?? undefined,
                });
                setMatches(data);
            } catch (err) {
                console.error("Error fetching matches", err);
                const errorMessage = err.response?.data?.message || t('common.error_loading', 'Хатогӣ рух дод');
                showError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [user?.id, user?.quizResults]);

    // Sync with global authStore user data
    useEffect(() => {
        if (user) {
            setLikedIds(new Set((user.likedCareers || []).map(c => c.id)));
            setSavedIds(new Set((user.savedCareers || []).map(c => c.id)));
            if (Array.isArray(user.savedCareers)) setSavedCareers(user.savedCareers);
        }
    }, [user?.likedCareers, user?.savedCareers]);

    // Fetch initial liked/saved IDs if they are missing in store or on mount
    useEffect(() => {
        if (!token) return;
        Promise.all([
            axios.get(`${API}/users/liked-careers`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API}/users/saved-careers`, { headers: { Authorization: `Bearer ${token}` } }),
        ]).then(([likedRes, savedRes]) => {
            setLikedIds(new Set((likedRes.data || []).map(c => c.id)));
            setSavedIds(new Set((savedRes.data || []).map(c => c.id)));
            if (Array.isArray(savedRes.data)) setSavedCareers(savedRes.data);
        }).catch(() => { });
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">{t("common.loading")}</p>
                </div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <div className="pb-20">
            <div className="space-y-12">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
                    <div className="space-y-2">
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-[0.2em] text-primary"
                        >
                            <LayoutDashboard className="w-3 h-3" />
                            {t('dashboard.profile')}
                        </motion.div>
                        <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase">
                            {t('dashboard.welcome')}, <span className="text-gradient-primary">{user?.name}</span>
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Админ ба ҳамин саҳифа меафтад ва паёми «тестро
                            супоред»-ро мебинад, ки ба ӯ дахл надорад. Роҳ ба
                            панели идора бояд ҳамин ҷо намоён бошад. */}
                        {user?.role === 'admin' && (
                            <Link to="/admin">
                                <button className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-6 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/20">
                                    <ShieldCheck className="h-4 w-4" />
                                    {t('nav.admin', 'Панели админ')}
                                </button>
                            </Link>
                        )}

                        {!matches.length && (
                            <Link to="/quiz">
                                <button className="btn-primary !px-6 !py-3 !text-xs !rounded-xl group cursor-pointer">
                                    <ClipboardCheck className="w-4 h-4" />
                                    {t('dashboard.start_quiz_btn')}
                                </button>
                            </Link>
                        )}
                    </div>
                </header>

                {matches.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="bento-grid"
                    >
                        {/* 1. Profile card */}
                        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 glass-card flex flex-col p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate text-xl font-semibold text-foreground">{displayName}</h3>
                                    <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>

                            {leadingCluster && (
                                <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
                                    <p className="text-sm text-muted-foreground">{t('dashboard.top_cluster', 'Самти пешбари шумо')}</p>
                                    <p className="mt-1 text-lg font-semibold text-foreground">{leadingCluster.label}</p>
                                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${Math.round((leadingCluster.score / MMT_MAX) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                                        {leadingCluster.score} / {MMT_MAX}
                                    </p>
                                </div>
                            )}

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-border p-4">
                                    <Heart className="mb-2 h-4 w-4 text-primary" />
                                    <div className="text-2xl font-semibold text-foreground">{likedIds.size}</div>
                                    <div className="mt-0.5 text-sm text-muted-foreground">{t('dashboard.likes')}</div>
                                </div>
                                <div className="rounded-2xl border border-border p-4">
                                    <Bookmark className="mb-2 h-4 w-4 text-primary" />
                                    <div className="text-2xl font-semibold text-foreground">{savedIds.size}</div>
                                    <div className="mt-0.5 text-sm text-muted-foreground">{t('dashboard.saves')}</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 2. Radar Chart */}
                        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-8">
                            <Suspense fallback={
                                <div className="glass-card p-6 flex items-center justify-center min-h-[300px]">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">{t("common.loading")}</p>
                                    </div>
                                </div>
                            }>
                                <LazyPsychologicalProfile results={user?.quizResults} className="h-full" />
                            </Suspense>
                        </motion.div>

                        {/* Кортҳои CTA бе hover: на заминаи дурахшон, на тирчаи ҳаракаткунанда. */}
                        {/* 2.5 AI Career Advisor CTA */}
                        <motion.div variants={itemVariants} className="col-span-12">
                            <Link to="/dashboard/ai-advisor">
                                <div className="glass-card p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden">
                                    <div className="flex items-center gap-4 relative">
                                        <AiBotIcon size="md" online />
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                                                {t('dashboard.ai_advisor_title')}
                                            </h3>
                                            <p className="text-muted-foreground text-xs font-medium">
                                                {t('dashboard.ai_advisor_desc')}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground relative" />
                                </div>
                            </Link>
                        </motion.div>

                        {/* 2.55 AI Chat CTA */}
                        <motion.div variants={itemVariants} className="col-span-12">
                            <Link to="/dashboard/ai-chat">
                                <div className="glass-card p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden">
                                    <div className="flex items-center gap-4 relative">
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                                            <MessageSquare className="h-6 w-6" />
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                                                {t("misc.ai_chat_title")}
                                            </h3>
                                            <p className="text-muted-foreground text-xs font-medium">
                                                {t("misc.ai_chat_sub")}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground relative" />
                                </div>
                            </Link>
                        </motion.div>

                        {/* 2.6 Career Compare CTA */}
                        <motion.div variants={itemVariants} className="col-span-12">
                            <Link to="/dashboard/compare">
                                <div className="glass-card p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden">
                                    <div className="flex items-center gap-4 relative">
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                                            <Scale className="h-6 w-6" />
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                                                {t('dashboard.compare_title')}
                                            </h3>
                                            <p className="text-muted-foreground text-xs font-medium">
                                                {t('dashboard.compare_desc')}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground relative" />
                                </div>
                            </Link>
                        </motion.div>

                        {/* 2.65 Рӯйхати ҳуҷҷатсупорӣ */}
                        <motion.div variants={itemVariants} className="col-span-12">
                            <Link to="/dashboard/plan">
                                <div className="glass-card p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer relative overflow-hidden">
                                    <div className="flex items-center gap-4 relative">
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                                            <FileText className="h-6 w-6" />
                                        </span>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                                                {t('dashboard.plan_title', 'Рӯйхати ҳуҷҷатсупорӣ')}
                                            </h3>
                                            <p className="text-muted-foreground text-xs font-medium">
                                                {t('dashboard.plan_desc', 'Ихтисос ва донишгоҳро интихоб кунед ва рӯйхатро чоп намоед')}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground relative" />
                                </div>
                            </Link>
                        </motion.div>

                        {/* 2.7 Appointment CTA */}
                        {/* Removed - using AppointmentCard component instead */}

                        {/* 3. Match Grid Header */}
                        <motion.div id="recommendations" variants={itemVariants} className="col-span-12 pt-8">
                            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                                        <Award className="h-5 w-5 text-secondary" />
                                    </span>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
                                            {t('dashboard.recommendations')}
                                        </h3>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {matches.length} {t('common.specialty', 'Ихтисос').toLowerCase()}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-full bg-muted px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    AI Powered
                                </div>
                            </div>
                        </motion.div>

                        {/* 4. Individual Matches — ҳама кортҳо як андоза: сатрҳои
                            ноҳамвор аз андозаҳои гуногун пайдо мешуданд. */}
                        {matches.map((career, idx) => (
                            <motion.div
                                key={career.id}
                                variants={itemVariants}
                                className="col-span-12 md:col-span-6 lg:col-span-4"
                            >
                                <MatchCard
                                    career={career}
                                    matchPercentage={career.matchPercentage}
                                    isLiked={likedIds.has(career.id)}
                                    isSaved={savedIds.has(career.id)}
                                    rank={idx + 1}
                                    onExplain={() => { setExplainData(career); setExplainOpen(true); }}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-16 text-center flex flex-col items-center gap-6 relative overflow-hidden"
                    >
                        {/* pointer-events-none ҳатмист: ин қабати ороишӣ absolute
                            аст ва болои тугмаи «Гузаштани санҷиш» меистод —
                            клик ба он мерасид, на ба тугма. */}
                        <div className="absolute inset-0 tajik-pattern opacity-10 pointer-events-none" />
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                            <ClipboardCheck className="w-8 h-8 text-primary" />
                        </div>
                        <div className="max-w-md space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">{t('dashboard.empty_title')}</h2>
                            <p className="text-muted-foreground font-bold text-sm leading-relaxed opacity-60">
                                {t('dashboard.empty_desc')}
                            </p>
                        </div>
                        <Link to="/quiz">
                            <button className="btn-primary px-8 py-4 text-sm group cursor-pointer">
                                {t('dashboard.start_quiz_btn')}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </motion.div>
                )}
                {/* Ихтисосҳои захирашуда.
                    Берун аз шарти тавсияҳост: корбаре, ки ҳанӯз санҷиш
                    насупоридааст, метавонад аллакай чанд ихтисосро захира
                    карда бошад. */}
                {savedCareers.length > 0 && (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="col-span-12 grid grid-cols-12 gap-5">
                        <motion.div variants={itemVariants} className="col-span-12 pt-8">
                            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                        <Bookmark className="h-5 w-5 text-primary" />
                                    </span>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
                                            {t('common.saved', 'Захираҳо')}
                                        </h3>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {savedCareers.length} {t('common.specialty', 'Ихтисос').toLowerCase()}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/favorites"
                                    className="rounded-full border border-border px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                                >
                                    {t('common.details', 'Маълумот')}
                                </Link>
                            </div>
                        </motion.div>

                        {savedCareers.map((career) => (
                            <motion.div
                                key={career.id}
                                variants={itemVariants}
                                className="col-span-12 md:col-span-6 lg:col-span-4"
                            >
                                <SpecialtyCard specialty={career} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Explainability Modal */}
            <MatchExplainModal
                isOpen={explainOpen}
                onClose={() => setExplainOpen(false)}
                matchData={explainData}
            />
        </div>
    );
};

export default Dashboard;
