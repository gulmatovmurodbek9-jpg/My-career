import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Award, Download, Loader2, Printer, Send } from "lucide-react";
import { API } from "../lib/config";
import { useAuthStore } from "../store/authStore";
import { drawCertificate } from "../lib/certificate";
import { MMT_CLUSTERS } from "../lib/mmtClusters";
import { canvasToBlob, downloadBlob, shareOrDownload } from "../lib/shareCard";

// Дар натиҷаи тест: «🎓 Сертификат гиред» — ном → сертификати A4 бо QR (тасдиқ дар /cert/:code).
const TEXT = {
    tj: { button: "🎓 Сертификат гиред", lead: "Сертификати зебо бо самт, 3 ихтисос ва QR барои тасдиқ — ба волидайн ва мактаб нишон диҳед.", name: "Ному насаби шумо", create: "Сохтан", download: "Боргирӣ (PNG)", print: "Чоп / PDF", share: "Фиристодан", error: "Сертификат сохта нашуд." },
    ru: { button: "🎓 Получить сертификат", lead: "Красивый сертификат с направлением, 3 специальностями и QR для проверки — покажите родителям и в школе.", name: "Ваше имя и фамилия", create: "Создать", download: "Скачать (PNG)", print: "Печать / PDF", share: "Отправить", error: "Не удалось создать сертификат." },
    en: { button: "🎓 Get a certificate", lead: "A nice certificate with your direction, 3 specialties and a QR code to verify — show it to parents and school.", name: "Your full name", create: "Create", download: "Download (PNG)", print: "Print / PDF", share: "Share", error: "Could not create the certificate." },
};

// Касбҳои санҷидашуда аз браузер (trial_history_v1): «мувофиқ» — агар нисфи вазифаҳо писанд омад.
const readTrials = () => {
    try {
        return (JSON.parse(localStorage.getItem("trial_history_v1")) || []).slice(0, 4)
            .map((t) => ({ name: t.name, fit: Number(t.liked) >= Number(t.total) / 2 })).filter((t) => t.name);
    } catch { return []; }
};

export default function CertificateButton({ scores, careers = [] }) {
    const { t, i18n } = useTranslation();
    const topKey = Object.entries(scores || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCluster = MMT_CLUSTERS.find((c) => c.key === topKey);
    const directionLabel = topCluster ? t(topCluster.i18nKey, topCluster.fallback) : "—";
    const lang = ["tj", "ru", "en"].includes((i18n.language || "tj").slice(0, 2)) ? (i18n.language || "tj").slice(0, 2) : "tj";
    const text = TEXT[lang];
    const { user, token } = useAuthStore();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [cert, setCert] = useState(null); // { canvas, url, code }

    const create = async () => {
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(`${API}/certificates`, { name: name.trim(), scores, careers, trials: readTrials(), lang }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
            const canvas = await drawCertificate({ code: data.code, name: data.name, createdAt: data.createdAt, directionLabel, percent: data.percent, careers: data.careers, trials: data.trials, lang });
            setCert({ canvas, url: canvas.toDataURL("image/png"), code: data.code });
        } catch (err) {
            setError(err.response?.data?.message || text.error);
        } finally {
            setBusy(false);
        }
    };
    const download = async () => downloadBlob(await canvasToBlob(cert.canvas), `sertifikat-${cert.code}.png`);
    const print = () => {
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`<!doctype html><title>Sertifikat ${cert.code}</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0}img{width:100%;display:block}</style><img src="${cert.url}" onload="setTimeout(()=>print(),300)">`);
        win.document.close();
    };

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)} data-cert-open
                className="flex w-full items-center gap-4 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-5 text-left transition hover:border-amber-500 cursor-pointer">
                <Award className="h-9 w-9 shrink-0 text-amber-500" aria-hidden />
                <span>
                    <span className="block text-lg font-black text-foreground">{text.button}</span>
                    <span className="block text-[14px] text-muted-foreground">{text.lead}</span>
                </span>
            </button>
        );
    }
    return (
        <section className="space-y-4 rounded-3xl border border-amber-500/30 bg-card p-5" data-cert>
            <h2 className="flex items-center gap-2 text-xl font-black text-foreground"><Award className="h-6 w-6 text-amber-500" aria-hidden /> {text.button.replace("🎓 ", "")}</h2>
            {!cert ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                    <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder={text.name} aria-label={text.name} data-cert-name
                        className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus-ring" />
                    <button type="button" onClick={create} disabled={busy || name.trim().length < 2} className="btn-primary !py-3 disabled:opacity-50" data-cert-create>
                        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : text.create}
                    </button>
                </div>
            ) : (
                <>
                    <img src={cert.url} alt={text.button} className="w-full rounded-2xl border border-border shadow-lg" data-cert-image />
                    <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={download} className="btn-secondary flex items-center justify-center gap-1.5 !py-3 text-[14px]"><Download className="h-4 w-4" aria-hidden /> {text.download}</button>
                        <button type="button" onClick={print} className="btn-secondary flex items-center justify-center gap-1.5 !py-3 text-[14px]"><Printer className="h-4 w-4" aria-hidden /> {text.print}</button>
                        <button type="button" onClick={() => shareOrDownload(cert.canvas, `sertifikat-${cert.code}.png`, `${window.location.origin}/cert/${cert.code}`)} className="btn-primary flex items-center justify-center gap-1.5 !py-3 text-[14px]"><Send className="h-4 w-4" aria-hidden /> {text.share}</button>
                    </div>
                </>
            )}
            {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        </section>
    );
}
