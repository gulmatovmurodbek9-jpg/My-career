import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, In } from 'typeorm';
import { Career } from './career.entity';
import { CareerOffering } from './career-offering.entity';
import { Cluster } from '../cluster/cluster.entity';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { GetCareersDto } from './dto/get-careers.dto';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { User, UserRole } from '../users/user.entity';

/**
 * Лимити рӯзонаи саволҳои AI барои як корбар.
 *
 * 0 маънои бе лимит дорад — ҳолати пешфарзи ҳозира, то ҳар кас, аз ҷумла
 * доварони озмун, озодона санҷида тавонад.
 *
 * Агар сарфи ҳисоб зиёд шавад, лимитро бе тағйири код баргардонидан мумкин
 * аст: дар .env сатри AI_DAILY_LIMIT=5 гузошта шавад.
 */
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 0);
const LIMIT_ON = DAILY_LIMIT > 0;

/*
 * Ҳамворкунии ҳарфҳои хоси тоҷикӣ барои ҷустуҷӯ.
 *
 * Дар клавиатураи русӣ ҳарфҳои ғ ӣ қ ӯ ҳ ҷ нестанд ва корбар ба ҷои онҳо
 * г и к у х ч менависад. Бе ин мутобиқсозӣ ҷустуҷӯи «Зех» ихтисоси «Зеҳни
 * сунъӣ»-ро намеёбад.
 */

/**
 * Номи касбҳои гуфтугӯӣ → калимаҳои ҷустуҷӯ дар база.
 *
 * Довталаб «Юрист» менависад, вале дар рӯйхати ММТ чунин ном нест — он ҷо
 * «Ҳуқуқшиносӣ» аст. ILIKE '%юрист%' ҳеҷ чиз намеёбад, ҷустуҷӯ ба fallback
 * мегузарад ва чат ба ҷои ҳуқуқ «Таърих»-у «Идоракунии давлатӣ»-ро тавсия
 * мекунад — маҳз ҳамин дар демо дида шуд.
 *
 * Калидҳо folded навишта мешаванд (ғ→г, ӣ→и, қ→к, ӯ→у, ҳ→х, ҷ→ч), то ки
 * навишти русиклавиатура низ кор кунад: «хукук» ба «ҳуқуқ» мерасад.
 */
const CAREER_SYNONYMS: Record<string, string[]> = {
    // Ҳуқуқ
    юрист: ['хукук'], юристи: ['хукук'], адвокат: ['хукук'], прокурор: ['хукук'],
    судя: ['хукук'], судъя: ['хукук'], нотариус: ['хукук'], хукукшинос: ['хукук'],
    // Тиб
    врач: ['табобат', 'тиб'], доктор: ['табобат', 'тиб'], духтур: ['табобат', 'тиб'],
    табиб: ['табобат', 'тиб'], хирург: ['чаррох', 'табобат'], педиатр: ['педиатр', 'кудакон'],
    стоматолог: ['дандон'], дантист: ['дандон'], медсестра: ['хамшира'],
    фельдшер: ['хамшира'], фармацевт: ['дорусоз'], аптекар: ['дорусоз'],
    // IT
    программист: ['барнома', 'информатика'], программирование: ['барнома', 'информатика'],
    барномасоз: ['барнома'], кодер: ['барнома'], разработчик: ['барнома'],
    developer: ['барнома'], programmer: ['барнома'],
    айти: ['информатика', 'иттилоот'], it: ['информатика', 'иттилоот'],
    тестировщик: ['барнома'], дизайнер: ['дизайн'], design: ['дизайн'],
    // Муҳандисӣ ва техника
    инженер: ['мухандис'], мухандис: ['мухандис'], электрик: ['электр'],
    энергетик: ['энергетика'], строитель: ['сохтмон'], сохтмончи: ['сохтмон'],
    архитектор: ['меъмор'], механик: ['механика'], водитель: ['наклиёт'],
    // Иқтисод
    экономист: ['иктисод'], бухгалтер: ['бахисобгири', 'молия'],
    мухосиб: ['бахисобгири', 'молия'], банкир: ['молия', 'бонк'],
    финансист: ['молия'], менеджер: ['менечмент', 'идора'], маркетолог: ['маркетинг'],
    предприниматель: ['соибкори', 'бизнес'], логист: ['логистика', 'наклиёт'],
    // Таълим ва забон
    учитель: ['омузгор', 'педагогика'], омузгор: ['омузгор', 'педагогика'],
    преподаватель: ['омузгор', 'педагогика'], воспитатель: ['томактаби', 'педагогика'],
    переводчик: ['тарчум'], тарчумон: ['тарчум'], филолог: ['филология'],
    лингвист: ['забон', 'филология'],
    // Ҷомеашиносӣ
    психолог: ['психология'], социолог: ['сотсиология', 'чомеашиноси'],
    журналист: ['журналистика'], дипломат: ['байналмилали', 'муносибат'],
    политолог: ['сиёсатшиноси'], историк: ['таърих'],
    // Дигар
    повар: ['хурок', 'технологияи хурок'], агроном: ['агроном', 'кишоварзи'],
    ветеринар: ['ветеринар'], эколог: ['экология'], геолог: ['геология'],
    химик: ['химия'], биолог: ['биология'], физик: ['физика'], математик: ['математика'],
    спортсмен: ['варзиш'], тренер: ['варзиш'], артист: ['санъат'], музыкант: ['мусики'],
    художник: ['наккоши', 'санъат'], актер: ['санъат'], режиссер: ['санъат'],
    военный: ['харби'], полицейский: ['хукук', 'харби'],
    /* Бандакҳои русӣ «ь»-ро мехӯранд — «учителем», «строителя». Решаи бе
       аломати мулоим ҳамчун калиди алоҳида, то мувофиқати оғоз кор кунад. */
    учител: ['омузгор', 'педагогика'], преподавател: ['омузгор', 'педагогика'],
    воспитател: ['томактаби', 'педагогика'], строител: ['сохтмон'],
    водител: ['наклиёт'], предпринимател: ['соибкори', 'бизнес'],
    учитил: ['омузгор', 'педагогика'],
};

/* Калидҳои дарозтар аввал, то ки «программирование» ба «программист» афтад,
   на ба калиди кӯтоҳтари тасодуфӣ. */
const SYNONYM_KEYS = Object.keys(CAREER_SYNONYMS).sort((a, b) => b.length - a.length);

const TAJIK_LETTERS = 'ғӣқӯҳҷ';
const PLAIN_LETTERS = 'гикухч';

const foldTajik = (value: string): string => {
    let out = value.toLowerCase();
    for (let i = 0; i < TAJIK_LETTERS.length; i++) {
        out = out.split(TAJIK_LETTERS[i]).join(PLAIN_LETTERS[i]);
    }
    return out;
};

/** Ҳамон табдил, вале дар тарафи Postgres. */
const TAJIK_FOLD = (column: string): string =>
    `translate(lower(${column}), 'ғӣқӯҳҷҒӢҚӮҲҶ', 'гикухчгикухч')`;

@Injectable()
export class CareerService {
    /*
     * Ҳадди болоии холи як кластер: 10 саволи ММТ × 4 холи имконпазир.
     * Панел пештар 60 мегирифт ва саҳифаи натиҷаи тест 40 — як корбар дар ду
     * ҷо ду фоизи гуногунро медид (масалан 27% ва 40%).
     */
    private static readonly MMT_MAX_SCORE = 40;

    /** То ин шумора рӯйхатро худи корбар аз назар мегузаронад — савол зиёдатист. */
    private static readonly AI_CHOICE_MIN = 8;

    constructor(
        @InjectRepository(Career)
        private careerRepository: Repository<Career>,
        @InjectRepository(CareerOffering)
        private offeringRepository: Repository<CareerOffering>,
        @InjectRepository(Cluster)
        private clusterRepository: Repository<Cluster>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private configService: ConfigService,
        private aiService: AiService,
    ) { }

