import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, GraduationCap, Loader2, Plus, School, XCircle } from "lucide-react";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { classText } from "../../lib/classText";
import { usePageMeta } from "../../lib/usePageMeta";

const input = "w-full rounded-xl border border-border bg-background px-3.5 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-ring";

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-foreground">{label}</span>
            {children}
        </label>
    );
}

// Корбари оддӣ: «Шумо омӯзгор ҳастед?» → дархост ба админ.
function TeacherRequest({ text, token, status, onSent }) {
    const [form, setForm] = useState({ school: "", subject: "", city: "", phone: "" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const set = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));

    const send = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(`${API}/classrooms/teacher-request`, form, { headers: { Authorization: `Bearer ${token}` } });
            onSent(data.status);
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };

    if (status === "pending") {
        return (
            <div className="flex items-start gap-3 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
                <Clock className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" aria-hidden />
                <p className="text-[15px] font-semibold text-foreground">{text.pending}</p>
            </div>
        );
    }

    return (
        <form onSubmit={send} className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div>
                <h2 className="text-xl font-black text-foreground">{text.requestTitle}</h2>
                <p className="mt-1 text-[15px] text-muted-foreground">{text.requestText}</p>
            </div>
            {status === "rejected" && (
                <p className="flex items-start gap-2 rounded-2xl bg-rose-500/10 p-3 text-[14px] font-semibold text-rose-700 dark:text-rose-300">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {text.rejected}
                </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Field label={text.school}><input required minLength={2} maxLength={120} value={form.school} onChange={set("school")} placeholder={text.schoolPlaceholder} className={input} /></Field>
                </div>
                <Field label={text.subject}><input maxLength={80} value={form.subject} onChange={set("subject")} className={input} /></Field>
                <Field label={text.city}><input maxLength={60} value={form.city} onChange={set("city")} className={input} /></Field>
                <Field label={text.phone}><input maxLength={30} inputMode="tel" value={form.phone} onChange={set("phone")} className={input} /></Field>
            </div>
            {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
            <button type="submit" disabled={busy || form.school.trim().length < 2} className="btn-primary w-full !py-3.5 sm:w-auto disabled:opacity-50">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <>{text.send} <ArrowRight className="h-4 w-4" aria-hidden /></>}
            </button>
        </form>
    );
}

function NewClass({ text, token, onCreated }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", school: "", city: "", grade: "11" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const set = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));

    const create = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(`${API}/classrooms`, form, { headers: { Authorization: `Bearer ${token}` } });
            onCreated(data);
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)} className="btn-primary !py-3.5">
                <Plus className="h-5 w-5" aria-hidden /> {text.newClass}
            </button>
        );
    }
    return (
        <form onSubmit={create} className="space-y-4 rounded-3xl border border-primary/25 bg-card p-5">
            <h2 className="text-lg font-black text-foreground">{text.newClass}</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                <Field label={text.className}><input required autoFocus maxLength={60} value={form.name} onChange={set("name")} placeholder={text.classNamePlaceholder} className={input} /></Field>
                <Field label={text.grade}>
                    <select value={form.grade} onChange={set("grade")} className={input}>
                        {["9", "10", "11", ""].map((value) => <option key={value} value={value}>{value || "—"}</option>)}
                    </select>
                </Field>
                <Field label={text.school}><input maxLength={120} value={form.school} onChange={set("school")} placeholder={text.schoolPlaceholder} className={input} /></Field>
                <Field label={text.city}><input maxLength={60} value={form.city} onChange={set("city")} className={input} /></Field>
            </div>
            {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={busy || !form.name.trim()} className="btn-primary !py-3 disabled:opacity-50">
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : text.create}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary !py-3">✕</button>
            </div>
        </form>
    );
}

