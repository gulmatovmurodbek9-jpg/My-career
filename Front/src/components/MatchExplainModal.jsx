import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, AlertTriangle, ShieldAlert, TrendingUp, Activity } from "lucide-react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import { useTranslation } from "react-i18next";

// ═══════════════════════════════════════════════════════════════
//  TRANSLATIONS
// ═══════════════════════════════════════════════════════════════

const DIMENSION_NAMES = {
    c1: { tj: "Табиӣ-техникӣ", ru: "Естественно-технический", en: "Natural-Technical" },
    c2: { tj: "Иқтисод-география", ru: "Экономико-географический", en: "Economics-Geography" },
    c3: { tj: "Филология-санъат", ru: "Филология-искусство", en: "Philology-Arts" },
    c4: { tj: "Ҷомеашиносӣ-ҳуқуқ", ru: "Социология-право", en: "Sociology-Law" },
    c5: { tj: "Тиб-варзиш", ru: "Медицина-спорт", en: "Medicine-Sports" },
};

const UI_TEXT = {
    modalTitle: { tj: "Таҳлили мувофиқат", ru: "Анализ совпадения", en: "Match Analysis" },
    match: { tj: "Мувофиқат", ru: "Совпадение", en: "Match" },
    shape: { tj: "Шакл", ru: "Форма", en: "Shape" },
    proximity: { tj: "Наздикӣ", ru: "Близость", en: "Proximity" },
    confidence: { tj: "Боварӣ", ru: "Уверенность", en: "Confidence" },
    profileCompare: { tj: "Муқоисаи профилҳо", ru: "Сравнение профилей", en: "Profile Comparison" },
    yourProfile: { tj: "Профили шумо", ru: "Ваш профиль", en: "Your Profile" },
    careerProfile: { tj: "Кластери ММТ", ru: "Кластер НЦТ", en: "MMT Cluster" },
    dimBreakdown: { tj: "Тафсилоти ҳар бахш", ru: "Разбивка по измерениям", en: "Dimension Breakdown" },
    dimension: { tj: "Кластер", ru: "Кластер", en: "Cluster" },
    alignment: { tj: "Мувофиқат", ru: "Совпадение", en: "Alignment" },
    strength: { tj: "Сатҳ", ru: "Уровень", en: "Strength" },
    strongAlign: { tj: "Мувофиқати баланд", ru: "Сильное совпадение", en: "Strong alignment" },
    moderateAlign: { tj: "Мувофиқати миёна", ru: "Среднее совпадение", en: "Moderate alignment" },
    weakAlign: { tj: "Мувофиқати паст", ru: "Слабое совпадение", en: "Weak alignment" },
    confHigh: { tj: "Баланд", ru: "Высокая", en: "High" },
    confMedium: { tj: "Миёна", ru: "Средняя", en: "Medium" },
    confLow: { tj: "Паст", ru: "Низкая", en: "Low" },
};

const DIMENSIONS = ["c1", "c2", "c3", "c4", "c5"];

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function txt(key, lang) {
    const entry = UI_TEXT[key];
    if (!entry) return key;
    return entry[lang] || entry.en;
}

function dimName(dim, lang) {
    const entry = DIMENSION_NAMES[dim];
    if (!entry) return dim;
    return entry[lang] || entry.en;
}

