import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import QRCode from "qrcode";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
    Archive, ArrowLeft, ArrowRight, Check, ChevronDown, ClipboardCheck, Copy, Download, Eye, EyeOff,
    Printer, RefreshCw, Send, Target, Trash2, Users,
} from "lucide-react";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { MMT_CLUSTERS, MMT_MAX } from "../../lib/mmtClusters";
import { classLink, classText, fill, initials } from "../../lib/classText";
import { usePageMeta } from "../../lib/usePageMeta";
import { useToast } from "../../components/toast/ToastProvider";

const CLUSTER_COLORS = { c1: "bg-sky-500", c2: "bg-amber-500", c3: "bg-violet-500", c4: "bg-emerald-500", c5: "bg-rose-500" };

function CopyButton({ value, label, text }) {
    const [done, setDone] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1800);
        } catch {
            window.prompt(label, value);
        }
    };
    return (
        <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-bold text-foreground hover:border-primary cursor-pointer">
            {done ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {done ? text.copied : label}
        </button>
    );
}

function SharePanel({ room, text }) {
    const link = classLink(room.code);
    const message = fill(text.telegramText, { link, code: room.code });
    const [qr, setQr] = useState("");
    useEffect(() => {
        QRCode.toDataURL(link, { width: 480, margin: 1, errorCorrectionLevel: "M" }).then(setQr).catch(() => setQr(""));
    }, [link]);

    return (
        <section className="grid gap-4 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:grid-cols-[1fr_auto] print:hidden">
            <div className="min-w-0 space-y-4">
                <h2 className="text-lg font-black text-foreground">{text.share}</h2>
                <div>
                    <div className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{text.codeLabel}</div>
                    <div className="font-mono text-4xl font-black tracking-[0.25em] text-primary sm:text-5xl">{room.code}</div>
                </div>
                <div>
                    <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{text.link}</div>
                    <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded-xl bg-background px-3 py-2 text-[13px] text-foreground">{link}</code>
                        <CopyButton value={link} label={text.copy} text={text} />
                    </div>
                </div>
                <div>
                    <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{text.telegram}</div>
                    <p className="rounded-xl bg-background px-3 py-2 text-[13px] text-foreground">{message}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <CopyButton value={message} label={text.copy} text={text} />
                        <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message.replace(link, "").trim())}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-[13px] font-bold text-white hover:bg-sky-600"
                        >
                            <Send className="h-4 w-4" aria-hidden /> {text.sendTelegram}
                        </a>
                    </div>
                </div>
            </div>
            {qr && (
                <figure className="mx-auto w-48 text-center sm:w-56">
                    <a href={qr} download={`sinf-${room.code}.png`} title={text.qr}>
                        <img src={qr} alt={text.qr} className="w-full rounded-2xl border border-border bg-white p-2" />
                    </a>
                    <figcaption className="mt-1.5 text-[12px] text-muted-foreground">{text.qr}</figcaption>
                </figure>
            )}
        </section>
    );
}

function Bar({ value, max, tone = "bg-primary" }) {
    return (
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} />
        </div>
    );
}

