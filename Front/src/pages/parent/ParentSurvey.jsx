import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, CheckCircle2, HeartHandshake, Loader2 } from "lucide-react";
import { API } from "../../lib/config";
import { CLUSTER_KEYS, PARENT_QUESTIONS, PARENT_WISH, fill, parentText } from "../../lib/parentSurvey";
import ParentCompare from "../../components/ParentCompare";
import ParentCareers from "../../components/ParentCareers";
import { usePageMeta } from "../../lib/usePageMeta";

// /parent/:code — пайванди оила. Бе ворид шудан: ихтисосҳои фарзанд фавран, зери ҳар кадом
// «Аз AI пурсед» ё «Ба фарзанд нависед». 10 саволи кӯтоҳ ихтиёрист → муқоиса бо тести фарзанд.
const AUTHOR_KEYS = ["father", "mother", "brother", "sister", "other"];
const authorKey = (code) => `parent_author_${code}`;
const readAuthor = (code) => { try { return localStorage.getItem(authorKey(code)) || null; } catch { return null; } };
// Барои 10 савол: бародар ва хоҳар ҳамчун «хешованд» нигоҳ дошта мешаванд.
const RELATION = { father: "father", mother: "mother", brother: "other", sister: "other", other: "other" };

export default function ParentSurvey() {
    const { code } = useParams();
    const { i18n } = useTranslation();
    const [invite, setInvite] = useState(null);
    const [missing, setMissing] = useState(false);
    const [author, setAuthor] = useState(() => readAuthor(code));
    const [step, setStep] = useState(-1); // -1 саҳифаи оила; 0..9 саволҳо; 10 хоҳиш
    const [answers, setAnswers] = useState([]);
    const [busy, setBusy] = useState(false);
    const [thanks, setThanks] = useState(false);
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = parentText(lang);
    usePageMeta({ title: text.parentTitleNoName, description: text.familyText, path: `/parent/${code}`, noIndex: true });

    useEffect(() => {
        axios.get(`${API}/parents/invites/${code}`)
            .then(({ data }) => {
                setInvite(data);
                // Забони пайванд — забони хонанда (агар волид забонро иваз накарда бошад).
                try { if (!localStorage.getItem("app_lang") && data.lang) i18n.changeLanguage(data.lang); } catch { /* холӣ */ }
            })
            .catch(() => setMissing(true));
    }, [code, i18n]);

    const chooseAuthor = (key) => {
        setAuthor(key);
        try { localStorage.setItem(authorKey(code), key); } catch { /* холӣ */ }
    };

    const total = PARENT_QUESTIONS.length + 1;
    const pick = async (key) => {
        const next = [...answers.slice(0, step), key];
        setAnswers(next);
        if (step < total - 1) { setStep(step + 1); window.scrollTo(0, 0); return; }
        setBusy(true);
        try {
            const { data } = await axios.post(`${API}/parents/invites/${code}/answers`, {
                answers: next.slice(0, PARENT_QUESTIONS.length), wish: next[PARENT_QUESTIONS.length], relation: RELATION[author] || null,
            });
            setInvite(data);
            setThanks(true);
            setStep(-1);
            window.scrollTo(0, 0);
        } finally {
            setBusy(false);
        }
    };

    if (missing) return <p className="mx-auto max-w-lg px-4 py-20 text-center text-muted-foreground">{text.notFound}</p>;
    if (!invite) return <div className="mx-auto max-w-2xl px-4 py-20"><div className="h-60 animate-pulse rounded-2xl bg-muted/50" /></div>;

    const name = invite.childName;
    if (step < 0) {
        return (
            <div className="mx-auto max-w-2xl space-y-4 px-4 pb-16 pt-8 sm:pt-10">
                <header>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><HeartHandshake className="h-6 w-6" aria-hidden /></span>
                    <h1 className="mt-4 text-2xl font-black leading-tight text-foreground sm:text-3xl">{name ? fill(text.parentTitle, { name }) : text.parentTitleNoName}</h1>
                    <p className="mt-2 text-[16px] leading-relaxed text-muted-foreground">{fill(text.parentText, { name: name || text.childOther })}</p>
                    <div className="mt-4 text-[14px] font-bold text-foreground">{text.whoAreYou}</div>
                    <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={text.whoAreYou}>
                        {AUTHOR_KEYS.map((key) => (
                            <button key={key} type="button" role="radio" aria-checked={author === key} onClick={() => chooseAuthor(key)} data-author={key}
                                className={`rounded-xl border px-3.5 py-2 text-[14px] font-bold cursor-pointer ${author === key ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary"}`}>
                                {text.authors[key]}
                            </button>
                        ))}
                    </div>
                </header>

                {thanks && (
                    <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 font-semibold text-foreground">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> {text.thanks}
                    </p>
                )}

                {invite.answered && invite.childScores ? (
                    <ParentCompare invite={invite} />
                ) : (
                    <button type="button" onClick={() => { setAnswers([]); setStep(0); window.scrollTo(0, 0); }} data-family-survey
                        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary cursor-pointer">
                        <span className="min-w-0 flex-1">
                            <span className="block text-[16px] font-black text-foreground">{name ? fill(text.surveyTitle, { name }) : text.surveyTitleNoName}</span>
                            <span className="mt-0.5 block text-[13.5px] text-muted-foreground">{text.surveyText}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-[14px] font-bold text-primary-foreground">{text.start} <ArrowRight className="h-4 w-4" aria-hidden /></span>
                    </button>
                )}

                <ParentCareers invite={invite} code={code} author={author || "other"} bare />
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
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
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
