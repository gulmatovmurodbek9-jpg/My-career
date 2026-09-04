import { Building2, Info, Rocket, Star, TrendingUp } from "lucide-react";

/**
 * Маош: рақам танҳо он ҷое, ки воқеист.
 *
 * Дар база 861 ихтисос аз 884 мазмуни худкор доранд, ва майдони
 * `salaryAndMarket` ҳамагӣ 12 варианти ягона дорад — яъне даҳҳо ихтисоси
 * гуногун айнан як маошро нишон медоданд. Муаллим ва молиячӣ як рақам
 * доштанд.
 *
 * Аз ин рӯ зинаҳои маош танҳо барои сабтҳое нишон дода мешаванд, ки одам
 * онҳоро навиштааст (`contentWritten`). Барои боқимонда асоси қонунии
 * ташаккули маош шарҳ дода мешавад — ин ҳам дуруст асту ҳам фоиданок,
 * бидуни он ки рақами бофта пешниҳод шавад.
 */

const TIERS = [
  { key: "junior", label: "Навкор", years: "0-1 соли таҷриба", icon: Rocket },
  { key: "mid", label: "Миёна", years: "2-4 соли таҷриба", icon: TrendingUp },
  { key: "senior", label: "Таҷрибадор", years: "5+ соли таҷриба", icon: Star },
];

function LegalBasis() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm leading-6 text-muted-foreground">
          Барои ин ихтисос маълумоти тасдиқшудаи маош надорем. Рақами тахминӣ
          нишон намедиҳем, то шумо дар асоси маълумоти нодуруст қарор нагиред.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Дар соҳаи давлатӣ</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Маош аз рӯи Кодекси меҳнати Ҷумҳурии Тоҷикистон ва шабакаи ягонаи
            тарифӣ муайян мешавад: музди ҳадди ақали қонунӣ зарб бар зинаи
            тарифии вазифа. Ба он иловапулиҳо барои дараҷа, собиқаи кор ва
            шароити меҳнат зам мешаванд.
          </p>
        </div>

        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Дар соҳаи хусусӣ</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Маош бо шартномаи меҳнатӣ байни корманд ва корфармо муайян мешавад
            ва аз музди ҳадди ақали қонунӣ паст буда наметавонад. Рақами дақиқ
            аз ширкат, шаҳр ва таҷрибаи шумо вобаста аст.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Дар поёни саҳифа метавонед дар бораи шароити кори ин ихтисос бипурсед.
      </p>
    </div>
  );
}

export default function SalarySection({ salary, contentWritten }) {
  const tiers = TIERS.map((tier) => ({ ...tier, value: salary?.[tier.key] })).filter(
    (tier) => tier.value,
  );

  if (!contentWritten || tiers.length === 0) return <LegalBasis />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.key} className="rounded-xl border border-border p-5">
            <tier.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">{tier.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{tier.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tier.years}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Маълумот аз таҳлили бозори меҳнат. Маоши воқеӣ аз корфармо, шаҳр ва
        таҷрибаи шумо вобаста аст.
      </p>
    </div>
  );
}
