import React from "react";
import { BookOpen, Brain, Building2, Calculator, Crown, Flame, Hammer, HeartHandshake, Laptop, Leaf, MessagesSquare, Palette, Sparkles, Sprout, Target, Users, Zap } from "lucide-react";

// Иконкаи ҳар сифат («Дӯстон маро чӣ гуна мебинанд» ва «Касб-свайп») аз lucide — бе emoji.
const TRAIT = {
    leader: { Icon: Crown, tone: "from-amber-400 to-orange-500" },
    accurate: { Icon: Target, tone: "from-rose-500 to-red-600" },
    creative: { Icon: Palette, tone: "from-fuchsia-500 to-purple-600" },
    helpful: { Icon: HeartHandshake, tone: "from-pink-500 to-rose-600" },
    logical: { Icon: Brain, tone: "from-sky-500 to-blue-600" },
    patient: { Icon: Sprout, tone: "from-emerald-500 to-green-600" },
    brave: { Icon: Flame, tone: "from-orange-500 to-red-500" },
    social: { Icon: MessagesSquare, tone: "from-indigo-500 to-violet-600" },
    // «Касб-свайп»
    people: { Icon: Users, tone: "from-sky-500 to-cyan-600" },
    tech: { Icon: Laptop, tone: "from-blue-500 to-indigo-600" },
    nature: { Icon: Leaf, tone: "from-emerald-500 to-green-600" },
    numbers: { Icon: Calculator, tone: "from-teal-500 to-emerald-600" },
    active: { Icon: Hammer, tone: "from-orange-500 to-amber-600" },
    office: { Icon: Building2, tone: "from-slate-500 to-slate-700" },
    risk: { Icon: Zap, tone: "from-yellow-400 to-orange-500" },
    helping: { Icon: HeartHandshake, tone: "from-pink-500 to-rose-600" },
    leading: { Icon: Crown, tone: "from-amber-400 to-orange-500" },
    words: { Icon: BookOpen, tone: "from-violet-500 to-purple-600" },
};

const SIZE = {
    xs: { box: "h-5 w-5 rounded-md", icon: "h-3 w-3" },
    sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4" },
    md: { box: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
};

export default function TraitIcon({ trait, size = "md", className = "" }) {
    const { Icon, tone } = TRAIT[trait] || { Icon: Sparkles, tone: "from-primary to-indigo-600" };
    const s = SIZE[size] || SIZE.md;
    return (
        <span className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br ${tone} text-white shadow-md shadow-black/10 ${s.box} ${className}`} aria-hidden>
            <Icon className={s.icon} strokeWidth={2.2} />
        </span>
    );
}
