import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, GraduationCap, Loader2, MapPin, Plus } from "lucide-react";
import { API } from "../lib/config";
import { withLang } from "../lib/apiLang";
import { studyFormLabel } from "../lib/offeringLabels";

// Дар натиҷаи тест: зери ҳар ихтисос — донишгоҳҳо бо филтри «буҷетӣ / пулакӣ» ва тугмаи
// «Ба рӯйхати ҳуҷҷатсупорӣ» (ҳамон рӯйхате, ки дар «Нақшаи ҳуҷҷатсупорӣ» аст).
export const QUICK_TEXT = {
    tj: {
        percentHint: "Фоиз: нисфаш мувофиқати самт, нисфаш мувофиқат бо ҷавобҳои шумо.",
        planCount: "Дар рӯйхати ҳуҷҷатсупорӣ: {{n}}",
        planOpen: "Нақшаро кушоед",
        open: "Донишгоҳ ва ҳуҷҷатсупорӣ",
        all: "Ҳама",
        free: "Буҷетӣ",
        paid: "Пулакӣ",
        add: "Ба рӯйхат",
        added: "Дар рӯйхат",
        none: "Барои ин филтр пешниҳод нест.",
        noOfferings: "Ҳоло донишгоҳе ин ихтисосро қабул намекунад.",
        seats: "{{n}} ҷой",
        perYear: "{{n}} сомонӣ/сол",
        login: "Барои сохтани рӯйхати ҳуҷҷатсупорӣ ворид шавед",
        conflict: "Дар ММТ ҳуҷҷат танҳо ба як кластер супорида мешавад. Рӯйхати кӯҳнаро тоза карда, инро илова кунем?",
        replace: "Тоза карда илова кунед",
        cancel: "Не",
        error: "Нашуд. Боз кӯшиш кунед.",
        full: "Рӯйхат пур аст (12). Аввал якеро аз «Нақшаи ҳуҷҷатсупорӣ» бароред.",
    },
    ru: {
        percentHint: "Процент: половина — совпадение направления, половина — совпадение с вашими ответами.",
        planCount: "В списке подачи: {{n}}",
        planOpen: "Открыть план",
        open: "Вуз и подача документов",
        all: "Все",
        free: "Бюджет",
        paid: "Платно",
        add: "В список",
        added: "В списке",
        none: "Для этого фильтра предложений нет.",
        noOfferings: "Сейчас ни один вуз не принимает на эту специальность.",
        seats: "{{n}} мест",
        perYear: "{{n}} сомони/год",
        login: "Войдите, чтобы составить список подачи документов",
        conflict: "На ЕГЭ документы подают только в один кластер. Очистить старый список и добавить эту?",
        replace: "Очистить и добавить",
        cancel: "Нет",
        error: "Не получилось. Попробуйте ещё раз.",
        full: "Список полон (12). Сначала уберите одну в «Плане подачи».",
    },
    en: {
        percentHint: "Percent: half direction match, half match with your answers.",
        planCount: "In your application list: {{n}}",
        planOpen: "Open the plan",
        open: "University and application",
        all: "All",
        free: "State-funded",
        paid: "Paid",
        add: "Add to list",
        added: "In list",
        none: "No offers for this filter.",
        noOfferings: "No university admits to this specialty right now.",
        seats: "{{n}} seats",
        perYear: "{{n}} somoni/year",
        login: "Sign in to build your application list",
        conflict: "Applications go to one cluster only. Clear the old list and add this one?",
        replace: "Clear and add",
        cancel: "No",
        error: "Something went wrong. Try again.",
        full: "The list is full (12). Remove one in the Application plan first.",
    },
};
const fill = (text, values) => String(text).replace(/\{\{(\w+)\}\}/g, (_, key) => values?.[key] ?? "");
const isFree = (offering) => offering.paymentType === "ройгон";

