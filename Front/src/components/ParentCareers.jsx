import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { BriefcaseBusiness, CircleHelp, GraduationCap, Loader2, PenLine, Send, Sparkles, Target } from "lucide-react";
import { API } from "../lib/config";
import { fill, parentText } from "../lib/parentSurvey";

// Иконкаи ҳар саволи кӯтоҳ (lucide, на emoji) — ранги худ дар доираи хурд.
const CHIP_ICON = {
    what: { Icon: CircleHelp, tone: "text-primary" },
    why: { Icon: Target, tone: "text-primary" },
    where: { Icon: GraduationCap, tone: "text-primary" },
    work: { Icon: BriefcaseBusiness, tone: "text-primary" },
};

function ChipIcon({ name }) {
    const { Icon, tone } = CHIP_ICON[name] || { Icon: Sparkles, tone: "bg-primary/15 text-primary" };
    return (
        <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone}`} aria-hidden>
            <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
    );
}

// Ихтисосҳои фарзанд барои волид — як рӯйхат (бе такрор) бо нишонаҳо: дар рӯйхати
// ҳуҷҷатсупорӣ, захира, санҷид, аз тест. Зери ҳар ихтисос 4 саволи кӯтоҳ ҳамеша намоён:
// як пахш — ҷавоби AI. Барои фарзанд ҳам кор мекунад (бо `secret`).
function Ask({ code, secret, career, text, lang }) {
    const [items, setItems] = useState([]);
    const [draft, setDraft] = useState("");
    const [writing, setWriting] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const ask = async (question, label = question) => {
        const q = question.trim();
        if (!q || busy) return;
        setBusy(true);
        setError("");
        setItems((old) => [...old, { q: label, a: null }]);
        setDraft("");
        try {
            // Се саволи охир — то «Мисол» баъди «маош чанд аст?» фаҳмо бошад.
            const history = items.filter((item) => item.a).slice(-3).map((item) => ({ q: item.q, a: item.a }));
            const { data } = await axios.post(`${API}/parents/invites/${code}/ask`, { careerId: career.id, question: q, lang, secret, history }, { timeout: 45000 });
            setItems((old) => old.map((item, i) => (i === old.length - 1 ? { ...item, a: data.answer } : item)));
        } catch (err) {
            setItems((old) => old.slice(0, -1));
            setError(err.response?.data?.message || text.askError);
        } finally {
            setBusy(false);
        }
    };

    const asked = new Set(items.map((item) => item.q));
    return (
        <div className="mt-3 space-y-3" data-parent-ask>
            <div className="flex flex-wrap gap-2">
                {text.askChips.map((chip) => (
                    <button key={chip.label} type="button" disabled={busy || asked.has(chip.label)} onClick={() => ask(chip.q, chip.label)}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card py-1.5 pl-1.5 pr-3.5 text-[13.5px] font-bold text-foreground transition hover:border-primary hover:bg-primary/10 active:scale-[0.98] disabled:opacity-45 cursor-pointer">
                        <ChipIcon name={chip.icon} /> {chip.label}
                    </button>
                ))}
                {!writing && (
                    <button type="button" onClick={() => setWriting(true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-2 text-[13.5px] font-bold text-muted-foreground hover:border-primary hover:text-primary cursor-pointer">
                        <PenLine className="h-4 w-4" aria-hidden /> {text.askOwn}
                    </button>
                )}
            </div>

            {items.map((item, index) => (
                <div key={index} className="rounded-2xl border border-primary/15 bg-card p-3.5">
                    <div className="mb-1.5 text-[13px] font-black text-primary">{item.q}</div>
                    {item.a ? (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{item.a}</p>
                    ) : (
                        <p className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {text.askThinking}</p>
                    )}
                </div>
            ))}

            {writing && (
                <form onSubmit={(event) => { event.preventDefault(); ask(draft); }} className="flex gap-2">
                    <input value={draft} autoFocus onChange={(event) => setDraft(event.target.value.slice(0, 500))} placeholder={text.askPlaceholder} aria-label={text.askPlaceholder}
                        className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus-ring" />
                    <button type="submit" disabled={busy || draft.trim().length < 3} aria-label={text.askSend} className="btn-primary !h-11 !w-11 !p-0 disabled:opacity-50">
                        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}
                    </button>
                </form>
            )}
            {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
    );
}

export default function ParentCareers({ invite, code, secret, forChild = false }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = parentText(lang);
    const data = invite?.careers;
    if (!data) return null;

    // Як ихтисос — як корт: ҳамаи манбаъҳо ҳамчун нишона.
    const merged = new Map();
    const add = (career, tag, extra = {}) => {
        if (!career?.id) return;
        const entry = merged.get(career.id) || { id: career.id, name: career.name, tags: [] };
        entry.tags.push(tag);
        Object.assign(entry, extra);
        merged.set(career.id, entry);
    };
    (data.plan || []).forEach((c) => add(c, text.tagPlan, { plan: [c.university, c.paymentType].filter(Boolean).join(" · ") }));
    (data.saved || []).forEach((c) => add(c, text.tagSaved));
    (data.tried || []).forEach((c) => add(c, text.tagTried, { tried: fill(text.triedMeta, { s: c.solved, l: c.liked, t: c.total }) }));
    (data.fromTest || []).slice(0, 6).forEach((c) => add(c, c.percent != null ? fill(text.tagTest, { p: c.percent }) : text.groupTest));
    const careers = [...merged.values()];
    if (!careers.length) return null;

    const name = invite.childName;
    return (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" data-parent-careers>
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" aria-hidden /></span>
                <div>
                    <h2 className="text-xl font-black text-foreground">{forChild ? text.careersTitleChild : name ? fill(text.careersTitle, { name }) : text.careersTitleNoName}</h2>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{text.careersText}</p>
                </div>
            </div>

            <ul className="mt-5 space-y-3">
                {careers.map((career) => (
                    <li key={career.id} className="rounded-2xl border border-border bg-card p-4">
                        <Link to={`/info/${career.id}`} className="block text-[16px] font-black leading-snug text-foreground hover:text-primary">{career.name}</Link>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {career.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-bold text-muted-foreground">{tag}</span>
                            ))}
                        </div>
                        {(career.plan || career.tried) && (
                            <p className="mt-1.5 text-[12.5px] text-muted-foreground">{[career.plan, career.tried].filter(Boolean).join(" · ")}</p>
                        )}
                        <Ask code={code} secret={secret} career={career} text={text} lang={lang} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
