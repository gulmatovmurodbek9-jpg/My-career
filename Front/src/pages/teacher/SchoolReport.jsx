import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { MMT_CLUSTERS } from "../../lib/mmtClusters";
import { usePageMeta } from "../../lib/usePageMeta";

// /dashboard/school — «Ҳисоботи мактаб»: омори якҷояи синфҳои интихобшуда (роҳбар ё ёрирасон)
// барои директор ва шӯъбаи маориф; чоп ё «Захира ҳамчун PDF».
const TEXT = {
    tj: {
        title: "Ҳисоботи мактаб", lead: "Синфҳоро интихоб кунед — омори якҷоя барои директор ва шӯъбаи маориф. Барои PDF «Чоп»-ро пахш кунед ва «Захира ҳамчун PDF»-ро интихоб кунед.",
        back: "Ҳуҷраи омӯзгор", print: "Чоп / PDF", classes: "Синфҳо", none: "Ҳанӯз синф нест.",
        reportTitle: "Ҳисобот оид ба касбинтихобкунии хонандагон", date: "Сана", source: "Манбаъ: платформаи «Ихтисоси ман» (ikhtisosiman.qobus.tj)",
        students: "хонанда", tested: "тест гузаштанд", tried: "касб санҷиданд", confidence: "боварӣ пеш → баъд",
        table: "Аз рӯи синфҳо", cls: "Синф", members: "Хонандагон", quiz: "Тест", trial: "Санҷиш", top: "Самти асосӣ",
        directions: "Тақсимоти самтҳо", careers: "Ихтисосҳои маъмул", people: "нафар", signature: "Директори мактаб", teacher: "Омӯзгори масъул",
        conclusion: "Хулоса", conclusionText: "{{t}} аз {{m}} хонанда ({{p}}%) тести касбинтихобкуниро гузаштанд. Самти маъмултарин — «{{d}}».",
    },
    ru: {
        title: "Отчёт школы", lead: "Выберите классы — сводная статистика для директора и отдела образования. Для PDF нажмите «Печать» и выберите «Сохранить как PDF».",
        back: "Кабинет учителя", print: "Печать / PDF", classes: "Классы", none: "Классов пока нет.",
        reportTitle: "Отчёт о профориентации учащихся", date: "Дата", source: "Источник: платформа «Ихтисоси ман» (ikhtisosiman.qobus.tj)",
        students: "учеников", tested: "прошли тест", tried: "пробовали профессии", confidence: "уверенность до → после",
        table: "По классам", cls: "Класс", members: "Учеников", quiz: "Тест", trial: "Проба", top: "Основное направление",
        directions: "Распределение направлений", careers: "Популярные специальности", people: "чел.", signature: "Директор школы", teacher: "Ответственный учитель",
        conclusion: "Вывод", conclusionText: "{{t}} из {{m}} учеников ({{p}}%) прошли профориентационный тест. Самое частое направление — «{{d}}».",
    },
    en: {
        title: "School report", lead: "Pick classes — a combined report for the principal and the education department. For a PDF press “Print” and choose “Save as PDF”.",
        back: "Teacher room", print: "Print / PDF", classes: "Classes", none: "No classes yet.",
        reportTitle: "Student career guidance report", date: "Date", source: "Source: “Ikhtisosi man” platform (ikhtisosiman.qobus.tj)",
        students: "students", tested: "took the test", tried: "tried a career", confidence: "confidence before → after",
        table: "By class", cls: "Class", members: "Students", quiz: "Test", trial: "Try-out", top: "Main direction",
        directions: "Directions", careers: "Popular specialties", people: "people", signature: "School principal", teacher: "Responsible teacher",
        conclusion: "Conclusion", conclusionText: "{{t}} of {{m}} students ({{p}}%) took the career test. The most common direction is “{{d}}”.",
    },
};
const fill = (t, v) => String(t).replace(/\{\{(\w+)\}\}/g, (_, k) => v?.[k] ?? "");

