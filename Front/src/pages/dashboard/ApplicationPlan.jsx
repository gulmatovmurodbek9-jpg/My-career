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
import { currentApiLang } from "../../lib/apiLang";

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
     * Боргирии рӯйхат ҳамчун PDF.
     *
     * Шрифтҳои стандартии PDF (Helvetica ва ғайра) кириллро умуман надоранд:
     * бо онҳо ба ҷои ҳар ҳарфи тоҷикӣ мураббаъ мебарояд. Барои ҳамин DejaVu
     * Sans дохил карда мешавад — санҷида шуд, ки ғ ӣ қ ӯ ҳ ҷ ҳамаашон дар
     * он ҳастанд.
     *
     * Ду файли шрифт (оддӣ ва bold) якҷо 1,4 МБ мешаванд, аз ин рӯ на ба
     * бандли асосӣ дохил мешаванд ва на ҳангоми кушодани саҳифа бор
     * мегарданд: онҳо ва худи китобхонаи jsPDF танҳо пас аз пахши тугма
     * гирифта мешаванд.
     */
    const [downloading, setDownloading] = useState(false);

    const downloadPlan = async () => {
        setDownloading(true);
        try {
            const [{ jsPDF }, autoTableModule, regularUrl, boldUrl] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable"),
                import("../../assets/fonts/DejaVuSans.ttf?url").then((m) => m.default),
                import("../../assets/fonts/DejaVuSans-Bold.ttf?url").then((m) => m.default),
            ]);
            const autoTable = autoTableModule.default;

            /* Порча-порча, вагарна `String.fromCharCode(...)` бо массиви
               720 000-элемента стекро мешиканад. */
            const toBase64 = async (url) => {
                const buffer = await (await fetch(url)).arrayBuffer();
                const bytes = new Uint8Array(buffer);
                let binary = "";
                for (let i = 0; i < bytes.length; i += 8192) {
                    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
                }
                return btoa(binary);
            };

            const [regular, bold] = await Promise.all([toBase64(regularUrl), toBase64(boldUrl)]);

            const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
            doc.addFileToVFS("DejaVuSans.ttf", regular);
            doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
            /* Шрифти bold ҳатмист: autoTable сарлавҳаро bold мекашад ва агар
               ин навъ набошад, ба шрифти стандартии PDF бармегардад — он
               кириллро надорад ва сарлавҳа мураббаъ мешавад. */
            doc.addFileToVFS("DejaVuSans-Bold.ttf", bold);
            doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
            doc.setFont("DejaVu", "normal");

            const today = new Date().toLocaleDateString("ru-RU");

            doc.setFontSize(16);
            doc.text("Рӯйхати ҳуҷҷатсупорӣ", 40, 44);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(
                `${items.length} интихоб · ${freeCount} ҷои ройгон · ${today}`,
                40,
                62,
            );
            if (cluster) {
                doc.text(`Кластери ${cluster.number} — ${cluster.name}`, 40, 78);
            }

            autoTable(doc, {
                startY: cluster ? 94 : 78,
                head: [["№", "Код", "Ихтисос", "Донишгоҳ", "Шакл", "Ҷой", "Нарх"]],
                body: items.map((item) => [
                    item.order,
                    item.code,
                    item.careerName,
                    [item.universityName, item.city].filter(Boolean).join("\n"),
                    item.studyForm,
                    [item.paymentType, item.seats > 0 ? `${item.seats} ҷой` : null]
                        .filter(Boolean)
                        .join("\n"),
                    item.isFree
                        ? "—"
                        : money(item.tuitionFee)
                            ? `${money(item.tuitionFee)} сом.`
                            : "—",
                ]),
                /* Ҳар се ҷой шрифт бояд зикр шавад: сарлавҳа ва бадана
                   стилҳои алоҳида доранд ва ба styles барнамегарданд. */
                styles: { font: "DejaVu", fontSize: 9, cellPadding: 5, valign: "middle" },
                headStyles: { font: "DejaVu", fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
                bodyStyles: { font: "DejaVu" },
                alternateRowStyles: { fillColor: [246, 248, 252] },
                columnStyles: {
                    0: { cellWidth: 26, halign: "center", textColor: 130 },
                    1: { cellWidth: 78 },
                    3: { cellWidth: 210 },
                    6: { halign: "right" },
                },
                margin: { left: 40, right: 40 },
            });

            doc.setFontSize(8);
            doc.setTextColor(120);
            const afterTable = doc.lastAutoTable.finalY + 18;
            /*
             * Ҳуҷҷат ҳамеша тоҷикист, ҳатто вақте интерфейс русӣ ё англисӣ
             * бошад.
             *
             * Онро ба ММТ ва донишгоҳ мебаранд: номи ихтисос ва код бояд
             * айнан ҳамон бошанд, ки дар китобчаи расмӣ ҳастанд. Варақаи
             * русӣ бо номҳои тарҷумашуда дар қабул кор намекунад — барои
             * ҳамин сабабашро ҳамин ҷо менависем, то корбар ҳайрон нашавад.
             */
            if (currentApiLang()) {
                doc.text(
                    "Ҳуҷҷат бо забони тоҷикӣ аст: номи ихтисос ва код бояд бо китобчаи расмии ММТ мувофиқ бошанд.",
                    40,
                    afterTable,
                );
            }

            const noteY = currentApiLang() ? afterTable + 12 : afterTable;
            doc.text(
                "Нархҳо ва шумораи ҷойҳо аз маълумоти мавҷудаи мо гирифта шудаанд ва метавонанд тағйир ёбанд.",
                40,
                noteY,
            );
            doc.text(
                "Пеш аз супоридани ҳуҷҷат онҳоро дар худи донишгоҳ тасдиқ кунед.",
                40,
                noteY + 12,
            );

            doc.save(`ruyhati-hujjatsupori-${new Date().toISOString().slice(0, 10)}.pdf`);
            showSuccess("PDF боргирӣ шуд");
        } catch (err) {
            console.error("PDF:", err);
            showError("PDF сохта нашуд");
        } finally {
            setDownloading(false);
        }
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
                                disabled={downloading}
                                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                            >
                                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                {downloading ? "Тайёр мешавад…" : "Боргирии PDF"}
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
                    {/* Услуб рост ба `Link` меравад, на ба тугмаи дохилӣ.
                        `.btn-primary` `display: flex` аст — яъне блокӣ, ва дар
                        дохили `<a>`-и сатрӣ он `text-center`-и волидро нодида
                        мегирифт ва ба канори чап мечаспид. */}
                    <Link
                        to="/careers"
                        className="btn-primary mt-6 inline-flex !px-6 !py-3 !text-sm !rounded-xl cursor-pointer"
                    >
                        <GraduationCap className="h-4 w-4" />
                        Ихтисосҳоро дидан
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
