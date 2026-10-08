import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";
import { clearEntry, readEntry, saveEntry } from "../lib/pageState";

// «Ба қафо» — ба ҳамон ҷои саҳифа: scroll-и ҳар қадами таърих нигоҳ дошта мешавад ва
// баъди бозгашт, вақте рӯйхат аз нав пур мешавад, барқарор мегардад. Саҳифаи нав (push)
// аз боло сар мешавад; иваз кардани филтр (replace) scroll-ро намеҷунбонад.
// Бори аввал дар ин ҳуҷҷат: агар саҳифа аз нав кушода шуда бошад (на F5 ва на «Ба қафо»
// аз сайти дигар), ҳолати кӯҳнаи ҳамин рақами таърих ба он тааллуқ надорад.
let firstRender = true;
function isFreshLoad() {
    try {
        return performance.getEntriesByType("navigation")[0]?.type === "navigate";
    } catch {
        return false;
    }
}

export default function ScrollRestorer() {
    const location = useLocation();
    const navigationType = useNavigationType();
    const handled = useRef(null);

    // Қадами нави таърих ҳолати кӯҳнаи ҳамин рақамро (аз шохаи пешинаи таърих) пок мекунад —
    // пеш аз он ки саҳифаҳо ҳолати худро хонанд (ин компонент пеш аз онҳо render мешавад).
    if (typeof window !== "undefined" && handled.current !== location.key) {
        handled.current = location.key;
        if (navigationType === "PUSH" || (firstRender && isFreshLoad())) clearEntry();
        firstRender = false;
    }

    useEffect(() => {
        try {
            window.history.scrollRestoration = "manual";
        } catch {
            /* браузери кӯҳна */
        }
        let timer;
        const onScroll = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => saveEntry({ scroll: Math.round(window.scrollY) }), 120);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    useEffect(() => {
        if (navigationType === "REPLACE") return undefined;
        if (navigationType === "PUSH") {
            if (!location.hash) window.scrollTo(0, 0);
            return undefined;
        }
        const target = Number(readEntry().scroll) || 0;
        if (!target) return undefined;
        // Рӯйхат аз сервер меояд — то баландии саҳифа кофӣ шавад, кӯшиш мекунем (то 4 сония).
        // Агар корбар худаш scroll кунад, бас мекунем.
        let cancelled = false;
        let frame;
        const stop = () => { cancelled = true; };
        const events = ["wheel", "touchstart", "keydown", "mousedown"];
        events.forEach((name) => window.addEventListener(name, stop, { passive: true, once: true }));
        const started = performance.now();
        const tick = () => {
            if (cancelled) return;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo(0, Math.min(target, Math.max(0, max)));
            if (max >= target || performance.now() - started > 4000) return;
            frame = window.requestAnimationFrame(tick);
        };
        tick();
        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frame);
            events.forEach((name) => window.removeEventListener(name, stop));
        };
    }, [location.key, navigationType, location.hash]);

    return null;
}
