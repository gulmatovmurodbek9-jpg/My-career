import React, { useEffect, useState } from "react";
import { usePageState } from "../../lib/pageState";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart,
    Bookmark,
    Briefcase,
    ArrowRight,
    Loader2,
    Search,
    Target,
} from "lucide-react";
import { Link } from "react-router";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { API } from "../../lib/config";
import { useTranslation } from "react-i18next";
import { clusterLabel } from "../../lib/clusterLabel";
import { displayName } from "../../lib/careerName";
import { degreeLabel } from "../../lib/offeringLabels";

// Ҷадвал (компютер) ва рӯйхати фишурда (телефон): ном ва рамз, самт, дараҷа, донишгоҳҳо, амалҳо.
const TABLE_TEXT = {
    tj: { career: "Ихтисос", cluster: "Самт", degree: "Дараҷа", unis: "Донишгоҳҳо", more: "Бештар", trial: "Санҷед", remove: "Аз рӯйхат бароред" },
    ru: { career: "Специальность", cluster: "Направление", degree: "Уровень", unis: "Вузы", more: "Подробнее", trial: "Попробовать", remove: "Убрать из списка" },
    en: { career: "Specialty", cluster: "Direction", degree: "Level", unis: "Universities", more: "Details", trial: "Try", remove: "Remove from list" },
};

