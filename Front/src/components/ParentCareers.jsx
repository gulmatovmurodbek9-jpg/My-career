import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Bookmark, ChevronDown, ClipboardList, FileText, Loader2, Send, Sparkles, Target } from "lucide-react";
import { API } from "../lib/config";
import { fill, parentText } from "../lib/parentSurvey";

// Ихтисосҳои фарзанд барои волид: аз тест, захирашуда, рӯйхати ҳуҷҷатсупорӣ, санҷидашуда.
// Дар назди ҳар ихтисос — «Аз AI пурсед»: саволҳои тайёр ё саволи озод.
// Барои фарзанд ҳам кор мекунад (бо `secret`).
function AskBox({ code, secret, career, text, lang }) {
    const [items, setItems] = useState([]);
    const [draft, setDraft] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const ask = async (question) => {
        const q = question.trim();
        if (!q || busy) return;
        setBusy(true);
        setError("");
        setItems((old) => [...old, { q, a: null }]);
        setDraft("");
        try {
            const { data } = await axios.post(`${API}/parents/invites/${code}/ask`, { careerId: career.id, question: q, lang, secret }, { timeout: 45000 });
            setItems((old) => old.map((item, i) => (i === old.length - 1 ? { ...item, a: data.answer } : item)));
        } catch (err) {
            setItems((old) => old.slice(0, -1));
            setError(err.response?.data?.message || text.askError);
        } finally {
            setBusy(false);
        }
    };

    const quick = text.askQuick.map((q) => fill(q, { name: career.name }));
    return (
        <div className="mt-3 space-y-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3.5" data-parent-ask>
            {items.map((item, index) => (
                <div key={index} className="space-y-2">
                    <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[14px] font-semibold text-primary-foreground">{item.q}</p>
                    {item.a ? (
                        <p className="w-fit max-w-[95%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-2.5 text-[14.5px] leading-relaxed text-foreground">
                            <Sparkles className="mr-1.5 inline h-4 w-4 text-primary" aria-hidden />{item.a}
                        </p>
                    ) : (
                        <p className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {text.askThinking}</p>
                    )}
                </div>
            ))}
            <div className="flex flex-wrap gap-2">
                {quick.map((q) => (
                    <button key={q} type="button" disabled={busy} onClick={() => ask(q)}
                        className="rounded-full border border-primary/30 bg-card px-3 py-1.5 text-[13px] font-semibold text-foreground hover:border-primary disabled:opacity-50 cursor-pointer">
                        {q}
                    </button>
                ))}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); ask(draft); }} className="flex gap-2">
                <input value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 500))} placeholder={text.askPlaceholder} aria-label={text.askPlaceholder}
                    className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus-ring" />
                <button type="submit" disabled={busy || draft.trim().length < 3} aria-label={text.askSend} className="btn-primary !h-11 !w-11 !p-0 disabled:opacity-50">
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}
                </button>
            </form>
            {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
    );
}

export default function ParentCareers({ invite, code, secret, forChild = false }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = parentText(lang);
    const [open, setOpen] = useState(null);
    const data = invite?.careers;
    if (!data) return null;

    const groups = [
        { key: "plan", title: text.groupPlan, icon: FileText, items: data.plan || [], meta: (c) => [c.university, c.paymentType].filter(Boolean).join(" · ") },
        { key: "saved", title: text.groupSaved, icon: Bookmark, items: data.saved || [] },
        { key: "tried", title: text.groupTried, icon: Target, items: data.tried || [], meta: (c) => fill(text.triedMeta, { s: c.solved, l: c.liked, t: c.total }) },
        { key: "test", title: text.groupTest, icon: ClipboardList, items: (data.fromTest || []).slice(0, 6), meta: (c) => (c.percent != null ? `${c.percent}%` : "") },
    ].filter((group) => group.items.length);
    if (!groups.length) return null;

    const name = invite.childName;
    return (
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-card p-5 sm:p-6" data-parent-careers>
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md shadow-primary/25"><Sparkles className="h-6 w-6" aria-hidden /></span>
                <div>
                    <h2 className="text-xl font-black text-foreground">{forChild ? text.careersTitleChild : name ? fill(text.careersTitle, { name }) : text.careersTitleNoName}</h2>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{text.careersText}</p>
                </div>
            </div>

            <div className="mt-5 space-y-5">
                {groups.map((group) => (
                    <div key={group.key}>
                        <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wide text-muted-foreground">
                            <group.icon className="h-4 w-4 text-primary" aria-hidden /> {group.title} <span className="font-bold">({group.items.length})</span>
                        </h3>
                        <ul className="space-y-2">
                            {group.items.map((career, index) => {
                                const id = `${group.key}:${career.id}:${index}`;
                                const isOpen = open === id;
                                return (
                                    <li key={id} className={`rounded-2xl border bg-card p-3 transition-colors ${isOpen ? "border-primary/40" : "border-border"}`}>
                                        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                                            <div className="min-w-0 flex-1">
                                                <Link to={`/info/${career.id}`} className="block font-bold leading-snug text-foreground hover:text-primary">{career.name}</Link>
                                                {group.meta?.(career) && <span className="block text-[12.5px] text-muted-foreground">{group.meta(career)}</span>}
                                            </div>
                                            <button type="button" onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}
                                                className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-bold cursor-pointer ${isOpen ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary hover:bg-primary/15"}`}>
                                                <Sparkles className="h-4 w-4" aria-hidden /> <span>{text.askAi}</span>
                                                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                                            </button>
                                        </div>
                                        {isOpen && <AskBox code={code} secret={secret} career={career} text={text} lang={lang} />}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}