const STRENGTH_CONFIG = {
    strong: { key: "strongAlign", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", bar: "bg-emerald-500" },
    moderate: { key: "moderateAlign", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", bar: "bg-amber-500" },
    weak: { key: "weakAlign", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", bar: "bg-rose-500" },
};

const CONFIDENCE_CONFIG = {
    high: { key: "confHigh", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
    medium: { key: "confMedium", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
    low: { key: "confLow", icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/30" },
};

function getStrength(value) {
    if (value > 0.8) return STRENGTH_CONFIG.strong;
    if (value >= 0.5) return STRENGTH_CONFIG.moderate;
    return STRENGTH_CONFIG.weak;
}

function getConfidence(value) {
    if (value > 0.25) return CONFIDENCE_CONFIG.high;
    if (value >= 0.1) return CONFIDENCE_CONFIG.medium;
    return CONFIDENCE_CONFIG.low;
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function MatchExplainModal({ isOpen, onClose, matchData }) {
    const { i18n } = useTranslation();
    const lang = i18n.language?.slice(0, 2) || "tj";

    if (!matchData) return null;

    const {
        name,
        matchPercentage = 0,
        cosineSimilarity = 0,
        euclideanSimilarity = 0,
        confidenceIndex = 0,
        dimensionBreakdown = {},
        userProfile = {},
        careerProfile = {},
    } = matchData;

    // ── Radar chart data: two datasets (user vs career) ──
    const radarData = DIMENSIONS.map((dim) => ({
        dimension: dimName(dim, lang),
        [txt("yourProfile", lang)]: userProfile[dim] ?? 0,
        [txt("careerProfile", lang)]: careerProfile[dim] ?? 0,
        fullMark: 10,
    }));

    const userKey = txt("yourProfile", lang);
    const careerKey = txt("careerProfile", lang);
    const confidence = getConfidence(confidenceIndex);
    const ConfIcon = confidence.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && onClose()}
                    >
                        <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0 relative">
                            {/* ── Header ── */}
                            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">
                                        {txt("modalTitle", lang)}
                                    </p>
                                    <h2 className="text-lg font-black text-foreground truncate max-w-[400px]">
                                        {name}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* ── Score badges row ── */}
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Match % */}
                                    <div className="glass-card-sm !rounded-xl p-4 text-center">
                                        <div className="text-3xl font-black text-primary">{matchPercentage}%</div>
                                        <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">
                                            {txt("match", lang)}
                                        </div>
                                    </div>

                                    {/* Similarity scores */}
                                    <div className="glass-card-sm !rounded-xl p-4 text-center">
                                        <div className="text-xl font-black text-foreground">
                                            {Math.round(cosineSimilarity * 100)}%
                                            <span className="text-xs font-bold text-muted-foreground ml-1.5">
                                                {txt("shape", lang)}
                                            </span>
                                        </div>
                                        <div className="text-xl font-black text-foreground mt-1">
                                            {Math.round(euclideanSimilarity * 100)}%
                                            <span className="text-xs font-bold text-muted-foreground ml-1.5">
                                                {txt("proximity", lang)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Confidence badge */}
                                    <div className={`rounded-xl p-4 text-center border ${confidence.bg} ${confidence.border}`}>
                                        <ConfIcon className={`w-6 h-6 mx-auto mb-1 ${confidence.color}`} />
                                        <div className={`text-sm font-black ${confidence.color}`}>
                                            {txt(confidence.key, lang)}
                                        </div>
                                        <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                                            {txt("confidence", lang)}
                                        </div>
                                    </div>
                                </div>

                                {/* ── 1. Dual Radar Chart ── */}
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-primary" />
                                        {txt("profileCompare", lang)}
                                    </h3>
                                    <div className="glass-card-sm !rounded-xl p-4">
                                        <div className="h-[280px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                                    <PolarGrid stroke="rgba(99, 102, 241, 0.08)" />
                                                    <PolarAngleAxis
                                                        dataKey="dimension"
                                                        tick={{ fill: "hsl(var(--foreground))", fontSize: 10, fontWeight: 800 }}
                                                    />
                                                    <Radar
                                                        name={userKey}
                                                        dataKey={userKey}
                                                        stroke="#6366f1"
                                                        strokeWidth={2}
                                                        fill="#6366f1"
                                                        fillOpacity={0.15}
                                                        dot={{ r: 3, fill: "#6366f1" }}
                                                    />
                                                    <Radar
                                                        name={careerKey}
                                                        dataKey={careerKey}
                                                        stroke="#f59e0b"
                                                        strokeWidth={2}
                                                        fill="#f59e0b"
                                                        fillOpacity={0.1}
                                                        dot={{ r: 3, fill: "#f59e0b" }}
                                                        strokeDasharray="4 4"
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: "rgba(18, 18, 18, 0.95)",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "12px",
                                                            padding: "10px 14px",
                                                            fontSize: "12px",
                                                        }}
                                                    />
                                                    <Legend
                                                        wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "12px" }}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* ── 2. Dimension Breakdown Table ── */}
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        {txt("dimBreakdown", lang)}
                                    </h3>
                                    <div className="glass-card-sm !rounded-xl overflow-hidden">
                                        {/* Table header */}
                                        <div className="grid grid-cols-[1fr_100px_140px] gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                                {txt("dimension", lang)}
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">
                                                {txt("alignment", lang)}
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">
                                                {txt("strength", lang)}
                                            </span>
                                        </div>

                                        {/* Rows */}
                                        {DIMENSIONS.map((dim, idx) => {
                                            const value = dimensionBreakdown[dim] ?? 0;
                                            const pct = Math.round(value * 100);
                                            const str = getStrength(value);

                                            return (
                                                <motion.div
                                                    key={dim}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="grid grid-cols-[1fr_100px_140px] gap-2 items-center px-4 py-3 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                                                >
                                                    {/* Dimension name — translated */}
                                                    <span className="text-sm font-bold text-foreground">{dimName(dim, lang)}</span>

                                                    {/* Alignment bar + percentage */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${pct}%` }}
                                                                transition={{ duration: 0.8, delay: idx * 0.05 }}
                                                                className={`h-full rounded-full ${str.bar}`}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-black text-muted-foreground w-9 text-right">{pct}%</span>
                                                    </div>

                                                    {/* Strength badge — translated */}
                                                    <div className="flex justify-end">
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${str.bg} ${str.border} ${str.color}`}>
                                                            {txt(str.key, lang)}
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
