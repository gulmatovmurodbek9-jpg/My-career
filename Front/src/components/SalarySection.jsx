import { Building2, Info, Rocket, Star, TrendingUp } from "lucide-react";
import { SALARY_SOURCE, sectorFor } from "../lib/salarySectors";

/**
 * Маош: рақами воқеӣ бо манбаъ, на тахмин.
 *
 * Пештар ин ҷо рақамҳои бофта буданд — майдони `salaryAndMarket` барои 477
 * ихтисос ҳамагӣ 12 варианти ягона дошт, аз ин рӯ муаллим ва молиячӣ як маош
 * доштанд.
 *
 * Ҳоло се қабат нишон дода мешавад:
 *   1. Миёнаи СОҲА аз омори расмӣ — барои ҳамаи ихтисосҳо
 *   2. Зинаҳои таҷриба — танҳо барои сабтҳое, ки одам навиштааст
 *   3. Асоси қонунии ташаккули маош — барои ҳама
 *
 * Рақами соҳавӣ ҳамеша бо манбаъ ва сана меояд ва ошкоро ҳамчун миёнаи соҳа
 * ном бурда мешавад, на ҳамчун маоши ин ихтисос.
 */

const TIERS = [
  { key: "junior", label: "Навкор", years: "0-1 соли таҷриба", icon: Rocket },
  { key: "mid", label: "Миёна", years: "2-4 соли таҷриба", icon: TrendingUp },
  { key: "senior", label: "Таҷрибадор", years: "5+ соли таҷриба", icon: Star },
];

const som = (value) => value.toLocaleString("ru-RU");

function SectorAverage({ sector }) {
  // Нисбат ба миёнаи кишвар — рақами танҳо маъное надорад.
  const ratio = Math.round((sector.amount / SALARY_SOURCE.nationalAverage) * 100);
  const diff = ratio - 100;

  return (
    <div className="rounded-2xl border border-border p-5">
      <p className="text-sm text-muted-foreground">
        Маоши миёна дар соҳаи «{sector.label}»
      </p>
      <p className="mt-1 text-3xl font-semibold text-foreground">
        {som(sector.amount)} <span className="text-xl font-normal text-muted-foreground">сомонӣ/моҳ</span>
      </p>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">Миёнаи кишвар</span>
          <span className="text-sm font-medium text-foreground">
            {som(SALARY_SOURCE.nationalAverage)} сомонӣ
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">Нисбат ба миёнаи кишвар</span>
          <span className="text-sm font-medium text-foreground">
            {diff === 0 ? "баробар" : `${diff > 0 ? "+" : ""}${diff}%`}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">Ҳадди ақали қонунӣ</span>
          <span className="text-sm font-medium text-foreground">
            {som(SALARY_SOURCE.minimumWage)} сомонӣ
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Ин миёнаи тамоми соҳа аст, на маоши маҳз ин ихтисос. Маоши шумо аз
        корфармо, шаҳр ва таҷрибаатон вобаста аст.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Манбаъ: {SALARY_SOURCE.agency}, {SALARY_SOURCE.period}
      </p>
    </div>
  );
}

function LegalBasis() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Дар соҳаи давлатӣ</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Маош аз рӯи Кодекси меҳнати Ҷумҳурии Тоҷикистон ва шабакаи ягонаи
          тарифӣ муайян мешавад: музди ҳадди ақали қонунӣ зарб бар зинаи тарифии
          вазифа. Ба он иловапулиҳо барои дараҷа, собиқаи кор ва шароити меҳнат
          зам мешаванд.
        </p>
      </div>

      <div className="rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Дар соҳаи хусусӣ</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Маош бо шартномаи меҳнатӣ байни корманд ва корфармо муайян мешавад ва
          аз музди ҳадди ақали қонунӣ паст буда наметавонад. Рақами дақиқ аз
          ширкат, шаҳр ва таҷрибаи шумо вобаста аст.
        </p>
      </div>
    </div>
  );
}

export default function SalarySection({ salary, contentWritten, careerName, clusterName }) {
  const sector = sectorFor(careerName, clusterName);
  const tiers = TIERS.map((tier) => ({ ...tier, value: salary?.[tier.key] })).filter(
    (tier) => tier.value,
  );
  const showTiers = contentWritten && tiers.length > 0;

  return (
    <div className="space-y-4">
      {sector && <SectorAverage sector={sector} />}

      {showTiers && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            Аз рӯи таҷриба дар ҳамин ихтисос
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {tiers.map((tier) => (
              <div key={tier.key} className="rounded-2xl border border-border p-5">
                <tier.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">{tier.label}</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{tier.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tier.years}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!sector && !showTiers && (
        <div className="flex gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            Барои ин ихтисос маълумоти тасдиқшудаи маош надорем. Рақами тахминӣ
            нишон намедиҳем, то шумо дар асоси маълумоти нодуруст қарор нагиред.
          </p>
        </div>
      )}

      <LegalBasis />
    </div>
  );
}
