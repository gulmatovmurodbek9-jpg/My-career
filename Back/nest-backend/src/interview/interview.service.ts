import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { assertAiAllowed } from '../common/ai-limit';

// «Мусоҳиба бо мутахассис»: ҳар ихтисос як мутахассиси виртуалӣ дорад (ном, шаҳр, таҷриба —
// аз рӯи id якхела). AI аз номи ӯ, аз рӯи маълумоти худи ихтисос ва сенарияи «Худро дар касб
// санҷед» (рӯзи корӣ, плюс/минус), ростқавлона ва кӯтоҳ ҷавоб медиҳад.
type Lang = 'tj' | 'ru' | 'en';
const toLang = (lang: unknown): Lang => (lang === 'ru' || lang === 'en' ? lang : 'tj');

const FEMALE = ['Фирӯза', 'Мадина', 'Зарина', 'Гулнора', 'Нигина', 'Шаҳло', 'Дилноза', 'Малика', 'Парвина', 'Сабрина'];
const MALE = ['Фаррух', 'Бахтиёр', 'Аҳмад', 'Суҳроб', 'Комрон', 'Рустам', 'Далер', 'Шаҳром', 'Илҳом', 'Ҷамшед'];
const SURNAMES = ['Каримов', 'Раҳимов', 'Назаров', 'Саидов', 'Алиев', 'Шарипов', 'Қодиров', 'Ҳасанов', 'Мирзоев', 'Юсуфов'];
const LATIN: Record<string, string> = {
    Фирӯза: 'Firuza', Мадина: 'Madina', Зарина: 'Zarina', Гулнора: 'Gulnora', Нигина: 'Nigina', Шаҳло: 'Shahlo', Дилноза: 'Dilnoza', Малика: 'Malika', Парвина: 'Parvina', Сабрина: 'Sabrina',
    Фаррух: 'Farrukh', Бахтиёр: 'Bakhtiyor', Аҳмад: 'Ahmad', Суҳроб: 'Suhrob', Комрон: 'Komron', Рустам: 'Rustam', Далер: 'Daler', Шаҳром: 'Shahrom', Илҳом: 'Ilhom', Ҷамшед: 'Jamshed',
    Каримов: 'Karimov', Раҳимов: 'Rahimov', Назаров: 'Nazarov', Саидов: 'Saidov', Алиев: 'Aliev', Шарипов: 'Sharipov', Қодиров: 'Qodirov', Ҳасанов: 'Hasanov', Мирзоев: 'Mirzoev', Юсуфов: 'Yusufov',
};
const RU_NAME: Record<string, string> = { Фирӯза: 'Фируза', Шаҳло: 'Шахло', Аҳмад: 'Ахмад', Суҳроб: 'Сухроб', Шаҳром: 'Шахром', Илҳом: 'Илхом', Ҷамшед: 'Джамшед', Раҳимов: 'Рахимов', Қодиров: 'Кодиров', Ҳасанов: 'Хасанов' };
const CITIES = ['Душанбе', 'Хуҷанд', 'Бохтар', 'Кӯлоб', 'Истаравшан', 'Хоруғ', 'Панҷакент', 'Ваҳдат'];
const CITY_LATIN: Record<string, string> = { Душанбе: 'Dushanbe', Хуҷанд: 'Khujand', Бохтар: 'Bokhtar', Кӯлоб: 'Kulob', Истаравшан: 'Istaravshan', Хоруғ: 'Khorog', Панҷакент: 'Panjakent', Ваҳдат: 'Vahdat' };
const CITY_RU: Record<string, string> = { Хуҷанд: 'Худжанд', Кӯлоб: 'Куляб', Хоруғ: 'Хорог', Панҷакент: 'Пенджикент', Ваҳдат: 'Вахдат' };

