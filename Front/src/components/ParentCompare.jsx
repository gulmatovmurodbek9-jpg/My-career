import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, HeartHandshake, Target } from "lucide-react";
import { MMT_CLUSTERS, MMT_MAX } from "../lib/mmtClusters";
import { CLUSTER_KEYS, agreement, fill, parentText, topOf } from "../lib/parentSurvey";

// Муқоисаи тести фарзанд ва фикри волидайн: ду хат барои ҳар самт, мувофиқат ва маслиҳат.
export default function ParentCompare({ invite }) {
    const { t, i18n } = useTranslation();
    const text = parentText(i18n.language);
    const name = (key) => {
        const cluster = MMT_CLUSTERS.find((c) => c.key === key);
        return cluster ? t(cluster.i18nKey, cluster.fallback) : key;
    };
    const child = invite.childScores || {};
    const parent = invite.parentScores || {};
    const score = agreement(child, parent);
    const childTop = topOf(child);
    const parentTop = topOf(parent);
    const tone = score >= 70 ? "text-emerald-600 dark:text-emerald-400" : score >= 45 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";

    return (
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500"><HeartHandshake className="h-6 w-6" aria-hidden /></span>
                    <div>
                        <h2 className="text-xl font-black text-foreground">{text.compareTitle}</h2>
                        {invite.relation && <p className="text-[13px] text-muted-foreground">{text.relations[invite.relation]}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-4xl font-black tabular-nums ${tone}`}>{score}%</div>
                    <div className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{text.agreement}</div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-[12px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />{text.child}</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />{text.parent}</span>
            </div>
            <div className="mt-3 space-y-3">
                {CLUSTER_KEYS.map((key) => {
                    const a = Math.round(((Number(child[key]) || 0) / MMT_MAX) * 100);
                    const b = Math.round(((Number(parent[key]) || 0) / MMT_MAX) * 100);
                    return (
                        <div key={key}>
                            <div className="flex justify-between text-[13px]">
                                <span className={`font-semibold ${key === childTop || key === parentTop ? "text-foreground" : "text-muted-foreground"}`}>{name(key)}{invite.wish === key ? " ❤" : ""}</span>
                                <span className="tabular-nums text-muted-foreground"><b className="text-primary">{a}%</b> · <b className="text-rose-500">{b}%</b></span>
                            </div>
                            <div className="mt-1 space-y-1">
                                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${a}%` }} /></div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-rose-400" style={{ width: `${b}%` }} /></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 space-y-2 rounded-2xl bg-muted/40 p-4 text-[15px] text-foreground">
                <p className="font-semibold">{childTop === parentTop ? fill(text.same, { a: name(childTop) }) : fill(text.differ, { a: name(childTop), b: name(parentTop) })}</p>
                {invite.wish && <p>❤ {fill(text.wish, { w: name(invite.wish) })}</p>}
                {invite.wish && invite.wish !== parentTop && <p className="text-[14px] text-muted-foreground">{text.wishDiffers}</p>}
            </div>

            <div className="mt-4">
                <div className="font-bold text-foreground">{text.tipsTitle}</div>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] text-muted-foreground">
                    {text.tips.map((tip) => <li key={tip}>{tip}</li>)}
                </ol>
            </div>
            <Link to="/trial" className="btn-primary mt-5 w-full !py-3.5 sm:w-auto">
                <Target className="h-5 w-5" aria-hidden /> {text.tryTogether} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
        </section>
    );
}
