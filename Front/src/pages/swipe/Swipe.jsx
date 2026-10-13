import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Heart, RotateCcw, Send, Sparkles, Undo2, X } from "lucide-react";
import { clusterCareers } from "../../lib/clusterCareers";
import { MMT_CLUSTERS } from "../../lib/mmtClusters";
import { SWIPE_CARDS, TRAITS, swipeResult } from "../../lib/swipeCards";
import { careerName } from "../../lib/careerText";
import { displayName } from "../../lib/careerName";
import { copyText } from "../../lib/copyText";
import { usePageMeta } from "../../lib/usePageMeta";
import TraitIcon from "../../components/TraitIcon";

const TEXT = {
    tj: {
        title: "Касб-свайп", subtitle: "30 сурат · 1 дақиқа. Ба рост — маъқул, ба чап — не.", start: "Оғоз",
        like: "МАЪҚУЛ", nope: "НЕ", likeBtn: "Маъқул", nopeBtn: "Не", undo: "Бозгашт", of: "{{n}} аз {{t}}",
        resultTitle: "Ба ту инҳо маъқуланд", notLiked: "Инҳо он қадар маъқул нестанд", direction: "Самти ба ту наздик",
        careers: "Ихтисосҳое, ки метавонанд маъқул шаванд", liked: "Суратҳое, ки маъқул шуданд",
        again: "Аз нав", fullTest: "Тести пурра (10 дақиқа)", share: "Ба дӯст фиристед", copied: "Пайванд нусха шуд",
        disclaimer: "Ин бозӣ аст, на ташхис. Барои натиҷаи дақиқ тести пурраро гузаред.",
        shareText: "Ман «Касб-свайп»-ро бозӣ кардам — ба ман {{a}} маъқул аст! Ту ҳам санҷ:", none: "Ҳеҷ сурат маъқул нашуд — тести пурраро санҷед, шояд он беҳтар ёбад.",
        hint: "Суратро бо ангушт кашед ё тугмаҳоро пахш кунед",
    },
    ru: {
        title: "Профессия-свайп", subtitle: "30 картинок · 1 минута. Вправо — нравится, влево — нет.", start: "Начать",
        like: "НРАВИТСЯ", nope: "НЕТ", likeBtn: "Нравится", nopeBtn: "Нет", undo: "Назад", of: "{{n}} из {{t}}",
        resultTitle: "Тебе нравится", notLiked: "Это нравится меньше", direction: "Близкое тебе направление",
        careers: "Специальности, которые могут понравиться", liked: "Понравившиеся картинки",
        again: "Заново", fullTest: "Полный тест (10 минут)", share: "Отправить другу", copied: "Ссылка скопирована",
        disclaimer: "Это игра, а не диагностика. Для точного результата пройдите полный тест.",
        shareText: "Я сыграл(а) в «Профессия-свайп» — мне нравится {{a}}! Попробуй и ты:", none: "Ничего не понравилось — попробуйте полный тест, он подберёт точнее.",
        hint: "Смахните картинку пальцем или нажмите кнопки",
    },
    en: {
        title: "Career swipe", subtitle: "30 pictures · 1 minute. Right — like, left — nope.", start: "Start",
        like: "LIKE", nope: "NOPE", likeBtn: "Like", nopeBtn: "Nope", undo: "Undo", of: "{{n}} of {{t}}",
        resultTitle: "What you enjoy", notLiked: "Not so much", direction: "Your closest direction",
        careers: "Specialties you might like", liked: "Pictures you liked",
        again: "Again", fullTest: "Full test (10 minutes)", share: "Send to a friend", copied: "Link copied",
        disclaimer: "This is a game, not a diagnosis. Take the full test for an accurate result.",
        shareText: "I played “Career swipe” — I enjoy {{a}}! Try it too:", none: "Nothing appealed — try the full test, it matches more precisely.",
        hint: "Swipe the picture or press the buttons",
    },
};
const fill = (t, v) => String(t).replace(/\{\{(\w+)\}\}/g, (_, k) => v?.[k] ?? "");
const KEY = "swipe_result_v1";
const THRESHOLD = 110;

