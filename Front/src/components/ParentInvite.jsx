import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Check, Copy, Loader2, RefreshCw, Send, Users } from "lucide-react";
import { API } from "../lib/config";
import { useAuthStore } from "../store/authStore";
import { fill, parentText } from "../lib/parentSurvey";
import ParentCompare from "./ParentCompare";

// Дар натиҷаи тест: «Волидайн чӣ фикр доранд?» → пайванд → Telegram/WhatsApp → муқоиса.
// Пайванд ва калид дар браузер нигоҳ дошта мешаванд; ҷавоб худкор санҷида мешавад.
const KEY = "parent_invite_v1";
const readInvite = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const saveInvite = (value) => { try { if (value) localStorage.setItem(KEY, JSON.stringify(value)); else localStorage.removeItem(KEY); } catch { /* холӣ */ } };

export default function ParentInvite({ scores }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = parentText(lang);
    const user = useAuthStore((state) => state.user);
    const [saved, setSaved] = useState(readInvite);
    const [name, setName] = useState(() => user?.name?.split(" ")[0] || "");
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const link = saved ? `${window.location.origin}/parent/${saved.code}` : "";
    const message = saved ? `${fill(text.shareText, { name: saved.childName || name || "…" })} ${link}` : "";

    const check = useCallback(async () => {
        if (!saved) return;
        try {
            const { data } = await axios.get(`${API}/parents/invites/${saved.code}/result`, { params: { secret: saved.secret } });
            setResult(data);
        } catch (err) {
            if (err.response?.status === 404) { saveInvite(null); setSaved(null); }
        }
    }, [saved]);

    useEffect(() => {
        check();
        // То волид ҷавоб диҳад — ҳар 20 сония (вақте ки саҳифа кушода аст).
        const timer = setInterval(() => { if (!document.hidden) check(); }, 20000);
        return () => clearInterval(timer);
    }, [check]);

    const create = async () => {
        setBusy(true);
        try {
            const { data } = await axios.post(`${API}/parents/invites`, { childName: name.trim(), scores, lang });
            const value = { ...data, childName: name.trim() };
            saveInvite(value);
            setSaved(value);
            setResult(null);
        } catch { /* тугма боз фаъол */ } finally {
            setBusy(false);
        }
    };
    const copy = async () => {
        try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt(text.copy, message); }
    };
    const share = async () => {
        if (navigator.share) {
            try { await navigator.share({ text: message }); return; } catch (error) { if (error?.name === "AbortError") return; }
        }
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message.replace(link, "").trim())}`, "_blank", "noopener");
    };

    if (result?.answered) {
        return (
            <div className="space-y-2">
                <ParentCompare invite={result} />
                <button type="button" onClick={() => { saveInvite(null); setSaved(null); setResult(null); }} className="text-[13px] font-bold text-muted-foreground hover:text-primary cursor-pointer">{text.newLink}</button>
            </div>
        );
    }

    return (
        <section className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.07] via-card to-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500"><Users className="h-6 w-6" aria-hidden /></span>
                <div>
                    <h2 className="text-xl font-black text-foreground">{text.inviteTitle}</h2>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{text.inviteText}</p>
                </div>
            </div>

            {!saved ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder={text.childName} aria-label={text.childName}
                        className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus-ring" />
                    <button type="button" onClick={create} disabled={busy} className="btn-primary !py-3 disabled:opacity-50">
                        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <><Users className="h-5 w-5" aria-hidden /> {text.create}</>}
                    </button>
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded-xl bg-background px-3 py-2.5 text-[13px] text-foreground">{link}</code>
                        <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-bold text-foreground cursor-pointer">
                            {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? text.copied : text.copy}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={share} className="btn-primary !py-3"><Send className="h-4 w-4" aria-hidden /> {text.send}</button>
                        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600">WhatsApp</a>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-[13px] font-semibold text-muted-foreground">
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {text.waiting}</span>
                        <button type="button" onClick={check} className="inline-flex items-center gap-1 font-bold text-primary cursor-pointer"><RefreshCw className="h-3.5 w-3.5" aria-hidden /> {text.refresh}</button>
                    </div>
                </div>
            )}
        </section>
    );
}
