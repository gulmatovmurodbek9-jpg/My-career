import React from 'react';
import { TrendingUp, BrainCircuit, Loader2 } from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";

const PsychologicalProfile = ({ results, className = "" }) => {
    const { t } = useTranslation();

    if (!results) return null;

    const radarData = results.mmtClusters ? [
        { subject: 'Техникӣ', A: results.mmtClusters.c1 || 0, fullMark: 30 },
        { subject: 'Иқтисод', A: results.mmtClusters.c2 || 0, fullMark: 30 },
        { subject: 'Филология', A: results.mmtClusters.c3 || 0, fullMark: 30 },
        { subject: 'Ҷомеашиносӣ', A: results.mmtClusters.c4 || 0, fullMark: 30 },
        { subject: 'Тиб', A: results.mmtClusters.c5 || 0, fullMark: 30 },
    ] : [
        { subject: t('quiz.category.logic', 'Logic'), A: results.logic || 0, fullMark: 10 },
        { subject: t('quiz.category.creative', 'Creative'), A: results.creative || 0, fullMark: 10 },
        { subject: t('quiz.category.social', 'Social'), A: results.social || 0, fullMark: 10 },
        { subject: t('quiz.category.technical', 'Technical'), A: results.technical || 0, fullMark: 10 },
    ];

    return (
        <div className={`glass-card p-6 relative overflow-hidden ${className}`}>
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <BrainCircuit className="w-32 h-32 text-primary" />
            </div>

            <h3 className="text-lg font-black mb-6 flex items-center gap-3 uppercase tracking-tight">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t('dashboard.radar_title')}
            </h3>

            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="rgba(99, 102, 241, 0.1)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "hsl(var(--foreground))", fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        />
                        <Radar
                            name="Score"
                            dataKey="A"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            fill="var(--color-primary)"
                            fillOpacity={0.1}
                            dot={{ r: 3, fill: "var(--color-primary)" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(18, 18, 18, 0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '12px',
                            }}
                        />
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
        <div className={`glass-card p-6 flex items-center justify-center min-h-[300px] ${props.className}`}>
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Боргузорӣ...</p>
            </div>
        </div>
    }>
        <PsychologicalProfile {...props} />
    </React.Suspense>
);
