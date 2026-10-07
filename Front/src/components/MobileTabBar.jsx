import React from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Briefcase, GraduationCap, Home, LayoutDashboard, LogIn, Mic } from "lucide-react";
import { useAuthStore } from "../store/authStore";

// Панели поёни телефон (мисли барномаҳои мобилӣ): панели шинокунандаи мудаввар болои хатти
// поёни iPhone (safe-area), саҳифаҳои асосӣ доим дар зери ангушт, ёвари овозӣ — тугмаи мобайнӣ.
// Корбари воридшуда — «Панел» (кабинети шахсӣ); меҳмон — «Вуруд».
const LABELS = {
    tj: { nav: "Менюи асосӣ", home: "Асосӣ", careers: "Ихтисосҳо", voice: "Ёвар", universities: "Донишгоҳҳо", panel: "Панел", login: "Вуруд" },
    ru: { nav: "Главное меню", home: "Главная", careers: "Профессии", voice: "Помощник", universities: "Вузы", panel: "Кабинет", login: "Войти" },
    en: { nav: "Main menu", home: "Home", careers: "Careers", voice: "Assistant", universities: "Universities", panel: "Dashboard", login: "Sign in" },
};

// Саҳифаҳое, ки поён майдони худро доранд (чат) ё панели алоҳида (админ).
const HIDDEN = ["/admin", "/dashboard/ai-chat"];

export const tabBarVisible = (pathname) => !HIDDEN.some((prefix) => pathname.startsWith(prefix));

function Tab({ to, label, Icon, active }) {
    return (
        <Link
            to={to}
            aria-current={active ? "page" : undefined}
            className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10.5px] font-bold transition-colors ${active ? "text-primary" : "text-muted-foreground active:text-foreground"}`}
        >
            <span className={`flex h-7 w-11 items-center justify-center rounded-full transition-all duration-200 ${active ? "bg-primary/12 scale-105" : ""}`}>
                <Icon className="h-[19px] w-[19px]" aria-hidden strokeWidth={active ? 2.4 : 2} />
            </span>
            <span className="w-full truncate px-0.5 text-center leading-tight">{label}</span>
        </Link>
    );
}

export default function MobileTabBar() {
    const { pathname } = useLocation();
    const { i18n } = useTranslation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!tabBarVisible(pathname)) return null;
    const text = LABELS[String(i18n.language || "tj").slice(0, 2)] || LABELS.tj;

    const left = [
        { to: "/", label: text.home, Icon: Home, active: pathname === "/" },
        { to: "/careers", label: text.careers, Icon: Briefcase, active: pathname.startsWith("/careers") || pathname.startsWith("/info") || pathname.startsWith("/trial") },
    ];
    const right = [
        { to: "/universities", label: text.universities, Icon: GraduationCap, active: pathname.startsWith("/universities") },
        isAuthenticated
            ? { to: "/dashboard", label: text.panel, Icon: LayoutDashboard, active: pathname.startsWith("/dashboard") || pathname.startsWith("/favorites") }
            : { to: "/login", label: text.login, Icon: LogIn, active: pathname.startsWith("/login") || pathname.startsWith("/register") },
    ];

    return (
        <nav
            aria-label={text.nav}
            className="no-print fixed inset-x-3 z-50 md:hidden"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
        >
            <div className="relative mx-auto flex h-[66px] max-w-md items-stretch rounded-[1.75rem] border border-border/70 bg-card/95 px-1.5 py-1.5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                {left.map((item) => <Tab key={item.to} {...item} />)}

                {/* Ёвар: доира дар мобайн, каме боло — бе он ки навиштаҳоро пӯшонад. */}
                <div className="flex w-[72px] shrink-0 justify-center">
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new Event("voice:toggle"))}
                        aria-label={text.voice}
                        className="-mt-5 flex flex-col items-center gap-0.5 cursor-pointer"
                    >
                        <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow-lg shadow-primary/40 ring-[5px] ring-card transition-transform active:scale-95">
                            <Mic className="h-6 w-6" aria-hidden />
                        </span>
                        <span className="text-[10.5px] font-bold leading-tight text-primary">{text.voice}</span>
                    </button>
                </div>

                {right.map((item) => <Tab key={item.to} {...item} />)}
            </div>
        </nav>
    );
}
