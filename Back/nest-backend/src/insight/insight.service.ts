import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { assertAiAllowed } from '../common/ai-limit';

// Ду абзори AI дар саҳифаи ихтисос:
//   «Чаро ин касб?» — сабаби интихоби хонандаро баҳо медиҳад (матн нигоҳ дошта намешавад);
//   «Касби ман дар соли 2035» — пешгӯӣ барои ихтисос, як бор сохта ва кеш мешавад.
type Lang = 'tj' | 'ru' | 'en';
const toLang = (lang: unknown): Lang => (lang === 'ru' || lang === 'en' ? lang : 'tj');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LANGUAGE: Record<Lang, string> = { tj: 'тоҷикии адабӣ (кириллица, бо ӣ ӯ қ ғ ҳ ҷ)', ru: 'русский', en: 'English' };
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
const texts = (value: unknown, count: number) => (Array.isArray(value) ? value : [])
    .map((v) => String(v ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, count).map((v) => v.slice(0, 220));

// Ҷавоби модел — JSON (баъзан дар ```json … ```).
function parseJson(raw: string): any {
    const text = String(raw || '').replace(/```(?:json)?/gi, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('JSON нест');
    return JSON.parse(text.slice(start, end + 1));
}

@Injectable()
export class InsightService implements OnModuleInit {
    private readonly pending = new Map<string, Promise<any>>();

    constructor(private readonly dataSource: DataSource, private readonly ai: AiService) { }

    async onModuleInit() {
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS career_future (
                "careerId" uuid NOT NULL,
                lang varchar(2) NOT NULL,
                content jsonb NOT NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                PRIMARY KEY ("careerId", lang)
            )`);
    }

    private async career(id: string, lang: Lang) {
        if (!UUID.test(id)) throw new NotFoundException('Ихтисос ёфт нашуд');
        const [row] = await this.dataSource.query(
            `SELECT c.id, c.name, c.translations, c.description, c.purpose, c.skills, c."careerOpportunities", cl."clusterName" AS cluster,
                    (SELECT content FROM career_trials t WHERE t."careerId" = c.id) AS trial
             FROM career c LEFT JOIN cluster cl ON cl.id = c."clusterId" WHERE c.id = $1`, [id]);
        if (!row) throw new NotFoundException('Ихтисос ёфт нашуд');
        const name = (lang !== 'tj' && row.translations?.[lang]?.name) || row.name;
        const trial = row.trial?.text?.[lang] || row.trial?.text?.tj || null;
        const facts = [
            `Ихтисос: ${row.name}${name !== row.name ? ` (${name})` : ''}${row.cluster ? `, кластери ММТ: ${row.cluster}` : ''}`,
            row.description ? `Тавсиф: ${String(row.description).slice(0, 700)}` : '',
            row.purpose ? `Ҳадаф: ${String(row.purpose).slice(0, 300)}` : '',
            row.skills ? `Малакаҳо: ${JSON.stringify(row.skills).slice(0, 300)}` : '',
            row.careerOpportunities?.length ? `Ҷойҳои кор: ${[].concat(row.careerOpportunities).slice(0, 8).join(', ')}` : '',
            trial?.day?.length ? `Рӯзи корӣ: ${trial.day.map((d: any) => d.text).join('; ').slice(0, 500)}` : '',
        ].filter(Boolean).join('\n');
        return { id: row.id, name, facts };
    }

    // ---------- «Чаро ин касб?» ----------

    async why(id: string, body: { reason?: string; lang?: string }, ip?: string) {
        const lang = toLang(body?.lang);
        const reason = String(body?.reason || '').replace(/\s+/g, ' ').trim().slice(0, 400);
        if (reason.length < 3) throw new BadRequestException('Сабабро нависед');
        assertAiAllowed(ip);
        const career = await this.career(id, lang);
        const prompt = `Ту равоншинос ва маслиҳатчии касбии хонандагони синфи 9–11 дар Тоҷикистон ҳастӣ. Хонанда навишт, ки чаро ихтисоси «${career.name}»-ро мехоҳад. Сабаби ӯро баҳо деҳ.

ҚОИДАҲО:
- Ҳукм накун ва шарм надеҳ. Пул, обрӯ ва маслиҳати оила ҳам сабабҳои қонунӣ ҳастанд — танҳо бигӯ, ки онҳо кофӣ ҳастанд ё не.
- type: "inner" — шавқ, қобилият, арзишҳои худаш; "outer" — пул, обрӯ, фишори оила, дӯстон; "mixed" — ҳарду.
- risk (хатари пушаймонӣ): "low" — сабаби дохилӣ ва мушаххас; "mid" — омехта ё умумӣ; "high" — танҳо берунӣ ё хонанда ихтисосро намешиносад.
- summary: 2–3 ҷумлаи гарм ва ростқавл ба хонанда («шумо…»).
- questions: 3 саволи кӯтоҳ, ки хонанда бояд аз худ пурсад (мушаххас ба ҳамин ихтисос).
- talkTo: 1 ҷумла — бо кӣ гап занад ва чӣ пурсад (мутахассис, волидайн, омӯзгор, донишҷӯ).
- Забони ҳамаи матнҳо: ${LANGUAGE[lang]}.
- Танҳо JSON баргардон: {"type":"…","risk":"…","summary":"…","questions":["…","…","…"],"talkTo":"…"}

МАЪЛУМОТ ДАР БОРАИ ИХТИСОС:
${career.facts}

САБАБИ ХОНАНДА: «${reason}»`;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                const data = parseJson(await this.ai.generateFast(prompt, 15000));
                const questions = texts(data.questions, 3);
                const summary = String(data.summary || '').trim().slice(0, 600);
                if (!summary || questions.length < 2) throw new Error('холӣ');
                return {
                    type: pick(data.type, ['inner', 'mixed', 'outer'] as const, 'mixed'),
                    risk: pick(data.risk, ['low', 'mid', 'high'] as const, 'mid'),
                    summary,
                    questions,
                    talkTo: String(data.talkTo || '').trim().slice(0, 300),
                };
            } catch { /* бори дуюм */ }
        }
        throw new BadRequestException('Ҷавоб нашуд. Боз кӯшиш кунед.');
    }

    // ---------- «Касби ман дар соли 2035» ----------

    async future(id: string, rawLang: unknown, ip?: string) {
        const lang = toLang(rawLang);
        if (!UUID.test(id)) throw new NotFoundException('Ихтисос ёфт нашуд');
        const [cached] = await this.dataSource.query('SELECT content FROM career_future WHERE "careerId" = $1 AND lang = $2', [id, lang]);
        if (cached) return { ...cached.content, cached: true };
        // Ду дархост барои як ихтисос ҳамзамон — як даъвати AI.
        const key = `${id}:${lang}`;
        if (!this.pending.has(key)) {
            assertAiAllowed(ip);
            this.pending.set(key, this.makeFuture(id, lang).finally(() => this.pending.delete(key)));
        }
        return this.pending.get(key);
    }

    private async makeFuture(id: string, lang: Lang) {
        const career = await this.career(id, lang);
        const prompt = `Ту коршиноси бозори меҳнат ва технологияҳо ҳастӣ. Барои хонандаи синфи 9–11 дар Тоҷикистон пешгӯӣ кун, ки ихтисоси «${career.name}» то соли 2035 чӣ гуна тағйир меёбад (AI, автоматикунонӣ, рақамикунонӣ, тамоюлҳои ҷаҳонӣ ва Тоҷикистон).

ҚОИДАҲО:
- risk — хатари он, ки мошин ва AI ҷойи ин мутахассисро мегиранд: "low", "mid" ё "high". Ростқавл бош, вале наметарсон.
- riskText: 1 ҷумла шарҳи хатар.
- automated: 3 кор, ки AI ва мошин мегиранд (кӯтоҳ).
- human: 3 кор, ки ба одам мемонанд ва қадрашон меафзояд.
- skills: 4 малакаи нав (2–4 калима ҳар кадом).
- prepare: 3 қадами мушаххас, ки хонанда аз ҳозир карда метавонад (фан, курс, лоиҳа).
- summary: 2 ҷумлаи ҷамъбаст, ором ва ростқавл. Ба хонанда «шумо» гӯй (на «ту»).
- Рақами маош, номи ширкатҳо ва фоизҳои сохтаро нанавис. «Серталабтарин», «ояндаи дурахшон», «ҳамеша» ва дигар ваъдаҳоро нанавис — ин пешгӯӣ аст, на кафолат.
- Забони ҳамаи матнҳо: ${LANGUAGE[lang]}.
- Танҳо JSON: {"risk":"…","riskText":"…","automated":["…"],"human":["…"],"skills":["…"],"prepare":["…"],"summary":"…"}

МАЪЛУМОТ:
${career.facts}`;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                // Модели тез: пештар модели пурра 10–40 сония мегирифт, ва корбар бори аввал интизор мешуд.
                const data = parseJson(await this.ai.generateFast(prompt, 15000));
                const content = {
                    risk: pick(data.risk, ['low', 'mid', 'high'] as const, 'mid'),
                    riskText: String(data.riskText || '').trim().slice(0, 300),
                    automated: texts(data.automated, 3),
                    human: texts(data.human, 3),
                    skills: texts(data.skills, 4).map((s) => s.slice(0, 60)),
                    prepare: texts(data.prepare, 3),
                    summary: String(data.summary || '').trim().slice(0, 500),
                };
                if (content.automated.length < 2 || content.human.length < 2 || !content.summary) throw new Error('холӣ');
                await this.dataSource.query(
                    `INSERT INTO career_future ("careerId", lang, content) VALUES ($1, $2, $3)
                     ON CONFLICT ("careerId", lang) DO UPDATE SET content = EXCLUDED.content, "createdAt" = now()`,
                    [id, lang, JSON.stringify(content)]);
                return { ...content, cached: false };
            } catch { /* бори дуюм */ }
        }
        throw new BadRequestException('Пешгӯӣ сохта нашуд. Баъдтар боз кӯшиш кунед.');
    }
}
