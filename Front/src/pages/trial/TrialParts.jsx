import React, { useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import {
    Bookmark, BookmarkCheck, Briefcase, CheckCircle2, ClipboardList, Frown, GraduationCap, Laugh, Lightbulb,
    MapPin, Meh, Minus, Plus, Smile, Sparkles, Sprout, Sun, ThumbsDown, ThumbsUp, UserCheck, UserX, XCircle,
} from "lucide-react";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { loginUrl } from "../../components/RouteGuards";
import { clusterLabelNumbered } from "../../lib/clusterLabel";
import { languageLabel, paymentTypeLabel, studyFormLabel } from "../../lib/offeringLabels";
import { fillText } from "../../lib/trialText";

// Қисмҳои саҳифаи «Як рӯз дар ихтисос».
export const MOOD = [Frown, Meh, Smile, Laugh];

export function RatingScale({ count, value, onChange, labels, icons }) {
    return (
        <div className={`grid gap-2 ${count === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
            {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
                <button
                    key={n}
                    type="button"
                    aria-pressed={value === n}
                    onClick={() => onChange(n)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border px-1 py-3 text-center transition cursor-pointer ${value === n ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50"}`}
                >
                    {icons ? (() => { const Icon = icons[n - 1]; return <Icon className="h-6 w-6" aria-hidden />; })() : <span className="text-xl font-black">{n}</span>}
                    <span className="text-[11px] leading-tight text-muted-foreground">{labels[n - 1]}</span>
                </button>
            ))}
        </div>
    );
}

