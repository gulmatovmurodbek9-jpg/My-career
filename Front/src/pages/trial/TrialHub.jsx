import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { API } from "../../lib/config";
import { usePageMeta } from "../../lib/usePageMeta";
import TrialIcon from "../../components/TrialIcon";
import { fillText, langCode, trialText } from "../../lib/trialText";

// Рӯйхати сенарияҳои «Як рӯз дар ихтисос».
export default function TrialHub() {
    const { i18n } = useTranslation();
    const lang = langCode(i18n.language);
    const text = trialText(lang);
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);

    usePageMeta({ title: text.name, description: text.hubIntro, path: "/trial" });

    useEffect(() => {
        let alive = true;
        setError(false);
        axios.get(`${API}/trial`, { params: { lang } })
            .then((res) => alive && setData(res.data))
            .catch(() => alive && setError(true));
        return () => { alive = false; };
    }, [lang]);

    return (
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> {text.tagline}
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-5xl">{text.name}</h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">{text.hubIntro}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {text.why.map(([title, desc]) => (
                    <div key={title} className="rounded-2xl border border-border bg-card p-4">
                        <div className="font-bold text-foreground">{title}</div>
                        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                    </div>
                ))}
            </div>

            {error && <p className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{text.loadError}</p>}

            {!data && !error && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-muted/50" />)}
                </div>
            )}

            {data && (
                <>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.scenarios.map((scenario) => (
                            <Link
                                key={scenario.family}
                                to={`/trial/${scenario.family}`}
                                className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-xl hover:shadow-primary/10"
                            >
                                <TrialIcon family={scenario.family} size="lg" />
                                <span className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{scenario.familyName}</span>
                                <span className="mt-1 text-xl font-black text-foreground">{scenario.role}</span>
                                <span className="mt-1 text-sm text-muted-foreground">{scenario.place}</span>
                                <span className="mt-auto flex items-center justify-between pt-5 text-sm">
                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-4 w-4" aria-hidden /> {fillText(text.minutes, { n: scenario.minutes })}
                                    </span>
                                    <span className="inline-flex items-center gap-1 font-bold text-primary">
                                        {text.start} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-10 rounded-3xl border border-dashed border-border p-6">
                        <div className="font-bold text-foreground">{text.soon}</div>
                        <p className="mt-1 text-sm text-muted-foreground">{text.soonHint}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {data.families.filter((family) => !family.ready).map((family) => (
                                <span key={family.id} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{family.name}</span>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
