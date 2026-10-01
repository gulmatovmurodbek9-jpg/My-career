import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, In } from 'typeorm';
import { Career } from './career.entity';
import { CareerOffering } from './career-offering.entity';
import { AdmissionScore } from './admission-score.entity';
import { Cluster } from '../cluster/cluster.entity';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { GetCareersDto } from './dto/get-careers.dto';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { User, UserRole } from '../users/user.entity';

const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 0);
const LIMIT_ON = DAILY_LIMIT > 0;


const CAREER_SYNONYMS: Record<string, string[]> = {
    юрист: ['хукук'], юристи: ['хукук'], адвокат: ['хукук'], прокурор: ['хукук'],
    судя: ['хукук'], судъя: ['хукук'], нотариус: ['хукук'], хукукшинос: ['хукук'],
    врач: ['табобат', 'тиб'], доктор: ['табобат', 'тиб'], духтур: ['табобат', 'тиб'],
    табиб: ['табобат', 'тиб'], хирург: ['чаррох', 'табобат'], педиатр: ['педиатр', 'кудакон'],
    стоматолог: ['дандон'], дантист: ['дандон'], медсестра: ['хамшира'],
    фельдшер: ['хамшира'], фармацевт: ['дорусоз'], аптекар: ['дорусоз'],
    программист: ['барнома', 'информатика'], программирование: ['барнома', 'информатика'],
    барномасоз: ['барнома'], кодер: ['барнома'], разработчик: ['барнома'],
    developer: ['барнома'], programmer: ['барнома'],
    айти: ['информатика', 'иттилоот'], it: ['информатика', 'иттилоот'],
    тестировщик: ['барнома'], дизайнер: ['дизайн'], design: ['дизайн'],
    инженер: ['мухандис'], мухандис: ['мухандис'], электрик: ['электр'],
    энергетик: ['энергетика'], строитель: ['сохтмон'], сохтмончи: ['сохтмон'],
    архитектор: ['меъмор'], механик: ['механика'], водитель: ['наклиёт'],
    экономист: ['иктисод'], бухгалтер: ['бахисобгири', 'молия'],
    мухосиб: ['бахисобгири', 'молия'], банкир: ['молия', 'бонк'],
    финансист: ['молия'], менеджер: ['менечмент', 'идора'], маркетолог: ['маркетинг'],
    предприниматель: ['соибкори', 'бизнес'], логист: ['логистика', 'наклиёт'],
    учитель: ['омузгор', 'педагогика'], омузгор: ['омузгор', 'педагогика'],
    преподаватель: ['омузгор', 'педагогика'], воспитатель: ['томактаби', 'педагогика'],
    переводчик: ['тарчум'], тарчумон: ['тарчум'], филолог: ['филология'],
    лингвист: ['забон', 'филология'],
    психолог: ['психология'], социолог: ['сотсиология', 'чомеашиноси'],
    журналист: ['журналистика'], дипломат: ['байналмилали', 'муносибат'],
    политолог: ['сиёсатшиноси'], историк: ['таърих'],
    повар: ['хурок', 'технологияи хурок'], агроном: ['агроном', 'кишоварзи'],
    ветеринар: ['ветеринар'], эколог: ['экология'], геолог: ['геология'],
    химик: ['химия'], биолог: ['биология'], физик: ['физика'], математик: ['математика'],
    спортсмен: ['варзиш'], тренер: ['варзиш'], артист: ['санъат'], музыкант: ['мусики'],
    художник: ['наккоши', 'санъат'], актер: ['санъат'], режиссер: ['санъат'],
    военный: ['харби'], полицейский: ['хукук', 'харби'],
    учител: ['омузгор', 'педагогика'], преподавател: ['омузгор', 'педагогика'],
    воспитател: ['томактаби', 'педагогика'], строител: ['сохтмон'],
    водител: ['наклиёт'], предпринимател: ['соибкори', 'бизнес'],
    учитил: ['омузгор', 'педагогика'],
};

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

// Ҳарфҳои тоҷикӣ (ғ ӣ қ ӯ ҳ ҷ) ба шакли оддӣ оварда мешаванд, то «хукук» ҳам «ҳуқуқ»-ро ёбад.
const NTC_SOURCE = { name: 'Маркази миллии тестӣ', url: 'https://stat.ntc.tj/' };

const TAJIK_FOLD = (column: string): string =>
    `translate(lower(${column}), 'ғӣқӯҳҷҒӢҚӮҲҶ', 'гикухчгикухч')`;

