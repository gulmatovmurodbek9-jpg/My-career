// Касбҳои санҷидашуда дар браузер — барои муқоиса (ҳатто бе ворид шудан).
// Корбари воридшуда/хонандаи синф онҳоро аз сервер ҳам мегирад (/trial/mine) ва ҳарду якҷоя мешаванд.
const KEY = "trial_history_v1";
const HIDDEN = "trial_history_hidden_v1";
const MAX = 20;

const read = (key, fallback) => {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};
const write = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* хотира пур */
    }
};

export const historyKey = (careerId, family) => (careerId ? `c:${careerId}` : `f:${family}`);

export function saveTrialResult(entry) {
    const list = read(KEY, []).filter((item) => item.key !== entry.key);
    write(KEY, [{ ...entry, at: new Date().toISOString() }, ...list].slice(0, MAX));
    write(HIDDEN, read(HIDDEN, []).filter((key) => key !== entry.key));
}

export function hideTrialResult(key) {
    write(KEY, read(KEY, []).filter((item) => item.key !== key));
    write(HIDDEN, [...new Set([...read(HIDDEN, []), key])]);
}

// Браузер + сервер: барои ҳар касб охирин натиҷа; пинҳонкардаҳо намоён намешаванд.
export function mergeHistory(server = []) {
    const hidden = new Set(read(HIDDEN, []));
    const byKey = new Map();
    for (const item of [...read(KEY, []), ...server]) {
        if (!item?.key || hidden.has(item.key)) continue;
        const old = byKey.get(item.key);
        if (!old || new Date(item.at) > new Date(old.at)) byKey.set(item.key, { ...old, ...item, name: item.name || old?.name });
    }
    return [...byKey.values()];
}

// Хол барои «беҳтарин»: писанд омадан муҳимтар аз ҳал кардан (касб бояд писанд ояд).
export function trialScore(item) {
    const total = Math.max(1, item.total || 1);
    const liked = (item.liked || 0) / total;
    const solved = (item.solved || 0) / total;
    const rating = item.rating ? item.rating / 4 : liked;
    const growth = item.confBefore && item.confAfter ? (item.confAfter - item.confBefore) / 4 : 0;
    return Math.round((liked * 0.45 + rating * 0.3 + solved * 0.15 + growth * 0.1) * 100);
}
