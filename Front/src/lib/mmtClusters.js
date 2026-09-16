export const MMT_CLUSTERS = [
  { key: "c1", i18nKey: "dashboard.mmt.technical", fallback: "Техникӣ" },
  { key: "c2", i18nKey: "dashboard.mmt.economics", fallback: "Иқтисод" },
  { key: "c3", i18nKey: "dashboard.mmt.philology", fallback: "Филология" },
  { key: "c4", i18nKey: "dashboard.mmt.social", fallback: "Ҷомеашиносӣ" },
  { key: "c5", i18nKey: "dashboard.mmt.medicine", fallback: "Тиб" },
];

export const MMT_MAX = 40;

export function topCluster(mmtClusters, translate) {
  if (!mmtClusters) return null;

  const ranked = MMT_CLUSTERS.map((cluster) => ({
    label: translate(cluster.i18nKey, cluster.fallback),
    score: mmtClusters[cluster.key] || 0,
  })).sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0] : null;
}
