import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { langCode, trialText } from "../lib/trialText";
import { DayTimeline, ProsCons } from "../pages/trial/TrialParts";

// Дар саҳифаи ихтисос: «Як рӯзи корӣ» ва ҷиҳатҳои мусбат/манфӣ аз сенарияи ҳамин ихтисос —
// ҳамон компонентҳои «Як рӯз дар ихтисос». Матни беназир барои ҳар ихтисос (ва барои Google).
export default function TrialPreview({ trial, careerId }) {
    const { i18n } = useTranslation();
    const text = trialText(langCode(i18n.language));
    if (!trial?.day?.length && !trial?.pros?.length) return null;
    return (
        <div className="space-y-4">
            <DayTimeline day={trial.day} text={text} />
            {trial.pros?.length > 0 && <ProsCons scenario={trial} text={text} />}
            <Link to={`/trial/career/${careerId}`} className="btn-primary w-full !py-3.5 sm:w-auto">
                {text.ctaButton} — {text.ctaTitle} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
        </div>
    );
}