export function TaskBody({ task }) {
    return (
        <>
            {task.prompt && <p className="leading-relaxed text-foreground">{task.prompt}</p>}
            {task.quote && (
                <blockquote className="mt-3 whitespace-pre-line rounded-2xl border-l-4 border-primary bg-primary/5 px-4 py-3 text-[15px] italic text-foreground">
                    {task.quote}
                </blockquote>
            )}
            {task.code && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-900 px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-100 sm:text-sm">{task.code}</pre>
            )}
            {task.table?.head && (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/60">
                            <tr>{task.table.head.map((cell, i) => <th key={i} className="px-3 py-2 text-left font-bold text-foreground">{cell}</th>)}</tr>
                        </thead>
                        <tbody>
                            {(task.table.rows || []).map((row, r) => (
                                <tr key={r} className="border-t border-border">
                                    {row.map((cell, i) => <td key={i} className={`whitespace-nowrap px-3 py-2 ${i === 0 ? "font-semibold text-foreground" : "tabular-nums text-muted-foreground"}`}>{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="mt-4 font-bold text-foreground">{task.question}</p>
        </>
    );
}

// Ҷавоб: интихоб, якчанд, тартиб ё рақам. Баъди санҷиш вариантҳо ранг ва шарҳ мегиранд.
export function AnswerInput({ task, value, onChange, result, text }) {
    const locked = !!result;
    if (task.kind === "number") {
        return (
            <div className="mt-3">
                <label className="text-sm text-muted-foreground" htmlFor={`n-${task.id}`}>{text.yourNumber}</label>
                <div className="mt-1 flex items-center gap-2">
                    <input
                        id={`n-${task.id}`}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        disabled={locked}
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-32 rounded-xl border border-border bg-card px-3 py-2.5 text-lg font-bold text-foreground outline-none focus:border-primary"
                    />
                    <span className="text-muted-foreground">{task.unit}</span>
                </div>
            </div>
        );
    }

    const selected = task.kind === "choice" ? (value ? [value] : []) : (value || []);
    const correct = result ? (Array.isArray(result.answer) ? result.answer : [result.answer]) : [];
    const toggle = (id) => {
        if (locked) return;
        if (task.kind === "choice") return onChange(id);
        if (selected.includes(id)) return onChange(selected.filter((x) => x !== id));
        if (task.kind === "multi" && selected.length >= task.pick) return;
        onChange([...selected, id]);
    };

    return (
        <div className="mt-3 space-y-2">
            {task.kind === "order" && !locked && <p className="text-sm text-muted-foreground">{text.orderHint}</p>}
            {task.kind === "multi" && !locked && <p className="text-sm text-muted-foreground">{fillText(text.pickN, { n: task.pick })}</p>}
            {task.options.map((option) => {
                const position = selected.indexOf(option.id);
                const isSelected = position >= 0;
                const isCorrect = locked && task.kind !== "order" && correct.includes(option.id);
                const isWrong = locked && task.kind !== "order" && isSelected && !isCorrect;
                const feedback = locked ? result.feedback?.[option.id] : null;
                const tone = isCorrect
                    ? "border-emerald-500 bg-emerald-500/10"
                    : isWrong
                        ? "border-rose-500 bg-rose-500/10"
                        : isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/50";
                return (
                    <button
                        key={option.id}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={locked}
                        onClick={() => toggle(option.id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${tone} ${locked ? "cursor-default" : "cursor-pointer"}`}
                    >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {task.kind === "order" ? (isSelected ? position + 1 : "·") : option.id.toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[15px] text-foreground">{option.text}</span>
                            {feedback && (isSelected || isCorrect) && (
                                <span className={`mt-1.5 block text-sm ${isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{feedback}</span>
                            )}
                        </span>
                        {isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />}
                        {isWrong && <XCircle className="h-5 w-5 shrink-0 text-rose-500" aria-hidden />}
                    </button>
                );
            })}
        </div>
    );
}

export const answerReady = (task, value) => {
    if (task.kind === "number") return value !== undefined && value !== "" && Number.isFinite(Number(value));
    if (task.kind === "choice") return !!value;
    if (task.kind === "multi") return (value || []).length === task.pick;
    return (value || []).length === task.options.length;
};

// Баъди ҷавоб: табрик/рӯҳбаландкунӣ, тартиби дуруст, «чаро», «дар кори воқеӣ», «аз ҳозир машқ кунед», малака.
export function FeedbackPanel({ task, result, index, text }) {
    const ids = Array.isArray(result.answer) ? result.answer : [];
    const lines = result.solved ? text.praise : text.encourage;
    const [title, subtitle] = lines[index % lines.length];
    return (
        <>
            <div className={`flex items-start gap-4 rounded-3xl border p-5 ${result.solved ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${result.solved ? "bg-emerald-500" : "bg-amber-500"}`}>
                    {result.solved ? <CheckCircle2 className="h-6 w-6" aria-hidden /> : <Lightbulb className="h-6 w-6" aria-hidden />}
                </span>
                <div className="min-w-0">
                    <p className={`text-lg font-black ${result.solved ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>{title}</p>
                    <p className="mt-0.5 text-[15px] text-foreground">
                        {task.kind === "order" && result.solved && !result.perfect ? text.rightOrder : subtitle}
                    </p>
                </div>
            </div>
            {task.kind === "order" && !result.perfect && (
                <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-bold text-foreground">{text.correctOrder}</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-foreground">
                        {ids.map((id) => <li key={id}>{task.options.find((option) => option.id === id)?.text}</li>)}
                    </ol>
                </div>
            )}
            {task.kind === "number" && !result.solved && (
                <div className="rounded-2xl border border-border bg-card p-4 text-foreground">
                    <p className="font-bold">{fillText(text.correctNumber, { n: result.answer })}</p>
                    {result.numberFeedback && <p className="mt-1 text-sm text-muted-foreground">{result.numberFeedback}</p>}
                </div>
            )}
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="p-5">
                    <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-primary">
                        <Lightbulb className="h-4 w-4" aria-hidden /> {text.whyTitle}
                    </p>
                    <ol className="mt-4 space-y-3">
                        {(result.steps || []).map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{i + 1}</span>
                                <span className="text-[15px] leading-relaxed text-foreground">{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
                {result.realLife && (
                    <div className="flex items-start gap-3 border-t border-border bg-muted/40 px-5 py-4">
                        <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                        <p className="text-[15px] leading-relaxed text-foreground"><b>{text.realLifeTitle}</b> {result.realLife}</p>
                    </div>
                )}
                {result.tip && (
                    <div className="flex items-start gap-3 border-t border-border bg-emerald-500/5 px-5 py-4">
                        <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        <p className="text-[15px] leading-relaxed text-foreground"><b>{text.tipTitle}</b> {result.tip}</p>
                    </div>
                )}
                {result.skillName && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-amber-500" aria-hidden /> {text.skillUsed}
                        <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">{result.skillName}</span>
                    </div>
                )}
            </div>
        </>
    );
}

// «Як рӯзи корӣ»: аз субҳ то шом.
export function DayTimeline({ day, text }) {
    if (!day?.length) return null;
    return (
        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-black text-foreground"><Sun className="h-5 w-5 text-amber-500" aria-hidden /> {text.dayTitle}</h2>
            <ol className="relative mt-4 space-y-4 border-l-2 border-primary/20 pl-5">
                {day.map((item, i) => (
                    <li key={i} className="relative">
                        <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-card bg-primary" aria-hidden />
                        <span className="text-xs font-black tabular-nums text-primary">{item.time}</span>
                        <p className="mt-0.5 text-[15px] leading-relaxed text-foreground">{item.text}</p>
                    </li>
                ))}
            </ol>
        </div>
    );
}

// Плюсҳо ва минусҳо + ба кӣ мувофиқ / душвор.
export function ProsCons({ scenario, text }) {
    const Column = ({ title, items, Icon, tone }) => (
        <div className={`rounded-3xl border p-5 ${tone.box}`}>
            <h3 className={`flex items-center gap-2 font-black ${tone.title}`}><Icon className="h-5 w-5" aria-hidden /> {title}</h3>
            <ul className="mt-3 space-y-2.5">
                {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-foreground">
                        <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tone.dot}`}>
                            {Icon === ThumbsUp || Icon === UserCheck ? <Plus className="h-3 w-3" aria-hidden /> : <Minus className="h-3 w-3" aria-hidden />}
                        </span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
    const green = { box: "border-emerald-500/25 bg-emerald-500/5", title: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500 text-white" };
    const red = { box: "border-rose-500/25 bg-rose-500/5", title: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500 text-white" };
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Column title={text.prosTitle} items={scenario.pros || []} Icon={ThumbsUp} tone={green} />
                <Column title={text.consTitle} items={scenario.cons || []} Icon={ThumbsDown} tone={red} />
            </div>
            {(scenario.goodFor?.length > 0 || scenario.hardFor?.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <Column title={text.goodForTitle} items={scenario.goodFor || []} Icon={UserCheck} tone={green} />
                    <Column title={text.hardForTitle} items={scenario.hardFor || []} Icon={UserX} tone={red} />
                </div>
            )}
        </div>
    );
}

// Хулоса барои ихтисос: захира, кластер, рамз ва дар куҷо хондан (нарх) + нақшаи ҳуҷҷатсупорӣ.
export function CareerBlock({ career, text }) {
    const { t } = useTranslation();
    const location = useLocation();
    const { token, user, updateUser } = useAuthStore();
    const [saved, setSaved] = useState(() => !!user?.savedCareers?.some((c) => c.id === career.id));
    const [planned, setPlanned] = useState(() => new Set());
    const [busy, setBusy] = useState(null);
    const [message, setMessage] = useState(null);
    const login = loginUrl(location.pathname + location.search);

    const save = async () => {
        if (busy) return;
        setBusy("save");
        setMessage(null);
        try {
            const { data } = await axios.post(`${API}/users/save-career/${career.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setSaved(data.saved);
            const current = user?.savedCareers || [];
            updateUser({ savedCareers: data.saved ? [...current, { id: career.id, name: career.nameTj }] : current.filter((c) => c.id !== career.id) });
            setMessage({ ok: true, text: data.saved ? text.savedOk : text.unsavedOk });
        } catch {
            setMessage({ ok: false, text: text.actionError });
        } finally {
            setBusy(null);
        }
    };

    const addToPlan = async (offeringId) => {
        if (busy) return;
        setBusy(offeringId);
        setMessage(null);
        try {
            await axios.post(`${API}/users/application-plan/${offeringId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setPlanned((prev) => new Set(prev).add(offeringId));
            setMessage({ ok: true, text: text.planOk });
        } catch (err) {
            setMessage({ ok: false, text: err.response?.data?.message || text.actionError });
        } finally {
            setBusy(null);
        }
    };

    const fee = (o) => (o.paymentType === "ройгон" || o.tuitionFee == null
        ? <span className="font-bold text-emerald-600 dark:text-emerald-400">{t("career_page.of_free")}</span>
        : <span className="font-bold text-foreground">{o.tuitionFee.toLocaleString("ru-RU")} {t("career_page.sal_somoni")}</span>);

    return (
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card">
            <div className="bg-gradient-to-br from-primary/10 to-transparent p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{text.careerTitle}</p>
                <h2 className="mt-1 text-2xl font-black leading-tight text-foreground">{career.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-[13px] font-semibold">
                    {career.cluster && (
                        <span className="rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                            {text.clusterLabel}: {clusterLabelNumbered(t, { clusterName: career.cluster.name, clusterNumber: career.mmtCluster })}
                        </span>
                    )}
                    {career.code && <span className="rounded-full bg-muted px-3 py-1.5 font-mono text-foreground">{text.codeLabel}: {career.code}</span>}
                    {career.degreeType && <span className="rounded-full bg-muted px-3 py-1.5 text-foreground">{career.degreeType}{career.durationYears ? ` · ${career.durationYears} ${text.years}` : ""}</span>}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                    {token ? (
                        <button type="button" onClick={save} disabled={busy === "save"} aria-pressed={saved} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-bold transition cursor-pointer disabled:opacity-60 ${saved ? "bg-secondary/20 text-secondary border border-secondary/30" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                            {saved ? <BookmarkCheck className="h-5 w-5" aria-hidden /> : <Bookmark className="h-5 w-5" aria-hidden />}
                            {saved ? text.saved : text.save}
                        </button>
                    ) : (
                        <Link to={login} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground">
                            <Bookmark className="h-5 w-5" aria-hidden /> {text.saveLogin}
                        </Link>
                    )}
                    <Link to={`/info/${career.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-border px-5 py-3 font-bold text-foreground hover:border-primary">
                        <GraduationCap className="h-5 w-5" aria-hidden /> {text.fullPage}
                    </Link>
                </div>
                {message && <p className={`mt-3 text-sm font-semibold ${message.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`} role="status">{message.text}</p>}
            </div>

            <div className="border-t border-border p-6">
                <h3 className="flex items-center gap-2 font-black text-foreground"><ClipboardList className="h-5 w-5 text-primary" aria-hidden /> {text.whereTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text.whereHint}</p>
                {career.offerings?.length ? (
                    <ul className="mt-4 space-y-3">
                        {career.offerings.map((o) => (
                            <li key={o.id} className="rounded-2xl border border-border p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <Link to={o.universityId ? `/universities/${o.universityId}` : "#"} className="font-bold leading-snug text-foreground hover:text-primary">{o.university}</Link>
                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                                            {o.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{o.city}</span>}
                                            <span>{studyFormLabel(t, o.studyForm)}</span>
                                            <span>{languageLabel(t, o.language)}</span>
                                            {o.seats ? <span>{fillText(text.seats, { n: o.seats })}</span> : null}
                                            {career.code && <span className="font-mono">{text.codeLabel}: {career.code}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[15px]">{fee(o)}</div>
                                        {o.paymentType !== "ройгон" && o.tuitionFee != null && (
                                            <div className="text-[12px] text-muted-foreground">{paymentTypeLabel(t, o.paymentType)} · {text.perYear}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3">
                                    {token ? (
                                        <button type="button" onClick={() => addToPlan(o.id)} disabled={busy === o.id || planned.has(o.id)} className={`rounded-xl px-3 py-2 text-[13px] font-bold transition cursor-pointer disabled:cursor-default ${planned.has(o.id) ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:border-primary"}`}>
                                            {planned.has(o.id) ? text.inPlan : busy === o.id ? "…" : text.addPlan}
                                        </button>
                                    ) : (
                                        <Link to={login} className="text-[13px] font-bold text-primary">{text.addPlanLogin}</Link>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-3 text-sm text-muted-foreground">{text.noOfferings}</p>
                )}
                {token && planned.size > 0 && (
                    <Link to="/dashboard/plan" className="mt-4 inline-flex font-bold text-primary">{text.openPlan} →</Link>
                )}
            </div>
        </div>
    );
}
