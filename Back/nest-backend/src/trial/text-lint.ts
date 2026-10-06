import { Lang } from './trial.types';

// Санҷиши механикии матн (бе AI): хатоҳое, ки AI зуд-зуд мекунад ва бо қоида ёфтан мумкин.
// Барои ҳар сатр рӯйхати хатоҳо бо мисол бармегардад.

export interface LintIssue {
    rule: string;
    sample: string;
}

const CYR = 'а-яёӣӯқғҳҷ';
const RULES: Array<{ rule: string; langs?: Lang[]; test: (text: string) => string | null }> = [
    {
        // «Cинф» бо C-и лотинӣ — дар экран ҳамон хел, аммо ҷустуҷӯ ва овоз вайрон мешаванд.
        rule: 'ҳарфи лотинӣ дар калимаи кириллӣ',
        test: (s) => s.match(new RegExp(`[${CYR}]+[a-z]+[${CYR}]*|[a-z]+[${CYR}]+[a-z]*`, 'i'))?.[0] ?? null,
    },
    { rule: 'ду фосила', test: (s) => (/\S {2,}\S/.test(s) ? s.match(/.{0,15} {2,}.{0,15}/)?.[0] ?? '' : null) },
    { rule: 'фосила пеш аз аломат', test: (s) => s.match(/.{0,15}\s[,.;:!?](?!\d).{0,10}/)?.[0] ?? null },
    {
        rule: 'бе фосила баъди аломат',
        test: (s) => s.match(new RegExp(`.{0,12}[${CYR}a-z][,;:!?][${CYR}a-z].{0,12}`, 'i'))?.[0] ?? null,
    },
    { rule: 'калимаи такрорӣ', test: (s) => s.match(new RegExp(`(^|\\s)([${CYR}a-z]{2,})\\s+\\2(?=[\\s,.!?]|$)`, 'i'))?.[0]?.trim() ?? null },
    {
        rule: 'нохунаки «» кушода монд',
        test: (s) => ((s.match(/«/g) || []).length !== (s.match(/»/g) || []).length ? s.slice(0, 60) : null),
    },
    { rule: 'ҳарфи тоҷикӣ дар матни русӣ', langs: ['ru'], test: (s) => s.match(/\S*[ӣӯқғҳҷ]\S*/i)?.[0] ?? null },
    { rule: 'кириллица дар матни англисӣ', langs: ['en'], test: (s) => s.match(new RegExp(`\\S*[${CYR}]{3,}\\S*`, 'i'))?.[0] ?? null },
    // Дар тоҷикӣ ы, щ, ц танҳо дар калимаҳои русӣ меоянд; аксар вақт — хатои AI.
    { rule: 'ҳарфи русӣ (ы/щ) дар матни тоҷикӣ', langs: ['tj'], test: (s) => s.match(/\S*[ыщ]\S*/i)?.[0] ?? null },
    { rule: 'ҳарфи хурд дар аввали ҷумла', test: (s) => s.match(new RegExp(`[.!?]\\s+[${CYR.replace('а-я', 'а-я')}](?=[${CYR}])`))?.[0] && /[.!?]\s+[a-zа-яёӣӯқғҳҷ]/.test(s) ? (s.match(/.{0,15}[.!?]\s+[a-zа-яёӣӯқғҳҷ].{0,10}/)?.[0] ?? null) : null },
];

// Ҳамаи сатрҳои матн бо роҳашон (масалан tasks[2].options[1].text).
export function collectStrings(value: any, path = ''): Array<{ path: string; text: string }> {
    if (typeof value === 'string') return [{ path, text: value }];
    if (Array.isArray(value)) return value.flatMap((item, i) => collectStrings(item, `${path}[${i}]`));
    if (value && typeof value === 'object') {
        return Object.entries(value).flatMap(([key, item]) => (key === 'id' || key === 'time' ? [] : collectStrings(item, path ? `${path}.${key}` : key)));
    }
    return [];
}

export function lintText(text: string, lang: Lang): LintIssue[] {
    const issues: LintIssue[] = [];
    for (const { rule, langs, test } of RULES) {
        if (langs && !langs.includes(lang)) continue;
        // Код ва рақамҳо (code, ҷадвал) — бе санҷиши услуб.
        const sample = test(text);
        if (sample !== null) issues.push({ rule, sample: sample.slice(0, 80) });
    }
    return issues;
}
