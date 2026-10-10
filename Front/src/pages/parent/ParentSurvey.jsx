import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, HeartHandshake, Loader2 } from "lucide-react";
import { API } from "../../lib/config";
import { CLUSTER_KEYS, PARENT_QUESTIONS, PARENT_WISH, fill, parentText } from "../../lib/parentSurvey";
import ParentCompare from "../../components/ParentCompare";
import { usePageMeta } from "../../lib/usePageMeta";

// /parent/:code — волид бе ворид шудан 10 савол дар бораи фарзанд ҷавоб медиҳад → муқоиса.
// Ҳар савол дар як экран, тугмаҳои калон: интихоб = гузариш ба саволи навбатӣ.
export default function ParentSurvey() {
    const { code } = useParams();
    const { i18n } = useTranslation();
    const [invite, setInvite] = useState(null);
    const [missing, setMissing] = useState(false);
    const [relation, setRelation] = useState(null);
    const [step, setStep] = useState(-1); // -1 муқаддима; 0..9 саволҳо
    const [answers, setAnswers] = useState([]);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(null);
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = parentText(lang);
    usePageMeta({ title: text.askTitleNoName, description: text.askText, path: `/parent/${code}`, noIndex: true });

    useEffect(() => {
        axios.get(`${API}/parents/invites/${code}`)
            .then(({ data }) => {
                setInvite(data);
                if (data.answered) setDone(data);
                // Забони пайванд — забони хонанда (агар волид забонро иваз накарда бошад).
                try { if (!localStorage.getItem("app_lang") && data.lang) i18n.changeLanguage(data.lang); } catch { /* холӣ */ }
            })
            .catch(() => setMissing(true));
    }, [code, i18n]);

    const total = PARENT_QUESTIONS.length + 1;
    const pick = async (key) => {
        const next = [...answers.slice(0, step), key];
        setAnswers(next);
        if (step < total - 1) { setStep(step + 1); window.scrollTo(0, 0); return; }
        setBusy(true);
        try {
            const { data } = await axios.post(`${API}/parents/invites/${code}/answers`, {
                answers: next.slice(0, PARENT_QUESTIONS.length), wish: next[PARENT_QUESTIONS.length], relation,
            });
            setDone(data);
            window.scrollTo(0, 0);
        } finally {
            setBusy(false);
        }
    };

    if (missing) return <p className="mx-auto max-w-lg px-4 py-20 text-center text-muted-foreground">{text.notFound}</p>;
    if (!invite) return <div className="mx-auto max-w-lg px-4 py-20"><div className="h-60 animate-pulse rounded-3xl bg-muted/50" /></div>;

    if (done) {
        return (
            <div className="mx-auto max-w-2xl space-y-4 px-4 pb-16 pt-8">
                <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 font-semibold text-foreground">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> {text.thanks}
                </p>
                {done.childScores && <ParentCompare invite={done} />}
            </div>
        );
    }

    const title = invite.childName ? fill(text.askTitle, { name: invite.childName }) : text.askTitleNoName;
    if (step < 0) {
        return (
            <div className="mx-auto max-w-lg px-4 pb-16 pt-8 sm:pt-12">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500"><HeartHandshake className="h-7 w-7" aria-hidden /></span>
                <h1 className="mt-4 text-2xl font-black leading-tight text-foreground sm:text-3xl">{title}</h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">{text.askText}</p>
                <div className="mt-6 font-bold text-foreground">{text.relation}</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                    {Object.entries(text.relations).map(([key, label]) => (
                        <button key={key} type="button" onClick={() => setRelation(key)} aria-pressed={relation === key}
                            className={`rounded-2xl border px-3 py-3.5 text-[15px] font-bold cursor-pointer ${relation === key ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>
                            {label}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={() => setStep(0)} className="btn-primary mt-6 w-full !py-4 text-base">{text.start}</button>
            </div>
        );
    }

    const isWish = step === PARENT_QUESTIONS.length;
    const item = isWish ? PARENT_WISH[lang] || PARENT_WISH.tj : PARENT_QUESTIONS[step][lang] || PARENT_QUESTIONS[step].tj;
    return (
        <div className="mx-auto max-w-lg px-4 pb-16 pt-6">
            <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 font-semibold text-muted-foreground cursor-pointer"><ArrowLeft className="h-4 w-4" aria-hidden /> {text.back}</button>
                <span className="font-bold text-muted-foreground">{isWish ? text.wishLabel : fill(text.question, { n: step + 1, t: PARENT_QUESTIONS.length })}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-rose-400 transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
            <h2 className="mt-6 text-xl font-black leading-snug text-foreground sm:text-2xl">{item.q}</h2>
            <div className="mt-5 space-y-2.5">
                {item.o.map((option, i) => (
                    <button key={option} type="button" disabled={busy} onClick={() => pick(CLUSTER_KEYS[i])}
                        className={`w-full rounded-2xl border px-4 py-4 text-left text-[16px] font-semibold transition active:scale-[0.99] cursor-pointer ${answers[step] === CLUSTER_KEYS[i] ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary"}`}>
                        {option}
                    </button>
                ))}
            </div>
            {busy && <div className="mt-4 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden /></div>}
        </div>
    );
}
