import React from 'react';
import { Loader2 } from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";
import { MMT_CLUSTERS, MMT_MAX } from "../lib/mmtClusters";

/**
 * Нишонаи кластер дар атрофи чарх.
 *
 * Recharts барои `tick` матни SVG месозад, ва `textTransform` бо
 * `letterSpacing` дар он ҷо кор намекунанд. Номҳои тоҷикӣ дароз ҳастанд
 * («Ҷомеашиносӣ»), барои ҳамин нуқтаи чап ва рост ба тарафи худ рост карда
 * мешаванд, вагарна матн аз канори чарх мебарояд.
 */
function ClusterTick({ payload, x, y, textAnchor }) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={textAnchor}
            dominantBaseline="central"
            className="fill-muted-foreground text-[11px] font-semibold"
        >
            {payload.value}
        </text>
    );
}

function ScoreTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const point = payload[0];
    return (
        <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
            <p className="text-xs font-semibold text-foreground">{point.payload.subject}</p>
            <p className="text-sm font-bold text-primary">
                {point.value} / {point.payload.fullMark}
            </p>
        </div>
    );
}

const PsychologicalProfile = ({ results, className = "" }) => {
    const { t } = useTranslation();

    if (!results) return null;

    const radarData = results.mmtClusters
        ? MMT_CLUSTERS.map((cluster) => ({
              subject: t(cluster.i18nKey, cluster.fallback),
              A: results.mmtClusters[cluster.key] || 0,
              fullMark: MMT_MAX,
          }))
        : [
              { subject: t('quiz.category.logic', 'Logic'), A: results.logic || 0, fullMark: 10 },
              { subject: t('quiz.category.creative', 'Creative'), A: results.creative || 0, fullMark: 10 },
              { subject: t('quiz.category.social', 'Social'), A: results.social || 0, fullMark: 10 },
              { subject: t('quiz.category.technical', 'Technical'), A: results.technical || 0, fullMark: 10 },
          ];

    const max = radarData[0]?.fullMark ?? MMT_MAX;

    return (
        <div className={`glass-card flex flex-col p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-foreground">
                {t('dashboard.radar_title')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
                {t('dashboard.radar_hint', 'Хол аз рӯи ҷавобҳои саволномаи шумо')}
            </p>

            {/*
              Баландӣ 220px буд ва чарх 80% -и онро мегирифт, аз ин рӯ дар нимаи
              рости корт ҷои холӣ мемонд ва нишонаҳо ба ҳам мечаспиданд.
            */}
            <div className="mt-4 min-h-[280px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="52%" outerRadius="72%" data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={<ClusterTick />} />
                        {/* Бе миқёс чарх танҳо шакл аст; хонанда намедонад 12 аз чанд аст. */}
                        <PolarRadiusAxis
                            domain={[0, max]}
                            tickCount={4}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                            axisLine={false}
                        />
                        <Radar
                            name="Score"
                            dataKey="A"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            fill="var(--color-primary)"
                            fillOpacity={0.16}
                            dot={{ r: 3, fill: "var(--color-primary)", strokeWidth: 0 }}
                        />
                        <Tooltip content={<ScoreTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PsychologicalProfile;

// LazySuspense wrapper for lazy loading
export const LazyPsychologicalProfile = (props) => (
    <React.Suspense fallback={
        <div className={`glass-card flex min-h-[360px] items-center justify-center p-6 ${props.className}`}>
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
    }>
        <PsychologicalProfile {...props} />
    </React.Suspense>
);
