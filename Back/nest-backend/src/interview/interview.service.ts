import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { assertAiAllowed } from '../common/ai-limit';

// «Аз AI дар бораи касб пурсед»: ёвари AI аз рӯи маълумоти худи ихтисос ва сенарияи «Худро дар
// касб санҷед» (рӯзи корӣ, плюс/минус) кӯтоҳ ва ростқавлона ҷавоб медиҳад. Пештар ӯ худро одами
// воқеӣ (ном, шаҳр, «10 сол таҷриба») муаррифӣ мекард — чунин шахс вуҷуд надошт, бинобар ин нест шуд.
type Lang = 'tj' | 'ru' | 'en';
const toLang = (lang: unknown): Lang => (lang === 'ru' || lang === 'en' ? lang : 'tj');

const ASSISTANT: Record<Lang, string> = { tj: 'Ёвари AI', ru: 'AI-помощник', en: 'AI assistant' };

const SUGGEST: Record<Lang, string[]> = {
    tj: ['Рӯзи кории ин мутахассис чӣ гуна мегузарад?', 'Дар ин кор аз ҳама душвор чӣ аст?', 'Ин касб ба кӣ мувофиқ аст?', 'Ба ман, хонандаи мактаб, чӣ маслиҳат медиҳед?', 'Барои ин касб кадом фанҳо муҳиманд?'],
    ru: ['Как проходит рабочий день такого специалиста?', 'Что самое трудное в этой работе?', 'Кому подходит эта профессия?', 'Что посоветуете мне, школьнику?', 'Какие предметы важны для этой профессии?'],
    en: ['What does a working day look like in this job?', 'What is the hardest part of this work?', 'Who is this career a good fit for?', 'What would you advise me as a school student?', 'Which school subjects matter for this career?'],
};

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

    private careerName(career: any, lang: Lang) {
        return (lang !== 'tj' && career.translations?.[lang]?.name) || career.name;
    }

    async info(careerId: string, rawLang?: string) {
        const lang = toLang(rawLang);
        const { career } = await this.load(careerId, lang);
        const name = this.careerName(career, lang);
        const greeting = {
            tj: `Салом! Ман ёвари AI ҳастам. Дар бораи ихтисоси «${name}» — рӯзи корӣ, душвориҳо, фанҳо ва ҷойи кор — аз рӯи маълумоти сайт ҷавоб медиҳам. Ман одами воқеӣ нестам ва таҷрибаи шахсӣ надорам.`,
            ru: `Здравствуйте! Я AI-помощник. Отвечу про специальность «${name}» — рабочий день, трудности, предметы и места работы — по данным сайта. Я не человек и личного опыта у меня нет.`,
            en: `Hello! I am an AI assistant. I can answer about «${name}» — the working day, challenges, subjects and workplaces — using this site’s data. I am not a real person and have no personal experience.`,
        }[lang];
        return { persona: { name: ASSISTANT[lang], ai: true, title: name }, greeting, suggestions: SUGGEST[lang] };
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
        const dialogue = messages.map((m) => `${m.role === 'user' ? 'Хонанда' : 'Ёвар'}: ${m.text}`).join('\n');

        const prompt = `Ту ёвари AI-и сайти «Ихтисоси ман» ҳастӣ. Бо хонандаи синфи 9–11 дар бораи ихтисоси «${career.name}» суҳбат мекунӣ.

ҚОИДАҲО:
- Ту одам нестӣ: худро мутахассис, «ман дар ин кор…», ном, шаҳр ё солҳои таҷриба НАГӮ. Дар бораи касб аз шахси сеюм гап зан: «мутахассиси ин соҳа одатан…».
- Салом нагӯ ва худро муаррифӣ накун — рост ба савол ҷавоб деҳ.
- Ростқавл бош: ҳам хубиҳо ва ҳам душвориҳоро бигӯ. Мисолҳои мушаххас аз рӯзи корӣ биёр, агар дар маълумот бошанд.
- Кӯтоҳ: 3–4 ҷумлаи содда (то 70 калима). Бе рӯйхат ва бе markdown.
- Рақами маош, кафолати кор, номи ширкатҳо ва одамони воқеӣ, рақами моддаҳои қонун, номи доруҳо, «ояндаи дурахшон» ва «ҳамеша талабот дорад»-ро НАГӮ.
- Агар маълумот нест — ростқавлона бигӯ ва маслиҳат деҳ, ки аз мутахассиси воқеӣ ё омӯзгор пурсад.
- Агар савол ба касб ва таҳсил рабт надошта бошад — мулоимона ба мавзӯъ баргардон.
- Ба хонанда «шумо» гӯй.
- Забони ҷавоб: ${languageName}.

МАЪЛУМОТ ДАР БОРАИ ИХТИСОС:
${facts}

СУҲБАТ:
${dialogue}
Ёвар:`;
        const answer = (await this.ai.generateFast(prompt, 12000))
            .replace(/^\s*[*#>-]+\s*/gm, '')
            .replace(/^Ёвар:\s*/, '')
            .trim();
        return { answer };
    }
}
