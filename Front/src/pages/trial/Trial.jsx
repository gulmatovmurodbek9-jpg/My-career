import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Briefcase, CheckCircle2, Clock, Frown, Lightbulb, Sparkles, Info, Laugh, ListChecks, MapPin, Meh, RotateCcw, ShieldAlert, Smile, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import TrialIcon from "../../components/TrialIcon";
import { API } from "../../lib/config";
import { usePageMeta } from "../../lib/usePageMeta";
import { fillText, langCode, trialText } from "../../lib/trialText";

// «Як рӯз дар ихтисос»: муқаддима → 3 вазифа (ҷавоб → шарҳ → «шавқовар буд?») →
// ҳақиқати касб ва баҳо → хулоса. Ҷавобҳои дуруст танҳо баъди ҷавоб аз сервер меоянд.
const MOOD = [Frown, Meh, Smile, Laugh];

function RatingScale({ count, value, onChange, labels, icons }) {
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

function TaskBody({ task }) {
    return (
        <>
            {task.prompt && <p className="text-foreground">{task.prompt}</p>}
            {task.quote && (
                <blockquote className="mt-3 whitespace-pre-line rounded-2xl border-l-4 border-primary bg-primary/5 px-4 py-3 text-[15px] italic text-foreground">
                    {task.quote}
                </blockquote>
            )}
            {task.code && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-900 px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-100 sm:text-sm">{task.code}</pre>
            )}
            {task.table && (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/60">
                            <tr>{task.table.head.map((cell) => <th key={cell} className="px-3 py-2 text-left font-bold text-foreground">{cell}</th>)}</tr>
                        </thead>
                        <tbody>
                            {task.table.rows.map((row) => (
                                <tr key={row[0]} className="border-t border-border">
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
function AnswerInput({ task, value, onChange, result, text }) {
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

const ready = (task, value) => {
    if (task.kind === "number") return value !== undefined && value !== "" && Number.isFinite(Number(value));
    if (task.kind === "choice") return !!value;
    if (task.kind === "multi") return (value || []).length === task.pick;
    return (value || []).length === task.options.length;
};

export default function Trial() {
    const { family } = useParams();
    const [search] = useSearchParams();
    const location = useLocation();
    const careerId = search.get("career");
    const careerName = location.state?.careerName;
    const { i18n } = useTranslation();
    const lang = langCode(i18n.language);
    const text = trialText(lang);

    const [scenario, setScenario] = useState(null);
    const [others, setOthers] = useState([]);
    const [error, setError] = useState(false);
    const [stage, setStage] = useState("intro"); // intro | task | end | result
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [checks, setChecks] = useState({});
    const [liked, setLiked] = useState({});
    const [confBefore, setConfBefore] = useState(null);
    const [confAfter, setConfAfter] = useState(null);
    const [rating, setRating] = useState(null);
    const [busy, setBusy] = useState(false);
    const [summary, setSummary] = useState(null);
    const [reload, setReload] = useState(0);

    usePageMeta({
        title: scenario ? `${text.name}: ${scenario.role}` : text.name,
        description: scenario?.intro || text.hubIntro,
        path: `/trial/${family}`,
    });

    const reset = () => {
        setStage("intro");
        setIndex(0);
        setAnswers({});
        setChecks({});
        setLiked({});
        setConfBefore(null);
        setConfAfter(null);
        setRating(null);
        setSummary(null);
    };

    useEffect(reset, [family]);

    useEffect(() => {
        let alive = true;
        setError(false);
        axios.get(`${API}/trial/${family}`, { params: { lang } })
            .then((res) => alive && setScenario(res.data))
            .catch(() => alive && setError(true));
        axios.get(`${API}/trial`, { params: { lang } })
            .then((res) => alive && setOthers(res.data.scenarios || []))
            .catch(() => { });
        return () => { alive = false; };
    }, [family, lang, reload]);

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [stage, index]);

    const task = scenario?.tasks?.[index];
    const otherScenarios = useMemo(() => others.filter((item) => item.family !== family), [others, family]);

    const check = async () => {
        if (!task || busy) return;
        setBusy(true);
        try {
            const { data } = await axios.post(`${API}/trial/${family}/check`, { taskId: task.id, answer: answers[task.id], lang });
            setChecks((prev) => ({ ...prev, [task.id]: data }));
        } catch {
            setError(true);
        } finally {
            setBusy(false);
        }
    };

    const like = (value) => {
        setLiked((prev) => ({ ...prev, [task.id]: value }));
        if (index < scenario.tasks.length - 1) setIndex(index + 1);
        else setStage("end");
    };

    const finish = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const { data } = await axios.post(`${API}/trial/${family}/finish`, {
                careerId,
                lang,
                rating,
                confBefore,
                confAfter,
                tasks: scenario.tasks.map((item) => ({ id: item.id, answer: answers[item.id], liked: liked[item.id] === true })),
            });
            setSummary(data);
            setStage("result");
        } catch {
            setError(true);
        } finally {
            setBusy(false);
        }
    };

    if (error && !scenario) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16">
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">{text.loadError}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <button type="button" onClick={() => setReload((n) => n + 1)} className="btn-primary !px-5 !py-3">
                        <RotateCcw className="h-4 w-4" aria-hidden /> {text.retry}
                    </button>
                    <Link to="/trial" className="font-bold text-primary">{text.allScenarios}</Link>
                </div>
            </div>
        );
    }
    if (!scenario) {
        return <div className="mx-auto max-w-2xl px-4 py-16"><div className="h-64 animate-pulse rounded-3xl bg-muted/50" /></div>;
    }

    const progress = stage === "intro" ? 0 : stage === "task" ? (index + (checks[task?.id] ? 0.5 : 0)) / 3 : 1;

    return (
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:pt-10">
            <div className="flex items-center justify-between gap-3 text-sm">
                <Link to="/trial" className="font-semibold text-muted-foreground hover:text-primary">← {text.name}</Link>
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" aria-hidden /> {fillText(text.minutes, { n: scenario.minutes })}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress * 100}%` }} />
            </div>

            {error && <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{text.loadError}</p>}

            {stage === "intro" && (
                <section className="mt-6">
                    <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                        <div className="bg-gradient-to-br from-primary/10 via-primary/[0.03] to-transparent p-6 sm:p-8">
                            <div className="flex items-center gap-4">
                                <TrialIcon family={scenario.family} size="xl" />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{text.name}</p>
                                    <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">{scenario.role}</h1>
                                </div>
                            </div>
                            {careerName && (
                                <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                                    <span className="shrink-0">{text.forCareer}:</span> <b className="truncate text-foreground">{careerName}</b>
                                </p>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2 text-[13px] font-semibold text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5"><MapPin className="h-3.5 w-3.5 text-primary" aria-hidden /> {scenario.place}</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5"><Clock className="h-3.5 w-3.5 text-primary" aria-hidden /> {fillText(text.minutes, { n: scenario.minutes })}</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5"><ListChecks className="h-3.5 w-3.5 text-primary" aria-hidden /> {text.tasksCount}</span>
                            </div>
                            <p className="mt-5 text-lg leading-relaxed text-foreground">{scenario.intro}</p>
                        </div>
                        <div className="space-y-3 border-t border-border px-6 py-4 sm:px-8">
                            {scenario.disclaimer && (
                                <p className="flex items-start gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {scenario.disclaimer}
                                </p>
                            )}
                            <p className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {text.simplified}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 rounded-3xl border border-border bg-card p-5">
                        <p className="font-bold text-foreground">{text.confBefore}</p>
                        <div className="mt-3"><RatingScale count={5} value={confBefore} onChange={setConfBefore} labels={text.confScale} /></div>
                    </div>
                    <button
                        type="button"
                        disabled={!confBefore}
                        onClick={() => setStage("task")}
                        className="btn-primary mt-6 w-full !py-4 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        {text.start} <ArrowRight className="h-5 w-5" aria-hidden />
                    </button>
                </section>
            )}

            {stage === "task" && task && (
                <section className="mt-6" key={task.id}>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
                        <span className="text-muted-foreground">{fillText(text.task, { n: index + 1 })}</span>
                        <span className={`rounded-full px-2.5 py-0.5 ${task.skill === "soft" ? "bg-violet-500/10 text-violet-600 dark:text-violet-300" : "bg-sky-500/10 text-sky-600 dark:text-sky-300"}`}>
                            {task.skill === "soft" ? text.soft : text.hard}
                        </span>
                    </div>
                    <h2 className="mt-2 text-2xl font-black text-foreground">{task.title}</h2>
                    <div className="mt-4 rounded-3xl border border-border bg-card p-5">
                        <TaskBody task={task} />
                        <AnswerInput
                            task={task}
                            value={answers[task.id]}
                            onChange={(value) => setAnswers((prev) => ({ ...prev, [task.id]: value }))}
                            result={checks[task.id]}
                            text={text}
                        />
                    </div>

                    {!checks[task.id] && (
                        <button
                            type="button"
                            disabled={!ready(task, answers[task.id]) || busy}
                            onClick={check}
                            className="btn-primary mt-5 w-full !py-4 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {text.check}
                        </button>
                    )}

                    {checks[task.id] && (() => {
                        const result = checks[task.id];
                        const ids = Array.isArray(result.answer) ? result.answer : [];
                        return (
                            <div className="mt-5 space-y-4" aria-live="polite">
                                <div className={`flex items-start gap-4 rounded-3xl border p-5 ${result.solved ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
                                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${result.solved ? "bg-emerald-500" : "bg-amber-500"}`}>
                                        {result.solved ? <CheckCircle2 className="h-6 w-6" aria-hidden /> : <Lightbulb className="h-6 w-6" aria-hidden />}
                                    </span>
                                    <div className="min-w-0">
                                        <p className={`text-lg font-black ${result.solved ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                                            {(result.solved ? text.praise : text.encourage)[index % 3][0]}
                                        </p>
                                        <p className="mt-0.5 text-[15px] text-foreground">
                                            {task.kind === "order" && result.solved && !result.perfect
                                                ? text.rightOrder
                                                : fillText((result.solved ? text.praise : text.encourage)[index % 3][1], { role: scenario.role })}
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
                                                <li key={step} className="flex items-start gap-3">
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{i + 1}</span>
                                                    <span className="text-[15px] leading-relaxed text-foreground">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                    {result.realLife && (
                                        <div className="flex items-start gap-3 border-t border-border bg-muted/40 px-5 py-4">
                                            <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                                            <p className="text-[15px] leading-relaxed text-foreground">
                                                <b>{text.realLifeTitle}</b> {result.realLife}
                                            </p>
                                        </div>
                                    )}
                                    {result.skillName && (
                                        <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3 text-sm text-muted-foreground">
                                            <Sparkles className="h-4 w-4 text-amber-500" aria-hidden /> {text.skillUsed}
                                            <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">{result.skillName}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="rounded-3xl border border-border bg-card p-5">
                                    <p className="font-bold text-foreground">{text.liked}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => like(true)} className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-3 font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 cursor-pointer">
                                            <ThumbsUp className="h-5 w-5" aria-hidden /> {text.likeYes}
                                        </button>
                                        <button type="button" onClick={() => like(false)} className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-3 font-bold text-foreground hover:bg-muted cursor-pointer">
                                            <ThumbsDown className="h-5 w-5" aria-hidden /> {text.likeNo}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </section>
            )}

            {stage === "end" && (
                <section className="mt-6 space-y-5">
                    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5">
                        <h2 className="text-xl font-black text-foreground">{text.realityTitle}</h2>
                        <ul className="mt-3 space-y-2">
                            {scenario.reality.map((line) => (
                                <li key={line} className="flex gap-2 text-[15px] text-foreground"><span aria-hidden>•</span><span>{line}</span></li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-3xl border border-border bg-card p-5">
                        <p className="font-bold text-foreground">{text.ratingQ}</p>
                        <div className="mt-3"><RatingScale count={4} value={rating} onChange={setRating} labels={text.rating} icons={MOOD} /></div>
                    </div>
                    <div className="rounded-3xl border border-border bg-card p-5">
                        <p className="font-bold text-foreground">{text.confAfter}</p>
                        <div className="mt-3"><RatingScale count={5} value={confAfter} onChange={setConfAfter} labels={text.confScale} /></div>
                    </div>
                    <button
                        type="button"
                        disabled={!rating || !confAfter || busy}
                        onClick={finish}
                        className="btn-primary w-full !py-4 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        {text.seeResult} <ArrowRight className="h-5 w-5" aria-hidden />
                    </button>
                </section>
            )}

            {stage === "result" && summary && (
                <section className="mt-6 space-y-5">
                    <div className="rounded-3xl bg-gradient-to-br from-primary to-indigo-600 p-6 text-white shadow-xl shadow-primary/20">
                        <p className="text-sm font-semibold opacity-80">{text.resultTitle} · {summary.role}</p>
                        <p className="mt-1 text-2xl font-black sm:text-3xl">{fillText(text.solved, { n: summary.solved })}</p>
                        {summary.confBefore && summary.confAfter && (
                            <p className="mt-3 text-[15px]">
                                <b>{fillText(text.confChange, { a: summary.confBefore, b: summary.confAfter })}</b>
                                <span className="block opacity-90">
                                    {summary.confAfter > summary.confBefore ? text.confUp : summary.confAfter < summary.confBefore ? text.confDown : text.confSame}
                                </span>
                            </p>
                        )}
                    </div>

                    {summary.tasks.map((item) => (
                        <div key={item.id} className="rounded-3xl border border-border bg-card p-5">
                            <div className="flex items-center gap-2">
                                {item.solved ? <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden /> : <XCircle className="h-5 w-5 text-rose-500" aria-hidden />}
                                <span className="font-bold text-foreground">{item.title}</span>
                                {item.liked
                                    ? <ThumbsUp className="ml-auto h-5 w-5 text-emerald-500" aria-label={text.likeYes} />
                                    : <ThumbsDown className="ml-auto h-5 w-5 text-muted-foreground" aria-label={text.likeNo} />}
                            </div>
                            <p className="mt-2 text-[15px] text-foreground">{text.verdict[item.verdict]}</p>
                            {item.verdict !== "other" && item.related.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm text-muted-foreground">{text.relatedTitle}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {item.related.map((career) => (
                                            <Link key={career.id} to={`/info/${career.id}`} className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-sm font-semibold text-foreground hover:border-primary">
                                                {career.name} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="rounded-3xl border border-border bg-card p-5">
                        <p className="font-bold text-foreground">{summary.suggestOther ? text.suggestOther : text.others}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {otherScenarios.map((item) => (
                                <Link key={item.family} to={`/trial/${item.family}`} className="flex items-center gap-3 rounded-2xl border border-border p-3 hover:border-primary">
                                    <TrialIcon family={item.family} size="md" />
                                    <span className="min-w-0">
                                        <span className="block font-bold text-foreground">{item.role}</span>
                                        <span className="block text-xs text-muted-foreground">{item.familyName}</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button type="button" onClick={reset} className="btn-secondary flex flex-1 items-center justify-center gap-2 !py-3.5">
                            <RotateCcw className="h-4 w-4" aria-hidden /> {text.again}
                        </button>
                        {careerId ? (
                            <Link to={`/info/${careerId}`} className="btn-primary flex-1 !py-3.5">{text.backToCareer}</Link>
                        ) : (
                            <Link to="/trial" className="btn-primary flex-1 !py-3.5">{text.allScenarios}</Link>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
