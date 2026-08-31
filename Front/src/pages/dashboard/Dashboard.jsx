import React, { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import {
    BrainCircuit,
    Heart,
    Bookmark,
    Award,
    ArrowRight,
    Loader2,
    LayoutDashboard,
    Scale,
    MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LazyPsychologicalProfile } from "../../components/PsychologicalProfile";
import { MMT_MAX, topCluster } from "../../lib/mmtClusters";
import MatchCard from "../../components/MatchCard";
import MatchExplainModal from "../../components/MatchExplainModal";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";
import axios from "axios";
import { API } from "../../lib/config";
import { Link } from "react-router";

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
        }).catch(() => { });
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Боргузорӣ...</p>
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
                            {t('dashboard.welcome')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-blue">{user?.name}</span>
                        </h1>
                    </div>

                    {!matches.length && (
                        <Link to="/quiz">
                            <button className="btn-primary !px-6 !py-3 !text-xs !rounded-xl group cursor-pointer">
                                <BrainCircuit className="w-4 h-4" />
                                {t('dashboard.start_quiz_btn')}
                            </button>
                        </Link>
                    )}
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
                                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Боргузорӣ...</p>
                                    </div>
                                </div>
                            }>
                                <LazyPsychologicalProfile results={user?.quizResults} className="h-full" />
                            </Suspense>
                        </motion.div>

                        {/* 2.5 AI Career Advisor CTA */}
                        <motion.div variants={itemVariants} className="col-span-12">
                            <Link to="/dashboard/ai-advisor">
                                <div className="glass-card p-5 md:p-6 flex items-center justify-between gap-4 group cursor-pointer hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="flex items-center gap-4 relative">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-blue p-0.5 group-hover:rotate-6 transition-transform duration-500">
                                            <div className="w-full h-full rounded-[0.6rem] bg-card flex items-center justify-center">
                                                <BrainCircuit className="w-6 h-6 text-primary" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                                                {t('dashboard.ai_advisor_title')}
                                            </h3>
                                            <p className="text-muted-foreground text-xs font-medium opacity-60">
                                                {t('dashboard.ai_advisor_desc')}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all relative" />
                                </div>
                            </Link>
                        </motion.div>

                        {/* 2.55 AI Chat CTA */}
                        <motion.div variants={itemVariants} className="col-span-12">
                            <Link to="/dashboard/ai-chat">
                                <div className="glass-card p-5 md:p-6 flex items-center justify-between gap-4 group cursor-pointer hover:border-secondary/30 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="flex items-center gap-4 relative">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-primary p-0.5 group-hover:rotate-6 transition-transform duration-500">
                                            <div className="w-full h-full rounded-[0.6rem] bg-card flex items-center justify-center">
                                                <MessageSquare className="w-6 h-6 text-emerald-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                                                AI Чат — Мушовири касбӣ
                                            </h3>
                                            <p className="text-muted-foreground text-xs font-medium opacity-60">
                                                Саволҳои худро дар бораи ихтисосҳо, маошҳо ва донишгоҳҳо пурсед
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all relative" />
                                </div>
                            </Link>
                        </motion.div>

                        {/* 2.6 Career Compare CTA */}
                        <motion.div variants={itemVariants} className="col-span-12">
                            <Link to="/dashboard/compare">
                                <div className="glass-card p-5 md:p-6 flex items-center justify-between gap-4 group cursor-pointer hover:border-secondary/30 transition-all duration-300 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="flex items-center gap-4 relative">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-primary p-0.5 group-hover:rotate-6 transition-transform duration-500">
                                            <div className="w-full h-full rounded-[0.6rem] bg-card flex items-center justify-center">
                                                <Scale className="w-6 h-6 text-secondary" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                                                {t('dashboard.compare_title')}
                                            </h3>
                                            <p className="text-muted-foreground text-xs font-medium opacity-60">
                                                {t('dashboard.compare_desc')}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all relative" />
                                </div>
                            </Link>
                        </motion.div>

                        {/* 2.7 Appointment CTA */}
                        {/* Removed - using AppointmentCard component instead */}

                        {/* 3. Match Grid Header */}
                        <motion.div id="recommendations" variants={itemVariants} className="col-span-12 pt-8">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
                                    <Award className="w-8 h-8 text-secondary" />
                                    {t('dashboard.recommendations')}
                                </h3>
                                <div className="text-[8px] font-black uppercase tracking-[0.2em] bg-muted px-4 py-1.5 rounded-full opacity-60">
                                    AI Powered
                                </div>
                            </div>
                        </motion.div>

                        {/* 4. Individual Matches */}
                        {matches.map((career, idx) => (
                            <motion.div
                                key={career.id}
                                variants={itemVariants}
                                className={`col-span-12 ${idx < 2 ? 'md:col-span-6' : 'md:col-span-4'}`}
                            >
                                <MatchCard
                                    career={career}
                                    matchPercentage={career.matchPercentage}
                                    isLiked={likedIds.has(career.id)}
                                    isSaved={savedIds.has(career.id)}
                                    isLarge={idx < 2}
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
                        <div className="absolute inset-0 tajik-pattern opacity-10" />
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                            <BrainCircuit className="w-8 h-8 text-primary animate-pulse" />
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
