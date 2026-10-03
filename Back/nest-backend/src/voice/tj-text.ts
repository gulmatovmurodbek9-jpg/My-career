// Тайёр кардани матн барои модели овози тоҷикӣ.
// Модел танҳо ҳарфҳои кирилии тоҷикиро медонад: ҳар чизи дигар (лотинӣ, «ы», «щ»,
// %, + …) бесадо партофта мешуд — «AutoCAD, SCADA ва ETAP» → «ва».

// Калимаҳои маъмул — талаффузи воқеӣ, на ҳарф ба ҳарф.
const DICTIONARY: Record<string, string> = {
    ai: 'эй-ай', it: 'ай-ти', ii: 'ай-ай',
    autocad: 'аутокад', archicad: 'аркикад', revit: 'ревит', solidworks: 'солидворкс', matlab: 'матлаб',
    scada: 'скада', etap: 'итап', plc: 'пи-эл-си',
    python: 'пайтон', java: 'ҷава', javascript: 'ҷаваскрипт', typescript: 'тайпскрипт', kotlin: 'котлин', swift: 'свифт',
    php: 'пи-эйч-пи', html: 'эйч-ти-эм-эл', css: 'си-эс-эс', sql: 'эс-кю-эл', mysql: 'май-эс-кю-эл',
    postgresql: 'постгрес', postgres: 'постгрес', mongodb: 'монго-ди-би', react: 'риакт', vue: 'вю', angular: 'ангуляр',
    node: 'нод', nodejs: 'нод-ҷи-эс', git: 'гит', github: 'гитҳаб', docker: 'докер', linux: 'линукс', windows: 'виндоус',
    android: 'андроид', ios: 'ай-о-эс', iphone: 'айфон', google: 'гугл', youtube: 'ютуб', telegram: 'телеграм',
    instagram: 'инстаграм', facebook: 'фейсбук', microsoft: 'майкрософт', excel: 'эксел', word: 'ворд',
    powerpoint: 'пауэрпойнт', photoshop: 'фотошоп', illustrator: 'иллюстратор', figma: 'фигма', canva: 'канва',
    cisco: 'сиско', oracle: 'оракл', wifi: 'вай-фай', 'wi-fi': 'вай-фай', email: 'имейл', 'e-mail': 'имейл', online: 'онлайн', offline: 'офлайн',
    data: 'дата', big: 'биг', science: 'сайенс', machine: 'машин', learning: 'лёрнинг', deep: 'дип', cloud: 'клауд',
    devops: 'девопс', frontend: 'фронтенд', backend: 'бекенд', fullstack: 'фулстек', web: 'веб', design: 'дизайн',
    ux: 'ю-икс', ui: 'ю-ай', iot: 'ай-о-ти', gps: 'ҷи-пи-эс', usb: 'ю-эс-би', pdf: 'пи-ди-эф', cad: 'кад',
    ielts: 'айелтс', toefl: 'тофл', sat: 'эс-эй-ти', gpa: 'ҷи-пи-эй', mba: 'эм-би-эй', phd: 'пи-эйч-ди',
    bachelor: 'бакалавр', master: 'мастер', startup: 'стартап', marketing: 'маркетинг', smm: 'эс-эм-эм',
    seo: 'сео', crm: 'си-ар-эм', erp: 'и-ар-пи', '1c': 'як-эс', ok: 'окей', chatgpt: 'чат-ҷи-пи-ти', gpt: 'ҷи-пи-ти',
};

// Ихтисорҳо (ҳарфҳои калон) ҳарф ба ҳарф: «ETAP» → ҳар ҳарф бо номаш.
const LETTER: Record<string, string> = {
    a: 'эй', b: 'би', c: 'си', d: 'ди', e: 'и', f: 'эф', g: 'ҷи', h: 'эйч', i: 'ай', j: 'ҷей', k: 'кей', l: 'эл',
    m: 'эм', n: 'эн', o: 'оу', p: 'пи', q: 'кю', r: 'ар', s: 'эс', t: 'ти', u: 'ю', v: 'ви', w: 'дабл-ю', x: 'экс',
    y: 'уай', z: 'зед',
};

// Калимаи лотинии номаълум — тақрибан чӣ тавр навишта шуда бошад (англисӣ).
const DIGRAPHS: Array<[RegExp, string]> = [
    [/tion/g, 'шн'], [/sh/g, 'ш'], [/ch/g, 'ч'], [/th/g, 'т'], [/ph/g, 'ф'], [/ck/g, 'к'], [/qu/g, 'кв'],
    [/ee/g, 'и'], [/oo/g, 'у'], [/ea/g, 'и'], [/ou/g, 'ау'], [/ai/g, 'эй'], [/ay/g, 'эй'], [/oy/g, 'ой'],
    [/ow/g, 'оу'], [/kn/g, 'н'], [/wh/g, 'в'], [/ng\b/g, 'нг'], [/x/g, 'кс'],
];
const SINGLE: Record<string, string> = {
    a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ҷ', k: 'к', l: 'л', m: 'м',
    n: 'н', o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', y: 'й', z: 'з',
};

