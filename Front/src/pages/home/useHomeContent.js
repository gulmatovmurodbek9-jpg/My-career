import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API } from "../../lib/config";
import { HOME_CONTENT, resolveLang } from "./content";

export const ACCENTS = {
  1: { accent: "var(--cluster-1)", icon: "Atom" },
  2: { accent: "var(--cluster-2)", icon: "TrendingUp" },
  3: { accent: "var(--cluster-3)", icon: "BookOpen" },
  4: { accent: "var(--cluster-4)", icon: "Scale" },
  5: { accent: "var(--cluster-5)", icon: "HeartPulse" },
};
export function useHomeContent() {
  const { i18n } = useTranslation();
  return HOME_CONTENT[resolveLang(i18n.language)];
}

export function useClusterChapters() {
  const content = useHomeContent();
  const [live, setLive] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    axios
      .get(`${API}/clusters`, { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setLive(new Map(data.map((cluster) => [cluster.clusterId, cluster])));
      })
      .catch(() => {
      });

    return () => controller.abort();
  }, []);

  return useMemo(
    () =>
      content.clusters.map((chapter) => {
        const match = live?.get(chapter.clusterId);
        return {
          ...chapter,
          ...ACCENTS[chapter.clusterId],
          id: match?.id,
          careerCount: match?.careerCount ?? (Array.isArray(match?.careers) ? match.careers.length : undefined),
        };
      }),
    [content, live]
  );
}

export const chapterLabel = (i) => String(i + 1).padStart(2, "0");
