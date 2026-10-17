import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { API } from "../lib/config";
import { languageLabel, studyFormLabel } from "../lib/offeringLabels";
import { QUICK_TEXT } from "./QuickApply";

// Дар саҳифаи донишгоҳ, зери ҳар ихтисос: «Буҷетӣ · N ҷой», нархи пулакӣ ва тугмаи
// «Ба рӯйхати ҳуҷҷатсупорӣ». Агар пешниҳод якто бошад — як пахш; агар чандто (буҷетӣ ва пулакӣ,
// шакл ё забони гуногун) — рӯйхати кӯтоҳ барои интихоб.
const MORE = {
    tj: { addShort: "Илова", add: "Ба рӯйхати ҳуҷҷатсупорӣ", inList: "Дар рӯйхати ҳуҷҷатсупорӣ", from: "аз {{n}} сомонӣ/сол", choose: "Кадомашро илова кунем?", login: "Ворид шавед, то ба рӯйхат илова кунед" },
    ru: { addShort: "Добавить", add: "В список подачи", inList: "В списке подачи", from: "от {{n}} сомони/год", choose: "Что добавить?", login: "Войдите, чтобы добавить в список" },
    en: { addShort: "Add", add: "Add to application list", inList: "In application list", from: "from {{n}} somoni/year", choose: "Which one to add?", login: "Sign in to add to your list" },
};
const fill = (text, values) => String(text).replace(/\{\{(\w+)\}\}/g, (_, key) => values?.[key] ?? "");
const isFree = (offering) => offering.paymentType === "ройгон" || offering.tuitionFee == null;

export function OfferBadges({ offerings }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = { ...(QUICK_TEXT[lang] || QUICK_TEXT.tj), ...(MORE[lang] || MORE.tj) };
    const free = offerings.filter(isFree);
    const paid = offerings.filter((o) => !isFree(o));
    if (!offerings.length) return null;
    const freeSeats = free.reduce((sum, o) => sum + (o.seats || 0), 0);
    const minFee = paid.length ? Math.min(...paid.map((o) => o.tuitionFee)) : null;
    return (
        <div className="flex flex-wrap gap-1.5" data-offer-badges>
            {free.length > 0 && (
                <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
                    {text.free}{freeSeats ? ` · ${fill(text.seats, { n: freeSeats })}` : ""}
                </span>
            )}
            {minFee != null && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[12px] font-bold text-foreground">
                    {text.paid} · {fill(text.from, { n: minFee.toLocaleString("ru-RU") })}
                </span>
            )}
        </div>
    );
}

export default function UniOfferApply({ offerings, token, planIds, setPlanIds, next }) {
    const { t, i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = { ...(QUICK_TEXT[lang] || QUICK_TEXT.tj), ...(MORE[lang] || MORE.tj) };
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(null);
    const [conflict, setConflict] = useState(null);
    const [error, setError] = useState("");
    if (!offerings.length) return null;

    const inPlan = offerings.filter((o) => planIds.has(o.id));
    if (!token) {
        return (
            <Link to={`/login?next=${encodeURIComponent(next)}`} className="relative z-10 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 px-3 py-2.5 text-[13px] font-bold text-primary hover:bg-primary/5">
                <Plus className="h-4 w-4" aria-hidden /> {text.add}
            </Link>
        );
    }

    const headers = { Authorization: `Bearer ${token}` };
    const toggle = async (offeringId) => {
        setBusy(offeringId);
        setError("");
        try {
            if (planIds.has(offeringId)) {
                await axios.delete(`${API}/users/application-plan/${offeringId}`, { headers });
                setPlanIds((old) => { const copy = new Set(old); copy.delete(offeringId); return copy; });
            } else {
                await axios.post(`${API}/users/application-plan/${offeringId}`, {}, { headers });
                setPlanIds((old) => new Set(old).add(offeringId));
            }
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
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(null);
        }
    };

    const single = offerings.length === 1;
    const mainLabel = inPlan.length ? `${text.inList}${single ? "" : ` · ${inPlan.length}`}` : text.add;
    return (
        <div className="relative z-10 space-y-2" data-offer-apply data-offer-count={offerings.length}>
            <button
                type="button"
                onClick={() => (single ? toggle(offerings[0].id) : setOpen((v) => !v))}
                disabled={busy !== null}
                aria-expanded={single ? undefined : open}
                aria-pressed={single ? inPlan.length > 0 : undefined}
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-bold transition disabled:opacity-60 cursor-pointer ${inPlan.length ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-primary text-primary-foreground hover:opacity-90"}`}
            >
                {busy !== null && single ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : inPlan.length ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                {mainLabel}
                {!single && <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />}
            </button>

            {!single && open && (
                <ul className="space-y-1.5 rounded-xl border border-border bg-background/70 p-2">
                    <li className="px-1 text-[12px] font-bold text-muted-foreground">{text.choose}</li>
                    {offerings.map((offering) => {
                        const added = planIds.has(offering.id);
                        return (
                            <li key={offering.id} className={`flex items-center gap-2 rounded-lg border p-2 ${added ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-card"}`}>
                                <div className="min-w-0 flex-1 text-[12.5px] leading-snug">
                                    <span className={`font-bold ${isFree(offering) ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
                                        {isFree(offering) ? text.free : fill(text.perYear, { n: offering.tuitionFee.toLocaleString("ru-RU") })}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {[offering.studyForm && studyFormLabel(t, offering.studyForm), offering.language && languageLabel(t, offering.language), offering.seats > 0 && fill(text.seats, { n: offering.seats })].filter(Boolean).map((part) => ` · ${part}`).join("")}
                                    </span>
                                </div>
                                <button type="button" onClick={() => toggle(offering.id)} disabled={busy === offering.id} aria-pressed={added}
                                    className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-bold disabled:opacity-60 cursor-pointer ${added ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground"}`}>
                                    {busy === offering.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : added ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                                    {added ? text.added : text.addShort}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

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
        </div>
    );
}
