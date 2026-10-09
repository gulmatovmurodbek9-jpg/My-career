import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, GraduationCap, KeyRound, School } from "lucide-react";
import { API } from "../lib/config";
import { useAuthStore } from "../store/authStore";
import { classText } from "../lib/classText";

// Дар «Панел»: синфе, ки хонанда дар он аст; барои омӯзгор — «Ҳуҷраи омӯзгор»;
// барои дигарон — пайвандҳои хурд «Рамзи синф доред?» ва «Шумо омӯзгор ҳастед?».
export default function ClassCard() {
    const { i18n } = useTranslation();
    const text = classText(i18n.language);
    const { token, user } = useAuthStore();
    const [classes, setClasses] = useState([]);
    const teacher = user?.role === "teacher" || user?.role === "admin";

    useEffect(() => {
        if (!token) return undefined;
        let alive = true;
        axios.get(`${API}/classrooms/joined`, { headers: { Authorization: `Bearer ${token}` } })
            .then(({ data }) => alive && setClasses(Array.isArray(data) ? data : []))
            .catch(() => {});
        return () => { alive = false; };
    }, [token]);

    const leave = async (room) => {
        if (!window.confirm(`${text.leave}: ${room.name}?`)) return;
        try {
            await axios.delete(`${API}/classrooms/joined/${room.memberId}`, { headers: { Authorization: `Bearer ${token}` } });
            setClasses((old) => old.filter((item) => item.memberId !== room.memberId));
        } catch { /* боз кӯшиш мекунад */ }
    };

    return (
        <div className="space-y-3">
            {teacher && (
                <Link to="/dashboard/teacher" className="group flex items-center gap-4 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 to-indigo-500/5 p-4 sm:p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md shadow-primary/30">
                        <School className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-lg font-black text-foreground">{text.teacherRoom}</span>
                        <span className="block truncate text-[13px] text-muted-foreground">{text.teacherIntro}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
            )}
            {classes.map((room) => (
                <div key={room.memberId} className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600"><GraduationCap className="h-5 w-5" aria-hidden /></span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{text.myClasses}</span>
                        <span className="block truncate font-black text-foreground">{room.name}{room.school ? ` · ${room.school}` : ""}</span>
                        {room.teacher && <span className="block truncate text-[13px] text-muted-foreground">{text.teacher}: {room.teacher}</span>}
                    </span>
                    <button type="button" onClick={() => leave(room)} className="shrink-0 text-[12px] font-bold text-muted-foreground hover:text-rose-600 cursor-pointer">{text.leave}</button>
                </div>
            ))}
            {!teacher && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-[13px] font-bold">
                    {classes.length === 0 && (
                        <Link to="/class" className="inline-flex items-center gap-1.5 text-primary hover:underline"><KeyRound className="h-4 w-4" aria-hidden /> {text.codeLabel}?</Link>
                    )}
                    <Link to="/dashboard/teacher" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"><School className="h-4 w-4" aria-hidden /> {text.requestTitle}</Link>
                </div>
            )}
        </div>
    );
}
