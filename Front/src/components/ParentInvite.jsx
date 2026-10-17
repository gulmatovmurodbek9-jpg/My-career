import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Check, Copy, Loader2, RefreshCw, Send, Users } from "lucide-react";
import { API } from "../lib/config";
import { useAuthStore } from "../store/authStore";
import { fill, hasScores, parentText, scoresDiffer } from "../lib/parentSurvey";
import ParentCompare from "./ParentCompare";
import ParentCareers from "./ParentCareers";
import { copyText } from "../lib/copyText";

// «Бо оила маслиҳат кунед»: як пайванди доимӣ барои тамоми оила (Telegram/WhatsApp).
// Оила ихтисосҳоро фавран мебинад, аз AI мепурсад ва ба фарзанд менависад; 10 саволи волид ихтиёрист.
// Баъди тести нав — «Натиҷаи навро фиристед»: ҳамон пайванд нав мешавад.
// Пайванд ва калид дар браузер нигоҳ дошта мешаванд; ҷавобҳои оила худкор санҷида мешаванд.
const KEY = "parent_invite_v1";
const readInvite = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const saveInvite = (value) => { try { if (value) localStorage.setItem(KEY, JSON.stringify(value)); else localStorage.removeItem(KEY); } catch { /* холӣ */ } };

// `careers` — ихтисосҳои тест (дар саҳифаи натиҷа). Бе он (дар кабинет) навсозии натиҷа пешниҳод намешавад.
export default function ParentInvite({ scores, careers }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = parentText(lang);
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const [saved, setSaved] = useState(readInvite);
    const [name, setName] = useState(() => user?.name?.split(" ")[0] || "");
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const [updated, setUpdated] = useState(false);
    const auth = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const childName = result?.childName || saved?.childName || name.trim();
    const link = saved ? `${window.location.origin}/parent/${saved.code}` : "";
    const message = saved ? `${fill(updated ? text.familyShareUpdate : text.familyShare, { name: childName || "…" })} ${link}` : "";
    const needsUpdate = !!(result && Array.isArray(careers) && hasScores(scores) && scoresDiffer(scores, result.childScores));

    const check = useCallback(async () => {
        if (!saved) return;
        try {
            const { data } = await axios.get(`${API}/parents/invites/${saved.code}/result`, { params: { secret: saved.secret } });
            setResult(data);
        } catch (err) {
            if (err.response?.status === 404) { saveInvite(null); setSaved(null); setResult(null); }
        }
    }, [saved]);

    useEffect(() => {
        check();
        // Ҷавобҳои оила — ҳар 20 сония (вақте ки саҳифа кушода аст).
        const timer = setInterval(() => { if (!document.hidden) check(); }, 20000);
        return () => clearInterval(timer);
    }, [check]);

    const create = async () => {
        setBusy(true);
        try {
            // Бо ҳисоб — оила ихтисосҳои захирашуда ва рӯйхати ҳуҷҷатсупориро ҳам мебинад (зинда).
            const { data } = await axios.post(`${API}/parents/invites`, { childName: name.trim(), scores, lang, careers: careers || [] }, auth);
            const value = { ...data, childName: name.trim() };
            saveInvite(value);
            setSaved(value);
            setResult(null);
            setUpdated(false);
        } catch { /* тугма боз фаъол */ } finally {
            setBusy(false);
        }
    };

    // Тести нав: ҳамон пайванд — холҳо ва ихтисосҳои нав.
    const refresh = async () => {
        setBusy(true);
        try {
            const { data } = await axios.post(`${API}/parents/invites/${saved.code}/refresh`, { secret: saved.secret, scores, careers }, auth);
            setResult(data);
            setUpdated(true);
        } catch { /* тугма боз фаъол */ } finally {
            setBusy(false);
        }
    };

    const copy = async () => {
        if (await copyText(message)) { setCopied(true); setTimeout(() => setCopied(false), 1800); }
    };
    const share = async () => {
        if (navigator.share) {
            try { await navigator.share({ text: message }); return; } catch (error) { if (error?.name === "AbortError") return; }
        }
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message.replace(link, "").trim())}`, "_blank", "noopener");
    };
    const reset = () => { saveInvite(null); setSaved(null); setResult(null); setUpdated(false); };

    const familyWrote = (result?.notes || []).some((n) => n.author !== "child");
    return (
        <div className="space-y-3" data-family>
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Users className="h-6 w-6" aria-hidden /></span>
                    <div>
                        <h2 className="text-xl font-black text-foreground">{text.familyTitle}</h2>
                        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{text.familyText}</p>
                    </div>
                </div>

                {!saved ? (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder={text.childName} aria-label={text.childName}
                            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus-ring" />
                        <button type="button" onClick={create} disabled={busy} className="btn-primary !py-3 disabled:opacity-50" data-family-create>
                            {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <><Send className="h-5 w-5" aria-hidden /> {text.createFamily}</>}
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {needsUpdate && (
                            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5" data-family-retake>
                                <div className="font-bold text-foreground">{text.retakeTitle}</div>
                                <p className="mt-0.5 text-[14px] text-muted-foreground">{text.retakeText}</p>
                                <button type="button" onClick={refresh} disabled={busy} className="btn-primary mt-3 w-full !py-3 disabled:opacity-50 sm:w-auto">
                                    {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <><RefreshCw className="h-4 w-4" aria-hidden /> {text.retakeButton}</>}
                                </button>
                            </div>
                        )}
                        {updated && !needsUpdate && (
                            <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-[14px] font-semibold text-foreground"><Check className="h-4 w-4 text-emerald-600" aria-hidden /> {text.updatedNow}</p>
                        )}
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                            <button type="button" onClick={share} className="btn-primary !py-3"><Send className="h-4 w-4" aria-hidden /> {text.send}</button>
                            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">WhatsApp</a>
                            <button type="button" onClick={copy} aria-label={text.copy} title={text.copy}
                                className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-3.5 text-foreground hover:border-primary cursor-pointer">
                                {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                            </button>
                        </div>
                        <p className="truncate text-[12.5px] text-muted-foreground">{link}</p>
                        {!familyWrote && !result?.answered && (
                            <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-[13px] font-semibold text-muted-foreground">
                                <span>{text.noNotes}</span>
                                <button type="button" onClick={check} className="inline-flex shrink-0 items-center gap-1 font-bold text-primary cursor-pointer"><RefreshCw className="h-3.5 w-3.5" aria-hidden /> {text.refresh}</button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {saved && result && (
                <>
                    {result.answered && hasScores(result.childScores) ? (
                        <ParentCompare invite={result} />
                    ) : hasScores(result.childScores) && (
                        <p className="px-1 text-[13px] text-muted-foreground">{text.surveyWaiting}</p>
                    )}
                    <ParentCareers invite={result} code={saved.code} secret={saved.secret} forChild />
                    <button type="button" onClick={reset} className="px-1 text-[13px] font-bold text-muted-foreground hover:text-primary cursor-pointer">{text.newLink}</button>
                </>
            )}
        </div>
    );
}
