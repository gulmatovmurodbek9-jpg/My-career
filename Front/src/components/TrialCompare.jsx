import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Scale, Star, X } from "lucide-react";
import { API } from "../lib/config";
import { useAuthStore } from "../store/authStore";
import { hideTrialResult, mergeHistory, trialScore } from "../lib/trialHistory";

// Муқоисаи касбҳои санҷидашуда: кадомаш бештар писанд омад ва кадомашро беҳтар ҳал кард.
const TEXT = {
    tj: {
        title: "Муқоисаи касбҳои санҷидашуда",
        hint: "Ҳар касберо, ки месанҷед, ин ҷо илова мешавад. Беҳтарин бо ⭐ — он ки бештар писанд омад.",
        one: "Боз як касбро санҷед — баъд онҳоро паҳлӯ ба паҳлӯ муқоиса мекунед.",
        career: "Касб", liked: "Писанд", solved: "Ҳал", rating: "Баҳо", confidence: "Боварӣ", result: "Натиҷа",
        best: "Ба шумо аз ҳама бештар мувофиқ", fit: "Мувофиқ", notFit: "Мувофиқ нест", again: "Аз нав", hide: "Аз рӯйхат бароред",
        ratings: ["", "Тамоман не", "Каме", "Хуб", "Хеле!"], tryMore: "Касби дигарро санҷед",
    },
    ru: {
        title: "Сравнение попробованных профессий",
        hint: "Каждая попробованная профессия появляется здесь. Лучшая отмечена ⭐ — та, что понравилась больше всего.",
        one: "Попробуйте ещё одну профессию — потом сравните их рядом.",
        career: "Профессия", liked: "Понравилось", solved: "Решено", rating: "Оценка", confidence: "Уверенность", result: "Итог",
        best: "Подходит вам больше всего", fit: "Подходит", notFit: "Не подходит", again: "Заново", hide: "Убрать из списка",
        ratings: ["", "Совсем нет", "Немного", "Хорошо", "Очень!"], tryMore: "Попробовать другую профессию",
    },
    en: {
        title: "Compare the careers you tried",
        hint: "Every career you try appears here. The best one is marked ⭐ — the one you liked most.",
        one: "Try one more career — then compare them side by side.",
        career: "Career", liked: "Liked", solved: "Solved", rating: "Rating", confidence: "Confidence", result: "Result",
        best: "Suits you best", fit: "Suits", notFit: "Does not suit", again: "Again", hide: "Remove from list",
        ratings: ["", "Not at all", "A little", "Good", "A lot!"], tryMore: "Try another career",
    },
};

const linkOf = (item) => (item.careerId ? `/trial/career/${item.careerId}` : `/trial/${item.family}`);

function Bar({ value, total, tone }) {
    const pct = total ? Math.round((value / total) * 100) : 0;
    return (
        <div className="min-w-[4.5rem]">
            <div className="text-[13px] font-bold tabular-nums text-foreground">{value}/{total}</div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} /></div>
        </div>
    );
}

