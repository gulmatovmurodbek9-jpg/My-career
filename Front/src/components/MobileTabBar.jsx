import React from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Briefcase, GraduationCap, Home, LogIn, Mic, UserRound } from "lucide-react";
import { useAuthStore } from "../store/authStore";

// Панели поёни телефон (мисли барномаҳои мобилӣ): саҳифаҳои асосӣ доим дар зери ангушт,
// ёвари овозӣ — тугмаи мобайнӣ. Микрофони шинокунанда дар телефон дигар болои тугмаҳои
// саҳифа намеистад («Тестро оғоз кунед», «Фиристодан»).
const LABELS = {
    tj: { home: "Асосӣ", careers: "Ихтисосҳо", voice: "Ёвар", universities: "Донишгоҳҳо", profile: "Профил", login: "Вуруд" },
    ru: { home: "Главная", careers: "Профессии", voice: "Помощник", universities: "Вузы", profile: "Профиль", login: "Войти" },
    en: { home: "Home", careers: "Careers", voice: "Assistant", universities: "Universities", profile: "Profile", login: "Sign in" },
};

// Саҳифаҳое, ки поён майдони худро доранд (чат) ё панели алоҳида (админ).
const HIDDEN = ["/admin", "/dashboard/ai-chat"];

export const tabBarVisible = (pathname) => !HIDDEN.some((prefix) => pathname.startsWith(prefix));

export default function MobileTabBar() {
    const { pathname } = useLocation();
    const { i18n } = useTranslation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!tabBarVisible(pathname)) return null;
    const text = LABELS[String(i18n.language || "tj").slice(0, 2)] || LABELS.tj;

    const items = [
        { to: "/", label: text.home, Icon: Home, active: pathname === "/" },
        { to: "/careers", label: text.careers, Icon: Briefcase, active: pathname.startsWith("/careers") || pathname.startsWith("/info") || pathname.startsWith("/trial") },
        null,
        { to: "/universities", label: text.universities, Icon: GraduationCap, active: pathname.startsWith("/universities") },
        isAuthenticated
            ? { to: "/dashboard", label: text.profile, Icon: UserRound, active: pathname.startsWith("/dashboard") || pathname.startsWith("/favorites") }
            : { to: "/login", label: text.login, Icon: LogIn, active: pathname.startsWith("/login") || pathname.startsWith("/register") },
    ];

    return (
        <nav
            aria-label={text.home}
            className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.25)] backdrop-blur-xl md:hidden"
        >
            <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 items-end">
                {items.map((item) => {
                    if (!item) {
                        return (
                            <li key="voice" className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => window.dispatchEvent(new Event("voice:toggle"))}
                                    aria-label={text.voice}
                                    className="-mt-6 mb-1 flex flex-col items-center gap-0.5 cursor-pointer"
                                >
                                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-card">
                                        <Mic className="h-6 w-6" aria-hidden />
                                    </span>
                                    <span className="text-[11px] font-bold text-primary">{text.voice}</span>
                                </button>
                            </li>
                        );
                    }
                    const { to, label, Icon, active } = item;
                    return (
                        <li key={to}>
                            <Link
                                to={to}
                                aria-current={active ? "page" : undefined}
                                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <span className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-primary/12" : ""}`}>
                                    <Icon className="h-5 w-5" aria-hidden strokeWidth={active ? 2.4 : 2} />
                                </span>
                                <span className="max-w-full truncate px-0.5">{label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
