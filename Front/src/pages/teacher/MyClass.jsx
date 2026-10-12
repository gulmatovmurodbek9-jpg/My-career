import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, ClipboardCheck, GraduationCap, MessageCircle, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { MMT_CLUSTERS } from "../../lib/mmtClusters";
import { classText, fill } from "../../lib/classText";
import { usePageMeta } from "../../lib/usePageMeta";
import ClassChat from "../../components/ClassChat";

function Meter({ value, max, strong }) {
    return (
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${strong ? "bg-primary" : "bg-primary/35"}`} style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} />
        </div>
    );
}

// /class/my/:memberId — «Синфи ман»: ҳамсинфон чӣ интихоб карданд (бе номҳо) ва паёмҳо бо
// омӯзгор. Барои хонандаи бо ҳисоб ва бе почта (X-Class-Guest) якхела кор мекунад.
export default function MyClass() {
    const { memberId } = useParams();
    const { t, i18n } = useTranslation();
    const text = classText(i18n.language);
    const { token } = useAuthStore();
    const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);

    usePageMeta({ title: text.myClassTitle, description: text.privacyNote, path: `/class/my/${memberId}`, noIndex: true });

    useEffect(() => {
        let alive = true;
        axios.get(`${API}/classrooms/joined/${memberId}/overview`, { headers })
            .then(({ data: overview }) => alive && setData(overview))
            .catch(() => alive && setFailed(true));
        return () => { alive = false; };
    }, [memberId, headers]);

    const clusterName = useCallback((key) => {
        const cluster = MMT_CLUSTERS.find((c) => c.key === key);
        return cluster ? t(cluster.i18nKey, cluster.fallback) : "—";
    }, [t]);

    if (failed) {
        return (
            <div className="mx-auto max-w-lg px-4 py-16 text-center">
                <p className="text-muted-foreground">{text.notFoundClass}</p>
                <Link to="/class" className="mt-3 inline-flex font-bold text-primary">{text.codeLabel} →</Link>
            </div>
        );
    }
    if (!data) return <div className="mx-auto max-w-4xl px-4 py-10"><div className="h-72 animate-pulse rounded-3xl bg-muted/50" /></div>;

    const s = data.summary;
    const maxCluster = Math.max(1, ...Object.values(s.clusters));
    const maxCareer = Math.max(1, ...data.careers.map((c) => c.count));
    const card = "min-w-0 rounded-3xl border border-border bg-card p-5";

    return (
        <div className="mx-auto max-w-4xl space-y-5 px-4 pb-32 pt-6 sm:pt-10 md:pb-16" data-my-class>
            <Link to={token ? "/dashboard" : "/class"} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" aria-hidden /> {text.back}
            </Link>

            <header className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-primary/[0.04] to-transparent p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/25">
                        <GraduationCap className="h-6 w-6" aria-hidden />
                    </span>
                    <div className="min-w-0">
                        <div className="text-[12px] font-bold uppercase tracking-wide text-primary">{text.myClassTitle}</div>
                        <h1 className="truncate text-2xl font-black tracking-tight text-foreground sm:text-3xl">{data.classroom.name}</h1>
                        <p className="text-[14px] text-muted-foreground">{[data.classroom.school, data.classroom.district, data.classroom.city, data.classroom.schoolYear && fill(text.yearLabel, { y: data.classroom.schoolYear.replace("-", "–") }), data.classroom.teacher && `${text.teacher}: ${data.classroom.teacher}`].filter(Boolean).join(" · ")}</p>
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    {[[s.members, text.joinedCount, Users], [s.withQuiz, text.quizCount, ClipboardCheck], [s.withTrial, text.trialCount, Target]].map(([value, label, Icon]) => (
                        <div key={label} className="rounded-2xl bg-background/80 px-1 py-3">
                            <Icon className="mx-auto h-4 w-4 text-primary" aria-hidden />
                            <div className="mt-1 text-2xl font-black tabular-nums text-foreground">{value}</div>
                            <div className="text-[11px] font-semibold leading-tight text-muted-foreground">{label}</div>
                        </div>
                    ))}
                </div>
                <p className="mt-4 flex items-start gap-2 text-[13px] text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> {text.privacyNote}
                </p>
            </header>

            {!data.me.quiz && (
                <Link to="/quiz" className="flex items-center gap-3 rounded-3xl border border-primary/30 bg-primary/5 p-4 font-bold text-foreground hover:border-primary">
                    <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <span className="flex-1">{text.takeQuizToo}</span>
                    <ArrowRight className="h-5 w-5 text-primary" aria-hidden />
                </Link>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
                <section className={card}>
                    <h2 className="font-black text-foreground">{text.directions}</h2>
                    <div className="mt-3 space-y-2.5">
                        {MMT_CLUSTERS.map((cluster) => {
                            const mine = cluster.key === data.me.topCluster;
                            return (
                                <div key={cluster.key}>
                                    <div className="flex items-center justify-between gap-2 text-[13px]">
                                        <span className={mine ? "font-bold text-foreground" : "text-foreground"}>
                                            {clusterName(cluster.key)}
                                            {mine && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-primary-foreground">{text.yourDirection}</span>}
                                        </span>
                                        <b className="tabular-nums text-foreground">{fill(text.peopleN, { n: s.clusters[cluster.key] || 0 })}</b>
                                    </div>
                                    <Meter value={s.clusters[cluster.key] || 0} max={maxCluster} strong={mine} />
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className={card}>
                    <h2 className="font-black text-foreground">{text.popularCareers}</h2>
                    <p className="text-[12.5px] text-muted-foreground">{text.popularHint}</p>
                    {data.careers.length === 0 ? <p className="mt-3 text-[14px] text-muted-foreground">{text.noData}</p> : (
                        <ol className="mt-3 space-y-2.5">
                            {data.careers.map((career) => (
                                <li key={career.id} className="min-w-0">
                                    <div className="flex min-w-0 items-center gap-2 text-[13.5px]">
                                        <Link to={`/info/${career.id}`} className="min-w-0 flex-1 truncate font-semibold text-foreground hover:text-primary">{career.name}</Link>
                                        {career.mine && <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-black text-primary">{text.alsoYou}</span>}
                                        <b className="shrink-0 tabular-nums text-foreground">{career.count}</b>
                                    </div>
                                    <Meter value={career.count} max={maxCareer} strong={career.mine} />
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>

            {data.tried.length > 0 && (
                <section className={card}>
                    <h2 className="font-black text-foreground">{text.triedCareers}</h2>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {data.tried.map((career) => (
                            <li key={career.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2.5">
                                <span className="text-xl" aria-hidden>{career.fit >= career.students / 2 ? "😊" : "🤔"}</span>
                                <span className="min-w-0 flex-1">
                                    <Link to={`/trial/career/${career.id}`} className="block truncate font-semibold text-foreground hover:text-primary">{career.name}</Link>
                                    <span className="block text-[12px] text-muted-foreground">{fill(text.triedOf, { n: career.students, f: career.fit })}{career.mine ? ` · ${text.alsoYou}` : ""}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className={card} id="messages">
                <h2 className="mb-3 flex items-center gap-2 font-black text-foreground"><MessageCircle className="h-5 w-5 text-primary" aria-hidden /> {text.messagesTitle}</h2>
                <ClassChat
                    url={`${API}/classrooms/joined/${memberId}/messages`}
                    headers={headers}
                    me="student"
                    text={text}
                    otherLabel={data.classroom.teacher || text.teacher}
                    emptyText={text.noMessages}
                    placeholder={text.replyPlaceholder}
                />
            </section>
        </div>
    );
}
