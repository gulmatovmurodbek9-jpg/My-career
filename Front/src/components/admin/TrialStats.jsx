import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API } from "../../lib/config";
import { Lightbulb } from "lucide-react";
import { FAMILY_ROLE } from "../../lib/trialText";
import TrialIcon from "../TrialIcon";

// «Як рӯз дар ихтисос» барои админ ва ҳимоя: чанд нафар санҷиданд, чӣ қадар писанд омад
// ва боварӣ ба интихоб пеш → баъд чӣ гуна тағйир ёфт.
const TEXT = {
    tj: {
        title: "Худро дар касб санҷед",
        empty: "Ҳанӯз касе сенарияро нагузаштааст. Дар пилот хонандагонро ба /trial фиристед.",
        coverage: "Сенарияҳои ихтисосҳо: {{ready}} аз {{total}} тайёр",
        careerRow: "Сенарияҳои ихтисосҳо",
        count: "Гузаштанд",
        solved: "Ҳал (миёна)",
        rating: "Писанд (аз 4)",
        liked: "Қисмҳои писандида",
        conf: "Боварӣ: пеш → баъд",
        confText: "{{up}} нафар зиёд шуд · {{down}} кам шуд · {{same}} ҳамон",
        hint: "Тағйири боварӣ ба ҳар ду тараф фоида аст: «кам шуд» — хонанда пеш аз 4 соли таҳсил фаҳмид, ки ин самт барояш нест.",
    },
    ru: {
        title: "Попробуйте себя в профессии",
        empty: "Пока никто не прошёл сценарий. На пилоте отправьте учеников на /trial.",
        coverage: "Сценарии специальностей: готово {{ready}} из {{total}}",
        careerRow: "Сценарии специальностей",
        count: "Прошли",
        solved: "Решено (в среднем)",
        rating: "Понравилось (из 4)",
        liked: "Понравившиеся части",
        conf: "Уверенность: до → после",
        confText: "выросла у {{up}} · снизилась у {{down}} · без изменений {{same}}",
        hint: "Изменение уверенности полезно в обе стороны: «снизилась» — ученик понял до 4 лет учёбы, что это направление не для него.",
    },
    en: {
        title: "Try yourself in a career",
        empty: "Nobody has completed a scenario yet. During the pilot, send students to /trial.",
        coverage: "Specialty scenarios: {{ready}} of {{total}} ready",
        careerRow: "Specialty scenarios",
        count: "Completed",
        solved: "Solved (average)",
        rating: "Liked (of 4)",
        liked: "Parts liked",
        conf: "Confidence: before → after",
        confText: "up for {{up}} · down for {{down}} · same for {{same}}",
        hint: "A change either way is useful: \"down\" means the student learned before 4 years of study that this direction is not for them.",
    },
};
const fill = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");

export default function TrialStats({ token }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = TEXT[lang] || TEXT.tj;
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        axios.get(`${API}/trial/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => setData(res.data))
            .catch(() => setData(null));
    }, [token]);

    if (!data) return null;
    const all = data.all;

    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-foreground">{text.title}</h2>
            {data.coverage?.total > 0 && (
                <div>
                    <div className="flex justify-between text-[13px] font-semibold text-muted-foreground">
                        <span>{fill(text.coverage, data.coverage)}</span>
                        <span>{Math.round((data.coverage.ready / data.coverage.total) * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(data.coverage.ready / data.coverage.total) * 100}%` }} />
                    </div>
                </div>
            )}
            {!all.count ? (
                <p className="text-sm text-muted-foreground">{text.empty}</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            [text.count, all.count],
                            [text.solved, all.solvedAverage ?? "—"],
                            [text.rating, all.rating ?? "—"],
                            [text.liked, all.likedShare != null ? `${all.likedShare}%` : "—"],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl bg-muted/40 p-3">
                                <div className="text-xl font-black text-foreground">{value}</div>
                                <div className="text-[12px] font-semibold text-muted-foreground">{label}</div>
                            </div>
                        ))}
                    </div>
                    {all.confidence.count > 0 && (
                        <div className="rounded-xl border border-border p-4">
                            <div className="text-sm font-bold text-foreground">{text.conf}</div>
                            <div className="mt-1 text-2xl font-black text-primary">{all.confidence.before} → {all.confidence.after}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{fill(text.confText, all.confidence)}</div>
                        </div>
                    )}
                    <div className="space-y-2">
                        {data.byFamily.filter((row) => row.count > 0).map((row) => (
                            <div key={row.family} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-muted/30 px-3 py-2 text-[13px]">
                                <span className="inline-flex items-center gap-2 font-bold text-foreground"><TrialIcon family={row.family} size="sm" /> {FAMILY_ROLE[row.family]?.[lang] || (row.family === "career" ? text.careerRow : row.family)}</span>
                                <span className="text-muted-foreground">{text.count}: <b className="text-foreground">{row.count}</b></span>
                                <span className="text-muted-foreground">{text.solved}: <b className="text-foreground">{row.solvedAverage ?? "—"}</b></span>
                                <span className="text-muted-foreground">{text.rating}: <b className="text-foreground">{row.rating ?? "—"}</b></span>
                                {row.confidence.count > 0 && <span className="text-muted-foreground">{text.conf}: <b className="text-foreground">{row.confidence.before} → {row.confidence.after}</b></span>}
                            </div>
                        ))}
                    </div>
                    <p className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden /> {text.hint}</p>
                </>
            )}
        </div>
    );
}
