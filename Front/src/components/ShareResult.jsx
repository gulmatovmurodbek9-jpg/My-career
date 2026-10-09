import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Download, Loader2, Share2, X } from "lucide-react";
import { canvasToBlob, CARD_COLORS, CARD_LINK, CLUSTER_GRADIENT, downloadBlob, drawShareCard, shareOrDownload } from "../lib/shareCard";

// «📤 Натиҷаро фиристед»: пешнамоиши корт, андоза (Story / мураббаъ), номи ихтиёрӣ,
// «Фиристодан» (менюи телефон) ва «Боргирӣ».
const TEXT = {
    tj: { button: "Натиҷаро фиристед", title: "Корти натиҷа", story: "Story", square: "Мураббаъ", name: "Номи шумо (ихтиёрӣ)", color: "Ранг", auto: "Ранги самт", share: "Фиристодан", download: "Боргирӣ", hint: "Ба Telegram, Instagram Story ё ба гурӯҳи синф фиристед — дӯстонатон ҳам бисанҷанд.", done: "Тасвир боргирӣ шуд — онро аз галерея фиристед.", close: "Пӯшидан", shareText: "Натиҷаи ман дар «Ихтисоси ман» — ту ҳам бисанҷ:" },
    ru: { button: "Поделиться результатом", title: "Карточка результата", story: "Story", square: "Квадрат", name: "Ваше имя (необязательно)", color: "Цвет", auto: "Цвет направления", share: "Поделиться", download: "Скачать", hint: "Отправьте в Telegram, Instagram Story или в группу класса — пусть друзья тоже попробуют.", done: "Картинка скачана — отправьте её из галереи.", close: "Закрыть", shareText: "Мой результат в «Ихтисоси ман» — попробуй и ты:" },
    en: { button: "Share your result", title: "Result card", story: "Story", square: "Square", name: "Your name (optional)", color: "Color", auto: "Direction color", share: "Share", download: "Download", hint: "Send it to Telegram, an Instagram Story or your class group — let friends try too.", done: "Image downloaded — send it from your gallery.", close: "Close", shareText: "My result on “Ikhtisosi man” — try it too:" },
};

export default function ShareResult({ card, className = "", variant = "primary" }) {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = TEXT[lang] || TEXT.tj;
    const [open, setOpen] = useState(false);
    const [size, setSize] = useState("story");
    const [name, setName] = useState("");
    const [color, setColor] = useState(() => { try { return localStorage.getItem("card_color") || "auto"; } catch { return "auto"; } });
    const [preview, setPreview] = useState("");
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState("");
    const canvasRef = useRef(null);
    // Объекти card ҳар render нав аст — аз рӯи мазмун муқоиса мекунем.
    const cardKey = JSON.stringify(card);

    useEffect(() => {
        if (!open) return undefined;
        let alive = true;
        const timer = setTimeout(async () => {
            const canvas = await drawShareCard({ ...JSON.parse(cardKey), size, lang, name: name.trim(), color: color === "auto" ? undefined : color });
            if (!alive) return;
            canvasRef.current = canvas;
            setPreview(canvas.toDataURL("image/png"));
        }, name ? 250 : 0);
        return () => { alive = false; clearTimeout(timer); };
    }, [open, size, name, lang, cardKey, color]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => event.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflow;
        };
    }, [open]);

    const filename = `ikhtisosiman-${card.kind}-${size}.png`;
    const share = async () => {
        if (!canvasRef.current) return;
        setBusy(true);
        setNote("");
        try {
            const result = await shareOrDownload(canvasRef.current, filename, `${text.shareText} ${CARD_LINK}`);
            if (result === "downloaded") setNote(text.done);
        } finally {
            setBusy(false);
        }
    };
    const download = async () => {
        if (!canvasRef.current) return;
        downloadBlob(await canvasToBlob(canvasRef.current), filename);
        setNote(text.done);
    };

    const buttonClass = variant === "light"
        ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-white/20 px-4 py-2.5 text-sm font-bold text-white backdrop-blur hover:bg-white/30 cursor-pointer"
        : "btn-primary !py-3";

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className={`${buttonClass} ${className}`}>
                <Share2 className="h-4 w-4" aria-hidden /> {text.button}
            </button>
            {open && createPortal(
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={text.title} onClick={() => setOpen(false)}>
                    <div
                        className="flex max-h-[100dvh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-[2rem] border border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-foreground">{text.title}</h2>
                            <button type="button" onClick={() => setOpen(false)} aria-label={text.close} className="rounded-xl p-2 text-muted-foreground hover:bg-muted cursor-pointer"><X className="h-5 w-5" aria-hidden /></button>
                        </div>
                        <div className="flex justify-center rounded-2xl bg-muted/40 p-3">
                            {preview ? (
                                <img src={preview} alt={text.title} className={`rounded-xl shadow-lg ${size === "story" ? "max-h-[46dvh]" : "max-h-[38dvh]"} w-auto`} />
                            ) : (
                                <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden /></div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-muted/50 p-1">
                            {["story", "square"].map((value) => (
                                <button key={value} type="button" onClick={() => setSize(value)} aria-pressed={size === value}
                                    className={`rounded-xl py-2 text-sm font-bold cursor-pointer ${size === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                                    {text[value]}
                                </button>
                            ))}
                        </div>
                        <div>
                            <div className="mb-1.5 text-[13px] font-bold text-foreground">{text.color}</div>
                            <div className="flex flex-wrap gap-2">
                                {["auto", ...Object.keys(CARD_COLORS)].map((key) => {
                                    const [a, b] = key === "auto" ? (CLUSTER_GRADIENT[card.cluster] || CARD_COLORS.blue) : CARD_COLORS[key];
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => { setColor(key); try { localStorage.setItem("card_color", key); } catch { /* холӣ */ } }}
                                            aria-pressed={color === key}
                                            aria-label={key === "auto" ? text.auto : key}
                                            title={key === "auto" ? text.auto : key}
                                            className={`h-9 w-9 rounded-full cursor-pointer ring-offset-2 ring-offset-card transition-transform active:scale-90 ${color === key ? "ring-2 ring-primary scale-110" : ""}`}
                                            style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
                                        >
                                            {key === "auto" && <span className="text-[10px] font-black text-white">A</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value.slice(0, 40))}
                            placeholder={text.name}
                            aria-label={text.name}
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-ring"
                        />
                        <p className="text-[13px] text-muted-foreground">{text.hint}</p>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                            <button type="button" onClick={share} disabled={!preview || busy} className="btn-primary !py-3.5 disabled:opacity-50">
                                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <><Share2 className="h-5 w-5" aria-hidden /> {text.share}</>}
                            </button>
                            <button type="button" onClick={download} disabled={!preview} className="btn-secondary flex items-center gap-2 !px-4 !py-3.5 disabled:opacity-50">
                                <Download className="h-5 w-5" aria-hidden /> <span className="hidden min-[380px]:inline">{text.download}</span>
                            </button>
                        </div>
                        {note && <p className="text-center text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">{note}</p>}
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}
