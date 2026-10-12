import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { HelpCircle, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { API } from "../lib/config";

// «Чаро ин касб?»: хонанда сабаби интихобро менависад, AI ростқавлона баҳо медиҳад —
// сабаби дохилӣ ё берунӣ, хатари пушаймонӣ ва 3 саволе, ки бояд аз худ пурсад.
const TEXT = {
    tj: {
        title: "Чаро шумо ин касбро мехоҳед?", lead: "Сайтҳо мегӯянд «чӣ», мо мепурсем «чаро». Сабаби худро ростқавлона нависед — AI мегӯяд, ки он чӣ қадар устувор аст.",
        placeholder: "Масалан: ба одамон кӯмак кардан мехоҳам ва биологияро дӯст медорам…", chips: ["Маоши хуб дорад", "Падару модарам мехоҳанд", "Шавқ дорам", "Дӯстонам меравад"],
        check: "Санҷед", again: "Сабаби дигар", privacy: "Матни шумо нигоҳ дошта намешавад.",
        type: { inner: "💚 Сабаби дохилӣ (шавқ, қобилият)", mixed: "🟡 Сабаби омехта", outer: "🟠 Сабаби берунӣ (пул, обрӯ, фишор)" },
        risk: { low: "Хатари пушаймонӣ: паст", mid: "Хатари пушаймонӣ: миёна", high: "Хатари пушаймонӣ: баланд" },
        questions: "3 савол барои худатон", talk: "Бо кӣ гап занед", error: "Ҷавоб нашуд. Боз кӯшиш кунед.",
    },
    ru: {
        title: "Почему вы хотите эту профессию?", lead: "Сайты говорят «что», мы спрашиваем «почему». Честно напишите причину — AI скажет, насколько она устойчива.",
        placeholder: "Например: хочу помогать людям и люблю биологию…", chips: ["Хорошая зарплата", "Так хотят родители", "Мне интересно", "Туда идут друзья"],
        check: "Проверить", again: "Другая причина", privacy: "Ваш текст не сохраняется.",
        type: { inner: "💚 Внутренняя причина (интерес, способности)", mixed: "🟡 Смешанная причина", outer: "🟠 Внешняя причина (деньги, престиж, давление)" },
        risk: { low: "Риск пожалеть: низкий", mid: "Риск пожалеть: средний", high: "Риск пожалеть: высокий" },
        questions: "3 вопроса себе", talk: "С кем поговорить", error: "Не удалось получить ответ. Попробуйте ещё раз.",
    },
    en: {
        title: "Why do you want this career?", lead: "Websites tell you “what” — we ask “why”. Write your honest reason and the AI will tell you how solid it is.",
        placeholder: "For example: I want to help people and I love biology…", chips: ["Good salary", "My parents want it", "I'm interested", "My friends are going"],
        check: "Check", again: "Another reason", privacy: "Your text is not stored.",
        type: { inner: "💚 Inner reason (interest, ability)", mixed: "🟡 Mixed reason", outer: "🟠 Outer reason (money, status, pressure)" },
        risk: { low: "Risk of regret: low", mid: "Risk of regret: medium", high: "Risk of regret: high" },
        questions: "3 questions to ask yourself", talk: "Who to talk to", error: "No answer. Please try again.",
    },
};
const RISK_TONE = { low: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300", mid: "bg-amber-500/12 text-amber-700 dark:text-amber-300", high: "bg-rose-500/12 text-rose-700 dark:text-rose-300" };

export default function CareerWhy({ careerId }) {
    const { i18n } = useTranslation();
    const lang = ["tj", "ru", "en"].includes((i18n.language || "tj").slice(0, 2)) ? (i18n.language || "tj").slice(0, 2) : "tj";
    const text = TEXT[lang];
    const [reason, setReason] = useState("");
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const check = async (event) => {
        event?.preventDefault();
        if (reason.trim().length < 3 || busy) return;
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(`${API}/career-insight/${careerId}/why`, { reason: reason.trim(), lang }, { timeout: 45000 });
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="overflow-hidden rounded-3xl border border-border bg-card" data-career-why>
            <div className="flex items-start gap-4 border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-transparent p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md shadow-primary/25"><HelpCircle className="h-6 w-6" aria-hidden /></span>
                <div className="min-w-0">
                    <h2 className="text-xl font-black text-foreground">{text.title}</h2>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{text.lead}</p>
                </div>
            </div>

            <div className="space-y-4 p-5">
                {!result ? (
                    <form onSubmit={check} className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {text.chips.map((chip) => (
                                <button key={chip} type="button" onClick={() => setReason((old) => (old.trim() ? `${old.trim()}, ${chip.toLowerCase()}` : chip))}
                                    className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-[13px] font-semibold text-foreground hover:border-primary cursor-pointer">
                                    + {chip}
                                </button>
                            ))}
                        </div>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 400))} rows={3} placeholder={text.placeholder} aria-label={text.title} data-why-input
                            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-ring" />
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-[12.5px] text-muted-foreground">{text.privacy}</span>
                            <button type="submit" disabled={busy || reason.trim().length < 3} className="btn-primary !py-2.5 disabled:opacity-50" data-why-check>
                                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <><Sparkles className="h-4 w-4" aria-hidden /> {text.check}</>}
                            </button>
                        </div>
                        {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
                    </form>
                ) : (
                    <div className="space-y-4" data-why-result>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-muted px-3 py-1.5 text-[13.5px] font-bold text-foreground">{text.type[result.type]}</span>
                            <span className={`rounded-full px-3 py-1.5 text-[13.5px] font-bold ${RISK_TONE[result.risk]}`}>{text.risk[result.risk]}</span>
                        </div>
                        <p className="text-[15.5px] leading-relaxed text-foreground">{result.summary}</p>
                        <div>
                            <h3 className="mb-2 text-[13px] font-black uppercase tracking-wide text-muted-foreground">{text.questions}</h3>
                            <ol className="space-y-2">
                                {result.questions.map((q, i) => (
                                    <li key={q} className="flex items-start gap-3 rounded-2xl bg-primary/[0.06] px-4 py-3 text-[15px] font-semibold text-foreground">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-black text-primary-foreground">{i + 1}</span>{q}
                                    </li>
                                ))}
                            </ol>
                        </div>
                        {result.talkTo && (
                            <p className="flex items-start gap-2 rounded-2xl border border-border p-3 text-[14.5px] text-foreground">
                                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /><span><b>{text.talk}:</b> {result.talkTo}</span>
                            </p>
                        )}
                        <button type="button" onClick={() => { setResult(null); setReason(""); }} className="text-[13.5px] font-bold text-primary hover:underline cursor-pointer">{text.again}</button>
                    </div>
                )}
            </div>
        </section>
    );
}
