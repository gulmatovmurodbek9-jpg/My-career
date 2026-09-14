/**
 * Номи кластери ММТ бо забони интерфейс.
 *
 * Панҷ кластер маҷмӯи пӯшидаанд ва номашон дар база ҳамеша тоҷикист, аз ин
 * рӯ тарҷумаи базавӣ лозим нест — калидҳои i18n бас аст. Ин ҳамон роҳест,
 * ки барои шакли таҳсил ва навъи пардохт истифода шуд.
 *
 * Кластер аз API бо ду шакл меояд: гоҳе бо рақам (`clusterId`), гоҳе танҳо
 * бо ном (масалан дар рӯйхати `allMatches`-и санҷиш). Барои ҳамин ҳарду роҳ
 * дастгирӣ мешавад — аввал рақам, баъд ном.
 *
 * Агар кластер ношинос бошад, ҳамон номи аслӣ бармегардад: беҳтар аст матни
 * тоҷикӣ монад, то ҷои холӣ.
 */

/* Ҳарфҳои хоси тоҷикӣ ба ҷуфти оддиашон — то навишти каме дигар ҳам ёфт шавад. */
const FOLD = { "ғ": "г", "ӣ": "и", "қ": "к", "ӯ": "у", "ҳ": "х", "ҷ": "ч", "ё": "е" };

const normalize = (value) =>
    String(value || "")
        .toLowerCase()
        .replace(/[ғӣқӯҳҷё]/g, (c) => FOLD[c])
        .replace(/[^a-zа-я0-9]+/g, " ")
        .trim();

/** Номи расмии база → рақами кластер. */
const BY_NAME = new Map(
    [
        [1, "Табиӣ ва техникӣ"],
        [2, "Иқтисод ва география"],
        [3, "Филология, педагогика ва санъат"],
        [4, "Ҷомеашиносӣ ва ҳуқуқ"],
        [5, "Тиб, биология ва варзиш"],
    ].map(([number, name]) => [normalize(name), number]),
);

/** Рақами кластерро аз объект ё сатр мебарорад. */
function clusterNumber(cluster) {
    if (cluster == null) return null;

    if (typeof cluster === "object") {
        const direct = cluster.clusterId ?? cluster.clusterNumber ?? cluster.number;
        if (direct >= 1 && direct <= 5) return Number(direct);
        return clusterNumber(cluster.clusterName ?? cluster.name);
    }

    const found = BY_NAME.get(normalize(cluster));
    return found ?? null;
}

/** Номи аслӣ — вақте тарҷума ёфт нашавад. */
function rawName(cluster) {
    if (cluster == null) return "";
    if (typeof cluster === "object") return cluster.clusterName ?? cluster.name ?? "";
    return String(cluster);
}

/** Номи кластер бо забони ҷорӣ. */
export function clusterLabel(t, cluster) {
    const number = clusterNumber(cluster);
    return number ? t(`career_page.cl_${number}`) : rawName(cluster);
}

/**
 * Ҳамон ном, вале бо рақами пеш аз он: «1. Табиӣ ва техникӣ».
 *
 * Рақам ороиш нест — ариза ба ММТ маҳз ба ЯК кластер супорида мешавад ва
 * довталаб бояд бидонад, ки кадомаш.
 */
export function clusterLabelNumbered(t, cluster) {
    const number = clusterNumber(cluster);
    const label = clusterLabel(t, cluster);
    return number ? `${number}. ${label}` : label;
}

/** Тавсифи кластер бо забони ҷорӣ; агар ношинос бошад — тавсифи аслӣ. */
export function clusterDescription(t, cluster, fallback = "") {
    const number = clusterNumber(cluster);
    if (number) return t(`career_page.cl_${number}_desc`);
    if (cluster && typeof cluster === "object") {
        return cluster.clusterDescription || cluster.description || fallback;
    }
    return fallback;
}