const CareerTable = ({ list, type, onRemove }) => {
    const { t, i18n } = useTranslation();
    const text = TABLE_TEXT[(i18n.language || "tj").slice(0, 2)] || TABLE_TEXT.tj;
    const RemoveIcon = type === "liked" ? Heart : Bookmark;
    const tone = type === "liked" ? "text-rose-500 hover:bg-rose-500/10" : "text-secondary hover:bg-secondary/10";
    const degree = (career) => [career.degreeType ? degreeLabel(t, career.degreeType) : null, career.durationYears ? t("misc.years", { count: career.durationYears }) : null].filter(Boolean).join(" · ") || "—";
    const removeButton = (career) => (
        <button type="button" onClick={() => onRemove(career.id)} title={text.remove} aria-label={text.remove}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl cursor-pointer transition-colors ${tone}`}>
            <RemoveIcon className="h-4 w-4 fill-current" />
        </button>
    );

    return (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
            {/* Компютер: ҷадвал */}
            <table className="hidden w-full text-left md:table">
                <thead className="border-b border-border bg-muted/40 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                    <tr>
                        <th scope="col" className="w-12 px-4 py-3 text-center">№</th>
                        <th scope="col" className="px-4 py-3">{text.career}</th>
                        <th scope="col" className="px-4 py-3">{text.cluster}</th>
                        <th scope="col" className="px-4 py-3">{text.degree}</th>
                        <th scope="col" className="px-4 py-3 text-center">{text.unis}</th>
                        <th scope="col" className="px-4 py-3"><span className="sr-only">{text.more}</span></th>
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence initial={false}>
                        {list.map((career, index) => (
                            <motion.tr key={career.id} layout exit={{ opacity: 0 }} className="border-b border-border last:border-0 hover:bg-muted/30">
                                <td className="px-4 py-3.5 text-center text-sm font-black tabular-nums text-muted-foreground">{index + 1}</td>
                                <td className="max-w-[22rem] px-4 py-3.5">
                                    <Link to={`/info/${career.id}`} className="font-bold leading-snug text-foreground hover:text-primary">{displayName(career.name)}</Link>
                                    {career.code && <div className="mt-0.5 font-mono text-[12px] tracking-wider text-muted-foreground">{career.code}</div>}
                                </td>
                                <td className="px-4 py-3.5">
                                    {career.cluster?.clusterName
                                        ? <span className="inline-flex rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[12px] font-bold leading-snug text-primary">{clusterLabel(t, career.cluster)}</span>
                                        : "—"}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-muted-foreground">{degree(career)}</td>
                                <td className="px-4 py-3.5 text-center text-sm font-bold tabular-nums text-foreground">{career.universities?.length || "—"}</td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Link to={`/trial/career/${career.id}`} className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl border border-border px-3 py-2 text-[12px] font-bold text-foreground hover:border-primary hover:text-primary">
                                            <Target className="h-3.5 w-3.5" /> {text.trial}
                                        </Link>
                                        <Link to={`/info/${career.id}`} className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl bg-primary/10 px-3 py-2 text-[12px] font-bold text-primary hover:bg-primary/20">
                                            {text.more} <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                        {removeButton(career)}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>

            {/* Телефон: рӯйхати фишурда */}
            <ul className="divide-y divide-border md:hidden">
                <AnimatePresence initial={false}>
                    {list.map((career, index) => (
                        <motion.li key={career.id} layout exit={{ opacity: 0 }} className="flex items-start gap-3 p-4">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                                <Link to={`/info/${career.id}`} className="font-bold leading-snug text-foreground">{displayName(career.name)}</Link>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
                                    {career.code && <span className="font-mono">{career.code}</span>}
                                    {career.cluster?.clusterName && <span className="font-semibold text-primary">{clusterLabel(t, career.cluster)}</span>}
                                    {career.universities?.length > 0 && <span>{t("misc2.universities_count", { count: career.universities.length })}</span>}
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <Link to={`/trial/career/${career.id}`} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold text-foreground">
                                        <Target className="h-3.5 w-3.5" /> {text.trial}
                                    </Link>
                                    <Link to={`/info/${career.id}`} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[12px] font-bold text-primary">
                                        {text.more} <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                            {removeButton(career)}
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
        </div>
    );
};

const EmptyState = ({ icon: Icon, title, desc, linkTo, linkText }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-16 text-center flex flex-col items-center gap-5"
    >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary/90" />
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
    const [activeTab, setActiveTab] = usePageState("favorites.tab", "liked");
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
                if (!didCancel) {
                    setLikedCareers(user?.likedCareers || []);
                    setSavedCareers(user?.savedCareers || []);
                }
            } finally {
                if (!didCancel) setLoading(false);
            }
        }

        loadData();
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
        <div className="pb-10">
            <section className="pb-6">
                <div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                            <Heart className="w-3.5 h-3.5" />
                            {t('favorites.my_favorites', "Дӯстдоштаҳои ман")}
                        </div>
                        <h1 className="text-2xl md:text-[2rem] font-black text-foreground tracking-tight leading-tight">
                            {t('favorites.title_1', "Ихтисосҳои")}{" "}
                            <span className="text-gradient-animated">
                                {t('favorites.title_2', "захирашуда")}
                            </span>
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-xl font-medium leading-relaxed">
                            {t('favorites.desc', "Ихтисосҳои дӯстдошта ва захирашудаи шуморо дар як ҷо мебинед.")}
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="mb-6">
                <div role="group" className="grid w-full grid-cols-2 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 sm:flex sm:w-fit sm:items-center">
                    <button
                        type="button"
                        aria-pressed={activeTab === "liked"}
                        onClick={() => setActiveTab("liked")}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest transition-all ${activeTab === "liked" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${activeTab === "liked" ? "fill-white" : ""}`} />
                        {t('favorites.liked', "Лайкшуда")} ({likedCareers.length})
                    </button>
                    <button
                        type="button"
                        aria-pressed={activeTab === "saved"}
                        onClick={() => setActiveTab("saved")}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest transition-all ${activeTab === "saved" ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Bookmark className={`w-4 h-4 ${activeTab === "saved" ? "fill-white" : ""}`} />
                        {t('favorites.saved', "Захирашуда")} ({savedCareers.length})
                    </button>
                </div>
            </div>

            <section>
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
                    <CareerTable
                        key={activeTab}
                        list={activeList}
                        type={activeTab}
                        onRemove={activeTab === "liked" ? handleUnlike : handleUnsave}
                    />
                )}
            </section>
        </div>
    );
};

export default Favorites;
