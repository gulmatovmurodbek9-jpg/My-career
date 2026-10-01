import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { ExternalLink, TrendingUp } from "lucide-react";
import { API } from "../lib/config";
import { withLang } from "../lib/apiLang";
import { paymentTypeLabel } from "../lib/offeringLabels";

// Балҳои гузариши расмии Маркази миллии тестӣ — панҷ соли охир.
export default function AdmissionScores({ careerId }) {
    const { t, i18n } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!careerId) return undefined;
        let alive = true;
        setLoading(true);
        axios
            .get(`${API}/careers/${careerId}/scores`, { params: withLang(), timeout: 15000 })
            .then((response) => { if (alive) setData(response.data); })
            .catch(() => { if (alive) setData(null); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [careerId, i18n.language]);

    if (loading) {
        return <div className="h-32 animate-pulse rounded-xl bg-muted/50" />;
    }
    if (!data?.years?.length) {
        return (
            <p className="text-sm text-muted-foreground">
                {t("scores.empty", "Барои ин ихтисос дар портали НМТ бали гузариш нашр нашудааст.")}
            </p>
        );
    }

    const years = data.years;
    const peak = Math.max(...years.map((y) => y.maxScore ?? 0), 1);
    const first = years[0];
    const last = years[years.length - 1];
    const drift = first.avgScore && last.avgScore
        ? Math.round((last.avgScore - first.avgScore) * 10) / 10
        : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                <div>
                    <div className="text-3xl font-extrabold tabular-nums text-foreground">
                        {last.minScore}<span className="text-muted-foreground"> – </span>{last.maxScore}
                    </div>
                    <div className="text-[13px] text-muted-foreground">
                        {t("scores.last_year", "бали гузариш дар {{year}}", { year: last.year })}
                    </div>
                </div>
                {drift !== null && (
                    <div>
                        <div className={`text-xl font-bold tabular-nums ${drift >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {drift > 0 ? "+" : ""}{drift}
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                            {t("scores.drift", "тағйир аз {{year}}", { year: first.year })}
                        </div>
                    </div>
                )}
                {last.maxCompetition != null && (
                    <div>
                        <div className="flex items-center gap-1.5 text-xl font-bold tabular-nums text-foreground">
                            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
                            {last.maxCompetition}
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                            {t("scores.competition", "довталаб ба як ҷой")}
                        </div>
                    </div>
                )}
            </div>

            {/* Сутунҳо: баландӣ — бали миёна, хати дарунӣ — аз кам то зиёд. */}
            <div className="flex items-end justify-between gap-2 sm:gap-4">
                {years.map((year) => {
                    const height = Math.max(8, Math.round(((year.avgScore ?? 0) / peak) * 100));
                    return (
                        <div key={year.year} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                            <span className="text-[12px] font-semibold tabular-nums text-foreground">
                                {year.avgScore ?? "—"}
                            </span>
                            <div className="flex h-28 w-full items-end justify-center">
                                <div
                                    className="w-full max-w-[3rem] rounded-t-[0.5rem] bg-gradient-to-t from-primary/70 to-primary"
                                    style={{ height: `${height}%` }}
                                    title={`${year.minScore} – ${year.maxScore}`}
                                />
                            </div>
                            <span className="text-[12px] tabular-nums text-muted-foreground">{year.year}</span>
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                                {year.seats} {t("scores.seats_short", "ҷой")}
                            </span>
                        </div>
                    );
                })}
            </div>

            {data.universities?.length > 0 && (
                <div>
                    <h4 className="mb-3 text-[15px] font-bold text-foreground">
                        {t("scores.by_uni", "Донишгоҳҳо дар соли {{year}}", { year: data.lastYear })}
                    </h4>
                    <div className="overflow-hidden rounded-[0.75rem] border border-border">
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-muted/60 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 font-semibold">{t("scores.th_uni", "Донишгоҳ")}</th>
                                    <th className="px-3 py-2 text-right font-semibold">{t("scores.th_score", "Бал")}</th>
                                    <th className="hidden px-3 py-2 text-right font-semibold sm:table-cell">{t("scores.th_seats", "Ҷой")}</th>
                                    <th className="hidden px-3 py-2 text-right font-semibold sm:table-cell">{t("scores.th_pay", "Шакл")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.universities.slice(0, 12).map((row, index) => (
                                    <tr key={index} className="border-t border-border">
                                        <td className="px-3 py-2 text-foreground">{row.university}</td>
                                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-foreground">
                                            {row.score ?? "—"}
                                        </td>
                                        <td className="hidden px-3 py-2 text-right tabular-nums text-muted-foreground sm:table-cell">
                                            {row.seats ?? "—"}
                                        </td>
                                        <td className="hidden px-3 py-2 text-right text-muted-foreground sm:table-cell">
                                            {paymentTypeLabel(t, row.paymentType) ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <a
                href={data.source?.url || "https://stat.ntc.tj/"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground underline-offset-2 hover:underline focus-ring"
            >
                {t("scores.source", "Манбаъ: {{name}}", { name: t("scores.ntc", "Маркази миллии тестӣ") })}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
        </div>
    );
}
