import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { CareerService } from '../career/career.service';
import { QuizService } from '../quiz/quiz.service';
import { Career } from '../career/career.entity';
import { University } from '../university/university.entity';
import { VrAskDto, VrExplainDto, VrMapQueryDto, VrSessionDto } from './dto/vr.dto';

/**
 * Мӯҳлати сахт барои AI дар VR.
 *
 * Дар айнак интизории дароз аз ҷавоби бад бадтар аст: корбар дар саҳнаи
 * яхкарда мемонад ва намедонад, ки барнома шикаст ё не. Пас аз ин мӯҳлат
 * матни эҳтиётӣ бармегардад ва саҳна давом мекунад.
 */
const VR_AI_DEADLINE_MS = 6_000;

/** Кэш барои шарҳҳо — дар фестивал профилҳои якхела такрор мешаванд. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

/**
 * Калимаҳое, ки номи муассисаи таълимиро нишон медиҳанд.
 *
 * Барои санҷиши он ки AI донишгоҳи мавҷуднабударо ном набурд.
 */
const INSTITUTION_WORDS = ['донишгоҳ', 'донишкада', 'академия', 'коллеҷ', 'филиал', 'институт', 'университет'];

interface CacheEntry {
    text: string;
    expiresAt: number;
}

@Injectable()
export class VrService {
    private readonly logger = new Logger(VrService.name);
    private readonly cache = new Map<string, CacheEntry>();

    constructor(
        private readonly aiService: AiService,
        private readonly careerService: CareerService,
        private readonly quizService: QuizService,
        @InjectRepository(University)
        private readonly universityRepository: Repository<University>,
        @InjectRepository(Career)
        private readonly careerRepository: Repository<Career>,
    ) { }

    // ─────────────────────────────────────────────────────────────
    //  POST /vr/session — ҷавобҳои хом → ҳамаи натиҷа
    // ─────────────────────────────────────────────────────────────

    /**
     * Роҳи «ҳамааш дар як дархост» — барои ҳолате ки Unity ҳисобро ба сервер
     * вогузор мекунад. Роҳи асосии VR ин нест: барномаи айнак худаш ҳисоб
     * мекунад ва танҳо `/vr/explain`-ро мезанад, то бе интернет ҳам кор кунад.
     */
    async session(dto: VrSessionDto) {
        const scores = this.quizService.calculateScores({
            answers: dto.answers,
            lang: dto.lang,
        });

        return this.build(
            {
                mmtClusters: scores.mmtClusters,
                specialtyKeywords: scores.specialtyKeywords,
            },
            dto.lang || 'tj',
        );
    }

    // ─────────────────────────────────────────────────────────────
    //  POST /vr/explain — холҳо аз Unity → шарҳ
    // ─────────────────────────────────────────────────────────────

    async explain(dto: VrExplainDto) {
        return this.build(
            {
                mmtClusters: dto.scores,
                specialtyKeywords: dto.keywords || [],
            },
            dto.lang || 'tj',
        );
    }

    /**
     * Ҷавоби ягонаи VR: профил, се касби беҳтарин, донишгоҳҳо бо координатҳо
     * ва шарҳи кӯтоҳи AI.
     *
     * Холҳо ҳамон тавре бармегарданд, ки омадаанд — сервер онҳоро аз нав
     * ҳисоб намекунад ва тағйир намедиҳад.
     */
    private async build(userScores: any, lang: string) {
        const selection = await this.careerService.selectMatchedCareers(userScores);

        if (!selection.cluster) {
            return {
                cluster: null,
                scores: userScores.mmtClusters,
                profile: [],
                careers: [],
                explanation: this.staticExplanation(null, lang),
                source: 'fallback' as const,
            };
        }

        const top3 = (selection.careers || []).slice(0, 3);

        const explanation = await this.explanationFor(
            userScores.mmtClusters,
            selection.cluster.clusterName,
            top3,
            lang,
        );

        return {
            cluster: {
                id: selection.cluster.id,
                number: selection.cluster.clusterId,
                name: selection.cluster.clusterName,
                description: selection.cluster.description,
            },
            /* Холҳои хом — VR аз инҳо сутунҳои пардаи 4-ро месозад. */
            scores: userScores.mmtClusters,
            /* Ҳамаи панҷ кластер бо ном, барои панҷ ҷазираи саҳна. */
            profile: (selection.clusterScores || []).map(cs => ({
                number: cs.cluster.clusterId,
                name: cs.cluster.clusterName,
                score: cs.score,
            })),
            matchPercentage: selection.matchPercentage,
            careers: top3.map(career => this.careerCard(career, selection.matchPercentage)),
            explanation: explanation.text,
            source: explanation.source,
        };
    }

