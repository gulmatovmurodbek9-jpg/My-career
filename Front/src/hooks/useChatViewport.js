import { useEffect } from "react";

// Чат дар телефон: андоза аз ҚИСМИ НАМОЁНИ экран (window.visualViewport), на аз 100vh.
// Вақте клавиатура кушода мешавад, visualViewport кӯтоҳ мешавад — чат ҳам: паёмҳо кам
// намоён, вале сарлавҳаи чат (тугмаи ←) ва майдони навиштан доим дар экран.
// iPhone ҳангоми клавиатура саҳифаро ба боло мелағжонад (offsetTop) — он гоҳ чат аз
// болои қисми намоён сар мешавад (header-и сайт он лаҳза берун аст).
export function useChatViewport() {
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia("(max-width: 767px)").matches) return undefined;
        const root = document.documentElement;
        const viewport = window.visualViewport;
        const header = () => document.querySelector("header")?.getBoundingClientRect().bottom || 76;
        const update = () => {
            const height = viewport ? viewport.height : window.innerHeight;
            const offset = viewport ? viewport.offsetTop : 0;
            const keyboardShift = offset > 1;
            const top = keyboardShift ? offset : Math.max(0, header());
            root.style.setProperty("--chat-top", `${top}px`);
            root.style.setProperty("--chat-height", `${Math.max(240, height - (keyboardShift ? 0 : top))}px`);
        };
        update();
        // Саҳифаи паси чат набояд лағжад (вагарна iPhone онро ҳам бо клавиатура мекашад).
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        viewport?.addEventListener("resize", update);
        viewport?.addEventListener("scroll", update);
        window.addEventListener("resize", update);
        return () => {
            viewport?.removeEventListener("resize", update);
            viewport?.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            document.body.style.overflow = previous;
            root.style.removeProperty("--chat-top");
            root.style.removeProperty("--chat-height");
        };
    }, []);
}
