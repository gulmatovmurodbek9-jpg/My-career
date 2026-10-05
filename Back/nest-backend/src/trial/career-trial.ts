import { Lang, Scenario, TaskKey } from './trial.types';

// «Як рӯз дар ихтисос» барои ҳар ихтисоси алоҳида (884). Матнро AI аз рӯи маълумоти
// худи ихтисос (ном, рамз, кластер, тавсиф, малакаҳо, донишгоҳҳо) як бор месозад:
// аввал тоҷикӣ, баъд тарҷумаи русӣ ва англисӣ бо ҳамон сохтор. Ин файл сохтор,
// санҷиши қатъӣ ва омехтани вариантҳоро дорад.

export const LANGS: Lang[] = ['tj', 'ru', 'en'];

// 5 вазифаи касбӣ + 3 вазифа бо одамон (~20 дақиқа).
export const HARD_TASKS = 5;
export const SOFT_TASKS = 3;
export const TASK_COUNT = HARD_TASKS + SOFT_TASKS;
export const TASK_IDS = Array.from({ length: TASK_COUNT }, (_, i) => `t${i + 1}`);
const PROS_CONS = [7, 10];

export interface CareerTrialExtra {
    day: Array<{ time: string; text: string }>;
    pros: string[];
    cons: string[];
    goodFor: string[];
    hardFor: string[];
}

export type CareerTrialText = Scenario['text']['tj'] & CareerTrialExtra;

export interface CareerTrialContent {
    keys: TaskKey[];
    text: Record<Lang, CareerTrialText>;
}

