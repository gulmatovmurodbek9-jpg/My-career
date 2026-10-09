import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, ClipboardCheck, GraduationCap, Loader2, ShieldCheck, Target, Users } from "lucide-react";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { readGuest, saveGuest } from "../../lib/classGuest";
import { classText, fill } from "../../lib/classText";
import { usePageMeta } from "../../lib/usePageMeta";

// /class/:code — хонанда ба синф ҳамроҳ мешавад: бо ҳисоб ё бе почта (танҳо ном).
export default function ClassJoin() {
    const { code: routeCode } = useParams();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const text = classText(i18n.language);
    const { isAuthenticated, user, token } = useAuthStore();
    const [code, setCode] = useState(String(routeCode || "").toUpperCase());
    const [info, setInfo] = useState(null);
    const [state, setState] = useState(routeCode ? "loading" : "code");
    const [name, setName] = useState(() => readGuest()?.displayName || "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    usePageMeta({ title: text.joinTitle, description: text.consent, path: routeCode ? `/class/${routeCode}` : "/class" });

    useEffect(() => {
        if (!routeCode) return undefined;
        let alive = true;
        setState("loading");
        axios.get(`${API}/classrooms/code/${encodeURIComponent(routeCode)}`)
            .then(async ({ data }) => {
                if (!alive) return;
                setInfo(data);
                // Аллакай дар ҳамин синф? — рост ба «тайёр».
                try {
                    const { data: joined } = await axios.get(`${API}/classrooms/joined`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (alive && Array.isArray(joined) && joined.some((room) => room.code === data.code)) {
                        setState("done");
                        return;
                    }
                } catch { /* мешавад ҳамроҳ шуд */ }
                if (alive) setState(data.full ? "full" : "form");
            })
            .catch(() => alive && setState("missing"));
        return () => { alive = false; };
    }, [routeCode, token]);

    const find = (event) => {
        event.preventDefault();
        const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (clean.length === 6) navigate(`/class/${clean}`);
        else setState("missing");
    };

    const join = async (event) => {
        event.preventDefault();
        if (busy) return;
        if (!isAuthenticated && name.trim().length < 2) return;
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(
                `${API}/classrooms/join`,
                { code: info.code, displayName: isAuthenticated ? undefined : name.trim() },
                { headers: token ? { Authorization: `Bearer ${token}` } : {} },
            );
            if (data.guest) saveGuest(data.guest);
            setInfo(data.classroom || info);
            setState("done");
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };

    const input = "w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground focus-ring";

    return (
        <div className="mx-auto max-w-lg px-4 pb-16 pt-8 sm:pt-12">
            <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                    <GraduationCap className="h-6 w-6" aria-hidden />
                </span>
                <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{text.joinTitle}</h1>
            </div>

            {(state === "code" || state === "missing") && (
                <form onSubmit={find} className="mt-6 space-y-3 rounded-3xl border border-border bg-card p-5">
                    <label className="block text-sm font-bold text-foreground" htmlFor="class-code">{text.codeLabel}</label>
                    <input
                        id="class-code"
                        value={code}
                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                        placeholder={text.codePlaceholder}
                        maxLength={8}
                        autoCapitalize="characters"
                        autoComplete="off"
                        className={`${input} text-center font-mono text-2xl font-black tracking-[0.3em]`}
                    />
                    {state === "missing" && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{text.notFound}</p>}
                    <button type="submit" className="btn-primary w-full !py-3.5">{text.codeFind} <ArrowRight className="h-5 w-5" aria-hidden /></button>
                </form>
            )}

            {state === "loading" && <div className="mt-6 h-48 animate-pulse rounded-3xl bg-muted/50" />}

            {info && state !== "missing" && state !== "loading" && (
                <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
                    <div className="bg-gradient-to-br from-primary/12 via-primary/[0.04] to-transparent p-5">
                        <div className="text-2xl font-black text-foreground">{info.name}</div>
                        <div className="mt-1 text-[15px] text-muted-foreground">{[info.school, info.city].filter(Boolean).join(" · ")}</div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[13px] font-semibold text-muted-foreground">
                            {info.teacher && <span className="rounded-full bg-background/80 px-3 py-1">{text.teacher}: <b className="text-foreground">{info.teacher}</b></span>}
                            <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-3 py-1"><Users className="h-3.5 w-3.5" aria-hidden /> {fill(text.students, { n: info.members })}</span>
                        </div>
                    </div>

                    {state === "full" && <p className="p-5 font-semibold text-amber-700 dark:text-amber-400">{text.full}</p>}

                    {state === "form" && (
                        <form onSubmit={join} className="space-y-4 p-5">
                            {isAuthenticated ? (
                                <p className="text-[15px] text-foreground">{fill(text.asUser, { name: user?.name || user?.email })}</p>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-foreground" htmlFor="class-name">{text.nameLabel}</label>
                                    <input
                                        id="class-name"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        placeholder={text.namePlaceholder}
                                        maxLength={60}
                                        autoComplete="name"
                                        className={`${input} mt-2`}
                                    />
                                    <p className="mt-1.5 text-[13px] text-muted-foreground">{text.nameHint}</p>
                                </div>
                            )}
                            <p className="flex items-start gap-2 rounded-2xl bg-muted/50 p-3 text-[14px] text-foreground">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> {text.consent}
                            </p>
                            {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
                            <button
                                type="submit"
                                disabled={busy || (!isAuthenticated && name.trim().length < 2)}
                                className="btn-primary w-full !py-4 text-base disabled:opacity-50"
                            >
                                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <>{text.join} <ArrowRight className="h-5 w-5" aria-hidden /></>}
                            </button>
                        </form>
                    )}

                    {state === "done" && (
                        <div className="space-y-4 p-5">
                            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                                <div>
                                    <p className="text-lg font-black text-foreground">{fill(text.joined, { name: info.name })}</p>
                                    <p className="mt-1 text-[14px] text-muted-foreground">{text.joinedHint}</p>
                                </div>
                            </div>
                            <Link to="/quiz" className="btn-primary w-full !py-4 text-base">
                                <ClipboardCheck className="h-5 w-5" aria-hidden /> {text.startQuiz}
                            </Link>
                            <Link to="/trial" className="btn-secondary flex w-full items-center justify-center gap-2 !py-3.5">
                                <Target className="h-5 w-5" aria-hidden /> {text.tryCareer}
                            </Link>
                            {!isAuthenticated && <p className="text-[13px] text-muted-foreground">{text.sameDevice}</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
