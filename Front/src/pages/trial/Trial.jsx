import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Bot, CheckCircle2, Clock, Info, ListChecks, MapPin, RotateCcw, ShieldAlert, ThumbsDown, ThumbsUp, Users, Wrench, XCircle } from "lucide-react";
import TrialIcon from "../../components/TrialIcon";
import ShareResult from "../../components/ShareResult";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { usePageMeta } from "../../lib/usePageMeta";
import { familyForCareer, fillText, langCode, plural, trialText } from "../../lib/trialText";
import { AnswerInput, CareerBlock, DayTimeline, FeedbackPanel, MOOD, ProsCons, RatingScale, TaskBody, answerReady } from "./TrialParts";

// «Як рӯз дар ихтисос»: муқаддима (рӯзи корӣ) → вазифаҳо (ҷавоб → шарҳ → «шавқовар буд?») →
// плюс/минус ва баҳо → хулоса (захира, кластер, дар куҷо хондан). Ду навъ:
//   /trial/:family            — 5 сенарияи дастнавис (3 вазифа);
//   /trial/career/:careerId   — сенарияи худи ихтисос (8 вазифа). Агар ҳанӯз тайёр набошад —
//                               ба сенарияи наздиктарини оила мегузарем.
// Ҷавобҳои дуруст танҳо баъди ҷавоб аз сервер меоянд.
export default function Trial() {
    const { family, careerId: careerParam } = useParams();
    const [search] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const careerMode = !!careerParam;
    const careerId = careerParam || search.get("career");
    const careerName = location.state?.careerName;
    const { i18n } = useTranslation();
    const lang = langCode(i18n.language);
    const text = trialText(lang);
    const base = careerMode ? `${API}/trial/career/${careerParam}` : `${API}/trial/${family}`;

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
        title: scenario ? `${text.name}: ${scenario.career?.name || scenario.role}` : text.name,
        description: scenario?.intro || text.hubIntro,
        path: location.pathname,
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

    useEffect(reset, [family, careerParam]);

    useEffect(() => {
        let alive = true;
        setError(false);
        axios.get(base, { params: { lang } })
            .then((res) => alive && setScenario(res.data))
            .catch(async (err) => {
                if (!alive) return;
                // Сенарияи ихтисос ҳанӯз нест — наздиктарини оила (бо ҳамон ихтисос дар хотир).
                if (careerMode && err.response?.status === 404) {
                    try {
                        const { data } = await axios.get(`${API}/careers/${careerParam}`);
                        const nearest = familyForCareer(data);
                        if (nearest) {
                            navigate(`/trial/${nearest}?career=${careerParam}`, { replace: true, state: { careerName: data.nameTranslated || data.name } });
                            return;
                        }
                    } catch { /* поён */ }
                }
                setError(true);
            });
        if (!careerMode) {
            axios.get(`${API}/trial`, { params: { lang } })
                .then((res) => alive && setOthers(res.data.scenarios || []))
                .catch(() => { });
        }
        return () => { alive = false; };
    }, [base, lang, reload, careerMode, careerParam, navigate]);

    useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [stage, index]);

    const tasks = scenario?.tasks || [];
    const total = tasks.length;
    const task = tasks[index];
    const otherScenarios = useMemo(() => others.filter((item) => item.family !== family), [others, family]);

    const check = async () => {
        if (!task || busy) return;
        setBusy(true);
        try {
            const { data } = await axios.post(`${base}/check`, { taskId: task.id, answer: answers[task.id], lang });
            setChecks((prev) => ({ ...prev, [task.id]: data }));
            setError(false);
        } catch {
            setError(true);
        } finally {
            setBusy(false);
        }
    };

    const like = (value) => {
        setLiked((prev) => ({ ...prev, [task.id]: value }));
        if (index < total - 1) setIndex(index + 1);
        else setStage("end");
    };

    const finish = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const { data } = await axios.post(`${base}/finish`, {
                careerId,
                lang,
                rating,
                confBefore,
                confAfter,
                tasks: tasks.map((item) => ({ id: item.id, answer: answers[item.id], liked: liked[item.id] === true })),
            }, {
                // Корбари воридшуда: натиҷа ба ӯ навишта мешавад (масалан, барои омӯзгори синф).
                headers: useAuthStore.getState().token ? { Authorization: `Bearer ${useAuthStore.getState().token}` } : {},
            });
            setSummary(data);
            setStage("result");
            setError(false);
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

    const progress = stage === "intro" ? 0 : stage === "task" ? (index + (checks[task?.id] ? 0.5 : 0)) / total : 1;
    const iconFamily = careerMode ? familyForCareer(scenario.career) : scenario.family;
    const shownCareerName = scenario.career?.name || careerName;
    const hardCount = tasks.filter((item) => item.skill !== "soft").length;
    const softCount = total - hardCount;

    return (
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:pt-10">
            <div className="flex items-center justify-between gap-3 text-sm">
                <Link to={careerId ? `/info/${careerId}` : "/trial"} className="font-semibold text-muted-foreground hover:text-primary">
                    ← {careerId ? text.backToCareer : text.name}
                </Link>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" aria-hidden /> {fillText(text.minutes, { n: scenario.minutes })}
                </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress * 100}%` }} />
            </div>

            {error && <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{text.loadError}</p>}

            {stage === "intro" && (
                <section className="mt-6 space-y-5">
                    <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                        <div className="bg-gradient-to-br from-primary/10 via-primary/[0.03] to-transparent p-6 sm:p-8">
                            <div className="flex items-center gap-4">
                                <TrialIcon family={iconFamily} size="xl" />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{text.name}</p>
                                    <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">{scenario.role}</h1>
                                </div>
                            </div>
                            {shownCareerName && (
                                <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                                    <span className="shrink-0">{text.forCareer}:</span> <b className="truncate text-foreground">{shownCareerName}</b>
                                </p>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2 text-[13px] font-semibold text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5"><MapPin className="h-3.5 w-3.5 text-primary" aria-hidden /> {scenario.place}</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5"><Clock className="h-3.5 w-3.5 text-primary" aria-hidden /> {fillText(text.minutes, { n: scenario.minutes })}</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5"><Wrench className="h-3.5 w-3.5 text-primary" aria-hidden /> {plural(text.hardCount, hardCount, lang)}</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5"><Users className="h-3.5 w-3.5 text-primary" aria-hidden /> {plural(text.softCount, softCount, lang)}</span>
                            </div>
                            <p className="mt-5 text-lg leading-relaxed text-foreground">{scenario.intro}</p>
                        </div>
                        <div className="space-y-3 border-t border-border px-6 py-4 sm:px-8">
                            {scenario.disclaimer && (
                                <p className="flex items-start gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {scenario.disclaimer}
                                </p>
                            )}
                            {scenario.generated && (
                                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <Bot className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {text.aiNote}
                                </p>
                            )}
                            <p className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {text.simplified}
                            </p>
                        </div>
                    </div>

                    <DayTimeline day={scenario.day} text={text} />

                    <div className="rounded-3xl border border-border bg-card p-5">
                        <p className="font-bold text-foreground">{text.confBefore}</p>
                        <div className="mt-3"><RatingScale count={5} value={confBefore} onChange={setConfBefore} labels={text.confScale} /></div>
                    </div>
                    <p className="text-center text-sm font-bold text-muted-foreground">{fillText(text.quickInfo, { n: total, m: scenario.minutes })}</p>
                    <button
                        type="button"
                        disabled={!confBefore}
                        onClick={() => setStage("task")}
                        className="btn-primary w-full !py-4 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        {text.start} <ArrowRight className="h-5 w-5" aria-hidden />
                    </button>
                </section>
            )}

            {stage === "task" && task && (
                <section className="mt-6" key={task.id}>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
                        <span className="text-muted-foreground">{fillText(text.task, { n: index + 1, total })}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 ${task.skill === "soft" ? "bg-violet-500/10 text-violet-600 dark:text-violet-300" : "bg-sky-500/10 text-sky-600 dark:text-sky-300"}`}>
                            {task.skill === "soft" ? <Users className="h-3.5 w-3.5" aria-hidden /> : <Wrench className="h-3.5 w-3.5" aria-hidden />}
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
                            disabled={!answerReady(task, answers[task.id]) || busy}
                            onClick={check}
                            className="btn-primary mt-5 w-full !py-4 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {text.check}
                        </button>
                    )}

                    {checks[task.id] && (
                        <div className="mt-5 space-y-4" aria-live="polite">
                            <FeedbackPanel task={task} result={checks[task.id]} index={index} text={text} />
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
                    )}
                </section>
            )}

            {stage === "end" && (
                <section className="mt-6 space-y-5">
                    {scenario.pros?.length ? (
                        <>
                            <h2 className="text-2xl font-black text-foreground">{text.realityTitle}</h2>
                            <ProsCons scenario={scenario} text={text} />
                        </>
                    ) : (
                        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5">
                            <h2 className="text-xl font-black text-foreground">{text.realityTitle}</h2>
                            <ul className="mt-3 space-y-2">
                                {(scenario.reality || []).map((line) => (
                                    <li key={line} className="flex gap-2 text-[15px] text-foreground"><span aria-hidden>•</span><span>{line}</span></li>
                                ))}
                            </ul>
                        </div>
                    )}
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

            {stage === "result" && summary && (() => {
                const hard = summary.tasks.filter((item) => item.skill !== "soft");
                const soft = summary.tasks.filter((item) => item.skill === "soft");
                const count = (list, key) => list.filter((item) => item[key]).length;
                const hardLike = hard.length ? count(hard, "liked") / hard.length : 0;
                const softLike = soft.length ? count(soft, "liked") / soft.length : 0;
                const leaning = Math.abs(hardLike - softLike) < 0.2 ? text.leanBoth : hardLike > softLike ? text.leanHard : text.leanSoft;
                const career = summary.career;
                return (
                    <section className="mt-6 space-y-5">
                        <div className="rounded-3xl bg-gradient-to-br from-primary to-indigo-600 p-6 text-white shadow-xl shadow-primary/20">
                            {/* Баҳои калон: писанд омад ва баҳо хуб — мувофиқ; вагарна — касби дигарро санҷед. */}
                            <div className="mb-4 flex items-center gap-4 rounded-2xl bg-white/15 p-4">
                                <img src={summary.suggestOther ? "/emoji/1f914.png" : "/emoji/1f60a.png"} alt="" aria-hidden width="64" height="64" className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
                                <p className="text-xl font-black leading-tight sm:text-2xl">{summary.suggestOther ? text.fitOther : text.fitGood}</p>
                            </div>
                            <ShareResult
                                variant="light"
                                className="mb-4 w-full"
                                card={{
                                    kind: "trial",
                                    cluster: summary.career?.mmtCluster ? `c${summary.career.mmtCluster}` : undefined,
                                    career: summary.career?.name || summary.role,
                                    fit: !summary.suggestOther,
                                    solved: summary.solved,
                                    total: summary.total,
                                    confBefore: summary.confBefore,
                                    confAfter: summary.confAfter,
                                }}
                            />
                            <p className="text-sm font-semibold opacity-80">{text.resultTitle} · {summary.role}</p>
                            <p className="mt-1 text-2xl font-black sm:text-3xl">{fillText(text.solved, { n: summary.solved, total: summary.total })}</p>
                            {summary.confBefore && summary.confAfter && (
                                <p className="mt-3 text-[15px]">
                                    <b>{fillText(text.confChange, { a: summary.confBefore, b: summary.confAfter })}</b>
                                    <span className="block opacity-90">
                                        {summary.confAfter > summary.confBefore ? text.confUp : summary.confAfter < summary.confBefore ? text.confDown : text.confSame}
                                    </span>
                                </p>
                            )}
                        </div>

                        {soft.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {[[text.hard, hard, Wrench], [text.soft, soft, Users]].map(([label, list, Icon]) => (
                                    <div key={label} className="rounded-3xl border border-border bg-card p-4">
                                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Icon className="h-3.5 w-3.5" aria-hidden /> {label}</p>
                                        <p className="mt-2 text-2xl font-black text-foreground">{count(list, "solved")}/{list.length}</p>
                                        <p className="text-[13px] text-muted-foreground">{fillText(text.likedOf, { n: count(list, "liked"), total: list.length })}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {soft.length > 0 && <p className="rounded-2xl bg-primary/5 px-4 py-3 text-[15px] font-semibold text-foreground">{leaning}</p>}

                        <div className="rounded-3xl border border-border bg-card p-2">
                            {summary.tasks.map((item) => (
                                <div key={item.id} className="flex items-start gap-3 rounded-2xl p-3">
                                    {item.solved ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden />}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-foreground">{item.title}</p>
                                        <p className="text-[14px] text-muted-foreground">{text.verdict[item.verdict]}</p>
                                        {item.verdict !== "other" && item.related?.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {item.related.map((related) => (
                                                    <Link key={related.id} to={`/info/${related.id}`} className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/40 px-3 py-1 text-[13px] font-semibold text-foreground hover:border-primary">
                                                        {related.name} <ArrowRight className="h-3 w-3" aria-hidden />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {item.liked
                                        ? <ThumbsUp className="h-5 w-5 shrink-0 text-emerald-500" aria-label={text.likeYes} />
                                        : <ThumbsDown className="h-5 w-5 shrink-0 text-muted-foreground" aria-label={text.likeNo} />}
                                </div>
                            ))}
                        </div>

                        {career && <CareerBlock career={career} text={text} />}

                        {summary.suggestOther && <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[15px] text-foreground">{careerMode ? text.suggestOtherCareer : text.suggestOther}</p>}

                        {!careerMode && otherScenarios.length > 0 && (
                            <div className="rounded-3xl border border-border bg-card p-5">
                                <p className="font-bold text-foreground">{text.others}</p>
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
                        )}

                        {/* Касби дигар: ба рӯйхати ихтисосҳо бо ҷустуҷӯ — дарҳол дигарашро санҷад. */}
                        <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 to-indigo-500/5 p-5">
                            <p className="text-[15px] font-semibold text-foreground">{text.tryOtherHint}</p>
                            <Link to="/trial" className="btn-primary mt-3 w-full !py-4 text-base">
                                <ListChecks className="h-5 w-5" aria-hidden /> {text.tryOtherCareers} <ArrowRight className="h-5 w-5" aria-hidden />
                            </Link>
                        </div>
                        <button type="button" onClick={reset} className="btn-secondary flex w-full items-center justify-center gap-2 !py-3.5">
                            <RotateCcw className="h-4 w-4" aria-hidden /> {text.again}
                        </button>
                    </section>
                );
            })()}
        </div>
    );
}
