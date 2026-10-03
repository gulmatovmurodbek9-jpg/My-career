import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, Search, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

// «Чаро ин ихтисос?» — танҳо он чи ҳисоб воқеан медонад:
// 1) мувофиқати САМТ (аз қисми 1-и тест, барои ҳамаи ихтисосҳои самт якхела);
// 2) калимаҳо аз ҷавобҳои қисми 2, ки дар номи ё тавсифи ҳамин ихтисос ёфт шуданд.
// Пештар дар ин ҷо «cosine», «euclidean» ва радари профили сунъӣ буд — маълумоти нав
// намедоданд, бинобар ин бардошта шуданд.

const DIMENSION_NAMES = {
    c1: { tj: "Табиӣ ва техникӣ", ru: "Естественно-технический", en: "Natural & technical" },
    c2: { tj: "Иқтисод ва география", ru: "Экономика и география", en: "Economics & geography" },
    c3: { tj: "Филология ва санъат", ru: "Филология и искусство", en: "Philology & arts" },
    c4: { tj: "Ҷомеашиносӣ ва ҳуқуқ", ru: "Обществознание и право", en: "Social science & law" },
    c5: { tj: "Тиб ва варзиш", ru: "Медицина и спорт", en: "Medicine & sport" },
};

const UI_TEXT = {
    modalTitle: { tj: "Чаро ин ихтисос?", ru: "Почему эта специальность?", en: "Why this specialty?" },
    direction: { tj: "Мувофиқати самт", ru: "Совпадение направления", en: "Direction match" },
    directionHint: {
        tj: "Аз қисми 1-и тест: ҷавобҳои шумо ба ин самт чанд хол доданд, аз ҳадди имконпазир. Барои ҳамаи ихтисосҳои ин самт якхела аст.",
        ru: "Из первой части теста: сколько баллов ваши ответы дали этому направлению от максимума. Одинаково для всех специальностей направления.",
        en: "From part 1 of the test: points your answers gave this direction out of the maximum. The same for every specialty in the direction.",
    },
    rank: { tj: "Ҷой дар рӯйхат", ru: "Место в списке", en: "Place in the list" },
    whyTitle: { tj: "Чаро маҳз ин ихтисос боло аст", ru: "Почему именно эта специальность выше", en: "Why this specialty ranks high" },
    whyWords: {
        tj: "Ҷавобҳои шумо дар қисми 2 ба ин мавзӯъҳо ишора карданд ва онҳо дар ин ихтисос ҳастанд:",
        ru: "Ваши ответы во второй части указали на эти темы, и они есть в этой специальности:",
        en: "Your part-2 answers pointed to these topics, and they appear in this specialty:",
    },
    whyNone: {
        tj: "Ҷавобҳои қисми 2 ба ин ихтисос мустақиман ишора накарданд — он аз ҳамон самт аст ва аз рӯи алифбо дар рӯйхат омад.",
        ru: "Ответы второй части прямо не указали на эту специальность — она из того же направления и стоит в списке по алфавиту.",
        en: "Your part-2 answers did not point to this specialty directly — it is from the same direction and listed alphabetically.",
    },
    profile: { tj: "Холи шумо дар ҳар самт", ru: "Ваши баллы по направлениям", en: "Your score in each direction" },
    honest: {
        tj: "Ин тавсия аст, на ҳукм. Ихтисосро кушоед ва бинед: чӣ кор мекунанд, дар куҷо мехонанд ва бали гузариш чанд аст.",
        ru: "Это рекомендация, а не приговор. Откройте специальность: чем занимаются, где учиться и какой проходной балл.",
        en: "This is a suggestion, not a verdict. Open the specialty: what the work is, where to study and the entry score.",
    },
};

const DIMENSIONS = ["c1", "c2", "c3", "c4", "c5"];
const pick = (entry, lang) => (entry ? entry[lang] || entry.en : "");

export default function MatchExplainModal({ isOpen, onClose, matchData }) {
    const { i18n } = useTranslation();
    const lang = i18n.language?.slice(0, 2) || "tj";

    if (!matchData) return null;

    const { name, matchPercentage = 0, clusterMatch, rank, reasons = [], userProfile = {} } = matchData;
    const direction = Math.round(clusterMatch ?? matchPercentage ?? 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && onClose()}
                    >
                        <div className="relative flex w-full max-w-xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                            <div className="shrink-0 border-b border-border px-6 py-4 flex items-start justify-between gap-4">
                                <div className="min-w-0 space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wide text-primary">{pick(UI_TEXT.modalTitle, lang)}</p>
                                    <h2 className="text-lg font-black leading-snug text-foreground">{name}</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="w-9 h-9 shrink-0 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                                        <div className="text-3xl font-black text-primary">{direction}%</div>
                                        <div className="mt-1 text-xs font-semibold text-muted-foreground">{pick(UI_TEXT.direction, lang)}</div>
                                    </div>
                                    {rank ? (
                                        <div className="rounded-2xl border border-border bg-muted/40 p-4">
                                            <div className="text-3xl font-black text-foreground">#{rank}</div>
                                            <div className="mt-1 text-xs font-semibold text-muted-foreground">{pick(UI_TEXT.rank, lang)}</div>
                                        </div>
                                    ) : <div />}
                                </div>
                                <p className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    {pick(UI_TEXT.directionHint, lang)}
                                </p>

                                <div>
                                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                                        <Search className="h-4 w-4 text-primary" />
                                        {pick(UI_TEXT.whyTitle, lang)}
                                    </h3>
                                    {reasons.length > 0 ? (
                                        <>
                                            <p className="text-[13px] text-muted-foreground">{pick(UI_TEXT.whyWords, lang)}</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {reasons.map((word) => (
                                                    <span key={word} className="rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary">
                                                        {word}…
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-[13px] text-muted-foreground">{pick(UI_TEXT.whyNone, lang)}</p>
                                    )}
                                </div>

                                {Object.keys(userProfile).length > 0 && (
                                    <div>
                                        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            {pick(UI_TEXT.profile, lang)}
                                        </h3>
                                        <div className="space-y-2.5">
                                            {DIMENSIONS.map((dim) => {
                                                const value = Math.max(0, Math.min(100, Number(userProfile[dim]) || 0));
                                                return (
                                                    <div key={dim}>
                                                        <div className="mb-1 flex justify-between text-[13px]">
                                                            <span className="font-semibold text-foreground">{pick(DIMENSION_NAMES[dim], lang)}</span>
                                                            <span className="font-black tabular-nums text-foreground">{value}%</span>
                                                        </div>
                                                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                                            <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <p className="rounded-2xl border border-border bg-muted/30 p-3 text-[13px] leading-relaxed text-muted-foreground">
                                    {pick(UI_TEXT.honest, lang)}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
