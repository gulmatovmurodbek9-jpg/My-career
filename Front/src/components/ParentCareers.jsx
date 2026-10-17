import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { BriefcaseBusiness, CircleHelp, GraduationCap, Loader2, MessageCircle, Sparkles, Target } from "lucide-react";
import { API } from "../lib/config";
import { fill, parentText } from "../lib/parentSurvey";

// Иконкаи ҳар саволи кӯтоҳ (lucide, на emoji).
const CHIP_ICON = { what: CircleHelp, why: Target, where: GraduationCap, work: BriefcaseBusiness };

// Ихтисосҳои фарзанд барои оила — як рӯйхат (бе такрор) бо нишонаҳо. Зери ҳар ихтисос:
// саволу ҷавобҳои AI ва паёмҳои оила (барои ҳама намоён), 4 саволи тайёр ва як майдон:
// «Аз AI пурсед» ё «Ба фарзанд нависед». Фарзанд (бо `secret`) ҳамаашро мебинад ва ба оила менависад.
function CareerItem({ career, notes, onAdd, code, secret, author, forChild, childName, text, lang }) {
    const [draft, setDraft] = useState("");
    const [busy, setBusy] = useState(null); // "ask" | "note"
    const [pending, setPending] = useState("");
    const [error, setError] = useState("");

    const who = (key) => {
        if (key === "child") return forChild ? text.childSelf : childName || text.childOther;
        return text.authors[key] || text.authors.other;
    };

    const ask = async (question) => {
        const q = question.trim();
        if (q.length < 3 || busy) return;
        setBusy("ask");
        setPending(q);
        setError("");
        setDraft("");
        try {
            // Се саволи охир — то «Мисол» баъди «маош чанд аст?» фаҳмо бошад.
            const history = notes.filter((n) => n.kind === "ask" && n.answer).slice(-3).map((n) => ({ q: n.text, a: n.answer }));
            const { data } = await axios.post(`${API}/parents/invites/${code}/ask`, { careerId: career.id, question: q, lang, secret, author, history }, { timeout: 45000 });
            onAdd(data.note || { id: `local-${Date.now()}`, careerId: career.id, author: forChild ? "child" : author || "other", kind: "ask", text: q, answer: data.answer, createdAt: new Date().toISOString() });
        } catch (err) {
            setDraft(q);
            setError(err.response?.data?.message || text.askError);
        } finally {
            setBusy(null);
            setPending("");
        }
    };

    const write = async () => {
        const value = draft.trim();
        if (value.length < 2 || busy) return;
        setBusy("note");
        setError("");
        try {
            const { data } = await axios.post(`${API}/parents/invites/${code}/notes`, { careerId: career.id, text: value, author, secret });
            onAdd(data);
            setDraft("");
        } catch (err) {
            setError(err.response?.data?.message || text.noteError);
        } finally {
            setBusy(null);
        }
    };

    const asked = new Set(notes.filter((n) => n.kind === "ask").map((n) => n.text));
    const chips = text.askChips.filter((chip) => !asked.has(chip.q));
    const writeLabel = forChild ? text.toFamily : childName ? fill(text.toChild, { name: childName }) : text.toChildNoName;
    const placeholder = forChild ? text.writeChild : childName ? fill(text.writeParent, { name: childName }) : text.writeParentNoName;

    return (
        <li className="rounded-2xl border border-border bg-card p-4" data-family-career>
            <Link to={`/info/${career.id}`} className="block text-[16px] font-black leading-snug text-foreground hover:text-primary">{career.name}</Link>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
                {career.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-bold text-muted-foreground">{tag}</span>
                ))}
            </div>
            {(career.plan || career.tried) && (
                <p className="mt-1.5 text-[12.5px] text-muted-foreground">{[career.plan, career.tried].filter(Boolean).join(" · ")}</p>
            )}

            {(notes.length > 0 || pending) && (
                <div className="mt-3 space-y-2.5">
                    {notes.map((note) => note.kind === "ask" ? (
                        <div key={note.id} className="rounded-xl bg-muted/45 p-3">
                            <div className="text-[12px] font-bold text-muted-foreground">{fill(text.asked, { who: who(note.author) })}</div>
                            <div className="mt-0.5 text-[14px] font-bold text-foreground">{note.text}</div>
                            <p className="mt-1.5 flex gap-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-foreground">
                                <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                                <span>{note.answer}</span>
                            </p>
                        </div>
                    ) : (
                        <div key={note.id} className="rounded-xl border border-primary/20 bg-primary/5 p-3" data-family-note>
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-primary">
                                <MessageCircle className="h-3.5 w-3.5" aria-hidden /> {fill(text.wrote, { who: who(note.author) })}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{note.text}</p>
                        </div>
                    ))}
                    {pending && (
                        <div className="rounded-xl bg-muted/45 p-3">
                            <div className="text-[14px] font-bold text-foreground">{pending}</div>
                            <p className="mt-1.5 flex items-center gap-2 text-[14px] font-semibold text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {text.askThinking}</p>
                        </div>
                    )}
                </div>
            )}

            {chips.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {chips.map((chip) => {
                        const Icon = CHIP_ICON[chip.icon] || CircleHelp;
                        return (
                            <button key={chip.label} type="button" disabled={!!busy} onClick={() => ask(chip.q)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-bold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-45 cursor-pointer">
                                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden /> {chip.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="mt-3">
                <textarea value={draft} rows={2} onChange={(event) => setDraft(event.target.value.slice(0, 500))} placeholder={placeholder} aria-label={placeholder}
                    className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus-ring" />
                <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => ask(draft)} disabled={!!busy || draft.trim().length < 3}
                        className="inline-flex flex-1 basis-[140px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-[14px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-45 cursor-pointer">
                        {busy === "ask" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />} {text.askAiButton}
                    </button>
                    <button type="button" onClick={write} disabled={!!busy || draft.trim().length < 2} data-family-write
                        className="inline-flex flex-1 basis-[210px] items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-card px-3 py-2.5 text-[14px] font-bold text-primary transition hover:bg-primary/5 disabled:opacity-45 cursor-pointer">
                        {busy === "note" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageCircle className="h-4 w-4" aria-hidden />} <span>{writeLabel}</span>
                    </button>
                </div>
            </div>
            {error && <p className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        </li>
    );
}

export default function ParentCareers({ invite, code, secret, forChild = false, author, bare = false }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = parentText(lang);
    const [notes, setNotes] = useState(() => invite?.notes || []);

    // Навсозии даврӣ (дар саҳифаи фарзанд) ёддоштҳои навро меорад — бе гум кардани ёддоштҳои маҳаллӣ.
    useEffect(() => {
        const incoming = invite?.notes || [];
        setNotes((old) => {
            const ids = new Set(incoming.map((n) => n.id));
            return [...incoming, ...old.filter((n) => !ids.has(n.id) && String(n.id).startsWith("local-"))];
        });
    }, [invite?.notes]);

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

    const onAdd = (note) => setNotes((old) => [...old, note]);
    const list = (
        <ul className={`${bare ? "" : "mt-5"} space-y-3`}>
            {careers.map((career) => (
                <CareerItem key={career.id} career={career} notes={notes.filter((n) => n.careerId === career.id)} onAdd={onAdd}
                    code={code} secret={secret} author={author} forChild={forChild} childName={invite.childName} text={text} lang={lang} />
            ))}
        </ul>
    );
    if (bare) return <div data-parent-careers>{list}</div>;

    return (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" data-parent-careers>
            <h2 className="text-xl font-black text-foreground">{forChild ? text.careersTitleFamily : invite.childName ? fill(text.careersTitle, { name: invite.childName }) : text.careersTitleNoName}</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{forChild && !notes.some((n) => n.author !== "child") ? text.noNotes : text.careersText}</p>
            {list}
        </section>
    );
}