const spellLetters = (word: string): string =>
    [...word.toLowerCase()].map((ch) => LETTER[ch] || '').filter(Boolean).join('-');

const transliterate = (word: string): string => {
    let w = word.toLowerCase();
    if (w.length > 3 && w.endsWith('e') && !/[aeiou]e$/.test(w)) w = w.slice(0, -1); // «code» → «код»
    for (const [pattern, value] of DIGRAPHS) w = w.replace(pattern, value);
    w = w.replace(/c(?=[eiy])/g, 'с');
    let out = '';
    for (let i = 0; i < w.length; i += 1) {
        const ch = w[i];
        if (ch === 'e' && i === 0) out += 'э';
        else if (ch === 'y') out += i === w.length - 1 || !/[aeiouаеиоу]/.test(w[i + 1] || '') ? 'и' : 'й';
        else out += SINGLE[ch] ?? ch;
    }
    return out;
};

export const latinWord = (word: string): string => {
    const key = word.toLowerCase();
    if (DICTIONARY[key]) return DICTIONARY[key];
    // Ихтисор: ҳама калон (ETAP, SCADA ба луғат нарасида бошад), ё бе садонок (PLC).
    const isAcronym = (word.length <= 5 && word === word.toUpperCase() && /[A-Z]/.test(word)) || !/[aeiouy]/i.test(word);
    return isAcronym ? spellLetters(word) : transliterate(word);
};

const SYMBOLS: Array<[RegExp, string]> = [
    [/(\d)\s*%/g, '$1 фоиз'], [/%/g, ' фоиз'],
    [/(\d)\s*\+/g, '$1 ва зиёда'],
    [/№\s*/g, 'рақами '], [/&/g, ' ва '], [/\+/g, ' плюс '], [/=/g, ' баробар '],
    [/(\d)\s*°\s*C\b/g, '$1 дараҷа'], [/°/g, ' дараҷа'],
    [/\$/g, ' доллар'], [/€/g, ' евро'], [/₽/g, ' рубл'],
    [/(\d)\s*[-–—]\s*(\d)/g, '$1 то $2'], // «2000-5000», «1 500 – 2 800» → «то»
    [/\bC#/gi, 'си-шарп'], [/\bC\+\+/gi, 'си плюс плюс'], [/\.NET\b/gi, 'дот-нет'], [/\bNode\.js\b/gi, 'нод-ҷи-эс'],
    [/\b3D\b/gi, 'се-ди'], [/\b2D\b/gi, 'ду-ди'],
];

// Ҳарфҳои русӣ, ки дар модел нестанд.
const CYRILLIC_FIX: Array<[RegExp, string]> = [[/ы/g, 'и'], [/Ы/g, 'И'], [/щ/g, 'ш'], [/Щ/g, 'Ш']];

// Рамзҳои дохилии база дар қавс («(ФМДМТбоДДБ)») — барои гуфтан нестанд.
const CODE_IN_PARENS = /\s*\((?=[^)]*[A-ZА-ЯЁҶҲҚҒӮӢ]{3})[A-Za-zА-Яа-яЁёҶҷҲҳҚқҒғӮӯӢӣ]{5,}\)/g;

