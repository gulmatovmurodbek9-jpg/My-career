import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API } from "../../lib/config";
import { HOME_CONTENT, resolveLang } from "./content";

/**
 * Ранг ва иконкаи ҳар кластер. Аз матн ҷудо аст: ранг ба забон вобаста нест.
 *
 * Ранг ҳамчун CSS-тағйирёбанда дода мешавад, на ҳамчун hex: ҳар кластер дар
 * темаи равшан ва торик ранги гуногун мехоҳад, вагарна дар яке аз онҳо матн
 * контрасти кофӣ намедиҳад. Қиматҳо дар index.css таъриф шудаанд.
 */
export const ACCENTS = {
  1: { accent: "var(--cluster-1)", icon: "Atom" },
  2: { accent: "var(--cluster-2)", icon: "TrendingUp" },
  3: { accent: "var(--cluster-3)", icon: "BookOpen" },
  4: { accent: "var(--cluster-4)", icon: "Scale" },
  5: { accent: "var(--cluster-5)", icon: "HeartPulse" },
};
/**
 * Матни сафҳаи асосӣ бо забони ҷорӣ.
 *
 * Ивазкунии забон дар навбар i18next-ро иваз мекунад, ва ин ҳук аз нав ҳисоб
 * мешавад — саҳифа фавран тарҷума мешавад.
 */
export function useHomeContent() {
  const { i18n } = useTranslation();
  return HOME_CONTENT[resolveLang(i18n.language)];
}

/**
 * Бобҳои кластерҳо: матни тарҷумашуда + ранг + маълумоти зиндаи API.
 *
 * Матн фавран баргардонида мешавад, то саҳифа бе интизорӣ ва бе ҷаҳиши
 * ҷойгиршавӣ рендер шавад. Вақте API ҷавоб дод, id-и воқеӣ (барои истиноди
 * /careers?clusterId=…) ва шумораи ихтисосҳо илова мешавад. Хатои шабака
 * саҳифаро вайрон намекунад — ҳамон матни статикӣ мемонад.
 */
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
        /* матни статикӣ аллакай намоиш дода шудааст */
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
          careerCount: Array.isArray(match?.careers) ? match.careers.length : undefined,
        };
      }),
    [content, live]
  );
}

/** Рақами боб ҳамчун "01".."05". */
export const chapterLabel = (i) => String(i + 1).padStart(2, "0");