const SUGGEST: Record<Lang, string[]> = {
    tj: ['Рӯзи кории шумо чӣ гуна мегузарад?', 'Дар кори шумо аз ҳама душвор чӣ аст?', 'Чаро ин касбро интихоб кардед?', 'Ба ман, хонандаи мактаб, чӣ маслиҳат медиҳед?', 'Барои ин касб кадом фанҳо муҳиманд?'],
    ru: ['Как проходит ваш рабочий день?', 'Что самое трудное в вашей работе?', 'Почему вы выбрали эту профессию?', 'Что посоветуете мне, школьнику?', 'Какие предметы важны для этой профессии?'],
    en: ['What does your working day look like?', 'What is the hardest part of your job?', 'Why did you choose this career?', 'What would you advise me as a school student?', 'Which school subjects matter for this career?'],
};

function hash(text: string) {
    let h = 2166136261;
    for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
}

export interface InterviewMessage { role: 'user' | 'specialist'; text: string }

@Injectable()
export class InterviewService {
    constructor(private readonly dataSource: DataSource, private readonly ai: AiService) { }

    private async load(careerId: string, lang: Lang) {
        if (!/^[0-9a-f-]{36}$/i.test(careerId)) throw new NotFoundException('Ихтисос ёфт нашуд');
        const [career] = await this.dataSource.query(
            `SELECT c.id, c.name, c.translations, c.description, c.purpose, c.skills, c."careerOpportunities", cl."clusterName" AS cluster,
                    (SELECT content FROM career_trials t WHERE t."careerId" = c.id) AS trial
             FROM career c LEFT JOIN cluster cl ON cl.id = c."clusterId" WHERE c.id = $1`, [careerId]);
        if (!career) throw new NotFoundException('Ихтисос ёфт нашуд');
        const trial = career.trial?.text?.[lang] || career.trial?.text?.tj || null;
        return { career, trial };
    }

    private persona(career: any, trial: any, lang: Lang) {
        const h = hash(career.id);
        const female = h % 2 === 0;
        const first = (female ? FEMALE : MALE)[(h >>> 3) % 10];
        const surnameBase = SURNAMES[(h >>> 7) % 10];
        const surname = female ? `${surnameBase}а` : surnameBase;
        // Шаҳр аз сенария (масалан «Хуҷанд · мактаб · 8:00»), вагарна аз рӯйхат.
        const fromTrial = String(career.trial?.text?.tj?.place || '').split('·')[0].trim();
        const city = CITIES.includes(fromTrial) ? fromTrial : CITIES[(h >>> 11) % CITIES.length];
        const years = 4 + ((h >>> 15) % 14);
        const localName = lang === 'en'
            ? `${LATIN[first] || first} ${(LATIN[surnameBase] || surnameBase) + (female ? 'a' : '')}`
            : lang === 'ru'
                ? `${RU_NAME[first] || first} ${(RU_NAME[surnameBase] || surnameBase) + (female ? 'а' : '')}`
                : `${first} ${surname}`;
        const localCity = lang === 'en' ? CITY_LATIN[city] : lang === 'ru' ? (CITY_RU[city] || city) : city;
        const careerName = (lang !== 'tj' && career.translations?.[lang]?.name) || career.name;
        const title = trial?.role || careerName;
        return { name: localName, female, title, city: localCity, years, careerName, nameTj: `${first} ${surname}`, cityTj: city };
    }

    async info(careerId: string, rawLang?: string) {
        const lang = toLang(rawLang);
        const { career, trial } = await this.load(careerId, lang);
        const p = this.persona(career, trial, lang);
        const greeting = {
            tj: `Салом! Ман ${p.name} ҳастам, ${p.title.toLowerCase()} дар ${p.city}, ${p.years} сол таҷриба дорам. Ҳар чизе, ки дар бораи кори ман донистан мехоҳед, бипурсед — ростқавлона ҷавоб медиҳам.`,
            ru: `Здравствуйте! Я ${p.name}, ${p.title.toLowerCase()}, ${p.city}, опыт ${p.years} лет. Спрашивайте что угодно о моей работе — отвечу честно.`,
            en: `Hello! I am ${p.name}, ${p.title.toLowerCase()} in ${p.city}, with ${p.years} years of experience. Ask me anything about my work — I will answer honestly.`,
        }[lang];
        return { persona: { name: p.name, female: p.female, title: p.title, city: p.city, years: p.years }, greeting, suggestions: SUGGEST[lang] };
    }