export function prepareTajikText(text: string): string {
    let out = String(text || '').replace(CODE_IN_PARENS, '');
    for (const [pattern, value] of SYMBOLS) out = out.replace(pattern, value);
    // Калимаҳои лотинӣ (бо рақамҳои дохилӣ, масалан «1C», «H2O» намешавад — ҳарфҳо бояд бошанд).
    out = out.replace(/[A-Za-z][A-Za-z0-9'’.-]*[A-Za-z0-9]|[A-Za-z]/g, (match) => {
        // «Node.js», «e-mail» — қисмҳоро ҷудо мехонем
        if (DICTIONARY[match.toLowerCase()]) return DICTIONARY[match.toLowerCase()];
        return match.split(/[.'’-]/).filter(Boolean).map((part) =>
            /^[A-Za-z]+$/.test(part) ? latinWord(part) : part.replace(/[A-Za-z]+/g, (letters) => latinWord(letters)),
        ).join(' ');
    });
    for (const [pattern, value] of CYRILLIC_FIX) out = out.replace(pattern, value);
    return out.replace(/\s{2,}/g, ' ').trim();
}

// ── Англисӣ: модели англисӣ ҳарфҳои кириллиро намедонад — номҳои тоҷикӣ
// («Кори табобатӣ», «Хуҷанд») бесадо гум мешуданд. Ба лотинӣ мегардонем.
const CYR_TO_LAT: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', ғ: 'gh', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', ӣ: 'i', й: 'y',
    к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ӯ: 'u', ф: 'f',
    х: 'kh', ҳ: 'h', ц: 'ts', ч: 'ch', ҷ: 'j', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function prepareEnglishText(text: string): string {
    let out = String(text || '').replace(CODE_IN_PARENS, '')
        .replace(/(\d)\s*%/g, '$1 percent').replace(/%/g, ' percent')
        .replace(/(\d)\s*\+/g, '$1 and more')
        .replace(/(\d)\s*[-–—]\s*(\d)/g, '$1 to $2')
        .replace(/&/g, ' and ').replace(/\$/g, ' dollars');
    out = out.replace(/[а-яёӣӯқғҳҷ]/gi, (ch) => {
        const lower = ch.toLowerCase();
        const lat = CYR_TO_LAT[lower] ?? '';
        return ch === lower ? lat : lat.charAt(0).toUpperCase() + lat.slice(1);
    });
    // «somoni»-ро модели англисӣ «simoni» мехонд; «somonee» дуруст шунида мешавад (санҷиш 02.10).
    out = out.replace(/\bsomoni\b/gi, (word) => (word[0] === 'S' ? 'Somonee' : 'somonee'));
    return out.replace(/\s{2,}/g, ' ').trim();
}

// ── Русӣ: пас аз «от / до / с / из / около / более / менее …» рақам дар родительный
// падеж: «до 5000» → «до пяти тысяч» (модел «до пять тысяч» мегуфт).
// Сол («с 2025 года») дасткорӣ намешавад — он порядковое аст ва модел худаш мехонад.
const RU_GEN_ONES = ['ноля', 'одного', 'двух', 'трёх', 'четырёх', 'пяти', 'шести', 'семи', 'восьми', 'девяти'];
const RU_GEN_ONES_F = ['ноля', 'одной', 'двух', 'трёх', 'четырёх', 'пяти', 'шести', 'семи', 'восьми', 'девяти'];
const RU_GEN_TEENS = ['десяти', 'одиннадцати', 'двенадцати', 'тринадцати', 'четырнадцати', 'пятнадцати', 'шестнадцати', 'семнадцати', 'восемнадцати', 'девятнадцати'];
const RU_GEN_TENS = ['', '', 'двадцати', 'тридцати', 'сорока', 'пятидесяти', 'шестидесяти', 'семидесяти', 'восьмидесяти', 'девяноста'];
const RU_GEN_HUNDREDS = ['', 'ста', 'двухсот', 'трёхсот', 'четырёхсот', 'пятисот', 'шестисот', 'семисот', 'восьмисот', 'девятисот'];

const ruGenUnder1000 = (value: number, feminine = false): string => {
    const parts = [RU_GEN_HUNDREDS[Math.floor(value / 100)]];
    const rest = value % 100;
    if (rest >= 10 && rest < 20) parts.push(RU_GEN_TEENS[rest - 10]);
    else {
        parts.push(RU_GEN_TENS[Math.floor(rest / 10)]);
        if (rest % 10) parts.push((feminine ? RU_GEN_ONES_F : RU_GEN_ONES)[rest % 10]);
    }
    return parts.filter(Boolean).join(' ');
};

export const numberToRussianGenitive = (value: number): string => {
    if (value === 0) return 'ноля';
    const millions = Math.floor(value / 1_000_000);
    const thousands = Math.floor((value % 1_000_000) / 1000);
    const rest = value % 1000;
    const one = (n: number) => n % 10 === 1 && n % 100 !== 11;
    return [
        millions ? `${ruGenUnder1000(millions)} ${one(millions) ? 'миллиона' : 'миллионов'}` : '',
        thousands ? `${ruGenUnder1000(thousands, true)} ${one(thousands) ? 'тысячи' : 'тысяч'}` : '',
        rest ? ruGenUnder1000(rest) : '',
    ].filter(Boolean).join(' ');
};

const RU_GEN_PREP = /(^|[\s(«"])(от|до|с|из|около|более|менее|свыше|меньше|больше)\s+(\d{1,3}(?:[\s ]\d{3})+|\d+)/gi;

export function prepareRussianText(text: string): string {
    const out = String(text || '').replace(CODE_IN_PARENS, '').replace(RU_GEN_PREP, (match, lead, prep, digits, offset, whole) => {
        const value = Number(String(digits).replace(/[\s ]/g, ''));
        const after = String(whole).slice(offset + match.length);
        if (!Number.isFinite(value) || value > 999_999_999) return match;
        if (value >= 1900 && value <= 2100 && /^\s*(-?[а-я]{0,3}\s*)?(год|г\.)/i.test(after)) return match;
        return `${lead}${prep} ${numberToRussianGenitive(value)}`;
    });
    return out.replace(/\s{2,}/g, ' ').trim();
}