function StudentRow({ member, text, clusterName, hideNames, onRemove }) {
    const [open, setOpen] = useState(false);
    const name = hideNames ? initials(member.displayName) : member.displayName;
    const top = member.quiz?.topCluster;
    const scores = member.quiz?.scores || {};
    return (
        <li className="rounded-2xl border border-border bg-card">
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-3 p-3.5 text-left cursor-pointer">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${top ? CLUSTER_COLORS[top] : "bg-muted-foreground/40"}`}>
                    {initials(member.displayName).replace(/\.\s?/g, "").slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                        <span className="truncate font-bold text-foreground">{name}</span>
                        {member.kind === "guest" && <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{text.guest}</span>}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                        <span className={member.quiz ? "font-semibold text-foreground" : ""}>
                            <ClipboardCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                            {member.quiz ? clusterName(top) : "—"}
                        </span>
                        <span>
                            <Target className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                            {member.trials.length ? member.trials.map((trial) => (trial.fit ? "😊" : "🤔")).join("") : "—"}
                        </span>
                        <span>{new Date(member.lastActive).toLocaleDateString()}</span>
                    </span>
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {open && (
                <div className="space-y-4 border-t border-border p-4 text-sm">
                    {member.quiz ? (
                        <div className="space-y-2">
                            {MMT_CLUSTERS.map((cluster) => {
                                const pct = Math.round(((Number(scores[cluster.key]) || 0) / MMT_MAX) * 100);
                                return (
                                    <div key={cluster.key}>
                                        <div className="flex justify-between text-[13px]">
                                            <span className={cluster.key === top ? "font-bold text-foreground" : "text-muted-foreground"}>{clusterName(cluster.key)}</span>
                                            <span className="font-bold tabular-nums text-foreground">{pct}%</span>
                                        </div>
                                        <Bar value={pct} max={100} tone={CLUSTER_COLORS[cluster.key]} />
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-muted-foreground">{text.noQuiz}</p>}

                    {member.quiz?.topCareers?.length > 0 && (
                        <div>
                            <div className="mb-1.5 font-bold text-foreground">{text.topCareers}</div>
                            <div className="flex flex-wrap gap-2">
                                {member.quiz.topCareers.map((career) => (
                                    <Link key={career.id} to={`/info/${career.id}`} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[13px] font-semibold text-foreground hover:border-primary">{career.name}</Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {member.trials.length > 0 && (
                        <div>
                            <div className="mb-1.5 font-bold text-foreground">{text.tried}</div>
                            <ul className="space-y-1.5">
                                {member.trials.map((trial, index) => (
                                    <li key={`${trial.careerId}-${index}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-muted/40 px-3 py-2">
                                        <span className="text-lg" aria-hidden>{trial.fit ? "😊" : "🤔"}</span>
                                        <span className="min-w-0 flex-1 font-semibold text-foreground">{trial.careerName || "—"}</span>
                                        <span className="text-[12px] text-muted-foreground">{fill(text.solved, { n: trial.solved, t: trial.total })} · {fill(text.liked, { n: trial.liked, t: trial.total })}</span>
                                        {trial.confBefore && trial.confAfter && <span className="text-[12px] font-bold text-foreground">{trial.confBefore} → {trial.confAfter}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {member.plan > 0 && <p className="text-[13px] text-muted-foreground">{fill(text.plan, { n: member.plan })}</p>}

                    <button type="button" onClick={() => onRemove(member)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-rose-600 hover:underline cursor-pointer print:hidden">
                        <Trash2 className="h-4 w-4" aria-hidden /> {text.remove}
                    </button>
                </div>
            )}
        </li>
    );
}

// /dashboard/teacher/:id — саҳифаи синф барои омӯзгор.
export default function TeacherClass() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const text = classText(i18n.language);
    const { token } = useAuthStore();
    const toast = useToast();
    const [room, setRoom] = useState(null);
    const [failed, setFailed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all");
    const [hideNames, setHideNames] = useState(false);
    const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    usePageMeta({ title: room?.name || text.teacherRoom, description: text.teacherIntro, path: `/dashboard/teacher/${id}`, noIndex: true });

    const load = useCallback(() => {
        setLoading(true);
        axios.get(`${API}/classrooms/${id}`, auth)
            .then(({ data }) => { setRoom(data); setFailed(false); })
            .catch(() => setFailed(true))
            .finally(() => setLoading(false));
    }, [id, auth]);
    useEffect(() => {
        load();
        // Дар синф хонандагон айни ҳол тест мегузаранд — рақамҳо худкор нав мешаванд.
        const timer = setInterval(load, 60000);
        return () => clearInterval(timer);
    }, [load]);

    const clusterName = useCallback((key) => {
        const cluster = MMT_CLUSTERS.find((c) => c.key === key);
        return cluster ? t(cluster.i18nKey, cluster.fallback) : "—";
    }, [t]);

    if (failed && !room) return <p className="py-16 text-center text-muted-foreground">{text.notFoundClass} <Link to="/dashboard/teacher" className="font-bold text-primary">{text.back}</Link></p>;
    if (!room) return <div className="h-64 animate-pulse rounded-3xl bg-muted/50" />;

    const s = room.summary;
    const members = room.members.filter((member) => (filter === "noQuiz" ? !member.quiz : filter === "noTrial" ? !member.trials.length : true));
    const maxCluster = Math.max(1, ...Object.values(s.clusters));
    const reminder = fill(text.reminderText, { link: classLink(room.code) });

    const downloadCsv = async () => {
        try {
            const { data } = await axios.get(`${API}/classrooms/${id}/export.csv`, { ...auth, responseType: "blob" });
            const url = URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `sinf-${room.code}.csv`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        } catch {
            toast.error?.(text.error);
        }
    };
    const toggleArchive = async () => {
        try {
            const { data } = await axios.patch(`${API}/classrooms/${id}`, { archived: !room.archived }, auth);
            setRoom((old) => ({ ...old, archived: data.archived }));
        } catch {
            toast.error?.(text.error);
        }
    };
    const removeMember = async (member) => {
        if (!window.confirm(fill(text.removeConfirm, { name: member.displayName }))) return;
        try {
            await axios.delete(`${API}/classrooms/${id}/members/${member.id}`, auth);
            load();
        } catch {
            toast.error?.(text.error);
        }
    };

    const tool = "inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-bold text-foreground hover:border-primary cursor-pointer";

    return (
        <div className="space-y-5 pb-16">
            <div className="print:hidden">
                <button type="button" onClick={() => navigate("/dashboard/teacher")} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline cursor-pointer">
                    <ArrowLeft className="h-4 w-4" aria-hidden /> {text.back}
                </button>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-3xl font-black tracking-tight text-foreground">{room.name} {room.archived && <span className="align-middle text-sm font-bold text-muted-foreground">· {text.archived}</span>}</h1>
                    <p className="text-[15px] text-muted-foreground">{[room.school, room.city, room.grade ? fill(text.gradeLabel, { n: room.grade }) : null].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                    <button type="button" onClick={load} className={tool}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden /> {text.refresh}</button>
                    <button type="button" onClick={() => setHideNames((v) => !v)} className={tool}>
                        {hideNames ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />} {hideNames ? text.showNames : text.hideNames}
                    </button>
                    <button type="button" onClick={downloadCsv} className={tool}><Download className="h-4 w-4" aria-hidden /> {text.csv}</button>
                    <button type="button" onClick={() => window.print()} className={tool}><Printer className="h-4 w-4" aria-hidden /> {text.print}</button>
                    <button type="button" onClick={toggleArchive} className={tool}><Archive className="h-4 w-4" aria-hidden /> {room.archived ? text.unarchive : text.archive}</button>
                </div>
            </div>
            {hideNames && <p className="text-[13px] font-semibold text-amber-700 dark:text-amber-400">{text.demoNote}</p>}

            <SharePanel room={room} text={text} />

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="rounded-3xl border border-border bg-card p-5">
                    <h2 className="font-black text-foreground">{text.progress}</h2>
                    <div className="mt-3 space-y-3">
                        {[[s.members, text.joinedCount, s.members], [s.withQuiz, text.quizCount, s.members], [s.withTrial, text.trialCount, s.members]].map(([value, label, max]) => (
                            <div key={label}>
                                <div className="flex justify-between text-[14px]"><span className="text-muted-foreground">{label}</span><b className="tabular-nums text-foreground">{value}{label !== text.joinedCount && max ? ` / ${max}` : ""}</b></div>
                                <Bar value={value} max={max || 1} />
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-3xl border border-border bg-card p-5">
                    <h2 className="font-black text-foreground">{text.directions}</h2>
                    <div className="mt-3 space-y-2.5">
                        {MMT_CLUSTERS.map((cluster) => (
                            <div key={cluster.key}>
                                <div className="flex justify-between text-[13px]"><span className="text-foreground">{clusterName(cluster.key)}</span><b className="tabular-nums text-foreground">{s.clusters[cluster.key]}</b></div>
                                <Bar value={s.clusters[cluster.key]} max={maxCluster} tone={CLUSTER_COLORS[cluster.key]} />
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-3xl border border-border bg-card p-5">
                    <h2 className="font-black text-foreground">{text.confidence}</h2>
                    {s.confBefore ? (
                        <>
                            <div className="mt-3 flex items-end gap-3 text-5xl font-black tabular-nums">
                                <span className="text-muted-foreground">{s.confBefore}</span>
                                <ArrowRight className="mb-2 h-7 w-7 text-primary" aria-hidden />
                                <span className="text-primary">{s.confAfter}</span>
                            </div>
                            <div className="mt-1 flex gap-6 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground"><span>{text.before}</span><span>{text.after}</span></div>
                        </>
                    ) : <div className="mt-3 text-4xl font-black text-muted-foreground">—</div>}
                    {s.notForMe > 0 && <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-[13px] font-semibold text-foreground">🤔 {fill(text.notFit, { n: s.notForMe })}</p>}
                </section>
            </div>

            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                    <div className="flex flex-wrap gap-1.5 rounded-2xl bg-muted/50 p-1">
                        {[["all", text.all, room.members.length], ["noQuiz", text.noQuiz, room.members.filter((m) => !m.quiz).length], ["noTrial", text.noTrial, room.members.filter((m) => !m.trials.length).length]].map(([key, label, count]) => (
                            <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key}
                                className={`rounded-xl px-3 py-2 text-[13px] font-bold cursor-pointer ${filter === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                                {label} <span className="tabular-nums opacity-70">{count}</span>
                            </button>
                        ))}
                    </div>
                    {filter !== "all" && members.length > 0 && <CopyButton value={reminder} label={text.copyReminder} text={text} />}
                </div>
                {room.members.length === 0 ? (
                    <p className="flex items-center gap-2 rounded-3xl border border-dashed border-border p-6 text-muted-foreground"><Users className="h-5 w-5" aria-hidden /> {text.noStudents}</p>
                ) : members.length === 0 ? (
                    <p className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground">{text.empty}</p>
                ) : (
                    <ul className="grid gap-2.5 md:grid-cols-2">
                        {members.map((member) => (
                            <StudentRow key={member.id} member={member} text={text} clusterName={clusterName} hideNames={hideNames} onRemove={removeMember} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
