import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { PlayCircle, X } from "lucide-react";
import { HELP_TEXT, HELP_VIDEOS, videoForPath, videoPoster, videoSrc } from "../lib/helpVideos";
import { tabBarVisible } from "./MobileTabBar";

export function VideoModal({ id, lang, onClose }) {
    const text = HELP_TEXT[lang] || HELP_TEXT.tj;
    const video = HELP_VIDEOS.find((v) => v.id === id);
    useEffect(() => {
        const onKey = (event) => event.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
    }, [onClose]);
    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={video?.title[lang]} onClick={onClose}>
            <div className="w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-2 flex items-center justify-between gap-3 text-white">
                    <h2 className="truncate text-lg font-black">{video?.title[lang]}</h2>
                    <button type="button" onClick={onClose} aria-label={text.close} className="rounded-xl p-2 hover:bg-white/10 cursor-pointer"><X className="h-6 w-6" aria-hidden /></button>
                </div>
                <video
                    key={`${id}-${lang}`}
                    src={videoSrc(id, lang)}
                    poster={videoPoster(id, lang)}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    className="aspect-video w-full rounded-2xl bg-black shadow-2xl"
                />
                <div className="mt-2 text-right">
                    <Link to="/help" onClick={onClose} className="text-sm font-bold text-white/80 hover:text-white">{text.all} →</Link>
                </div>
            </div>
        </div>,
        document.body,
    );
}

// Тугмаи шинокунанда «▶ Чӣ тавр кор мекунад?» — видеои саҳифаи ҷорӣ бо забони сайт.
export default function HelpVideo() {
    const { pathname } = useLocation();
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = HELP_TEXT[lang] || HELP_TEXT.tj;
    const [open, setOpen] = useState(false);
    const id = videoForPath(pathname);
    useEffect(() => setOpen(false), [pathname]);
    if (!id || pathname.startsWith("/dashboard/ai-chat")) return null;
    const above = tabBarVisible(pathname) ? "bottom-[calc(env(safe-area-inset-bottom)+92px)]" : "bottom-4";

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`no-print fixed left-3 z-40 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-2 text-[13px] font-bold text-foreground shadow-lg backdrop-blur hover:border-primary hover:text-primary cursor-pointer md:bottom-6 md:left-6 ${above}`}
            >
                <PlayCircle className="h-5 w-5 text-primary" aria-hidden />
                <span className="hidden min-[400px]:inline">{text.button}</span>
            </button>
            {open && <VideoModal id={id} lang={lang} onClose={() => setOpen(false)} />}
        </>
    );
}