    /** Корти касб барои истгоҳи ҷазира (пардаи 5) ва толори натиҷа (пардаи 10). */
    private careerCard(career: Career, matchPercentage: number) {
        const universities = career.universities || [];

        return {
            id: career.id,
            code: career.code,
            name: career.name,
            description: career.description,
            purpose: career.purpose,
            matchPercentage,
            universityCount: universities.length,
            universities: universities.slice(0, 5).map(uni => this.mapPoint(uni)),
        };
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /vr/map — нуқтаҳои харитаи Тоҷикистон (пардаи 7)
    // ─────────────────────────────────────────────────────────────

    /**
     * Донишгоҳҳо бо координатҳои воқеӣ.
     *
     * Ҳеҷ чиз тавлид намешавад — `latitude`/`longitude` аллакай дар база
     * ҳастанд (`seed/university-cities.ts`, 98 маҳал). VR онҳоро ба `Vector3`
     * табдил медиҳад ва пинро мемонад.
     */
    async map(query: VrMapQueryDto) {
        let universities: University[];

        if (query.careerId) {
            const career = await this.careerRepository.findOne({
                where: { id: query.careerId },
                relations: ['universities'],
            });
            if (!career) {
                throw new NotFoundException('Ихтисос ёфт нашуд');
            }
            universities = career.universities || [];
        } else {
            universities = await this.universityRepository.find();
        }

        /* Бе координат пин гузошта намешавад — тахмин кардани ҷой мумкин нест. */
        const points = universities
            .filter(uni => uni.latitude != null && uni.longitude != null)
            .map(uni => this.mapPoint(uni));

        if (query.lat != null && query.lon != null) {
            for (const point of points) {
                point.distanceKm = this.distanceKm(query.lat, query.lon, point.latitude, point.longitude);
            }
            points.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        } else {
            points.sort((a, b) => a.name.localeCompare(b.name));
        }

        const limited = points.slice(0, query.limit ?? 50);

        return {
            total: points.length,
            nearest: query.lat != null && query.lon != null ? limited[0] ?? null : null,
            points: limited,
        };
    }

    /**
     * Сатри donishgoҳ барои харита.
     *
     * `latitude`/`longitude` дар Postgres сутуни `decimal`-анд ва TypeORM
     * онҳоро ҳамчун сатр бармегардонад. Бе `Number()` дар Unity `JsonUtility`
     * ҳангоми хондани `float` хато медиҳад.
     */
    private mapPoint(uni: University) {
        return {
            id: uni.id,
            name: uni.shortName || uni.name,
            fullName: uni.name,
            city: uni.city,
            region: uni.region,
            type: uni.institutionType,
            isState: uni.isState,
            website: uni.website,
            latitude: uni.latitude != null ? Number(uni.latitude) : null,
            longitude: uni.longitude != null ? Number(uni.longitude) : null,
            distanceKm: undefined as number | undefined,
        };
    }

    /** Масофаи хати рост (haversine), км. */
    private distanceKm(lat1: number, lon1: number, lat2: number | null, lon2: number | null): number | undefined {
        if (lat2 == null || lon2 == null) return undefined;

        const R = 6371;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    // ─────────────────────────────────────────────────────────────
    //  POST /vr/ask — сӯҳбати озод бо Сино (пардаи 9)
    // ─────────────────────────────────────────────────────────────

    /**
     * Ҷавоб ба саволи корбар — ТАНҲО аз маълумоти база.
     *
     * Агар маълумот набошад, Сино инро рӯйрост мегӯяд. Тахмин кардан манъ
     * аст: дар фестивал як рақами сохта тамоми эътимодро мекушад.
     */
    async ask(dto: VrAskDto) {
        const lang = dto.lang || 'tj';

        let career: Career | null = null;
        if (dto.careerId) {
            career = await this.careerRepository.findOne({
                where: { id: dto.careerId },
                relations: ['universities', 'cluster'],
            });
        }

        if (!career) {
            return {
                answer: this.unknownAnswer(lang),
                source: 'fallback' as const,
            };
        }

        const universities = career.universities || [];
        const allowedNames = universities.map(u => u.shortName || u.name);

        const facts = [
            `Ихтисос: ${career.name}`,
            career.code ? `Рамзи ихтисос: ${career.code}` : '',
            career.cluster?.clusterName ? `Кластер: ${career.cluster.clusterName}` : '',
            career.description ? `Тавсиф: ${career.description}` : '',
            career.purpose ? `Мақсад: ${career.purpose}` : '',
            career.skills?.technical?.length ? `Малакаҳои техникӣ: ${career.skills.technical.join(', ')}` : '',
            career.skills?.soft?.length ? `Малакаҳои нарм: ${career.skills.soft.join(', ')}` : '',
            career.careerOpportunities?.length ? `Имкониятҳои корӣ: ${career.careerOpportunities.join(', ')}` : '',
            career.salaryAndMarket
                ? `Маош: ибтидоӣ ${career.salaryAndMarket.junior || '—'}, миёна ${career.salaryAndMarket.mid || '—'}, болоӣ ${career.salaryAndMarket.senior || '—'}`
                : '',
            career.relatedSpecializations?.length ? `Ихтисосҳои наздик: ${career.relatedSpecializations.join(', ')}` : '',
            career.advice ? `Маслиҳат: ${career.advice}` : '',
            universities.length
                ? `Донишгоҳҳо (${universities.length}): ${universities.map(u => `${u.shortName || u.name} — ${u.city || '—'}`).join('; ')}`
                : 'Донишгоҳ дар база нест',
        ].filter(Boolean).join('\n');

        const prompt = [
            'Ту «Сино» ҳастӣ — роҳнамои рақамии лоиҳаи «Ихтисоси ман» дар ҷаҳони виртуалӣ.',
            'Бо хонандаи синфи 10–11 сӯҳбат мекунӣ. Ӯро «ту» муроҷиат кун.',
            '',
            'САВОЛИ КОРБАР:',
            dto.question,
            '',
            'МАЪЛУМОТИ ДАСТРАС (танҳо ҳамин — дигар чизе надорӣ):',
            facts,
            '',
            'ҚОИДАҲОИ ҚАТЪӢ:',
            `- Танҳо бо забони ${this.langName(lang)} ҷавоб деҳ.`,
            '- 2–3 ҷумла, на зиёда аз 45 калима. Ин матн дар айнаки VR хонда мешавад.',
            '- ТАНҲО аз маълумоти боло истифода бар.',
            '- Рақам, маош, холи қабул ё номи донишгоҳеро, ки дар боло НЕСТ, НАСОЗ.',
            '- Агар ҷавоб дар маълумоти боло набошад, рӯйрост бигӯ, ки инро намедонӣ',
            '  ва хонандаро ба вебсайти лоиҳа равона кун.',
            '- Матни оддӣ: бе Markdown, бе рӯйхат, бе сарлавҳа, бе эмодзи.',
        ].join('\n');

        const generated = await this.generate(prompt);

        if (!generated) {
            return { answer: this.unknownAnswer(lang), source: 'fallback' as const };
        }

        const clean = this.clean(generated);

        /* Санҷиши охирин: агар AI донишгоҳи берун аз рӯйхатро ном барад,
           ҷавобаш партофта мешавад. Беҳтар аст «намедонам» гӯем, аз он ки
           довталабро ба донишгоҳи мавҷуднабуда фиристем. */
        if (!this.institutionsAllowed(clean, allowedNames)) {
            this.logger.warn(`AI муассисаи берун аз база ном бурд — ҷавоб партофта шуд: ${clean}`);
            return { answer: this.unknownAnswer(lang), source: 'fallback' as const };
        }

        return { answer: clean, source: 'ai' as const };
    }

    // ─────────────────────────────────────────────────────────────
    //  Шарҳи натиҷа
    // ─────────────────────────────────────────────────────────────

    private async explanationFor(
        scores: Record<string, number>,
        clusterName: string,
        careers: Career[],
        lang: string,
    ): Promise<{ text: string; source: 'ai' | 'cache' | 'fallback' }> {
        const key = this.cacheKey(scores, careers, lang);
        const cached = this.readCache(key);
        if (cached) {
            return { text: cached, source: 'cache' };
        }

        const prompt = [
            'Ту «Сино» ҳастӣ — роҳнамои рақамии лоиҳаи «Ихтисоси ман».',
            'Хонанда навакак дар ҷаҳони виртуалӣ тестро тамом кард ва натиҷаашро мебинад.',
            '',
            'ХОЛҲОИ ӮРО КОДИ МО ҲИСОБ КАРД (тағйир НАДЕҲ, аз нав ҲИСОБ НАКУН):',
            Object.entries(scores).map(([k, v]) => `${k}: ${v}`).join(', '),
            `Кластери пешбар: ${clusterName}`,
            '',
            'КАСБҲОИ МУНОСИБ (ТАНҲО аз ин рӯйхат ном бар):',
            careers.map((c, i) => `${i + 1}. ${c.name}${c.purpose ? ` — ${c.purpose}` : ''}`).join('\n'),
            '',
            'ВАЗИФА:',
            'Дар 3–4 ҷумла фаҳмон, ки чаро ин самт ба ӯ мувофиқ аст.',
            'Бо ӯ «ту» гап зан, содда, тавре ки бо дӯст сӯҳбат мекунӣ.',
            '',
            'ҚОИДАҲОИ ҚАТЪӢ:',
            `- Танҳо бо забони ${this.langName(lang)}.`,
            '- На зиёда аз 60 калима — ин матн дар айнаки VR хонда ва шунида мешавад.',
            '- Касби нав НАСОЗ — танҳо аз рӯйхати боло.',
            '- Номи донишгоҳ НАБАР — онҳоро барнома худаш алоҳида нишон медиҳад.',
            '- Рақами хол, маош ё фоиз НАСОЗ.',
            '- Матни оддӣ: бе Markdown, бе рӯйхат, бе эмодзи.',
        ].join('\n');

        const generated = await this.generate(prompt);

        if (!generated) {
            return { text: this.staticExplanation(clusterName, lang), source: 'fallback' };
        }

        const clean = this.clean(generated);

        /* Дар шарҳ номи донишгоҳ умуман набояд бошад — санҷиши содда ва дақиқ. */
        if (this.mentionsInstitution(clean)) {
            this.logger.warn('AI дар шарҳ донишгоҳ ном бурд — матни эҳтиётӣ истифода шуд');
            return { text: this.staticExplanation(clusterName, lang), source: 'fallback' };
        }

        this.writeCache(key, clean);
        return { text: clean, source: 'ai' };
    }

    // ─────────────────────────────────────────────────────────────
    //  Ёридиҳандаҳо
    // ─────────────────────────────────────────────────────────────

    /**
     * Даъвати AI бо мӯҳлати сахт.
     *
     * `AiService` худаш занҷири Vertex → Gemini дорад ва ҳар кадомаш
     * timeout-и худро. Барои VR ин кофӣ нест: ду провайдер пай дар пай
     * метавонанд аз ҳадди бароҳатии саҳна берун раванд. Ин ҷо мӯҳлати умумӣ
     * гузошта мешавад — баъд аз он саҳна бо матни эҳтиётӣ давом мекунад.
     */
    private async generate(prompt: string): Promise<string | null> {
        try {
            return await Promise.race([
                this.aiService.generateContent(prompt),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('VR: мӯҳлати AI гузашт')), VR_AI_DEADLINE_MS),
                ),
            ]);
        } catch (error: any) {
            this.logger.warn(`AI дастрас нашуд, матни эҳтиётӣ: ${error?.message || error}`);
            return null;
        }
    }

    /** Markdown ва эмодзиро мебарорад — дар VR танҳо матни оддӣ хонда мешавад. */
    private clean(text: string): string {
        return text
            .replace(/[*_`#>]/g, '')
            .replace(/^\s*[-•]\s*/gm, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /** Оё дар матн умуман номи муассисаи таълимӣ ҳаст? */
    private mentionsInstitution(text: string): boolean {
        const lower = text.toLowerCase();
        return INSTITUTION_WORDS.some(word => lower.includes(word));
    }

    /**
     * Оё ҳамаи муассисаҳои зикршуда аз рӯйхати иҷозатдодашуда ҳастанд?
     *
     * Санҷиш дағал аст — калимаи «донишгоҳ» бо матни атрофаш муқоиса
     * мешавад. Вале барои ҳадафи мо кофист: AI бояд танҳо номҳои додашударо
     * такрор кунад, на номи нав созад.
     */
    private institutionsAllowed(text: string, allowedNames: string[]): boolean {
        if (!this.mentionsInstitution(text)) return true;
        if (!allowedNames.length) return false;

        const lower = text.toLowerCase();
        return allowedNames.some(name => {
            const needle = name.toLowerCase();
            if (lower.includes(needle)) return true;

            /* Номи пурра дароз аст ва AI онро кӯтоҳ карда метавонад. Аз ин рӯ
               калимаҳои маънодори ном (аз 5 ҳарф боло) санҷида мешаванд. */
            const words = needle.split(/\s+/).filter(w => w.length >= 5);
            return words.length > 0 && words.every(word => lower.includes(word));
        });
    }

    private langName(lang: string): string {
        return lang === 'ru' ? 'русӣ' : lang === 'en' ? 'англисӣ' : 'тоҷикӣ';
    }

    /** Матни эҳтиётӣ — саҳна ҳеҷ гоҳ бе матн намемонад. */
    private staticExplanation(clusterName: string | null, lang: string): string {
        if (lang === 'en') {
            return clusterName
                ? `Your answers point most strongly toward ${clusterName}. The specialties below match that profile — take a closer look at them.`
                : 'Your answers have been recorded. Take a closer look at the specialties below.';
        }
        if (lang === 'ru') {
            return clusterName
                ? `Твои ответы сильнее всего указывают на направление «${clusterName}». Специальности ниже подходят этому профилю — присмотрись к ним.`
                : 'Твои ответы записаны. Присмотрись к специальностям ниже.';
        }
        return clusterName
            ? `Ҷавобҳои ту бештар ба самти «${clusterName}» ишора мекунанд. Ихтисосҳои поён ба ин профил мувофиқанд — ба онҳо назар кун.`
            : 'Ҷавобҳои ту сабт шуданд. Ба ихтисосҳои поён назар кун.';
    }

    private unknownAnswer(lang: string): string {
        if (lang === 'en') {
            return "I don't know that for sure, and I won't guess. You can find the up-to-date details on our website.";
        }
        if (lang === 'ru') {
            return 'Этого я точно не знаю и придумывать не стану. Точные данные есть на нашем сайте.';
        }
        return 'Инро ман дақиқ намедонам ва тахмин намекунам. Маълумоти дақиқ дар вебсайти мо ҳаст.';
    }

    private cacheKey(scores: Record<string, number>, careers: Career[], lang: string): string {
        const s = Object.keys(scores).sort().map(k => `${k}${scores[k]}`).join('');
        return `${lang}|${s}|${careers.map(c => c.id).join(',')}`;
    }

    private readCache(key: string): string | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            return null;
        }
        return entry.text;
    }

    private writeCache(key: string, text: string): void {
        /* Кэш дар хотира аст — бе маҳдудият он дар кори дарози сервер месӯзад. */
        if (this.cache.size >= CACHE_MAX_ENTRIES) {
            const oldest = this.cache.keys().next().value;
            if (oldest) this.cache.delete(oldest);
        }
        this.cache.set(key, { text, expiresAt: Date.now() + CACHE_TTL_MS });
    }
}
