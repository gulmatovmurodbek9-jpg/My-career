import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, Users, Wrench } from "lucide-react";
import { familyForCareer, fillText, langCode, plural, trialText } from "../lib/trialText";
import TrialIcon from "./TrialIcon";

// «Як рӯз дар ихтисос» дар саҳифаи ҳар ихтисос — сенарияи худи ҳамин ихтисос (8 вазифа).
// Агар ҳанӯз тайёр набошад, саҳифаи сенария худаш наздиктарини оиларо нишон медиҳад.
export default function TrialCta({ career }) {
    const { i18n } = useTranslation();
    const lang = langCode(i18n.language);
    const text = trialText(lang);
    if (!career?.id) return null;

    return (
        <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 to-indigo-500/5 p-5 sm:p-6">
            <div className="flex items-start gap-4">
                <TrialIcon family={familyForCareer(career)} size="lg" />
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black text-foreground">{text.ctaTitle}</h2>
                    <p className="mt-1 text-[15px] text-muted-foreground">{text.ctaText}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[12px] font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden /> {fillText(text.minutes, { n: 20 })}</span>
                        <span className="inline-flex items-center gap-1"><Wrench className="h-3.5 w-3.5" aria-hidden /> {plural(text.hardCount, 5, lang)}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden /> {plural(text.softCount, 3, lang)}</span>
                    </div>
                </div>
            </div>
            <Link
                to={`/trial/career/${career.id}`}
                state={{ careerName: career.nameTranslated || career.name }}
                className="btn-primary mt-4 w-full !py-3.5 sm:w-auto"
            >
                {text.ctaButton} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
        </div>
    );
}
