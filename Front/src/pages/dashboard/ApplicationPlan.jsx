import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Printer,
    Download,
    Trash2,
    Loader2,
    AlertCircle,
    FileText,
    GraduationCap,
    Layers,
} from "lucide-react";
import { Link } from "react-router";
import axios from "axios";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../components/toast/ToastProvider";

const money = (value) =>
    value === null || value === undefined
        ? null
        : new Intl.NumberFormat("ru-RU").format(value);

/*
 * Рӯйхати ҳуҷҷатсупорӣ.
 *
 * Ҳар сатр як интихоби воқеӣ аст: ихтисос + донишгоҳ + шакли таҳсил +
 * ройгон/пулакӣ. Тартибро сервер медиҳад — аввал ҷойҳои ройгон — ва саҳифа
 * онро тағйир намедиҳад, то он чи дар экран аст, айнан ҳамон бошад, ки
 * дар PDF мебарояд.
 */
const ApplicationPlan = () => {
    const { token } = useAuthStore();
    const { error: showError, success: showSuccess } = useToast();

    const [plan, setPlan] = useState({ cluster: null, items: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        if (!token) return;
        try {
            const { data } = await axios.get(`${API}/users/application-plan`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPlan(data);
        } catch (err) {
            setError(err.response?.data?.message || "Рӯйхат бор нашуд");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        load();
    }, [load]);

    const removeItem = async (offeringId) => {
        setBusyId(offeringId);
        try {
            await axios.delete(`${API}/users/application-plan/${offeringId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await load();
        } catch (err) {
            showError(err.response?.data?.message || "Бароварда нашуд");
        } finally {
            setBusyId(null);
        }
    };

    const clearAll = async () => {
        setBusyId("all");
        try {
            await axios.delete(`${API}/users/application-plan`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            await load();
            showSuccess("Рӯйхат тоза шуд");
        } catch (err) {
            showError(err.response?.data?.message || "Тоза нашуд");
        } finally {
            setBusyId(null);
        }
    };

    /*
     * Боргирии рӯйхат ба файл.
     *
     * Чоп воқеан PDF медиҳад (браузер «Save as PDF» дорад), вале он ҳамеша
     * пеш аз худ равзанаи чопро мекушояд ва интернет лозим аст, то саҳифа
     * кушода бошад. Ин ҷо як ҳуҷҷати мустақил сохта мешавад: файл дар
     * компютер мемонад, бе сервер кушода мешавад ва аз он ҷо низ чоп кардан
     * мумкин аст.
     *
     * HTML аст, на PDF-и сохташуда дар браузер: ҳарфҳои ғ ӣ қ ӯ ҳ ҷ дар
     * китобхонаҳои PDF шрифти алоҳидаи дарунсохт талаб мекунанд, ва агар он
     * нарасад, ба ҷои ҳарф мураббаъ мебарояд. Ин хатар дар намоиш ҷои худро
     * надорад.
     */
    const escapeHtml = (value) =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    const downloadPlan = () => {
        const today = new Date().toLocaleDateString("ru-RU");
        const rows = items
            .map((item) => `
        <tr>
          <td class="num">${item.order}</td>
          <td class="code">${escapeHtml(item.code)}</td>
          <td><strong>${escapeHtml(item.careerName)}</strong></td>
          <td>${escapeHtml(item.universityName)}${item.city ? `<div class="dim">${escapeHtml(item.city)}</div>` : ""}</td>
          <td>${escapeHtml(item.studyForm)}</td>
          <td><span class="${item.isFree ? "free" : "paid"}">${escapeHtml(item.paymentType)}</span>${item.seats > 0 ? `<div class="dim">${item.seats} ҷой</div>` : ""}</td>
          <td class="price">${item.isFree ? "—" : money(item.tuitionFee) ? `${money(item.tuitionFee)} сом.` : "—"}</td>
        </tr>`)
            .join("");

        const html = `<!doctype html>
<html lang="tg">
<head>
<meta charset="utf-8">
<title>Рӯйхати ҳуҷҷатсупорӣ</title>
<style>
  body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #0f172a; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #64748b; font-size: 13px; margin: 0 0 4px; }
  .cluster { display: inline-block; margin: 10px 0 18px; padding: 5px 12px; border-radius: 999px;
             background: #eef2ff; color: #3730a3; font-size: 13px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
       color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 0 8px 8px 0; }
  td { padding: 10px 8px 10px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .num { color: #94a3b8; width: 28px; }
  .code { font-family: Consolas, monospace; color: #64748b; white-space: nowrap; }
  .dim { color: #94a3b8; font-size: 12px; margin-top: 2px; }
  .price { white-space: nowrap; font-weight: 700; }
  .free { color: #047857; font-weight: 700; }
  .paid { color: #475569; font-weight: 700; }
  footer { margin-top: 22px; color: #64748b; font-size: 12px; line-height: 1.6; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <h1>Рӯйхати ҳуҷҷатсупорӣ</h1>
  <p class="sub">${items.length} интихоб · ${freeCount} ҷои ройгон · ${today}</p>
  ${cluster ? `<div class="cluster">Кластери ${cluster.number} — ${escapeHtml(cluster.name)}</div>` : ""}
  <table>
    <thead>
      <tr><th>№</th><th>Код</th><th>Ихтисос</th><th>Донишгоҳ</th><th>Шакл</th><th>Ҷой</th><th>Нарх</th></tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
  <footer>
    Нархҳо ва шумораи ҷойҳо аз маълумоти мавҷудаи мо гирифта шудаанд ва метавонанд тағйир ёбанд.<br>
    Пеш аз супоридани ҳуҷҷат онҳоро дар худи донишгоҳ тасдиқ кунед.
  </footer>
</body>
</html>`;

        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ruyhati-hujjatsupori-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        /* Браузер файлро дарҳол намехонад — URL-ро зуд озод кардан боргириро
           дар баъзе браузерҳо канда мекунад. */
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showSuccess("Файл боргирӣ шуд");
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const { cluster, items } = plan;
    const freeCount = items.filter((item) => item.isFree).length;

    return (
        <div className="pb-20">
            {/* Сарлавҳа — ҳангоми чоп намоён намешавад */}
            <header className="print:hidden">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Бозгашт ба панел
                </Link>

                <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter md:text-3xl">
                            Рӯйхати ҳуҷҷатсупорӣ
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {items.length
                                ? `${items.length} интихоб · ${freeCount} ҷои ройгон`
                                : "Ҳанӯз ягон интихоб нест"}
                        </p>
                    </div>

                    {items.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="btn-primary !px-5 !py-3 !text-sm !rounded-xl cursor-pointer"
                            >
                                <Printer className="h-4 w-4" />
                                Чоп / PDF
                            </button>
                            <button
                                type="button"
                                onClick={downloadPlan}
                                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                                <Download className="h-4 w-4" />
                                Боргирӣ
                            </button>
                            <button
                                type="button"
                                onClick={clearAll}
                                disabled={busyId === "all"}
                                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                            >
                                {busyId === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Тоза кардан
                            </button>
                        </div>
                    )}
                </div>

                {cluster && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                        <Layers className="h-4 w-4" />
                        Кластери {cluster.number} — {cluster.name}
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {error}
                    </div>
                )}
            </header>

            {/* Сарлавҳаи танҳо барои чоп */}
            <div className="hidden print:block">
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Рӯйхати ҳуҷҷатсупорӣ</h1>
                {cluster && (
                    <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                        Кластери {cluster.number} — {cluster.name}
                    </p>
                )}
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555" }}>
                    Ихтисоси ман · {new Date().toLocaleDateString("ru-RU")}
                </p>
            </div>

            {items.length === 0 ? (
                <div className="glass-card mt-8 p-12 text-center print:hidden">
                    <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <FileText className="h-8 w-8 text-primary" />
                    </span>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Рӯйхат холист</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                        Ба саҳифаи ихтисос гузаред, донишгоҳ ва намуди ҷойро интихоб кунед — онҳо ин ҷо
                        ҷамъ мешаванд ва шумо метавонед рӯйхатро чоп кунед.
                    </p>
                    <Link to="/careers">
                        <button className="btn-primary mt-6 !px-6 !py-3 !text-sm !rounded-xl cursor-pointer">
                            <GraduationCap className="h-4 w-4" />
                            Ихтисосҳоро дидан
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-border text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                                <th className="py-3 pr-3">№</th>
                                <th className="py-3 pr-3">Код</th>
                                <th className="py-3 pr-3">Ихтисос</th>
                                <th className="py-3 pr-3">Донишгоҳ</th>
                                <th className="py-3 pr-3">Шакл</th>
                                <th className="py-3 pr-3">Ҷой</th>
                                <th className="py-3 pr-3 text-right">Нарх</th>
                                <th className="py-3 print:hidden" />
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <motion.tr
                                    key={item.offeringId}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border-b border-border/60 align-top"
                                >
                                    <td className="py-3 pr-3 font-bold tabular-nums text-muted-foreground">
                                        {item.order}
                                    </td>
                                    <td className="py-3 pr-3 font-mono text-xs tabular-nums">{item.code}</td>
                                    <td className="py-3 pr-3 font-semibold text-foreground">{item.careerName}</td>
                                    <td className="py-3 pr-3">
                                        <div className="text-foreground">
                                            {item.universityShortName || item.universityName}
                                        </div>
                                        {item.city && (
                                            <div className="text-xs text-muted-foreground">{item.city}</div>
                                        )}
                                    </td>
                                    <td className="py-3 pr-3 text-muted-foreground">{item.studyForm}</td>
                                    <td className="py-3 pr-3">
                                        <span
                                            className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${item.isFree
                                                ? "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"
                                                : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {item.paymentType}
                                        </span>
                                        {item.seats > 0 && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {item.seats} ҷой
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 pr-3 text-right tabular-nums">
                                        {item.isFree ? "—" : money(item.tuitionFee) ? `${money(item.tuitionFee)} сом.` : "—"}
                                    </td>
                                    <td className="py-3 text-right print:hidden">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.offeringId)}
                                            disabled={busyId === item.offeringId}
                                            aria-label="Баровардан"
                                            className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                                        >
                                            {busyId === item.offeringId
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <Trash2 className="h-4 w-4" />}
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>

                    <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                        Нархҳо ва шумораи ҷойҳо аз маълумоти мавҷудаи мо гирифта шудаанд ва метавонанд
                        тағйир ёбанд. Пеш аз супоридани ҳуҷҷат онҳоро дар худи донишгоҳ тасдиқ кунед.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ApplicationPlan;
