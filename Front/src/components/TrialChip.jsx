import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Target } from "lucide-react";
import { familyForCareer, langCode, trialText } from "../lib/trialText";

// Тугмаи хурди «Як рӯз дар ихтисос» дар корти ихтисос. Корт худаш <Link> аст,
// бинобар ин <a>-и дохилӣ мумкин нест — тугма клики кортро боз медорад.
export default function TrialChip({ specialty, className = "" }) {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const text = trialText(langCode(i18n.language));
    const family = familyForCareer(specialty);
    if (!family) return null;

    const open = (event) => {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/trial/${family}?career=${specialty.id}`, {
            state: { careerName: specialty.nameTranslated || specialty.name },
        });
    };

    return (
        <button
            type="button"
            onClick={open}
            title={text.ctaTitle}
            className={`z-20 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary transition hover:bg-primary hover:text-primary-foreground cursor-pointer ${className}`}
        >
            <Target className="h-3.5 w-3.5" aria-hidden /> {text.name}
        </button>
    );
}