// Корти болоӣ: бо ангушт ё муш кашида мешавад; аз ҳад гузашт — парида меравад.
function TopCard({ card, lang, text, onDecide, fly }) {
    const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
    const start = useRef(null);
    const out = fly ?? (Math.abs(drag.x) > THRESHOLD && !drag.active ? Math.sign(drag.x) : 0);

    const down = (event) => {
        start.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDrag({ x: 0, y: 0, active: true });
    };
    const move = (event) => {
        if (!start.current) return;
        setDrag({ x: event.clientX - start.current.x, y: (event.clientY - start.current.y) * 0.3, active: true });
    };
    const up = () => {
        if (!start.current) return;
        start.current = null;
        if (Math.abs(drag.x) > THRESHOLD) {
            setDrag((d) => ({ ...d, active: false }));
            setTimeout(() => onDecide(drag.x > 0), 220);
        } else setDrag({ x: 0, y: 0, active: false });
    };

    const x = out ? out * 600 : drag.x;
    const rotate = x / 18;
    const likeOpacity = Math.min(1, Math.max(0, x / THRESHOLD));
    const nopeOpacity = Math.min(1, Math.max(0, -x / THRESHOLD));
    return (
        <div
            role="img"
            aria-label={card.text[lang]}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className="absolute inset-0 touch-none select-none overflow-hidden rounded-[2rem] bg-muted shadow-2xl shadow-primary/20 cursor-grab active:cursor-grabbing"
            style={{ transform: `translate(${x}px, ${drag.y}px) rotate(${rotate}deg)`, transition: drag.active ? "none" : "transform .25s ease-out" }}
            data-swipe-card={card.id}
        >
            <img src={`/swipe/${card.id}.webp`} alt="" draggable={false} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-20">
                <p className="text-[22px] font-black leading-tight text-white drop-shadow sm:text-2xl">{card.text[lang]}</p>
            </div>
            <span className="absolute left-5 top-6 -rotate-12 rounded-xl border-4 border-emerald-400 px-3 py-1 text-2xl font-black tracking-wider text-emerald-400" style={{ opacity: likeOpacity }}>{text.like}</span>
            <span className="absolute right-5 top-6 rotate-12 rounded-xl border-4 border-rose-500 px-3 py-1 text-2xl font-black tracking-wider text-rose-500" style={{ opacity: nopeOpacity }}>{text.nope}</span>
        </div>
    );
}

