// Ин қоидаҳо аз рӯи мантиқ гузошта шудаанд, на аз таҳқиқот; рақамҳоро санҷиши синф бояд тасдиқ кунад.
const MMT_MAX_SCORE = 40;

export type CareerPlaces = { local: boolean; free: boolean; count: number; fee: number | null; names: string[] };

const UNDECIDED_TOP_PERCENT = 40;
const CLOSE_SHARE = 0.15;
const NEAR_SHARE = 0.6;
const MAX_DIRECTIONS = 3;

// Калимаи аввал дар ин номҳо соҳаро муайян намекунад, бинобар ин ду калима гирифта мешавад.
const GENERIC_FIRST_WORDS = new Set(['кори', 'технологияи', 'технология', 'истифодабарии', 'идораи', 'таҳсилоти', 'системаҳои', 'ташкили']);

export function careerFamily(name: string): string {
    const words = String(name || '').toLowerCase().split(/[^0-9a-zа-яёӣӯқғҳҷ]+/i).filter(Boolean);
    return GENERIC_FIRST_WORDS.has(words[0]) ? words.slice(0, 2).join(' ') : words[0] || '';
}

// Дар рӯйхат аз як навъ на бештар аз 2 ихтисос; агар ҷой монад, боқимонда ба охир меояд.
export function diversifyCareers<T>(items: T[], nameOf: (item: T) => string, limit = 12, maxPerFamily = 2): T[] {
    const counts = new Map<string, number>();
    const picked: T[] = [];
    const rest: T[] = [];
    for (const item of items) {
        const family = careerFamily(nameOf(item));
        const count = counts.get(family) ?? 0;
        if (count < maxPerFamily) {
            counts.set(family, count + 1);
            picked.push(item);
        } else {
            rest.push(item);
        }
    }
    return [...picked, ...rest].slice(0, limit);
}

// Хонандаи дудил: самти аввал суст аст ё самти дуюм ба он наздик. Ду-се самт баробар нишон дода мешавад.
export function undecidedDirections<T extends { score: number }>(sorted: T[]): Array<T & { percent: number }> | null {
    const [first, second] = sorted;
    if (!first || !second) return null;
    const percent = (score: number) => Math.round((score / MMT_MAX_SCORE) * 100);
    const weak = percent(first.score) < UNDECIDED_TOP_PERCENT;
    const close = first.score - second.score < CLOSE_SHARE * first.score;
    if (!weak && !close) return null;
    return sorted
        .filter((entry, index) => index < 2 || entry.score >= NEAR_SHARE * first.score)
        .slice(0, MAX_DIRECTIONS)
        .map((entry) => ({ ...entry, percent: percent(entry.score) }));
}