@Injectable()
export class CareerService {
    private static readonly MMT_MAX_SCORE = 40;

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
        @InjectRepository(AdmissionScore)
        private admissionRepository: Repository<AdmissionScore>,
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
            qb.andWhere(
                `(${TAJIK_FOLD('career.name')} LIKE :search
                  OR ${TAJIK_FOLD('career.description')} LIKE :search
                  OR career.code LIKE :rawSearch)`,
                { search: `%${foldTajik(search)}%`, rawSearch: `%${search}%` },
            );
        }

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

        const exactNames = (query.names || []).map((name) => String(name).trim()).filter(Boolean);
        if (exactNames.length) {
            qb.andWhere('career.name IN (:...exactNames)', { exactNames });
        }

        if (clusterId) {
            qb.andWhere('career.clusterId = :clusterId', { clusterId });
        }

        if (query.code) {
            qb.andWhere('career.code = :code', { code: query.code });
        }

        if (query.minPrice) {
            qb.andWhere('career.tuitionFee >= :minPrice', { minPrice: query.minPrice });
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



    localize<T extends Partial<Career>>(career: T, lang?: string): T {
        if (!career || !lang || lang === 'tj') return career;

        const tr = (career as any).translations?.[lang];
        if (!tr) return career;

        const out: any = { ...career };
        for (const [key, value] of Object.entries(tr)) {
            if (value === null || value === undefined || value === '') continue;
            if (key.startsWith('_')) continue;
            if (key === 'name') { out.nameTranslated = value; continue; }
            if (key === 'code') continue;
            out[key] = value;
        }

        delete out.translations;
        return out as T;
    }


    // AI танҳо саволро ба филтр табдил медиҳад; худи рӯйхат ҳамеша аз база меояд.
    async aiSearch(
        rawQuery: string,
        lang = 'tj',
        page = 1,
        limit = 12,
    ): Promise<{ data: Career[]; meta: any; filters: any; understood: boolean; question: string | null; options: any[]; answerLang: string }> {
        const question = (rawQuery || '').trim().slice(0, 300);
        let answerLang = ['tj', 'ru', 'en'].includes(lang) ? lang : 'tj';

        const toDto = (filters: any, p = page, l = limit) => ({
            page: p,
            limit: l,
            ...(filters.search ? { search: filters.search } : {}),
            ...(filters.searchAny?.length ? { searchAny: filters.searchAny } : {}),
            ...(filters.names?.length ? { names: filters.names } : {}),
            ...(filters.clusterId ? { clusterId: filters.clusterId } : {}),
            ...(filters.maxPrice ? { maxPrice: filters.maxPrice } : {}),
            ...(filters.city ? { city: filters.city } : {}),
            ...(filters.onlyFree ? { freeSeatsOnly: 'true' } : {}),
        }) as GetCareersDto;

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
            const finalOptions = !result.meta.total && !options.length ? await clusterFallback() : options;
            return { ...result, filters, understood, question: ask, options: finalOptions, answerLang };
        };

        if (!question) return finish(false, {});

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
            '- "keywords": 1–3 реша, ки ТАНҲО ҲАМОН КАСБРО ифода мекунанд.',
            '  Соҳаи умумиро ИЛОВА НАКУН. Реша кӯтоҳ бошад, то шаклҳои гуногунро',
            '  ёбад: «стоматолог», на «стоматологӣ». Намунаҳо:',
            '  «духтури дандон», «стоматолог», «дантист» → ["стоматолог", "дандон"]',
            '  «барномасоз», «программист» → ["барномасоз", "барномав", "информатика"]',
            '  «юрист», «ҳуқуқшинос» → ["ҳуқуқ"]',
            '  «муҳандис», «инженер» → ["муҳандис"]',
            '  «духтур», «врач» (бе касби мушаххас) → ["табобат", "педиатр", "стоматолог"]',
            '- Барои духтури ОДАМ калимаи «тиб»-ро НАГУЗОР: вай «Тибби байторӣ»',
            '  (ветеринария)-ро низ меёбад.',
            '- Агар касб тахассуси танг бошад — уролог, кардиолог, ҷарроҳ, невролог,',
            '  окулист — калимаи худи ҳамон касбро гузор: ["уролог"]. Сервер роҳи',
            '  воқеиро худаш меёбад.',
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
            return finish(false, { search: question });
        }

        if (typeof parsed?.lang === 'string') {
            const said = parsed.lang.trim().toLowerCase();
            if (said === 'tj' || said === 'ru' || said === 'en') answerLang = said;
        }

        const filters: any = {};

        const rawKeywords: unknown[] = Array.isArray(parsed?.keywords)
            ? parsed.keywords
            : typeof parsed?.search === 'string' ? [parsed.search] : [];
        const keywords = [...new Set(
            rawKeywords
                .filter((k): k is string => typeof k === 'string')
                .map((k) => k.trim().slice(0, 40))
                .filter((k) => k.length >= 3),
        )]
            .filter((k, index) => index === 0 || !CareerService.BROAD_STEMS.has(foldTajik(k)))
            .slice(0, 3);

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
                const path = await this.findCareerPath(question, keywords, filters.clusterId, answerLang, readJson);
                if (path) {
                    filters.names = path.names;
                    filters.note = path.note;
                } else {
                    filters.search = keywords[keywords.length - 1];
                }
            }
        }

        if (!Object.keys(filters).length) return finish(false, { search: question });

        const broad = await this.findAll(toDto(filters, 1, 24));

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
            return finish(true, filters);
        }

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

            const optionFilters: any = { ...filters, search: keyword };
            delete optionFilters.keywords;
            delete optionFilters.note;
            const check = await this.findAll(toDto(optionFilters, 1, 1));
            if (!check.meta.total || check.meta.total >= broad.meta.total) continue;

            options.push({ label, hint, count: check.meta.total, filters: optionFilters });
            if (options.length >= 5) break;
        }

        const ask =
            options.length >= 2 && typeof grouped?.question === 'string'
                ? grouped.question.trim().slice(0, 160)
                : null;

        return finish(true, filters, ask ? options : [], ask);
    }

    private async findCareerPath(
        question: string,
        keywords: string[],
        clusterId: string | undefined,
        answerLang: string,
        readJson: (raw: string) => any,
    ): Promise<{ names: string[]; note: string } | null> {
        const candidates = new Set<string>();

        if (clusterId) {
            const rows: Array<{ name: string }> = await this.careerRepository.manager.query(
                'SELECT DISTINCT name FROM career WHERE "clusterId" = $1 ORDER BY name',
                [clusterId],
            );
            rows.forEach((row) => row.name && candidates.add(row.name));
        }

        const patterns = keywords.map((k) => `%${foldTajik(k)}%`);
        if (patterns.length) {
            const rows: Array<{ name: string }> = await this.careerRepository.manager.query(
                `SELECT DISTINCT name FROM career
                 WHERE ${TAJIK_FOLD('name')} LIKE ANY($1) OR ${TAJIK_FOLD('coalesce(description, \'\')')} LIKE ANY($1)
                 LIMIT 60`,
                [patterns],
            );
            rows.forEach((row) => row.name && candidates.add(row.name));
        }

        const list = [...candidates].slice(0, 120);
        if (!list.length) return null;

        const langName = answerLang === 'ru' ? 'русӣ' : answerLang === 'en' ? 'англисӣ' : 'тоҷикӣ';
        const prompt = [
            'Корбар чунин навишт:',
            question,
            '',
            'Ин касб дар рӯйхати ихтисосҳои Маркази миллии тестӣ бо номи худ нест.',
            'Аз рӯйхати зер ихтисосҳоеро интихоб кун, ки барои расидан ба ҳамин касб',
            'дар донишгоҳ ё коллеҷ хонда мешаванд.',
            '',
            'РӮЙХАТИ ИХТИСОСҲОИ РАСМӢ:',
            ...list.map((name) => '- ' + name),
            '',
            'ФОРМАТИ ҶАВОБ — танҳо JSON:',
            '{"names": ["номи айнан аз рӯйхат"], "note": "шарҳи кӯтоҳ"}',
            '',
            'ҚОИДАҲО:',
            '- "names": 1–2 ном, ҲАРФ БА ҲАРФ аз рӯйхати боло. Номи нав НАСОЗ.',
            '- Танҳо ихтисосе, ки хатмкунандааш ВОҚЕАН ҳамин касбро гирифта метавонад.',
            '  Ихтисосҳои ёрирасон — лаборатория, биохимия, техника ва таҷҳизот — роҳ',
            '  ба духтур нестанд ва интихоб НАШАВАНД.',
            '- Агар дар рӯйхат роҳи мувофиқ набошад, "names": [] гузор.',
            `- "note" бо забони ${langName}, ЯК ҷумла то 25 калима: чаро ин касб алоҳида`,
            '  нест ва роҳ ба он чӣ гуна аст. Масалан: «Урология ихтисоси алоҳидаи ММТ',
            '  нест — аввал „Кори табобатӣ“ мехонед, баъд дар ординатура урологияро',
            '  интихоб мекунед.»',
            '- Рақам, маош ё номи донишгоҳ НАСОЗ.',
        ].join('\n');

        let parsed: any;
        try {
            parsed = readJson(await this.aiService.generateContent(prompt));
        } catch {
            return null;
        }

        const byFolded = new Map(list.map((name) => [foldTajik(name.trim()), name]));
        const names: string[] = (Array.isArray(parsed?.names) ? parsed.names : [])
            .filter((name: unknown): name is string => typeof name === 'string')
            .map((name) => byFolded.get(foldTajik(name.trim())))
            .filter((name): name is string => Boolean(name))
            .slice(0, 2);

        if (!names.length) return null;

        const note = typeof parsed?.note === 'string' ? parsed.note.trim().slice(0, 240) : '';
        return { names: Array.from(new Set<string>(names)), note };
    }

    private static readonly BROAD_STEMS = new Set(
        ['тиб', 'табобат', 'муҳандис', 'иқтисод', 'омӯзгор', 'педагог', 'техник', 'технолог', 'биолог', 'санъат', 'илм']
            .map((word) => foldTajik(word)),
    );

    private static readonly ASSISTANT_ACTIONS = [
        'search', 'open_career', 'compare', 'save_career',
        'start_quiz', 'open_universities', 'nearest_universities', 'open_cluster',
        'open_report', 'open_plan', 'open_chat', 'open_favorites', 'open_about',
        'go_home', 'set_language', 'set_theme', 'answer', 'choose_direction',
    ];

    // «Духтур шудан мехоҳам» — дар номи ихтисосҳо калимаи «духтур» нест,
    // пас барои касбҳои маъмул самтҳоро дастӣ медиҳем. Барои дигар касбҳо
    // рӯйхат аз ҷустуҷӯи база сохта мешавад.
    private static readonly DIRECTIONS: Array<{ roles: string[]; say: string; sayRu?: string; sayEn?: string; options: Array<{ label: string; name: string; ru?: string; en?: string }> }> = [
        {
            roles: ['духтур', 'табиб', 'доктор', 'врач', 'пизишк', 'doctor', 'physician', 'medic'],
            say: 'духтур', sayRu: 'врачом', sayEn: 'a doctor',
            options: [
                { label: 'Табиби умумӣ', name: 'Кори табобатӣ', ru: 'Врач общей практики', en: 'General doctor' },
                { label: 'Духтури кӯдакон', name: 'Педиатрия', ru: 'Детский врач', en: 'Pediatrician' },
                { label: 'Духтури дандон', name: 'Стоматология', ru: 'Стоматолог', en: 'Dentist' },
                { label: 'Дорусоз', name: 'Химия. Дорусозӣ', ru: 'Фармацевт', en: 'Pharmacist' },
                { label: 'Ҳамшираи шафқат', name: 'Кори ҳамширагӣ', ru: 'Медсестра', en: 'Nurse' },
            ],
        },
        {
            roles: ['хукукшинос', 'адвокат', 'юрист', 'прокурор', 'судя', 'lawyer', 'attorney', 'judge'],
            say: 'ҳуқуқшинос', sayRu: 'юристом', sayEn: 'a lawyer',
            options: [
                { label: 'Ҳимояи ҳуқуқ', name: 'Фаъолияти ҳифзи ҳуқуқ', ru: 'Правоохранительная деятельность', en: 'Law enforcement' },
                { label: 'Суд, прокуратура ва тафтишот', name: 'Фаъолияти судӣ-прокурорӣ-муфаттишӣ', ru: 'Суд, прокуратура и следствие', en: 'Court, prosecution and investigation' },
                { label: 'Ҳуқуқи байналмилалӣ', name: 'Ҳуқуқи байналмилалӣ', ru: 'Международное право', en: 'International law' },
                { label: 'Ҳуқуқи иқтисодӣ', name: 'Ҳуқуқи иқтисодӣ', ru: 'Экономическое право', en: 'Economic law' },
                { label: 'Ҳуқуқи гумрукӣ', name: 'Ҳуқуқи гумрукӣ', ru: 'Таможенное право', en: 'Customs law' },
            ],
        },
        {
            roles: ['барномасоз', 'программист', 'разработчик', 'айти', 'programmer', 'developer', 'coder', 'software'],
            say: 'барномасоз', sayRu: 'программистом', sayEn: 'a programmer',
            options: [
                { label: 'Муҳандисии барномавӣ', name: 'Муҳандисии барномавӣ', ru: 'Программная инженерия', en: 'Software engineering' },
                { label: 'Амнияти киберӣ', name: 'Амнияти киберӣ', ru: 'Кибербезопасность', en: 'Cyber security' },
                { label: 'Веб-дизайн', name: 'WEB-дизайн ва графикаи компютерӣ', ru: 'Веб-дизайн', en: 'Web design' },
                { label: 'Информатика', name: 'Информатика', ru: 'Информатика', en: 'Computer science' },
            ],
        },
        {
            roles: ['муаллим', 'омузгор', 'учител', 'педагог', 'teacher'],
            say: 'омӯзгор', sayRu: 'учителем', sayEn: 'a teacher',
            options: [
                { label: 'Омӯзгори синфҳои ибтидоӣ', name: 'Таҳсилоти ибтидоӣ', ru: 'Учитель начальных классов', en: 'Primary school teacher' },
                { label: 'Тарбиячии боғча', name: 'Таҳсилоти томактабӣ', ru: 'Воспитатель детского сада', en: 'Kindergarten teacher' },
                { label: 'Забон ва адабиёти тоҷик', name: 'Забон ва адабиёти тоҷик', ru: 'Таджикский язык и литература', en: 'Tajik language and literature' },
                { label: 'Математика', name: 'Математика', ru: 'Математика', en: 'Mathematics' },
            ],
        },
    ];

    // Калимаҳое, ки ҷузъи номи касб нестанд: «ман мехоҳам ки … шавам».
    private static readonly ROLE_STOPWORDS = new Set([
        'ман', 'мехохам', 'мехохем', 'ки', 'ба', 'хам', 'бояд', 'орзу', 'орзуи', 'дорам', 'як', 'хуб', 'дар', 'оянда',
        'a', 'an', 'the', 'good', 'хорошим',
    ]);

    // «Духтур шудан мехоҳам», «мехоҳам барномасоз шавам», «хочу стать врачом».
    private detectRole(message: string): string | null {
        const text = foldTajik(message).replace(/[^a-zа-яё0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
        const words = text.split(' ');
        // Шинохти нутқ феълро вайрон мекунад: «шуланд», «шутан», «мешавам».
        let verb = words.findIndex((word, index) => /^(шу[длт]ан|(ме)?шав[аеи]м|стать)/.test(word)
            || word === 'become' || (word === 'be' && words[index - 1] === 'to'));
        // «Нан духтур … мехоҳам» — феъл гум шуд, вале касби маълум ва «мехоҳам» ҳаст.
        if (verb < 0 && words.includes('мехохам')) {
            const known = words.findIndex((word) =>
                CareerService.DIRECTIONS.some((entry) => entry.roles.some((stem) => word.startsWith(stem))));
            if (known >= 0) verb = known + 1;
        }
        if (verb < 0) return null;
        const after = ['стать', 'become', 'be'].includes(words[verb]);
        const around = after ? words.slice(verb + 1, verb + 3) : words.slice(Math.max(0, verb - 2), verb);
        // Ҳамон калимаҳоро аз матни аслӣ мегирем, то ёвар «ҳуқуқшинос» гӯяд, на «хукукшинос».
        const original = message.toLowerCase().replace(/[^a-zа-яёғӣқӯҳҷ0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim().split(' ');
        const start = after ? verb + 1 : Math.max(0, verb - 2);
        const role = around
            .map((word, index) => [word, original[start + index] || word])
            .filter(([word]) => !CareerService.ROLE_STOPWORDS.has(word))
            .map(([, spoken]) => spoken)
            .join(' ')
            .trim();
        return role.length >= 3 ? role : null;
    }

    // Самтҳо барои касби гуфташуда: аввал рӯйхати дастӣ, баъд база.
    private async directionsFor(role: string, lang = 'tj'): Promise<{ say: string; options: Array<{ id: string; name: string; label: string }> }> {
        const words = foldTajik(role).split(' ');
        const curated = CareerService.DIRECTIONS.find((entry) =>
            entry.roles.some((stem) => words.some((word) => word.startsWith(stem))));

        if (curated) {
            // Як ном чанд сатр дорад (коллеҷ, бакалавр) — онеро мегирем,
            // ки донишгоҳҳояш бештар аст.
            const rows: Array<{ id: string; name: string }> = await this.careerRepository.manager.query(
                `SELECT DISTINCT ON (c.name) c.id, c.name
                 FROM career c LEFT JOIN career_universities cu ON cu."careerId" = c.id
                 WHERE c.name = ANY($1)
                 GROUP BY c.id, c.name
                 ORDER BY c.name, count(cu."universitiesId") DESC`,
                [curated.options.map((option) => option.name)],
            );
            const options = curated.options
                .map((option) => {
                    const row = rows.find((item) => item.name === option.name);
                    const label = (lang === 'ru' && option.ru) || (lang === 'en' && option.en) || option.label;
                    return row ? { id: row.id, name: row.name, label } : null;
                })
                .filter((option): option is { id: string; name: string; label: string } => !!option);
            const say = (lang === 'ru' && curated.sayRu) || (lang === 'en' && curated.sayEn) || curated.say;
            if (options.length) return { say, options };
        }

        const found = await this.findRelevantCareers(role);
        if ((found as any).isFallback) return { say: role, options: [] };
        const seen = new Set<string>();
        const options = found
            .filter((career) => !seen.has(career.name) && seen.add(career.name))
            .slice(0, 5)
            // «(ФММТДМТБваДТТ)» — аббревиатураи дохилӣ, барои гуфтан нест.
            .map((career) => ({ id: career.id, name: career.name, label: career.name.replace(/\s*\([^)]*\)/g, '').trim() }));
        return { say: role, options };
    }

    // Корбар аз рӯйхати пешниҳодшуда интихоб мекунад: «дуюмаш», «охиринаш»,
    // «духтури дандон» ё «стоматология». Агар ба ҳеҷ кадом монанд набошад — null.
    private pickOption(message: string, options: Array<{ id: string; name: string; label?: string }>) {
        const text = foldTajik(message).replace(/[^a-zа-яё0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
        if (!text || !options.length) return null;

        const ORDINALS: Array<[RegExp, number]> = [
            [/(^| )(якум|аввал|1)/, 0], [/(^| )(дуюм|дуввум|2)/, 1], [/(^| )(сеюм|севвум|3)/, 2],
            [/(^| )(чорум|4)/, 3], [/(^| )(панчум|5)/, 4],
        ];
        for (const [pattern, index] of ORDINALS) {
            if (pattern.test(text) && options[index]) return options[index];
        }
        if (/(^| )охирин/.test(text)) return options[options.length - 1];

        // Калимаҳои умумӣ («кори», «духтури») ба якчанд самт мувофиқанд — онҳоро намешуморем.
        const common = new Set(['кори', 'мехохам', 'ихтисос', 'ихтисоси', 'хамон', 'хамин', 'кушо']);
        const ownWords = options.map((option) =>
            foldTajik(`${option.label || ''} ${option.name}`).split(/[^a-zа-яё0-9]+/i).filter((word) => word.length >= 4));
        // Шинохти нутқ ҳарфҳоро иваз мекунад («дандон» → «дамдор»): то 2 ҳарф фарқ мебахшем.
        const distance = (a: string, b: string) => {
            const row = Array.from({ length: b.length + 1 }, (_, index) => index);
            for (let i = 1; i <= a.length; i += 1) {
                let previous = row[0];
                row[0] = i;
                for (let j = 1; j <= b.length; j += 1) {
                    const saved = row[j];
                    row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
                    previous = saved;
                }
            }
            return row[b.length];
        };
        const matches = (own: string[], word: string) => own.some((item) =>
            item.slice(0, 5) === word.slice(0, 5)
            || (word.length >= 5 && distance(word.slice(0, 7), item.slice(0, 7)) <= 2));
        // Калимае, ки дар ду самт ҳаст («духтур» дар «духтури кӯдакон» ва «духтури
        // дандон»), интихоб нест: «духтур шудан мехоҳам»-и такрорӣ Педиатрияро мекушод.
        const said = text.split(' ').filter((word) =>
            word.length >= 4 && !common.has(word) && ownWords.filter((own) => matches(own, word)).length === 1);
        let best: { option: (typeof options)[number]; score: number } | null = null;
        for (const [index, option] of options.entries()) {
            const score = said.filter((word) => matches(ownWords[index], word)).length;
            if (score > 0 && (!best || score > best.score)) best = { option, score };
        }
        return best?.option || null;
    }

    // Ҷавоби собит барои ҳар амал: ҳамеша якхела — яъне садояш як бор сохта
    // мешавад ва баъд аз кеш меояд. AI танҳо барои сӯҳбати озод ҷавоб менависад.
    private static readonly ASSISTANT_REPLIES: Record<string, Record<string, string>> = {
        tj: {
            search: 'Ана ин ихтисосҳо.',
            open_career: 'Кушодам.',
            compare: 'Муқоиса тайёр аст.',
            save_career: 'Захира шуд.',
            start_quiz: 'Санҷишро сар мекунам.',
            open_universities: 'Ана донишгоҳҳо.',
            open_report: 'Ҳисоботи шуморо кушодам.',
            open_plan: 'Ана нақшаи ҳуҷҷатсупорӣ.',
            nearest_universities: 'Донишгоҳҳои наздиктаринро меҷӯям.',
            open_cluster: 'Ана ин кластер.',
            open_chat: 'Чатро кушодам.',
            open_favorites: 'Ана захираҳои шумо.',
            open_about: 'Дар бораи мо.',
            go_home: 'Ба саҳифаи асосӣ.',
            set_language: 'Забон иваз шуд.',
            set_theme: 'Мавзӯъ иваз шуд.',
        },
        ru: {
            search: 'Вот эти специальности.',
            open_career: 'Открыл.',
            compare: 'Сравнение готово.',
            save_career: 'Сохранено.',
            start_quiz: 'Начинаю тест.',
            open_universities: 'Вот университеты.',
            open_report: 'Открыл ваш отчёт.',
            open_plan: 'Вот план подачи документов.',
            nearest_universities: 'Ищу ближайшие университеты.',
            open_cluster: 'Вот этот кластер.',
            open_chat: 'Открыл чат.',
            open_favorites: 'Вот ваши сохранённые.',
            open_about: 'О нас.',
            go_home: 'На главную.',
            set_language: 'Язык изменён.',
            set_theme: 'Тема изменена.',
        },
        en: {
            search: 'Here are the specialties.',
            open_career: 'Opened.',
            compare: 'The comparison is ready.',
            save_career: 'Saved.',
            start_quiz: 'Starting the test.',
            open_universities: 'Here are the universities.',
            open_report: 'I opened your report.',
            open_plan: 'Here is the application plan.',
            nearest_universities: 'Looking for the nearest universities.',
            open_cluster: 'Here is that cluster.',
            open_chat: 'Chat opened.',
            open_favorites: 'Here are your saved items.',
            open_about: 'About us.',
            go_home: 'Going home.',
            set_language: 'Language changed.',
            set_theme: 'Theme changed.',
        },
    };

    // Фармонҳои маъмулӣ AI-ро лозим надоранд: «санҷишро сар кун» ҳамеша
    // як маъно дорад. Инҳоро дар як миллисония мешиносем; танҳо чизҳои
    // номаълум ва номҳо (ихтисос, донишгоҳ) ба AI мераванд.
    private quickRoute(message: string, lang = 'tj'): { action: string; params: any; reply?: string } | null {
        const text = foldTajik(message)
            .replace(/[^a-zа-яё0-9\s]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!text) return null;
        const has = (...words: string[]) => words.some((word) => text.includes(word));

        const words0 = text.split(' ');
        // Англисӣ ва русӣ: фармонҳои маъмул бе AI — тез ва бехато.
        const IDENTITY: Record<string, string> = {
            tj: 'Ман ёвари овозии «Ихтисоси ман» ҳастам. Ихтисос меёбам, донишгоҳҳоро нишон медиҳам ва санҷиш мегузаронам.',
            ru: 'Я голосовой помощник «Моя специальность». Нахожу специальности, показываю университеты и провожу тест.',
            en: 'I am the voice assistant of My Career. I find specialties, show universities and run the career test.',
        };
        const GREET: Record<string, string> = {
            tj: 'Салом! Ихтисос интихоб кунем, донишгоҳҳоро бинем ё санҷиш гузарем?',
            ru: 'Здравствуйте! Выберем специальность, посмотрим университеты или пройдём тест?',
            en: 'Hello! Shall we choose a specialty, look at universities or take the test?',
        };
        if (has('who are you', 'what can you do', 'кто ты', 'кто вы', 'что ты умеешь', 'что вы умеете', 'ту киста', 'ту кисти', 'шумо киста', 'шумо кисти', 'чи кор карда метавони', 'чи кор карда метавонед')) {
            return { action: 'answer', params: {}, reply: IDENTITY[lang] || IDENTITY.tj };
        }
        if (words0.length <= 3 && has('салом', 'ассалом', 'хуш омадед', 'hello', 'привет', 'здравствуй')) {
            return { action: 'answer', params: {}, reply: GREET[lang] || GREET.tj };
        }
        if (words0.length <= 5) {
            if (has('report', 'отчет', 'отчёт')) return { action: 'open_report', params: {} };
            if (has('application plan', 'my plan', 'план подачи', 'план документ')) return { action: 'open_plan', params: {} };
            if (has('saved', 'favorites', 'favourites', 'сохранен', 'сохранён', 'избран')) return { action: 'open_favorites', params: {} };
            if (has('dark theme', 'dark mode', 'темн', 'тёмн')) return { action: 'set_theme', params: { theme: 'dark' } };
            if (has('light theme', 'light mode', 'светл')) return { action: 'set_theme', params: { theme: 'light' } };
            if (has('home page', 'go home', 'главн')) return { action: 'go_home', params: {} };
            if (/(^| )(chat|чат)( |$)/.test(text)) return { action: 'open_chat', params: {} };
            if (has('free', 'бесплат', 'бюджет')) return { action: 'search', params: { query: 'ихтисосҳои ройгон', trusted: true } };
            if (has('nearest', 'closest', 'near me', 'ближайш', 'рядом')) return { action: 'nearest_universities', params: {} };
            if ((has('test', 'quiz', 'тест') && has('start', 'take', 'begin', 'нач', 'пройд', 'пройти'))) return { action: 'start_quiz', params: {} };
        }

        const cluster = text.match(/(?:кластер|cluster)\S*\s*(\d)/);
        if (cluster) return { action: 'open_cluster', params: { number: Number(cluster[1]) } };

        if (has('наздиктарин', 'наздик') && has('донишгох')) {
            return { action: 'nearest_universities', params: {} };
        }
        if (has('санчиш', 'тест') && has('сар', 'огоз', 'гузар', 'кушо', 'мехохам', 'супор')) {
            return { action: 'start_quiz', params: {} };
        }
        if (has('хисобот')) return { action: 'open_report', params: {} };
        if (has('хуччат', 'накшаи хуччат')) return { action: 'open_plan', params: {} };
        if (has('захирахо', 'дустдошта')) return { action: 'open_favorites', params: {} };
        if (/(^| )чат( |$)/.test(text)) return { action: 'open_chat', params: {} };
        if (has('сахифаи асоси', 'ба асоси')) return { action: 'go_home', params: {} };
        if (has('дар бораи мо', 'дар бораи лоиха')) return { action: 'open_about', params: {} };
        if (has('торик')) return { action: 'set_theme', params: { theme: 'dark' } };
        if (has('равшан', 'рушан')) return { action: 'set_theme', params: { theme: 'light' } };

        if (has('забон')) {
            if (has('руси')) return { action: 'set_language', params: { lang: 'ru' } };
            if (has('англиси')) return { action: 'set_language', params: { lang: 'en' } };
            if (has('точики')) return { action: 'set_language', params: { lang: 'tj' } };
        }

        // «Ихтисос интихоб кунам», «намедонам ба куҷо дароям» — худи ҳамин
        // санҷиш барои интихоб сохта шудааст. Пурсидани «кадомашро?» бефоида
        // аст: одам маҳз барои он омадааст, ки намедонад.
        if (has('ихтисос интихоб', 'касб интихоб', 'интихоби ихтисос', 'интихоби касб', 'намедонам', 'барои ман хуб', 'ба ман мувофик', 'ба кучо дароям', 'кумак кун')) {
            return { action: 'start_quiz', params: {} };
        }

        // «Дар бораи ихтисосҳо», «ҳамаи ихтисосҳо» — ҳамаашро нишон медиҳем.
        if (has('дар бораи ихтисос', 'хамаи ихтисос', 'руйхати ихтисос')) {
            return { action: 'search', params: { query: '' } };
        }

        // Ройгон ва пулакӣ — ҷустуҷӯи AI-и саҳифа инро ба филтр табдил медиҳад.
        if (has('ройгон', 'бепул', 'грант') && text.split(' ').length <= 4) {
            return { action: 'search', params: { query: 'ихтисосҳои ройгон', trusted: true } };
        }

        // «Ман дар Кӯлоб зиндагӣ мекунам» — донишгоҳҳои ҳамон шаҳрро нишон медиҳем.
        const CITIES: Array<[string, string]> = [
            ['душанбе', 'Душанбе'], ['хучанд', 'Хуҷанд'], ['бохтар', 'Бохтар'],
            ['кулоб', 'Кӯлоб'], ['хоруг', 'Хоруғ'], ['истаравшан', 'Истаравшан'],
            ['панчакент', 'Панҷакент'], ['вахдат', 'Ваҳдат'], ['турсунзода', 'Турсунзода'],
            ['хисор', 'Ҳисор'], ['исфара', 'Исфара'], ['дангара', 'Данғара'],
            ['конибодом', 'Конибодом'],
        ];
        if (has('зиндаги', 'хастам', 'мебошам', 'истикомат')) {
            const city = CITIES.find(([folded]) => text.includes(folded));
            if (city) return { action: 'open_universities', params: { city: city[1] } };
        }

        // «Донишгоҳҳоро нишон деҳ» (ҷамъ) — рӯйхат. «Донишгоҳи миллӣ» (як ном)
        // ба AI меравад, чунки номро шинохтан лозим аст.
        if (has('донишгоххо')) {
            const city = CITIES.find(([folded]) => text.includes(folded));
            return { action: 'open_universities', params: city ? { city: city[1] } : {} };
        }

        // Салом, раҳмат ва «ту кистӣ» — ҷавоби тайёр, бе AI.
        // «Салом» аввалин калимаи ҳар сӯҳбат аст ва пештар то 8 сония мегирифт.
        const words = text.split(' ');
        if (words.length <= 3 && has('рахмат', 'ташаккур')) {
            return { action: 'answer', params: {}, reply: 'Марҳамат! Боз чӣ кӯмак кунам?' };
        }

        return null;
    }

    // «Худжанд», «Khujand» → «Хуҷанд»: дар база номҳо тоҷикӣ ҳастанд.
    private static readonly CITY_NAMES: Array<[string, string[]]> = [
        ['Душанбе', ['dushanbe', 'душанбе']], ['Хуҷанд', ['khujand', 'khudzhand', 'худжанд', 'хучанд']],
        ['Бохтар', ['bokhtar', 'bohtar', 'бохтар']], ['Кӯлоб', ['kulob', 'kulyab', 'куляб', 'кулоб']],
        ['Хоруғ', ['khorog', 'khorugh', 'хорог', 'хоруг']], ['Истаравшан', ['istaravshan', 'истаравшан']],
        ['Панҷакент', ['panjakent', 'penjikent', 'пенджикент', 'панчакент']], ['Ваҳдат', ['vahdat', 'вахдат']],
        ['Турсунзода', ['tursunzoda', 'tursunzade', 'турсунзаде', 'турсунзода']], ['Ҳисор', ['hisor', 'hissar', 'гиссар', 'хисор']],
        ['Исфара', ['isfara', 'исфара']], ['Данғара', ['dangara', 'дангара']], ['Конибодом', ['konibodom', 'kanibadam', 'канибадам', 'конибодом']],
        ['Роғун', ['rogun', 'рогун']], ['Норак', ['norak', 'nurek', 'нурек', 'норак']],
    ];

    static cityToTajik(raw: string): string {
        const folded = foldTajik(raw).toLowerCase();
        if (!folded) return '';
        const hit = CareerService.CITY_NAMES.find(([, aliases]) => aliases.some((alias) => folded.includes(alias.slice(0, Math.max(5, alias.length - 2)))));
        return hit ? hit[0] : raw;
    }

    private clusterCache: Cluster[] | null = null;

    private async loadClusters(): Promise<Cluster[]> {
        if (this.clusterCache) return this.clusterCache;
        try {
            this.clusterCache = await this.clusterRepository.find({ order: { clusterId: 'ASC' } });
        } catch {
            this.clusterCache = [];
        }
        return this.clusterCache;
    }

    private async resolveCareer(name?: string): Promise<Career | null> {
        const wanted = String(name || '').trim();
        if (wanted.length < 3) return null;

        // Касби умумӣ («духтур») — самти асосии он, на номи тасодуфии монанд.
        const roleWords = foldTajik(wanted).split(/[^a-zа-яё0-9]+/i);
        const curated = CareerService.DIRECTIONS.find((entry) =>
            entry.roles.some((stem) => roleWords.some((word) => word.startsWith(stem))));
        if (curated && roleWords.filter(Boolean).length <= 2) {
            const main = await this.careerRepository.findOne({ where: { name: curated.options[0].name } });
            if (main) return main;
        }

        // 1) Номи рост: ҳамон калима дар номи ихтисос ҳаст.
        const exact: Career[] = await this.careerRepository
            .createQueryBuilder('career')
            .where(`${TAJIK_FOLD('career.name')} LIKE :name`, { name: `%${foldTajik(wanted)}%` })
            .orderBy('length(career.name)', 'ASC')
            .limit(1)
            .getMany();
        if (exact[0]) return exact[0];

        // 2) «иқтисодчӣ» → «Иқтисодиёт»: решаи калимаи дарозтаринро меҷӯем.
        const stem = foldTajik(wanted)
            .split(/[^a-zа-яё0-9]+/i)
            .filter((word) => word.length >= 6)
            .sort((a, b) => b.length - a.length)[0]
            ?.slice(0, 7);
        if (stem) {
            const rows: Array<{ id: string }> = await this.careerRepository.manager.query(
                `SELECT id FROM career
                 WHERE ${TAJIK_FOLD('name')} LIKE $1
                 ORDER BY (CASE WHEN ${TAJIK_FOLD('name')} LIKE $2 THEN 0 ELSE 1 END), length(name)
                 LIMIT 1`,
                [`%${stem}%`, `${stem}%`],
            );
            if (rows[0]) {
                const found = await this.careerRepository.findOne({ where: { id: rows[0].id } });
                if (found) return found;
            }
        }

        // 3) Хатои имлоӣ: шабоҳати се-ҳарфӣ. 0.25 — ҳадди поёнӣ,
        // аз он камтар тасодуфӣ мешавад («донишгох» → 0.12).
        const fuzzy: Array<{ id: string; sim: number }> = await this.careerRepository.manager.query(
            `SELECT id, similarity(${TAJIK_FOLD('name')}, $1) AS sim
             FROM career
             WHERE similarity(${TAJIK_FOLD('name')}, $1) > 0.25
             ORDER BY ${TAJIK_FOLD('name')} <-> $1
             LIMIT 1`,
            [foldTajik(wanted)],
        );
        if (fuzzy[0]) {
            const found = await this.careerRepository.findOne({ where: { id: fuzzy[0].id } });
            if (found) return found;
        }

        // 4) Роҳи охирин: ҳамон ранкинги ҷустуҷӯи чат.
        const ranked = await this.findRelevantCareers(wanted);
        if ((ranked as any).isFallback) return null;
        return ranked[0] || null;
    }

    async assistant(
        rawMessage: string,
        lang = 'tj',
        context: { careerName?: string; options?: Array<{ id: string; name: string; label?: string }> } = {},
    ) {
        const message = String(rawMessage || '').trim().slice(0, 400);
        const answerLang = ['tj', 'ru', 'en'].includes(lang) ? lang : 'tj';
        const langName = answerLang === 'ru' ? 'русӣ' : answerLang === 'en' ? 'англисӣ' : 'тоҷикӣ';
        if (!message) return { reply: '', action: 'answer', params: {}, answerLang };

        // Ёвар қаблан самтҳо пешниҳод карда буд — ҷавоби корбар интихоб аст.
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const pending = (Array.isArray(context.options) ? context.options : [])
            .filter((option) => option && uuid.test(String(option.id)) && typeof option.name === 'string')
            .slice(0, 6);
        const picked = this.pickOption(message, pending);
        if (picked) {
            return {
                reply: CareerService.ASSISTANT_REPLIES[answerLang]?.open_career || '',
                action: 'open_career',
                params: { id: picked.id, name: picked.name },
                answerLang,
            };
        }

        // «Духтур шудан мехоҳам» — самтҳоро мегӯем ва мепурсем, кадомаш.
        const role = this.detectRole(message);
        if (role) {
            const { say, options } = await this.directionsFor(role, answerLang);
            if (options.length) {
                // Самтҳои дастӣ («духтури кӯдакон») дар миёни ҷумла бо ҳарфи хурд.
                const labels = options.map((option) =>
                    answerLang !== 'tj' || option.label === option.name ? option.label : option.label.charAt(0).toLowerCase() + option.label.slice(1));
                const list = labels.length > 1 ? `${labels.slice(0, -1).join(', ')} ва ${labels[labels.length - 1]}` : labels[0];
                const reply = answerLang === 'ru'
                    ? `Чтобы стать ${say}, есть такие направления: ${labels.join(', ')}. Какое вам ближе?`
                    : answerLang === 'en'
                        ? `To become ${say}, there are these directions: ${labels.join(', ')}. Which one do you like?`
                        : `Барои ${say} шудан ин самтҳо ҳастанд: ${list}. Кадомаш ба шумо маъқул аст?`;
                return { reply, action: 'choose_direction', params: { role: say, options }, answerLang };
            }
        }

        const readJson = (raw: string) => {
            let text = raw.trim();
            if (text.startsWith('```json')) text = text.slice(7);
            else if (text.startsWith('```')) text = text.slice(3);
            if (text.endsWith('```')) text = text.slice(0, -3);
            return JSON.parse(text.trim());
        };

        const clusters = await this.loadClusters();
        const clusterLines = clusters
            .filter((cluster) => cluster.clusterId)
            .map((cluster) => `${cluster.clusterId}. ${cluster.clusterName} — ${(cluster.description || '').slice(0, 130)}`);

        const prompt = [
            'Ту ёвари овозии сомонаи «Ихтисоси ман» ҳастӣ — роҳнамои интихоби касб дар Тоҷикистон.',
            'Гуфтаи корбарро ба ЯК амали иҷозатдодашуда табдил деҳ.',
            'МУҲИМ: матн аз шинохти нутқ омадааст ва метавонад калимаҳои вайрон дошта бошад.',
            'Масалан «эҳсос» ба ҷойи «ихтисос», «иқтисочӣ» ба ҷойи «иқтисодчӣ».',
            'Маънои наздиктаринро гир, ба ҳарфҳо часпида намон.',
            `ДИҚҚАТ: «reply» ҲАТМАН бо забони ${langName} бошад — ҳатто агар корбар бо забони дигар гап занад.`,
            '',
            'ГУФТАИ КОРБАР:',
            message,
            context.careerName ? `КОРБАР ҲОЗИР ИН ИХТИСОСРО МЕБИНАД: ${context.careerName}` : '',
            '',
            'АМАЛҲОИ ИҶОЗАТДОДАШУДА:',
            '- search — ҷустуҷӯи ихтисос («барномасозиро нишон деҳ», «то 4000 сомонӣ»). params: {"query": "матни ҷустуҷӯ"}',
            '  МУҲИМ: номҳои ихтисос дар база ТОҶИКӢ ҳастанд — "query"-ро ҲАМЕША бо тоҷикӣ нависед, ҳатто агар корбар русӣ ё англисӣ гӯяд:',
            '  «programming» → «барномасозӣ», «AI / искусственный интеллект» → «зеҳни сунъӣ», «medicine» → «тиб», «law» → «ҳуқуқ».',
            '- open_career — кушодани як ихтисоси мушаххас. params: {"name": "номи ихтисос"}',
            '- compare — муқоисаи ду ё зиёда ихтисос. params: {"names": ["ном1", "ном2"]}',
            '- save_career — захира кардани ихтисос. params: {"name": "номи ихтисос"}',
            '- start_quiz — оғози санҷиши касбӣ. params: {}',
            '- open_universities — донишгоҳҳо, як донишгоҳи мушаххас ё харита. params: {"name": "номи донишгоҳ", "city": "шаҳр"} — ном ва шаҳр бо тоҷикӣ («Худжанд» → «Хуҷанд», «medical» → «тиббӣ»)',
            '- open_report — ҳисоботи AI аз рӯи санҷиш. params: {}',
            '- open_plan — рӯйхати ҳуҷҷатсупорӣ. params: {}',
            '- nearest_universities — «донишгоҳи наздиктарин», «дар наздикии ман». params: {}',
            '- open_cluster — кушодани яке аз 5 кластер. params: {"number": 1-5}',
            '- open_chat — чати матнӣ бо AI. params: {}',
            '- open_favorites — захираҳои корбар. params: {}',
            '- open_about — дар бораи лоиҳа. params: {}',
            '- go_home — саҳифаи асосӣ. params: {}',
            '- set_language — иваз кардани забон. params: {"lang": "tj" ё "ru" ё "en"}',
            '- set_theme — рӯшноӣ ё торикӣ. params: {"theme": "light" ё "dark"}',
            '- answer — танҳо ҷавоби шифоҳӣ, бе амал. params: {}',
            '',
            clusterLines.length ? 'ПАНҶ КЛАСТЕРИ ИХТИСОСҲО:' : '',
            ...clusterLines,
            clusterLines.length ? 'Агар корбар дар бораи кластер пурсад, аз ҳамин рӯйхат ҷавоб деҳ.' : '',
            '',
            'ФОРМАТИ ҶАВОБ — танҳо JSON:',
            '{"action": "ном", "params": {...}, "reply": "як ҷумлаи кӯтоҳ"}',
            '',
            'МИСОЛҲО:',
            '«Салом, ман намедонам кадом касбро интихоб кунам» → {"action":"answer","params":{},"reply":"Биёед санҷиш гузарем. Сар кунам?"}',
            '«Ҳа, сар кун» → {"action":"start_quiz","params":{},"reply":"Санҷиш оғоз ёфт."}',
            '«Духтуриро кушо» → {"action":"open_career","params":{"name":"Духтур"},"reply":"Кушодам."}',
            '«Маоши барномасоз чанд аст?» → {"action":"open_career","params":{"name":"барномасоз"},"reply":"Кушодам."}',
            '«Донишгоҳи тиббӣ дар куҷост?» → {"action":"open_universities","params":{"name":"тиббӣ"},"reply":"Кушодам."}',
            '',
            'ҚОИДАҲО:',
            `- "reply" бо забони ${langName}, ҲАТМАН кӯтоҳ: то 15 калима, чунки онро овоз мехонад.`,
            '- ҲАМЕША амалро афзал дон. Саволи бозгашт танҳо вақте бипурс, ки ягон амал тамоман мувофиқ наояд.',
            '- Дар бораи бал, нарх ё донишгоҳҳои як ихтисоси мушаххас пурсанд — open_career (дар саҳифааш ҳамааш ҳаст).',
            '- Салом, шикоят ё саволи умумӣ → "answer". Амалро танҳо вақте интихоб кун, ки корбар онро равшан хоста бошад.',
            '- Номи ихтисосро тахмин накун; калимаи худи корбарро нависед.',
            '- Рақам, нарх ё номи донишгоҳ аз худат насоз.',
        ].filter(Boolean).join(String.fromCharCode(10));

        // Аввал роутери тез: фармони маълумро бе AI иҷро мекунем.
        let parsed: any = this.quickRoute(message, answerLang);
        if (!parsed) try {
            // Сӯҳбати зинда: ҳадди 6 сония, бе хобидан ҳангоми 429.
            // Gemini аввал: Vertex квотаашро тамом кардааст (429) ва ҳар дархостро
            // 2–4 сония дер мекард, пеш аз он ки ба Gemini гузарад.
            parsed = readJson(await this.aiService.generateContent(prompt, { fast: true, timeoutMs: 6000, provider: 'gemini' }));
        } catch (error) {
            // AI ҷавоб надод — ёвар набояд хомӯш монад.
            const excuse = answerLang === 'ru'
                ? 'Извините, сейчас не могу ответить. Повторите, пожалуйста.'
                : answerLang === 'en'
                    ? 'Sorry, I cannot answer right now. Please say it again.'
                    : 'Мебахшед, ҳозир ҷавоб дода наметавонам. Бори дигар бигӯед.';
            return { reply: excuse, action: 'answer', params: {}, answerLang, failed: true };
        }

        const wanted = String(parsed?.action || 'answer');
        let action = CareerService.ASSISTANT_ACTIONS.includes(wanted) ? wanted : 'answer';
        const reply = typeof parsed?.reply === 'string' ? parsed.reply.trim().slice(0, 300) : '';
        const given = parsed?.params && typeof parsed.params === 'object' ? parsed.params : {};
        let params: any = {};

        // Роутери тез гоҳо ошкоро мегӯяд: «ҳамаашро нишон деҳ» (query холӣ)
        // ё «ин филтр аст, на ном» (trusted). Инҳоро дар база насанҷида
        // рост мефиристем — ҷустуҷӯи AI-и саҳифа филтрро худаш мефаҳмад.
        if (action === 'search' && (given.query === '' || given.trusted)) {
            return {
                reply: CareerService.ASSISTANT_REPLIES[answerLang]?.search || '',
                action,
                params: { query: String(given.query || '') },
                answerLang,
            };
        }

        if (action === 'search') {
            // Ихтисорҳои кӯтоҳ («AI», «IT») пештар ҳамчун «холӣ» ҳисоб мешуданд ва ҳамаи 884 мебаромад.
            const ACRONYMS: Record<string, string> = {
                ai: 'зеҳни сунъӣ', ии: 'зеҳни сунъӣ', it: 'технологияи иттилоотӣ', ит: 'технологияи иттилоотӣ',
            };
            const given0 = String(given.query || '').trim();
            const expanded = ACRONYMS[given0.toLowerCase()] || given0.replace(/\b(AI|IT)\b/g, (m) => ACRONYMS[m.toLowerCase()]);
            const rawQuery = String(expanded || message).trim().slice(0, 200);

            // «Дар бораи ихтисосҳо гӯй» — калимаи умумӣ филтр нест, онро мебарорем.
            const generic = /ихтисос[а-яёғӣқӯҳҷ]*|касб[а-яёғӣқӯҳҷ]*|профессия[а-я]*|специальност[а-я]*|специалност[а-я]*/gi;
            const cleaned = rawQuery.replace(generic, ' ').replace(/ {2,}/g, ' ').trim();

            if (!rawQuery) {
                action = 'answer';
            } else if (cleaned.length < 3) {
                // Танҳо калимаи умумӣ гуфт — ҳамаи ихтисосҳоро мекушоем.
                return {
                    reply: CareerService.ASSISTANT_REPLIES[answerLang]?.search || '',
                    action,
                    params: { query: '' },
                    answerLang,
                };
            } else {
                // Пеш аз кушодани саҳифа мебинем, ки дар база чизе ҳаст ё не —
                // саҳифаи холӣ дар назди корбар бадтарин ҷавоб аст.
                const matches = await this.findRelevantCareers(cleaned);
                let found = (matches as any).isFallback ? [] : matches;
                let refined = cleaned;

                // Ранкинг баъзан «иқтисодчӣ»-ро намеёбад, вале решаҷӯӣ меёбад.
                if (found.length === 0) {
                    const near = await this.resolveCareer(cleaned);
                    if (near) {
                        found = [near];
                        refined = near.name;
                    }
                }

                if (found.length === 0) {
                    action = 'answer';
                    params = {};
                    return {
                        reply: answerLang === 'ru'
                            ? `По запросу «${cleaned}» ничего не нашлось. Попробуйте другое слово.`
                            : answerLang === 'en'
                                ? `I found nothing for "${cleaned}". Try another word.`
                                : `Аз рӯи «${cleaned}» чизе наёфтам. Калимаи дигар бигӯед.`,
                        action,
                        params,
                        answerLang,
                    };
                }

                params = { query: refined, count: found.length };
            }
        }
        if (action === 'open_career' || action === 'save_career') {
            const career = await this.resolveCareer(given.name || context.careerName);
            if (!career) {
                action = 'search';
                params = { query: String(given.name || message).slice(0, 200) };
            } else {
                params = { id: career.id, name: career.name, code: career.code };
            }
        }

        if (action === 'compare') {
            const names = Array.isArray(given.names) ? given.names.slice(0, 5) : [];
            const found: string[] = [];
            for (const name of names) {
                const career = await this.resolveCareer(name);
                if (career && !found.includes(career.name)) found.push(career.name);
            }
            if (found.length < 2) {
                action = 'search';
                params = { query: names.join(' ').slice(0, 200) || message };
            } else {
                params = { names: found };
            }
        }

        if (action === 'open_cluster') {
            const number = Number(given.number);
            const cluster = clusters.find((item) => item.clusterId === number);
            if (!cluster) {
                action = 'answer';
                params = {};
            } else {
                params = { id: cluster.id, number: cluster.clusterId, name: cluster.clusterName };
            }
        }

        if (action === 'set_language') {
            const lang = String(given.lang || '').toLowerCase();
            if (['tj', 'ru', 'en'].includes(lang)) params = { lang };
            else action = 'answer';
        }

        if (action === 'set_theme') {
            const theme = String(given.theme || '').toLowerCase();
            if (['light', 'dark'].includes(theme)) params = { theme };
            else action = 'answer';
        }

        if (action === 'open_universities') {
            // «донишгоҳи Миллиро ёб» — аввал номи мушаххасро меҷӯем,
            // вагарна корбар ба рӯйхати 33-тоӣ мерасад.
            const wantedName = String(given.name || '').trim();
            if (wantedName.length >= 3) {
                // «Донишгоҳи тиббӣ» — донишгоҳ, на аввалин коллеҷи тиббӣ; «коллеҷ» — баръакс.
                const folded = foldTajik(message);
                const kind = /коллеч/.test(folded) ? 'коллеч%' : /донишкад/.test(folded) ? 'донишкад%' : /донишгох|университет/.test(folded) ? 'донишгох%' : '';
                const rows: Array<{ id: string; name: string }> = await this.careerRepository.manager.query(
                    // Шаҳри гуфташуда («… дар Хуҷанд») пеш; баъд навъ, давлатӣ ва калонтарин (ихтисосҳо бештар).
                    `SELECT u.id, u.name FROM universities u
                     WHERE ${TAJIK_FOLD('u.name')} LIKE $1
                        OR ${TAJIK_FOLD(`coalesce(u."shortName", '')`)} LIKE $1
                     ORDER BY (CASE WHEN u.city IS NOT NULL AND $4 LIKE '%' || ${TAJIK_FOLD('u.city')} || '%' THEN 0 ELSE 1 END),
                              (CASE WHEN $3 <> '' AND ${TAJIK_FOLD('u.name')} LIKE $3 THEN 0 ELSE 1 END),
                              (CASE WHEN ${TAJIK_FOLD('u.name')} LIKE $2 THEN 0 ELSE 1 END),
                              (CASE WHEN u."isState" THEN 0 ELSE 1 END),
                              (SELECT count(*) FROM career_universities cu WHERE cu."universitiesId" = u.id) DESC,
                              length(u.name)
                     LIMIT 1`,
                    [`%${foldTajik(wantedName)}%`, `${foldTajik(wantedName)}%`, kind, `${folded} ${foldTajik(String(given.city || ''))}`],
                );
                if (rows[0]) params = { id: rows[0].id, name: rows[0].name };
            }

            if (!params.id) {
                const city = CareerService.cityToTajik(String(given.city || '').trim());
                if (city) {
                    const rows: Array<{ city: string }> = await this.careerRepository.manager.query(
                        `SELECT DISTINCT city FROM universities WHERE ${TAJIK_FOLD('city')} LIKE $1 LIMIT 1`,
                        [`%${foldTajik(city)}%`],
                    );
                    if (rows[0]?.city) params = { city: rows[0].city };
                }
            }
        }

        // Барои амалҳо ҷумлаи собит мегирем — садояш ҳамеша аз кеш меояд.
        // Кластерро на танҳо мекушоем — кӯтоҳ шарҳ ҳам медиҳем.
        if (action === 'open_cluster' && params.number && answerLang === 'tj') {
            const cluster = clusters.find((item) => item.clusterId === params.number);
            const about = (cluster?.description || '').split('—')[1] || cluster?.description || '';
            if (about) {
                return {
                    reply: `${params.name}. ${about.trim().split('.')[0]}.`.slice(0, 300),
                    action,
                    params,
                    answerLang,
                };
            }
        }

        if (action === 'open_career' && params.id) {
            const fact = await this.careerFact(params.id, message, answerLang);
            if (fact) return { reply: fact, action, params, answerLang };
        }
        // «Донишгоҳи тиббӣ дар куҷост?» — шаҳрашро мегӯем.
        if (action === 'open_universities' && params.id) {
            const rows: Array<{ city: string | null; translations: any }> = await this.careerRepository.manager.query(
                'SELECT city, translations FROM universities WHERE id = $1', [params.id]);
            const city = answerLang === 'tj' ? rows[0]?.city : rows[0]?.translations?.[answerLang]?.city || rows[0]?.city;
            if (city) {
                const reply = answerLang === 'ru' ? `Он находится в городе ${city}. Открыл страницу.`
                    : answerLang === 'en' ? `It is in ${city}. I opened its page.`
                        : `Он дар шаҳри ${city} ҷойгир аст. Саҳифаашро кушодам.`;
                return { reply, action, params, answerLang };
            }
        }

        const replyKey = action === 'open_universities' && params.id ? 'open_career' : action;
        const canned = CareerService.ASSISTANT_REPLIES[answerLang]?.[replyKey];
        return { reply: canned || reply, action, params, answerLang };
    }

    // Ҷавоби кӯтоҳ аз маълумоти база ба саволи мушаххас: маош, нарх, ҷойи ройгон.
    // Рақамҳо танҳо аз база — AI онҳоро намесозад.
    private async careerFact(careerId: string, message: string, lang: string): Promise<string | null> {
        const text = foldTajik(message);
        const asks = {
            salary: /маош|музд|даромад|зарплат|salary|earn|сколько получа|доход/.test(text),
            price: /нарх|пули тахсил|контракт|стоимост|стоит|цена|price|tuition|cost/.test(text),
            free: /ройгон|бепул|грант|бюджет|free/.test(text),
        };
        if (!asks.salary && !asks.price && !asks.free) return null;
        const career = await this.careerRepository.findOne({ where: { id: careerId } });
        if (!career) return null;
        const parts: string[] = [];
        const salary = (career as any).salaryAndMarket;
        if (asks.salary && salary?.junior) {
            parts.push(lang === 'ru' ? `Начинающий специалист получает ${salary.junior}, опытный — ${salary.mid}.`
                : lang === 'en' ? `A beginner earns ${salary.junior}, an experienced specialist ${salary.mid}.`
                    : `Мутахассиси навкор ${salary.junior} ва ботаҷриба ${salary.mid} мегирад.`);
        }
        const min = career.minTuitionFee || career.tuitionFee;
        const max = career.maxTuitionFee || career.tuitionFee;
        if (asks.price && min) {
            const range = max && max !== min ? `${min} – ${max}` : `${min}`;
            parts.push(lang === 'ru' ? `Обучение стоит ${range} сомони в год.`
                : lang === 'en' ? `Tuition is ${range} somoni a year.`
                    : `Нархи таҳсил ${range} сомонӣ дар як сол аст.`);
        }
        if (asks.free) {
            parts.push(career.hasFreeSeats
                ? (lang === 'ru' ? 'Есть бюджетные места.' : lang === 'en' ? 'There are free places.' : 'Ҷойҳои ройгон ҳаст.')
                : (lang === 'ru' ? 'Бюджетных мест нет.' : lang === 'en' ? 'There are no free places.' : 'Ҷойи ройгон нест.'));
        }
        if (!parts.length) return null;
        const tail = lang === 'ru' ? 'Подробности на странице.' : lang === 'en' ? 'Details are on the page.' : 'Тафсилот дар саҳифа.';
        // Ном ва асъор бо забони корбар («Кори табобатӣ» → «General Medicine», «сомонӣ» → «somoni»).
        const name = (lang !== 'tj' && (career as any).translations?.[lang]?.name) || career.name;
        const currency = lang === 'en' ? 'somoni' : lang === 'ru' ? 'сомони' : 'сомонӣ';
        return `${name}: ${parts.join(' ')} ${tail}`.replace(/сомонӣ/g, currency).slice(0, 300);
    }

    // Балҳои гузариши расмии НМТ аз рӯи коди ихтисос.
    async admissionScores(careerId: string) {
        const career = await this.careerRepository.findOne({ where: { id: careerId } });
        const code = career?.code ? String(career.code).trim() : '';
        if (!code) return { code: null, source: NTC_SOURCE, years: [], universities: [] };

        const rows = await this.admissionRepository.find({
            where: { code },
            order: { year: 'ASC', score: 'DESC' },
        });
        if (!rows.length) return { code, source: NTC_SOURCE, years: [], universities: [] };

        // Бали 0 дар ҷадвали НМТ маънои «қабул набуд / маълумот нест»-ро дорад, на
        // бали воқеиро — 4424 сатр. Пештар саҳифа «0 – 313.6» нишон медод.
        for (const row of rows) {
            if (typeof row.score === 'number' && row.score <= 0) row.score = null;
        }

        // Ҷамъбаст аз рӯи сол: аз кадом бал то кадом бал қабул карданд.
        const byYear = new Map<number, any[]>();
        for (const row of rows) {
            if (!byYear.has(row.year)) byYear.set(row.year, []);
            byYear.get(row.year)!.push(row);
        }

        const years = [...byYear.entries()]
            .map(([year, list]) => {
                const scores = list.map((r) => r.score).filter((s): s is number => typeof s === 'number');
                const seats = list.reduce((sum, r) => sum + (r.seats || 0), 0);
                const competitions = list.map((r) => r.competition).filter((c): c is number => typeof c === 'number');
                return {
                    year,
                    offers: list.length,
                    seats,
                    minScore: scores.length ? Math.round(Math.min(...scores) * 10) / 10 : null,
                    maxScore: scores.length ? Math.round(Math.max(...scores) * 10) / 10 : null,
                    avgScore: scores.length
                        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
                        : null,
                    maxCompetition: competitions.length ? Math.round(Math.max(...competitions) * 100) / 100 : null,
                };
            })
            .sort((a, b) => a.year - b.year);

        // Соли охирин аз рӯи донишгоҳ — то корбар бубинад, куҷо осонтар аст.
        const lastYear = years[years.length - 1]?.year;
        const universities = rows
            .filter((row) => row.year === lastYear)
            .map((row) => ({
                university: row.university,
                studyForm: row.studyForm,
                paymentType: row.paymentType,
                seats: row.seats,
                competition: row.competition,
                score: row.score === null ? null : Math.round(row.score * 10) / 10,
            }))
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

        return { code, source: NTC_SOURCE, lastYear, years, universities };
    }

    // Муаррифии шифоҳии ихтисос — аз база, на аз AI: зуд (~50 мс) ва
    // рақамҳо (бал, маош) воқеӣ мемонанд, на бофта.
    async careerBrief(careerId: string): Promise<{ text: string }> {
        const career = await this.careerRepository.findOne({ where: { id: careerId } });
        if (!career) throw new NotFoundException('Ихтисос ёфт нашуд');

        const list = (value: unknown): string[] =>
            (Array.isArray(value) ? value : String(value || '').split(','))
                .map((item) => String(item).trim())
                .filter(Boolean);
        const firstSentence = (value: unknown): string => {
            const text = String(value || '').trim();
            // Нуқтаи дохили «» (номи ихтисос «Таърих. Ҳуқуқ») охири ҷумла нест.
            const quoteEnd = text.startsWith('«') ? text.indexOf('»') : -1;
            const end = text.slice(quoteEnd + 1).search(/[.!?](\s|$)/);
            return end >= 0 ? text.slice(0, quoteEnd + 1 + end + 1) : text;
        };
        const join = (items: string[]): string =>
            items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ва ${items[items.length - 1]}`;

        const parts: string[] = [];
        // Агар тавсиф худ бо номи ихтисос сар шавад, номро такрор намекунем.
        const about = firstSentence(career.description || career.purpose);
        const plain = (value: string) => value.toLowerCase().replace(/[«»"]/g, '').trim();
        parts.push(about && plain(about).startsWith(plain(career.name)) ? about
            : about ? `${career.name}. ${about}` : `${career.name}.`);

        const work = list(career.careerOpportunities).slice(0, 3)
            .map((item) => item.charAt(0).toLowerCase() + item.slice(1));
        if (work.length) parts.push(`Бо ин ихтисос дар ${join(work)} кор карда метавонед.`);

        const techs = list(career.technologies).slice(0, 4);
        if (techs.length) parts.push(`Шумо ${join(techs)}-ро меомӯзед.`);

        const salary = (career.salaryAndMarket as any)?.junior;
        // «2 500» → «2500», вагарна рақамҳо ҷудо-ҷудо хонда мешаванд.
        if (salary) parts.push(`Маоши аввал ${String(salary).replace(/(\d)\s+(?=\d{3}(?!\d))/g, '$1').replace(/\s*[–—-]\s*/, ' то ')}.`);

        // Бали гузаришро то адади бутун мегардонем: «шашсаду ёздаҳ», на «…ёздаҳ.як».
        const code = career.code ? String(career.code).trim() : '';
        if (code) {
            const rows: Array<{ year: number; lo: number; hi: number }> = await this.careerRepository.manager.query(
                `SELECT year, min(score) AS lo, max(score) AS hi FROM admission_scores
                 WHERE code = $1 AND score > 0
                 GROUP BY year ORDER BY year DESC LIMIT 1`,
                [code],
            );
            if (rows[0]) {
                const lo = Math.round(Number(rows[0].lo));
                const hi = Math.round(Number(rows[0].hi));
                parts.push(lo === hi
                    ? `Соли ${rows[0].year} бали гузариш ${lo} буд.`
                    : `Соли ${rows[0].year} бали гузариш аз ${lo} то ${hi} буд.`);
            }
        }

        const unis: Array<{ n: number }> = await this.careerRepository.manager.query(
            'SELECT count(*)::int AS n FROM career_universities WHERE "careerId" = $1',
            [career.id],
        );
        if (unis[0]?.n) parts.push(`Онро ${unis[0].n} донишгоҳ таълим медиҳад.`);

        const similar = [...new Set(list(career.relatedSpecializations))]
            .filter((item) => item !== career.name).slice(0, 2);
        if (similar.length) parts.push(`Ихтисосҳои монанд: ${join(similar)}.`);

        parts.push('Мехоҳед захира кунам ё бо дигараш муқоиса кунем?');
        return { text: parts.join(' ') };
    }

    findOne(id: string): Promise<Career | null> {
        return this.careerRepository.findOne({ where: { id }, relations: ['cluster', 'universities'] });
    }

    findByCode(code: string): Promise<Career | null> {
        return this.careerRepository.findOne({ where: { code }, relations: ['cluster', 'universities'] });
    }

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

    async selectMatchedCareers(userScores: any): Promise<{
        cluster: Cluster | null;
        matchPercentage: number;
        careers: Career[];
        clusterScores: { cluster: Cluster; score: number }[];
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

        const pool = await this.careerRepository.find({
            where: { clusterId: top.cluster.id },
            select: ['id', 'name', 'description', 'purpose', 'skills', 'likesCount'],
        });

        // Калидвожа танҳо аз аввали калима: пештар «ай» (AI) дар «ҳайвон», «тайёр»
        // ҳам ёфт мешуд ва ихтисосҳои тасодуфӣ мебаромаданд.
        const keywords: string[] = [...new Set<string>((userScores?.specialtyKeywords || [])
            .map((k: string) => String(k).toLowerCase().trim())
            .filter((k: string) => k.length >= 3))];
        const words = (text: string): string[] => text.toLowerCase().split(/[^0-9a-zа-яёӣӯқғҳҷ]+/i).filter(Boolean);
        const hits = (list: string[], keyword: string): boolean => list.some((word) => word.startsWith(keyword));

        const scoreOf = (career: Career): number => {
            if (!keywords.length) return 0;

            const name = words(career.name || '');
            const body = words([
                career.description || '',
                career.purpose || '',
                ...(career.skills?.technical || []),
                ...(career.skills?.soft || []),
            ].join(' '));

            return keywords.reduce((total, keyword) => {
                if (hits(name, keyword)) return total + 4;
                if (hits(body, keyword)) return total + 1;
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

        const topCareers = ranked.length
            ? await this.careerRepository.find({
                where: { id: In(ranked.map(r => r.career.id)) },
                relations: ['universities'],
            })
            : [];

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

        const userProfile: Record<string, number> = {};
        for (const entry of clusterScores) {
            userProfile[`c${entry.cluster.clusterId}`] = Number(
                ((entry.score / CareerService.MMT_MAX_SCORE) * 10).toFixed(1),
            );
        }

        const careerProfile: Record<string, number> = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
        if (cluster) careerProfile[`c${cluster.clusterId}`] = 10;

        const values = clusterScores.map((entry) => entry.score);
        const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
        const topScore = clusterScores[0]?.score ?? 0;
        const secondScore = clusterScores[1]?.score ?? 0;
        const cosineSimilarity = norm > 0 ? Number((topScore / norm).toFixed(3)) : 0;

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

        const maxRank = Math.max(0, ...careers.map((c) => careerRanks.get(c.id) ?? 0));

        return careers.map(career => {
            const universities = (career.universities || []);

            const rank = careerRanks.get(career.id) ?? 0;
            const relative = maxRank > 0 ? rank / maxRank : 1;
            const careerMatch = Math.max(
                35,
                Math.min(99, Math.round(matchPercentage * (0.75 + 0.25 * relative))),
            );

            return {
                id: career.id,
                code: career.code,
                name: career.name,
                description: career.description,
                purpose: career.purpose,
                matchPercentage: careerMatch,
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
        const stopWords = new Set([
            'ман', 'ба', 'бо', 'ва', 'ё', 'аз', 'дар', 'ки', 'чӣ', 'чи', 'кадом', 'барои', 'мехоҳам', 'мехохам',
            'ихтисос', 'ихтисоси', 'ихтисосро', 'ихтисосҳои', 'профессия', 'профессии',
            'хочу', 'где', 'что', 'как', 'the', 'and', 'for',
            'дорам', 'дорад', 'доранд', 'кунам', 'кунад', 'кунанд', 'кунед', 'шавам', 'шавад',
            'бошад', 'бошам', 'аст', 'ҳаст', 'ҳастам', 'будан', 'кардан', 'шудан', 'гирифтан',
            'интихоб', 'маслиҳат', 'савол', 'лутфан', 'илтимос', 'салом', 'ассалом',
            'ман_ро', 'худро', 'шумо', 'вай', 'онҳо', 'ҳамин', 'инро', 'онро',
            'хочу', 'нужно', 'какой', 'какая', 'выбрать', 'посоветуйте', 'помогите',
            'want', 'need', 'which', 'choose', 'advise', 'help', 'should',
            'мешавад', 'мешаванд', 'мешавам', 'мешавем', 'мешавед', 'шуданиям', 'шуданӣ', 'шудани',
            'метавонам', 'метавонад', 'лозим', 'бояд', 'кадомаш', 'ихтисосҳо', 'ихтисосҳоро',
            'касб', 'касби', 'касбҳо', 'стать', 'специальность', 'специальности',
            'become', 'specialty', 'specialties', 'career',
        ]);

        const words = text
            .split(' ')
            .map((word) => word.trim())
            .filter((word) => word.length >= 3 && !stopWords.has(word));

        const terms: string[] = [];
        for (const word of words) {
            const folded = foldTajik(word);
            terms.push(folded);
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

        let matched: Career[] = [];
        if (terms.length > 0) {
            const ranked: Array<{ id: string }> = await this.careerRepository.manager.query(
                // MATERIALIZED: табдили ҳарфҳо як бор барои ҳар ихтисос ҳисоб мешавад, на барои ҳар калима (466мс → 118мс).
                `WITH base AS MATERIALIZED (
                    SELECT c.id, c."likesCount",
                        ${TAJIK_FOLD('c.name')} AS n,
                        ${TAJIK_FOLD(`coalesce(cl."clusterName", '')`)} AS cl,
                        ${TAJIK_FOLD(`coalesce(c.description, '') || ' ' || coalesce(c.purpose, '')`)} AS body,
                        ${TAJIK_FOLD(`coalesce(ux.unis, '')`)} AS unis
                    FROM career c
                    LEFT JOIN cluster cl ON cl.id = c."clusterId"
                    LEFT JOIN (
                        SELECT cu."careerId", string_agg(coalesce(u.name, '') || ' ' || coalesce(u.city, ''), ' ') AS unis
                        FROM career_universities cu
                        JOIN universities u ON u.id = cu."universitiesId"
                        GROUP BY cu."careerId"
                    ) ux ON ux."careerId" = c.id
                )
                SELECT id FROM (
                    SELECT b.id, b."likesCount", SUM(CASE
                        WHEN b.n LIKE t || '%' THEN 4
                        WHEN b.n LIKE '%' || t || '%' THEN 3
                        WHEN b.cl LIKE '%' || t || '%' THEN 2
                        WHEN b.body LIKE '%' || t || '%' THEN 1
                        WHEN b.unis LIKE '%' || t || '%' THEN 1
                        ELSE 0 END) AS rank
                    FROM base b
                    CROSS JOIN unnest($1::text[]) AS t
                    GROUP BY b.id, b."likesCount"
                ) scored
                WHERE rank > 0
                ORDER BY rank DESC, "likesCount" DESC
                LIMIT 10`,
                [terms],
            );

            if (ranked.length) {
                const ids = ranked.map((row) => row.id);
                const rows = await this.careerRepository.find({
                    where: { id: In(ids) },
                    relations: ['cluster', 'universities'],
                });
                const byId = new Map(rows.map((career) => [career.id, career]));
                matched = ids
                    .map((id) => byId.get(id))
                    .filter((career): career is Career => Boolean(career));
            }
        }

        if (matched.length >= 4) return matched;

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
- Never copy the technical field labels of the database context (cluster:, degree:, tuitionFee:) into the answer, and never write "(Cluster: ...)". Name the cluster in plain words in the answer language, for example «кластери 4 — Ҷомеашиносӣ ва ҳуқуқ».
- Keep lists compact: one line per item and no empty lines between items.
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
            rawResponse = await this.aiService.generateContent(prompt, { timeoutMs: 55_000 });
        } catch (error) {
            if (error instanceof HttpException) throw error;
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
        const hasQuizScores = !!mmt && typeof mmt === 'object' && Object.keys(mmt).length > 0;

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
                fallbackSalary: 'Маълум нест',
                notFound: 'Ихтисосҳои интихобшуда дар база ёфт нашуданд. Онҳоро аз рӯйхат интихоб кунед.',
                parseError: 'AI ҷавоби нодуруст баргардонд. Лутфан дубора кӯшиш кунед.',
                altReason: 'Як ҷумла бо забони тоҷикӣ: чаро ин ихтисос ба саволи корбар беҳтар мувофиқ аст'
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
                fallbackSalary: 'Неизвестно',
                notFound: 'Выбранные специальности не найдены в базе. Выберите их из списка.',
                parseError: 'AI вернул некорректный ответ. Пожалуйста, попробуйте ещё раз.',
                altReason: 'Одно предложение на русском: почему эта специальность лучше подходит под вопрос пользователя'
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
                fallbackSalary: 'Unknown',
                notFound: 'The selected specialties were not found in the database. Please pick them from the list.',
                parseError: 'The AI returned an invalid answer. Please try again.',
                altReason: 'One sentence in English: why this specialty fits the user\'s question better'
            }
        };

        const instr = languageName === 'Russian' ? languageInstructions.Russian : languageName === 'English' ? languageInstructions.English : languageInstructions.Tajik;

        if (careers.length === 0) {
            throw new NotFoundException(instr.notFound);
        }

        const selectedNames = new Set(careers.map((c) => c.name));
        const candidatePool = await this.findRelevantCareers(
            `${compareQuestion?.trim() || ''} ${careers.map((c) => c.name).join(' ')}`,
        );
        const candidateNames = new Set<string>();
        const candidates = (candidatePool as any).isFallback
            ? []
            : candidatePool
                .filter((c) => {
                    if (selectedNames.has(c.name) || candidateNames.has(c.name)) return false;
                    candidateNames.add(c.name);
                    return true;
                })
                .slice(0, 10);

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
        if (candidates.length) {
            careersContext += `
BETTER OPTIONS (optional, the "alternatives" field of the JSON):
The student may not have picked the best specialty for their goal. From ONLY the list below,
choose 0-3 specialties that clearly fit the student's question${hasQuizScores ? ' and MMT profile' : ''} better than the selected ones.
Copy each name exactly as written. If none is clearly better, return "alternatives": [].
${candidates.map((c) => `- ${c.name} (${c.cluster?.clusterName || ''})`).join('\n')}
`;
        }

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
  ],
  "alternatives": [
    { "name": "exact name from the BETTER OPTIONS list", "reason": "${instr.altReason}" }
  ]
}
`;

        let rawResponse: string;
        try {
            rawResponse = await this.aiService.generateContent(prompt, { timeoutMs: 55_000 });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException(instr.fallbackUnavail);
        }

        let report: any;
        try {
            let cleaned = rawResponse.trim();
            if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
            else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
            if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
            report = JSON.parse(cleaned.trim());
        } catch (e) {
            console.error('Failed to parse comparison AI response:', e);
            throw new InternalServerErrorException(instr.parseError);
        }

        const byName = new Map(candidates.map((c) => [foldTajik(c.name.trim()), c]));
        const seenIds = new Set<string>();
        report.alternatives = (Array.isArray(report?.alternatives) ? report.alternatives : [])
            .map((item: any) => {
                const match = typeof item?.name === 'string' ? byName.get(foldTajik(item.name.trim())) : undefined;
                if (!match || seenIds.has(match.id)) return null;
                seenIds.add(match.id);
                return {
                    id: match.id,
                    code: match.code,
                    name: match.name,
                    cluster: match.cluster?.clusterName || null,
                    reason: typeof item.reason === 'string' ? item.reason.trim().slice(0, 300) : '',
                };
            })
            .filter(Boolean)
            .slice(0, 3);

        return report;
    }
}