// minCount: дар хулоса танҳо аз 2 касб; дар /trial аз 1 (бо даъват барои дуюм).
// compact: дар сутуни танг (хулосаи санҷиш) — ҳамеша кортҳо, на ҷадвал.
export default function TrialCompare({ minCount = 1, highlight = null, className = "", compact = false }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = TEXT[lang] || TEXT.tj;
    const token = useAuthStore((state) => state.token);
    const [server, setServer] = useState([]);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        let alive = true;
        axios.get(`${API}/trial/mine`, { params: { lang }, headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(({ data }) => alive && setServer(Array.isArray(data) ? data : []))
            .catch(() => {});
        return () => { alive = false; };
    }, [token, lang, highlight]);

    const items = mergeHistory(server)
        .map((item) => ({ ...item, score: trialScore(item) }))
        .sort((a, b) => b.score - a.score || new Date(b.at) - new Date(a.at));
    const hide = useCallback((key) => { hideTrialResult(key); setServer((old) => old.filter((x) => x.key !== key)); setVersion((v) => v + 1); }, []);
    void version;

    if (items.length < minCount || !items.length) return null;
    const best = items.length > 1 && items[0].fit ? items[0].key : null;

    return (
        <section data-trial-compare className={`rounded-3xl border border-border bg-card p-5 sm:p-6 ${className}`}>
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Scale className="h-5 w-5" aria-hidden /></span>
                <div>
                    <h2 className="text-xl font-black text-foreground">{text.title}</h2>
                    <p className="mt-0.5 text-[14px] text-muted-foreground">{items.length > 1 ? text.hint : text.one}</p>
                </div>
            </div>

            {/* Компютер: ҷадвал */}
            <div className={`mt-4 hidden overflow-hidden rounded-2xl border border-border ${compact ? "" : "md:block"}`}>
                <table className="w-full text-left">
                    <thead className="bg-muted/40 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                        <tr>
                            <th scope="col" className="px-4 py-3">{text.career}</th>
                            <th scope="col" className="px-4 py-3">{text.liked}</th>
                            <th scope="col" className="px-4 py-3">{text.solved}</th>
                            <th scope="col" className="px-4 py-3">{text.rating}</th>
                            <th scope="col" className="px-4 py-3">{text.confidence}</th>
                            <th scope="col" className="px-4 py-3">{text.result}</th>
                            <th scope="col" className="px-2 py-3"><span className="sr-only">{text.hide}</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.key} className={`border-t border-border ${item.key === best ? "bg-amber-500/[0.07]" : ""} ${item.key === highlight ? "outline outline-2 -outline-offset-2 outline-primary/40" : ""}`}>
                                <td className="max-w-[18rem] px-4 py-3">
                                    <div className="flex items-start gap-2">
                                        {item.key === best && <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-500" aria-label={text.best} />}
                                        <div className="min-w-0">
                                            <Link to={linkOf(item)} className="font-bold leading-snug text-foreground hover:text-primary">{item.name}</Link>
                                            {item.key === best && <div className="text-[12px] font-bold text-amber-600 dark:text-amber-400">{text.best}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3"><Bar value={item.liked} total={item.total} tone="bg-emerald-500" /></td>
                                <td className="px-4 py-3"><Bar value={item.solved} total={item.total} tone="bg-primary" /></td>
                                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-foreground">{item.rating ? text.ratings[item.rating] : "—"}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold tabular-nums text-foreground">{item.confBefore && item.confAfter ? `${item.confBefore} → ${item.confAfter}` : "—"}</td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                                        <img src={item.fit ? "/emoji/1f60a.png" : "/emoji/1f914.png"} alt="" className="h-5 w-5" /> {item.fit ? text.fit : text.notFit}
                                    </span>
                                </td>
                                <td className="px-2 py-3">
                                    <button type="button" onClick={() => hide(item.key)} title={text.hide} aria-label={text.hide} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"><X className="h-4 w-4" aria-hidden /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Телефон: кортҳо */}
            <ul className={`mt-4 ${compact ? "grid gap-2.5 sm:grid-cols-2" : "space-y-2.5 md:hidden"}`}>
                {items.map((item) => (
                    <li key={item.key} className={`rounded-2xl border p-3.5 ${item.key === best ? "border-amber-500/40 bg-amber-500/[0.07]" : "border-border"}`}>
                        <div className="flex items-start gap-2">
                            <img src={item.fit ? "/emoji/1f60a.png" : "/emoji/1f914.png"} alt="" className="mt-0.5 h-6 w-6 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <Link to={linkOf(item)} className="font-bold leading-snug text-foreground">{item.name}</Link>
                                {item.key === best && <div className="flex items-center gap-1 text-[12px] font-bold text-amber-600 dark:text-amber-400"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden /> {text.best}</div>}
                            </div>
                            <button type="button" onClick={() => hide(item.key)} aria-label={text.hide} className="rounded-lg p-1 text-muted-foreground cursor-pointer"><X className="h-4 w-4" aria-hidden /></button>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                            <div><div className="text-[11px] font-bold uppercase text-muted-foreground">{text.liked}</div><Bar value={item.liked} total={item.total} tone="bg-emerald-500" /></div>
                            <div><div className="text-[11px] font-bold uppercase text-muted-foreground">{text.solved}</div><Bar value={item.solved} total={item.total} tone="bg-primary" /></div>
                            <div><div className="text-[11px] font-bold uppercase text-muted-foreground">{text.confidence}</div><div className="text-[13px] font-bold tabular-nums text-foreground">{item.confBefore && item.confAfter ? `${item.confBefore} → ${item.confAfter}` : "—"}</div></div>
                        </div>
                    </li>
                ))}
            </ul>

            {items.length === 1 && (
                <Link to="/trial" className="mt-4 inline-flex items-center gap-1 text-[14px] font-bold text-primary">{text.tryMore} <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            )}
        </section>
    );
}
