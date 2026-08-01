import React, { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API } from "../lib/config";
import { useAuthStore } from "../store/authStore";
import {
  ArrowRight,
  Briefcase,
  TrendingUp,
  Heart,
  Bookmark,
  Star,
} from "lucide-react";

/**
 * Tuition shown as the range across every university that offers the specialty,
 * since the same programme costs very different amounts in Душанбе and a
 * district college. Collapses to one number when min and max agree.
 */
export function formatTuition(specialty) {
  const min = specialty.minTuitionFee ?? specialty.tuitionFee;
  const max = specialty.maxTuitionFee ?? specialty.tuitionFee;
  if (!min && !max) return null;
  if (!max || min === max) return `${min.toLocaleString("ru-RU")} сом./сол`;
  return `${min.toLocaleString("ru-RU")} – ${max.toLocaleString("ru-RU")} сом./сол`;
}

/** Official NTC code + tuition range + a badge when state-funded seats exist. */
export function SpecialtyMeta({ specialty, size = "normal" }) {
  const tuition = formatTuition(specialty);
  const pad = size === "small" ? "px-2 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {specialty.code && (
        <span className={`inline-flex items-center rounded-full font-black tracking-wider bg-white/5 text-muted-foreground border border-white/10 ${pad}`}>
          {specialty.code}
        </span>
      )}
      {tuition && (
        <span className={`inline-flex items-center rounded-full font-black uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20 ${pad}`}>
          {tuition}
        </span>
      )}
      {specialty.hasFreeSeats && (
        <span className={`inline-flex items-center rounded-full font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${pad}`}>
          Ройгон ҳаст
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   GRID VIEW — premium rich card
   ═══════════════════════════════════════════════ */
export default function SpecialtyCard({ specialty }) {
  const { t } = useTranslation();
  const { token, user, updateUser } = useAuthStore();
  const roadmap = specialty.roadmap || [];

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(specialty.likesCount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with user data
  React.useEffect(() => {
    setIsLiked(user?.likedCareers?.some(c => c.id === specialty.id) || false);
    setIsSaved(user?.savedCareers?.some(c => c.id === specialty.id) || false);
  }, [user?.likedCareers, user?.savedCareers, specialty.id]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || isLiking) return;
    try {
      setIsLiking(true);
      const { data } = await axios.post(`${API}/careers/${specialty.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);

      // Update global user state for persistence
      const currentLiked = user?.likedCareers || [];
      const updatedLiked = data.liked
        ? [...currentLiked, specialty]
        : currentLiked.filter(c => c.id !== specialty.id);
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
      const { data } = await axios.post(`${API}/users/save-career/${specialty.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(data.saved);

      // Update global user state for persistence
      const currentSaved = user?.savedCareers || [];
      const updatedSaved = data.saved
        ? [...currentSaved, specialty]
        : currentSaved.filter(c => c.id !== specialty.id);
      updateUser({ savedCareers: updatedSaved });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Link to={`/info/${specialty.id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        className="glass-card glass-card-glow group h-full flex flex-col p-8 transition-all duration-500 cursor-pointer relative overflow-hidden"
      >
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/5 blur-[80px] group-hover:bg-primary/20 transition-all duration-700" />

        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-2">
            {specialty.cluster?.clusterName && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/20 w-fit">
                {specialty.cluster.clusterName}
              </span>
            )}
            <SpecialtyMeta specialty={specialty} />
          </div>

          <button
            onClick={handleSave}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 z-20 ${isSaved ? "bg-secondary/20 text-secondary border border-secondary/30" : "bg-white/5 border border-white/10 hover:border-white/20 text-muted-foreground"
              }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-white/10 shadow-xl shadow-primary/5">
            <Briefcase className="h-8 w-8" />
          </div>

          <div className="text-right flex items-center gap-4">
            {roadmap.length > 0 && (
              <div className="flex flex-col">
                <div className="text-xl font-black text-foreground leading-none">{roadmap.length}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{t('common.career_steps', 'Қадамҳои')}</div>
              </div>
            )}
            <button
              onClick={handleLike}
              className={`flex flex-col items-center group/like z-20 transition-transform active:scale-90`}
            >
              <Heart className={`h-6 w-6 transition-all ${isLiked ? "text-rose-500 fill-rose-500" : "text-muted-foreground group-hover/like:text-rose-400"}`} />
              <div className={`text-sm font-black leading-none mt-1 ${isLiked ? "text-rose-500" : "text-foreground"}`}>{likesCount}</div>
            </button>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <h3 className="font-extrabold text-2xl text-foreground group-hover:text-primary transition-colors leading-tight">
            {specialty.name}
          </h3>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed line-clamp-3">
            {specialty.description || specialty.purpose || t('common.default_desc', "Ин ихтисоси ҷолиб ояндаи шуморо пурра тағйир дода метавонад.")}
          </p>
        </div>

        <div className="mt-10 flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold">
                {i === 3 ? '+' : ''}
              </div>
            ))}
          </div>

          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white group-hover:translate-x-1 transition-all duration-500 shadow-lg">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export function SpecialtyCardList({ specialty }) {
  const { t } = useTranslation();
  const { token, user, updateUser } = useAuthStore();

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(specialty.likesCount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with user data
  React.useEffect(() => {
    setIsLiked(user?.likedCareers?.some(c => c.id === specialty.id) || false);
    setIsSaved(user?.savedCareers?.some(c => c.id === specialty.id) || false);
  }, [user?.likedCareers, user?.savedCareers, specialty.id]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || isLiking) return;
    try {
      setIsLiking(true);
      const { data } = await axios.post(`${API}/careers/${specialty.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);

      // Update global user state for persistence
      const currentLiked = user?.likedCareers || [];
      const updatedLiked = data.liked
        ? [...currentLiked, specialty]
        : currentLiked.filter(c => c.id !== specialty.id);
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
      const { data } = await axios.post(`${API}/users/save-career/${specialty.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(data.saved);

      // Update global user state for persistence
      const currentSaved = user?.savedCareers || [];
      const updatedSaved = data.saved
        ? [...currentSaved, specialty]
        : currentSaved.filter(c => c.id !== specialty.id);
      updateUser({ savedCareers: updatedSaved });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Link to={`/info/${specialty.id}`} className="block h-full">
      <motion.div
        whileHover={{ x: 5 }}
        className="glass-card glass-card-glow group h-full flex flex-col p-6 transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary/70">{specialty.cluster?.clusterName || t('common.course', "Курси таълимӣ")}</span>
            <h3 className="font-black text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
              {specialty.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all z-20 ${isSaved ? "bg-secondary/20 text-secondary border border-secondary/30" : "bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10"
                }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2 mb-4">
          {specialty.description || specialty.purpose || t('common.career_desc_short', "Ихтисоси ояндадор барои донишҷӯён.")}
        </p>

        <div className="mb-6">
          <SpecialtyMeta specialty={specialty} size="small" />
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-[10px] font-black">PREMIUM</span>
            </div>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 z-20 transition-all active:scale-95`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "text-rose-500 fill-rose-500" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-black ${isLiked ? "text-rose-500" : ""}`}>{likesCount}</span>
            </button>
          </div>
          <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>
    </Link>
  );
}
