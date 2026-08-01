import { motion, AnimatePresence } from "framer-motion";
import { Heart, Bookmark, ArrowRight, Star, Sparkles } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import axios from "axios";
import { API } from "../lib/config";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import { useToast } from "./toast/ToastProvider";

const MatchCard = ({ career, matchPercentage, isLiked: initialLiked, isSaved: initialSaved, isLarge = false, onExplain }) => {
    const { t } = useTranslation();
    const [isLiked, setIsLiked] = useState(initialLiked || false);
    const [isSaved, setIsSaved] = useState(initialSaved || false);
    const [showHeart, setShowHeart] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { token, user, updateUser } = useAuthStore();
    const { error: showError } = useToast();

    // Sync with parent props & global user state
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

            // Update global store
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

            // Update global store
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
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`glass-card glass-card-glow group relative overflow-hidden flex flex-col justify-between h-full p-8 transition-all duration-500 cursor-pointer ${isLarge ? 'p-10' : 'p-8'}`}
        >
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 blur-[100px] group-hover:bg-primary/20 transition-all duration-700" />

            <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                                <motion.circle
                                    cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="transparent"
                                    strokeDasharray={176}
                                    initial={{ strokeDashoffset: 176 }}
                                    animate={{ strokeDashoffset: 176 - (176 * matchPercentage) / 100 }}
                                    transition={{ duration: 2, ease: "circOut" }}
                                    className="text-primary"
                                />
                            </svg>
                            <span className="absolute text-xs font-black text-foreground">{matchPercentage}%</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-1">
                                {t('common.match_level', 'Дараҷаи Мувофиқат')}
                            </span>
                            <div className="flex items-center gap-2">
                                <Star className="w-3 h-3 text-secondary fill-secondary" />
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.best_pick', 'Беҳтарин Интихоб')}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isSaved
                            ? "bg-secondary/20 text-secondary border border-secondary/30"
                            : "bg-white/5 border border-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                    </button>
                </div>

                <div className="space-y-4 flex-1 mb-10" onDoubleClick={handleLike}>
                    <h3 className={`font-black text-foreground group-hover:text-primary transition-colors leading-[1.1] ${isLarge ? 'text-3xl' : 'text-2xl'}`}>
                        {career.name}
                    </h3>
                    <p className={`text-muted-foreground font-medium leading-relaxed ${isLarge ? 'text-lg line-clamp-3' : 'text-sm line-clamp-2'}`}>
                        {career.description || career.purpose}
                    </p>

                    <AnimatePresence>
                        {showHeart && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                            >
                                <Heart className="w-24 h-24 text-rose-500 fill-current drop-shadow-[0_0_30px_rgba(244,63,94,0.5)]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${isLiked
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : "hover:bg-white/5 text-muted-foreground hover:text-rose-400"
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                        {career.likesCount}
                    </button>

                    {onExplain && (
                        <button
                            onClick={(e) => { e.preventDefault(); onExplain(); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all text-xs font-bold"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {t('common.why_match', 'Чаро ин?')}
                        </button>
                    )}

                    <Link
                        to={`/info/${career.id}`}
                        className="group/btn flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground hover:text-primary transition-all pr-2"
                    >
                        {t('common.details', 'Маълумот')}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover/btn:translate-x-1 group-hover/btn:bg-primary group-hover/btn:text-white transition-all">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default MatchCard;