    async ask(careerId: string, body: { messages?: InterviewMessage[]; lang?: string }, ip?: string) {
        const lang = toLang(body?.lang);
        const messages = (Array.isArray(body?.messages) ? body.messages : [])
            .filter((m) => m && (m.role === 'user' || m.role === 'specialist') && typeof m.text === 'string')
            .map((m) => ({ role: m.role, text: m.text.trim().slice(0, 600) }))
            .filter((m) => m.text)
            .slice(-10);
        const question = messages[messages.length - 1];
        if (!question || question.role !== 'user') throw new BadRequestException('Саволро нависед');
        assertAiAllowed(ip);

        const { career, trial } = await this.load(careerId, lang);
        const p = this.persona(career, trial, lang);
        const facts = [
            `Ихтисос: ${career.name}${career.cluster ? ` (кластери ММТ: ${career.cluster})` : ''}`,
            career.description ? `Тавсиф: ${String(career.description).slice(0, 700)}` : '',
            career.purpose ? `Ҳадаф: ${String(career.purpose).slice(0, 400)}` : '',
            career.skills ? `Малакаҳо: ${JSON.stringify(career.skills).slice(0, 400)}` : '',
            career.careerOpportunities?.length ? `Ҷойҳои кор: ${[].concat(career.careerOpportunities).slice(0, 8).join(', ')}` : '',
            trial?.day?.length ? `Рӯзи корӣ: ${trial.day.map((d: any) => `${d.time} ${d.text}`).join('; ')}` : '',
            trial?.pros?.length ? `Хубиҳо: ${trial.pros.join('; ')}` : '',
            trial?.cons?.length ? `Душвориҳо: ${trial.cons.join('; ')}` : '',
        ].filter(Boolean).join('\n');
        const languageName = { tj: 'тоҷикии адабӣ (кириллица, бо ӣ ӯ қ ғ ҳ ҷ)', ru: 'русский', en: 'English' }[lang];
        const dialogue = messages.map((m) => `${m.role === 'user' ? 'Хонанда' : p.nameTj}: ${m.text}`).join('\n');

        const prompt = `Ту ${p.nameTj} ҳастӣ — ${p.title} дар шаҳри ${p.cityTj} (Тоҷикистон), ${p.years} сол таҷрибаи корӣ. Бо хонандаи синфи 9–11, ки касб интихоб мекунад, суҳбат мекунӣ.

ҚОИДАҲО:
- Аз номи худ ҷавоб деҳ («ман…», «дар кори ман…»), гарм ва табиӣ, мисли одами воқеӣ.
- Ростқавл бош: ҳам хубиҳо ва ҳам душвориҳои касбро бигӯ. Мисолҳои мушаххас аз рӯзи корӣ биёр.
- Кӯтоҳ: 3–5 ҷумлаи содда. Бе рӯйхатҳои дароз ва бе markdown.
- Рақами маош, кафолати кор, номи ширкатҳо ва одамони воқеӣ, рақами моддаҳои қонун, номи доруҳоро НАГӮ.
- Агар чизеро намедонӣ ё он аз касби ту берун аст — ростқавлона бигӯ ва маслиҳат деҳ, ки аз кӣ пурсад.
- Агар савол ба касб ва таҳсил рабт надошта бошад — мулоимона ба мавзӯъ баргардон.
- Ба хонанда «шумо» гӯй. Ту AI-и мутахассиси виртуалӣ ҳастӣ; агар пурсанд, ростқавлона иқрор шав.
- Забони ҷавоб: ${languageName}.

МАЪЛУМОТ ДАР БОРАИ КАСБИ ТУ:
${facts}

СУҲБАТ:
${dialogue}
${p.nameTj}:`;
        const answer = (await this.ai.generateContent(prompt, { timeoutMs: 30000 }))
            .replace(/^\s*[*#>-]+\s*/gm, '')
            .replace(new RegExp(`^${p.nameTj}:\\s*`), '')
            .trim();
        return { answer };
    }
}