// /dashboard/teacher — синфҳои омӯзгор; корбари оддӣ — дархости «Ман омӯзгор ҳастам».
export default function TeacherHome() {
    const { i18n } = useTranslation();
    const text = classText(i18n.language);
    const { token, refreshProfile } = useAuthStore();
    const [status, setStatus] = useState(null);
    const [classes, setClasses] = useState(null);

    usePageMeta({ title: text.teacherRoom, description: text.teacherIntro, path: "/dashboard/teacher", noIndex: true });

    useEffect(() => {
        let alive = true;
        axios.get(`${API}/classrooms/teacher-request`, { headers: { Authorization: `Bearer ${token}` } })
            .then(({ data }) => {
                if (!alive) return;
                setStatus(data.status);
                // Нақш дар сервер иваз шуда бошад — профилро нав мекунем (меню ва тугмаҳо).
                if (data.status === "approved") refreshProfile?.();
            })
            .catch(() => alive && setStatus("error"));
        return () => { alive = false; };
    }, [token, refreshProfile]);

    useEffect(() => {
        if (status !== "approved") return undefined;
        let alive = true;
        axios.get(`${API}/classrooms/mine`, { headers: { Authorization: `Bearer ${token}` } })
            .then(({ data }) => alive && setClasses(data))
            .catch(() => alive && setClasses([]));
        return () => { alive = false; };
    }, [status, token]);

    return (
        <div className="space-y-6 pb-16">
            <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-primary/25">
                    <School className="h-6 w-6" aria-hidden />
                </span>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{text.teacherRoom}</h1>
                    <p className="mt-1 max-w-2xl text-[15px] text-muted-foreground">{text.teacherIntro}</p>
                </div>
            </div>

            {status === null && <div className="h-40 animate-pulse rounded-3xl bg-muted/50" />}
            {status && status !== "approved" && status !== "error" && (
                <TeacherRequest text={text} token={token} status={status} onSent={setStatus} />
            )}
            {status === "error" && <p className="text-rose-600">{text.error}</p>}

            {status === "approved" && (
                <>
                    <NewClass text={text} token={token} onCreated={(room) => setClasses((old) => [{ ...room, summary: { members: 0, withQuiz: 0, withTrial: 0 } }, ...(old || [])])} />
                    {classes === null ? (
                        <div className="h-32 animate-pulse rounded-3xl bg-muted/50" />
                    ) : classes.length === 0 ? (
                        <p className="rounded-3xl border border-dashed border-border p-6 text-center text-muted-foreground">{text.noClasses}</p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {classes.map((room) => {
                                const s = room.summary || {};
                                const pct = s.members ? Math.round((s.withQuiz / s.members) * 100) : 0;
                                return (
                                    <Link key={room.id} to={`/dashboard/teacher/${room.id}`} className={`group rounded-3xl border bg-card p-5 transition-colors hover:border-primary ${room.archived ? "border-dashed border-border opacity-70" : "border-border"}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                                                    <span className="truncate text-xl font-black text-foreground">{room.name}</span>
                                                </div>
                                                <div className="mt-0.5 truncate text-[13px] text-muted-foreground">{[room.school, room.city].filter(Boolean).join(" · ") || " "}</div>
                                            </div>
                                            <span className="shrink-0 rounded-xl bg-muted px-2.5 py-1 font-mono text-sm font-black tracking-widest text-foreground">{room.code}</span>
                                        </div>
                                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                            {[[s.members, text.joinedCount], [s.withQuiz, text.quizCount], [s.withTrial, text.trialCount]].map(([value, label]) => (
                                                <div key={label} className="rounded-2xl bg-muted/40 px-1 py-2">
                                                    <div className="text-xl font-black tabular-nums text-foreground">{value ?? 0}</div>
                                                    <div className="text-[11px] font-semibold leading-tight text-muted-foreground">{label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-[13px] font-bold text-primary">
                                            <span>{room.archived ? text.archived : `${pct}% ${text.quizCount}`}</span>
                                            <span className="inline-flex items-center gap-1">{text.open} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

