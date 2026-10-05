import { Lang } from './trial.types';

// Оилаҳои ихтисос: 884 ихтисос → ~17 гурӯҳ аз рӯи рақамҳои 2–3-и рамз (соҳа)
// ва кластери ММТ. Рамзҳои ғайристандартӣ (масалан 6-рақама) аз рӯи кластер
// ба оилаи пешфарз меафтанд, бинобар ин кластер ҳамеша санҷида мешавад.
export interface Family {
    id: string;
    groups: string[];
    clusters: number[];
    ready: boolean;
    name: Record<Lang, string>;
}

export const FAMILIES: Family[] = [
    { id: 'it', groups: ['40', '53', '55', '98', 'B0', '45'], clusters: [1, 2], ready: true, name: { tj: 'IT ва барномасозӣ', ru: 'IT и программирование', en: 'IT and programming' } },
    { id: 'economics', groups: ['25', '27', '20', '96'], clusters: [1, 2], ready: true, name: { tj: 'Иқтисод ва муҳосибот', ru: 'Экономика и бухгалтерия', en: 'Economics and accounting' } },
    { id: 'teacher', groups: ['01', '02', '08', '00', '88'], clusters: [1, 2, 3, 4, 5], ready: true, name: { tj: 'Омӯзгорӣ', ru: 'Педагогика', en: 'Teaching' } },
    { id: 'law', groups: ['24', '93'], clusters: [4], ready: true, name: { tj: 'Ҳуқуқ', ru: 'Право', en: 'Law' } },
    { id: 'medicine', groups: ['79', '80'], clusters: [5], ready: true, name: { tj: 'Тиб ва фарматсия', ru: 'Медицина и фармация', en: 'Medicine and pharmacy' } },
    { id: 'energy', groups: ['43', '30', '38', '39'], clusters: [1], ready: false, name: { tj: 'Энергетика ва барқ', ru: 'Энергетика', en: 'Energy' } },
    { id: 'transport', groups: ['36', '37', '44', '95', '42', '46', '52'], clusters: [1], ready: false, name: { tj: 'Мошинсозӣ ва нақлиёт', ru: 'Машиностроение и транспорт', en: 'Engineering and transport' } },
    { id: 'construction', groups: ['70', '69', '56'], clusters: [1], ready: false, name: { tj: 'Сохтмон ва меъморӣ', ru: 'Строительство и архитектура', en: 'Construction and architecture' } },
    { id: 'industry', groups: ['48', '49', '50', '47', '54'], clusters: [1, 3, 5], ready: false, name: { tj: 'Химия, ғизо ва саноати сабук', ru: 'Химия, пищевая и лёгкая промышленность', en: 'Chemistry, food and light industry' } },
    { id: 'earth', groups: ['51', '33', '57', '75'], clusters: [1, 2, 5], ready: false, name: { tj: 'Геология ва экология', ru: 'Геология и экология', en: 'Geology and ecology' } },
    { id: 'agro', groups: ['74'], clusters: [1, 2, 5], ready: false, name: { tj: 'Кишоварзӣ', ru: 'Сельское хозяйство', en: 'Agriculture' } },
    { id: 'governance', groups: ['26', '23'], clusters: [1, 2, 3, 4], ready: false, name: { tj: 'Идора ва муносибатҳои байналмилалӣ', ru: 'Управление и международные отношения', en: 'Governance and international relations' } },
    { id: 'humanities', groups: ['21'], clusters: [1, 2, 3, 4], ready: false, name: { tj: 'Таърих, фалсафа ва дин', ru: 'История, философия и религия', en: 'History, philosophy and religion' } },
    { id: 'arts', groups: ['03', '15', '16', '17', '18', '19'], clusters: [1, 3, 5], ready: false, name: { tj: 'Санъат ва дизайн', ru: 'Искусство и дизайн', en: 'Arts and design' } },
    { id: 'biology', groups: ['31'], clusters: [1, 2, 5], ready: false, name: { tj: 'Биология', ru: 'Биология', en: 'Biology' } },
    { id: 'social', groups: ['86'], clusters: [3, 5], ready: false, name: { tj: 'Кори иҷтимоӣ', ru: 'Социальная работа', en: 'Social work' } },
    { id: 'tourism', groups: ['89', '91'], clusters: [1, 2, 5], ready: false, name: { tj: 'Сайёҳӣ ва хизматрасонӣ', ru: 'Туризм и сервис', en: 'Tourism and service' } },
];

// Барои кластере, ки оилаи тайёр надорад — сенарияи наздиктарин аз ҳамон самт.
const CLUSTER_DEFAULT: Record<number, string> = { 1: 'it', 2: 'economics', 3: 'teacher', 4: 'law', 5: 'medicine' };

export interface Resolved {
    // Сенарияи тайёре, ки нишон дода мешавад.
    family: string | null;
    // true — сенария маҳз барои гурӯҳи ин ихтисос аст; false — наздиктарин аз ҳамон самт.
    exact: boolean;
    // Оилаи худи ихтисос (шояд ҳанӯз тайёр набошад).
    own: string | null;
}

export function resolveFamily(code: string | null | undefined, cluster: number | null | undefined): Resolved {
    const group = String(code || '').slice(1, 3);
    const mmt = Number(cluster) || null;
    const own = FAMILIES.find((family) => family.groups.includes(group) && (!mmt || family.clusters.includes(mmt))) || null;
    if (own?.ready) return { family: own.id, exact: true, own: own.id };
    const fallback = mmt ? CLUSTER_DEFAULT[mmt] || null : null;
    return { family: fallback, exact: false, own: own?.id || null };
}
