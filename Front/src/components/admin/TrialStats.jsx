import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API } from "../../lib/config";
import { FAMILY_ROLE } from "../../lib/trialText";

// «Як рӯз дар ихтисос» барои админ ва ҳимоя: чанд нафар санҷиданд, чӣ қадар писанд омад
// ва боварӣ ба интихоб пеш → баъд чӣ гуна тағйир ёфт.
const TEXT = {
    tj: {
        title: "Як рӯз дар ихтисос",
        empty: "Ҳанӯз касе сенарияро нагузаштааст. Дар пилот хонандагонро ба /trial фиристед.",
        count: "Гузаштанд",
        solved: "Ҳал (аз 3)",
        rating: "Писанд (аз 4)",
        liked: "Қисмҳои писандида",
        conf: "Боварӣ: пеш → баъд",
        confText: "{{up}} нафар зиёд шуд · {{down}} кам шуд · {{same}} ҳамон",
        hint: "Тағйири боварӣ ба ҳар ду тараф фоида аст: «кам шуд» — хонанда пеш аз 4 соли таҳсил фаҳмид, ки ин самт барояш нест.",
    },
    ru: {
        title: "День в профессии",
        empty: "Пока никто не прошёл сценарий. На пилоте отправьте учеников на /trial.",
        count: "Прошли",
        solved: "Решено (из 3)",
        rating: "Понравилось (из 4)",
        liked: "Понравившиеся части",
        conf: "Уверенность: до → после",
        confText: "выросла у {{up}} · снизилась у {{down}} · без изменений {{same}}",
        hint: "Изменение уверенности полезно в обе стороны: «снизилась» — ученик понял до 4 лет учёбы, что это направление не для него.",
    },
    en: {
        title: "A day in the job",
        empty: "Nobody has completed a scenario yet. During the pilot, send students to /trial.",
        count: "Completed",
        solved: "Solved (of 3)",
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
                                <span className="font-bold text-foreground">{FAMILY_ROLE[row.family]?.icon} {FAMILY_ROLE[row.family]?.[lang] || row.family}</span>
                                <span className="text-muted-foreground">{text.count}: <b className="text-foreground">{row.count}</b></span>
                                <span className="text-muted-foreground">{text.solved}: <b className="text-foreground">{row.solvedAverage ?? "—"}</b></span>
                                <span className="text-muted-foreground">{text.rating}: <b className="text-foreground">{row.rating ?? "—"}</b></span>
                                {row.confidence.count > 0 && <span className="text-muted-foreground">{text.conf}: <b className="text-foreground">{row.confidence.before} → {row.confidence.after}</b></span>}
                            </div>
                        ))}
                    </div>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">💡 {text.hint}</p>
                </>
            )}
        </div>
    );
}
