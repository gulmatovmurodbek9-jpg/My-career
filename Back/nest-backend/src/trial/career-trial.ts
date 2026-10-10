import { Lang, Scenario, TaskKey } from './trial.types';

// «Як рӯз дар ихтисос» барои ҳар ихтисоси алоҳида (884). Матнро AI аз рӯи маълумоти
// худи ихтисос (ном, рамз, кластер, тавсиф, малакаҳо, донишгоҳҳо) як бор месозад:
// аввал тоҷикӣ, баъд тарҷумаи русӣ ва англисӣ бо ҳамон сохтор. Ин файл сохтор,
// санҷиши қатъӣ ва омехтани вариантҳоро дорад.

export const LANGS: Lang[] = ['tj', 'ru', 'en'];

// 2 вазифаи касбӣ + 2 вазифа бо одамон (~10 дақиқа) — кӯтоҳ, то хонанда хаста нашавад.
export const HARD_TASKS = 2;
export const SOFT_TASKS = 2;
export const CAREER_TRIAL_MINUTES = 10;
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
    [/(маош|зарплат|salary|wage|музди меҳнат|оклад)[^."]{0,40}\d{3,}/i, 'рақами маош'],
    [/\d{3,}[^."]{0,25}(маош|зарплат|salary|wage|музди меҳнат|оклад)/i, 'рақами маош'],
    [/(модда|моддаи|статья|статьи|статье|article)\s*№?\s*\d+/i, 'рақами моддаи қонун'],
    [/\b\d{1,3}\s*%\s*(кафолат|гарант|guarantee)/i, 'кафолати фоизӣ'],
];

// Вазифаҳо барои хонандаи 15-сола: бе коди барнома, SQL, HTML, формулаҳои Excel ва
// математикаи олӣ. Ин аломатҳо дар матни вазифа маънои онро доранд, ки вазифа душвор аст.
const TECHNICAL: Array<[RegExp, string]> = [
    [/\b(SELECT|INSERT\s+INTO|DELETE\s+FROM|CREATE\s+TABLE|WHERE|UPDATE\s+\S+\s+SET)\b/, 'SQL'],
    [/\b(def|print|import|return|function|elif|console\.log|printf|scanf)\b\s*[\w(]/, 'коди барнома'],
    [/\bfor\s+\w+\s+in\b|==|!=|\+=|=>|&&|\|\||[{}]/, 'коди барнома'],
    [/<\/?(div|span|p|style|html|body|a|img|h\d|ul|li|script|table|td|tr)\b[^>]*>/i, 'HTML'],
    [/=\s*[A-Z]{2,}\s*\(|\b(SUM|AVERAGE|VLOOKUP|COUNTIF|SUMIF)\s*\(/, 'формулаи Excel'],
    [/[√∫∑∂]|\\frac|\^\s*\d|\b(sin|cos|tan|log|ln)\s*\(/, 'математикаи олӣ'],
    [/(интеграл|ҳосилаи функсия|формула)/i, 'формула'],
    // Истилоҳҳои IT, ки хонанда намедонад (саволи «браузер аввал чӣ мекунад: IP ё HTML?»).
    [/(^|[^A-Za-z])(IP|DNS|HTML|CSS|URL|API|SQL|HTTP|TCP)([^A-Za-z]|$)|IP-адрес|сервер|протокол|конфигуратсия|пойгоҳи додаҳо|браузер/i, 'истилоҳи IT'],
    [/(^|[\s(])[A-Za-z]\s*=\s*[A-Za-z0-9(]/, 'формула'],
];

export function technicalIssues(task: any): string[] {
    const text = [task?.title, task?.prompt, task?.quote, task?.code, task?.question, ...(task?.options || []).map((o: any) => o?.text),
        ...(task?.table ? [...(task.table.head || []), ...(task.table.rows || []).flat()] : [])].filter(Boolean).join('\n');
    return TECHNICAL.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}

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
    if (varied < 1) errors.push('камаш 1 вазифа бояд "order" ё "multi" бошад');
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
        if (lang === 'tj') {
            const technical = technicalIssues(task);
            if (technical.length) errors.push(`${where}: вазифа душвор/техникӣ (${[...new Set(technical)].join(', ')}) — бо забони одӣ, бе код ва формула соз`);
        }
        if (reference) {
            const refIds = (reference.tasks?.[i]?.options || []).map((o: any) => o?.id).sort().join();
            if ([...optionIds].sort().join() !== refIds) errors.push(`${where}: id-и вариантҳо бо tj фарқ доранд`);
        }
    });
    const blob = JSON.stringify(t);
    // Рақами маош — танҳо дар иддаоҳо дар бораи касб манъ аст; дар вазифа (масалан ҳисоби
    // музди меҳнат барои иқтисодчӣ) ин маълумоти масъала аст, на ваъда ба хонанда.
    const claims = JSON.stringify([t.role, t.intro, t.day, t.pros, t.cons, t.goodFor, t.hardFor]);
    for (const [pattern, label] of BANNED) {
        const text = label === 'рақами маош' ? claims : blob;
        if (pattern.test(text)) errors.push(`${lang}: ${label}`);
    }
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
Вазифа: барои ИН ихтисоси мушаххас сенарияи «Як рӯз дар ихтисос» соз — хонанда ~10 дақиқа кори ҳақиқии ҳамин мутахассисро худаш мекунад ва мефаҳмад, ки ин кор ба ӯ писанд аст ё не.

МАЪЛУМОТИ ИХТИСОС (аз базаи расмии ММТ):
${factLines}

ҚОИДАҲОИ ҚАТЪӢ:
1. Ҳама чиз бояд ба ҲАМИН ихтисос хос бошад. Агар «Забони англисӣ» бошад — дарс ва тарҷумаи англисӣ, на математика. Агар ихтисос дугона бошад (масалан «Таърих. Ҳуқуқ»), ҳардуро истифода бар. Агар ихтисоси коллеҷ бошад — кори техник/мутахассиси миёна.
2. Ҷой — Тоҷикистон (Душанбе, Хуҷанд, Бохтар, Кӯлоб, Хоруғ, Истаравшан, Панҷакент, Ваҳдат, Турсунзода ва ғ.). Номҳои одамон — тоҷикӣ. Номи ширкатҳои воқеӣ НЕ.
3. Маҳз ${TASK_COUNT} вазифа бо тартиби вақти рӯз: t1–t${HARD_TASKS} — малакаи касбӣ ("hard"), t${HARD_TASKS + 1}–t${TASK_COUNT} — кор бо одамон: мизоҷ, бемор, хонанда, волидайн, ҳамкор, роҳбар ("soft"). Вазифаҳо гуногун бошанд: ҳисоб, хондани ҳуҷҷат/ҷадвал, ёфтани хато, тартиби амал, интихоби усул, бехатарӣ, сифат, қарор зери фишор.
4. ОСОН ВА ФАҲМО — ин муҳимтарин қоида аст. Хонанда ҳоло ин касбро НАМЕДОНАД; вазифа санҷиши дониш нест, балки «таъми» кор аст. Ҳар вазифа бо ақли солим ва хондани бодиққат дар 1–2 дақиқа ҳал шавад. Ҳамаи маълумоти лозимӣ дар худи вазифа.
   МАНЪ дар вазифаҳо: коди барнома (Python, SQL, HTML, JavaScript ва ғ.), истилоҳҳои IT (IP, DNS, сервер, протокол, браузер, пойгоҳи додаҳо, API), формулаҳои Excel, муодила, формулаҳои физика/химия/математика, интеграл, ҳосила, истилоҳоти махсус бе шарҳ. Ҳисоб — танҳо ҷамъ, тарҳ, зарб ё тақсими оддӣ бо рақамҳои мудаввар. Калимаи «формула»-ро нанависед ва ҳарфҳоро ба ҷои рақам нагузоред (на «S = a × b», балки «масоҳат = дарозӣ × бар»). Ҳатто барои муаллими математика ё физика вазифаҳо дар бораи кор бо хонандагон, нақшаи дарс, санҷиши дафтар, мисоли ҳаётӣ бошанд.
   Ҳатто барои барномасоз, математик, муҳандис ё иқтисодчӣ — вазифаи ҳаётӣ бо забони одӣ: фаҳмидани хоҳиши мизоҷ, интихоби он чӣ аввал кардан лозим, ёфтани хато дар рӯйхат ё ҷадвали содда, қарори бехатар, муқоисаи ду вариант. Масалан барномасоз: «Корбарон шикоят мекунанд, ки тугмаи “Пардохт” кор намекунад — аввал чӣ мекунед?», на «Хаторо дар код ёбед».
5. Ҷавоби дуруст ЯКТО ва бебаҳс. Вариантҳои хато — хатоҳои маъмули навкорон, боварибахш.
6. Навъҳо: "choice" (3–4 вариант, 1 дуруст), "order" (3–4 банд; answer = тартиби пурра аз муҳимтарин/аввалин), "multi" (маҳз 4 вариант, маҳз 2 дуруст). Камаш 1 вазифа "order" ё "multi".
7. Ҳар вариант (ба ғайр аз "order") "feedback" дорад — 1–2 ҷумла: чаро дуруст/нодуруст, гарм ва содда.
8. Барои ҳар вазифа: "steps" — 3 ҷумлаи кӯтоҳ (то 25 калима): мутахассис қадам ба қадам чӣ тавр фикр мекунад; "realLife" — 1 ҷумла: ин дар кори ҳаррӯза чӣ гуна аст; "skillName" — номи малака (2–4 калима); "tip" — 1 ҷумла: хонандаи мактаб ин малакаро АЗ ҲОЗИР чӣ тавр машқ карда метавонад (мушаххас ва иҷрошаванда).
9. "day" — 6 лаҳзаи як рӯзи корӣ аз субҳ то шом (вақт + чӣ мекунад), ҳақиқӣ, на идеалӣ.
10. "pros" — 8 плюс ва "cons" — 8 минуси ҲАҚИҚӢ ва ХОС ба ҳамин ихтисос (на «кори шавқовар»-и умумӣ). Минусҳоро пинҳон накун: хастагӣ, такрор, масъулият, шароити кор, мавсимӣ будан, сафар, рақобат, таҳсили дароз ва ғ.
11. "goodFor" — 4: ба чӣ гуна одам мувофиқ аст; "hardFor" — 4: ба кӣ душвор мешавад.
12. МАНЪ: рақами маош/музд; рақами моддаҳои қонун; номи доруҳо ва миқдори воқеии табобат; кафолатҳо («100% кор меёбед»); эҳтимоли муваффақият.
13. Забон — тоҷикии адабӣ бо кириллица (ӣ ӯ қ ғ ҳ ҷ ҳатман). Ба хонанда ҲАМЕША бо «ШУМО» муроҷиат кун (шумо ҳастед, мекунед, бифаҳмед) — ҳеҷ гоҳ «ту». Сарлавҳаҳо ва саволҳо ҳам бо шакли «шумо»: «Хаторо ёбед», «Баландиро муайян кунед», на «ёб», «муайян кун». Матн кӯтоҳ ва зинда: intro — 2 ҷумла; prompt — то 3 ҷумла; вариант — то 20 калима, содда.

ФОРМАТ — танҳо JSON-и дуруст. Дар ДОХИЛИ матнҳо нохунаки дукабата (\") НАГУЗОР — барои иқтибос танҳо «...» истифода бар. Маҳз 3–4 вариант дар ҳар вазифа (multi — маҳз 4).
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
        "code": "(ихтиёрӣ) рӯйхат ё қисми ҳуҷҷат бо забони одӣ — ҲЕҶ ГОҲ коди барнома ё формула",
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
- Дар дохили матнҳо нохунаки дукабата (\") нагузор — танҳо « » (ru) ё ‘ ’ / “ ” (en).
- Ҷавоб — танҳо JSON-и дуруст.

${JSON.stringify(tj)}`;
}

// Матни AI → JSON (баъзан дар ```json ... ``` печонида меояд).
export function parseAiJson(raw: string): any {
    const text = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('JSON ёфт нашуд');
    const body = text.slice(start, end + 1);
    try {
        return JSON.parse(body);
    } catch (error) {
        // AI баъзан дар дохили матн " мегузорад. Нохунаке, ки пас аз он , : } ] намеояд,
        // нохунаки дохилӣ аст — онро escape мекунем ва боз кӯшиш мекунем.
        try {
            return JSON.parse(repairInnerQuotes(body));
        } catch {
            throw error;
        }
    }
}

export function repairInnerQuotes(json: string): string {
    let out = '';
    let inString = false;
    const stack: string[] = [];
    for (let i = 0; i < json.length; i += 1) {
        const ch = json[i];
        if (inString && ch === '\\') {
            out += ch + (json[i + 1] ?? '');
            i += 1;
            continue;
        }
        if (ch === '"') {
            if (!inString) {
                inString = true;
            } else {
                let j = i + 1;
                while (j < json.length && /\s/.test(json[j])) j += 1;
                if (j >= json.length || ',:}]'.includes(json[j])) inString = false;
                else {
                    out += '\\"';
                    continue;
                }
            }
        }
        if (inString && (ch === '\n' || ch === '\r')) {
            out += ch === '\n' ? '\\n' : '';
            continue;
        }
        if (!inString) {
            if (ch === '{' || ch === '[') stack.push(ch);
            else if (ch === '}' || ch === ']') {
                // Вергули иловагӣ пеш аз қавси пӯшанда.
                out = out.replace(/,\s*$/, '');
                // Модел баъзан рӯйхатро бо } мепӯшад (ё баръакс) — қавси дурустро мегузорем.
                const open = stack.pop();
                out += open === '[' ? ']' : '}';
                continue;
            }
        }
        out += ch;
    }
    return out;
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
