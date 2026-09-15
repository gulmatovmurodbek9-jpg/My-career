import React from "react";
import { Bot } from "lucide-react";

/*
 * Нишони AI — ҳамон аватари саҳифаи чат: ҳалқаи градиентии 2px ва робот.
 *
 * Пештар ҳар ҷо нишони дигар буд (мағзи BrainCircuit, нуқтаҳои давразананда,
 * ҳошияи бунафш), ва AI дар як саҳифа се намуд дошт.
 *
 * Радиуси дохилӣ = радиуси берунӣ − 2px (ғафсии ҳалқа), то ҳалқа дар кунҷҳо
 * якхела ғафс бошад.
 */
const SIZES = {
    sm: { box: "h-10 w-10 rounded-[0.875rem]", inner: "rounded-[0.75rem]", icon: "h-5 w-5", dot: "h-3 w-3" },
    md: { box: "h-12 w-12 rounded-2xl", inner: "rounded-[0.875rem]", icon: "h-6 w-6", dot: "h-3.5 w-3.5" },
    lg: { box: "h-16 w-16 rounded-[1.25rem]", inner: "rounded-[1.125rem]", icon: "h-8 w-8", dot: "h-4 w-4" },
};

export default function AiBotIcon({ icon: Icon = Bot, size = "md", online = false, className = "" }) {
    const s = SIZES[size] || SIZES.md;
    return (
        <span className={`relative inline-flex shrink-0 ${className}`}>
            <span className={`block ${s.box} bg-gradient-to-br from-primary via-accent-blue to-primary p-[2px] shadow-lg shadow-primary/20`}>
                <span className={`flex h-full w-full items-center justify-center bg-card ${s.inner}`}>
                    <Icon className={`${s.icon} text-primary`} aria-hidden />
                </span>
            </span>
            {online && (
                <span className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background bg-emerald-500 ${s.dot}`} />
            )}
        </span>
    );
}
