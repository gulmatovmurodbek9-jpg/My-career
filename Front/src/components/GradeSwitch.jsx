import React from "react";
import { useTranslation } from "react-i18next";
import { gradeText, setGrade, useGrade } from "../lib/grade";

// «Ҳама / Баъди синфи 9 / Баъди синфи 11» — дар саҳифаҳои ихтисосҳо ва донишгоҳҳо.
export default function GradeSwitch({ className = "" }) {
    const { i18n } = useTranslation();
    const grade = useGrade();
    const text = gradeText(i18n.language);
    const choices = [
        { value: null, label: text.all },
        { value: 9, label: text.g9 },
        { value: 11, label: text.g11 },
    ];

    return (
        <div className={className}>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-muted-foreground">{text.label}</span>
                <div className="inline-flex rounded-xl border border-border bg-card p-1" role="group" aria-label={text.label}>
                    {choices.map((choice) => (
                        <button
                            key={String(choice.value)}
                            type="button"
                            onClick={() => setGrade(choice.value)}
                            aria-pressed={grade === choice.value}
                            className={`rounded-lg px-3 py-1.5 text-[13px] font-bold cursor-pointer focus-ring ${
                                grade === choice.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {choice.label}
                        </button>
                    ))}
                </div>
            </div>
            {grade && (
                <p className="mt-1.5 text-[13px] text-muted-foreground">{grade === 9 ? text.hint9 : text.hint11}</p>
            )}
        </div>
    );
}
