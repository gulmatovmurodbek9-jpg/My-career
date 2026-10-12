import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Sparkles, XCircle } from "lucide-react";
import { API } from "../lib/config";
import { MMT_CLUSTERS } from "../lib/mmtClusters";
import { CERT_TEXT } from "../lib/certificate";
import { usePageMeta } from "../lib/usePageMeta";

// /cert/:code — тасдиқи сертификат (QR): воқеӣ аст ё не, ба кӣ ва кай дода шудааст.
const TEXT = {
    tj: { valid: "Сертификат воқеӣ аст", validText: "Ин сертификат дар платформаи «Ихтисоси ман» дода шудааст.", invalid: "Сертификат ёфт нашуд", invalidText: "Рамзро санҷед ё аз соҳиби сертификат пурсед.", to: "Ба", cta: "Худатон ҳам тест гузаред" },
    ru: { valid: "Сертификат подлинный", validText: "Этот сертификат выдан на платформе «Ихтисоси ман».", invalid: "Сертификат не найден", invalidText: "Проверьте код или спросите владельца сертификата.", to: "Кому", cta: "Пройдите тест сами" },
    en: { valid: "Certificate is genuine", validText: "This certificate was issued on the “Ikhtisosi man” platform.", invalid: "Certificate not found", invalidText: "Check the code or ask the certificate owner.", to: "To", cta: "Take the test yourself" },
};

export default function CertVerify() {
    const { code } = useParams();
    const { t, i18n } = useTranslation();
    const lang = ["tj", "ru", "en"].includes((i18n.language || "tj").slice(0, 2)) ? (i18n.language || "tj").slice(0, 2) : "tj";
    const text = TEXT[lang];
    const cert = CERT_TEXT[lang];
    const [data, setData] = useState(null);
    const [missing, setMissing] = useState(false);
    usePageMeta({ title: text.valid, description: text.validText, path: `/cert/${code}`, noIndex: true });

    useEffect(() => {
        axios.get(`${API}/certificates/${code}`).then(({ data: d }) => setData(d)).catch(() => setMissing(true));
    }, [code]);

    if (missing) {
        return (
            <div className="mx-auto max-w-lg px-4 py-16 text-center" data-cert-invalid>
                <XCircle className="mx-auto h-16 w-16 text-rose-500" aria-hidden />
                <h1 className="mt-3 text-2xl font-black text-foreground">{text.invalid}</h1>
                <p className="mt-1 text-muted-foreground">{text.invalidText}</p>
            </div>
        );
    }
    if (!data) return <div className="mx-auto max-w-lg px-4 py-16"><div className="h-60 animate-pulse rounded-3xl bg-muted/50" /></div>;
    const cluster = MMT_CLUSTERS.find((c) => c.key === data.topCluster);
    return (
        <div className="mx-auto max-w-lg space-y-4 px-4 pb-24 pt-10" data-cert-valid>
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                <BadgeCheck className="mx-auto h-16 w-16 text-emerald-600" aria-hidden />
                <h1 className="mt-2 text-2xl font-black text-foreground">✅ {text.valid}</h1>
                <p className="mt-1 text-[14.5px] text-muted-foreground">{text.validText}</p>
            </div>
            <div className="space-y-3 rounded-3xl border border-border bg-card p-5 text-[15px]">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">{text.to}</span><b className="text-foreground">{data.name}</b></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">{cert.date}</span><b className="text-foreground">{new Date(data.createdAt).toLocaleDateString()}</b></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">{cert.code}</span><b className="font-mono text-foreground">{data.code}</b></div>
                {cluster && <div className="flex justify-between gap-3"><span className="text-muted-foreground">{cert.direction}</span><b className="text-primary">{t(cluster.i18nKey, cluster.fallback)} · {data.percent}%</b></div>}
                {data.careers?.length > 0 && (
                    <div>
                        <div className="text-muted-foreground">{cert.careers}</div>
                        <ol className="mt-1 list-decimal pl-5 font-semibold text-foreground">{data.careers.map((c) => <li key={c.name}>{c.name}</li>)}</ol>
                    </div>
                )}
                <p className="text-[12.5px] text-muted-foreground">{cert.note}</p>
            </div>
            <Link to="/quiz" className="btn-primary w-full !py-3.5"><Sparkles className="h-5 w-5" aria-hidden /> {text.cta}</Link>
        </div>
    );
}
