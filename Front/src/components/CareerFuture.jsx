import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Bot, Footprints, Loader2, Sparkles, User } from "lucide-react";
import { API } from "../lib/config";

// «Касби ман дар соли 2035»: пешгӯии AI (як бор сохта ва кеш мешавад) — хатари
// автоматикунонӣ, чӣ ба мошин ва чӣ ба одам мемонад, малакаҳои нав ва қадамҳо аз ҳозир.
const TEXT = {
    tj: {
        title: "🔮 Ин касб дар соли 2035", lead: "AI ва мошинҳо кадом корро мегиранд, чӣ ба одам мемонад ва аз ҳозир чӣ кор кунед.",
        show: "Нишон диҳед", loading: "AI пешгӯӣ месозад…", risk: { low: "Хатари автоматикунонӣ: паст", mid: "Хатари автоматикунонӣ: миёна", high: "Хатари автоматикунонӣ: баланд" },
        automated: "Ба мошин ва AI мегузарад", human: "Ба одам мемонад", skills: "Малакаҳои нав", prepare: "Аз ҳозир чӣ кор кунед",
        note: "Ин пешгӯии AI дар асоси тамоюлҳои ҷаҳонӣ аст, на факт.", error: "Пешгӯӣ сохта нашуд. Баъдтар боз кӯшиш кунед.",
    },
    ru: {
        title: "🔮 Эта профессия в 2035 году", lead: "Что заберут AI и машины, что останется за человеком и что делать уже сейчас.",
        show: "Показать", loading: "AI составляет прогноз…", risk: { low: "Риск автоматизации: низкий", mid: "Риск автоматизации: средний", high: "Риск автоматизации: высокий" },
        automated: "Перейдёт к машинам и AI", human: "Останется за человеком", skills: "Новые навыки", prepare: "Что делать уже сейчас",
        note: "Это прогноз AI на основе мировых тенденций, а не факт.", error: "Не удалось составить прогноз. Попробуйте позже.",
    },
    en: {
        title: "🔮 This career in 2035", lead: "What AI and machines will take over, what stays human and what to do now.",
        show: "Show", loading: "The AI is making a forecast…", risk: { low: "Automation risk: low", mid: "Automation risk: medium", high: "Automation risk: high" },
        automated: "Goes to machines and AI", human: "Stays human", skills: "New skills", prepare: "What to do now",
        note: "This is an AI forecast based on global trends, not a fact.", error: "Could not make a forecast. Please try later.",
    },
};
const RISK = { low: { tone: "bg-emerald-500", width: "25%" }, mid: { tone: "bg-amber-500", width: "55%" }, high: { tone: "bg-rose-500", width: "85%" } };

export default function CareerFuture({ careerId }) {
    const { i18n } = useTranslation();
    const lang = ["tj", "ru", "en"].includes((i18n.language || "tj").slice(0, 2)) ? (i18n.language || "tj").slice(0, 2) : "tj";
    const text = TEXT[lang];
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        setBusy(true);
        setError("");
        try {
            const res = await axios.get(`${API}/career-insight/${careerId}/future`, { params: { lang }, timeout: 60000 });
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };

    const list = (items, icon) => (
        <ul className="space-y-1.5">
            {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[14.5px] leading-snug text-foreground">
                    <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>{item}
                </li>
            ))}
        </ul>
    );

    return (
        <section className="overflow-hidden rounded-3xl border border-border bg-card" data-career-future>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-5">
                <div className="min-w-0">
                    <h2 className="text-xl font-black text-foreground">{text.title}</h2>
                    <p className="mt-1 text-[14px] text-muted-foreground">{text.lead}</p>
                </div>
                {!data && (
                    <button type="button" onClick={load} disabled={busy} className="btn-primary !py-2.5 disabled:opacity-60" data-future-show>
                        {busy ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {text.loading}</> : <><Sparkles className="h-4 w-4" aria-hidden /> {text.show}</>}
                    </button>
                )}
            </div>
            {error && <p className="p-5 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
            {data && (
                <div className="space-y-5 p-5" data-future-result>
                    <div>
                        <div className="flex items-center justify-between text-[14px] font-black text-foreground"><span>{text.risk[data.risk]}</span></div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-rose-500/20">
                            <div className={`h-full rounded-full ${RISK[data.risk].tone}`} style={{ width: RISK[data.risk].width }} />
                        </div>
                        {data.riskText && <p className="mt-2 text-[14.5px] text-muted-foreground">{data.riskText}</p>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-muted/40 p-4">
                            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-black uppercase tracking-wide text-muted-foreground"><Bot className="h-4 w-4" aria-hidden /> {text.automated}</h3>
                            {list(data.automated, "⚙️")}
                        </div>
                        <div className="rounded-2xl bg-primary/[0.06] p-4">
                            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-black uppercase tracking-wide text-primary"><User className="h-4 w-4" aria-hidden /> {text.human}</h3>
                            {list(data.human, "💡")}
                        </div>
                    </div>
                    <div>
                        <h3 className="mb-2 text-[13px] font-black uppercase tracking-wide text-muted-foreground">{text.skills}</h3>
                        <div className="flex flex-wrap gap-2">{data.skills.map((s) => <span key={s} className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[13.5px] font-bold text-foreground">{s}</span>)}</div>
                    </div>
                    <div>
                        <h3 className="mb-2 flex items-center gap-2 text-[13px] font-black uppercase tracking-wide text-muted-foreground"><Footprints className="h-4 w-4" aria-hidden /> {text.prepare}</h3>
                        <ol className="space-y-2">
                            {data.prepare.map((step, i) => (
                                <li key={step} className="flex items-start gap-3 text-[14.5px] text-foreground">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-black text-primary-foreground">{i + 1}</span>{step}
                                </li>
                            ))}
                        </ol>
                    </div>
                    {data.summary && <p className="rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-500/5 p-4 text-[15px] font-semibold leading-relaxed text-foreground">{data.summary}</p>}
                    <p className="text-[12px] text-muted-foreground">{text.note}</p>
                </div>
            )}
        </section>
    );
}
