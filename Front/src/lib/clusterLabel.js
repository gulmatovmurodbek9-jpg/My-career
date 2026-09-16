
const FOLD = { "ғ": "г", "ӣ": "и", "қ": "к", "ӯ": "у", "ҳ": "х", "ҷ": "ч", "ё": "е" };

const normalize = (value) =>
    String(value || "")
        .toLowerCase()
        .replace(/[ғӣқӯҳҷё]/g, (c) => FOLD[c])
        .replace(/[^a-zа-я0-9]+/g, " ")
        .trim();

const BY_NAME = new Map(
    [
        [1, "Табиӣ ва техникӣ"],
        [2, "Иқтисод ва география"],
        [3, "Филология, педагогика ва санъат"],
        [4, "Ҷомеашиносӣ ва ҳуқуқ"],
        [5, "Тиб, биология ва варзиш"],
    ].map(([number, name]) => [normalize(name), number]),
);

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

function rawName(cluster) {
    if (cluster == null) return "";
    if (typeof cluster === "object") return cluster.clusterName ?? cluster.name ?? "";
    return String(cluster);
}

export function clusterLabel(t, cluster) {
    const number = clusterNumber(cluster);
    return number ? t(`career_page.cl_${number}`) : rawName(cluster);
}

export function clusterLabelNumbered(t, cluster) {
    const number = clusterNumber(cluster);
    const label = clusterLabel(t, cluster);
    return number ? `${number}. ${label}` : label;
}

export function clusterDescription(t, cluster, fallback = "") {
    const number = clusterNumber(cluster);
    if (number) return t(`career_page.cl_${number}_desc`);
    if (cluster && typeof cluster === "object") {
        return cluster.clusterDescription || cluster.description || fallback;
    }
    return fallback;
}
