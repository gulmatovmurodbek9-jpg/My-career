import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Heart, X } from "lucide-react";

const TEXT = {
    tj: { badge: "Бозии 1-дақиқаӣ", title: "Касб-свайп", lead: "30 сурати кори воқеӣ: ба рост — маъқул, ба чап — не. Дар охир мебинӣ, ки дар кор ба ту чӣ маъқул аст.", cta: "Бозӣ кунед" },
    ru: { badge: "Игра на 1 минуту", title: "Профессия-свайп", lead: "30 картинок настоящей работы: вправо — нравится, влево — нет. В конце узнаешь, что тебе нравится в работе.", cta: "Играть" },
    en: { badge: "1-minute game", title: "Career swipe", lead: "30 pictures of real work: right — like, left — nope. At the end you see what you enjoy in work.", cta: "Play" },
};
const PREVIEW = ["doctor", "code", "teach"];

// Дар саҳифаи асосӣ: даромад ба «Касб-свайп» — се корти хурд ва тугма.
export default function SwipePromo() {
    const { i18n } = useTranslation();
    const text = TEXT[(i18n.language || "tj").slice(0, 2)] || TEXT.tj;
    return (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <Link to="/swipe" className="group grid items-center gap-8 overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 transition-colors hover:border-primary sm:grid-cols-[1fr_auto] sm:p-10">
                <div>
                    <span className="inline-flex rounded-full bg-primary px-3 py-1 text-[12px] font-black uppercase tracking-wide text-primary-foreground">{text.badge}</span>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">{text.title}</h2>
                    <p className="mt-2 max-w-[46ch] text-[16px] leading-relaxed text-muted-foreground">{text.lead}</p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 font-bold text-background transition group-hover:bg-foreground/88">
                        {text.cta} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                </div>
                <div className="relative mx-auto h-56 w-64 sm:h-64 sm:w-72" aria-hidden>
                    {PREVIEW.map((id, i) => (
                        <img key={id} src={`/swipe/${id}.webp`} alt="" loading="lazy"
                            className="absolute top-0 h-full w-auto rounded-2xl object-cover shadow-xl transition-transform duration-300"
                            style={{ left: `${i * 18}%`, transform: `rotate(${(i - 1) * 8}deg) translateY(${i === 1 ? -6 : 6}px)`, zIndex: i === 1 ? 2 : 1 }} />
                    ))}
                    <span className="absolute -bottom-3 left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-card text-rose-500 shadow-lg"><X className="h-6 w-6" /></span>
                    <span className="absolute -bottom-3 right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-card text-emerald-500 shadow-lg"><Heart className="h-6 w-6" /></span>
                </div>
            </Link>
        </section>
    );
}
