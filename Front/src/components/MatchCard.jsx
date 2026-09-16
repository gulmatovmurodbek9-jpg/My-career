import { motion, AnimatePresence } from "framer-motion";
import { Heart, Bookmark, ArrowRight, Star, Sparkles } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import axios from "axios";
import { API } from "../lib/config";
import { useTranslation } from "react-i18next";
import { careerName, careerDescription, universityName } from "../lib/careerText";
import { currentApiLang } from "../lib/apiLang";
import { useAuthStore } from "../store/authStore";
import { useToast } from "./toast/ToastProvider";

const MatchCard = ({ career, matchPercentage, isLiked: initialLiked, isSaved: initialSaved, rank = 0, onExplain }) => {
    const { t } = useTranslation();
    const lang = currentApiLang();
    const [isLiked, setIsLiked] = useState(initialLiked || false);
    const [isSaved, setIsSaved] = useState(initialSaved || false);
    const [showHeart, setShowHeart] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { token, user, updateUser } = useAuthStore();
    const { error: showError } = useToast();

    const isTop = rank === 1;
    const percent = Math.max(0, Math.min(100, Math.round(matchPercentage || 0)));

    const universities = career.universities || [];
    const extraCount = Math.max(0, (career.universitiesCount || 0) - universities.length);

    useEffect(() => {
        setIsLiked(user?.likedCareers?.some(c => c.id === career.id) || !!initialLiked);
    }, [initialLiked, user?.likedCareers, career.id]);

    useEffect(() => {
        setIsSaved(user?.savedCareers?.some(c => c.id === career.id) || !!initialSaved);
    }, [initialSaved, user?.savedCareers, career.id]);

    const handleLike = async (e) => {
        e.preventDefault();
        if (!token || isLiking) return;
        try {
            setIsLiking(true);
            const { data } = await axios.post(`${API}/careers/${career.id}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsLiked(data.liked);
            if (data.liked) {
                setShowHeart(true);
                setTimeout(() => setShowHeart(false), 800);
            }
            career.likesCount = data.likesCount;

            const currentLiked = user?.likedCareers || [];
            const updatedLiked = data.liked
                ? [...currentLiked, career]
                : currentLiked.filter(c => c.id !== career.id);
            updateUser({ likedCareers: updatedLiked });
        } catch (err) {
            console.error("Like error:", err);
        } finally {
            setIsLiking(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!token || isSaving) return;
        try {
            setIsSaving(true);
            const { data } = await axios.post(`${API}/users/save-career/${career.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsSaved(data.saved);

            const currentSaved = user?.savedCareers || [];
            const updatedSaved = data.saved
                ? [...currentSaved, career]
                : currentSaved.filter(c => c.id !== career.id);
            updateUser({ savedCareers: updatedSaved });
        } catch (err) {
            console.error("Save error:", err);
            showError(err.response?.data?.message || err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <article className={`match-card group ${isTop ? "match-card--top" : ""}`}>
            <div className="relative z-10 flex h-full flex-col p-6 md:p-7">
                {/* Сарлавҳа: ҷои рейтинг ва тугмаи захира */}
                <div className="flex items-start justify-between gap-3">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${isTop
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted text-muted-foreground"
                            }`}
                    >
                        {isTop ? (
                            <>
                                <Star className="h-3 w-3 fill-current" />
                                {t('common.best_pick', 'Беҳтарин Интихоб')}
                            </>
                        ) : (
                            <span className="tabular-nums">№ {rank}</span>
                        )}
                    </span>

                    <button
                        type="button"
                        onClick={handleSave}
                        aria-pressed={isSaved}
                        aria-label={t('common.saved', 'Захираҳо')}
                        className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-colors duration-200 ${isSaved
                            ? "border-secondary/30 bg-secondary/10 text-secondary"
                            : "border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-primary"
                            }`}
                    >
                        <Bookmark className={`h-[18px] w-[18px] ${isSaved ? "fill-current" : ""}`} />
                    </button>
                </div>

                {/* Ном ва тавсиф — дар ҳама кортҳо як андоза, то сатр ҳамвор монад */}
                <div className="mt-5 flex-1" onDoubleClick={handleLike}>
                    <h3 className="text-xl leading-[1.2] font-bold text-foreground">
                        <Link
                            to={`/info/${career.id}`}
                            className="line-clamp-2 transition-colors hover:text-primary"
                        >
                            {careerName(career, lang)}
                        </Link>
                    </h3>
                    {/* Коди расмӣ — маҳз ҳамин рақам ҳангоми супоридани
                        ҳуҷҷат ба ММТ нависта мешавад. */}
                    {career.code && (
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                                {t('common.code', 'Код')}
                            </span>
                            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-foreground">
                                {career.code}
                            </span>
                        </div>
                    )}

                    <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {careerDescription(career, lang) || career.purpose}
                    </p>
                </div>

                {/* Донишгоҳҳо: бе онҳо довталаб мебинад, ки ихтисос мувофиқ
                    аст, вале намедонад куҷо ҳуҷҷат супорад. */}
                {universities.length > 0 && (
                    <div className="mt-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                            {t('common.where_to_study', 'Дар куҷо хондан мумкин')}
                        </span>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {universities.map((uni) => (
                                <span
                                    key={uni.id}
                                    title={uni.city ? `${universityName(uni, lang)} — ${uni.city}` : universityName(uni, lang)}
                                    className="max-w-full truncate rounded-lg bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"
                                >
                                    {universityName(uni, lang)}
                                </span>
                            ))}
                            {extraCount > 0 && (
                                <span className="rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
                                    +{extraCount}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Ченаки мувофиқат: сатри уфуқӣ ба ҷои ҳалқаи хурди 64px — фоиз
                   хонотар аст ва ранги роҳаш дар ҳарду тема намоён мемонад. */}
                <div className="mt-6">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                            {t('common.match_level', 'Дараҷаи Мувофиқат')}
                        </span>
                        <span className="text-lg font-bold tabular-nums text-primary">{percent}%</span>
                    </div>
                    <div
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t('common.match_level', 'Дараҷаи Мувофиқат')}
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                    >
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-blue"
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        />
                    </div>
                </div>

                {/* Поя */}
                <div className="mt-5 flex items-center justify-between gap-1 border-t border-border pt-4">
                    <button
                        type="button"
                        onClick={handleLike}
                        aria-pressed={isLiked}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold transition-colors ${isLiked
                            ? "text-rose-500"
                            : "text-muted-foreground hover:text-rose-500"
                            }`}
                    >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                        <span className="tabular-nums">{career.likesCount ?? 0}</span>
                    </button>

                    {onExplain && (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); onExplain(); }}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            {t('common.why_match', 'Чаро ин?')}
                        </button>
                    )}

                    {/* Ба ҷои саҳифаи умумӣ рост ба ҷадвали донишгоҳҳо мебарад:
                        интихоби донишгоҳ ва намуди ҷой маҳз он ҷост. */}
                    <Link
                        to={`/info/${career.id}#universities`}
                        className="group/btn flex items-center gap-2 rounded-lg py-1.5 pl-2 text-xs font-black uppercase tracking-[0.12em] text-foreground transition-colors hover:text-primary"
                    >
                        {t('common.choose', 'Интихоб')}
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover/btn:bg-primary group-hover/btn:text-primary-foreground">
                            <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                    </Link>
                </div>
            </div>

            <AnimatePresence>
                {showHeart && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.4, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                    >
                        <Heart className="h-24 w-24 fill-current text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.5)]" />
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
};

export default MatchCard;
