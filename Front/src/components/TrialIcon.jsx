import React from "react";
import { ChartColumn, CodeXml, GraduationCap, Scale, Stethoscope, Target } from "lucide-react";

// Иконкаи ҳар сенария аз lucide (ҳамон китобхонаи тамоми сайт) — бе emoji.
const FAMILY = {
    it: { Icon: CodeXml, tone: "from-sky-500 to-blue-600" },
    economics: { Icon: ChartColumn, tone: "from-emerald-500 to-teal-600" },
    teacher: { Icon: GraduationCap, tone: "from-amber-500 to-orange-600" },
    law: { Icon: Scale, tone: "from-violet-500 to-purple-600" },
    medicine: { Icon: Stethoscope, tone: "from-rose-500 to-pink-600" },
};

const SIZE = {
    sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4" },
    md: { box: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
    lg: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7" },
    xl: { box: "h-16 w-16 rounded-2xl sm:h-20 sm:w-20 sm:rounded-3xl", icon: "h-8 w-8 sm:h-10 sm:w-10" },
};

export default function TrialIcon({ family, size = "md", className = "" }) {
    const { Icon, tone } = FAMILY[family] || { Icon: Target, tone: "from-primary to-indigo-600" };
    const s = SIZE[size] || SIZE.md;
    return (
        <span className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br ${tone} text-white shadow-lg shadow-black/10 ${s.box} ${className}`} aria-hidden>
            <Icon className={s.icon} strokeWidth={2} />
        </span>
    );
}
