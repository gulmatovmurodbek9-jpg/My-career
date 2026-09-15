import React from "react";

/**
 * StatsCard — корти рақами дошборд.
 *
 * Ҳамон забони тарҳи сайт: bg-card, border-border ва ранги мавзӯъ, пас дар
 * реҷаи равшан ва торик якхела хонда мешавад. Пештар заминаи сахт навиштаи
 * #0f172a ва дурахши blur ҳангоми hover дошт — ҳамеша торик ва беқарор.
 *
 * Props:
 *  - icon: Lucide icon component
 *  - label: string
 *  - value: string | number
 *  - hint: string (ихтиёрӣ) — сатри хурди шарҳ дар зери номи рақам
 *  - color: string (синфи ранги матни иконка)
 *  - bg: string (синфи заминаи иконка)
 */
const StatsCard = ({ icon: Icon, label, value, hint, color = "text-primary", bg = "bg-primary/10" }) => {
  const display = typeof value === "number" ? value.toLocaleString("ru-RU") : value ?? "—";
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-semibold text-muted-foreground">{label}</span>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div>
        <div className="text-[34px] font-extrabold leading-none tracking-tight text-foreground tabular-nums">{display}</div>
        {hint && <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
