import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, Users } from "lucide-react";
import { API } from "../../lib/config";
import { PEER_TRAITS, fill, peerLang, peerText } from "../../lib/peerSurvey";
import { usePageMeta } from "../../lib/usePageMeta";
import PeerScale from "./PeerScale";

// /peer/:code — дӯст бе бақайдгирӣ хонандаро аз рӯи 8 сифат баҳо медиҳад.
export default function PeerAnswer() {
    const { code } = useParams();
    const { i18n } = useTranslation();
    const lang = peerLang(i18n.language);
    const text = peerText(lang);
    const [invite, setInvite] = useState(null);
    const [missing, setMissing] = useState(false);
    const [relation, setRelation] = useState(null);
    const [scores, setScores] = useState({});
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");
    usePageMeta({ title: text.title, description: text.friendText, path: `/peer/${code}`, noIndex: true });

    useEffect(() => {
        axios.get(`${API}/peers/invites/${code}`)
            .then(({ data }) => {
                setInvite(data);
                try { if (!localStorage.getItem("app_lang") && data.lang) i18n.changeLanguage(data.lang); } catch { /* холӣ */ }
            })
            .catch(() => setMissing(true));
    }, [code, i18n]);

    const complete = PEER_TRAITS.every((t) => scores[t.key]);
    const send = async () => {
        setBusy(true);
        setError("");
        try {
            await axios.post(`${API}/peers/invites/${code}/answers`, { scores, relation });
            setDone(true);
            window.scrollTo(0, 0);
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };

    if (missing) return <p className="mx-auto max-w-lg px-4 py-20 text-center text-muted-foreground">{text.notFound}</p>;
    if (!invite) return <div className="mx-auto max-w-lg px-4 py-20"><div className="h-60 animate-pulse rounded-3xl bg-muted/50" /></div>;
    if (done) {
        return (
            <div className="mx-auto max-w-lg space-y-4 px-4 pb-16 pt-10" data-peer-thanks>
                <p className="flex items-start gap-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-[16px] font-semibold text-foreground">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden /> {fill(text.thanks, { name: invite.name })}
                </p>
                <Link to="/peers" className="btn-primary w-full !py-4 text-base"><Users className="h-5 w-5" aria-hidden /> {text.tryYourself} <ArrowRight className="h-5 w-5" aria-hidden /></Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-5 px-4 pb-28 pt-6 sm:pt-10 md:pb-16" data-peer-answer>
            <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{fill(text.friendTitle, { name: invite.name })}</h1>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{text.friendText}</p>
                <p className="mt-2 flex items-start gap-2 text-[13px] text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> {text.privacy}</p>
            </div>
            <div>
                <div className="mb-2 text-[14px] font-bold text-foreground">{text.relation}</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(text.relations).map(([key, label]) => (
                        <button key={key} type="button" onClick={() => setRelation(key)} aria-pressed={relation === key}
                            className={`rounded-2xl border px-3 py-3 text-[15px] font-bold cursor-pointer ${relation === key ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {PEER_TRAITS.map((trait) => (
                    <PeerScale key={trait.key} trait={trait} lang={lang} value={scores[trait.key]} scale={text.scale} onChange={(v) => setScores((o) => ({ ...o, [trait.key]: v }))} />
                ))}
            </div>
            {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
            <button type="button" onClick={send} disabled={busy || !complete} className="btn-primary w-full !py-4 text-base disabled:opacity-50" data-peer-send>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : text.send}
            </button>
        </div>
    );
}
