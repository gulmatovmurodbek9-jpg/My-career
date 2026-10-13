import React from "react";
import TraitIcon from "../../components/TraitIcon";

// Як сифат: нишона, ном, шарҳ ва 5 тугмаи калон (дар телефон осонтар аз слайдер).
export default function PeerScale({ trait, lang, value, onChange, scale }) {
    const [name, hint] = trait[lang] || trait.tj;
    return (
        <div className="rounded-2xl border border-border bg-card p-4" data-peer-trait={trait.key}>
            <div className="flex items-center gap-3">
                <TraitIcon trait={trait.key} />
                <div className="min-w-0">
                    <div className="text-[16px] font-black text-foreground">{name}</div>
                    <div className="text-[13px] leading-snug text-muted-foreground">{hint}</div>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={name}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)}
                        className={`flex flex-col items-center rounded-xl border py-2 text-[15px] font-black transition active:scale-95 cursor-pointer ${value === n ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25" : value && n < value ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:border-primary/50"}`}>
                        {n}
                        {scale[n - 1] && <span className={`text-[10px] font-semibold ${value === n ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{scale[n - 1]}</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}
