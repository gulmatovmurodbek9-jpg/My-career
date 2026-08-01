import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    Bookmark,
    Briefcase,
    ArrowRight,
    Loader2,
    Search,
} from "lucide-react";
import { Link } from "react-router";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { API } from "../../lib/config";
import { useTranslation } from "react-i18next";

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const CareerCard = ({ career, onUnlike, onUnsave, type }) => {
    const { t } = useTranslation();
    return (
        <motion.div
            layout
            variants={itemVariants}
            exit={{ opacity: 0, scale: 0.92 }}
            className="glass-card p-6 flex flex-col gap-4 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
        >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 blur-[60px] group-hover:bg-primary/15 transition-all duration-700" />

            <div className="flex items-start justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] bg-primary/10 text-primary border border-primary/20">
                    {career.cluster?.clusterName || t('common.specialty', "Ихтисос")}
                </span>
                <button
                    onClick={() => type === "liked" ? onUnlike(career.id) : onUnsave(career.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all z-10 ${type === "liked"
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20"
                        : "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20"
                        }`}
                >
                    {type === "liked"
                        ? <Heart className="w-4 h-4 fill-current" />
                        : <Bookmark className="w-4 h-4 fill-current" />
                    }
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                    <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-extrabold text-lg text-foreground leading-tight group-hover:text-primary transition-colors">
                        {career.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {career.description || career.purpose || t('favorites.default_desc', "Ихтисоси ҷолиб барои оянда.")}
                    </p>
                </div>
            </div>

            <Link
                to={`/info/${career.id}`}
                className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary/70 hover:text-primary transition-colors group/link"
            >
                {t('common.read_more', "Бештар бидонед")}
                <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
            </Link>
        </motion.div>
    );
};

const EmptyState = ({ icon: Icon, title, desc, linkTo, linkText }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-16 text-center flex flex-col items-center gap-5"
    >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary/50" />
        </div>
        <div>
            <h3 className="text-2xl font-black text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground font-medium">{desc}</p>
        </div>
        <Link to={linkTo} className="btn-primary px-8 py-3.5 text-sm group">
            {linkText}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
    </motion.div>
);

const Favorites = () => {
    const { token, user, updateUser } = useAuthStore();
    const { t } = useTranslation();

    const [likedCareers, setLikedCareers] = useState([]);
    const [savedCareers, setSavedCareers] = useState([]);
    const [activeTab, setActiveTab] = useState("liked");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let didCancel = false;

        async function loadData() {
            if (!token) { setLoading(false); return; }
            try {
                const [likedRes, savedRes] = await Promise.all([
                    axios.get(`${API}/users/liked-careers`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API}/users/saved-careers`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                if (!didCancel) {
                    setLikedCareers(likedRes.data || []);
                    setSavedCareers(savedRes.data || []);
                }
            } catch (err) {
                console.error("Favorites fetch error:", err);
                // Fall back to user store if API endpoints not ready yet
                if (!didCancel) {
                    setLikedCareers(user?.likedCareers || []);
                    setSavedCareers(user?.savedCareers || []);
                }
            } finally {
                if (!didCancel) setLoading(false);
            }
        }

        loadData();
        window.scrollTo(0, 0);
        return () => { didCancel = true; };
    }, [token]);

    const handleUnlike = async (careerId) => {
        try {
            await axios.post(`${API}/careers/${careerId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const updated = likedCareers.filter((c) => c.id !== careerId);
            setLikedCareers(updated);
            updateUser({ likedCareers: updated });
        } catch (err) {
            console.error("Unlike error:", err);
        }
    };

    const handleUnsave = async (careerId) => {
        try {
            await axios.post(`${API}/users/save-career/${careerId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const updated = savedCareers.filter((c) => c.id !== careerId);
            setSavedCareers(updated);
            updateUser({ savedCareers: updated });
        } catch (err) {
            console.error("Unsave error:", err);
        }
    };

    const activeList = activeTab === "liked" ? likedCareers : savedCareers;

    return (
        <div className="pb-24 pt-4">
            {/* Hero */}
            <section className="pt-16 pb-10 relative overflow-hidden">
                <div className="absolute inset-0 tajik-pattern opacity-5 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            <Heart className="w-3.5 h-3.5" />
                            {t('favorites.my_favorites', "Дӯстдоштаҳои ман")}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tighter leading-tight">
                            {t('favorites.title_1', "Ихтисосҳои")}{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-gradient">
                                {t('favorites.title_2', "захирашуда")}
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl font-medium leading-relaxed">
                            {t('favorites.desc', "Ихтисосҳои дӯстдошта ва захирашудаи шуморо дар як ҷо мебинед.")}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8">
                <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit">
                    <button
                        onClick={() => setActiveTab("liked")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "liked" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${activeTab === "liked" ? "fill-white" : ""}`} />
                        {t('favorites.liked', "Лайкшуда")} ({likedCareers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("saved")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "saved" ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Bookmark className={`w-4 h-4 ${activeTab === "saved" ? "fill-white" : ""}`} />
                        {t('favorites.saved', "Захирашуда")} ({savedCareers.length})
                    </button>
                </div>
            </div>

            {/* Content */}
            <section className="max-w-7xl mx-auto px-6 lg:px-8">
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                ) : activeList.length === 0 ? (
                    <EmptyState
                        icon={activeTab === "liked" ? Heart : Bookmark}
                        title={activeTab === "liked" ? t('favorites.no_likes_title', "Ҳоло лайке нест") : t('favorites.no_saves_title', "Ҳоло захираи нест")}
                        desc={activeTab === "liked"
                            ? t('favorites.no_likes_desc', "Ихтисосҳои дӯстдоштаи худро бо пахши тугмаи ❤️ илова кунед.")
                            : t('favorites.no_saves_desc', "Ихтисосҳоро барои хондани баъдтар захира кунед.")}
                        linkTo="/careers"
                        linkText={t('favorites.view_careers', "Ихтисосҳоро бубинед")}
                    />
                ) : (
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={activeTab}
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                        >
                            {activeList.map((career) => (
                                <CareerCard
                                    key={career.id}
                                    career={career}
                                    type={activeTab}
                                    onUnlike={handleUnlike}
                                    onUnsave={handleUnsave}
                                />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}
            </section>
        </div>
    );
};

export default Favorites;
