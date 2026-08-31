/**
 * Панҷ кластери саволномаи ММТ.
 *
 * Пештар ин номҳо танҳо дар PsychologicalProfile.jsx бо тоҷикӣ сахт навишта
 * шуда буданд, аз ин рӯ дар русӣ ва англисӣ тарҷума намешуданд ва саҳифаи
 * дигар онҳоро такрор карда наметавонист.
 */
export const MMT_CLUSTERS = [
  { key: "c1", i18nKey: "dashboard.mmt.technical", fallback: "Техникӣ" },
  { key: "c2", i18nKey: "dashboard.mmt.economics", fallback: "Иқтисод" },
  { key: "c3", i18nKey: "dashboard.mmt.philology", fallback: "Филология" },
  { key: "c4", i18nKey: "dashboard.mmt.social", fallback: "Ҷомеашиносӣ" },
  { key: "c5", i18nKey: "dashboard.mmt.medicine", fallback: "Тиб" },
];

/** Ҳадди аксари холи як кластер дар саволномаи ММТ. */
export const MMT_MAX = 30;

/**
 * Кластери пешбари корбарро бармегардонад.
 *
 * `null` вақте бармегардад, ки натиҷа нест ё ҳамаи холҳо сифранд — ҳолати
 * «ҳанӯз саволнома надодааст», ки бояд аз ҳолати «ҳамааш сифр» фарқ кунад.
 */
export function topCluster(mmtClusters, translate) {
  if (!mmtClusters) return null;

  const ranked = MMT_CLUSTERS.map((cluster) => ({
    label: translate(cluster.i18nKey, cluster.fallback),
    score: mmtClusters[cluster.key] || 0,
  })).sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0] : null;
}