const BANNED: Array<[RegExp, string]> = [
    [/(маош|зарплат|salary|музд|оклад)[^."]{0,40}\d{3,}/i, 'рақами маош'],
    [/\d{3,}[^."]{0,25}(маош|зарплат|salary|музд|оклад)/i, 'рақами маош'],
    [/(модда|моддаи|статья|статьи|статье|article)\s*№?\s*\d+/i, 'рақами моддаи қонун'],
    [/\b\d{1,3}\s*%\s*(кафолат|гарант|guarantee)/i, 'кафолати фоизӣ'],
];

const str = (value: unknown, min = 2, max = 600) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
const list = (value: unknown, min: number, max: number, itemMax = 400) =>
    Array.isArray(value) && value.length >= min && value.length <= max && value.every((item) => str(item, 2, itemMax));

export function validateKeys(keys: any): string[] {
    const errors: string[] = [];
    if (!Array.isArray(keys) || keys.length !== TASK_COUNT) return [`keys бояд ${TASK_COUNT} бошад`];
    keys.forEach((key: any, i: number) => {
        if (key?.id !== TASK_IDS[i]) errors.push(`keys[${i}].id бояд ${TASK_IDS[i]} бошад`);
        if (!['choice', 'order', 'multi'].includes(key?.kind)) errors.push(`keys[${i}].kind`);
        if (key?.skill !== (i < HARD_TASKS ? 'hard' : 'soft')) errors.push(`keys[${i}].skill бояд ${i < HARD_TASKS ? 'hard' : 'soft'} бошад`);
        if (key?.kind === 'choice' && typeof key.answer !== 'string') errors.push(`keys[${i}].answer`);
        if ((key?.kind === 'order' || key?.kind === 'multi') && !(Array.isArray(key.answer) && key.answer.length >= 2)) errors.push(`keys[${i}].answer`);
        if (key?.kind === 'multi' && Array.isArray(key.answer) && key.answer.length !== 2) errors.push(`keys[${i}]: multi бояд маҳз 2 ҷавоб дошта бошад`);
    });
    const varied = keys.filter((key: any) => key?.kind !== 'choice').length;
    if (varied < 2) errors.push('камаш 2 вазифа бояд "order" ё "multi" бошад');
    return errors;
}

// Як забон: ҳамаи майдонҳо, вариантҳо бо keys мувофиқ, бе маълумоти манъшуда.
export function validateLanguage(t: any, keys: TaskKey[], lang: Lang, reference?: any): string[] {
    const errors: string[] = [];
    if (!t || typeof t !== 'object') return [`${lang}: объект нест`];
    for (const field of ['role', 'place', 'intro']) if (!str(t[field], 2, 500)) errors.push(`${lang}.${field}`);
    if (!Array.isArray(t.day) || t.day.length < 5 || t.day.length > 7 || !t.day.every((d: any) => str(d?.time, 1, 20) && str(d?.text, 5, 260))) errors.push(`${lang}.day (5–7)`);
    if (!list(t.pros, PROS_CONS[0], PROS_CONS[1], 280)) errors.push(`${lang}.pros (${PROS_CONS[0]}–${PROS_CONS[1]})`);
    if (!list(t.cons, PROS_CONS[0], PROS_CONS[1], 280)) errors.push(`${lang}.cons (${PROS_CONS[0]}–${PROS_CONS[1]})`);
    if (!list(t.goodFor, 3, 5, 220)) errors.push(`${lang}.goodFor (3–5)`);
    if (!list(t.hardFor, 3, 5, 220)) errors.push(`${lang}.hardFor (3–5)`);
    if (!Array.isArray(t.tasks) || t.tasks.length !== TASK_COUNT) return [...errors, `${lang}.tasks бояд ${TASK_COUNT} бошад`];
    t.tasks.forEach((task: any, i: number) => {
        const key = keys[i];
        const where = `${lang}.tasks[${i}]`;
        for (const field of ['title', 'question', 'skillName', 'realLife', 'tip']) if (!str(task?.[field], 2, 600)) errors.push(`${where}.${field}`);
        if (task?.prompt != null && !str(task.prompt, 0, 900)) errors.push(`${where}.prompt`);
        if (!list(task?.steps, 3, 4, 320)) errors.push(`${where}.steps (3–4)`);
        const options = task?.options;
        if (!Array.isArray(options) || options.length < 3 || options.length > 4) { errors.push(`${where}.options (3–4)`); return; }
        const optionIds = options.map((o: any) => o?.id);
        if (new Set(optionIds).size !== optionIds.length) errors.push(`${where}.options: id такрор`);
        options.forEach((o: any, j: number) => {
            if (!str(o?.text, 1, 450)) errors.push(`${where}.options[${j}].text`);
            if (key.kind !== 'order' && !str(o?.feedback, 5, 450)) errors.push(`${where}.options[${j}].feedback`);
        });
        const answers = Array.isArray(key.answer) ? key.answer : [key.answer];
        if (!answers.every((id: string) => optionIds.includes(id))) errors.push(`${where}: ҷавоби keys дар вариантҳо нест`);
        if (key.kind === 'order' && answers.length !== options.length) errors.push(`${where}: order бояд ҳамаи вариантҳоро дошта бошад`);
        if (key.kind === 'multi' && options.length !== 4) errors.push(`${where}: multi бояд 4 вариант дошта бошад`);
        if (reference) {
            const refIds = (reference.tasks?.[i]?.options || []).map((o: any) => o?.id).sort().join();
            if ([...optionIds].sort().join() !== refIds) errors.push(`${where}: id-и вариантҳо бо tj фарқ доранд`);
        }
    });
    const blob = JSON.stringify(t);
    for (const [pattern, label] of BANNED) if (pattern.test(blob)) errors.push(`${lang}: ${label}`);
    if (lang === 'tj' && !/[ӣӯқғҳҷ]/i.test(blob)) errors.push('tj: ҳарфҳои тоҷикӣ (ӣ ӯ қ ғ ҳ ҷ) нест');
    // Ба хонанда — «шумо», на «ту» (дар матни роҳнамо; дар суханони одамон дар quote мумкин).
    if (lang === 'tj') {
        const guide = [t.intro, ...(t.day || []).map((d: any) => d?.text), ...(t.tasks || []).flatMap((task: any) => [task?.prompt, task?.question, task?.realLife, task?.tip, ...(task?.steps || [])])].join(' ');
        if (/(^|[\s,.!?«(])(ту|туро|ба ту|аз ту)(?=[\s,.!?»)])/i.test(guide)) errors.push('tj: ба хонанда «шумо» гӯед, на «ту»');
        const singular = (t.tasks || []).map((task: any) => String(task?.title || '').trim()).filter((title: string) => /\s(кун|ёб|соз|бин|навис|гӯй|интихоб кун|ҳисоб кун|тартиб деҳ|деҳ)[.!]?$/i.test(title));
        if (singular.length) errors.push(`tj: сарлавҳа бо «шумо» бошад (масалан «муайян кунед»): ${singular.slice(0, 2).join('; ')}`);
    }
    if (lang === 'ru' && !/[ыэё]/i.test(blob)) errors.push('ru: матни русӣ нест');
    // Дар ихтисосҳои забон вариантҳо метавонанд қасдан тоҷикӣ/русӣ бошанд — таносубро месанҷем.
    if (lang === 'en') {
        const cyrillic = (blob.match(/[а-яёӣӯқғҳҷ]/gi) || []).length;
        const latin = (blob.match(/[a-z]/gi) || []).length;
        if (cyrillic > latin * 0.4) errors.push('en: матн асосан англисӣ нест');
    }
    return errors;
}

export function validateCareerTrial(content: any): string[] {
    if (!content || typeof content !== 'object') return ['объект нест'];
    const keyErrors = validateKeys(content.keys);
    if (keyErrors.length) return keyErrors;
    const errors: string[] = [];
    for (const lang of LANGS) {
        errors.push(...validateLanguage(content.text?.[lang], content.keys, lang, lang === 'tj' ? undefined : content.text?.tj));
    }
    return errors;
}

// Тасодуфии такроршаванда (аз рӯи id-и ихтисос) — ҳар бор ҳамон тартиб.
function seeded(seed: string) {
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => {
        h = Math.imul(h ^ (h >>> 15), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
}

// AI ҷавоби дурустро аксар вақт дар як ҷой мегузорад. Вариантҳоро омехта ва ҳарфҳоро
// аз нав (a, b, c, d) мегузорем — дар ҳамаи забонҳо ҳамон тартиб. Вазифаи «тартиб» дар
// ҳолати аввал ҳеҷ гоҳ ҳалшуда намемонад.
export function shuffleCareerTrial(content: CareerTrialContent, seed: string): CareerTrialContent {
    const random = seeded(seed);
    const out: CareerTrialContent = JSON.parse(JSON.stringify(content));
    out.keys.forEach((key, i) => {
        const base = out.text.tj.tasks[i].options!.map((o) => o.id);
        let order = [...base];
        for (let attempt = 0; attempt < 10; attempt += 1) {
            order = [...base];
            for (let j = order.length - 1; j > 0; j -= 1) {
                const k = Math.floor(random() * (j + 1));
                [order[j], order[k]] = [order[k], order[j]];
            }
            const answers = Array.isArray(key.answer) ? key.answer : [key.answer];
            if (key.kind !== 'order' || order[0] !== answers[0]) break;
        }
        const rename = new Map(order.map((id, index) => [id, 'abcd'[index]]));
        for (const lang of LANGS) {
            const task = out.text[lang].tasks[i];
            const byId = new Map(task.options!.map((o) => [o.id, o]));
            task.options = order.map((id) => ({ ...byId.get(id)!, id: rename.get(id)! }));
        }
        if (Array.isArray(key.answer)) key.answer = (key.answer as string[]).map((id) => rename.get(id)!);
        else key.answer = rename.get(key.answer as string)!;
        if (key.kind === 'order') key.mustFirst = (key.answer as string[])[0];
        else delete key.mustFirst;
        key.related = [];
    });
    return out;
}

export interface CareerFacts {
    name: string;
    nameRu?: string | null;
    nameEn?: string | null;
    code?: string | null;
    cluster?: string | null;
    mmtCluster?: number | null;
    degreeType?: string | null;
    durationYears?: number | null;
    description?: string | null;
    purpose?: string | null;
    skills?: any;
    technologies?: string[] | null;
    careerOpportunities?: string[] | null;
    institutions?: string[] | null;
    cities?: string[] | null;
}

// Қадами 1: keys + матни тоҷикӣ.
export function buildCareerTrialPrompt(facts: CareerFacts): string {
    const factLines = [
        `Номи ихтисос (тоҷикӣ): ${facts.name}`,
        facts.nameRu ? `Название (рус.): ${facts.nameRu}` : '',
        facts.nameEn ? `Name (en): ${facts.nameEn}` : '',
        facts.code ? `Рамзи ММТ: ${facts.code}` : '',
        facts.cluster ? `Кластери ММТ: ${facts.mmtCluster ?? ''} — ${facts.cluster}` : '',
        facts.degreeType ? `Дараҷа: ${facts.degreeType}, ${facts.durationYears ?? ''} сол` : '',
        facts.description ? `Тавсиф: ${String(facts.description).slice(0, 900)}` : '',
        facts.purpose ? `Ҳадаф: ${String(facts.purpose).slice(0, 600)}` : '',
        facts.skills ? `Малакаҳо: ${JSON.stringify(facts.skills).slice(0, 600)}` : '',
        facts.technologies?.length ? `Асбобҳо: ${facts.technologies.slice(0, 12).join(', ')}` : '',
        facts.careerOpportunities?.length ? `Ҷойҳои кор: ${facts.careerOpportunities.slice(0, 10).join(', ')}` : '',
        facts.institutions?.length ? `Дар куҷо таълим медиҳанд: ${facts.institutions.slice(0, 8).join('; ')}` : '',
        facts.cities?.length ? `Шаҳрҳо: ${facts.cities.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    return `Ту муаллифи сенарияҳои касбинтихобкунӣ барои хонандагони синфи 9–11 дар Тоҷикистон ҳастӣ.
Вазифа: барои ИН ихтисоси мушаххас сенарияи «Як рӯз дар ихтисос» соз — хонанда ~20 дақиқа кори ҳақиқии ҳамин мутахассисро худаш мекунад ва мефаҳмад, ки ин кор ба ӯ писанд аст ё не.

МАЪЛУМОТИ ИХТИСОС (аз базаи расмии ММТ):
${factLines}

ҚОИДАҲОИ ҚАТЪӢ:
1. Ҳама чиз бояд ба ҲАМИН ихтисос хос бошад. Агар «Забони англисӣ» бошад — дарс ва тарҷумаи англисӣ, на математика. Агар ихтисос дугона бошад (масалан «Таърих. Ҳуқуқ»), ҳардуро истифода бар. Агар ихтисоси коллеҷ бошад — кори техник/мутахассиси миёна.
2. Ҷой — Тоҷикистон (Душанбе, Хуҷанд, Бохтар, Кӯлоб, Хоруғ, Истаравшан, Панҷакент, Ваҳдат, Турсунзода ва ғ.). Номҳои одамон — тоҷикӣ. Номи ширкатҳои воқеӣ НЕ.
3. Маҳз ${TASK_COUNT} вазифа бо тартиби вақти рӯз: t1–t${HARD_TASKS} — малакаи касбӣ ("hard"), t${HARD_TASKS + 1}–t${TASK_COUNT} — кор бо одамон: мизоҷ, бемор, хонанда, волидайн, ҳамкор, роҳбар ("soft"). Вазифаҳо гуногун бошанд: ҳисоб, хондани ҳуҷҷат/ҷадвал, ёфтани хато, тартиби амал, интихоби усул, бехатарӣ, сифат, қарор зери фишор.
4. Ҳар вазифа БЕ дониши махсус ҳал шавад: ҳамаи маълумоти лозимӣ (рақамҳо, ҷадвал, қоида, ҳуҷҷат) дар худи вазифа. Хонандаи 15-сола бояд бо фикр кардан ҳал карда тавонад.
5. Ҷавоби дуруст ЯКТО ва бебаҳс. Вариантҳои хато — хатоҳои маъмули навкорон, боварибахш.
6. Навъҳо: "choice" (3–4 вариант, 1 дуруст), "order" (3–4 банд; answer = тартиби пурра аз муҳимтарин/аввалин), "multi" (маҳз 4 вариант, маҳз 2 дуруст). Камаш 2 вазифа "order" ё "multi".
7. Ҳар вариант (ба ғайр аз "order") "feedback" дорад — 1–2 ҷумла: чаро дуруст/нодуруст, гарм ва содда.
8. Барои ҳар вазифа: "steps" — 3 ҷумлаи кӯтоҳ (то 25 калима): мутахассис қадам ба қадам чӣ тавр фикр мекунад; "realLife" — 1 ҷумла: ин дар кори ҳаррӯза чӣ гуна аст; "skillName" — номи малака (2–4 калима); "tip" — 1 ҷумла: хонандаи мактаб ин малакаро АЗ ҲОЗИР чӣ тавр машқ карда метавонад (мушаххас ва иҷрошаванда).
9. "day" — 6 лаҳзаи як рӯзи корӣ аз субҳ то шом (вақт + чӣ мекунад), ҳақиқӣ, на идеалӣ.
10. "pros" — 8 плюс ва "cons" — 8 минуси ҲАҚИҚӢ ва ХОС ба ҳамин ихтисос (на «кори шавқовар»-и умумӣ). Минусҳоро пинҳон накун: хастагӣ, такрор, масъулият, шароити кор, мавсимӣ будан, сафар, рақобат, таҳсили дароз ва ғ.
11. "goodFor" — 4: ба чӣ гуна одам мувофиқ аст; "hardFor" — 4: ба кӣ душвор мешавад.
12. МАНЪ: рақами маош/музд; рақами моддаҳои қонун; номи доруҳо ва миқдори воқеии табобат; кафолатҳо («100% кор меёбед»); эҳтимоли муваффақият.
13. Забон — тоҷикии адабӣ бо кириллица (ӣ ӯ қ ғ ҳ ҷ ҳатман). Ба хонанда ҲАМЕША бо «ШУМО» муроҷиат кун (шумо ҳастед, мекунед, бифаҳмед) — ҳеҷ гоҳ «ту». Сарлавҳаҳо ва саволҳо ҳам бо шакли «шумо»: «Хаторо ёбед», «Баландиро муайян кунед», на «ёб», «муайян кун». Матн кӯтоҳ ва зинда: intro — 2 ҷумла; prompt — то 3 ҷумла; вариант — то 30 калима.

ФОРМАТ — танҳо JSON:
{
  "keys": [
    {"id":"t1","kind":"choice","skill":"hard","answer":"b"},
    {"id":"t2","kind":"order","skill":"hard","answer":["c","a","b"]},
    ... то "t${TASK_COUNT}" (t1–t${HARD_TASKS} "hard", t${HARD_TASKS + 1}–t${TASK_COUNT} "soft")
  ],
  "tj": {
    "role": "номи кӯтоҳи касб",
    "place": "Шаҳр · ҷои кор · соати 8:00",
    "intro": "2 ҷумла",
    "day": [{"time":"8:00","text":"..."}, ... 6 адад],
    "tasks": [
      {
        "title": "...", "prompt": "вазъият",
        "quote": "(ихтиёрӣ) суханони одам ё матни ҳуҷҷат",
        "code": "(ихтиёрӣ) рақамҳо/рӯйхат/қисми ҳуҷҷат",
        "table": {"head":["..."],"rows":[["..."]]} (ихтиёрӣ),
        "question": "...",
        "options": [{"id":"a","text":"...","feedback":"..."}, ...],
        "skillName": "...", "steps": ["...","...","..."], "realLife": "...", "tip": "..."
      }, ... ${TASK_COUNT} адад
    ],
    "pros": [8], "cons": [8], "goodFor": [4], "hardFor": [4]
  }
}`;
}

// Қадами 2: тарҷума бо ҳамон сохтор ва ҳамон id-ҳо.
export function buildTranslatePrompt(tj: CareerTrialText, lang: 'ru' | 'en'): string {
    const name = lang === 'ru' ? 'русӣ' : 'англисӣ';
    return `Ин JSON-и сенарияи касбинтихобкунӣро ба забони ${name} тарҷума кун.
Қоидаҳо:
- Сохтор, калидҳо, тартиб ва ҳамаи "id"-ҳо айнан ҳамон монанд; танҳо матнҳо тарҷума шаванд.
- Рақамҳо, вақт, ҷадвалҳо ва номҳои шаҳр/одамон тағйир наёбанд (номҳо бо транслитератсия).
- Тарҷума табиӣ ва содда барои хонандаи 15-сола бошад, на калима ба калима.
- Ҷавоб — танҳо JSON.

${JSON.stringify(tj)}`;
}

// Матни AI → JSON (баъзан дар ```json ... ``` печонида меояд).
export function parseAiJson(raw: string): any {
    const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('JSON ёфт нашуд');
    return JSON.parse(text.slice(start, end + 1));
}

// Барои браузер: бе ҷавобҳо ва шарҳҳо (онҳо баъди ҷавоб аз /check меоянд).
export function publicTask(key: TaskKey, task: any) {
    return {
        id: key.id,
        kind: key.kind,
        skill: key.skill,
        pick: key.kind === 'multi' ? (key.answer as string[]).length : undefined,
        title: task.title,
        prompt: task.prompt,
        quote: task.quote,
        code: task.code,
        table: task.table,
        question: task.question,
        unit: task.unit,
        options: task.options?.map(({ id, text }: any) => ({ id, text })),
    };
}
