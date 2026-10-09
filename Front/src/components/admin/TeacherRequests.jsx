import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Check, GraduationCap, School, X } from "lucide-react";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";

// Админ: дархостҳои «Ман омӯзгор ҳастам» (Тасдиқ / Рад) ва рӯйхати синфҳо.
const TEXT = {
    tj: { title: "Омӯзгорон ва синфҳо", requests: "Дархостҳо", none: "Дархости нав нест.", approve: "Тасдиқ", reject: "Рад", approved: "Тасдиқ шуд", rejected: "Рад шуд", pending: "Интизор", classes: "Синфҳо", noClasses: "Ҳанӯз синф нест.", members: "хонанда" },
    ru: { title: "Учителя и классы", requests: "Заявки", none: "Новых заявок нет.", approve: "Подтвердить", reject: "Отклонить", approved: "Подтверждено", rejected: "Отклонено", pending: "Ожидает", classes: "Классы", noClasses: "Классов пока нет.", members: "учеников" },
    en: { title: "Teachers and classes", requests: "Requests", none: "No new requests.", approve: "Approve", reject: "Reject", approved: "Approved", rejected: "Rejected", pending: "Pending", classes: "Classes", noClasses: "No classes yet.", members: "students" },
};

export default function TeacherRequests() {
    const { i18n } = useTranslation();
    const text = TEXT[(i18n.language || "tj").slice(0, 2)] || TEXT.tj;
    const token = useAuthStore((state) => state.token);
    const [requests, setRequests] = useState([]);
    const [classes, setClasses] = useState([]);
    const [busy, setBusy] = useState(null);
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const load = useCallback(() => {
        if (!token) return;
        const headers = { headers: { Authorization: `Bearer ${token}` } };
        axios.get(`${API}/classrooms/admin/requests`, headers).then(({ data }) => setRequests(data || [])).catch(() => {});
        axios.get(`${API}/classrooms/admin/all`, headers).then(({ data }) => setClasses(data || [])).catch(() => {});
    }, [token]);
    useEffect(load, [load]);

    const decide = async (request, decision) => {
        setBusy(request.id);
        try {
            await axios.post(`${API}/classrooms/admin/requests/${request.id}/${decision}`, null, auth);
            load();
        } finally {
            setBusy(null);
        }
    };

    const pending = requests.filter((request) => request.status === "pending");
    const decided = requests.filter((request) => request.status !== "pending").slice(0, 8);

    return (
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h2 className="flex items-center gap-2 text-lg font-black text-foreground"><GraduationCap className="h-5 w-5 text-primary" aria-hidden /> {text.title}</h2>

            <div>
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">{text.requests} {pending.length > 0 && <span className="ml-1 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] text-white">{pending.length}</span>}</h3>
                {pending.length === 0 && <p className="mt-2 text-[14px] text-muted-foreground">{text.none}</p>}
                <ul className="mt-2 space-y-2">
                    {[...pending, ...decided].map((request) => (
                        <li key={request.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-foreground">{request.name || request.email} <span className="font-normal text-muted-foreground">· {request.email}</span></div>
                                <div className="text-[13px] text-muted-foreground">
                                    <School className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                                    {[request.school, request.subject, request.city, request.phone].filter(Boolean).join(" · ")}
                                </div>
                            </div>
                            {request.status === "pending" ? (
                                <div className="flex gap-2">
                                    <button type="button" disabled={busy === request.id} onClick={() => decide(request, "approve")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[13px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"><Check className="h-4 w-4" aria-hidden /> {text.approve}</button>
                                    <button type="button" disabled={busy === request.id} onClick={() => decide(request, "reject")} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[13px] font-bold text-foreground hover:border-rose-500 disabled:opacity-50 cursor-pointer"><X className="h-4 w-4" aria-hidden /> {text.reject}</button>
                                </div>
                            ) : (
                                <span className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${request.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                                    {request.status === "approved" ? text.approved : text.rejected}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">{text.classes} ({classes.length})</h3>
                {classes.length === 0 ? <p className="mt-2 text-[14px] text-muted-foreground">{text.noClasses}</p> : (
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                        {classes.slice(0, 20).map((room) => (
                            <li key={room.id} className="rounded-xl bg-muted/40 px-3 py-2 text-[13px]">
                                <span className="font-bold text-foreground">{room.name}</span> <span className="font-mono text-muted-foreground">{room.code}</span>
                                <span className="block truncate text-muted-foreground">{[room.school, room.teacher].filter(Boolean).join(" · ")} · {room.members} {text.members}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
