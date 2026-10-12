import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlayCircle } from "lucide-react";
import { HELP_TEXT, HELP_VIDEOS, videoPoster } from "../lib/helpVideos";
import { VideoModal } from "../components/HelpVideo";
import { usePageMeta } from "../lib/usePageMeta";

// /help — ҳамаи видеоҳои омӯзишӣ.
export default function Help() {
    const { i18n } = useTranslation();
    const lang = (i18n.language || "tj").slice(0, 2);
    const text = HELP_TEXT[lang] || HELP_TEXT.tj;
    const [open, setOpen] = useState(null);
    usePageMeta({ title: text.title, description: text.intro, path: "/help" });

    return (
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">{text.title}</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">{text.intro}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {HELP_VIDEOS.map((video) => (
                    <button key={video.id} type="button" onClick={() => setOpen(video.id)} className="group overflow-hidden rounded-3xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:border-primary cursor-pointer">
                        <div className="relative aspect-video bg-muted">
                            <img src={videoPoster(video.id, lang)} alt="" loading="lazy" className="h-full w-full object-cover" />
                            <span className="absolute inset-0 flex items-center justify-center bg-slate-950/20 transition group-hover:bg-slate-950/35">
                                <PlayCircle className="h-14 w-14 text-white drop-shadow-lg" aria-hidden />
                            </span>
                        </div>
                        <div className="flex items-center gap-3 p-4">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-black text-primary">{Number(video.id) + 1}</span>
                            <span className="font-bold leading-snug text-foreground">{video.title[lang]}</span>
                        </div>
                    </button>
                ))}
            </div>
            {open && <VideoModal id={open} lang={lang} onClose={() => setOpen(null)} />}
        </div>
    );
}