    async findAll(query: GetCareersDto): Promise<{ data: Career[]; meta: { total: number; page: number; limit: number; lastPage: number } }> {
        const { search, clusterId, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const qb = this.careerRepository.createQueryBuilder('career');
        qb.leftJoinAndSelect('career.cluster', 'cluster');
        qb.leftJoinAndSelect('career.universities', 'universities');

        if (search) {
            /*
             * Ҳарфҳои хоси тоҷикӣ ҳамвор карда мешаванд.
             *
             * Дар клавиатураи русӣ ҳарфҳои ғ ӣ қ ӯ ҳ ҷ нестанд, аз ин рӯ
             * корбар «Зех» менависад, дар ҳоле ки дар база «Зеҳни сунъӣ» аст —
             * ва ҷустуҷӯи оддии ILIKE ҳеҷ чиз намеёбад. Ҳоло ҳам сутун ва ҳам
             * дархост ба як шакл оварда мешаванд, то ҳарду навъи навишт кор
             * кунад.
             */
            qb.andWhere(
                `(${TAJIK_FOLD('career.name')} LIKE :search
                  OR ${TAJIK_FOLD('career.description')} LIKE :search
                  OR career.code LIKE :rawSearch)`,
                { search: `%${foldTajik(search)}%`, rawSearch: `%${search}%` },
            );
        }

        /*
         * Ҷустуҷӯи AI: ҳар яке аз решаҳо дар НОМИ ихтисос («ё»).
         *
         * Танҳо дар ном, на дар тавсиф: дар матни дароз «дандон» ба ихтисосҳои
         * бегона низ мерасид. Касби мушаххас бо номаш ёфт мешавад.
         */
        const anyTerms = (query.searchAny || [])
            .map((term) => foldTajik(String(term).trim()))
            .filter((term) => term.length >= 3);
        if (anyTerms.length) {
            qb.andWhere(new Brackets((where) => {
                anyTerms.forEach((term, index) => {
                    const condition = `${TAJIK_FOLD('career.name')} LIKE :anyTerm${index}`;
                    const params = { [`anyTerm${index}`]: `%${term}%` };
                    if (index === 0) where.where(condition, params);
                    else where.orWhere(condition, params);
                });
            }));
        }

        if (clusterId) {
            qb.andWhere('career.clusterId = :clusterId', { clusterId });
        }

        if (query.code) {
            qb.andWhere('career.code = :code', { code: query.code });
        }

        if (query.maxPrice) {
            qb.andWhere('career.tuitionFee <= :maxPrice', { maxPrice: query.maxPrice });
        }

        if (query.university) {
            qb.andWhere('universities.name ILIKE :university', { university: `%${query.university}%` });
        }

        if (query.city) {
            qb.andWhere('universities.city ILIKE :city', { city: `%${query.city}%` });
        }

        if (query.freeSeatsOnly === 'true') {
            qb.andWhere('career.hasFreeSeats = true');
        }

        /*
         * Тартиб аз рӯи рақами расмии ММТ.
         *
         * Пештар ҳеҷ ORDER BY набуд ва Postgres сатрҳоро бо тартиби дилхоҳ
         * бармегардонд: як саҳифа имрӯз як хел, фардо дигар хел меомад.
         *
         * Кодҳо дарозии гуногун доранд (аз 5 то 18 рақам), барои ҳамин
         * муқоисаи оддии матнӣ «10020503»-ро пеш аз «1010101» мегузошт.
         * Ҳамаи рақамҳо гирифта ва то 20 аломат бо сифр пур карда мешаванд.
         * Ин ҳисоб дар худи база ҳамчун сутуни GENERATED нигоҳ дошта мешавад:
         * TypeORM ифодаи хомро дар ORDER BY ҳангоми саҳифабандӣ қабул намекунад
         * («alias was not found»), вале сутуни ҳақиқиро бемалол мефаҳмад.
         */
        /* Сутун бо select: false аст, вале ҳангоми саҳифабандӣ TypeORM
           зердархости DISTINCT месозад ва он ҷо танҳо сутунҳои интихобшуда
           ҳастанд — бе ин сатр «distinctAlias.career_codeSort не существует». */
        qb.addSelect('career.codeSort');
        qb.orderBy('career.codeSort', 'ASC').addOrderBy('career.name', 'ASC');

        qb.skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit),
            },
        };
    }



    /**
     * Мазмунро ба забони интихобшуда мегардонад.
     *
     * Танҳо майдонҳое иваз мешаванд, ки тарҷума воқеан доранд — агар
     * тарҷума нарасад, матни тоҷикӣ мемонад. Ин муҳим аст: холӣ мондани
     * майдон аз матни забони дигар бадтар аст.
     *
     * `code` ва `name` ҳеҷ гоҳ иваз намешаванд. Код шиносаи расмии ММТ аст,
     * ва номи тоҷикӣ ҳамонест, ки довталаб дар китобчаи ММТ меҷӯяд — номи
     * тарҷумашуда ба `nameTranslated` меравад, то саҳифа ҳардуро дар як ҷо
     * нишон диҳад.
     */
    localize<T extends Partial<Career>>(career: T, lang?: string): T {
        if (!career || !lang || lang === 'tj') return career;

        const tr = (career as any).translations?.[lang];
        if (!tr) return career;

        const out: any = { ...career };
        for (const [key, value] of Object.entries(tr)) {
            if (value === null || value === undefined || value === '') continue;
            /* Майдонҳои хидматии скрипти тарҷума (_fields) ба клиент намераванд. */
            if (key.startsWith('_')) continue;
            if (key === 'name') { out.nameTranslated = value; continue; }
            if (key === 'code') continue;
            out[key] = value;
        }

        /* Ҷадвали пурраи тарҷумаҳо ба клиент лозим нест — вазни беҳуда. */
        delete out.translations;
        return out as T;
    }


    /**
     * Ҷустуҷӯи озод: саволи бо забони одӣ навишташуда → филтрҳои ҷустуҷӯ.
     *
     * AI дар ин ҷо ҷавоб намесозад — вай танҳо саволро мефаҳмад. «Мехоҳам
     * барномасоз шавам, донишгоҳ то 4000 сомонӣ» ба
     * `{ search: "барномасоз", maxPrice: 4000 }` табдил меёбад, ва баъд
     * ҳамон `findAll`-и муқаррарӣ кор мекунад. Яъне рӯйхат ҳамеша аз база
     * меояд ва ҳар филтрро дар экран нишон додан мумкин аст — модел на
     * ихтисос месозад, на нарх.
     *
     * Агар AI дастрас набошад ё JSON вайрон бошад, худи матни савол ҳамчун
     * калимаи ҷустуҷӯ меравад: корбар бе натиҷа намемонад.
     */
    async aiSearch(
        rawQuery: string,
        lang = 'tj',
        page = 1,
        limit = 12,
    ): Promise<{ data: Career[]; meta: any; filters: any; understood: boolean; question: string | null; options: any[]; answerLang: string }> {
        const question = (rawQuery || '').trim().slice(0, 300);
        /* То даме модел забони саволро нагӯяд, забони саҳифа меистад. */
        let answerLang = ['tj', 'ru', 'en'].includes(lang) ? lang : 'tj';

        const toDto = (filters: any, p = page, l = limit) => ({
            page: p,
            limit: l,
            ...(filters.search ? { search: filters.search } : {}),
            ...(filters.searchAny?.length ? { searchAny: filters.searchAny } : {}),
            ...(filters.clusterId ? { clusterId: filters.clusterId } : {}),
            ...(filters.maxPrice ? { maxPrice: filters.maxPrice } : {}),
            ...(filters.city ? { city: filters.city } : {}),
            ...(filters.onlyFree ? { freeSeatsOnly: 'true' } : {}),
        }) as GetCareersDto;

        /*
         * Вақте ҷустуҷӯ ҳеҷ чиз наёфт, панҷ кластер ҳамчун роҳи баромад
         * пешниҳод мешаванд. Корбар ҳатто вақте саволаш номаълум аст —
         * «намедонам чӣ кор кунам» — аз ҷои холӣ ба интихоб мегузарад.
         */
        const clusterFallback = async () => {
            const all = await this.clusterRepository.find();
            const list: any[] = [];
            for (const cluster of all.sort((a, b) => (a.clusterId ?? 9) - (b.clusterId ?? 9))) {
                const check = await this.findAll(toDto({ clusterId: cluster.id }, 1, 1));
                if (!check.meta.total) continue;
                list.push({
                    label: cluster.clusterName,
                    clusterNumber: cluster.clusterId,
                    count: check.meta.total,
                    filters: { clusterId: cluster.id, clusterNumber: cluster.clusterId },
                });
            }
            return list;
        };

        const finish = async (understood: boolean, filters: any, options: any[] = [], ask: string | null = null) => {
            const result = await this.findAll(toDto(filters));
            /* Натиҷаи холӣ — ҷои ягонаест, ки кластерҳо ба ҷои вариантҳо меоянд. */
            const finalOptions = !result.meta.total && !options.length ? await clusterFallback() : options;
            return { ...result, filters, understood, question: ask, options: finalOptions, answerLang };
        };

        if (!question) return finish(false, {});

        /* Шаҳр танҳо аз рӯйхати воқеӣ қабул мешавад — вагарна модел шаҳри
           набударо менависад ва ҷустуҷӯ холӣ бармегардад. */
        const rows: Array<{ city: string }> = await this.careerRepository.manager.query(
            'SELECT DISTINCT city FROM universities WHERE city IS NOT NULL',
        );
        const cityNames = rows.map((r) => r.city).filter(Boolean);



        const readJson = (raw: string) => {
            let text = raw.trim();
            if (text.startsWith('```json')) text = text.slice(7);
            else if (text.startsWith('```')) text = text.slice(3);
            if (text.endsWith('```')) text = text.slice(0, -3);
            return JSON.parse(text.trim());
        };

        /* ── Қадами 1: савол → филтрҳо ──────────────────────────────────── */
        const filterPrompt = [
            'Ту ёрирасони ҷустуҷӯи ихтисосҳои Маркази миллии тестии Тоҷикистон ҳастӣ.',
            'Саволи корбарро ба филтрҳои ҷустуҷӯ табдил деҳ.',
            '',
            'САВОЛИ КОРБАР:',
            question,
            '',
            'ШАҲРҲОИ МАВҶУД:',
            cityNames.join(', '),
            '',
            'ФОРМАТИ ҶАВОБ — танҳо JSON, бе матни дигар:',
            '{"lang": "tj ё ru ё en", "keywords": ["решаи мушаххас", "решаи умумитар"], "clusterNumber": 1-5 ё null, "maxPrice": рақам ё null, "city": "ном ё null", "onlyFree": true ё false}',
            '',
            'ҚОИДАҲО:',
            '- "lang" забонест, ки корбар САВОЛРО бо он навиштааст: "tj", "ru" ё "en".',
            '  Диққат: тоҷикӣ метавонад бе ҳарфҳои ӣ, ӯ, ҳ, ҷ навишта шавад —',
            '  «Духтур мехохам шавам» тоҷикӣ аст, на русӣ.',
            '- "keywords": 1–3 реша, ки дар НОМИ ихтисоси расмӣ вомехӯранд,',
            '  аз МУШАХХАСТАРИН ба умумитарин. Реша кӯтоҳ бошад, то шаклҳои',
            '  гуногунро ёбад: «стоматолог», на «стоматологӣ».',
            '- Агар корбар КАСБИ МУШАХХАС гӯяд, решаҳои ҳамон касбро гузор —',
            '  соҳаи умумиро НАГУЗОР. Намунаҳо:',
            '  «духтури дандон», «стоматолог», «дантист» → ["стоматолог", "дандон"]',
            '  «барномасоз», «программист» → ["барномасоз", "информатика"]',
            '  «юрист», «ҳуқуқшинос» → ["ҳуқуқ"]',
            '  «муҳандис», «инженер» → ["муҳандис"]',
            '  «духтур», «врач» (бе касби мушаххас) → ["тиб", "табобат"]',
            '- Саволро аз ҳар забон бифаҳм, вале решаҳо ҲАМЕША тоҷикӣ бошанд:',
            '  номи ихтисосҳо дар база тоҷикӣ аст.',
            '  Номи касби ғайрирасмиро (масалан «Дизайнери UX/UI») нанавис.',
            '- Агар корбар нархро гӯяд («то 4000 сомонӣ»), онро ба "maxPrice" гузор.',
            '- Агар «ройгон», «бюджет» ё «бепул» гӯяд, "onlyFree" = true.',
            '- Кластерҳо: 1 — табиӣ ва техникӣ, 2 — иқтисод ва география,',
            '  3 — филология, педагогика ва санъат, 4 — ҷомеашиносӣ ва ҳуқуқ,',
            '  5 — тиб, биология ва варзиш.',
            '- Агар чизе маълум набошад, null гузор. Тахмин назан.',
        ].join('\n');

        let parsed: any = null;
        try {
            parsed = readJson(await this.aiService.generateContent(filterPrompt));
        } catch (error) {
            /* Модел афтод ё JSON-и вайрон дод — саволро ҳамчун калима мегирем. */
            return finish(false, { search: question });
        }

        /* Ҳеҷ қимати модел бе санҷиш ба дархост намеравад. */
        if (typeof parsed?.lang === 'string') {
            const said = parsed.lang.trim().toLowerCase();
            if (said === 'tj' || said === 'ru' || said === 'en') answerLang = said;
        }

        const filters: any = {};

        /* Решаҳо: массив аз модели нав, сатри ягона аз шакли пештара. */
        const rawKeywords: unknown[] = Array.isArray(parsed?.keywords)
            ? parsed.keywords
            : typeof parsed?.search === 'string' ? [parsed.search] : [];
        const keywords = [...new Set(
            rawKeywords
                .filter((k): k is string => typeof k === 'string')
                .map((k) => k.trim().slice(0, 40))
                .filter((k) => k.length >= 3),
        )].slice(0, 3);

        const clusterNumber = Number(parsed?.clusterNumber);
        if (clusterNumber >= 1 && clusterNumber <= 5) {
            const cluster = await this.clusterRepository.findOne({ where: { clusterId: clusterNumber } });
            if (cluster) {
                filters.clusterId = cluster.id;
                filters.clusterNumber = clusterNumber;
                filters.clusterName = cluster.clusterName;
            }
        }

        const maxPrice = Number(parsed?.maxPrice);
        if (Number.isFinite(maxPrice) && maxPrice > 0 && maxPrice <= 100000) {
            filters.maxPrice = Math.round(maxPrice);
        }

        if (typeof parsed?.city === 'string') {
            const match = cityNames.find((name) => name.toLowerCase() === parsed.city.trim().toLowerCase());
            if (match) filters.city = match;
        }

        if (parsed?.onlyFree === true) filters.onlyFree = true;

        /*
         * Решаҳо аввал дар НОМ ҷуста мешаванд, ҳамаашон якҷо.
         *
         * Кластери модел танҳо тахмин аст. Агар бо он решаҳо ҳеҷ чиз наёбанд,
         * вале бе он меёбанд — кластер партофта мешавад: номи касб аз тахмини
         * соҳа боэътимодтар аст.
         *
         * Агар дар ном ҳеҷ чиз набошад, решаи умумитарин бо ҷустуҷӯи пештара
         * (ном ва тавсиф) санҷида мешавад.
         */
        if (keywords.length) {
            let byName = await this.findAll(toDto({ ...filters, searchAny: keywords }, 1, 1));

            if (!byName.meta.total && filters.clusterId) {
                const retry = await this.findAll(
                    toDto({ ...filters, clusterId: undefined, searchAny: keywords }, 1, 1),
                );
                if (retry.meta.total) {
                    delete filters.clusterId;
                    delete filters.clusterNumber;
                    delete filters.clusterName;
                    byName = retry;
                }
            }

            if (byName.meta.total) {
                filters.searchAny = keywords;
                filters.keywords = keywords;
            } else {
                filters.search = keywords[keywords.length - 1];
            }
        }

        if (!Object.keys(filters).length) return finish(false, { search: question });

        /* ── Қадами 2: агар натиҷа зиёд бошад, аниқ мекунем ─────────────── */
        const broad = await this.findAll(toDto(filters, 1, 24));

        /*
         * Савол танҳо вақте дода мешавад, ки воқеан интихоб лозим бошад.
         * Бо ҳашт ихтисос корбар худаш нигоҳ карда метавонад — пурсидан
         * танҳо як қадами зиёдатӣ мешуд.
         */
        if (broad.meta.total <= CareerService.AI_CHOICE_MIN) {
            return finish(true, filters);
        }

        const names = broad.data.map((c) => c.name).filter(Boolean).slice(0, 24);

        const groupPrompt = [
            'Ту мушовири касбӣ ҳастӣ ва бо хонандаи мактаб сӯҳбат мекунӣ.',
            'Ӯ чунин навишт:',
            question,
            '',
            'Дар базаи мо ин ихтисосҳо ба ӯ мувофиқанд:',
            ...names.map((n) => '- ' + n),
            '',
            'ВАЗИФА: ин рӯйхатро ба 3–4 гурӯҳи фаҳмо тақсим кун ва як саволи кӯтоҳ',
            'нависед, ки хонанда яке аз гурӯҳҳоро интихоб кунад.',
            '',
            'ФОРМАТИ ҶАВОБ — танҳо JSON:',
            '{"question": "савол", "options": [{"label": "номи гурӯҳ", "keyword": "як калимаи тоҷикӣ", "hint": "шарҳи кӯтоҳ"}]}',
            '',
            'ҚОИДАҲО:',
            `- "question", "label" ва "hint" бо забони ${answerLang === 'ru' ? 'русӣ' : answerLang === 'en' ? 'англисӣ' : 'тоҷикӣ'} нависед.`,
            '- "keyword" ҲАТМАН калимаи тоҷикӣ бошад ва дар НОМИ ихтисосҳои боло',
            '  воқеан вомехӯрад — вагарна гурӯҳ холӣ мемонад.',
            '- Гурӯҳҳо бояд аз ҳам фарқ кунанд, на такрори якдигар.',
            '- "label" кӯтоҳ: 2–5 калима.',
            '- "question" — ЯК ҷумлаи кӯтоҳ, то 12 калима, бе муроҷиати',
            '  «Хонандаи азиз» ва бе шарҳ. Масалан: «Кадом самти тиб ба шумо наздиктар аст?»',
            '- "hint" ду чизро мегӯяд: чунин мутахассис ЧӢ КОР МЕКУНАД ва ин кор',
            '  БАРОИ ЧӢ лозим аст. Як-ду ҷумлаи кӯтоҳ, то 20 калима.',
            '  Масалан: «Нерӯгоҳ, шабакаи барқ ва бино тарҳрезӣ ва сохта мешавад —',
            '  то шаҳрҳо барқ ва манзили боэътимод дошта бошанд.»',
            '  Танҳо аз рӯи ихтисосҳои боло нависед.',
            '  Рақам, маош, фоиз ё номи донишгоҳ НАСОЗЕД.',
            '- Танҳо JSON, бе матни дигар.',
        ].join('\n');

        let grouped: any = null;
        try {
            grouped = readJson(await this.aiService.generateContent(groupPrompt));
        } catch (error) {
            /* Аниқкунӣ ихтиёрист — бе он ҳам рӯйхат кор мекунад. */
            return finish(true, filters);
        }

        /*
         * Ҳар вариант дар база санҷида мешавад.
         *
         * Модел метавонад гурӯҳи зебо бо калимае пешниҳод кунад, ки дар ягон
         * ном нест. Чунин вариант дар экран мемонд ва пахш карда шуда, рӯйхати
         * холӣ медод. Аз ин рӯ шумораи воқеӣ ҳисоб карда мешавад ва варианти
         * бенатиҷа умуман нишон дода намешавад.
         */
        const options: any[] = [];
        const seen = new Set<string>();

        for (const raw of Array.isArray(grouped?.options) ? grouped.options.slice(0, 6) : []) {
            const label = typeof raw?.label === 'string' ? raw.label.trim().slice(0, 60) : '';
            const keyword = typeof raw?.keyword === 'string' ? raw.keyword.trim().slice(0, 40) : '';
            const hint = typeof raw?.hint === 'string' ? raw.hint.trim().slice(0, 220) : '';
            if (!label || !keyword) continue;

            const key = keyword.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);

            /* Решаҳои асосӣ (searchAny) мемонанд ва калимаи вариант бо онҳо
               «ва» пайваст мешавад — вариант ҳамеша қисми натиҷаи асосист.
               Пештар решаҳо партофта мешуданд ва вариант 74 нишон медод, дар
               ҳоле ки худи натиҷа 19 буд. */
            const optionFilters: any = { ...filters, search: keyword };
            delete optionFilters.keywords;
            const check = await this.findAll(toDto(optionFilters, 1, 1));
            if (!check.meta.total) continue;

            options.push({ label, hint, count: check.meta.total, filters: optionFilters });
            if (options.length >= 5) break;
        }

        const ask =
            options.length >= 2 && typeof grouped?.question === 'string'
                ? grouped.question.trim().slice(0, 160)
                : null;

        return finish(true, filters, ask ? options : [], ask);
    }

    findOne(id: string): Promise<Career | null> {
        return this.careerRepository.findOne({ where: { id }, relations: ['cluster', 'universities'] });
    }

    findByCode(code: string): Promise<Career | null> {
        return this.careerRepository.findOne({ where: { code }, relations: ['cluster', 'universities'] });
    }

    /**
     * Every university offering this specialty, with its own tuition, study form,
     * language and seat count. Cheapest first so the list opens on the most
     * affordable option; state-funded (ройгон) seats sort to the top.
     */
    async findOfferings(careerId: string, lang?: string) {
        const offerings = await this.offeringRepository.find({
            where: { careerId },
            relations: ['university'],
        });

        return offerings
            .map((offering) => ({
                id: offering.id,
                studyForm: offering.studyForm,
                paymentType: offering.paymentType,
                tuitionFee: offering.tuitionFee,
                language: offering.language,
                seats: offering.seats,
                basedOn: offering.basedOn,
                /* Номи расмии тоҷикӣ дар 'name' мемонад — ҳуҷҷат маҳз бо он
                   супорида мешавад — ва тарҷума ба 'nameTranslated' меравад. */
                university: (() => {
                    const uni = offering.university;
                    const tr = lang && lang !== 'tj' ? (uni as any)?.translations?.[lang] : null;
                    return {
                        id: uni?.id,
                        name: uni?.name,
                        nameTranslated: tr?.name,
                        city: tr?.city ?? uni?.city,
                        region: tr?.region ?? uni?.region,
                        institutionType: tr?.institutionType ?? uni?.institutionType,
                        isState: uni?.isState,
                    };
                })(),
            }))
            /*
             * Ҷойҳои РОЙГОН аввал.
             *
             * Пештар танҳо аз рӯи нарх тартиб дода мешуд, ва ҷойҳои буҷавӣ
             * дар байни пулакиҳо гум мешуданд. Довталаб бошад аввал маҳз
             * ҷои ройгонро меҷӯяд.
             */
            .sort((a, b) => {
                const freeA = a.paymentType === 'ройгон';
                const freeB = b.paymentType === 'ройгон';
                if (freeA !== freeB) return freeA ? -1 : 1;
                return (a.tuitionFee ?? Number.MAX_SAFE_INTEGER) - (b.tuitionFee ?? Number.MAX_SAFE_INTEGER);
            });
    }

    async create(dto: CreateCareerDto): Promise<Career> {
        const { id: _ignoredId, ...rest } = dto as any;
        const career = this.careerRepository.create(rest as unknown as Career);
        return this.careerRepository.save(career);
    }

    async update(id: string, dto: UpdateCareerDto): Promise<Career> {
        await this.careerRepository.update(id, dto as any);
        return this.careerRepository.findOne({ where: { id }, relations: ['cluster'] });
    }

    async delete(id: string): Promise<void> {
        await this.careerRepository.delete(id);
    }

    async deleteAll(): Promise<void> {
        await this.careerRepository.manager.query(`TRUNCATE TABLE career CASCADE`);
    }

    async toggleLike(id: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
        const career = await this.careerRepository.findOne({
            where: { id },
            relations: ['likedByUsers']
        });

        if (!career) {
            throw new NotFoundException('Ихтисос ёфт нашуд');
        }

        const isLiked = career.likedByUsers.some(u => u.id === userId);

        if (isLiked) {
            await this.careerRepository.createQueryBuilder().relation(Career, 'likedByUsers').of(id).remove(userId);
        } else {
            await this.careerRepository.createQueryBuilder().relation(Career, 'likedByUsers').of(id).add(userId);
        }

        const newCount = isLiked ? Math.max(0, career.likesCount - 1) : career.likesCount + 1;
        await this.careerRepository.update(id, { likesCount: newCount });

        return { liked: !isLiked, likesCount: newCount };
    }

    async recalculateAllLikes(): Promise<void> {
        const careers = await this.careerRepository.find({ relations: ['likedByUsers'] });
        for (const career of careers) {
            career.likesCount = career.likedByUsers.length;
            await this.careerRepository.save(career);
        }
    }

    /**
     * Интихоби ихтисосҳои тавсияшуда аз рӯи натиҷаи тест.
     *
     * Ин ягона ҷоест, ки рӯйхати тавсияро месозад — ҳам саҳифаи натиҷаи тест
     * ва ҳам панели корбар аз ҳамин ҷо мегиранд. Пештар ҳар кадом мантиқи
     * худро дошт: тест аз кластери пешбар 24 ихтисос гирифта, онҳоро аз рӯи
     * калидвожаҳои ҷавобҳо тартиб медод, панел бошад ҳамаи ихтисосҳои
     * кластерро (масалан 351-торо) мегирифт, ба ҳамаашон як фоиз медод ва
     * 12-тои аввали навбати базаро нишон медод. Барои ҳамин дар панел
     * ихтисосҳои тамоман дигар мебаромаданд.
     */
    async selectMatchedCareers(userScores: any): Promise<{
        cluster: Cluster | null;
        matchPercentage: number;
        careers: Career[];
        clusterScores: { cluster: Cluster; score: number }[];
        /** Холи калидвожаи ҳар ихтисос — барои фоизи инфиродии корт. */
        careerRanks: Map<string, number>;
    }> {
        const mmtScores = userScores?.mmtClusters || { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
        const clusters = await this.clusterRepository.find();

        const clusterScores = clusters
            .map(cluster => ({
                cluster,
                score: Number(mmtScores[`c${cluster.clusterId}`]) || 0,
            }))
            .sort((a, b) => b.score - a.score);

        const top = clusterScores[0];
        if (!top) {
            return { cluster: null, matchPercentage: 0, careers: [], clusterScores, careerRanks: new Map() };
        }

        const matchPercentage = Math.min(
            100,
            Math.round((top.score / CareerService.MMT_MAX_SCORE) * 100),
        );

        /*
         * ҲАМАИ ихтисосҳои кластер баҳо дода мешаванд, на 24-тои аввал.
         *
         * Пештар ин ҷо `take: 24` буд — бе ҳеҷ тартиб, яъне 24 сабти аввали
         * навбати база. Кластери «Табиӣ ва техникӣ» 351 ихтисос дорад, аз ин
         * рӯ ихтисоси комилан мувофиқ дар ҷои 300 ҳеҷ гоҳ ба рӯйхат
         * намеафтод. Дар экран бошад чизҳои тасодуфии алифбоӣ мебаромаданд.
         *
         * Аввал сабук бор мешавад (бе муносибатҳо), баъд танҳо барои 12-тои
         * беҳтарин донишгоҳҳо гирифта мешавад — вагарна барои 351 сабт
         * муносибат бор кардан лозим мешуд.
         */
        const pool = await this.careerRepository.find({
            where: { clusterId: top.cluster.id },
            select: ['id', 'name', 'description', 'purpose', 'skills', 'likesCount'],
        });

        const keywords: string[] = (userScores?.specialtyKeywords || [])
            .map((k: string) => k.toLowerCase())
            .filter(Boolean);

        const scoreOf = (career: Career): number => {
            if (!keywords.length) return 0;

            /* Мувофиқат дар НОМ вазни бештар дорад: калидвожа дар номи
               ихтисос нисбат ба ҳамон калима дар тавсифи дароз хеле
               маънодортар аст. */
            const name = (career.name || '').toLowerCase();
            const body = [
                career.description || '',
                career.purpose || '',
                ...(career.skills?.technical || []),
                ...(career.skills?.soft || []),
            ].join(' ').toLowerCase();

            return keywords.reduce((total, keyword) => {
                if (name.includes(keyword)) return total + 3;
                if (body.includes(keyword)) return total + 1;
                return total;
            }, 0);
        };

        const ranked = pool
            .map(career => ({ career, rank: scoreOf(career) }))
            .sort((a, b) =>
                b.rank - a.rank ||
                (b.career.likesCount ?? 0) - (a.career.likesCount ?? 0) ||
                (a.career.name || '').localeCompare(b.career.name || ''))
            .slice(0, 12);

        // Донишгоҳҳо танҳо барои ҳамон 12-то бор мешаванд.
        const topCareers = ranked.length
            ? await this.careerRepository.find({
                where: { id: In(ranked.map(r => r.career.id)) },
                relations: ['universities'],
            })
            : [];

        // `In` тартибро нигоҳ намедорад — онро барқарор мекунем.
        const order = new Map(ranked.map((r, index) => [r.career.id, index]));
        topCareers.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

        return {
            cluster: top.cluster,
            matchPercentage,
            careers: topCareers,
            clusterScores,
            careerRanks: new Map(ranked.map((r) => [r.career.id, r.rank])),
        };
    }

    async matchCareers(userScores: any): Promise<any[]> {
        const { careers, matchPercentage, clusterScores, cluster, careerRanks } =
            await this.selectMatchedCareers(userScores);

        /*
         * Профили корбар дар миқёси 0–10 барои диаграммаи радар.
         * Холи ММТ то 40 мерасад, диаграмма то 10 — бе ин тақсим ҳама
         * нуқтаҳо аз ҳудуди диаграмма мебаромаданд.
         */
        const userProfile: Record<string, number> = {};
        for (const entry of clusterScores) {
            userProfile[`c${entry.cluster.clusterId}`] = Number(
                ((entry.score / CareerService.MMT_MAX_SCORE) * 10).toFixed(1),
            );
        }

        /* Ихтисос маҳз ба ЯК кластер тааллуқ дорад — профилаш ҳамин аст,
           на тахмини нарм дар панҷ тараф. */
        const careerProfile: Record<string, number> = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
        if (cluster) careerProfile[`c${cluster.clusterId}`] = 10;

        /*
         * Косинус байни вектори корбар ва вектори «як кластер» ба
           u[c] / ||u|| баробар мешавад: чӣ қадар холи корбар маҳз дар ҳамин
           кластер ҷамъ шудааст.
         */
        const values = clusterScores.map((entry) => entry.score);
        const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
        const topScore = clusterScores[0]?.score ?? 0;
        const secondScore = clusterScores[1]?.score ?? 0;
        const cosineSimilarity = norm > 0 ? Number((topScore / norm).toFixed(3)) : 0;

        /* Масофа то вектори идеалӣ (ҳамаи 40 хол дар як кластер). */
        const ideal = CareerService.MMT_MAX_SCORE;
        const distance = Math.sqrt(
            clusterScores.reduce((sum, entry, index) => {
                const target = index === 0 ? ideal : 0;
                return sum + (entry.score - target) ** 2;
            }, 0),
        );
        const maxDistance = Math.sqrt(ideal * ideal * clusterScores.length);
        const euclideanSimilarity = maxDistance > 0
            ? Number(Math.max(0, 1 - distance / maxDistance).toFixed(3))
            : 0;

        /* Боварӣ = чӣ қадар кластери аввал аз дуюм ҷудо истодааст. Вақте
           ду кластер қариб баробаранд, натиҷа воқеан номуайян аст ва
           довталаб бояд инро бидонад. */
        const confidenceIndex = topScore > 0
            ? Number(((topScore - secondScore) / topScore).toFixed(3))
            : 0;

        const dimensionBreakdown: Record<string, number> = {};
        for (const entry of clusterScores) {
            const key = `c${entry.cluster.clusterId}`;
            dimensionBreakdown[key] = topScore > 0
                ? Number((entry.score / topScore).toFixed(3))
                : 0;
        }

        /*
         * Фоизи ҳар корт алоҳида.
         *
         * Пештар ин ҷо холи КЛАСТЕР мерафт — як рақам барои ҳар 12 корт,
         * ва рӯйхат чунин менамуд, ки ҳисоб умуман кор намекунад. Ҳоло
         * холи кластер асос аст, ва холи калидвожаи худи ихтисос онро то
         * чоряк поён мефарорад: ихтисоси беҳтарин дар боло мемонад,
         * сусттаринаш поёнтар. Агар калидвожа набошад, ҳамаи холҳо сифр
         * мешаванд ва фоиз ба ҳамон холи кластер бармегардад — рақами
         * бофта илова намешавад.
         */
        const maxRank = Math.max(0, ...careers.map((c) => careerRanks.get(c.id) ?? 0));

        return careers.map(career => {
            /*
             * Донишгоҳҳо ҳамроҳи корт мераванд: бе онҳо довталаб мебинад, ки
             * ихтисос ба ӯ мувофиқ аст, вале намедонад куҷо ҳуҷҷат супорад.
             * Се номи аввал бас аст — боқимонда ҳамчун рақам («+4») нишон
             * дода мешавад, то корт дароз нашавад.
             */
            const universities = (career.universities || []);

            const rank = careerRanks.get(career.id) ?? 0;
            const relative = maxRank > 0 ? rank / maxRank : 1;
            const careerMatch = Math.max(
                35,
                Math.min(99, Math.round(matchPercentage * (0.75 + 0.25 * relative))),
            );

            return {
                id: career.id,
                /* Коди расмии ихтисос — маҳз ҳамин рақам ҳангоми супоридани
                   ҳуҷҷат ба ММТ нависта мешавад. */
                code: career.code,
                name: career.name,
                description: career.description,
                purpose: career.purpose,
                matchPercentage: careerMatch,
                /* Ҳамон рақамҳое, ки равзанаи «Таҳлили мувофиқат» мехонад.
                   Пештар ҳеҷ яке аз онҳо фиристода намешуд ва равзана ҳама
                   ҷо 0% бо диаграммаи ҷамъшуда нишон медод. */
                cosineSimilarity,
                euclideanSimilarity,
                confidenceIndex,
                dimensionBreakdown,
                userProfile,
                careerProfile,
                likesCount: career.likesCount,
                universities: universities.slice(0, 3).map(uni => ({
                    id: uni.id,
                    name: uni.shortName || uni.name,
                    city: uni.city,
                })),
                universitiesCount: universities.length,
            };
        });
    }

    async getStats(): Promise<any> {
        const totalCareers = await this.careerRepository.count();
        const totalUsers = await this.careerRepository.manager.getRepository('User').count();
        const totalClusters = await this.careerRepository.manager.getRepository('Cluster').count();

        const likesResult = await this.careerRepository
            .createQueryBuilder('career')
            .select('COALESCE(SUM(career.likesCount), 0)', 'total')
            .getRawOne();
        const totalLikes = parseInt(likesResult?.total || '0');

        const topLiked = await this.careerRepository.find({
            order: { likesCount: 'DESC' },
            take: 5,
            select: ['id', 'name', 'likesCount']
        });

        const topSaved = await this.careerRepository.createQueryBuilder('career')
            .leftJoin('career.savedByUsers', 'user')
            .select(['career.id', 'career.name'])
            .addSelect('COUNT(user.id)', 'savedCount')
            .groupBy('career.id')
            .orderBy('"savedCount"', 'DESC')
            .limit(5)
            .getRawMany();

        return {
            totalCareers,
            totalUsers,
            totalClusters,
            totalLikes,
            topLiked,
            topSaved: topSaved.map(s => ({
                id: s.career_id,
                name: s.career_name,
                savedCount: parseInt(s.savedCount)
            }))
        };
    }

    private getLanguageName(lang: string = 'tj'): string {
        if (lang?.startsWith('ru')) return 'Russian';
        if (lang?.startsWith('en')) return 'English';
        return 'Tajik';
    }

    private getDistanceKm(
        userLocation?: { latitude: number; longitude: number },
        latitude?: number,
        longitude?: number,
    ): number | null {
        if (!userLocation || latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
            return null;
        }

        const toRad = (value: number) => (value * Math.PI) / 180;
        const earthRadiusKm = 6371;
        const lat1 = Number(userLocation.latitude);
        const lon1 = Number(userLocation.longitude);
        const lat2 = Number(latitude);
        const lon2 = Number(longitude);

        if ([lat1, lon1, lat2, lon2].some((value) => Number.isNaN(value))) return null;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(earthRadiusKm * c * 10) / 10;
    }

    private normalizeText(value?: string): string {
        return (value || '')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private extractSearchTerms(question: string, careerName?: string): string[] {
        const text = this.normalizeText(`${careerName || ''} ${question}`);
        // Феълҳо ва калимаҳои умумӣ бояд ин ҷо бошанд.
        //
        // ILIKE '%кунам%' ё '%дорам%' ба садҳо тавсиф мувофиқ меояд, ва ҷустуҷӯ
        // ба ҷои ихтисосҳои мувофиқ тамоми базаро бармегардонад. Ба саволи
        // «ба барномасозӣ шавқ дорам» чат «Бизнес-маъмуриятчигӣ» тавсия медод.
        const stopWords = new Set([
            'ман', 'ба', 'бо', 'ва', 'ё', 'аз', 'дар', 'ки', 'чӣ', 'чи', 'кадом', 'барои', 'мехоҳам', 'мехохам',
            'ихтисос', 'ихтисоси', 'ихтисосро', 'ихтисосҳои', 'профессия', 'профессии',
            'хочу', 'где', 'что', 'как', 'the', 'and', 'for',
            // Феълҳо ва пайвандакҳои сермаъмул
            'дорам', 'дорад', 'доранд', 'кунам', 'кунад', 'кунанд', 'кунед', 'шавам', 'шавад',
            'бошад', 'бошам', 'аст', 'ҳаст', 'ҳастам', 'будан', 'кардан', 'шудан', 'гирифтан',
            'интихоб', 'маслиҳат', 'савол', 'лутфан', 'илтимос', 'салом', 'ассалом',
            'ман_ро', 'худро', 'шумо', 'вай', 'онҳо', 'ҳамин', 'инро', 'онро',
            'хочу', 'нужно', 'какой', 'какая', 'выбрать', 'посоветуйте', 'помогите',
            'want', 'need', 'which', 'choose', 'advise', 'help', 'should',
        ]);

        const words = text
            .split(' ')
            .map((word) => word.trim())
            .filter((word) => word.length >= 3 && !stopWords.has(word));

        /* Ҳар калима ҳам худаш ва ҳам шакли folded-аш меравад, ва агар дар
           ҷадвали ҳаммаъноҳо бошад — тарҷумаи тоҷикиаш низ. Ҷустуҷӯ баъдан
           бо TAJIK_FOLD муқоиса мекунад, пас ҳамааш дар як алифбо мешавад. */
        const terms: string[] = [];
        for (const word of words) {
            const folded = foldTajik(word);
            terms.push(folded);
            /* «врачом», «юристом», «программиста» — русӣ ва тоҷикӣ ҳарду
               бандак мегиранд. Мувофиқати дақиқ онҳоро намегирад, барои
               ҳамин калиди 4-ҳарфа ё дарозтар ҳамчун оғози калима низ
               ҳисоб мешавад. */
            const prefixKey = SYNONYM_KEYS.find(
                (key) => key.length >= 4 && folded.startsWith(key),
            );
            const mapped = CAREER_SYNONYMS[folded] ?? (prefixKey ? CAREER_SYNONYMS[prefixKey] : undefined);
            if (mapped) terms.push(...mapped.map(foldTajik));
        }

        return Array.from(new Set(terms)).slice(0, 10);
    }

    private async findRelevantCareers(question: string, careerName?: string): Promise<Career[]> {
        const terms = this.extractSearchTerms(question, careerName);
        const qb = this.careerRepository
            .createQueryBuilder('career')
            .leftJoinAndSelect('career.cluster', 'cluster')
            .leftJoinAndSelect('career.universities', 'universities');

        if (terms.length > 0) {
            qb.where(new Brackets((where) => {
                terms.forEach((term, index) => {
                    const param = `term${index}`;
                    /* ILIKE хом набуд: истилоҳот аллакай folded аст (ҳ→х),
                       пас сутунҳо низ бояд folded шаванд, вагарна «хукук»
                       ба «Ҳуқуқшиносӣ» ҳеҷ гоҳ намерасад. */
                    const condition = `
                        ${TAJIK_FOLD('career.name')} LIKE :${param}
                        OR ${TAJIK_FOLD('career.description')} LIKE :${param}
                        OR ${TAJIK_FOLD('career.purpose')} LIKE :${param}
                        OR ${TAJIK_FOLD('cluster.clusterName')} LIKE :${param}
                        OR ${TAJIK_FOLD('universities.name')} LIKE :${param}
                        OR ${TAJIK_FOLD('universities.city')} LIKE :${param}
                    `;
                    if (index === 0) where.where(condition, { [param]: `%${term}%` });
                    else where.orWhere(condition, { [param]: `%${term}%` });
                });
            }));
        }

        /**
         * Тартиб аз рӯи мувофиқат, на аз рӯи лайкҳо.
         *
         * Дархост бо OR кор мекунад: як калимаи умумӣ кифоя буд, то ихтисос ба
         * рӯйхат афтад. Баъд тартиби `likesCount` беҳтарин ихтисосҳои мувофиқро
         * ба поён мепартофт ва машҳуртаринҳои бемавзӯъро ба боло мебаровард.
         *
         * Ҳисоб дар JS меравад: мувофиқат дар НОМ вазни се, дар кластер ду, дар
         * тавсиф як. Лайкҳо танҳо ҳангоми баробарӣ ҳал мекунанд.
         */
        const pool = await qb.take(60).getMany();

        const score = (career: Career) => {
            const name = foldTajik(this.normalizeText(career.name || ''));
            const cluster = foldTajik(this.normalizeText(career.cluster?.clusterName || ''));
            const body = foldTajik(this.normalizeText(`${career.description || ''} ${career.purpose || ''}`));
            return terms.reduce((total, term) => {
                if (name.includes(term)) return total + 3;
                if (cluster.includes(term)) return total + 2;
                if (body.includes(term)) return total + 1;
                return total;
            }, 0);
        };

        const matched = pool
            .map((career) => ({ career, rank: score(career) }))
            .filter((entry) => entry.rank > 0)
            .sort((a, b) => b.rank - a.rank || (b.career.likesCount ?? 0) - (a.career.likesCount ?? 0))
            .slice(0, 10)
            .map((entry) => entry.career);

        if (matched.length >= 4) return matched;

        /* Вақте ҷустуҷӯ чизе намеёбад, ин ҷо ихтисосҳои машҳуртарин мегиранд.
           Онҳо ба савол алоқа надоранд, вале модел инро намедонист ва онҳоро
           ҳамчун ҷавоб пешниҳод мекард. `isFallback` дар промпт қайд мешавад,
           то модел бигӯяд, ки мувофиқи аниқ наёфт. */
        const fallback = await this.careerRepository.find({
            relations: ['cluster', 'universities'],
            order: { likesCount: 'DESC' },
            take: 10,
        });

        const byId = new Map<string, Career>();
        [...matched, ...fallback].forEach((career) => byId.set(career.id, career));
        const rows = Array.from(byId.values()).slice(0, 10);
        (rows as any).isFallback = matched.length === 0;
        return rows;
    }

    private formatCareerContext(careers: Career[], userLocation?: { latitude: number; longitude: number }): string {
        if (!careers.length) return 'No career rows found in database.';

        return careers.map((career, index) => {
            const universities = (career.universities || []).map((uni) => {
                const distance = this.getDistanceKm(userLocation, uni.latitude as any, uni.longitude as any);
                return [
                    uni.name,
                    uni.shortName ? `shortName=${uni.shortName}` : null,
                    uni.city ? `city=${uni.city}` : null,
                    distance !== null ? `distanceFromUserKm=${distance}` : null,
                    (uni as any).website ? `website=${(uni as any).website}` : null,
                ].filter(Boolean).join(', ');
            }).join(' | ');

            return [
                `${index + 1}. ${career.name}`,
                `description: ${career.description || 'not provided'}`,
                `purpose: ${career.purpose || 'not provided'}`,
                `cluster: ${career.cluster?.clusterName || career.mmtCluster || 'not provided'}`,
                `degree: ${career.degreeType || 'not provided'}, durationYears: ${career.durationYears || 'not provided'}`,
                `tuitionFee: ${career.tuitionFee ? `${career.tuitionFee} TJS` : 'not provided'}`,
                `salaryAndMarket: ${career.salaryAndMarket ? JSON.stringify(career.salaryAndMarket) : 'not provided'}`,
                `skills: ${career.skills ? JSON.stringify(career.skills) : 'not provided'}`,
                `technologies: ${career.technologies?.join(', ') || 'not provided'}`,
                `roadmap: ${career.roadmap ? JSON.stringify(career.roadmap) : 'not provided'}`,
                `learningResources: ${career.learningResources ? JSON.stringify(career.learningResources) : 'not provided'}`,
                `careerOpportunities: ${career.careerOpportunities?.join(', ') || 'not provided'}`,
                `universities: ${universities || 'not provided'}`,
            ].join('\n');
        }).join('\n\n---\n\n');
    }

    /**
     * Хулосаи кӯтоҳи профил барои промпт.
     *
     * Пештар ин ҷо `JSON.stringify(user.quizResults)` мерафт — тамоми натиҷа
     * бо массиви хоми `specialtyKeywords`. Модел ҳамон рӯйхатро содда ба
     * корбар такрор мекард («ба соҳаҳои авиатсия, сенсор, радио… таваҷҷуҳ
     * доред»), ки на фоида дошт ва на зебо буд. Ҳоло танҳо хулосаи хондашаванда
     * фиристода мешавад: кластери пешбар ва холҳо, бе рӯйхати калидвожаҳо.
     */
    private formatSavedCareerSummary(user?: User | null): string {
        if (!user) return '';

        const saved = (user.savedCareers || []).slice(0, 8).map((career) => career.name).join(', ');
        const liked = (user.likedCareers || []).slice(0, 8).map((career) => career.name).join(', ');

        const lines: string[] = [];
        if (user.name) lines.push(`name: ${user.name}`);

        const mmt = (user.quizResults as any)?.mmtClusters;
        if (mmt) {
            const names: Record<string, string> = {
                c1: 'Табиӣ ва техникӣ',
                c2: 'Иқтисод ва география',
                c3: 'Филология, педагогика ва санъат',
                c4: 'Ҷомеашиносӣ ва ҳуқуқ',
                c5: 'Тиб, биология ва варзиш',
            };
            const ranked = Object.entries(mmt)
                .map(([key, score]) => ({ label: names[key] || key, score: Number(score) || 0 }))
                .sort((a, b) => b.score - a.score);

            lines.push(`quizTopCluster: ${ranked[0]?.label} (${ranked[0]?.score}/40)`);
            lines.push(`quizAllClusters: ${ranked.map((r) => `${r.label} ${r.score}`).join(', ')}`);
        } else {
            lines.push('quiz: not completed yet');
        }

        if (saved) lines.push(`savedCareers: ${saved}`);
        if (liked) lines.push(`likedCareers: ${liked}`);

        return lines.join('\n');
    }

    private buildCareerChatPrompt(params: {
        question: string;
        careerName?: string;
        lang?: string;
        user?: User | null;
        careers: Career[];
        userLocation?: { latitude: number; longitude: number };
    }): string {
        const language = this.getLanguageName(params.lang);
        const userContext = this.formatSavedCareerSummary(params.user);
        const careerContext = this.formatCareerContext(params.careers, params.userLocation);
        /**
         * Бахшҳои холӣ умуман фиристода намешаванд.
         *
         * Пештар дар ҷои холӣ «not provided» ва «not selected» навишта мешуд,
         * ва модел ба ҳамин мечаспид: ба саволи равшани «кадом ихтисосро
         * интихоб кунам?» ҷавоб медод «суроғаатон намоён намешавад» ва хоҳиш
         * мекард саволро аз нав нависанд. Набудани бахш чунин чизе намедиҳад.
         */
        const optional = (heading: string, value?: string) =>
            value && value.trim() ? `\n${heading}:\n${value.trim()}\n` : '';

        const locationContext = params.userLocation
            ? `latitude=${params.userLocation.latitude}, longitude=${params.userLocation.longitude}`
            : '';

        return `
You are MyCareer AI, a practical career advisor for students in Tajikistan.
Answer in ${language}. If the user writes in Tajik, use natural Tajik Cyrillic.

USER QUESTION:
${params.question}
${optional('SELECTED CAREER FIELD', params.careerName)}${optional('USER PROFILE AND HISTORY', userContext)}${optional('USER LOCATION', locationContext)}
${params.careers.length && (params.careers as any).isFallback
    ? [
        'NO EXACT MATCH: the search found nothing for this question. The rows below are',
        'simply the most popular specialties and are NOT answers to what was asked.',
        'Say plainly that you did not find a matching specialty for that word, name the',
        'closest field you can from the rows if one genuinely fits, and ask one short',
        'question to narrow it down. Never present these rows as recommendations.',
      ].join('\n')
    : ''}
DATABASE CONTEXT - use this first, do not invent facts that are missing:
${careerContext}

SPECIALTY NAMES - STRICT RULE:
When you name a specialty a student can apply for, copy the name exactly as it
appears in the database context above. Do not shorten it, translate it, or
replace it with a familiar job title such as "Дизайнери UX/UI", "Барномасози
веб (Full-Stack)" or "Муҳосиб". Those are not on the National Testing Centre
list, so the student cannot apply for them and will not find them on this site.
You may still discuss job roles in general terms, but make clear when you are
describing a role rather than naming a specialty from the list.

TASK:
- Give a useful chat answer based on the user's profile, quiz results, saved careers, and database context.
- If the user asks for salary like 3000-4000 somoni, compare it with salaryAndMarket when available; when not available, say it is an estimate and explain why.
- If the user asks for a city, university, price, or distance, list matching universities with city, tuitionFee, duration, and distanceFromUserKm when available.
- If the user asks for a full explanation of a specialty, cover: what the specialist does, workplaces, 10-year outlook, technologies, books, video courses, certifications, and first 3 practical steps.
- If the user asks for doctor/medical fields, prefer cluster 5 or health-related rows if they exist in the database context.
- If official university website or current tuition is missing from context, clearly say it is not in the database yet and recommend checking the official admissions page. Do not invent links or prices.

STYLE - FOLLOW EXACTLY:
- Address the student with the polite "шумо" (Russian "вы", English "you"). Never use the informal "ту".
- Answer the question that was actually asked. Do not open with a long welcome or a
  summary of the student's profile unless they asked about their profile.
- Never read the student's keyword list, cluster scores or saved careers back to them
  as a list. Use that data silently to choose what to recommend.
- If the student only greets you ("салом", "привет", "hi") and asks nothing, reply in at
  most 3 sentences: greet back, name at most two specialties that suit their quiz result,
  and end by asking what they would like to know. Save the details for when they ask.
- Be concrete. Prefer a named specialty, a number, or a next step over general advice.
- Keep it under 180 words unless the student asked for a full explanation.

FORMATTING - THE CHAT RENDERS A LIMITED SUBSET:
- You may use "**bold**" for emphasis and lines starting with "- " for lists.
- Do NOT use "*" for bullets, "#" headings, tables, code blocks or links.
- Separate ideas with a blank line. Never output JSON.
`;
    }

    async askAi(
        question: string,
        userId?: string,
        careerName?: string,
        lang: string = 'tj',
        userLocation?: { latitude: number; longitude: number },
    ): Promise<{ answer: string; remainingToday: number }> {
        let user: User | null = null;
        if (userId) {
            user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['savedCareers', 'savedCareers.universities', 'likedCareers', 'likedCareers.universities'],
            });
        }

        if (user && user.role !== UserRole.ADMIN) {
            const today = new Date().toISOString().slice(0, 10);
            const usage = user.aiDailyUsage || { date: null, count: 0 };
            if (usage.date !== today) { usage.date = today; usage.count = 0; }
            if (LIMIT_ON && usage.count >= DAILY_LIMIT) {
                throw new ForbiddenException(`Имрӯз ${DAILY_LIMIT} савол тамом шуд. Фардо дубора кӯшиш кунед.`);
            }
        }

        const careers = await this.findRelevantCareers(question, careerName);
        const prompt = this.buildCareerChatPrompt({
            question,
            careerName,
            lang,
            user,
            careers,
            userLocation,
        });
        
        let answer = await this.aiService.generateContent(prompt);

        if (user && user.role !== UserRole.ADMIN) {
            const today = new Date().toISOString().slice(0, 10);
            const usage = user.aiDailyUsage || { date: null, count: 0 };
            if (usage.date !== today) { usage.date = today; usage.count = 0; }
            usage.count += 1;

            const history = user.chatHistory || [];
            history.push({ question, answer, careerName: careerName || undefined, createdAt: new Date().toISOString() });
            if (history.length > 100) history.splice(0, history.length - 100);

            await this.userRepository.update(user.id, { aiDailyUsage: usage, chatHistory: history });
            return { answer, remainingToday: LIMIT_ON ? Math.max(0, DAILY_LIMIT - usage.count) : null };
        }

        return { answer, remainingToday: null };
    }

    /**
     * Ба саволи корбар дар бораи як ихтисоси мушаххас ҷавоб медиҳад.
     *
     * Фарқаш аз `askAi`: он ихтисосро аз рӯи ном ҷустуҷӯ мекунад ва метавонад
     * сабти нодурустро гирад. Дар саҳифаи ихтисос мо айнан медонем, ки сухан
     * дар бораи кадом сабт меравад, аз ин рӯ ҳамон сабт ва пешниҳодҳои воқеии
     * донишгоҳҳо (нарх, ҷойҳои ройгон, шакли таҳсил) ба промпт дода мешаванд.
     * Ин муҳим аст: бе ин AI нархро аз худ мебофад.
     */
    async askAboutCareer(
        careerId: string,
        question: string,
        userId?: string,
        lang: string = 'tj',
    ): Promise<{ answer: string; remainingToday: number }> {
        const career = await this.careerRepository.findOne({
            where: { id: careerId },
            relations: ['cluster'],
        });
        if (!career) {
            throw new NotFoundException('Ихтисос ёфт нашуд');
        }

        let user: User | null = null;
        if (userId) {
            user = await this.userRepository.findOne({ where: { id: userId } });
        }

        const today = new Date().toISOString().slice(0, 10);
        const limited = user && user.role !== UserRole.ADMIN;
        if (limited) {
            const usage = user!.aiDailyUsage || { date: null, count: 0 };
            if (usage.date !== today) { usage.date = today; usage.count = 0; }
            if (LIMIT_ON && usage.count >= DAILY_LIMIT) {
                throw new ForbiddenException(`Имрӯз ${DAILY_LIMIT} савол тамом шуд. Фардо дубора кӯшиш кунед.`);
            }
        }

        const offerings = await this.findOfferings(careerId);
        const answer = await this.aiService.generateContent(
            this.buildSingleCareerPrompt(career, offerings, question, lang),
        );

        if (limited) {
            const usage = user!.aiDailyUsage || { date: null, count: 0 };
            if (usage.date !== today) { usage.date = today; usage.count = 0; }
            usage.count += 1;

            const history = user!.chatHistory || [];
            history.push({ question, answer, careerName: career.name, createdAt: new Date().toISOString() });
            if (history.length > 100) history.splice(0, history.length - 100);

            await this.userRepository.update(user!.id, { aiDailyUsage: usage, chatHistory: history });
            return { answer, remainingToday: LIMIT_ON ? Math.max(0, DAILY_LIMIT - usage.count) : null };
        }

        return { answer, remainingToday: null };
    }

    /**
     * Промпт барои чати як ихтисос.
     *
     * Танҳо бахшҳои пуршуда фиристода мешаванд: сабтҳои холӣ ба монанди
     * «''» ё «[]» ба модел ишора медиҳанд, ки маълумот нест, вале ҷои
     * бештарро мегиранд ва ҷавобро суст мекунанд.
     */
    private buildSingleCareerPrompt(
        career: Career,
        offerings: Array<any>,
        question: string,
        lang: string,
    ): string {
        const section = (heading: string, value: any): string => {
            if (value === null || value === undefined) return '';
            if (Array.isArray(value) && value.length === 0) return '';
            if (typeof value === 'string' && !value.trim()) return '';
            const body = Array.isArray(value) ? value.join('; ') : String(value);
            return `${heading}: ${body}\n`;
        };

        const places = offerings.slice(0, 12).map((offering) => {
            const price = offering.paymentType === 'ройгон' || offering.tuitionFee === null
                ? 'ройгон'
                : `${offering.tuitionFee} сомонӣ/сол`;
            return `- ${offering.university?.name} (${offering.university?.city ?? 'шаҳр номаълум'}), ` +
                   `${offering.studyForm}, ${offering.language}, ${price}, ҷойҳо: ${offering.seats ?? 'номаълум'}`;
        }).join('\n');

        const languageName = lang === 'ru' ? 'русӣ' : lang === 'en' ? 'англисӣ' : 'тоҷикӣ';

        return [
            `Ту мушовири касбӣ дар портали "Ихтисоси ман" ҳастӣ. Ба хонандаи мактаби Тоҷикистон ҷавоб медиҳӣ.`,
            '',
            `ИХТИСОС: ${career.name}`,
            section('Коди МНТ', career.code),
            section('Кластер', career.cluster?.clusterName),
            section('Тавсиф', career.description),
            section('Мақсад', career.purpose),
            section('Малакаҳои техникӣ', career.skills?.technical),
            section('Малакаҳои шахсӣ', career.skills?.soft),
            section('Технологияҳо', career.technologies),
            section('Имкониятҳои корӣ', career.careerOpportunities),
            section('Муддати таҳсил (сол)', career.durationYears),
            '',
            places ? `ДАР КУҶО МЕОМӮЗАНД (маълумоти воқеӣ аз базаи мо):\n${places}` : '',
            '',
            'ҚОИДАҲОИ ҚАТЪӢ:',
            `1. Танҳо бо забони ${languageName} ҷавоб деҳ.`,
            '2. Танҳо аз маълумоти боло истифода бар. Нарх, ном ё рақами донишгоҳро аз худ насоз.',
            '3. Агар ҷавоб дар маълумоти боло набошад, рост бигӯ: "Ин маълумот дар базаи мо нест".',
            '4. Маоши мушаххасро наном, агар дар боло набошад — дар Тоҷикистон чунин маълумоти расмӣ мавҷуд нест.',
            '5. Кӯтоҳ ва содда навис, 3-6 ҷумла. Хонанда 15-17 сола аст.',
            '',
            `САВОЛИ ХОНАНДА: ${question}`,
        ].filter(Boolean).join('\n');
    }

    async generateCareerAdvisorReport(scores: any, lang: string = 'tj', quizProfile?: any): Promise<any> {
        const mmt = scores?.mmtClusters || scores;
        const hasScores = mmt && (
            (mmt.c1 !== undefined && mmt.c1 !== null) ||
            (mmt.c2 !== undefined && mmt.c2 !== null) ||
            (mmt.c3 !== undefined && mmt.c3 !== null) ||
            (mmt.c4 !== undefined && mmt.c4 !== null) ||
            (mmt.c5 !== undefined && mmt.c5 !== null)
        );
        if (!hasScores) {
            throw new NotFoundException('Натиҷаҳои тест ёфт нашуданд. Аввал тестро гузаред.');
        }

        const topMatches = await this.matchCareers(scores);
        const top3 = topMatches.slice(0, 3);

        // Ба модел доираи васеътар дода мешавад, на танҳо се беҳтарин.
        //
        // Номҳо ҳоло қатъӣ маҳдуданд (ниг. ҚОИДАИ ҚАТЪӢ дар промт). Агар се ном
        // дода шавад, модел маҷбур мешавад ҳамон серо баргардонад ва мулоҳизаи
        // он ҳеҷ нақш надорад. Бо ҳашт номзад он аз рӯйхати ВОҚЕӢ интихоб
        // мекунад ва сабабашро шарҳ медиҳад.
        const candidates = topMatches.slice(0, 8);
        const topNames = candidates.map((career) => career.name).filter(Boolean);
        const detailedCareers = topNames.length
            ? await this.careerRepository.find({
                where: { name: In(topNames) },
                relations: ['cluster', 'universities'],
            })
            : [];

        const careersContext = (detailedCareers.length ? detailedCareers : candidates).map((c: any) => [
            `- ${c.name}: ${c.description || c.purpose || ''}`,
            c.cluster?.clusterName ? `  cluster: ${c.cluster.clusterName}` : '',
            c.skills ? `  skills: ${JSON.stringify(c.skills)}` : '',
            c.technologies?.length ? `  technologies: ${c.technologies.join(', ')}` : '',
            c.learningResources ? `  learningResources: ${JSON.stringify(c.learningResources)}` : '',
            c.roadmap ? `  roadmap: ${JSON.stringify(c.roadmap)}` : '',
            c.salaryAndMarket ? `  salaryAndMarket: ${JSON.stringify(c.salaryAndMarket)}` : '',
            c.careerOpportunities?.length ? `  opportunities: ${c.careerOpportunities.join(', ')}` : '',
            c.universities?.length ? `  universities: ${c.universities.map((u) => `${u.name} (${u.city || 'city unknown'})`).join('; ')}` : '',
        ].filter(Boolean).join('\n')).join('\n\n');

        const quizAnswers = (quizProfile?.answers || []).slice(0, 30);
        const quizAnswersContext = quizAnswers.length
            ? quizAnswers.map((answer, index) => [
                `${index + 1}. question: ${answer.question || answer.questionId}`,
                `   selected: ${answer.selectedText || answer.selectedValue}`,
                answer.type ? `   type: ${answer.type}` : '',
                answer.part ? `   part: ${answer.part}` : '',
                answer.targetCluster ? `   targetCluster: ${answer.targetCluster}` : '',
                answer.keywords?.length ? `   keywords: ${answer.keywords.join(', ')}` : '',
            ].filter(Boolean).join('\n')).join('\n')
            : 'No detailed quiz answers were provided. Use scores only.';

        const languageName = this.getLanguageName(lang);
        const languageInstructions = {
            Tajik: {
                task: 'Таҳлили амиқи шахсият ва тавсияҳои касбиро ПУРРА БО ЗАБОНИ ТОҶИКӢ (бо алифбои кириллии тоҷикӣ) омода кунед. Тавсияҳо бояд ба ихтисосҳои воқеии боло зикршуда асос ёбанд.',
                format: 'Ҷавобро ТАНҲО дар қолаби JSON-и зерин баргардонед (бидуни ягон матни иловагӣ ё блокҳои код):',
                personalityAnalysis: "Таҳлили муфассали психологии корбар дар асоси кластерҳои MMT",
                name: "Номи ихтисос (аз рӯйхати боло)",
                shortDescription: "Тавсифи мухтасар ва чаро ин ихтисос ба ин шахс мувофиқ аст",
                career: "Номи ихтисос",
                reason: "Сабаби мушаххас ва илмӣ барои интихоби ин ихтисос дар асоси профили MMT-и корбар",
                reasoning: "Шарҳи он ки чаро эҳтимолияти муваффақият маҳз ҳамин қадар аст",
                targetCareer: "Ихтисоси асосӣ барои оғоз",
                stepTitle: "Номи қадам (масалан, Омӯзиши иловагӣ)",
                stepDuration: "6 моҳ / 1 сол",
                stepDescription: "Тавсифи пурраи он ки дар ин қадам чӣ бояд кард"
            },
            Russian: {
                task: 'Подготовьте глубокий психологический анализ личности и профессиональные рекомендации ПОЛНОСТЬЮ НА РУССКОМ ЯЗЫКЕ. Рекомендации должны быть основаны на реальных специальностях, указанных выше.',
                format: 'Возвращайте ответ СТРОГО в следующем формате JSON (без какого-либо дополнительного текста или блоков кода):',
                personalityAnalysis: "Подробный психологический анализ пользователя на основе кластеров MMT",
                name: "Название специальности (из списка выше)",
                shortDescription: "Краткое описание и почему эта специальность подходит человеку",
                career: "Название специальности",
                reason: "Конкретная научная причина выбора этой специальности на основе профиля MMT",
                reasoning: "Объяснение, почему вероятность успеха именно такая",
                targetCareer: "Основная специальность для старта",
                stepTitle: "Название шага (например, Дополнительное обучение)",
                stepDuration: "6 месяцев / 1 год",
                stepDescription: "Полное описание того, что нужно сделать на этом шаге"
            },
            English: {
                task: 'Prepare a deep personality analysis and career recommendations COMPLETELY IN ENGLISH. Recommendations must be based on the real careers listed above.',
                format: 'Return the response STRICTLY in the following JSON format (without any extra text or code blocks):',
                personalityAnalysis: "Detailed psychological analysis of the user based on MMT clusters",
                name: "Career name (from the list above)",
                shortDescription: "Brief description and why this career suits the person",
                career: "Career name",
                reason: "Specific and scientific reason for choosing this career based on the user's MMT profile",
                reasoning: "Explanation of why the probability of success is exactly this much",
                targetCareer: "Main career to start with",
                stepTitle: "Step name (e.g. Additional training)",
                stepDuration: "6 months / 1 year",
                stepDescription: "Full description of what to do in this step"
            }
        };

        const instr = languageName === 'Russian' ? languageInstructions.Russian : languageName === 'English' ? languageInstructions.English : languageInstructions.Tajik;

        // Номҳои иҷозатдодашуда алоҳида дода мешаванд.
        //
        // Бе ин модел номҳои «шинос»-ро месохт — «Дизайнери UX/UI», «Барномасози
        // веб (Full-Stack)» — ки дар базаи 884-ихтисоса вуҷуд надоранд ва дар
        // рӯйхати ММТ ҳам нестанд. Хонанда тавсия мегирифт, дар сайт меҷуст,
        // намеёфт, ва ба чунин ихтисос ҳуҷҷат супорида ҳам наметавонист.
        const allowedNames = (detailedCareers.length ? detailedCareers : candidates)
            .map((c: any) => c.name)
            .filter(Boolean);

        const prompt = `Шумо як мушовири касбии ботаҷриба ҳастед.
Натиҷаҳои санҷиши MMT-и корбар (Кластерҳои Маркази Миллии Тестӣ): ${JSON.stringify(mmt)}.
Ихтисосҳои мувофиқтарин аз базаи мо барои ин корбар:
${careersContext}

ҚОИДАИ ҚАТЪӢ — НОМИ ИХТИСОСҲО:
Дар "careerRecommendations", "explanation", "successPrediction" ва
"careerRoadmap.targetCareer" ТАНҲО ҳамин номҳоро истифода баред, ҲАРФ БА ҲАРФ:
${allowedNames.map((n) => `  • ${n}`).join('\n')}
Номи навро НАСОЗЕД. Тарҷума накунед. Кӯтоҳ накунед. Номи касби умумӣ
(масалан "Дизайнери UX/UI" ё "Барномасози веб") нанависед — чунин ихтисос дар
рӯйхати Маркази миллии тестӣ вуҷуд надорад ва хонанда ба он ҳуҷҷат супорида
наметавонад.

DETAILED QUIZ ANSWERS FROM THE LAST TEST:
${quizAnswersContext}

Use the detailed answers above, not only the numeric scores. Explain what the user's answers reveal about interests, work style, learning style, and career fit.
Also include practical learning resources: books, video lessons, courses, and trusted documentation/sources. If a real URL is uncertain, omit the URL and provide a searchable title/platform.
Include a concrete 10-year outlook for the target career in Tajikistan and globally: 1-3 years, 4-7 years, 8-10 years, opportunities, risks, and skills that will become more valuable.
Also include estimated salary and demand outlook for the next 10 years. Make clear these are estimates, not guaranteed numbers. Use Tajikistan somoni per month when possible, with beginner/mid/senior ranges and explain what can increase or decrease salary.

ВАЗИФА: ${instr.task}

${instr.format}
{
  "personalityAnalysis": "${instr.personalityAnalysis}",
  "careerRecommendations": [
    {
      "name": "${instr.name}",
      "matchPercentage": 90,
      "shortDescription": "${instr.shortDescription}"
    }
  ],
  "explanation": [
    {
      "career": "${instr.career}",
      "reason": "${instr.reason}"
    }
  ],
  "successPrediction": [
    {
      "career": "${instr.career}",
      "probability": 85,
      "reasoning": "${instr.reasoning}"
    }
  ],
  "careerRoadmap": {
    "targetCareer": "${instr.targetCareer}",
    "steps": [
      {
        "title": "${instr.stepTitle}",
        "duration": "${instr.stepDuration}",
        "description": "${instr.stepDescription}"
      }
    ]
  },
  "tenYearOutlook": {
    "summary": "10-year future of this career",
    "shortTerm": ["1-3 year trend"],
    "midTerm": ["4-7 year trend"],
    "longTerm": ["8-10 year trend"],
    "opportunities": ["Opportunity"],
    "risks": ["Risk or challenge"],
    "salaryOutlook": {
      "currency": "TJS/month",
      "note": "These are approximate estimates, not guaranteed salaries.",
      "current": { "beginner": "range", "mid": "range", "senior": "range" },
      "in10Years": { "beginner": "range", "mid": "range", "senior": "range" },
      "growthFactors": ["What can increase salary"],
      "riskFactors": ["What can reduce salary"]
    },
    "demandOutlook": {
      "currentDemand": "low/medium/high",
      "in10YearsDemand": "low/medium/high",
      "neededSpecialists": "estimated demand description for Tajikistan and remote market",
      "why": ["Reason demand grows or falls"]
    }
  }
}
`;

        let rawResponse: string;
        try {
            rawResponse = await this.aiService.generateContent(prompt);
        } catch (error) {
            throw new InternalServerErrorException('Хатогӣ ҳангоми тавлиди тавсияи AI');
        }

        let report: any;
        try {
            let cleaned = rawResponse.trim();
            if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
            else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
            if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
            report = JSON.parse(cleaned.trim());
        } catch (e) {
            report = {
                personalityAnalysis: "Test completed.",
                careerRecommendations: top3.map(m => ({ name: m.name, matchPercentage: m.matchPercentage, shortDescription: '' })),
                explanation: [],
                successPrediction: [],
                careerRoadmap: { targetCareer: top3[0]?.name || '', steps: [] }
            };
        }

        // Тафтиши номҳо. Промт метавонад нодида монад; ин ҷо кафолат аст.
        //
        // Ҳар тавсияе, ки номаш дар база нест, партофта мешавад. Агар ҳеҷ чиз
        // намонад, ихтисосҳои воқеии беҳтарин гузошта мешаванд — беҳтар аз
        // рӯйхати холӣ ва хеле беҳтар аз номи бофта.
        const allowed = new Map(
            allowedNames.map((n: string) => [n.trim().toLowerCase(), n]),
        );
        const keepReal = (name: unknown) =>
            typeof name === 'string' && allowed.has(name.trim().toLowerCase());

        if (Array.isArray(report?.careerRecommendations)) {
            const kept = report.careerRecommendations.filter((r: any) => keepReal(r?.name));
            report.careerRecommendations = kept.length
                ? kept
                : top3.map((m: any) => ({
                    name: m.name,
                    matchPercentage: m.matchPercentage,
                    shortDescription: '',
                }));
        }
        for (const field of ['explanation', 'successPrediction']) {
            if (Array.isArray(report?.[field])) {
                report[field] = report[field].filter((item: any) => keepReal(item?.career));
            }
        }
        if (report?.careerRoadmap && !keepReal(report.careerRoadmap.targetCareer)) {
            report.careerRoadmap.targetCareer = top3[0]?.name ?? '';
        }

        const targetCareerName = report?.careerRoadmap?.targetCareer || top3[0]?.name || 'Target career';
        const isTj = lang?.startsWith('tj');
        const isRu = lang?.startsWith('ru');
        const fallbackText = {
            booksTitle: isTj ? `Китоби муқаддимавӣ барои ${targetCareerName}` : isRu ? `Вводная книга для ${targetCareerName}` : `Introductory handbook for ${targetCareerName}`,
            booksDesc: isTj ? 'Аз асосҳо оғоз кунед: мафҳумҳои асосӣ, вазифаҳои амалӣ ва мисолҳои сода.' : isRu ? 'Начните с основ: ключевые понятия, практические задания и простые примеры.' : 'Start with a beginner-friendly book that explains core concepts and practice tasks.',
            skillsTitle: isTj ? `Маҳоратҳои касбӣ барои ${targetCareerName}` : isRu ? `Профессиональные навыки для ${targetCareerName}` : `Professional skills for ${targetCareerName}`,
            skillsDesc: isTj ? 'Барои фаҳмидани истилоҳҳо, тарзи кори ҳаррӯза ва малакаҳои амалӣ.' : isRu ? 'Для понимания терминов, ежедневного рабочего процесса и практических навыков.' : 'Use it to build terminology, daily workflow, and practical understanding.',
            roadmapVideo: isTj ? `Роҳи омӯзиши ${targetCareerName} барои навомӯзон` : isRu ? `Дорожная карта ${targetCareerName} для начинающих` : `${targetCareerName} beginner roadmap`,
            projectsVideo: isTj ? `Лоиҳаҳои амалӣ барои ${targetCareerName}` : isRu ? `Практические проекты для ${targetCareerName}` : `${targetCareerName} practical projects`,
            foundationsCourse: isTj ? `Асосҳои ${targetCareerName}` : isRu ? `Основы ${targetCareerName}` : `${targetCareerName} foundations`,
            courseDesc: isTj ? 'Курси сохторнок бо вазифаҳо ва сертификат интихоб кунед.' : isRu ? 'Выберите структурированный курс с заданиями и сертификатом.' : 'Choose a structured beginner course with assignments and certificates.',
            officialPages: isTj ? 'Саҳифаҳои расмии қабули донишгоҳҳо' : isRu ? 'Официальные страницы приемных комиссий вузов' : 'Official university admissions pages',
            officialDesc: isTj ? 'Барои санҷидани нарх, муҳлат ва талаботи қабул аз манбаи расмӣ истифода баред.' : isRu ? 'Проверяйте стоимость, срок обучения и требования приема на официальных страницах.' : 'Use official pages to verify tuition, duration, and admission requirements.',
            marketPages: isTj ? 'Ҷойҳои корӣ ва талаботи бозори меҳнат' : isRu ? 'Вакансии и требования рынка труда' : 'Current labor-market vacancies',
            marketDesc: isTj ? 'Вакансияҳои маҳаллӣ ва remote-ро санҷед, то малакаҳо ва маоши талабшавандаро бинед.' : isRu ? 'Проверяйте локальные и удаленные вакансии, чтобы понимать навыки и зарплатные ожидания.' : 'Check local and remote job posts to validate skills and salary demand.',
            outlookSummary: isTj ? `${targetCareerName} дар 10 соли оянда бештар малакаҳои рақамӣ, портфолиои амалӣ ва омӯзиши доимиро талаб мекунад.` : isRu ? `${targetCareerName} в ближайшие 10 лет будет требовать сильных цифровых навыков, практического портфолио и постоянного обучения.` : `${targetCareerName} will likely require stronger digital skills, practical portfolios, and continuous learning over the next 10 years.`,
            shortTerm: isTj ? 'Асосҳоро омӯзед, лоиҳаҳои хурд созед ва абзорҳои сатҳи entry-level-ро аз худ кунед.' : isRu ? 'Изучите основы, сделайте небольшие проекты и освойте инструменты начального уровня.' : 'Build fundamentals, complete small projects, and learn the tools used by entry-level specialists.',
            midTerm: isTj ? 'Самти махсус интихоб кунед, портфолио созед ва таҷрибаи internship ё freelance гиред.' : isRu ? 'Выберите специализацию, соберите портфолио и получите опыт стажировки или фриланса.' : 'Specialize, create a portfolio, and gain internship or freelance experience.',
            longTerm: isTj ? 'Ба сатҳи мутахассиси қавӣ, роҳбар, машваратчӣ, омӯзгор ё соҳибкорӣ гузаред.' : isRu ? 'Переходите к ролям эксперта, руководителя, консультанта, преподавателя или предпринимателя.' : 'Move toward expert, lead, consulting, teaching, or entrepreneurship roles.',
            opportunity: isTj ? 'Кори remote, рақамикунонии соҳаҳо ва талаботи афзоянда ба мутахассисони амалӣ.' : isRu ? 'Удаленная работа, цифровизация отраслей и растущий спрос на практических специалистов.' : 'Remote work, digital transformation, and growing demand for practical specialists.',
            risk: isTj ? 'Кӯҳна шудани малакаҳо, портфолиои заиф ва такя кардан танҳо ба назария.' : isRu ? 'Устаревание навыков, слабое портфолио и опора только на теорию.' : 'Outdated skills, weak portfolio, and relying only on theory without practice.',
            answerInsight: isTj ? 'Ин ҷавоб дар таҳлили тавсия истифода шуд ва ба мувофиқати касбӣ таъсир дорад.' : isRu ? 'Этот ответ использован в логике рекомендации и помогает объяснить карьерное соответствие.' : 'This answer was included in the recommendation logic and helps explain the career fit.',
            salaryNote: isTj ? 'Инҳо тахминанд, на маоши кафолатнок. Маош аз шаҳр, таҷриба, забон, портфолио ва кори remote вобаста аст.' : isRu ? 'Это ориентировочные оценки, не гарантированная зарплата. Доход зависит от города, опыта, языков, портфолио и удаленной работы.' : 'These are approximate estimates, not guaranteed salaries. Salary depends on city, experience, language skills, portfolio, and remote work.',
            currentDemand: isTj ? 'миёна' : isRu ? 'средний' : 'medium',
            futureDemand: isTj ? 'баланд' : isRu ? 'высокий' : 'high',
            neededSpecialists: isTj ? 'Дар 10 соли оянда талабот ба мутахассисони дорои малакаи амалӣ, портфолио ва қобилияти кор бо технологияҳои нав зиёд мешавад.' : isRu ? 'В ближайшие 10 лет будет расти спрос на специалистов с практическими навыками, портфолио и умением работать с новыми технологиями.' : 'Over the next 10 years, demand will grow for specialists with practical skills, a portfolio, and the ability to work with new technologies.',
            demandWhy: isTj ? 'Рақамикунонӣ, автоматизатсия ва талаботи бозори меҳнат ба натиҷаи амалӣ зиёд мешавад.' : isRu ? 'Цифровизация, автоматизация и спрос рынка на практический результат будут расти.' : 'Digitalization, automation, and market demand for practical results will increase.',
            growthFactor: isTj ? 'Таҷрибаи воқеӣ, забони англисӣ/русӣ, портфолиои қавӣ, сертификатҳо ва кори remote маошро зиёд мекунанд.' : isRu ? 'Реальный опыт, английский/русский, сильное портфолио, сертификаты и удаленная работа повышают доход.' : 'Real experience, English/Russian, a strong portfolio, certifications, and remote work increase salary.',
            salaryRisk: isTj ? 'Малакаҳои кӯҳна, набудани лоиҳаҳои амалӣ ва такя ба назария маошро паст нигоҳ медоранд.' : isRu ? 'Устаревшие навыки, отсутствие практических проектов и опора только на теорию ограничивают зарплату.' : 'Outdated skills, lack of practical projects, and relying only on theory keep salary lower.',
        };
        report.learningResources = report.learningResources || {
            books: [
                { title: fallbackText.booksTitle, description: fallbackText.booksDesc },
                { title: fallbackText.skillsTitle, description: fallbackText.skillsDesc },
            ],
            videos: [
                { title: fallbackText.roadmapVideo, description: isTj ? 'Ин мавзӯъро дар YouTube ҷустуҷӯ кунед ва playlist-и пурра интихоб кунед.' : isRu ? 'Найдите эту тему на YouTube и выберите полный плейлист.' : 'Search this topic on YouTube for a complete starter playlist.', platform: 'YouTube' },
                { title: fallbackText.projectsVideo, description: isTj ? 'Бо дарсҳои project-based ва намунаҳои портфолио машқ кунед.' : isRu ? 'Практикуйтесь на проектных уроках и примерах портфолио.' : 'Practice with project-based lessons and portfolio examples.', platform: 'YouTube/freeCodeCamp' },
            ],
            courses: [
                { title: fallbackText.foundationsCourse, description: fallbackText.courseDesc, platform: 'Coursera/edX/Udemy/freeCodeCamp' },
            ],
            sources: [
                { title: fallbackText.officialPages, description: fallbackText.officialDesc },
                { title: fallbackText.marketPages, description: fallbackText.marketDesc },
            ],
        };
        report.tenYearOutlook = report.tenYearOutlook || {
            summary: fallbackText.outlookSummary,
            shortTerm: [fallbackText.shortTerm],
            midTerm: [fallbackText.midTerm],
            longTerm: [fallbackText.longTerm],
            opportunities: [fallbackText.opportunity],
            risks: [fallbackText.risk],
        };
        report.tenYearOutlook.salaryOutlook = report.tenYearOutlook.salaryOutlook || {
            currency: 'TJS/month',
            note: fallbackText.salaryNote,
            current: {
                beginner: '1 500 - 3 000',
                mid: '3 500 - 7 000',
                senior: '8 000 - 15 000+',
            },
            in10Years: {
                beginner: '3 000 - 5 000',
                mid: '7 000 - 14 000',
                senior: '15 000 - 30 000+',
            },
            growthFactors: [fallbackText.growthFactor],
            riskFactors: [fallbackText.salaryRisk],
        };
        report.tenYearOutlook.demandOutlook = report.tenYearOutlook.demandOutlook || {
            currentDemand: fallbackText.currentDemand,
            in10YearsDemand: fallbackText.futureDemand,
            neededSpecialists: fallbackText.neededSpecialists,
            why: [fallbackText.demandWhy],
        };
        report.quizAnswerAnalysis = report.quizAnswerAnalysis || quizAnswers.map((answer) => ({
            question: answer.question || answer.questionId,
            answer: answer.selectedText || String(answer.selectedValue),
            insight: fallbackText.answerInsight,
        }));

        return {
            /*
             * Холҳои кластерҳои ММТ.
             *
             * Дар паҳлӯи ин майдон боз `riasecScores` фиристода мешуд, ки
             * қиматашро аз `scores?.riasec || scores?.cognitive || mmt`
             * мегирифт. Дар барнома ҳеҷ RIASEC ҳисоб намешавад, ва `cognitive`
             * объекти ХОЛӢ аст — вале дар JS объекти холӣ «рост» аст, аз ин рӯ
             * ҳамеша маҳз ҳамон интихоб мешуд ва дар саҳифа ягон сутун
             * намебаромад. Ҳоло саҳифа рост ҳамин майдонро мехонад.
             */
            mmtScores: mmt,
            dominantTypes: Object.entries(mmt)
                .map(([type, score]) => ({ type, score: Number(score) || 0 }))
                .sort((a: any, b: any) => Number(b.score) - Number(a.score))
                .slice(0, 3),
            report,
            topMatches: top3,
        };
    }

    async compareCarers(scores: any, careerNames: string[], lang: string = 'tj', compareQuestion?: string): Promise<any> {
        const mmt = scores?.mmtClusters || scores;
        /* Бе санҷиш «undefined» ба промпт мерафт ва модел дар бораи «профили
           холии корбар» сафсата менавишт. Набудани сатр тозатар аст. */
        const hasQuizScores = !!mmt && typeof mmt === 'object' && Object.keys(mmt).length > 0;

        // 1. Fetch careers by names
        const careers = await this.careerRepository.find({
            where: { name: In(careerNames) },
            relations: ['cluster']
        });

        const languageName = this.getLanguageName(lang);
        const languageInstructions = {
            Tajik: {
                role: 'Шумо як мушовири касбии ботаҷриба ва таҳлилгари бозори меҳнат ҳастед.',
                task: 'Муқоисаи амиқи ин ихтисосҳоро дар асоси профили MMT-и корбар ПУРРА БО ЗАБОНИ ТОҶИКӢ (бо алифбои кириллии тоҷикӣ) омода кунед. Таҳлил бояд воқеъбинона ва касбӣ бошад.',
                format: 'Ҷавобро ТАНҲО дар қолаби JSON-и зерин баргардонед (бидуни ягон матни иловагӣ ё блокҳои код):',
                customAnalysis: "Ба саволи махсуси корбар мустақим ва муфассал ҷавоб диҳед.",
                bestCareerName: "Номи беҳтарин ихтисос аз интихобшудаҳо",
                bestCareerReason: "Сабаби муфассал чаро ин ихтисос беҳтарин аст",
                careerName: "Номи ихтисоси воқеӣ",
                summary: "Шарҳи кӯтоҳ дар бораи мувофиқат ба корбар",
                pros: ["Афзалияти 1", "Афзалияти 2"],
                cons: ["Мушкилӣ ё норасоии 1", "Мушкилӣ ё норасоии 2"],
                skillsRequired: ["Маҳорат 1", "Маҳорат 2"],
                marketDemand: "high/medium/low",
                learningDifficulty: "easy/medium/hard",
                salaryRange: "Маоши тахминӣ (масалан, 3000-5000 сомонӣ)",
                fallbackBestCareerReason: 'Муқоиса дар асоси параметрҳои техникӣ.',
                fallbackSummary: 'Маълумоти муфассал ёфт нашуд.',
                fallbackUnavail: 'Таҳлили AI муваққатан дастнорас аст.',
                fallbackSalary: 'Маълум нест'
            },
            Russian: {
                role: 'Вы опытный карьерный консультант и аналитик рынка труда.',
                task: 'Подготовьте глубокое сравнение этих специальностей на основе профиля MMT пользователя ПОЛНОСТЬЮ НА РУССКОМ ЯЗЫКЕ. Анализ должен быть реалистичным и профессиональным.',
                format: 'Возвращайте ответ СТРОГО в следующем формате JSON (без какого-либо дополнительного текста или блоков кода):',
                customAnalysis: "Ответьте прямо и подробно на конкретный вопрос пользователя.",
                bestCareerName: "Название лучшей специальности из выбранных",
                bestCareerReason: "Подробная причина, почему эта специальность лучшая",
                careerName: "Название реальной специальности",
                summary: "Краткое объяснение соответствия пользователю",
                pros: ["Преимущество 1", "Преимущество 2"],
                cons: ["Сложность или недостаток 1", "Сложность или недостаток 2"],
                skillsRequired: ["Навык 1", "Навык 2"],
                marketDemand: "high/medium/low",
                learningDifficulty: "easy/medium/hard",
                salaryRange: "Ориентировочная зарплата (например, 3000-5000 сомони)",
                fallbackBestCareerReason: 'Сравнение на основе технических параметров.',
                fallbackSummary: 'Детальная информация не найдена.',
                fallbackUnavail: 'Анализ AI временно недоступен.',
                fallbackSalary: 'Неизвестно'
            },
            English: {
                role: 'You are an experienced career advisor and labor market analyst.',
                task: 'Prepare a deep comparison of these careers based on the user\'s MMT profile COMPLETELY IN ENGLISH. The analysis must be realistic and professional.',
                format: 'Return the response STRICTLY in the following JSON format (without any extra text or code blocks):',
                customAnalysis: "Answer the user\'s specific question directly and in detail.",
                bestCareerName: "Name of the best career from the selected ones",
                bestCareerReason: "Detailed reason why this career is the best choice",
                careerName: "Real career name",
                summary: "Short explanation of the fit for the user",
                pros: ["Advantage 1", "Advantage 2"],
                cons: ["Difficulty or drawback 1", "Difficulty or drawback 2"],
                skillsRequired: ["Skill 1", "Skill 2"],
                marketDemand: "high/medium/low",
                learningDifficulty: "easy/medium/hard",
                salaryRange: "Estimated salary (e.g. 3000-5000 Somoni)",
                fallbackBestCareerReason: 'Comparison based on technical parameters.',
                fallbackSummary: 'Detailed information not found.',
                fallbackUnavail: 'AI analysis is temporarily unavailable.',
                fallbackSalary: 'Unknown'
            }
        };

        const instr = languageName === 'Russian' ? languageInstructions.Russian : languageName === 'English' ? languageInstructions.English : languageInstructions.Tajik;

        if (careers.length === 0) {
            return {
                bestCareer: { name: careerNames[0], reason: instr.fallbackBestCareerReason },
                careerComparison: careerNames.map(name => ({
                    career: name,
                    matchPercentage: 50,
                    summary: instr.fallbackSummary,
                    pros: [],
                    cons: [],
                    skillsRequired: [],
                    marketDemand: 'medium',
                    learningDifficulty: 'medium',
                    salaryRange: instr.fallbackSalary
                }))
            };
        }

        let careersContext = careers.map(c => `
ID: ${c.id}
Ном: ${c.name}
Тавсиф: ${c.description || ''}
Мақсад: ${c.purpose || ''}
Кластер: ${c.cluster?.clusterName || c.mmtCluster || ''}
`).join('\n---\n');
        careersContext += `

USER'S CUSTOM COMPARISON QUESTION:
${compareQuestion?.trim() || 'No custom question. Compare broadly by fit, salary, demand, learning difficulty, pros/cons, and 10-year outlook.'}

If the user asks about jobs/places, include workplaces and university/employer context when available.
If the user asks about money, compare tuition and estimated salary clearly.
If the user asks about 10 years, compare future demand, automation risk, salary growth, and skill changes.
If the user asks for differences, give direct differences plus plus/minus for each career.
`;

        const prompt = `${instr.role}
${hasQuizScores
                ? `Натиҷаҳои санҷиши MMT-и корбар: ${JSON.stringify(mmt)}.`
                : 'Корбар ҳанӯз санҷиши ММТ-ро насупоридааст — муқоисаро аз рӯи худи ихтисосҳо ва саволи ӯ кунед, дар бораи майлу хислати ӯ тахмин назанед.'}
Ихтисосҳо барои муқоиса:
${careersContext}

ВАЗИФА: ${instr.task}

${instr.format}
{
  "customAnalysis": "${instr.customAnalysis}",
  "bestCareer": {
    "name": "${instr.bestCareerName}",
    "reason": "${instr.bestCareerReason}"
  },
  "careerComparison": [
    {
      "career": "${instr.careerName}",
      "matchPercentage": 90,
      "summary": "${instr.summary}",
      "pros": ${JSON.stringify(instr.pros)},
      "cons": ${JSON.stringify(instr.cons)},
      "skillsRequired": ${JSON.stringify(instr.skillsRequired)},
      "marketDemand": "${instr.marketDemand}",
      "learningDifficulty": "${instr.learningDifficulty}",
      "salaryRange": "${instr.salaryRange}"
    }
  ]
}
`;

        let rawResponse: string;
        try {
            rawResponse = await this.aiService.generateContent(prompt);
        } catch (error) {
            return {
                bestCareer: { name: careers[0].name, reason: instr.fallbackBestCareerReason },
                careerComparison: careers.map(c => ({
                    career: c.name,
                    matchPercentage: 70,
                    summary: c.description?.slice(0, 100) + '...',
                    pros: [],
                    cons: [],
                    skillsRequired: [],
                    marketDemand: 'medium',
                    learningDifficulty: 'medium',
                    salaryRange: instr.fallbackSalary
                }))
            };
        }

        try {
            let cleaned = rawResponse.trim();
            if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
            else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
            if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
            
            const report = JSON.parse(cleaned.trim());
            return report;
        } catch (e) {
            console.error('Failed to parse comparison AI response:', e);
            return {
                bestCareer: { name: careers[0].name, reason: instr.fallbackBestCareerReason },
                careerComparison: careers.map(c => ({
                    career: c.name,
                    matchPercentage: 75,
                    summary: instr.fallbackUnavail,
                    pros: [],
                    cons: [],
                    skillsRequired: [],
                    marketDemand: 'medium',
                    learningDifficulty: 'medium',
                    salaryRange: instr.fallbackSalary
                }))
            };
        }
    }
}