export default function SchoolReport() {
    const { t, i18n } = useTranslation();
    const lang = ["tj", "ru", "en"].includes((i18n.language || "tj").slice(0, 2)) ? (i18n.language || "tj").slice(0, 2) : "tj";
    const text = TEXT[lang];
    const { token, user } = useAuthStore();
    const [classes, setClasses] = useState(null);
    const [picked, setPicked] = useState(new Set());
    usePageMeta({ title: text.title, description: text.lead, path: "/dashboard/school", noIndex: true });

    useEffect(() => {
        axios.get(`${API}/classrooms/mine`, { headers: { Authorization: `Bearer ${token}` } })
            .then(({ data }) => {
                setClasses(data);
                // Пешфарз: синфҳои фаъоли мактаби аввал.
                const school = data.find((c) => !c.archived)?.school;
                setPicked(new Set(data.filter((c) => !c.archived && c.school === school).map((c) => c.id)));
            })
            .catch(() => setClasses([]));
    }, [token]);

    const clusterName = (key) => { const c = MMT_CLUSTERS.find((x) => x.key === key); return c ? t(c.i18nKey, c.fallback) : "—"; };
    const report = useMemo(() => {
        const list = (classes || []).filter((c) => picked.has(c.id));
        const sum = (f) => list.reduce((s, c) => s + (Number(f(c.summary || {})) || 0), 0);
        const members = sum((s) => s.members);
        const clusters = Object.fromEntries(MMT_CLUSTERS.map((c) => [c.key, sum((s) => s.clusters?.[c.key])]));
        const pairedTotal = sum((s) => s.paired);
        const weighted = (field) => (pairedTotal ? Math.round((list.reduce((s, c) => s + (Number(c.summary?.[field]) || 0) * (Number(c.summary?.paired) || 0), 0) / pairedTotal) * 10) / 10 : null);
        const careers = new Map();
        list.forEach((c) => (c.summary?.topCareers || []).forEach((k) => {
            const e = careers.get(k.id) || { ...k, count: 0 };
            e.count += k.count;
            careers.set(k.id, e);
        }));
        const topCluster = Object.entries(clusters).sort((a, b) => b[1] - a[1])[0];
        return {
            list, members, withQuiz: sum((s) => s.withQuiz), withTrial: sum((s) => s.withTrial), clusters,
            confBefore: weighted("confBefore"), confAfter: weighted("confAfter"),
            careers: [...careers.values()].sort((a, b) => b.count - a.count).slice(0, 10),
            topCluster: topCluster?.[1] > 0 ? topCluster[0] : null,
        };
    }, [classes, picked]);

    const schools = [...new Set(report.list.map((c) => c.school).filter(Boolean))].join(", ");
    const places = [...new Set(report.list.map((c) => [c.district, c.city].filter(Boolean).join(", ")).filter(Boolean))].join("; ");
    const maxCluster = Math.max(1, ...Object.values(report.clusters));
    const pct = report.members ? Math.round((report.withQuiz / report.members) * 100) : 0;
    const toggle = (id) => setPicked((old) => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });

    return (
        <div className="space-y-5 pb-16" data-school-report>
            {/* Чоп: танҳо варақи ҳисобот — менюҳо, тугмаҳо ва заминаи торики саҳифа намоён нестанд. */}
            <style>{`@media print {
                @page { size: A4; margin: 14mm; }
                html, body { background: #fff !important; }
                body * { visibility: hidden !important; }
                [data-report-sheet], [data-report-sheet] * { visibility: visible !important; }
                [data-report-sheet] { position: absolute; left: 0; top: 0; width: 100%; }
            }`}</style>
            <div className="print:hidden">
                <Link to="/dashboard/teacher" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> {text.back}</Link>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">{text.title}</h1>
                        <p className="mt-1 max-w-2xl text-[15px] text-muted-foreground">{text.lead}</p>
                    </div>
                    <button type="button" onClick={() => window.print()} disabled={!report.list.length} className="btn-primary !py-3 disabled:opacity-50"><Printer className="h-5 w-5" aria-hidden /> {text.print}</button>
                </div>
                <div className="mt-4 rounded-3xl border border-border bg-card p-4">
                    <div className="mb-2 text-[13px] font-black uppercase tracking-wide text-muted-foreground">{text.classes}</div>
                    {classes === null ? <div className="h-10 animate-pulse rounded-xl bg-muted/50" /> : classes.length === 0 ? <p className="text-muted-foreground">{text.none}</p> : (
                        <div className="flex flex-wrap gap-2">
                            {classes.map((c) => (
                                <label key={c.id} className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[14px] font-bold ${picked.has(c.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground"}`}>
                                    <input type="checkbox" checked={picked.has(c.id)} onChange={() => toggle(c.id)} className="accent-primary" />
                                    {c.name}{c.school ? ` · ${c.school}` : ""}{c.archived ? " (бойгонӣ)" : ""}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {report.list.length > 0 && (
                <article className="space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8 print:rounded-none print:border-0 print:p-0" data-report-sheet>
                    <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                        <div>
                            <div className="flex items-center gap-2 text-[13px] font-black uppercase tracking-wide text-primary"><FileText className="h-4 w-4" aria-hidden /> {text.reportTitle}</div>
                            <h2 className="mt-1 text-2xl font-black text-foreground">{schools || "—"}</h2>
                            {places && <p className="text-[14px] text-muted-foreground">{places}</p>}
                        </div>
                        <div className="text-right text-[13px] text-muted-foreground">
                            <div>{text.date}: <b className="text-foreground">{new Date().toLocaleDateString()}</b></div>
                            {report.list[0]?.schoolYear && <div>{report.list[0].schoolYear.replace("-", "–")}</div>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[[report.members, text.students], [`${report.withQuiz} (${pct}%)`, text.tested], [report.withTrial, text.tried], [report.confBefore ? `${report.confBefore} → ${report.confAfter}` : "—", text.confidence]].map(([value, label]) => (
                            <div key={label} className="rounded-2xl bg-muted/40 p-4 text-center print:border print:border-gray-300">
                                <div className="text-2xl font-black tabular-nums text-foreground">{value}</div>
                                <div className="text-[12px] font-semibold text-muted-foreground">{label}</div>
                            </div>
                        ))}
                    </div>

                    <section>
                        <h3 className="mb-2 font-black text-foreground">{text.table}</h3>
                        <table className="w-full border-collapse text-[14px]">
                            <thead>
                                <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted-foreground">
                                    <th className="py-2 pr-2">{text.cls}</th><th className="py-2 pr-2 text-right">{text.members}</th><th className="py-2 pr-2 text-right">{text.quiz}</th><th className="py-2 pr-2 text-right">{text.trial}</th><th className="py-2">{text.top}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.list.map((c) => {
                                    const s = c.summary || {};
                                    const top = Object.entries(s.clusters || {}).sort((a, b) => b[1] - a[1])[0];
                                    return (
                                        <tr key={c.id} className="border-b border-border/60">
                                            <td className="py-2 pr-2 font-bold text-foreground">{c.name}</td>
                                            <td className="py-2 pr-2 text-right tabular-nums">{s.members || 0}</td>
                                            <td className="py-2 pr-2 text-right tabular-nums">{s.withQuiz || 0}{s.members ? ` (${Math.round((s.withQuiz / s.members) * 100)}%)` : ""}</td>
                                            <td className="py-2 pr-2 text-right tabular-nums">{s.withTrial || 0}</td>
                                            <td className="py-2">{top?.[1] > 0 ? clusterName(top[0]) : "—"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </section>

                    <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
                        <section>
                            <h3 className="mb-2 font-black text-foreground">{text.directions}</h3>
                            <div className="space-y-2">
                                {MMT_CLUSTERS.map((c) => (
                                    <div key={c.key}>
                                        <div className="flex justify-between text-[13.5px]"><span className="text-foreground">{clusterName(c.key)}</span><b className="tabular-nums">{report.clusters[c.key]} {text.people}</b></div>
                                        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted print:border print:border-gray-300">
                                            <div className={`h-full rounded-full ${c.key === report.topCluster ? "bg-primary" : "bg-primary/35"}`} style={{ width: `${(report.clusters[c.key] / maxCluster) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section>
                            <h3 className="mb-2 font-black text-foreground">{text.careers}</h3>
                            <ol className="space-y-1.5 text-[14px]">
                                {report.careers.map((c, i) => (
                                    <li key={c.id} className="flex items-start justify-between gap-3">
                                        <span className="text-foreground"><b className="mr-1.5 text-muted-foreground">{i + 1}.</b>{c.name}</span>
                                        <b className="shrink-0 tabular-nums">{c.count}</b>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </div>

                    {report.topCluster && (
                        <section className="rounded-2xl bg-primary/[0.06] p-4 print:border print:border-gray-300">
                            <h3 className="font-black text-foreground">{text.conclusion}</h3>
                            <p className="mt-1 text-[14.5px] text-foreground">{fill(text.conclusionText, { t: report.withQuiz, m: report.members, p: pct, d: clusterName(report.topCluster) })}</p>
                        </section>
                    )}

                    <div className="grid gap-6 pt-6 text-[14px] text-foreground sm:grid-cols-2 print:grid-cols-2">
                        <div>{text.teacher}: <b>{user?.name || ""}</b><div className="mt-6 border-t border-gray-400 pt-1 text-[12px] text-muted-foreground">(имзо)</div></div>
                        <div>{text.signature}:<div className="mt-6 border-t border-gray-400 pt-1 text-[12px] text-muted-foreground">(имзо, мӯҳр)</div></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{text.source}</p>
                </article>
            )}
        </div>
    );
}
