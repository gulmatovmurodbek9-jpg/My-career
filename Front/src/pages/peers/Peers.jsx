import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, Copy, Eye, Loader2, RefreshCw, Send, ShieldCheck, Sparkles, Users } from "lucide-react";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { MMT_CLUSTERS } from "../../lib/mmtClusters";
import { PEER_TRAITS, fill, peerAnalysis, peerLang, peerText } from "../../lib/peerSurvey";
import { clusterCareers } from "../../lib/clusterCareers";
import { careerName } from "../../lib/careerText";
import { displayName } from "../../lib/careerName";
import { copyText } from "../../lib/copyText";
import { usePageMeta } from "../../lib/usePageMeta";
import PeerScale from "./PeerScale";

const KEY = "peer_invite_v1";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const save = (v) => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch { /* холӣ */ } };

function Result({ data, text, lang, onReset }) {
    const { t } = useTranslation();
    const [careers, setCareers] = useState([]);
    const analysis = peerAnalysis(data.self, data.others);
    const cluster = MMT_CLUSTERS.find((c) => c.key === analysis.cluster);
    useEffect(() => {
        let alive = true;
        clusterCareers(analysis.cluster, lang).then((list) => alive && setCareers(list)).catch(() => {});
        return () => { alive = false; };
    }, [analysis.cluster, lang]);
    const label = (row) => (row[lang] || row.tj)[0];

    return (
        <div className="space-y-5" data-peer-result>
            <section className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-black text-foreground">{text.resultTitle}</h2>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary"><Users className="mr-1 inline h-4 w-4" aria-hidden />{fill(text.answers, { n: data.count })}</span>
                </div>
                <div className="mt-3 flex gap-4 text-[12px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary/35" /> {text.me}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> {text.others}</span>
                </div>
                <div className="mt-3 space-y-3">
                    {analysis.rows.map((row) => (
                        <div key={row.key}>
                            <div className="flex items-center justify-between text-[14px]">
                                <span className="font-bold text-foreground"><span aria-hidden>{row.icon}</span> {label(row)}</span>
                                <span className="tabular-nums text-muted-foreground">{row.self} · <b className="text-primary">{row.others}</b></span>
                            </div>
                            <div className="mt-1 space-y-1">
                                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/35" style={{ width: `${(row.self / 5) * 100}%` }} /></div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(row.others / 5) * 100}%` }} /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5">
                    <h3 className="font-black text-foreground">💎 {text.hidden}</h3>
                    {analysis.hidden.length ? (
                        <>
                            <p className="mt-1 text-[13.5px] text-muted-foreground">{text.hiddenText}</p>
                            <div className="mt-2 flex flex-wrap gap-2">{analysis.hidden.map((r) => <span key={r.key} className="rounded-full bg-card px-3 py-1.5 text-[14px] font-bold text-foreground shadow-sm">{r.icon} {label(r)} <span className="text-emerald-600">+{Math.round((r.others - r.self) * 10) / 10}</span></span>)}</div>
                        </>
                    ) : <p className="mt-1 text-[13.5px] text-muted-foreground">{text.none}</p>}
                </section>
                <section className="rounded-3xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
                    <h3 className="font-black text-foreground"><Eye className="mr-1 inline h-5 w-5 text-amber-600" aria-hidden /> {text.blind}</h3>
                    {analysis.blind.length ? (
                        <>
                            <p className="mt-1 text-[13.5px] text-muted-foreground">{text.blindText}</p>
                            <div className="mt-2 flex flex-wrap gap-2">{analysis.blind.map((r) => <span key={r.key} className="rounded-full bg-card px-3 py-1.5 text-[14px] font-bold text-foreground shadow-sm">{r.icon} {label(r)}</span>)}</div>
                        </>
                    ) : <p className="mt-1 text-[13.5px] text-muted-foreground">{text.none}</p>}
                </section>
            </div>

            <section className="rounded-3xl border border-border bg-card p-5">
                <h3 className="font-black text-foreground">⭐ {text.strongest}</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {analysis.strongest.map((r) => (
                        <div key={r.key} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3">
                            <span className="text-3xl" aria-hidden>{r.icon}</span>
                            <span className="font-black text-foreground">{label(r)}</span>
                        </div>
                    ))}
                </div>
                {cluster && (
                    <div className="mt-4 rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                        <div className="text-[12px] font-bold uppercase tracking-wide opacity-80">{text.direction}</div>
                        <div className="text-2xl font-black">{t(cluster.i18nKey, cluster.fallback)}</div>
                    </div>
                )}
                {careers.length > 0 && (
                    <>
                        <h4 className="mt-4 text-[13px] font-black uppercase tracking-wide text-muted-foreground">{text.careers}</h4>
                        <ul className="mt-2 space-y-2">
                            {careers.map((career) => (
                                <li key={career.id}>
                                    <Link to={`/info/${career.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3 font-bold text-foreground hover:bg-primary/10 hover:text-primary">
                                        <span className="min-w-0">{displayName(careerName(career, lang))}</span>
                                        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>
            <div className="flex flex-wrap gap-2">
                <Link to="/quiz" className="btn-primary !py-3"><Sparkles className="h-5 w-5" aria-hidden /> {text.fullTest}</Link>
                <button type="button" onClick={onReset} className="btn-secondary !py-3">{text.newLink}</button>
            </div>
        </div>
    );
}

// /peers — «Дӯстон маро чӣ гуна мебинанд?»: худбаҳо → пайванд → натиҷа (аз 2 ҷавоб).
export default function Peers() {
    const { i18n } = useTranslation();
    const lang = peerLang(i18n.language);
    const text = peerText(lang);
    const user = useAuthStore((s) => s.user);
    const [saved, setSaved] = useState(read);
    const [name, setName] = useState(() => user?.name?.split(" ")[0] || "");
    const [self, setSelf] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(null);
    usePageMeta({ title: text.title, description: text.intro, path: "/peers" });

    const link = saved ? `${window.location.origin}/peer/${saved.code}` : "";
    const message = `${text.shareText} ${link}`;
    const check = useCallback(async () => {
        if (!saved) return;
        try {
            const { data } = await axios.get(`${API}/peers/invites/${saved.code}/result`, { params: { secret: saved.secret } });
            setResult(data);
        } catch (err) {
            if (err.response?.status === 404) { save(null); setSaved(null); }
        }
    }, [saved]);
    useEffect(() => {
        check();
        const timer = setInterval(() => { if (!document.hidden) check(); }, 20000);
        return () => clearInterval(timer);
    }, [check]);

    const complete = PEER_TRAITS.every((t) => self[t.key]);
    const create = async () => {
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(`${API}/peers/invites`, { name: name.trim(), self, lang });
            const value = { ...data, name: name.trim() };
            save(value);
            setSaved(value);
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };
    const copy = async () => { const ok = await copyText(link); setCopied(ok ? "ok" : "fail"); setTimeout(() => setCopied(null), 2200); };
    const share = async () => {
        if (navigator.share) { try { await navigator.share({ text: message }); return; } catch (e) { if (e?.name === "AbortError") return; } }
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text.shareText)}`, "_blank", "noopener");
    };

    return (
        <div className="mx-auto max-w-3xl space-y-5 px-4 pb-28 pt-6 sm:pt-10 md:pb-16" data-peers>
            <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{text.title}</h1>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{text.intro}</p>
                <p className="mt-2 flex items-start gap-2 text-[13px] text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> {text.privacy}</p>
            </div>

            {result?.others ? (
                <Result data={result} text={text} lang={lang} onReset={() => { save(null); setSaved(null); setResult(null); setSelf({}); }} />
            ) : saved ? (
                <section className="space-y-3 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6" data-peer-share>
                    <h2 className="text-xl font-black text-foreground">{text.share}</h2>
                    <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded-xl bg-background px-3 py-2.5 text-[13px] text-foreground">{link}</code>
                        <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-bold text-foreground cursor-pointer">
                            {copied === "ok" ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied === "ok" ? text.copied : copied === "fail" ? text.copyFailed : text.copy}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={share} className="btn-primary !py-3"><Send className="h-4 w-4" aria-hidden /> Telegram</button>
                        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600">WhatsApp</a>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-[13.5px] font-semibold text-muted-foreground">
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {fill(text.waiting, { n: result?.count ?? 0, m: result?.min ?? 2 })}</span>
                        <button type="button" onClick={check} className="inline-flex items-center gap-1 font-bold text-primary cursor-pointer"><RefreshCw className="h-3.5 w-3.5" aria-hidden /> {text.refresh}</button>
                    </div>
                </section>
            ) : (
                <section className="space-y-4">
                    <label className="block">
                        <span className="mb-1.5 block text-[14px] font-bold text-foreground">{text.yourName}</span>
                        <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder={text.namePlaceholder} data-peer-name
                            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-ring" />
                    </label>
                    <h2 className="text-lg font-black text-foreground">{text.rateSelf}</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {PEER_TRAITS.map((trait) => (
                            <PeerScale key={trait.key} trait={trait} lang={lang} value={self[trait.key]} scale={text.scale} onChange={(v) => setSelf((o) => ({ ...o, [trait.key]: v }))} />
                        ))}
                    </div>
                    {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
                    <button type="button" onClick={create} disabled={busy || !complete || name.trim().length < 2} className="btn-primary w-full !py-4 text-base disabled:opacity-50" data-peer-create>
                        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <><Users className="h-5 w-5" aria-hidden /> {text.create}</>}
                    </button>
                </section>
            )}
        </div>
    );
}