export default function QuickApply({ careerId, grade, token, planIds, setPlanIds, onPlanChange }) {
    const { t, i18n } = useTranslation();
    const text = QUICK_TEXT[(i18n.language || "tj").slice(0, 2)] || QUICK_TEXT.tj;
    const [open, setOpen] = useState(false);
    const [offerings, setOfferings] = useState(null);
    const [filter, setFilter] = useState("all");
    const [busy, setBusy] = useState(null);
    const [conflict, setConflict] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open || offerings) return undefined;
        let alive = true;
        axios.get(`${API}/careers/${careerId}/offerings`, { params: withLang(grade ? { grade } : {}) })
            .then(({ data }) => alive && setOfferings(Array.isArray(data) ? data : []))
            .catch(() => alive && setOfferings([]));
        return () => { alive = false; };
    }, [open, offerings, careerId, grade]);

    const counts = useMemo(() => ({
        all: offerings?.length || 0,
        free: offerings?.filter(isFree).length || 0,
        paid: offerings?.filter((o) => !isFree(o)).length || 0,
    }), [offerings]);
    const shown = (offerings || []).filter((o) => (filter === "free" ? isFree(o) : filter === "paid" ? !isFree(o) : true));
    const plannedHere = (offerings || []).filter((o) => planIds.has(o.id)).length;

    const headers = { Authorization: `Bearer ${token}` };
    const toggle = async (offeringId) => {
        setBusy(offeringId);
        setError("");
        try {
            if (planIds.has(offeringId)) {
                await axios.delete(`${API}/users/application-plan/${offeringId}`, { headers });
                setPlanIds((old) => { const next = new Set(old); next.delete(offeringId); return next; });
            } else {
                await axios.post(`${API}/users/application-plan/${offeringId}`, {}, { headers });
                setPlanIds((old) => new Set(old).add(offeringId));
            }
            onPlanChange?.();
        } catch (err) {
            const code = err.response?.data?.code;
            if (code === "CLUSTER_CONFLICT") setConflict(offeringId);
            else if (code === "PLAN_FULL") setError(text.full);
            else setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(null);
        }
    };
    const replace = async () => {
        const offeringId = conflict;
        setConflict(null);
        setBusy(offeringId);
        try {
            await axios.delete(`${API}/users/application-plan`, { headers });
            await axios.post(`${API}/users/application-plan/${offeringId}`, {}, { headers });
            setPlanIds(new Set([offeringId]));
            onPlanChange?.();
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card/60">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] font-bold text-primary cursor-pointer"
            >
                <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" aria-hidden /> {text.open}
                    {plannedHere > 0 && <span className="whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">✓ {plannedHere}</span>}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
            </button>

            {open && (
                <div className="space-y-2.5 border-t border-border p-3">
                    {offerings === null ? (
                        <div className="flex justify-center py-3"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden /></div>
                    ) : offerings.length === 0 ? (
                        <p className="text-[13px] text-muted-foreground">{text.noOfferings}</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1">
                                {["all", "free", "paid"].map((key) => (
                                    <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key}
                                        className={`rounded-lg px-1 py-1.5 text-[12px] font-bold cursor-pointer ${filter === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                                        {text[key]} <span className="opacity-60">{counts[key]}</span>
                                    </button>
                                ))}
                            </div>

                            {!token && (
                                <Link to="/login?next=%2Fquiz" className="block rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary">{text.login} →</Link>
                            )}

                            {shown.length === 0 && <p className="text-[13px] text-muted-foreground">{text.none}</p>}
                            <ul className="space-y-1.5">
                                {shown.map((offering) => {
                                    const inPlan = planIds.has(offering.id);
                                    const uni = offering.university || {};
                                    return (
                                        <li key={offering.id} className={`flex flex-col gap-2 rounded-lg border p-2.5 min-[480px]:flex-row min-[480px]:items-center ${inPlan ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-background/60"}`}>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[13px] font-semibold leading-snug text-foreground">{uni.nameTranslated || uni.name}</div>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted-foreground">
                                                    {uni.city && <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" aria-hidden />{uni.city}</span>}
                                                    {offering.studyForm && <span>{studyFormLabel(t, offering.studyForm)}</span>}
                                                    {offering.seats > 0 && <span>{fill(text.seats, { n: offering.seats })}</span>}
                                                    {isFree(offering) || offering.tuitionFee == null
                                                        ? <span className="font-bold text-emerald-600 dark:text-emerald-400">{text.free}</span>
                                                        : <span className="font-bold text-foreground">{fill(text.perYear, { n: offering.tuitionFee.toLocaleString("ru-RU") })}</span>}
                                                </div>
                                            </div>
                                            {token && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggle(offering.id)}
                                                    disabled={busy === offering.id}
                                                    aria-pressed={inPlan}
                                                    className={`inline-flex shrink-0 items-center justify-center gap-1 self-stretch rounded-lg px-2.5 py-2 text-[12px] min-[480px]:self-auto min-[480px]:py-1.5 font-bold cursor-pointer disabled:opacity-60 ${inPlan ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"}`}
                                                >
                                                    {busy === offering.id
                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                                        : inPlan ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                                                    {inPlan ? text.added : text.add}
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>

                            {conflict && (
                                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-[13px] text-foreground">
                                    <p>{text.conflict}</p>
                                    <div className="mt-2 flex gap-2">
                                        <button type="button" onClick={replace} className="rounded-lg bg-amber-500 px-3 py-1.5 text-[12px] font-bold text-white cursor-pointer">{text.replace}</button>
                                        <button type="button" onClick={() => setConflict(null)} className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-bold cursor-pointer">{text.cancel}</button>
                                    </div>
                                </div>
                            )}
                            {error && <p className="text-[12px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
