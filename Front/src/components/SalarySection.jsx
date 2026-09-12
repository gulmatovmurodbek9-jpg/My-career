import { Building2, Info, Rocket, Star, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  { key: "junior", icon: Rocket },
  { key: "mid", icon: TrendingUp },
  { key: "senior", icon: Star },
];

const som = (value) => value.toLocaleString("ru-RU");

function SectorAverage({ sector }) {
  const { t } = useTranslation();
  // Нисбат ба миёнаи кишвар — рақами танҳо маъное надорад.
  const ratio = Math.round((sector.amount / SALARY_SOURCE.nationalAverage) * 100);
  const diff = ratio - 100;

  return (
    <div className="rounded-2xl border border-border p-5">
      <p className="text-sm text-muted-foreground">
        {t("career_page.sal_avg_in", { sector: sector.label })}
      </p>
      <p className="mt-1 text-3xl font-semibold text-foreground">
        {som(sector.amount)} <span className="text-xl font-normal text-muted-foreground">{t("career_page.sal_per_month")}</span>
      </p>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">{t("career_page.sal_national")}</span>
          <span className="text-sm font-medium text-foreground">
            {som(SALARY_SOURCE.nationalAverage)} {t("career_page.sal_somoni")}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">{t("career_page.sal_vs_national")}</span>
          <span className="text-sm font-medium text-foreground">
            {diff === 0 ? t("career_page.sal_equal") : `${diff > 0 ? "+" : ""}${diff}%`}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">{t("career_page.sal_minimum")}</span>
          <span className="text-sm font-medium text-foreground">
            {som(SALARY_SOURCE.minimumWage)} {t("career_page.sal_somoni")}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {t("career_page.sal_note")}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("career_page.sal_source", { source: `${SALARY_SOURCE.agency}, ${SALARY_SOURCE.period}` })}
      </p>
    </div>
  );
}

function LegalBasis() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{t("career_page.sal_public")}</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("career_page.sal_public_text")}
        </p>
      </div>

      <div className="rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{t("career_page.sal_private")}</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("career_page.sal_private_text")}
        </p>
      </div>
    </div>
  );
}

export default function SalarySection({ salary, contentWritten, careerName, clusterName }) {
  const { t } = useTranslation();
  const sector = sectorFor(careerName, clusterName);
  const tiers = TIERS.map((tier) => ({
    ...tier,
    label: t(`career_page.lvl_${tier.key}`),
    years: t(`career_page.lvl_${tier.key}_years`),
    value: salary?.[tier.key],
  })).filter(
    (tier) => tier.value,
  );
  const showTiers = contentWritten && tiers.length > 0;

  return (
    <div className="space-y-4">
      {sector && <SectorAverage sector={sector} />}

      {showTiers && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {t("career_page.sal_by_experience")}
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
            {t("career_page.sal_no_data")}
          </p>
        </div>
      )}

      <LegalBasis />
    </div>
  );
}
