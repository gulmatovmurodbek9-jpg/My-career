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
        // Саҳифаи паси чат набояд лағжад. iPhone `overflow: hidden`-и body-ро нодида мегирад ва
        // ҳангоми клавиатура саҳифаро мекашад (сарлавҳа ва тугмаи ← гум мешуданд) — бинобар ин
        // html ва body ҳарду қуфл мешаванд ва баъди пӯшидани клавиатура саҳифа ба боло бармегардад.
        const previous = { html: root.style.overflow, body: document.body.style.overflow, overscroll: document.body.style.overscrollBehavior };
        root.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.body.style.overscrollBehavior = "none";
        window.scrollTo(0, 0);
        const settle = () => window.setTimeout(() => {
            window.scrollTo(0, 0);
            update();
        }, 60);
        viewport?.addEventListener("resize", update);
        viewport?.addEventListener("scroll", update);
        window.addEventListener("resize", update);
        document.addEventListener("focusout", settle);
        return () => {
            viewport?.removeEventListener("resize", update);
            viewport?.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            document.removeEventListener("focusout", settle);
            root.style.overflow = previous.html;
            document.body.style.overflow = previous.body;
            document.body.style.overscrollBehavior = previous.overscroll;
            root.style.removeProperty("--chat-top");
            root.style.removeProperty("--chat-height");
        };
    }, []);
}