function Result({ result, choices, lang, text, onAgain }) {
    const { t } = useTranslation();
    const [careers, setCareers] = useState([]);
    const [copied, setCopied] = useState(false);
    const cluster = MMT_CLUSTERS.find((c) => c.key === result.topCluster);

    useEffect(() => {
        if (!result.topCluster) return undefined;
        let alive = true;
        clusterCareers(result.topCluster, lang).then((list) => alive && setCareers(list)).catch(() => {});
        return () => { alive = false; };
    }, [result.topCluster, lang]);

    const likedCards = SWIPE_CARDS.filter((c) => choices[c.id]);
    const likesText = result.likes.map((k) => TRAITS[k][lang].toLowerCase()).join(", ");
    const link = `${window.location.origin}/swipe`;
    const share = async () => {
        const message = `${fill(text.shareText, { a: likesText || "…" })} ${link}`;
        if (navigator.share) { try { await navigator.share({ text: message }); return; } catch (e) { if (e?.name === "AbortError") return; } }
        if (await copyText(message)) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    };

    return (
        <div className="space-y-5" data-swipe-result>
            <section className="overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-card p-5 sm:p-7">
                <div className="flex items-center gap-2 text-[13px] font-black uppercase tracking-wide text-primary"><Sparkles className="h-4 w-4" aria-hidden /> {text.resultTitle}</div>
                {result.likes.length ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {result.likes.map((key) => (
                            <div key={key} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm">
                                <TraitIcon trait={key} />
                                <span className="text-[16px] font-black leading-tight text-foreground">{TRAITS[key][lang]}</span>
                            </div>
                        ))}
                    </div>
                ) : <p className="mt-3 text-[15px] text-muted-foreground">{text.none}</p>}
                {result.dislikes.length > 0 && (
                    <div className="mt-4">
                        <div className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{text.notLiked}</div>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                            {result.dislikes.map((key) => (
                                <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-muted py-1 pl-1 pr-3 text-[13px] font-semibold text-muted-foreground"><TraitIcon trait={key} size="xs" className="rounded-full" /> {TRAITS[key][lang]}</span>
                            ))}
                        </div>
                    </div>
                )}
                {cluster && (
                    <div className="mt-5 rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                        <div className="text-[12px] font-bold uppercase tracking-wide opacity-80">{text.direction}</div>
                        <div className="text-2xl font-black">{t(cluster.i18nKey, cluster.fallback)}</div>
                    </div>
                )}
            </section>

            {careers.length > 0 && (
                <section className="rounded-3xl border border-border bg-card p-5">
                    <h2 className="font-black text-foreground">{text.careers}</h2>
                    <ul className="mt-3 space-y-2">
                        {careers.map((career) => (
                            <li key={career.id}>
                                <Link to={`/info/${career.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3 font-bold text-foreground hover:bg-primary/10 hover:text-primary">
                                    <span className="min-w-0">{displayName(careerName(career, lang))}</span>
                                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {likedCards.length > 0 && (
                <section className="rounded-3xl border border-border bg-card p-5">
                    <h2 className="font-black text-foreground">{text.liked} <span className="text-muted-foreground">({likedCards.length})</span></h2>
                    <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {likedCards.map((card) => (
                            <img key={card.id} src={`/swipe/${card.id}.webp`} alt={card.text[lang]} title={card.text[lang]} loading="lazy" className="aspect-[3/4] w-full rounded-xl object-cover" />
                        ))}
                    </div>
                </section>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
                <Link to="/quiz" className="btn-primary !py-3.5"><Sparkles className="h-5 w-5" aria-hidden /> {text.fullTest}</Link>
                <button type="button" onClick={share} className="btn-secondary flex items-center justify-center gap-2 !py-3.5"><Send className="h-5 w-5" aria-hidden /> {copied ? text.copied : text.share}</button>
                <button type="button" onClick={onAgain} className="btn-secondary flex items-center justify-center gap-2 !py-3.5"><RotateCcw className="h-5 w-5" aria-hidden /> {text.again}</button>
            </div>
            <p className="text-center text-[13px] text-muted-foreground">{text.disclaimer}</p>
        </div>
    );
}

// /swipe — «Касб-свайп»: 30 сурати касб, ❤️ / ✖️, дар охир хусусиятҳо, самт ва ихтисосҳо.
export default function Swipe() {
    const { i18n } = useTranslation();
    const lang = ["tj", "ru", "en"].includes((i18n.language || "tj").slice(0, 2)) ? (i18n.language || "tj").slice(0, 2) : "tj";
    const text = TEXT[lang];
    const [choices, setChoices] = useState(() => {
        try { return JSON.parse(localStorage.getItem(KEY))?.choices || {}; } catch { return {}; }
    });
    const [started, setStarted] = useState(() => Object.keys(choices).length > 0);
    const [fly, setFly] = useState(null);
    usePageMeta({ title: text.title, description: text.subtitle, path: "/swipe" });

    const index = SWIPE_CARDS.findIndex((card) => choices[card.id] === undefined);
    const done = index === -1;
    const card = SWIPE_CARDS[index];
    const result = useMemo(() => (done ? swipeResult(choices) : null), [done, choices]);

    useEffect(() => {
        try { localStorage.setItem(KEY, JSON.stringify({ choices, at: Date.now() })); } catch { /* холӣ */ }
    }, [choices]);
    // Суратҳои навбатиро пешакӣ бор мекунем, то кашидан бе таваққуф бошад.
    useEffect(() => {
        SWIPE_CARDS.slice(index + 1, index + 4).forEach((next) => { const img = new Image(); img.src = `/swipe/${next.id}.webp`; });
    }, [index]);

    const decide = useCallback((like) => {
        if (!card) return;
        setFly(null);
        setChoices((old) => ({ ...old, [card.id]: like }));
    }, [card]);
    const press = useCallback((like) => {
        if (!card || fly !== null) return;
        setFly(like ? 1 : -1);
        setTimeout(() => decide(like), 230);
    }, [card, fly, decide]);
    const undo = () => {
        const last = [...SWIPE_CARDS].reverse().find((c) => choices[c.id] !== undefined);
        if (!last) return;
        setChoices((old) => { const next = { ...old }; delete next[last.id]; return next; });
    };
    useEffect(() => {
        if (!started || done) return undefined;
        const onKey = (event) => {
            if (event.key === "ArrowRight") press(true);
            if (event.key === "ArrowLeft") press(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [started, done, press]);

    const answered = SWIPE_CARDS.length - (done ? 0 : SWIPE_CARDS.length - index);
    return (
        <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:pt-10 md:pb-16">
            <h1 className={`font-black tracking-tight text-foreground ${started && !done ? "text-2xl sm:text-4xl" : "text-3xl sm:text-4xl"}`}>{text.title}</h1>
            <p className={`mt-1 text-[15px] text-muted-foreground ${started && !done ? "hidden sm:block" : ""}`}>{text.subtitle}</p>

            {!started ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="grid grid-cols-3 gap-2">
                        {SWIPE_CARDS.slice(0, 6).map((c, i) => (
                            <img key={c.id} src={`/swipe/${c.id}.webp`} alt="" className={`aspect-[3/4] w-full rounded-2xl object-cover shadow-md ${i % 2 ? "translate-y-3" : ""}`} />
                        ))}
                    </div>
                    <button type="button" onClick={() => setStarted(true)} className="btn-primary !px-10 !py-4 text-lg"><Heart className="h-5 w-5" aria-hidden /> {text.start}</button>
                </div>
            ) : done ? (
                <div className="mt-6"><Result result={result} choices={choices} lang={lang} text={text} onAgain={() => setChoices({})} /></div>
            ) : (
                <div className="mx-auto mt-3 max-w-sm sm:mt-5">
                    <div className="mb-2 flex items-center justify-between text-[13px] font-bold text-muted-foreground">
                        <span>{fill(text.of, { n: answered + 1, t: SWIPE_CARDS.length })}</span>
                        <span className="hidden sm:inline">← → </span>
                    </div>
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(answered / SWIPE_CARDS.length) * 100}%` }} /></div>
                    {/* Баландии корт аз экран вобаста аст — тугмаҳо дар телефон ҳам намоёнанд. */}
                    <div className="relative mx-auto aspect-[3/4]" style={{ height: "min(56vh, 30rem)", maxWidth: "100%" }}>
                        {SWIPE_CARDS[index + 1] && (
                            <div className="absolute inset-0 scale-[0.94] overflow-hidden rounded-[2rem] opacity-80 shadow-lg" aria-hidden>
                                <img src={`/swipe/${SWIPE_CARDS[index + 1].id}.webp`} alt="" className="h-full w-full object-cover" />
                            </div>
                        )}
                        <TopCard key={card.id} card={card} lang={lang} text={text} onDecide={decide} fly={fly} />
                    </div>
                    <p className="mt-3 hidden text-center text-[12.5px] text-muted-foreground sm:block">{text.hint}</p>
                    <div className="mt-3 flex items-center justify-center gap-5">
                        <button type="button" onClick={() => press(false)} aria-label={text.nopeBtn} data-swipe-no
                            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-500/40 bg-card text-rose-500 shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer">
                            <X className="h-8 w-8" aria-hidden />
                        </button>
                        <button type="button" onClick={undo} disabled={answered === 0} aria-label={text.undo}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow transition hover:text-primary disabled:opacity-40 cursor-pointer">
                            <Undo2 className="h-5 w-5" aria-hidden />
                        </button>
                        <button type="button" onClick={() => press(true)} aria-label={text.likeBtn} data-swipe-yes
                            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-card text-emerald-500 shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer">
                            <Heart className="h-8 w-8" aria-hidden />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
