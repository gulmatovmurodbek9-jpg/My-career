import React, { useState } from "react";
import axios from "axios";
import { Loader2, LogOut, Plus, UserPlus, X } from "lucide-react";
import { API } from "../lib/config";
import { MMT_CLUSTERS } from "../lib/mmtClusters";
import { fill } from "../lib/classText";

const input = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus-ring";

// Омӯзгорони синф: роҳбари синф омӯзгори фанниро (масалан, технология) бо почта илова мекунад
// ва самти ӯро интихоб мекунад — он омӯзгор синфро бо филтри ҳамон самт мебинад.
export default function ClassTeachers({ room, text, auth, clusterName, onChange, onLeft }) {
    const owner = room.access === "owner";
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ email: "", subject: "", focus: "" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const set = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));

    const add = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            await axios.post(`${API}/classrooms/${room.id}/teachers`, form, auth);
            setForm({ email: "", subject: "", focus: "" });
            setOpen(false);
            onChange();
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };
    const remove = async (teacher) => {
        const self = !owner;
        if (!window.confirm(self ? text.leaveClassConfirm : fill(text.removeTeacherConfirm, { name: teacher.name }))) return;
        try {
            await axios.delete(`${API}/classrooms/${room.id}/teachers/${teacher.id}`, auth);
            if (self) onLeft(); else onChange();
        } catch {
            setError(text.error);
        }
    };

    return (
        <section className="rounded-3xl border border-border bg-card p-5 print:hidden" data-class-teachers>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-black text-foreground">{text.teachersTitle}</h2>
                {owner && !open && (
                    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary hover:bg-primary/15 cursor-pointer">
                        <UserPlus className="h-4 w-4" aria-hidden /> {text.addTeacher}
                    </button>
                )}
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">{text.teachersHint}</p>

            <ul className="mt-3 flex flex-wrap gap-2">
                <li className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-3 py-2 text-[13.5px]">
                    <span className="font-bold text-foreground">{room.ownerName || text.teacher}</span>
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-primary-foreground">{text.homeroomTeacher}</span>
                </li>
                {(room.teachers || []).map((teacher) => (
                    <li key={teacher.id} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2 text-[13.5px]">
                        <span className="font-bold text-foreground">{teacher.name || teacher.email}</span>
                        {teacher.subject && <span className="text-muted-foreground">{teacher.subject}</span>}
                        {teacher.focus && <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-bold text-primary">{clusterName(teacher.focus)}</span>}
                        {owner && (
                            <button type="button" onClick={() => remove(teacher)} aria-label={text.remove} className="rounded-lg p-0.5 text-muted-foreground hover:text-rose-600 cursor-pointer"><X className="h-4 w-4" aria-hidden /></button>
                        )}
                    </li>
                ))}
            </ul>

            {!owner && (
                <button type="button" onClick={() => remove({ id: room.myId })} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground hover:text-rose-600 cursor-pointer">
                    <LogOut className="h-4 w-4" aria-hidden /> {text.leaveClass}
                </button>
            )}

            {owner && open && (
                <form onSubmit={add} className="mt-4 grid gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:grid-cols-3">
                    <label className="block sm:col-span-3">
                        <span className="mb-1 block text-[13px] font-bold text-foreground">{text.teacherEmail}</span>
                        <input type="email" required value={form.email} onChange={set("email")} placeholder="omuzgor@mail.tj" className={input} data-teacher-email />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-[13px] font-bold text-foreground">{text.teacherSubject}</span>
                        <input maxLength={60} value={form.subject} onChange={set("subject")} placeholder={text.teacherSubjectPlaceholder} className={input} />
                    </label>
                    <label className="block sm:col-span-2">
                        <span className="mb-1 block text-[13px] font-bold text-foreground">{text.teacherFocus}</span>
                        <select value={form.focus} onChange={set("focus")} className={input} data-teacher-focus>
                            <option value="">{text.allDirections}</option>
                            {MMT_CLUSTERS.map((cluster) => <option key={cluster.key} value={cluster.key}>{clusterName(cluster.key)}</option>)}
                        </select>
                    </label>
                    {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 sm:col-span-3">{error}</p>}
                    <div className="flex gap-2 sm:col-span-3">
                        <button type="submit" disabled={busy || !form.email.includes("@")} className="btn-primary !py-2.5 disabled:opacity-50">
                            {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <><Plus className="h-4 w-4" aria-hidden /> {text.addTeacherButton}</>}
                        </button>
                        <button type="button" onClick={() => setOpen(false)} className="btn-secondary !py-2.5">✕</button>
                    </div>
                </form>
            )}
            {!open && error && <p className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        </section>
    );
}
