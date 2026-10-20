import { createHash } from 'crypto';
import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, HttpException } from '@nestjs/common';
import { resourcesForAi } from '../common/resource-filters';
import { offeredForGrade, parseGrade } from '../common/grade';
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

const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 30);
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
                  OR career.code LIKE :rawSearch
                  OR (career.translations::jsonb -> 'ru' ->> 'name') ILIKE :rawSearch
                  OR (career.translations::jsonb -> 'en' ->> 'name') ILIKE :rawSearch)`,
                { search: `%${foldTajik(search)}%`, rawSearch: `%${search}%` },
            );
        }

        const anyTerms = (query.searchAny || [])
            .map((term) => foldTajik(String(term).trim()))
            .filter((term) => term.length >= 3);
        // Аз АВВАЛИ калима: «араб» — «арабӣ», на «т-араб-хона» ё «сам-араб-ахш».
        const startsWord = (index: number) => `${TAJIK_FOLD('career.name')} ~ ('(^|[^а-яёa-z])' || :anyTerm${index})`;
        if (anyTerms.length) {
            qb.andWhere(new Brackets((where) => {
                anyTerms.forEach((term, index) => {
                    const params = { [`anyTerm${index}`]: term.replace(/[^а-яёa-z0-9]/g, '') };
                    if (index === 0) where.where(startsWord(index), params);
                    else where.orWhere(startsWord(index), params);
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

        // Баъди синфи 9 — танҳо ихтисосҳое, ки коллеҷҳо баъди синфи 9 қабул мекунанд.
        const grade = parseGrade(query.grade);
        if (grade) qb.andWhere(offeredForGrade('career'), { grade });

        qb.addSelect('career.codeSort');
        if (anyTerms.length > 1) {
            // «англисӣ ва арабӣ»: аввал ихтисосҳое, ки ҳарду калимаро доранд.
            qb.addSelect(anyTerms.map((_, index) => `(CASE WHEN ${startsWord(index)} THEN 1 ELSE 0 END)`).join(' + '), 'match_rank');
            qb.orderBy('match_rank', 'DESC').addOrderBy('career.codeSort', 'ASC').addOrderBy('career.name', 'ASC');
        } else {
            qb.orderBy('career.codeSort', 'ASC').addOrderBy('career.name', 'ASC');
        }

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
        keepLang = false,
        rawGrade?: string | number,
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
            ...(parseGrade(rawGrade) ? { grade: String(parseGrade(rawGrade)) } : {}),
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
            '  «тарҷумони англисӣ ва арабӣ», «переводчик» → ["тарҷума", "англис", "араб"]',
            '  «бо кӯдакон кор кардан» → ["томактаб", "ибтидоӣ", "кӯдак"]',
            '- Намунаҳои боло ТАНҲО намуна ҳастанд: калимаҳоро аз САВОЛИ КОРБАР гир.',
            '  Агар корбар дар бораи забон, тарҷума ё касби дигар пурсад — «муҳандис»',
            '  ё «духтур» НАНАВИС.',
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

        // Калимаҳои худи корбар, ки дар номи ихтисосҳо ҳастанд («англиси» → «англис», «арабади» → «араб»).
        // AI баъзан калимаҳоро аз намунаҳои промпт нусха мекард («тарҷумон» → «муҳандис»).
        const direct = await this.directStems(question);

        let parsed: any = null;
        try {
            parsed = readJson(await this.aiService.generateContent(filterPrompt));
        } catch (error) {
            if (direct.length) return finish(true, { searchAny: direct, keywords: direct });
            return finish(false, { search: question });
        }

        if (typeof parsed?.lang === 'string') {
            const said = parsed.lang.trim().toLowerCase();
            // Ёвари овозӣ ҷустуҷӯро ҳамеша бо тоҷикӣ мефиристад (номҳо дар база тоҷикӣ) —
            // он гоҳ забони сайт мемонад, вагарна саҳифаи русӣ тоҷикӣ ҷавоб мегирифт.
            if (!keepLang && (said === 'tj' || said === 'ru' || said === 'en')) answerLang = said;
        }

        const filters: any = {};

        const rawKeywords: unknown[] = Array.isArray(parsed?.keywords)
            ? parsed.keywords
            : typeof parsed?.search === 'string' ? [parsed.search] : [];
        const aiKeywords = [...new Set(
            rawKeywords
                .filter((k): k is string => typeof k === 'string')
                .map((k) => k.trim().slice(0, 40))
                .filter((k) => k.length >= 3),
        )]
            .filter((k, index) => index === 0 || !CareerService.BROAD_STEMS.has(foldTajik(k)))
            .slice(0, 3);
        // Калимаҳои худи корбар бартарӣ доранд. Калимаи AI илова мешавад, агар бо калимаи корбар
        // реша дошта бошад («ҳуқуқ» ↔ «ҳуқуқшинос»); агар натиҷа кам бошад — ҳамаи калимаҳои AI
        // (маъно: «кӯдакон» → «томактабӣ»). Калимаҳои умумӣ («забон») илова намешаванд.
        // Тартиб аз рӯи шумораи калимаҳои мувофиқ аст — беҳтаринҳо боло мемонанд.
        let keywords = aiKeywords;
        if (direct.length) {
            const queryWords = foldTajik(question).split(/[^а-яёa-z]+/).filter((word) => word.length >= 4);
            const aiUseful = aiKeywords.filter((k) => !CareerService.QUERY_STOP.has(foldTajik(k)));
            const related = aiUseful.filter((k) => queryWords.some((word) => word.startsWith(foldTajik(k).slice(0, 4)) || foldTajik(k).startsWith(word.slice(0, 4))));
            keywords = [...new Set([...direct, ...related])];
            const found = await this.findAll(toDto({ searchAny: keywords }, 1, 1));
            if (found.meta.total < 3) keywords = [...new Set([...keywords, ...aiUseful])];
        }
        // Як реша — як калима: «муҳандис» ва «мухандиси», «англис» ва «англиси» ду бор ҳисоб
        // намешаванд (вагарна тартиб каҷ мешуд). Решаи кӯтоҳтар (умумитар) мемонад.
        const roots: string[] = [];
        keywords = [...keywords]
            .sort((a, b) => foldTajik(a).length - foldTajik(b).length)
            .filter((k) => {
                const folded = foldTajik(k);
                if (roots.some((root) => folded.startsWith(root))) return false;
                roots.push(folded);
                return true;
            })
            .slice(0, 5);

        const clusterNumber = direct.length ? NaN : Number(parsed?.clusterNumber);
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

    // Калимаҳое, ки дар саволҳо зиёданд, вале касбро нишон намедиҳанд.
    private static readonly QUERY_STOP = new Set(
        ['забон', 'забони', 'забонҳо', 'забонҳои', 'мехоҳам', 'мехохам', 'шавам', 'шудан', 'шавад', 'ихтисос', 'ихтисоси', 'ихтисосҳо',
            'касб', 'касби', 'донишгоҳ', 'донишгоҳи', 'донишгоҳҳо', 'коллеҷ', 'хондан', 'хонам', 'омӯхтан', 'мутахассис', 'мутахассиси',
            'таҳсил', 'сомонӣ', 'сомони', 'ройгон', 'арзон', 'барои', 'кадом', 'беҳтар', 'хуб', 'мешавад', 'кунам', 'кор', 'кори',
            'хоҳам', 'метавонам', 'дорам', 'дар', 'бо', 'аз', 'ва', 'ё', 'то', 'шаҳр', 'шаҳри', 'душанбе', 'хуҷанд',
            'хочу', 'стать', 'работать', 'учиться', 'want', 'become', 'study']
            .map((word) => foldTajik(word)),
    );

    // Решаҳои калимаҳои худи корбар, ки дар аввали калимаи номи ихтисос ҳастанд.
    // Барои ҳар калима — дарозтарин префикс (камаш 4 ҳарф ва нисфи калима), ки ёфт мешавад:
    // «тарҷумони» → «тарчум», «англиси» → «англис», «арабади» (ғалат) → «араб».
    // Касбҳое, ки номашон дар номи ихтисосҳо нест: «ошпаз» → «хӯроки умумӣ», «қаннодӣ», «тарабхона».
    private static readonly PROFESSION_STEMS: Array<[RegExp, string[]]> = [
        [/^(ошпаз|повар|chef|cook|кулинар)/, ['хуроки', 'каннод', 'тарабхона']],
        [/^(нонпаз|кондитер|каннод|baker)/, ['каннод', 'нони']],
    ];

    private async directStems(question: string): Promise<string[]> {
        const words = [...new Set(foldTajik(question).split(/[^а-яёa-z]+/).filter((word) => word.length >= 4 && !CareerService.QUERY_STOP.has(word)))].slice(0, 6);
        const stems: string[] = [];
        for (const word of words) {
            const profession = CareerService.PROFESSION_STEMS.find(([pattern]) => pattern.test(word.toLowerCase()));
            if (profession) {
                for (const stem of profession[1]) if (!stems.includes(stem)) stems.push(stem);
                continue;
            }
            for (let length = word.length; length >= Math.max(4, Math.ceil(word.length / 2)); length -= 1) {
                const stem = word.slice(0, length);
                const [row] = await this.careerRepository.query(
                    `SELECT EXISTS (SELECT 1 FROM career WHERE ${TAJIK_FOLD('name')} ~ ('(^|[^а-яёa-z])' || $1)) AS hit`,
                    [stem],
                );
                if (row?.hit) {
                    if (!stems.includes(stem)) stems.push(stem);
                    break;
                }
            }
        }
        return stems.slice(0, 4);
    }

    private static readonly BROAD_STEMS = new Set(
        ['тиб', 'табобат', 'муҳандис', 'иқтисод', 'омӯзгор', 'педагог', 'техник', 'технолог', 'биолог', 'санъат', 'илм']
            .map((word) => foldTajik(word)),
    );

    private static readonly ASSISTANT_ACTIONS = [
        'search', 'open_career', 'compare', 'save_career',
        'start_quiz', 'open_universities', 'nearest_universities', 'open_cluster',
        'open_report', 'open_plan', 'open_chat', 'open_favorites', 'open_about',
        'go_home', 'set_language', 'set_theme', 'set_grade', 'answer', 'choose_direction',
        'open_page', 'choose_page',
    ];

    // «Духтур шудан мехоҳам» — дар номи ихтисосҳо калимаи «духтур» нест,
    // пас барои касбҳои маъмул самтҳоро дастӣ медиҳем. Барои дигар касбҳо
    // рӯйхат аз ҷустуҷӯи база сохта мешавад.
    private static readonly DIRECTIONS: Array<{ roles: string[]; say: string; sayRu?: string; sayEn?: string; options: Array<{ label: string; name: string; ru?: string; en?: string }> }> = [
        {
            roles: ['ошпаз', 'повар', 'кулинар', 'chef', 'cook', 'нонпаз', 'каннод', 'кондитер'],
            say: 'ошпаз', sayRu: 'поваром', sayEn: 'a chef',
            options: [
                { label: 'Ошпазӣ ва хӯроки умумӣ', name: 'Технологияи маҳсулот ва ташкили хӯроки умумӣ', ru: 'Технология общественного питания', en: 'Catering technology' },
                { label: 'Нонпазӣ ва қаннодӣ', name: 'Технологияи истеҳсолоти анвои нонӣ, макаронӣ ва қаннодӣ', ru: 'Хлебопечение и кондитерство', en: 'Bakery and confectionery' },
                { label: 'Хизмати тарабхона', name: 'Хизматрасонии тарабхона ва меҳмонхонаҳо', ru: 'Ресторанный сервис', en: 'Restaurant service' },
                { label: 'Менеҷменти тарабхона', name: 'Менеҷменти тарабхона ва меҳмонхона', ru: 'Ресторанный менеджмент', en: 'Restaurant management' },
            ],
        },
        // Пеш аз «духтур»: «духтури ҳайвонот» — байтор, на табиби одам.
        {
            roles: ['байтор', 'ветеринар', 'хайвон', 'зоотех', 'vet', 'animal'],
            say: 'байтор (духтури ҳайвонот)', sayRu: 'ветеринаром', sayEn: 'a veterinarian',
            options: [
                { label: 'Тибби байторӣ', name: 'Тибби байторӣ', ru: 'Ветеринарная медицина', en: 'Veterinary medicine' },
                { label: 'Байтор-фарматсевт', name: 'Тибби байторӣ-фарматсевт', ru: 'Ветеринар-фармацевт', en: 'Veterinary pharmacist' },
                { label: 'Зоотехния', name: 'Зоотехния', ru: 'Зоотехния', en: 'Animal science' },
                { label: 'Озмоиши байтории санитарӣ', name: 'Озмоиши байтории санитарӣ', ru: 'Ветеринарно-санитарная экспертиза', en: 'Veterinary sanitary inspection' },
            ],
        },
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
                { label: 'Таъмини барномавӣ', name: 'Таъмини барномавии технологияи иттилоотӣ', ru: 'Программное обеспечение ИТ', en: 'IT software' },
                { label: 'Муҳандисии барномавӣ', name: 'Муҳандисии барномавӣ', ru: 'Программная инженерия', en: 'Software engineering' },
                { label: 'Зеҳни сунъӣ', name: 'Зеҳни сунъӣ', ru: 'Искусственный интеллект', en: 'Artificial intelligence' },
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
    private async budgetAnswer(query: string, maxFee: number, years: number, grade: number | null, lang: string) {
        const careers = await this.findRelevantCareers(query);
        if ((careers as any).isFallback || !careers.length) return null;
        const rows: Array<{ careerId: string; career: string; university: string; shortName: string | null; city: string | null; fee: number | null; paymentType: string; seats: number | null }> =
            await this.careerRepository.manager.query(
                `SELECT o."careerId", c.name AS career, u.name AS university, u."shortName", u.city, o."tuitionFee" AS fee, o."paymentType", o.seats
                 FROM career_offerings o JOIN career c ON c.id = o."careerId" JOIN universities u ON u.id = o."universityId"
                 WHERE o."careerId" = ANY($1) AND ($2::int IS NULL OR o."basedOn" = $2)`,
                [careers.slice(0, 25).map((c) => c.id), grade || null]);
        if (!rows.length) return null;
        const short = (r: { university: string; shortName: string | null }) =>
            (r.shortName && r.shortName.length < r.university.length ? r.shortName : r.university).replace(/\s*ба номи .*$/i, '').trim();
        const money = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
        const seen = new Set<string>();
        const paid = rows
            .filter((r) => r.paymentType !== 'ройгон' && Number(r.fee) > 0 && Number(r.fee) <= maxFee)
            .sort((a, b) => Number(a.fee) - Number(b.fee))
            .filter((r) => { const key = `${r.career}|${r.university}`; if (seen.has(key)) return false; seen.add(key); return true; })
            .slice(0, 3);
        const free = rows.filter((r) => r.paymentType === 'ройгон');
        const cheapest = rows.filter((r) => Number(r.fee) > 0).sort((a, b) => Number(a.fee) - Number(b.fee))[0];
        const parts: string[] = [];
        if (paid.length) {
            parts.push(`Бо ${money(maxFee)} сомонӣ дар сол ин пешниҳодҳо мувофиқанд: ${paid.map((r, i) => `${i + 1}. ${r.career}, ${short(r)}${r.city ? `, ${r.city}` : ''}, ${money(Number(r.fee))} сомонӣ дар сол`).join('. ')}.`);
        } else if (cheapest) {
            parts.push(`Пешниҳоди пулакӣ то ${money(maxFee)} сомонӣ дар сол нест. Арзонтаринаш ${cheapest.career}, ${short(cheapest)}, ${money(Number(cheapest.fee))} сомонӣ дар сол.`);
        }
        if (free.length) {
            const places = [...new Set(free.map((r) => short(r)))].slice(0, 2).join(' ва ');
            parts.push(`Ҷойҳои буҷетӣ (ройгон) низ ҳастанд: ${free.length} пешниҳод, масалан дар ${places}. Барои онҳо бали баланд лозим аст.`);
        }
        if (years > 1 && paid.length) {
            parts.push(`Агар ин пул барои ${years} сол бошад, ҳар сол тақрибан ${money(maxFee / years)} сомонӣ мерасад.`);
        }
        if (!parts.length) return null;
        const used = new Set<string>();
        const options = (paid.length ? paid : free.slice(0, 3))
            .filter((r) => !used.has(r.careerId) && used.add(r.careerId))
            .map((r) => ({ id: r.careerId, name: r.career, label: `${r.career} · ${short(r)}`.slice(0, 60) }));
        parts.push('Кадомашро кушоям?');
        return { reply: parts.join(' '), action: 'choose_direction', params: { role: query, options }, answerLang: lang };
    }

    private async nearestToPoint(point: { lat: number; lng: number }, careerName: string, grade: number | null, lang: string) {
        let careerIds: string[] = [];
        let careerLabel = '';
        if (careerName.length >= 3) {
            const career = await this.resolveCareer(careerName);
            if (career) {
                const same: Array<{ id: string }> = await this.careerRepository.manager.query('SELECT id FROM career WHERE name = $1', [career.name]);
                careerIds = same.map((row) => row.id);
                careerLabel = career.name;
            }
        }
        const rows: Array<{ id: string; name: string; shortName: string | null; city: string | null; latitude: number; longitude: number; careers: string; fee: number | null; free: boolean }> =
            await this.careerRepository.manager.query(
                `SELECT u.id, u.name, u."shortName", u.city, u.latitude, u.longitude,
                        (SELECT count(*) FROM career_universities cu WHERE cu."universitiesId" = u.id) AS careers,
                        min(o."tuitionFee") FILTER (WHERE o."tuitionFee" > 0) AS fee,
                        coalesce(bool_or(o."paymentType" = 'ройгон'), false) AS free
                 FROM universities u
                 LEFT JOIN career_offerings o ON o."universityId" = u.id AND ($1::uuid[] IS NULL OR o."careerId" = ANY($1)) AND ($2::int IS NULL OR o."basedOn" = $2)
                 WHERE u.latitude IS NOT NULL AND u.longitude IS NOT NULL AND u."hasExactLocation" = true
                 GROUP BY u.id
                 HAVING $1::uuid[] IS NULL OR count(o.id) > 0`,
                [careerIds.length ? careerIds : null, grade || null]);
        if (!rows.length) {
            return careerLabel
                ? { reply: `Ихтисоси «${careerLabel}»-ро дар харита ёфта натавонистам.`, action: 'answer', params: {}, answerLang: lang }
                : null;
        }
        const rad = (deg: number) => (Number(deg) * Math.PI) / 180;
        const km = (u: { latitude: number; longitude: number }) => {
            const dLat = rad(u.latitude - point.lat);
            const dLng = rad(u.longitude - point.lng);
            const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(point.lat)) * Math.cos(rad(u.latitude)) * Math.sin(dLng / 2) ** 2;
            return 6371 * 2 * Math.asin(Math.sqrt(h));
        };
        const nearest = rows.map((u) => ({ ...u, km: km(u) })).sort((a, b) => a.km - b.km).slice(0, 3);
        const short = (u: { name: string; shortName: string | null }) => (u.shortName && u.shortName.length < u.name.length ? u.shortName : u.name).replace(/\s*ба номи .*$/i, '').trim();
        const dist = (value: number) => (value < 1 ? `${Math.round(value * 1000)} метр` : `${value < 10 ? value.toFixed(1).replace('.', ',') : Math.round(value)} километр`);
        const money = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
        const detail = (u: typeof nearest[number]) => careerLabel
            ? (u.free ? 'ҷои буҷетӣ ҳаст' : u.fee ? `${money(Number(u.fee))} сомонӣ дар сол` : '')
            : `${u.careers} ихтисос`;
        const list = nearest.map((u, i) => `${i + 1}. ${short(u)}, ${dist(u.km)}${detail(u) ? `, ${detail(u)}` : ''}`).join('. ');
        const head = careerLabel ? `Ихтисоси «${careerLabel}» ба шумо наздиктар дар инҳост:` : 'Ба шумо наздиктарин инҳоянд:';
        return {
            reply: `${head} ${list}. Кадомашро кушоям?`,
            action: 'choose_university',
            params: { options: nearest.map((u) => ({ id: u.id, name: u.name, label: short(u), kind: 'university' })) },
            answerLang: lang,
        };
    }

    // Ихтисорҳои маъмул, ки дар база нестанд.
    private static readonly UNI_ALIASES: Array<[RegExp, string]> = [
        [/(^|[^а-я])дмт([^а-я]|$)/, 'миллии точикистон'],
        [/(^|[^а-я])дтт([^а-я]|$)/, 'техникии точикистон'],
        [/(^|[^а-я])ддмит([^а-я]|$)/, 'молия ва иктисод'],
        [/(^|[^а-я])ддот([^а-я]|$)/, 'омузгории точикистон'],
        [/(^|[^а-я])дди([^а-я]|$)/, 'тиббии точикистон'],
    ];

    private async nearUniversities(nearName: string, message: string, grade: number | null, lang: string) {
        let folded = foldTajik(nearName).toLowerCase();
        const alias = CareerService.UNI_ALIASES.find(([pattern]) => pattern.test(folded));
        if (alias) folded = alias[1];
        const rows: Array<{ id: string; name: string }> = await this.careerRepository.manager.query(
            `SELECT u.id, u.name FROM universities u
             WHERE ${TAJIK_FOLD('u.name')} LIKE $1 OR ${TAJIK_FOLD(`coalesce(u."shortName", '')`)} LIKE $1
             ORDER BY (SELECT count(*) FROM career_universities cu WHERE cu."universitiesId" = u.id) DESC LIMIT 1`,
            [`%${folded}%`]);
        const anchorRef = rows[0] || await this.findUniversityFuzzy(alias ? folded : nearName);
        if (!anchorRef) return null;
        const all: Array<{ id: string; name: string; shortName: string | null; city: string | null; latitude: number | null; longitude: number | null; careers: string }> =
            await this.careerRepository.manager.query(
                `SELECT u.id, u.name, u."shortName", u.city, u.latitude, u.longitude,
                        (SELECT count(*) FROM career_universities cu WHERE cu."universitiesId" = u.id) AS careers
                 FROM universities u WHERE u.latitude IS NOT NULL AND u.longitude IS NOT NULL AND u."hasExactLocation" = true`);
        const anchor = all.find((u) => u.id === anchorRef.id);
        if (!anchor) return null;
        // «Коллеҷ» гуфт — коллеҷҳо; «донишгоҳ» ё синфи 11 — муассисаҳои олӣ; синфи 9 — танҳо коллеҷҳо.
        const foldedMessage = foldTajik(message).toLowerCase();
        const wantsCollege = grade === 9 || /коллеч|колледж|college/.test(foldedMessage.replace(folded, ''));
        const isCollege = (name: string) => /коллеч|колледж/i.test(foldTajik(name));
        const rad = (deg: number) => (Number(deg) * Math.PI) / 180;
        const km = (a: any, b: any) => {
            const dLat = rad(b.latitude - a.latitude);
            const dLng = rad(b.longitude - a.longitude);
            const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
            return 6371 * 2 * Math.asin(Math.sqrt(h));
        };
        const nearest = all
            .filter((u) => u.id !== anchor.id && (wantsCollege ? isCollege(u.name) : !isCollege(u.name)))
            .map((u) => ({ ...u, km: km(anchor, u) }))
            .filter((u) => u.km <= 15)
            .sort((a, b) => a.km - b.km)
            .slice(0, 4);
        const short = (u: { name: string; shortName: string | null }) => (u.shortName && u.shortName.length < u.name.length ? u.shortName : u.name)
            .replace(/\s*ба номи .*$/i, '').trim();
        const dist = (value: number) => (value < 1 ? `${Math.round(value * 1000)} метр` : `${value.toFixed(1).replace('.', ',')} километр`);
        const anchorName = short(anchor);
        if (!nearest.length) {
            return { reply: `Дар наздикии ${anchorName} муассисаи дигар ёфт нашуд.`, action: 'answer', params: {}, answerLang: lang };
        }
        const list = nearest.map((u, i) => `${i + 1}. ${short(u)}, ${dist(u.km)}, ${u.careers} ихтисос`).join('. ');
        const options = nearest.map((u) => ({ id: u.id, name: u.name, label: short(u), kind: 'university' }));
        return {
            reply: `Ба ${anchorName} наздиктарин инҳоянд: ${list}. Кадомашро кушоям?`,
            action: 'choose_university',
            params: { near: anchor.name, options },
            answerLang: lang,
        };
    }

    private static readonly UNI_CAREER_STOP = new Set(['донишгох', 'донишгохе', 'донишгоххо', 'донишгоххое', 'ихтисос', 'ихтисоси', 'ихтисосе',
        'дорад', 'доранд', 'мехохам', 'нигох', 'дустам', 'кадом', 'коллеч', 'коллечхо', 'хонам', 'мехонанд', 'университет', 'специальность',
        'бинам', 'нишон', 'кушо', 'кадомхо', 'барои', 'мумкин', 'хаст', 'хастанд', 'мехонанд', 'омузонанд', 'учат', 'учиться', 'which', 'university',
        'college', 'colleges', 'universities', 'teach', 'study', 'каком', 'колледж', 'специальности', 'муассиса']);

    private async universitiesForCareer(careerText: string, grade: number | null, lang: string, kind: '' | 'college' | 'higher' = '') {
        const words = foldTajik(careerText).toLowerCase().split(/[^a-zа-яё]+/i)
            .filter((word) => word.length >= 5 && !CareerService.UNI_CAREER_STOP.has(word));
        // Решаи 6 ҳарф: «барномасозиро» → «барном» (дар «Таъмини барномавӣ» ҳам ҳаст).
        const stems = [...new Set(words.map((word) => word.slice(0, 6)))].slice(0, 4);
        if (!stems.length) return null;
        const rows: Array<{ id: string; name: string; shortName: string | null; city: string | null; careers: number; free: boolean; fee: number | null; sample: string }> =
            await this.careerRepository.manager.query(
                `SELECT u.id, u.name, u."shortName", u.city,
                        count(DISTINCT c.name)::int AS careers,
                        coalesce(bool_or(o."paymentType" = 'ройгон'), false) AS free,
                        min(o."tuitionFee") FILTER (WHERE o."tuitionFee" > 0) AS fee,
                        min(c.name) AS sample
                 FROM career_offerings o
                 JOIN career c ON c.id = o."careerId"
                 JOIN universities u ON u.id = o."universityId"
                 WHERE ${TAJIK_FOLD('c.name')} LIKE ANY($1) AND ($2::int IS NULL OR o."basedOn" = $2)
                   AND ($3 = '' OR ($3 = 'college') = (${TAJIK_FOLD('u.name')} LIKE '%коллеч%'))
                 GROUP BY u.id
                 ORDER BY careers DESC, free DESC, u.name
                 LIMIT 4`,
                [stems.map((stem) => `%${stem}%`), grade || null, kind]);
        if (!rows.length) return null;
        const short = (u: { name: string; shortName: string | null }) => (u.shortName && u.shortName.length < u.name.length ? u.shortName : u.name).replace(/\s*ба номи .*$/i, '').trim();
        const money = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
        const list = rows.map((u, i) => {
            const bits = [u.city || '', u.careers > 1 ? `${u.careers} ихтисос` : `«${u.sample}»`, u.free ? 'ҷои буҷетӣ ҳаст' : u.fee ? `${money(Number(u.fee))} сомонӣ дар сол` : ''].filter(Boolean);
            return `${i + 1}. ${short(u)}, ${bits.join(', ')}`;
        }).join('. ');
        const reply = lang === 'ru'
            ? `Эту специальность предлагают: ${list}. Какой открыть?`
            : lang === 'en'
                ? `These places offer it: ${list}. Which one shall I open?`
                : `Ин ихтисосро инҳо доранд: ${list}. Кадомашро кушоям?`;
        return {
            reply,
            action: 'choose_university',
            params: { options: rows.map((u) => ({ id: u.id, name: u.name, label: short(u), kind: 'university' })) },
            answerLang: lang,
        };
    }

    private static readonly PAIR_FILLER = new Set(['хуб', 'аст', 'бехтар', 'беҳтар', 'кадомаш', 'кадом', 'дустам', 'ман', 'ба', 'барои', 'ки', 'ё', 'е', 'или',
        'лучше', 'хороший', 'хорошая', 'better', 'is', 'or', 'which', 'гуфтам', 'мукоиса', 'кун', 'фарк', 'чи', 'дорад', 'нигох', 'бигу', 'шумо', 'ту',
        'мехонам', 'дароям', 'хонам', 'бехтараш', 'хубтар', 'хубаш', 'точики', 'сравни', 'vs', 'аз', 'хамин', 'ин', 'он']);

    // Ду муассисаи гуфташуда: «Донишгоҳи сайёҳӣ ва соҳибкорӣ хуб аст ё техникӣ?», «ДМТ или ДТТ».
    private async detectUniversityPair(text: string): Promise<Array<{ id: string; name: string; city: string | null }> | null> {
        const folded = foldTajik(text).toLowerCase();
        if (!/донишгох|донишкад|коллеч|колледж|университет|вуз|академ|институт|дмт|дтт|ддот|ддмит|дди|univers|college/.test(folded)) return null;
        if (!/(^|\s)(ё|е|или|or|vs)(\s|$)|мукоиса|фарк|сравн|бехтар|лучше|better|хубтар/.test(folded)) return null;
        const parts = folded.split(/\s(?:ё|е|или|or|vs|ё ки)\s|[,;]|\sё\s?/).map((part) => part.trim()).filter(Boolean);
        const found: Array<{ id: string; name: string; city: string | null }> = [];
        for (const part of parts) {
            let cleaned = part;
            const alias = CareerService.UNI_ALIASES.find(([pattern]) => pattern.test(` ${cleaned} `));
            if (alias) cleaned = alias[1];
            cleaned = cleaned.split(/[^a-zа-яё]+/i).filter((word) => word.length >= 3 && !CareerService.PAIR_FILLER.has(word)).join(' ');
            if (cleaned.length < 4) continue;
            const uni = await this.findUniversityFuzzy(cleaned);
            if (uni && !found.some((f) => f.id === uni.id)) found.push(uni);
            if (found.length === 3) break;
        }
        return found.length >= 2 ? found : null;
    }

    private async compareUniversities(pair: Array<{ id: string; name: string; city: string | null }>, purpose: string, history: Array<{ q: string; a: string }>, lang: string, grade: number | null) {
        const ids = pair.map((u) => u.id);
        const rows: Array<{ id: string; name: string; city: string | null; isState: boolean; careers: number; free: number; minFee: number | null; maxFee: number | null }> =
            await this.careerRepository.manager.query(
                `SELECT u.id, u.name, u.city, u."isState",
                        count(DISTINCT o."careerId")::int AS careers,
                        count(*) FILTER (WHERE o."paymentType" = 'ройгон')::int AS free,
                        min(o."tuitionFee") FILTER (WHERE o."tuitionFee" > 0) AS "minFee",
                        max(o."tuitionFee") FILTER (WHERE o."tuitionFee" > 0) AS "maxFee"
                 FROM universities u LEFT JOIN career_offerings o ON o."universityId" = u.id AND ($2::int IS NULL OR o."basedOn" = $2)
                 WHERE u.id = ANY($1) GROUP BY u.id`, [ids, grade || null]);
        // Мақсад («барои барномасозӣ»): решаҳои калимаҳо → ихтисосҳои ҳамон соҳа дар ҳар муассиса.
        const stems = [...new Set(foldTajik(purpose).toLowerCase().split(/[^a-zа-яё]+/i)
            .filter((word) => word.length >= 5 && !CareerService.UNI_CAREER_STOP.has(word) && !CareerService.PAIR_FILLER.has(word) && !CareerService.UNI_STOP.has(word))
            .filter((word) => !pair.some((u) => foldTajik(u.name).toLowerCase().includes(word.slice(0, 6))))
            .map((word) => word.slice(0, 6)))].slice(0, 3);
        // Соҳаҳои наздик: «барномасозӣ» — информатика ва компютер ҳам; «духтур» — тиб.
        const RELATED: Record<string, string[]> = { барном: ['информ', 'компют'], програ: ['барном', 'информ', 'компют'], духтур: ['тибб', 'табоб'], врач: ['тибб', 'табоб'], тибби: ['табоб'] };
        const userStems = [...stems];
        for (const stem of [...stems]) for (const extra of RELATED[stem] || []) if (!stems.includes(extra)) stems.push(extra);
        const matches: Array<{ universityId: string; name: string; free: boolean; fee: number | null }> = stems.length
            ? await this.careerRepository.manager.query(
                `SELECT o."universityId", c.name, bool_or(o."paymentType" = 'ройгон') AS free, min(o."tuitionFee") FILTER (WHERE o."tuitionFee" > 0) AS fee
                 FROM career_offerings o JOIN career c ON c.id = o."careerId"
                 WHERE o."universityId" = ANY($1) AND ${TAJIK_FOLD('c.name')} LIKE ANY($2) AND ($3::int IS NULL OR o."basedOn" = $3)
                 GROUP BY o."universityId", c.name ORDER BY c.name`, [ids, stems.map((stem) => `%${stem}%`), grade || null])
            : [];
        const money = (n: any) => (n ? `${Math.round(Number(n)).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')} сомонӣ` : '—');
        const facts = pair.map((u) => {
            const r = rows.find((row) => row.id === u.id);
            const own = matches.filter((m) => m.universityId === u.id);
            return [
                `- ${u.name} (${r?.city || u.city || ''}; ${r?.isState ? 'давлатӣ' : 'ғайридавлатӣ'}): ${r?.careers ?? 0} ихтисос, ${r?.free ?? 0} пешниҳоди буҷетӣ, нархи пулакӣ ${money(r?.minFee)} – ${money(r?.maxFee)} дар сол.`,
                stems.length ? `  Ихтисосҳо аз рӯи мақсади корбар: ${own.length ? own.slice(0, 5).map((m) => `${m.name}${m.free ? ' (буҷетӣ ҳаст)' : m.fee ? ` (${money(m.fee)})` : ''}`).join('; ') : 'НЕСТ'}` : '',
            ].filter(Boolean).join('\n');
        });
        const short = (name: string) => name.replace(/\s*ба номи .*$/i, '').replace(/\s*Тоҷикистон$/i, '').trim();
        const options = pair.map((u) => ({ id: u.id, name: u.name, label: short(u.name).slice(0, 50), kind: 'university' }));
        // Мақсад маълум — ҷавоб бе AI, рост аз база: AI ихтисосҳои ду донишгоҳро омехта мекард.
        if (stems.length) {
            const place = (u: { id: string; name: string }) => {
                const r = rows.find((row) => row.id === u.id);
                // Аввал ихтисосҳое, ки калимаи худи корбарро доранд («барном»), баъд наздикҳо («информ»).
                const primary = userStems;
                const own = matches.filter((m) => m.universityId === u.id)
                    .sort((a, b) => Number(primary.some((st) => foldTajik(b.name).toLowerCase().includes(st))) - Number(primary.some((st) => foldTajik(a.name).toLowerCase().includes(st))));
                if (!own.length) return { u, own, text: `${short(u.name)}: ихтисоси ин соҳа нест` };
                const names = own.slice(0, 2).map((m) => m.name.replace(/\s*\(.*?\)\s*$/, '')).join(', ');
                const free = own.some((m) => m.free);
                return { u, own, text: `${short(u.name)}: ${names}${own.length > 2 ? ` ва боз ${own.length - 2}` : ''}, ${free ? 'ҷойи буҷетӣ ҳаст' : 'танҳо пулакӣ'}${r?.maxFee ? `, пулакӣ то ${money(r.maxFee)}` : ''}` };
            };
            const info = pair.map(place);
            const having = info.filter((x) => x.own.length);
            const verdict = having.length === 0
                ? 'Дар ҳеҷ кадомаш ин ихтисос нест.'
                : having.length === 1
                    ? `Барои ин мақсад ${short(having[0].u.name)} мувофиқ аст.`
                    : (() => {
                        const best = [...having].sort((a, b) => Number(b.own.some((m) => m.free)) - Number(a.own.some((m) => m.free)) || b.own.length - a.own.length)[0];
                        const tie = having.every((x) => x.own.length === best.own.length && x.own.some((m) => m.free) === best.own.some((m) => m.free));
                        return tie ? 'Ҳарду барои ин мақсад мувофиқанд.' : `Ҳарду мувофиқанд; дар ${short(best.u.name)} интихоб бештар аст.`;
                    })();
            if (lang === 'tj') {
                return { reply: `${info.map((x) => x.text).join('. ')}. ${verdict} Кадомашро кушоям?`, action: 'choose_university', params: { options }, answerLang: lang };
            }
        }

        const langName = lang === 'ru' ? 'русӣ' : lang === 'en' ? 'англисӣ' : 'тоҷикӣ';
        const nl = String.fromCharCode(10);
        const prompt = [
            'Ту мушовири касбии ростқавли сомонаи «Ихтисоси ман» ҳастӣ. Корбар ду (ё се) муассисаро муқоиса мекунад.',
            `Ҷавоб ҲАТМАН бо забони ${langName}, 2–4 ҷумлаи кӯтоҳ, то 70 калима, бе markdown ва бе рӯйхати рақамдор. Номҳоро кӯтоҳ гӯй.`,
            'Танҳо аз ДАЛЕЛҲО истифода бар; рақамро аз худ насоз. Ҳеҷ муассисаро «бад» нагӯй.',
            stems.length
                ? 'Корбар мақсадашро гуфт: бигӯ, ки кадом муассиса барои ҳамин мақсад мувофиқтар аст ва чаро (буҷет, нарх). ҲАМАИ ихтисосҳое, ки дар «Ихтисосҳо аз рӯи мақсади корбар» номбар шудаанд, ба мақсад МУВОФИҚАНД — 1–2-тояшро бо ном гӯй. «Надорад» танҳо вақте гӯй, ки дар он ҷо «НЕСТ» навишта шудааст.'
                : 'Корбар мақсадашро нагуфт. Ду-се фарқи асосиро аз далелҳо гӯй (соҳаи асосӣ, андоза, буҷет ва нарх) ва дар охир ҲАТМАН бипурс: «Шумо кадом ихтисосро хондан мехоҳед?» — то муқоисаи дақиқ кунӣ.',
            'ДАЛЕЛҲО:',
            ...facts,
            history.length ? 'СӮҲБАТИ ПЕШТАРА:' : '',
            ...history.slice(-4).map((turn) => `Корбар: ${turn.q}${nl}Ёвар: ${turn.a}`),
            `САВОЛИ КОРБАР: ${purpose}`,
            'Танҳо JSON: {"reply": "ҷавоб"}',
        ].filter(Boolean).join(nl);
        let reply = '';
        try {
            const raw = await this.aiService.generateFast(prompt, 7000);
            const match = String(raw || '').match(/\{[\s\S]*\}/);
            reply = match ? String(JSON.parse(match[0])?.reply || '') : '';
        } catch {
            reply = '';
        }
        reply = reply.replace(/[*#_`]/g, '').trim().slice(0, 600);
        if (reply.length < 10) {
            // Бе AI: далелҳои кӯтоҳ ва саволи дақиқкунанда.
            const line = pair.map((u) => {
                const r = rows.find((row) => row.id === u.id);
                return `${short(u.name)}: ${r?.careers ?? 0} ихтисос, ${r?.free ?? 0} пешниҳоди буҷетӣ`;
            }).join('; ');
            reply = lang === 'ru' ? `${line}. Какую специальность вы хотите изучать?` : lang === 'en' ? `${line}. Which specialty do you want to study?` : `${line}. Шумо кадом ихтисосро хондан мехоҳед?`;
        }
        return { reply, action: 'choose_university', params: { options }, answerLang: lang };
    }

    private static readonly CITY_FILLER = new Set(['фикри', 'фикрат', 'омузанд', 'меомузанд', 'мехонанд', 'хонанд', 'хонам', 'хонед', 'бехтар', 'хубтар',
        'хонаи', 'хонаам', 'хонаи', 'зиндаги', 'мекунам', 'мекунем', 'зиндагии', 'хамин', 'ихтисосро', 'ихтисоси', 'ихтисос', 'нигох', 'дустам', 'хамчун']);

    private async careerInCities(message: string, cities: string[], grade: number | null, lang: string) {
        const cityWords = CareerService.CITY_NAMES.flatMap(([, aliases]) => aliases.map((alias) => alias.slice(0, 5)));
        const words = foldTajik(message).toLowerCase().split(/[^a-zа-яё]+/i)
            .filter((word) => word.length >= 5 && !cityWords.some((c) => word.startsWith(c))
                && !CareerService.UNI_CAREER_STOP.has(word) && !CareerService.PAIR_FILLER.has(word) && !CareerService.CITY_FILLER.has(word) && !CareerService.UNI_STOP.has(word));
        const userStems = [...new Set(words.map((word) => word.slice(0, 6)))].slice(0, 3);
        if (!userStems.length) return null;
        const RELATED: Record<string, string[]> = { барном: ['информ', 'компют'], програ: ['барном', 'информ', 'компют'], духтур: ['тибб', 'табоб'], врач: ['тибб', 'табоб'] };
        const stems = [...userStems];
        for (const stem of userStems) for (const extra of RELATED[stem] || []) if (!stems.includes(extra)) stems.push(extra);
        const rows: Array<{ id: string; name: string; shortName: string | null; city: string; careers: number; free: boolean; fee: number | null; sample: string; direct: boolean }> =
            await this.careerRepository.manager.query(
                `SELECT u.id, u.name, u."shortName", u.city,
                        count(DISTINCT c.name)::int AS careers,
                        coalesce(bool_or(o."paymentType" = 'ройгон'), false) AS free,
                        min(o."tuitionFee") FILTER (WHERE o."tuitionFee" > 0) AS fee,
                        min(c.name) AS sample,
                        bool_or(${TAJIK_FOLD('c.name')} LIKE ANY($4)) AS direct
                 FROM career_offerings o JOIN career c ON c.id = o."careerId" JOIN universities u ON u.id = o."universityId"
                 WHERE u.city = ANY($1) AND ${TAJIK_FOLD('c.name')} LIKE ANY($2) AND ($3::int IS NULL OR o."basedOn" = $3)
                 GROUP BY u.id ORDER BY direct DESC, careers DESC, free DESC`,
                [cities, stems.map((stem) => `%${stem}%`), grade || null, userStems.map((stem) => `%${stem}%`)]);
        const short = (u: { name: string; shortName: string | null }) => (u.shortName && u.shortName.length < u.name.length ? u.shortName : u.name).replace(/\s*ба номи .*$/i, '').trim();
        const money = (n: number) => Math.round(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
        const parts: string[] = [];
        const shown: typeof rows = [];
        for (const city of cities) {
            const here = rows.filter((r) => r.city === city).slice(0, 2);
            if (!here.length) { parts.push(`Дар ${city} ин ихтисос нест`); continue; }
            shown.push(...here);
            parts.push(`Дар ${city}: ${here.map((u) => `${short(u)} (${u.careers > 1 ? `${u.careers} ихтисос` : u.sample}${u.free ? ', буҷетӣ ҳаст' : u.fee ? `, ${money(Number(u.fee))} сомонӣ` : ''})`).join('; ')}`);
        }
        if (!shown.length) {
            // Дар шаҳри гуфташуда нест — рост мегӯем ва ҷойҳои дигарро нишон медиҳем.
            const elsewhere = await this.universitiesForCareer(userStems.join(' ') + ' ' + message, grade, lang);
            if (!elsewhere || lang !== 'tj') return null;
            return { ...elsewhere, reply: `Дар ${cities.join(' ва ')} ин ихтисос нест. ${elsewhere.reply.replace(/^Ин ихтисосро инҳо доранд:/, 'Онро инҳо доранд:')}` };
        }
        const count = (city: string) => rows.filter((r) => r.city === city).length;
        let verdict = '';
        if (cities.length >= 2) {
            const [a, b] = [...cities].sort((x, y) => count(y) - count(x));
            verdict = count(a) > count(b) ? ` Дар ${a} интихоб бештар аст${count(b) ? `, аммо дар ${b} ҳам мехонанд` : ''}.` : ' Дар ҳарду шаҳр имконият ҳаст.';
        }
        const reply = `${parts.join('. ')}.${verdict} Кадомашро кушоям?`;
        if (lang !== 'tj') return null;
        return {
            reply,
            action: 'choose_university',
            params: { options: shown.slice(0, 5).map((u) => ({ id: u.id, name: u.name, label: `${short(u)} · ${u.city}`.slice(0, 60), kind: 'university' })) },
            answerLang: lang,
        };
    }

    private async careerFactsAnswer(careerName: string, message: string, history: Array<{ q: string; a: string }>, lang: string) {
        const career = await this.resolveCareer(careerName);
        if (!career) return null;
        const [offers] = await this.careerRepository.manager.query(
            `SELECT count(DISTINCT "universityId")::int AS places, count(*) FILTER (WHERE "paymentType" = 'ройгон')::int AS free
             FROM career_offerings WHERE "careerId" = $1`, [career.id]).catch(() => [null]);
        const [future] = await this.careerRepository.manager.query(
            `SELECT content FROM career_future WHERE "careerId" = $1 ORDER BY (lang = 'tj') DESC LIMIT 1`, [career.id]).catch(() => [null]);
        const f = future?.content;
        const sal: any = (career as any).salaryAndMarket;
        const facts = [
            `Ихтисос: ${career.name}`,
            career.description ? `Тавсиф: ${String(career.description).slice(0, 400)}` : '',
            (career as any).careerOpportunities?.length ? `Ҷойҳои кор: ${[].concat((career as any).careerOpportunities).slice(0, 6).join(', ')}` : '',
            sal?.junior ? `Маош тахминӣ: навкор ${sal.junior}, ботаҷриба ${sal.mid || '—'}, баланд ${sal.senior || '—'}` : '',
            offers?.places ? `Таҳсил: ${offers.places} муассиса, ${offers.free} пешниҳоди буҷетӣ` : '',
            f?.riskText ? `Тамоюл дар 10 соли оянда (пешгӯии AI, на факт): ${f.riskText}` : '',
            f?.human?.length ? `Корҳое, ки қадрашон меафзояд: ${f.human.join('; ')}` : '',
        ].filter(Boolean).join(String.fromCharCode(10));
        const langName = lang === 'ru' ? 'русӣ' : lang === 'en' ? 'англисӣ' : 'тоҷикӣ';
        const prompt = [
            'Ту мушовири касбии ростқавли сомонаи «Ихтисоси ман» ҳастӣ. Ба саволи корбар дар бораи ЯК ихтисос мустақим ҷавоб деҳ.',
            `Ҷавоб ҲАТМАН бо забони ${langName}, 2–3 ҷумла, то 60 калима, бе markdown. Танҳо аз ДАЛЕЛҲО; рақамро аз худ насоз. Пешгӯиро «тахминӣ» гӯй.`,
            'ДАЛЕЛҲО:', facts,
            ...history.slice(-3).map((turn) => `Корбар: ${turn.q} / Ёвар: ${turn.a}`),
            `САВОЛ: ${message}`,
            'Танҳо JSON: {"reply": "ҷавоб"}',
        ].join(String.fromCharCode(10));
        let reply = '';
        try {
            const raw = await this.aiService.generateFast(prompt, 7000);
            const match = String(raw || '').match(/\{[\s\S]*\}/);
            reply = match ? String(JSON.parse(match[0])?.reply || '') : '';
        } catch {
            reply = '';
        }
        reply = reply.replace(/[*#_`]/g, '').trim().slice(0, 500);
        if (reply.length < 10) return null;
        return { reply, action: 'choose_direction', params: { options: [{ id: career.id, name: career.name, label: career.name }] }, answerLang: lang };
    }

    private async topCareersAnswer(lang: string) {
        const rows: Array<{ id: string; name: string; score: number; year: number }> = await this.careerRepository.manager.query(
            `SELECT DISTINCT ON (c.name) c.id, c.name, a.score, a.year FROM admission_scores a
             JOIN career c ON trim(c.code) = trim(a.code)
             WHERE a.year = (SELECT max(year) FROM admission_scores) AND a.score > 0
             ORDER BY c.name, a.score DESC`);
        const top = rows.sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 5);
        if (!top.length) return null;
        const year = top[0].year;
        const list = top.map((r, i) => `${i + 1}. ${r.name}, ${Math.round(Number(r.score))} бал`).join('. ');
        const reply = lang === 'ru'
            ? `По проходному баллу НЦТ ${year} года впереди: ${list}. Какую открыть?`
            : lang === 'en'
                ? `By the ${year} NTC passing score, the top ones are: ${list}. Which shall I open?`
                : `Аз рӯи бали гузариши ММТ дар соли ${year} инҳо дар ҷои аввал буданд: ${list}. Ин рақобати баланд аст. Кадомашро кушоям?`;
        return {
            reply,
            action: 'choose_direction',
            params: { options: top.map((r) => ({ id: r.id, name: r.name, label: r.name })) },
            answerLang: lang,
        };
    }

    private static asksAboutOptions(message: string): boolean {
        const text = ` ${foldTajik(message).toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim()} `;
        return /инхо|онхо|кадомаш|кадомаш|кадомаш|кадом|маош|моош|моши|музд|фарк|маълумот|чи кор|дар бораи|фахмон|гап зан|бехтар|which|salary|differ|explain|зарплат|какая|какой|чем отлич|расскажи|объясни|лучше/.test(text);
    }

    private async aboutOptions(message: string, options: Array<{ id: string; name: string; label?: string }>, history: Array<{ q: string; a: string }>, lang: string) {
        const rows: Array<{ id: string; name: string; salary: any; description: string | null; unis: string }> = await this.careerRepository.manager.query(
            `SELECT c.id, c.name, c."salaryAndMarket" AS salary, left(c.description, 300) AS description,
                    (SELECT count(*) FROM career_universities cu WHERE cu."careerId" = c.id) AS unis
             FROM career c WHERE c.id = ANY($1)`, [options.map((o) => o.id)]);
        if (!rows.length) return null;
        const facts = options.map((o) => rows.find((r) => r.id === o.id)).filter(Boolean).map((r: any) =>
            `- ${r.name}: ${String(r.description || '').split(/(?<=[.!?])\s/)[0]} Маош: аввал ${r.salary?.junior || '?'}, миёна ${r.salary?.mid || '?'}, баланд ${r.salary?.senior || '?'}. Муассисаҳо: ${r.unis}.`);
        const langName = lang === 'ru' ? 'русӣ' : lang === 'en' ? 'англисӣ' : 'тоҷикӣ';
        const nl = String.fromCharCode(10);
        const prompt = [
            'Ту мушовири касбии меҳрубони сомонаи «Ихтисоси ман» ҳастӣ. Корбар дар бораи самтҳое мепурсад, ки ҳозир ба ӯ пешниҳод шуданд.',
            `Ҷавоб ҲАТМАН бо забони ${langName}, 2–4 ҷумлаи кӯтоҳ, то 60 калима (овоз мехонад), бе markdown ва бе рӯйхати рақамдор.`,
            'Танҳо аз ДАЛЕЛҲО истифода бар; рақами маошро аз худ насоз. Агар маош пурсад — аз баланд ба паст муқоиса кун. Агар гӯяд, ки маълумот надорад — ҳар самтро бо як ибораи содда шарҳ деҳ. Дар охир бипурс, ки кадомашро кушояд. Салом нагӯ — сӯҳбат аллакай идома дорад.',
            'ДАЛЕЛҲО:',
            ...facts,
            history.length ? 'СӮҲБАТИ ПЕШТАРА:' : '',
            ...history.map((turn) => `Корбар: ${turn.q}${nl}Ёвар: ${turn.a}`),
            'САВОЛИ ҲОЗИРА:',
            message,
            'Танҳо JSON: {"reply": "ҷавоб"}',
        ].filter(Boolean).join(nl);
        let reply = '';
        try {
            const raw = await this.aiService.generateFast(prompt, 7000);
            const match = String(raw || '').match(/\{[\s\S]*\}/);
            reply = match ? String(JSON.parse(match[0])?.reply || '') : '';
        } catch {
            reply = '';
        }
        reply = reply.replace(/[*#_`]/g, '').trim().slice(0, 500);
        if (reply.length < 10) return null;
        return { reply, action: 'choose_direction', params: { options }, answerLang: lang };
    }

    private static refusesTest(message: string): boolean {
        const text = ` ${foldTajik(message).toLowerCase().replace(/[^a-zа-яё0-9\s']/gi, ' ').replace(/\s+/g, ' ').trim()} `;
        if (!/тест|санчиш|test|quiz|опрос/.test(text)) return false;
        return / (намехох\S*|нахох\S*|намегузар\S*|намесупор\S*|нагузар\S*|не хочу|не хотим|не надо|не буду|не нужен|не нужно|не хочется|без теста|лозим нест|даркор нест|кор надорам|don't|dont|do not|no test|without) /.test(text)
            || (/^ (нет|не|no|nope|на) /.test(text) && / (другой|дигар|other|another|иной) /.test(text));
    }

    private static otherChecks(lang: string) {
        const reply = lang === 'ru'
            ? 'Хорошо, без теста. Можно пройти «Карьер-свайп» — листайте карточки работы, или «Попробуйте себя в профессии» — короткие задания. Что открыть?'
            : lang === 'en'
                ? 'Okay, no test. You can try Career Swipe — swipe work cards, or Try the job — short real tasks. Which one shall I open?'
                : 'Хуб, бе тест. Метавонед «Касб-свайп»-ро бозӣ кунед — кортҳои корро варақ мезанед, ё «Худро дар касб санҷед» — супоришҳои кӯтоҳи воқеӣ. Кадомашро кушоям?';
        const label = (tj: string, ru: string, en: string) => (lang === 'ru' ? ru : lang === 'en' ? en : tj);
        return {
            reply,
            action: 'choose_page',
            params: {
                options: [
                    { id: 'page:swipe', name: 'Касб-свайп свайп swipe', label: label('Касб-свайп', 'Карьер-свайп', 'Career Swipe'), kind: 'page', path: '/swipe' },
                    { id: 'page:trial', name: 'Худро дар касб санчед супориш задания trial', label: label('Худро дар касб санҷед', 'Попробуйте себя', 'Try the job'), kind: 'page', path: '/trial' },
                ],
            },
            answerLang: lang,
        };
    }

    // Саволи маслиҳатӣ ва шахсӣ: на фармон («кушо», «нишон деҳ»), балки «чӣ кунам», «беҳтар», «хориҷ» ва ғ.
    private static wantsAdvice(message: string): boolean {
        const text = ` ${foldTajik(message).toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim()} `;
        if (/\d/.test(text) || /намефахм|нафахмид|не понима|не понял|understand/.test(text)) return false;
        if (text.trim().split(' ').length < 4) return false;
        if (/ (кушо|нишон дех|покажи|открой|show|open|мукоиса|сравни|compare)/.test(text)) return false;
        return /ба фикри ту|ба фикрат|ба фикри шумо|маслихат|чи кунам|чи хел кунам|чи кор кунам|бехтар аст|бехтарин|хорич|за границ|за рубеж|abroad|foreign|намехохам|нахостам|не хочу|чаро|почему|why|should i|advice|посовет|что лучше|что мне делать|падару модар|падарам|модарам|волидон|родител|parents|метарсам|ташвиш|переживаю|worried/.test(text);
    }

    private async adviseAnswer(message: string, history: Array<{ q: string; a: string }>, lang: string, grade: number | null, careerName?: string) {
        const unis: Array<{ id: string; name: string; city: string | null }> = await this.careerRepository.manager.query(
            `SELECT u.id, u.name, u.city FROM universities u
             WHERE ${grade === 9 ? '' : 'NOT'} (u.name ~* 'коллеҷ|колледж')
             ORDER BY (SELECT count(*) FROM career_universities cu WHERE cu."universitiesId" = u.id) DESC LIMIT 60`);
        const langName = lang === 'ru' ? 'русӣ' : lang === 'en' ? 'англисӣ' : 'тоҷикӣ';
        const nl = String.fromCharCode(10);
        // Номи кӯтоҳ: «Филиали МГУ дар Душанбе», на номи пурраи расмӣ — овоз онро дароз мехонд.
        const short = (name: string) => name
            .replace(/Донишгоҳи давлатии Москва ба номи М\. ?В\. Ломоносов/i, 'МГУ')
            .replace(/"?Донишгоҳи миллии (таҳқиқотии|тадқиқотӣ) технологӣ "?МИСиС"?/i, 'МИСиС')
            .replace(/"?Донишгоҳи миллии тадқиқотӣ"?-и Донишкадаи энергетикии Москва/i, 'МЭИ')
            .replace(/\s*ба номи .*?(?= дар шаҳри|$)/i, '')
            .replace(/\s*дар шаҳри Душанбе$/i, ' дар Душанбе')
            .replace(/\s{2,}/g, ' ').trim().slice(0, 60);
        const prompt = [
            'Ту мушовири касбии меҳрубон ва ростгӯи сомонаи «Ихтисоси ман» (Тоҷикистон) ҳастӣ. Бо хонанда мисли одами зинда гап зан, бо «шумо».',
            `Ҷавоб ҲАТМАН бо забони ${langName}, 2–3 ҷумла, то 55 калима (онро овоз мехонад). Бе рӯйхати рақамдор ва бе аломатҳои markdown.`,
            'Маслиҳати мушаххас деҳ: ба саволаш рост ҷавоб деҳ, як-ду муассисаи мувофиқро аз РӮЙХАТ бо ҳамон номи кӯтоҳ ном бар ва гӯ чаро. Агар лозим бошад, як қадами амалӣ пешниҳод кун (санҷиш, Касб-свайп, саҳифаи ихтисос).',
            'Далелҳо: филиалҳои донишгоҳҳои Русия (МГУ, МИСиС, МЭИ) ва Донишгоҳи славянии Россия ва Тоҷикистон бо забони русӣ дарс медиҳанд — барои идомаи таҳсил дар Русия ва хориҷ қулайанд; донишгоҳҳои калони давлатӣ барномаҳои мубодила ва магистратура доранд. Рақам, нарх ва далели навро аз худ насоз.',
            'Агар корбар чизеро рад кунад («коллеҷ намехоҳам»), онро эҳтиром кун ва алтернатива деҳ. Агар саволаш дар бораи падару модар ё тарс бошад — аввал дастгирӣ, баъд роҳи амалӣ.',
            'Агар корбар тест намехоҳад — тестро пешниҳод накун, «Касб-свайп» ё «Худро дар касб санҷед»-ро гӯй.',
            grade === 9 ? 'Корбар баъди синфи 9 аст: танҳо коллеҷ мумкин; инро нарм шарҳ деҳ.' : '',
            careerName ? `Корбар ҳозир саҳифаи ихтисоси «${careerName}»-ро мебинад.` : '',
            'РӮЙХАТИ МУАССИСАҲО (рақам. ном — шаҳр):',
            ...unis.map((u, i) => `${i + 1}. ${short(u.name)} — ${u.city || ''}`),
            history.length ? 'СӮҲБАТИ ПЕШТАРА:' : '',
            ...history.map((turn) => `Корбар: ${turn.q}${nl}Ёвар: ${turn.a}`),
            'САВОЛИ ҲОЗИРА:',
            message,
            'Дар reply рақами рӯйхатро нанавис. Танҳо JSON: {"reply": "ҷавоб", "universities": [рақамҳои муассисаҳое, ки дар ҷавоб ном бурдӣ, то 3]}',
        ].filter(Boolean).join(nl);
        let parsed: any;
        try {
            const raw = await this.aiService.generateFast(prompt, 7000);
            const match = String(raw || '').match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : null;
        } catch {
            return null;
        }
        const reply = typeof parsed?.reply === 'string' ? parsed.reply.replace(/[*#_`]/g, '').replace(/\s*\(\s*(№\s*)?\d{1,2}\s*\)/g, '').trim().slice(0, 500) : '';
        if (reply.length < 10) return null;
        const options = (Array.isArray(parsed?.universities) ? parsed.universities : [])
            .map((n: any) => unis[Number(n) - 1]).filter(Boolean).slice(0, 3)
            .map((u: any) => ({ id: u.id, name: u.name, label: short(u.name), kind: 'university' }));
        return options.length
            ? { reply, action: 'choose_university', params: { options }, answerLang: lang }
            : { reply, action: 'answer', params: {}, answerLang: lang };
    }

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
    // Ёвар: номи донишгоҳ тақрибан (20.10). Шинохти нутқ «Осимӣ»-ро «Ҳосимӣ», «М. С. Осимӣ»-ро
    // «МС осимӣ» менависад — LIKE-и айнан намеёфт ва рӯйхати умумӣ мекушод. Акнун ҳар калимаи хоси
    // ном бо калимаҳои номи муассисаҳо бо таҳаммули 1–2 ҳарф муқоиса мешавад.
    private uniFuzzyCache: { at: number; rows: Array<{ id: string; name: string; city: string | null; words: string[]; size: number; isState: boolean }> } | null = null;
    private static readonly UNI_STOP = new Set(['донишгох', 'донишгохи', 'давлати', 'давлатии', 'точикистон', 'ба', 'номи', 'академик', 'шахри', 'дар', 'коллеч', 'коллечи', 'донишкада', 'донишкадаи', 'филиал', 'филиали', 'университет', 'университета', 'институт', 'колледж', 'вуз', 'куча', 'кучо', 'хаст', 'аст', 'нишон', 'дех', 'кушо', 'ёб', 'кун', 'дидан', 'ро', 'ва', 'и', 'the', 'university', 'college',
        // Шаҳрҳо: «…дардушанбӣ» номи донишгоҳ нест — шаҳр алоҳида санҷида мешавад.
        'душанбе', 'душанби', 'хучанд', 'бохтар', 'кулоб', 'хоруг', 'истаравшан', 'панчакент', 'вахдат', 'турсунзода', 'хисор', 'исфара', 'дангара', 'конибодом', 'мухассиса', 'мухассисаи']);
    private static similar(a: string, b: string): number {
        if (a === b) return 1;
        const m = a.length;
        const n = b.length;
        if (!m || !n) return 0;
        let prev = Array.from({ length: n + 1 }, (_, j) => j);
        for (let i = 1; i <= m; i += 1) {
            const cur = [i];
            for (let j = 1; j <= n; j += 1) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = cur;
        }
        return 1 - prev[n] / Math.max(m, n);
    }
    private static wordsOf(text: string): string[] {
        return foldTajik(text).toLowerCase().split(/[^a-zа-яё0-9]+/i).filter(Boolean);
    }
    // Калимаи гуфташуда ба калимаи номи муассиса чӣ қадар монанд аст (бо пешвандҳои «х», ки шинохт илова мекунад,
    // ва калимаҳои якҷояшуда: «хосиимидардушанби» → «осими» дар дохил).
    private static wordScore(said: string, word: string): number {
        if (word.length < 4 || said.length < 3) return said === word ? 1 : 0;
        let best = Math.max(CareerService.similar(said, word), said.startsWith('х') ? CareerService.similar(said.slice(1), word) : 0);
        if (said.length > word.length + 2) {
            // Калимаҳои якҷояшуда: пораҳои ба дарозии калима ±1 ҳарф («хосиими…» → «осими»).
            const city = /(душанб|хучанд|бохтар|кулоб|хоруг|вахдат)/.exec(said);
            const body = city ? said.slice(0, city.index) : said;
            for (const len of [word.length - 1, word.length, word.length + 1]) {
                for (let i = 0; len >= 4 && i + len <= body.length; i += 1) best = Math.max(best, CareerService.similar(body.slice(i, i + len), word) - 0.05);
            }
        }
        return best;
    }
    private async findUniversityFuzzy(name: string): Promise<{ id: string; name: string; city: string | null } | null> {
        const said = CareerService.wordsOf(name).filter((word) => word.length >= 3 && !CareerService.UNI_STOP.has(word));
        if (!said.length) return null;
        if (!this.uniFuzzyCache || Date.now() - this.uniFuzzyCache.at > 10 * 60_000) {
            const rows: Array<{ id: string; name: string; shortName: string | null; city: string | null; isState: boolean; size: string }> = await this.careerRepository.manager.query(
                `SELECT u.id, u.name, u."shortName", u.city, u."isState",
                        (SELECT count(*) FROM career_universities cu WHERE cu."universitiesId" = u.id) AS size
                 FROM universities u`);
            this.uniFuzzyCache = {
                at: Date.now(),
                rows: rows.map((r) => ({ id: r.id, name: r.name, city: r.city, isState: !!r.isState, size: Number(r.size) || 0,
                    words: [...new Set(CareerService.wordsOf(`${r.name} ${r.shortName || ''}`).filter((w) => !CareerService.UNI_STOP.has(w)))] })),
            };
        }
        let best: { row: any; score: number } | null = null;
        for (const row of this.uniFuzzyCache.rows) {
            // Ҳар калимаи гуфташуда беҳтарин ҷуфташро меёбад; ҳамаашон бояд мувофиқ бошанд.
            const scores = said.map((w) => Math.max(0, ...row.words.map((u) => CareerService.wordScore(w, u))));
            if (scores.some((score) => score < 0.75)) continue;
            const score = scores.reduce((a, b) => a + b, 0) / scores.length + (row.isState ? 0.01 : 0) + Math.min(row.size, 200) / 20000;
            if (!best || score > best.score) best = { row, score };
        }
        return best ? { id: best.row.id, name: best.row.name, city: best.row.city } : null;
    }

    private static readonly ASSISTANT_REPLIES: Record<string, Record<string, string>> = {
        tj: {
            search: 'Ана ин ихтисосҳо.',
            open_career: 'Кушодам.',
            compare: 'Муқоиса мекунам, каме интизор шавед.',
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
            set_grade_9: 'Фаҳмидам: баъди синфи 9. Акнун танҳо коллеҷҳо ва ихтисосҳои онҳоро нишон медиҳам.',
            set_grade_11: 'Фаҳмидам: баъди синфи 11. Коллеҷҳо ва донишгоҳҳо ҳарду нишон дода мешаванд.',
        },
        ru: {
            search: 'Вот эти специальности.',
            open_career: 'Открыл.',
            compare: 'Сравниваю, подождите немного.',
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
            set_grade_9: 'Понял: после 9 класса. Теперь показываю только колледжи и их специальности.',
            set_grade_11: 'Понял: после 11 класса. Показываю и колледжи, и вузы.',
        },
        en: {
            search: 'Here are the specialties.',
            open_career: 'Opened.',
            compare: 'Comparing them now, one moment.',
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
            set_grade_9: 'Got it: after grade 9. Now I show only colleges and their specialties.',
            set_grade_11: 'Got it: after grade 11. I show both colleges and universities.',
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
        // «Тест бесплатный?», «Санҷиш ройгон аст?» — савол дар бораи сайт, на ҷустуҷӯи ихтисоси ройгон.
        const asksAboutSite = has('test', 'quiz', 'site', 'тест', 'сайт', 'санчиш', 'сомона', 'is it', 'это');
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
        // «Барои чӣ гапро намефаҳмӣ?» — узр ва маслиҳат, на муаррифии ёвар.
        const SORRY: Record<string, string> = {
            tj: 'Мебахшед, ман шуморо нодуруст фаҳмидам. Лутфан оҳистатар ва бо ҷумлаи кӯтоҳ гӯед, масалан «донишгоҳи Осимӣ» ё «ихтисоси биохимия». Ё тугмаи клавиатураро пахш карда нависед.',
            ru: 'Извините, я неправильно вас понял. Скажите, пожалуйста, медленнее и короче, например «университет Осими». Или нажмите клавиатуру и напишите.',
            en: 'Sorry, I misunderstood you. Please speak a bit slower and shorter, or tap the keyboard button and type.',
        };
        if (has('намефахми', 'намефахмед', 'нафахмиди', 'нафахмидед', 'намефахмад', 'не понимаешь', 'не понимаете', 'не понял', 'не поняла', 'dont understand', 'do not understand', 'not understand', 'misunderstood')) {
            return { action: 'answer', params: {}, reply: SORRY[lang] || SORRY.tj };
        }
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
            if (has('free', 'бесплат', 'бюджет') && !asksAboutSite) return { action: 'search', params: { query: 'ихтисосҳои ройгон', trusted: true } };
            if (has('nearest', 'closest', 'near me', 'ближайш', 'рядом')) return { action: 'nearest_universities', params: {} };
            if ((has('test', 'quiz', 'тест') && has('start', 'take', 'begin', 'нач', 'пройд', 'пройти'))) return { action: 'start_quiz', params: {} };
        }

        const cluster = text.match(/(?:кластер|cluster)\S*\s*(\d)/);
        if (cluster) return { action: 'open_cluster', params: { number: Number(cluster[1]) } };

        // Танҳо фармони кӯтоҳ («донишгоҳи наздиктарин»). Ҷумлаи дароз («…наздик ба Донишгоҳи молия…»)
        // ба AI меравад — он ҷойи мушаххасро (near) мефаҳмад.
        // «Донишгоҳҳои наздик ба Молия» — ҷойи мушаххас (near), на ҷойгиршавии корбар.
        const nearTo = has('донишгох', 'коллеч') ? text.match(/наздик\S* ба (.{3,40})$/) : null;
        if (nearTo && !/^(ман|ман хастам|хонаам|хонаи мо)$/.test(nearTo[1].trim())) {
            return { action: 'nearest_universities', params: { near: nearTo[1].trim() } };
        }
        if (has('наздиктарин', 'наздик') && has('донишгох') && text.split(' ').length <= 6 && !/наздик\S* ба \S/.test(text)) {
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
        if (has('ройгон', 'бепул', 'грант') && text.split(' ').length <= 4 && !asksAboutSite) {
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
        // Танҳо фармони кӯтоҳ: ҷумлаи дароз (масалан «…донишгоҳҳои наздик ба Молия…») ба AI меравад.
        if (has('донишгоххо') && text.split(' ').length <= 6) {
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
    private factsCache: { careers: number; universities: number; colleges: number; higher: number; grade9Careers: number; grade9Places: number; at: number } | null = null;

    // «синфи 9», «9 класс», «после девятого», «grade 9» → 9; ҳамин тавр 11.
    static detectGrade(message: string): 9 | 11 | null {
        const text = foldTajik(message).replace(/[^a-zа-яё0-9\s-]/gi, ' ');
        const aboutSchool = /(синф|класс|grade|мактаб|школ|хатм|тамом|оконч|finish)/.test(text);
        if (!aboutSchool) return null;
        if (/(^|\D)11(\D|$)|ёздах|ездах|одиннадцат|eleventh/.test(text)) return 11;
        if (/(^|\D)9(\D|$)|нух|нухум|девят|ninth/.test(text)) return 9;
        return null;
    }

    // Рақамҳои сайт барои ёвар: «Чанд ихтисос ҳаст?» бояд «884» шунавад,
    // на рӯйхатро. 10 дақиқа нигоҳ медорем — база кам иваз мешавад.
    private async siteFacts(): Promise<{ careers: number; universities: number; colleges: number; higher: number; grade9Careers: number; grade9Places: number }> {
        if (this.factsCache && Date.now() - this.factsCache.at < 10 * 60 * 1000) return this.factsCache;
        try {
            const [row] = await this.careerRepository.manager.query(
                `SELECT (SELECT count(*) FROM career)::int AS careers,
                        (SELECT count(*) FROM universities)::int AS universities,
                        (SELECT count(*) FROM universities WHERE "institutionType" = 'Коллеҷ')::int AS colleges,
                        (SELECT count(DISTINCT "careerId") FROM career_offerings WHERE "basedOn" = 9)::int AS grade9careers,
                        (SELECT count(DISTINCT "universityId") FROM career_offerings WHERE "basedOn" = 9)::int AS grade9places`,
            );
            this.factsCache = {
                careers: row.careers,
                universities: row.universities,
                colleges: row.colleges,
                higher: row.universities - row.colleges,
                grade9Careers: row.grade9careers,
                grade9Places: row.grade9places,
                at: Date.now(),
            };
        } catch {
            return this.factsCache ?? { careers: 0, universities: 0, colleges: 0, higher: 0, grade9Careers: 0, grade9Places: 0 };
        }
        return this.factsCache;
    }

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
        context: { careerName?: string; options?: Array<{ id: string; name: string; label?: string }>; grade?: string | number; location?: { lat: number; lng: number }; history?: Array<{ q: string; a: string }> } = {},
    ) {
        // Калимаҳои пуркунандаи нутқ («а-а-а», «э-э», «х-х», «мм», «ну») — шинохти нутқ онҳоро менависад
        // ва онҳо ҷустуҷӯро вайрон мекарданд («А-а-а, ба ман, х-х, ихтисоси биохимияро…»).
        const message = String(rawMessage || '')
            .replace(/(^|[\s,.!?])(?:[аэыоуеихмaeum]+(?:-[аэыоуеихмaeum]+)+|э+|а+|мм+|хм+|ну|эм+|uh+|um+)(?=[\s,.!?]|$)/giu, '$1')
            .replace(/\s*,(\s*,)+/g, ',').replace(/^[\s,.]+/, '').replace(/\s{2,}/g, ' ')
            .trim().slice(0, 400);
        const answerLang = ['tj', 'ru', 'en'].includes(lang) ? lang : 'tj';
        const grade = parseGrade(context.grade);

        // «Ман синфи 9-ро хатм мекунам», «я после 11 класса» — синф иваз мешавад.
        const saidGrade = CareerService.detectGrade(message);
        if (saidGrade) {
            return {
                reply: CareerService.ASSISTANT_REPLIES[answerLang]?.[`set_grade_${saidGrade}`] || '',
                action: 'set_grade',
                params: { grade: saidGrade },
                answerLang,
            };
        }
        const langName = answerLang === 'ru' ? 'русӣ' : answerLang === 'en' ? 'англисӣ' : 'тоҷикӣ';
        if (!message) return { reply: '', action: 'answer', params: {}, answerLang };

        // Ёвар қаблан самтҳо пешниҳод карда буд — ҷавоби корбар интихоб аст.
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const pending = (Array.isArray(context.options) ? context.options : [])
            .filter((option) => option && (uuid.test(String(option.id)) || /^page:(swipe|trial)$/.test(String(option.id))) && typeof option.name === 'string')
            .slice(0, 6);
        const picked = this.pickOption(message, pending);
        // «Дар бораи инҳо маълумот надорам», «кадомаш маоши баланд дорад?» — савол дар бораи ҳамон
        // самтҳои пешниҳодшуда (20.10): фарқ ва маошро аз база мегӯем, тугмаҳо мемонанд.
        const careerOptions = pending.filter((option) => uuid.test(String(option.id)) && (option as any).kind !== 'university');
        if (!picked && careerOptions.length >= 2 && CareerService.asksAboutOptions(message)) {
            const about = await this.aboutOptions(message, careerOptions, context.history || [], answerLang);
            if (about) return about;
        }

        if (picked && String(picked.id).startsWith('page:')) {
            const path = picked.id === 'page:swipe' ? '/swipe' : '/trial';
            return { reply: CareerService.ASSISTANT_REPLIES[answerLang]?.open_career || '', action: 'open_page', params: { path }, answerLang };
        }
        if (picked && (picked as any).kind === 'university') {
            return {
                reply: CareerService.ASSISTANT_REPLIES[answerLang]?.open_career || '',
                action: 'open_universities',
                params: { id: picked.id, name: picked.name },
                answerLang,
            };
        }
        if (picked) {
            return {
                reply: CareerService.ASSISTANT_REPLIES[answerLang]?.open_career || '',
                action: 'open_career',
                params: { id: picked.id, name: picked.name },
                answerLang,
            };
        }

        // «Барномасозиро дар Хуҷанд хуб меомӯзанд ё дар Душанбе?» (21.10): ихтисос + шаҳр(ҳо) →
        // муассисаҳои ҳамон шаҳрҳо бо буҷет ва нарх, рост аз база.
        {
            const folded = foldTajik(message).toLowerCase();
            const cities = CareerService.CITY_NAMES.filter(([, aliases]) => aliases.some((alias) => folded.includes(alias.slice(0, Math.max(5, alias.length - 2))))).map(([name]) => name);
            if (cities.length >= 1 && /(кучо|дар кадом|хуб|бехтар|омуз|хонд|мехон|ё |е |или|where|which|better|учат|лучше)/.test(folded)
                && !/наздик|рядом|near/.test(folded)) {
                const byCity = await this.careerInCities(message, cities, grade, answerLang);
                if (byCity) return byCity;
            }
        }

        // «Ихтисосҳое, ки дар ҷои аввал меистанд», «аз ҳама машҳур», «самые популярные» (21.10):
        // аз рӯи бали гузариши ММТ-и соли охир — далели расмӣ, на тахмин.
        if (/(чо(и|йи) (аввал|якум)|аз хама (машхур|маъруф|талабгор|бештар интихоб|баланд|пурталаб)|серталаб|популярн|востребован|(^|\s)топ(\s|$)|top|most popular|рейтинг|бали (аз хама )?баланд)/.test(foldTajik(message).toLowerCase())
            && /ихтисос|касб|специальн|профес|career|special|major/.test(foldTajik(message).toLowerCase())) {
            const top = await this.topCareersAnswer(answerLang);
            if (top) return top;
        }

        // «Не хочу тест», «тест намехоҳам, дигар роҳ лозим» (20.10): тестро сар намекунем — роҳҳои
        // дигари санҷишро пешниҳод мекунем (Касб-свайп ва «Худро дар касб санҷед»).
        if (CareerService.refusesTest(message)) return CareerService.otherChecks(answerLang);

        // «Донишгоҳи сайёҳӣ хуб аст ё техникӣ?» (20.10): муқоисаи ДУ МУАССИСА бо далелҳои база.
        // Агар мақсад гуфта нашуда бошад — мепурсем «барои кадом ихтисос?»; ҷавоби баъдина
        // («барои барномасозӣ») бо ҳамон ду муассиса аз хотираи сӯҳбат идома меёбад.
        {
            const history = context.history || [];
            let pair = await this.detectUniversityPair(message);
            let purpose = '';
            if (pair) {
                purpose = message;
            } else if (history.length && message.split(/\s+/).length <= 10
                && !/донишгох|донишкад|коллеч|колледж|университет|вуз|дмт|дтт/.test(foldTajik(message).toLowerCase())) {
                // Саволи баъдина («барои барномасозӣ», «нархаш чанд?») — ба ҳамон ду муассиса аз 2 гапи охир.
                const recent = history.slice(-2);
                for (let i = recent.length - 1; i >= 0 && !pair; i -= 1) {
                    const earlier = await this.detectUniversityPair(recent[i].q);
                    const followUp = /кадом ихтисос|какую специальность|which specialty/i.test(recent[recent.length - 1]?.a || '')
                        || /нарх|чанд|буч|ройгон|арзон|гарон|барои|кадомаш|онхо|инхо|чой|дур|наздик|бехтар|хубтар|цен|стоим|бюджет|which|price|cost/.test(foldTajik(message).toLowerCase());
                    if (earlier && followUp) {
                        pair = earlier;
                        purpose = `${recent.slice(i).map((turn) => turn.q).join(' ')} ${message}`;
                    }
                }
            }
            if (pair) {
                const compared = await this.compareUniversities(pair, purpose, history, answerLang, grade);
                if (compared) return compared;
            }
        }

        // Саволи шахсӣ ё маслиҳат («донишгоҳе мехоҳам, ки баъд хориҷ равам», «Не, коллеҷ намехоҳам») —
        // ҷавоби мушовир бо далелҳои база ва сӯҳбати пештара, на фармон.
        if (CareerService.wantsAdvice(message)) {
            const advice = await this.adviseAnswer(message, context.history || [], answerLang, grade, context.careerName);
            if (advice) return advice;
        }

        // «Духтур шудан мехоҳам» — самтҳоро мегӯем ва мепурсем, кадомаш.
        // «Падарам мегӯяд барномасоз шав, модарам мегӯяд духтур, намедонам чӣ кор кунам» (20.10): мисли мушовир —
        // ҳарду роҳро эҳтиром мекунем ва пешниҳод мекунем, ки ҳардуро худаш бисанҷад. Тугма барои ҳар ду.
        {
            const foldedAll = foldTajik(message).toLowerCase();
            const torn = /намедонам|чи кор кунам|чи кунам|кадомаш|не знаю|dont know|don't know/.test(foldedAll)
                || (/падар|модар|папа|мама|отец|мать|father|mother|parents/.test(foldedAll) && /мегуяд|мегуянд|говорит|says|want/.test(foldedAll));
            const words = foldedAll.split(/[^a-zа-яё0-9]+/i).filter(Boolean);
            const found = CareerService.DIRECTIONS.filter((entry) => entry.roles.some((stem) => words.some((word) => word.startsWith(stem))));
            if (torn && found.length >= 2) {
                const pick = found.slice(0, 2);
                const chosen = await Promise.all(pick.map((entry) => this.directionsFor(entry.roles[0], answerLang)));
                const options = chosen.map((result) => result.options[0]).filter(Boolean);
                if (options.length === 2) {
                    const [a, b] = pick.map((entry) => (answerLang === 'ru' ? entry.sayRu : answerLang === 'en' ? entry.sayEn : entry.say) || entry.say);
                    const reply = answerLang === 'ru'
                        ? `Понимаю, это непросто: родители хотят вам добра, но выбирать вам. Давайте проверим оба пути: в «Попробуйте себя в профессии» есть задания и для ${a}, и для ${b}. Ещё пройдите тест, он покажет, к чему вы ближе. С чего начнём?`
                        : answerLang === 'en'
                            ? `I understand, that is hard: your parents mean well, but it is your choice. Let's try both paths: "Try the career" has tasks for both ${a} and ${b}. The career test will also show what suits you more. Where shall we start?`
                            : `Фаҳмидам, ин интихоби душвор аст: падару модар ба шумо некӣ мехоҳанд, вале интихоб аз шумост. Беҳтар аст ҳарду роҳро худатон санҷед: дар «Худро дар касб санҷед» барои ${a} ва ${b} вазифаҳои воқеӣ ҳастанд. Санҷиши касбӣ низ нишон медиҳад, ки ба кадомаш бештар майл доред. Аз кадомаш сар кунем?`;
                    return { reply, action: 'choose_direction', params: { role: `${a} / ${b}`, options }, answerLang };
                }
            }
        }

        // Ҷумлаи мураккаб (пул, сол, шаҳр ё дароз): «5000 сомонӣ дорам, барномасозӣ мехонам» — на рӯйхати
        // тайёри самтҳо, балки AI ва ҷустуҷӯ бо буҷет (20.10).
        const complexAsk = /\d|хазор|сомон|сол|шахр|арзон|пул|буч/.test(foldTajik(message).toLowerCase()) || message.split(/\s+/).length > 12;
        const role = complexAsk ? null : this.detectRole(message);
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
        const facts = await this.siteFacts();
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
            (context.history || []).length ? 'СӮҲБАТИ ПЕШТАРА (барои фаҳмидани «ин», «не», «ҳамон»):' : '',
            ...(context.history || []).map((turn) => `Корбар: ${turn.q}${String.fromCharCode(10)}Ёвар: ${turn.a}`),
            'ГУФТАИ КОРБАР:',
            message,
            context.careerName ? `КОРБАР ҲОЗИР ИН ИХТИСОСРО МЕБИНАД: ${context.careerName}` : '',
            '',
            'АМАЛҲОИ ИҶОЗАТДОДАШУДА:',
            '- search — ҷустуҷӯи ихтисос («барномасозиро нишон деҳ», «то 4000 сомонӣ»). params: {"query": "матни ҷустуҷӯ", "maxFee": рақам ё холӣ, "years": рақам ё холӣ}. Агар корбар пулашро гӯяд («5000 сомонӣ дорам», «панҷ ҳазор») — "maxFee": 5000 (ҳамеша бо рақам); "query" танҳо номи соҳа («барномасозӣ»), бе пул. Агар гӯяд, ки пул барои чанд сол бошад — "years".',
            '  МУҲИМ: номҳои ихтисос дар база ТОҶИКӢ ҳастанд — "query"-ро ҲАМЕША бо тоҷикӣ нависед, ҳатто агар корбар русӣ ё англисӣ гӯяд:',
            '  «programming» → «барномасозӣ», «AI / искусственный интеллект» → «зеҳни сунъӣ», «medicine» → «тиб», «law» → «ҳуқуқ».',
            '- open_career — кушодани як ихтисоси мушаххас. params: {"name": "номи ихтисос"}',
            '- compare — муқоисаи ду ё зиёда ихтисос. params: {"names": ["ном1", "ном2"]}',
            '- save_career — захира кардани ихтисос. params: {"name": "номи ихтисос"}',
            '- start_quiz — оғози санҷиши касбӣ. params: {}',
            '- open_universities — донишгоҳҳо, як донишгоҳи мушаххас ё харита. params: {"name": "НОМИ ХОСИ муассиса ё холӣ", "city": "шаҳр", "type": "college" ё "higher" ё холӣ, "career": "ихтисос ё соҳа, агар корбар донишгоҳеро ҷӯяд, ки ҳамин ихтисосро дорад («донишгоҳе, ки бофандагӣ дорад» → "бофандагӣ")"}. «ҳамаи коллеҷҳо», «колледжи», «colleges» → {"type":"college"} БЕ name; «донишгоҳҳо/вузы/universities» → {"type":"higher"} БЕ name. Ном ва шаҳр бо тоҷикӣ («Худжанд» → «Хуҷанд», «medical» → «тиббӣ»)',
            '- open_report — ҳисоботи AI аз рӯи санҷиш. params: {}',
            '- open_plan — рӯйхати ҳуҷҷатсупорӣ. params: {}',
            '- nearest_universities — «донишгоҳи наздиктарин», «дар наздикии ман». params: {} ё {"career": "номи ихтисос"}, агар корбар ихтисоси мушаххасро гӯяд ё «ин ихтисос»-ро дар назар дошта бошад (он гоҳ ихтисоси КОРБАР ҲОЗИР МЕБИНАД-ро гир). Агар корбар ҷой ё муассисаи дигарро гӯяд («наздик ба Донишгоҳи молия», «назди хонаи хешовандон дар паҳлӯи ДМТ»), params: {"near": "номи ҳамон муассиса"}. Танҳо «ҳа»/«ан» дар аввали ҷумла фармони санҷиш НЕСТ: start_quiz танҳо вақте ки корбар санҷиш ё тестро мехоҳад.',
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
            'МАЪЛУМОТИ САЙТ (ба саволҳо танҳо аз ҳамин ҷавоб деҳ):',
            facts.careers ? `- ${facts.careers} ихтисос (маълумоти расмии Маркази миллии тестӣ), дар 5 кластер.` : '',
            facts.universities ? `- ${facts.universities} муассиса дар харита: ${facts.higher} муассисаи олӣ (донишгоҳ, донишкада, филиал, академия) ва ${facts.colleges} коллеҷ. «${facts.universities} донишгоҳ» НАГӮ.` : '',
            '- Баъди синфи 9 танҳо ба коллеҷ дохил шудан мумкин аст; баъди синфи 11 — ҳам ба коллеҷ, ҳам ба донишгоҳ.',
            facts.grade9Careers ? `- Баъди синфи 9: ${facts.grade9Careers} ихтисос дар ${facts.grade9Places} коллеҷ ва филиал.` : '',
            grade === 9 ? '- ИН КОРБАР БАЪДИ СИНФИ 9 АСТ: танҳо коллеҷ ва ихтисосҳои коллеҷро пешниҳод кун, донишгоҳро не.' : '',
            grade === 11 ? '- Ин корбар баъди синфи 11 аст: ҳам коллеҷ, ҳам донишгоҳ мумкин.' : '',
            '- Сайт ва санҷиши касбӣ пурра ройгон аст.',
            '- Се забон: тоҷикӣ, русӣ, англисӣ. Ҳеҷ гоҳ нагӯ, ки ягон забонро намедонӣ ё бо он гап намезанӣ. Матни нофаҳмо бошад — хоҳиш кун, ки бори дигар гӯяд.',
            '- Агар корбар тест ё санҷишро НАМЕХОҲАД («не хочу тест», «тест намехоҳам») — ҳеҷ гоҳ start_quiz не.',
            '- Агар савол нопурра бошад ва бе мақсад ҷавоби дуруст додан мумкин набошад («кадомаш беҳтар?» бе гуфтани барои чӣ) — action "answer" ва дар reply як саволи дақиқкунандаи кӯтоҳ бипурс. Сӯҳбати пештараро ба назар гир.',
            '- compare танҳо барои ИХТИСОСҲО. Агар корбар ду донишгоҳ ё коллеҷро муқоиса кунад — compare не.',
            '- Баъди санҷиш: ҳисоботи AI, тавсияи ихтисосҳо, муқоисаи то 5 ихтисос ва рӯйхати ҳуҷҷатсупорӣ.',
            '- Барои ҳар ихтисос: донишгоҳҳо, нарх, бали гузариш ва ҷойҳои буҷетӣ.',
            '',
            'ФОРМАТИ ҶАВОБ — танҳо JSON:',
            '{"action": "ном", "params": {...}, "reply": "як ҷумлаи кӯтоҳ"}',
            '',
            'МИСОЛҲО:',
            '«Салом, ман намедонам кадом касбро интихоб кунам» → {"action":"answer","params":{},"reply":"Биёед санҷиш гузарем. Сар кунам?"}',
            '«Санҷишро сар кун» → {"action":"start_quiz","params":{},"reply":"Санҷиш оғоз ёфт."}',
            '«Ман ҳамагӣ панҷ ҳазор сомонӣ дорам, мехоҳам барномасозӣ хонам, дар куҷо мешавад?» → {"action":"search","params":{"query":"барномасозӣ","maxFee":5000},"reply":""}',
            '«Хешовандони мо назди Донишгоҳи молия зиндагӣ мекунанд, донишгоҳҳои наздик ба онро нишон деҳ» → {"action":"nearest_universities","params":{"near":"Донишгоҳи молия"},"reply":""}',
            '«Хешовандон назди ДМТ зиндагӣ мекунанд, кадом коллеҷҳо наздиканд?» → {"action":"nearest_universities","params":{"near":"ДМТ"},"reply":""}',
            '«Стоматологияро кадом донишгоҳи наздик ба ман дорад?» → {"action":"nearest_universities","params":{"career":"стоматология"},"reply":""}',
            '«Ин ихтисосро кадом донишгоҳи наздик ба ман дорад?» → {"action":"nearest_universities","params":{"career":"<ихтисосе, ки корбар ҳозир мебинад>"},"reply":""}',
            '«Духтуриро кушо» → {"action":"open_career","params":{"name":"Духтур"},"reply":"Кушодам."}',
            '«Маоши барномасоз чанд аст?» → {"action":"open_career","params":{"name":"барномасоз"},"reply":"Кушодам."}',
            '«Донишгоҳи тиббӣ дар куҷост?» → {"action":"open_universities","params":{"name":"тиббӣ"},"reply":"Кушодам."}',
            `«Чанд ихтисос доред?» → {"action":"answer","params":{},"reply":"Дар сайт ${facts.careers || 884} ихтисос дар 5 кластер ҳаст."}`,
            '«Санҷиш ройгон аст?» → {"action":"answer","params":{},"reply":"Ҳа, санҷиш ва сайт пурра ройгон аст."}',
            '«Санҷиш пулакӣ аст?» → {"action":"answer","params":{},"reply":"Не, пулакӣ нест — санҷиш ва сайт ройгон аст."}',
            '«Барномасозӣ ва иқтисодро муқоиса кун» → {"action":"compare","params":{"names":["барномасозӣ","иқтисодиёт"]},"reply":"Муқоиса мекунам."}',
            '',
            'ҚОИДАҲО:',
            `- "reply" бо забони ${langName}, ҲАТМАН кӯтоҳ: 1 ҷумла, то 10 калима, чунки онро овоз мехонад.`,
            '- САВОЛИ маълумотӣ («чанд», «чист», «ройгон аст?», «сколько», «что такое», «бесплатно ли», «how many», «what is», «is it free») → "answer" ва аз МАЪЛУМОТИ САЙТ ё КЛАСТЕРҲО ҷавоб деҳ. Саҳифа НАКУШО.',
            '- Амалро вақте интихоб кун, ки корбар чизеро нишон додан, кушодан, ёфтан, муқоиса кардан ё оғоз кардан хоҳад. Саволи бозгашт танҳо вақте бипурс, ки ягон амал тамоман мувофиқ наояд.',
            '- Дар бораи бал, нарх ё донишгоҳҳои як ихтисоси мушаххас пурсанд — open_career (дар саҳифааш ҳамааш ҳаст).',
            '- Салом, шикоят ё саволи умумӣ → "answer". Амалро танҳо вақте интихоб кун, ки корбар онро равшан хоста бошад.',
            '- Номи ихтисосро тахмин накун; калимаи худи корбарро нависед.',
            '- Рақам, нарх ё номи донишгоҳро аз худат насоз — танҳо аз МАЪЛУМОТИ САЙТ.',
        ].filter(Boolean).join(String.fromCharCode(10));

        // Аввал роутери тез: фармони маълумро бе AI иҷро мекунем.
        // Дар саҳифаи ихтисос саволи «Сколько бюджетных мест?» ба ҳамин ихтисос аст,
        // на ба ҷустуҷӯи умумӣ — роутери тезро намегузарем.
        const askingAboutPage = !!context.careerName && CareerService.isQuestion(message);
        let parsed: any = askingAboutPage ? null : this.quickRoute(message, answerLang);
        if (!parsed) try {
            // Сӯҳбати зинда: ҳадди 6 сония, бе хобидан ҳангоми 429.
            // Gemini аввал: Vertex квотаашро тамом кардааст (429) ва ҳар дархостро
            // 2–4 сония дер мекард, пеш аз он ки ба Gemini гузарад.
            parsed = readJson(await this.aiService.generateFast(prompt, 6000));
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

        // «Ихтисоси зеҳни сунъӣ то кадом дараҷа дар кор лозим аст?», «оянда дорад?», «маошаш?» (21.10):
        // савол дар бораи ЯК ихтисос — ҷавоб бо далелҳо (маош, пешгӯии 10 сол, таҳсил), на рӯйхат.
        if ((action === 'search' || action === 'answer' || action === 'open_career')
            && /(то кадом дарача|оянда|талабот|талаб дорад|дар кор|кор меёб|кор пайдо|маош|музд|чи кадар|арзиш|фоида дорад|хуб аст|перспектив|востребован|будущ|зарплат|future|demand|salary|worth)/.test(foldTajik(message).toLowerCase())
            && String(given.query || given.name || '').trim().length >= 3) {
            const facts = await this.careerFactsAnswer(String(given.query || given.name), message, context.history || [], answerLang);
            if (facts) return facts;
        }

        // Буҷети корбар (20.10): пешниҳодҳои воқеӣ бо нарх ва ҷойҳои ройгон, на рӯйхати умумӣ.
        const maxFee = Number(String(given.maxFee ?? '').replace(/[^0-9.]/g, ''));
        if (action === 'search' && maxFee >= 100 && String(given.query || '').trim().length >= 3) {
            const budget = await this.budgetAnswer(String(given.query), maxFee, Number(given.years) || 0, grade, answerLang);
            if (budget) return budget;
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
            // Нарх («то 4000 сомонӣ», «арзон») филтр аст, на калимаи ихтисос — онро ҷудо мекунем.
            const PRICE = /(то|аз|до|от|under|below|up to|less than)?\s*\d[\d\s]*\s*(сомон[а-яёӣ]*|сом|somoni|tjs)?|арзон[а-яёӣ]*|дешев[а-я]*|cheap[a-z]*|сомон[а-яёӣ]*/gi;
            const cleaned = rawQuery.replace(generic, ' ').replace(PRICE, ' ').replace(/ {2,}/g, ' ').trim();

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
                    // «Наёфтам» намегӯем: ҷустуҷӯи AI-и саҳифа ҷумлаи пурраро (нарх, шаҳр, калимаҳо) худаш мефаҳмад
                    // ва пештар саҳифа «4 ихтисос ёфт шуд» нишон медод, вале ёвар «чизе наёфтам» мегуфт.
                    return {
                        reply: CareerService.ASSISTANT_REPLIES[answerLang]?.search || '',
                        action: 'search',
                        params: { query: message },
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

        // «Донишгоҳҳои наздик ба Молия» (20.10): муассисаи номбурдаро меёбем ва наздиктаринҳоро бо масофа
        // ва шумораи ихтисосҳо мегӯем (худи ҳамон муассиса нест). Тугмаҳо/«якумашро кушо» кор мекунанд.
        // «Кадом донишгоҳ ин ихтисосро дорад ва ба ман наздик аст?» (20.10): ҷойгиршавии корбар + ихтисоси
        // сӯҳбат (саҳифа ё охирин гуфташуда). Бе ҷойгиршавӣ — саҳифа онро мепурсад ва ҳамон саволро боз мефиристад.
        if (action === 'nearest_universities' && !String(given.near || '').trim()) {
            const foldedAsk = foldTajik(message).toLowerCase();
            const givenCareer = String(given.career || '').trim();
            const careerWanted = (givenCareer && !/[<>]|^ин |ихтисосе, ки/.test(givenCareer) ? givenCareer : '')
                || (/(^|\s)(ин|хамин|хамон|эту|этой|this)\s/.test(foldedAsk) || /ихтисос|специальност|specialty|касб/.test(foldedAsk) ? String(context.careerName || '') : '');
            if (!context.location) {
                return { reply: answerLang === 'ru' ? 'Определяю ваше местоположение.' : answerLang === 'en' ? 'Finding your location.' : 'Ҷойгиршавии шуморо муайян мекунам.', action: 'nearest_universities', params: { needLocation: true }, answerLang };
            }
            const near = await this.nearestToPoint(context.location, careerWanted, grade, answerLang);
            if (near) return near;
        }

        if (action === 'nearest_universities' && String(given.near || '').trim().length >= 3) {
            const near = await this.nearUniversities(String(given.near), message, grade, answerLang);
            if (near) return near;
        }

        // «Донишгоҳе, ки ихтисоси бофандагӣ дорад» (20.10): на ҳамаи донишгоҳҳо, балки онҳое,
        // ки ҳамин ихтисосро доранд — бо шумораи ихтисосҳо, ҷойи буҷетӣ ва тугмаҳо.
        const foldedAsk2 = foldTajik(message).toLowerCase();
        const whichUni = /(дар )?кадом (донишгох|коллеч|муассиса)\S* .*(мехонанд|хонд|омузонд|тайёр|дорад|доранд)|(мехонанд|омузонанд) дар кадом|где (учат|учиться|обучают)|в каком (вуз|университ|колледж)\S* .*(учат|учиться|есть)|which (univers|college)\S* .*(teach|offer|study|ha)/.test(foldedAsk2);
        if ((action === 'open_universities' && !String(given.name || '').trim()) || (whichUni && ['search', 'answer', 'open_career'].includes(action))) {
            const careerAsked = String(given.career || '').trim()
                || ((/ихтисос|специальност|specialt/.test(foldTajik(message).toLowerCase()) && /дор|хон|мехон|ест|есть|ҳаст|хаст|have|offer/.test(foldTajik(message).toLowerCase()))
                    || /(дар )?кадом (донишгох|коллеч|муассиса)\S* .*(мехонанд|хонд|омузонд|тайёр)|(мехонанд|омузонанд) дар кадом|где (учат|учиться|обучают)|в каком (вуз|университ|колледж)\S* .*(учат|учиться)|which (univers|college)\S* .*(teach|offer|study)/.test(foldTajik(message).toLowerCase())
                    ? message : '');
            if (careerAsked.length >= 4) {
                const saidKind = /коллеч|колледж|college/.test(foldTajik(message).toLowerCase()) ? 'college' : /донишгох|донишкад|университет|вуз|universit/.test(foldTajik(message).toLowerCase()) ? 'higher' : '';
                const byCareer = await this.universitiesForCareer(careerAsked, grade, answerLang, saidKind);
                if (byCareer) return byCareer;
            }
        }

        if (action === 'open_universities') {
            // «донишгоҳи Миллиро ёб» — аввал номи мушаххасро меҷӯем,
            // вагарна корбар ба рӯйхати 33-тоӣ мерасад.
            // «Ҳамаи коллеҷҳо», «все колледжи», «all colleges» — рӯйхат бо филтри навъ,
            // на кушодани як коллеҷ (пештар «college» ҳамчун ном ҷустуҷӯ мешуд).
            const KIND_WORDS = /^(коллеч|колледж|college|донишгох|университет|universit|вуз|донишкада|институт|institut|олий|олӣ|higher|хама|все|all|the|мухассиса|учебн|заведен|дар|в|in|of|ва|и|and)/;
            const kindOf = (text: string): 'college' | 'higher' | '' => {
                const folded = foldTajik(text).toLowerCase();
                if (/коллеч|колледж|college/.test(folded)) return 'college';
                if (/донишгох|университет|universit|вуз|донишкада|институт|institut|олий|higher/.test(folded)) return 'higher';
                return '';
            };
            const typeWanted = (['college', 'higher'].includes(String(given.type)) ? String(given.type) : '') || kindOf(message);
            const rawName = String(given.name || '').trim();
            const nameWords = foldTajik(rawName).toLowerCase().split(/[^a-zа-яё0-9]+/i).filter(Boolean);
            const genericName = nameWords.every((word) => KIND_WORDS.test(word)
                || CareerService.CITY_NAMES.some(([, aliases]) => aliases.some((alias) => word.startsWith(alias.slice(0, 5)))));
            const wantedName = genericName ? '' : rawName;
            // Шаҳри гуфташуда («юрист в Душанбе»): донишгоҳи шаҳри дигар ҷавоб нест —
            // он гоҳ рӯйхати ҳамон шаҳр кушода мешавад.
            const foldedMessage = foldTajik(message).toLowerCase();
            const saidCity = CareerService.CITY_NAMES.find(([, aliases]) =>
                aliases.some((alias) => foldedMessage.includes(alias.slice(0, Math.max(5, alias.length - 2)))))?.[0] || '';
            const givenCity = CareerService.cityToTajik(String(given.city || '').trim());
            const wantedCity = saidCity || (CareerService.CITY_NAMES.some(([name]) => name === givenCity) ? givenCity : '');
            if (wantedName.length >= 3) {
                // «Донишгоҳи тиббӣ» — донишгоҳ, на аввалин коллеҷи тиббӣ; «коллеҷ» — баръакс.
                const folded = foldTajik(message);
                const kind = /коллеч/.test(folded) ? 'коллеч%' : /донишкад/.test(folded) ? 'донишкад%' : /донишгох|университет/.test(folded) ? 'донишгох%' : '';
                const rows: Array<{ id: string; name: string; city: string | null }> = await this.careerRepository.manager.query(
                    // Шаҳри гуфташуда («… дар Хуҷанд») пеш; баъд навъ, давлатӣ ва калонтарин (ихтисосҳо бештар).
                    `SELECT u.id, u.name, u.city FROM universities u
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
                const inCity = !wantedCity || foldTajik(rows[0]?.city || '').includes(foldTajik(wantedCity));
                if (rows[0] && inCity) params = { id: rows[0].id, name: rows[0].name };
                // Айнан ёфт нашуд — тақрибан (хатои шинохти нутқ ё ихтисори «МС»).
                if (!params.id) {
                    const near = await this.findUniversityFuzzy(wantedName);
                    const nearInCity = near && (!wantedCity || foldTajik(near.city || '').includes(foldTajik(wantedCity)));
                    if (near && nearInCity) params = { id: near.id, name: near.name };
                }
            }

            if (!params.id) {
                const city = wantedCity || givenCity;
                if (city) {
                    const rows: Array<{ city: string }> = await this.careerRepository.manager.query(
                        `SELECT DISTINCT city FROM universities WHERE ${TAJIK_FOLD('city')} LIKE $1 LIMIT 1`,
                        [`%${foldTajik(city)}%`],
                    );
                    if (rows[0]?.city) params = { city: rows[0].city };
                }
            }
            if (!params.id && typeWanted && (genericName || !rawName)) params = { ...params, type: typeWanted };
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

        // Саволи озод дар бораи ихтисос («дарсҳо бо кадом забон?», «чанд сол?»,
        // «дар куҷо мехонанд?») — AI аз маълумоти база ҷавоб медиҳад, мисли одам.
        const generalUniversities = action === 'open_universities' && !params.id && !params.city && !params.type;
        if ((action === 'open_career' || action === 'answer' || action === 'search' || (generalUniversities && !!context.careerName))
            && CareerService.isQuestion(message)) {
            const pageId = context.careerName ? (await this.resolveCareer(context.careerName))?.id || null : null;
            let careerId: string | null = action === 'open_career' ? params.id || null : null;
            if (!careerId) careerId = pageId;
            if (careerId) {
                const answer = await this.careerAnswer(careerId, message, answerLang, grade);
                if (answer) {
                    // Корбар аллакай дар ҳамин саҳифа аст — танҳо ҷавоб, бе гузариш.
                    const onPage = !!pageId && (action !== 'open_career' || careerId === pageId);
                    return onPage
                        ? { reply: answer, action: 'answer', params: {}, answerLang }
                        : { reply: answer, action: 'open_career', params: action === 'open_career' ? params : { id: careerId }, answerLang };
                }
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

        if (action === 'open_universities' && !params.id && params.type) {
            const kindReply: Record<string, Record<string, string>> = {
                college: { tj: 'Ана ҳамаи коллеҷҳо.', ru: 'Вот все колледжи.', en: 'Here are all the colleges.' },
                higher: { tj: 'Ана донишгоҳ ва донишкадаҳо.', ru: 'Вот вузы.', en: 'Here are the universities.' },
            };
            return { reply: kindReply[params.type][answerLang] || kindReply[params.type].tj, action, params, answerLang };
        }
        const replyKey = action === 'open_universities' && params.id ? 'open_career' : action;
        const canned = CareerService.ASSISTANT_REPLIES[answerLang]?.[replyKey];
        return { reply: canned || reply, action, params, answerLang };
    }

    // Савол аст, на фармон: «…?», «кадом», «сколько», «which»… ва бе «кушо/покажи/open».
    static isQuestion(message: string): boolean {
        const text = foldTajik(message).toLowerCase();
        if (/(^| )(кушо|нишон дех|захира|мукоиса|покажи|открой|сохрани|сравни|open|show|save|compare)( |$)/.test(text)) return false;
        return /\?/.test(message)
            || /(^| )(чанд|кадом|чи|чист|чиро|кучо|оё|чаро|кай|чи тавр|сколько|какой|какая|какие|каком|где|когда|почему|зачем|как|ли|what|which|where|when|why|how|is|are|do|does|can)( |$)/.test(text);
    }

    // Ҷавоби озод ба саволи корбар дар бораи як ихтисос — танҳо аз маълумоти база.
    private async careerAnswer(careerId: string, message: string, lang: string, grade: number | null): Promise<string | null> {
        const career: any = await this.careerRepository.findOne({ where: { id: careerId } });
        if (!career) return null;
        const offerings = (await this.offeringRepository.find({ where: { careerId }, relations: ['university'] }))
            .filter((offering) => !grade || offering.basedOn === grade);
        const count = (values: string[]) => {
            const map = new Map<string, number>();
            for (const value of values.filter(Boolean)) map.set(value, (map.get(value) || 0) + 1);
            return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => `${value} (${n})`).join(', ');
        };
        const fees = offerings.map((o) => o.tuitionFee).filter((fee): fee is number => typeof fee === 'number' && fee > 0);
        const seats = offerings.reduce((sum, o) => sum + (o.seats || 0), 0);
        const places = [...new Map(offerings.map((o) => [o.university?.id, o.university])).values()].filter(Boolean) as any[];
        let scores = '';
        try {
            const result: any = await this.admissionScores(careerId);
            const last = result.years?.[result.years.length - 1];
            if (last?.minScore) scores = `соли ${last.year}: аз ${last.minScore} то ${last.maxScore} бал`;
        } catch { /* бал нест */ }
        const langName = lang === 'ru' ? 'русӣ' : lang === 'en' ? 'англисӣ' : 'тоҷикӣ';
        const facts = [
            `Ихтисос: ${career.name}${career.code ? ` (рамз ${career.code})` : ''}`,
            career.description ? `Тавсиф: ${String(career.description).slice(0, 300)}` : '',
            career.degreeType || career.durationYears ? `Дараҷа ва мӯҳлат: ${career.degreeType || '—'}, ${career.durationYears || '—'} сол` : '',
            offerings.length ? `Забони таҳсил: ${count(offerings.map((o) => o.language))}` : '',
            offerings.length ? `Шакли таҳсил: ${count(offerings.map((o) => o.studyForm))}` : '',
            offerings.length ? `Пардохт: ${count(offerings.map((o) => o.paymentType))}` : '',
            offerings.length ? `Баъди синф: ${count(offerings.map((o) => String(o.basedOn)))}` : '',
            fees.length ? `Нархи таҳсил: ${Math.min(...fees)}–${Math.max(...fees)} сомонӣ дар сол` : '',
            seats ? `Ҷойҳои қабул: ${seats}` : '',
            places.length ? `Муассисаҳо (${places.length}): ${places.slice(0, 8).map((u) => `${u.name} (${u.city || '—'}, ${u.institutionType || ''})`).join('; ')}` : '',
            scores ? `Бали гузариш, ${scores}` : '',
            career.salaryAndMarket?.junior ? `Маош (ТАХМИНӢ, на омори расмӣ — ҳатман «тахминан» гӯ): навкор ${career.salaryAndMarket.junior}, ботаҷриба ${career.salaryAndMarket.mid}` : '',
            career.skills?.technical?.length ? `Малакаҳо: ${career.skills.technical.slice(0, 6).join(', ')}` : '',
            career.careerOpportunities?.length ? `Ҷойи кор: ${career.careerOpportunities.slice(0, 5).join(', ')}` : '',
            grade === 9 ? 'Корбар баъди синфи 9 аст — танҳо коллеҷ.' : '',
        ].filter(Boolean).join('\n');
        const prompt = [
            'Ту ёвари овозии сайти «Ихтисоси ман» ҳастӣ. Ба саволи корбар дар бораи ин ихтисос ҷавоб деҳ,',
            'мисли одами меҳрубон ва донишманд: рост ба савол, 1–2 ҷумлаи кӯтоҳ (то 35 калима), чунки онро овоз мехонад.',
            'Салом НАГӮ ва «саҳифаро бинед» НАГӮ, агар ҷавоб дар маълумот бошад — рост ба мағзи гап.',
            'Тоҷикӣ ТАНҲО бо алифбои кириллӣ нависед (ҳеҷ ҳарфи арабӣ/форсӣ).',
            'Шакли таҳсил: «рӯзона» = дневная/full-time, «ғоибона» = заочная, «фосилавӣ» = дистанционная, «шабона» = вечерняя.',
            `Ҷавоб ҲАТМАН бо забони ${langName}. Номи забонҳо, шаклҳо ва шаҳрҳоро ба ҳамин забон тарҷума кун.`,
            'Танҳо аз МАЪЛУМОТ истифода бар. Агар ҷавоб дар маълумот набошад, ростқавлона бигӯ, ки маълумот нест,',
            'ва пешниҳод кун, ки саҳифаи ихтисосро бинад. Рақамҳоро аз худ насоз. Бе Markdown, бе рӯйхат.',
            '',
            'МАЪЛУМОТ:',
            facts,
            '',
            `САВОЛ: ${message}`,
        ].join('\n');
        try {
            const raw = (await this.aiService.generateFast(prompt, 6000)).trim().replace(/^["«]|["»]$/g, '');
            // Ҳарфҳои арабӣ/форсӣ (гоҳо модел «دقت» менависад) — бардошта мешаванд.
            const clean = raw.replace(/\*\*/g, '').replace(/[؀-ۿ]+/g, '').replace(/\s{2,}/g, ' ').trim();
            return clean ? clean.slice(0, 400) : null;
        } catch {
            return null;
        }
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
            parts.push(lang === 'ru' ? `По оценке, начинающий специалист получает около ${salary.junior}, опытный — ${salary.mid}.`
                : lang === 'en' ? `Roughly, a beginner earns ${salary.junior} and an experienced specialist ${salary.mid}.`
                    : `Тахминан мутахассиси навкор ${salary.junior} ва ботаҷриба ${salary.mid} мегирад.`);
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
    async admissionScores(careerId: string, lang?: string) {
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
        // Номи донишгоҳ дар ҷадвали НМТ тоҷикӣ аст — бо забони корбар аз тарҷумаҳои ҳамон донишгоҳ.
        const translated = new Map<string, string>();
        if (lang === 'ru' || lang === 'en') {
            const names = [...new Set(rows.filter((row) => row.year === lastYear).map((row) => row.university))];
            if (names.length) {
                const found: Array<{ name: string; tr: string | null }> = await this.careerRepository.manager.query(
                    `SELECT name, translations->$2->>'name' AS tr FROM universities WHERE name = ANY($1)`, [names, lang]);
                for (const row of found) if (row.tr) translated.set(row.name, row.tr);
            }
        }
        const universities = rows
            .filter((row) => row.year === lastYear)
            .map((row) => ({
                university: translated.get(row.university) || row.university,
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
    async careerBrief(careerId: string, rawLang = 'tj'): Promise<{ text: string }> {
        const found = await this.careerRepository.findOne({ where: { id: careerId } });
        if (!found) throw new NotFoundException('Ихтисос ёфт нашуд');
        // Русӣ ва англисӣ: матнҳо аз тарҷумаҳои база (name, description, …), қолабҳо бо ҳамон забон.
        const lang = rawLang === 'ru' || rawLang === 'en' ? rawLang : 'tj';
        const tr = lang === 'tj' ? {} : ((found as any).translations?.[lang] || {});
        const career: any = { ...found, ...Object.fromEntries(Object.entries(tr).filter(([key, value]) => key !== '_fields' && value)) };
        const T = {
            tj: { and: 'ва', work: (x: string) => `Бо ин ихтисос дар ${x} кор карда метавонед.`, learn: (x: string) => `Шумо ${x}-ро меомӯзед.`,
                salary: (x: string) => `Маоши аввал ${x}.`, to: ' то ', score1: (y: number, a: number) => `Соли ${y} бали гузариш ${a} буд.`,
                score2: (y: number, a: number, b: number) => `Соли ${y} бали гузариш аз ${a} то ${b} буд.`, unis: (n: number) => n === 1 ? 'Онро як муассиса таълим медиҳад.' : `Онро ${n} муассиса таълим медиҳад.`,
                similar: (x: string) => `Ихтисосҳои монанд: ${x}.`, ask: 'Мехоҳед захира кунам ё бо дигараш муқоиса кунем?' },
            ru: { and: 'и', work: (x: string) => `С этой специальностью можно работать: ${x}.`, learn: (x: string) => `Вы изучите ${x}.`,
                salary: (x: string) => `Начальная зарплата от ${x}.`, to: ' до ', score1: (y: number, a: number) => `В ${y} году проходной балл был ${a}.`,
                score2: (y: number, a: number, b: number) => `В ${y} году проходной балл был от ${a} до ${b}.`, unis: (n: number) => n === 1 ? 'Её преподают в одном учебном заведении.' : `Её преподают в ${n} учебных заведениях.`,
                similar: (x: string) => `Похожие специальности: ${x}.`, ask: 'Сохранить её или сравнить с другой?' },
            en: { and: 'and', work: (x: string) => `With this specialty you can work in ${x}.`, learn: (x: string) => `You will learn ${x}.`,
                salary: (x: string) => `The starting salary is ${x}.`, to: ' to ', score1: (y: number, a: number) => `In ${y} the passing score was ${a}.`,
                score2: (y: number, a: number, b: number) => `In ${y} the passing score was from ${a} to ${b}.`, unis: (n: number) => n === 1 ? 'It is taught at one institution.' : `It is taught at ${n} institutions.`,
                similar: (x: string) => `Similar specialties: ${x}.`, ask: 'Shall I save it or compare it with another one?' },
        }[lang];

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
            items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${T.and} ${items[items.length - 1]}`;

        const parts: string[] = [];
        // Агар тавсиф худ бо номи ихтисос сар шавад, номро такрор намекунем.
        const about = firstSentence(career.description || career.purpose);
        const plain = (value: string) => value.toLowerCase().replace(/[«»"]/g, '').trim();
        parts.push(about && plain(about).startsWith(plain(career.name)) ? about
            : about ? `${career.name}. ${about}` : `${career.name}.`);

        const work = list(career.careerOpportunities).slice(0, 3)
            // «IT-отделы» — ихтисорро хурд намекунем.
            .map((item) => (/^[A-ZА-ЯЁ]{2}/.test(item) ? item : item.charAt(0).toLowerCase() + item.slice(1)));
        if (work.length) parts.push(T.work(join(work)));

        const techs = list(career.technologies).slice(0, 4);
        if (techs.length) parts.push(T.learn(join(techs)));

        const salary = (career.salaryAndMarket as any)?.junior;
        // «2 500» → «2500», вагарна рақамҳо ҷудо-ҷудо хонда мешаванд.
        if (salary) {
            const amount = String(salary).replace(/(\d)\s+(?=\d{3}(?!\d))/g, '$1').replace(/\s*[–—-]\s*/, T.to);
            parts.push(T.salary(lang === 'en' ? amount.replace(/сомонӣ/g, 'somoni') : lang === 'ru' ? amount.replace(/сомонӣ/g, 'сомони') : amount));
        }

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
                parts.push(lo === hi ? T.score1(rows[0].year, lo) : T.score2(rows[0].year, lo, hi));
            }
        }

        const unis: Array<{ n: number }> = await this.careerRepository.manager.query(
            'SELECT count(*)::int AS n FROM career_universities WHERE "careerId" = $1',
            [career.id],
        );
        if (unis[0]?.n) parts.push(T.unis(unis[0].n));

        const similar = [...new Set(list(career.relatedSpecializations))]
            .filter((item) => item !== career.name).slice(0, 2);
        if (similar.length) parts.push(T.similar(join(similar)));

        parts.push(T.ask);
        return { text: parts.join(' ') };
    }

    findOne(id: string): Promise<Career | null> {
        return this.careerRepository.findOne({ where: { id }, relations: ['cluster', 'universities'] });
    }

    findByCode(code: string): Promise<Career | null> {
        return this.careerRepository.findOne({ where: { code }, relations: ['cluster', 'universities'] });
    }

    async findOfferings(careerId: string, lang?: string, rawGrade?: string) {
        const grade = parseGrade(rawGrade);
        const offerings = await this.offeringRepository.find({
            where: grade ? { careerId, basedOn: grade } : { careerId },
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

    async selectMatchedCareers(userScores: any, rawGrade?: string | number, context?: { budget?: string; city?: string }): Promise<{
        cluster: Cluster | null;
        matchPercentage: number;
        careers: Career[];
        clusterScores: { cluster: Cluster; score: number }[];
        careerRanks: Map<string, number>;
        careerReasons: Map<string, string[]>;
        careerContext?: Map<string, { local: boolean; free: boolean }>;
        careerPercents: Map<string, number>;
    }> {
        const mmtScores = userScores?.mmtClusters || { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
        const clusters = await this.clusterRepository.find();

        const clusterScores = clusters
            .map(cluster => ({
                cluster,
                score: Number(mmtScores[`c${cluster.clusterId}`]) || 0,
            }))
            .sort((a, b) => b.score - a.score);

        // Корбар дар саволи «ду самт баробар» худаш интихоб кард — ҳамон самт асосӣ аст.
        const chosen = String(userScores?.chosenCluster || '');
        const top = clusterScores.find((entry) => `c${entry.cluster.clusterId}` === chosen) || clusterScores[0];
        if (!top) {
            return { cluster: null, matchPercentage: 0, careers: [], clusterScores, careerRanks: new Map(), careerReasons: new Map(), careerPercents: new Map() };
        }

        const matchPercentage = Math.min(
            100,
            Math.round((top.score / CareerService.MMT_MAX_SCORE) * 100),
        );

        // Баъди синфи 9 — танҳо ихтисосҳои коллеҷ (пешниҳоди «баъди синфи 9» доранд).
        const grade = parseGrade(rawGrade);
        const poolQuery = this.careerRepository.createQueryBuilder('career')
            .select(['career.id', 'career.name', 'career.description', 'career.purpose', 'career.skills', 'career.translations'])
            .where('career.clusterId = :clusterId', { clusterId: top.cluster.id });
        if (grade) poolQuery.andWhere(offeredForGrade('career'), { grade });
        const pool = await poolQuery.getMany();

        // Калидвожа танҳо аз аввали калима: пештар «ай» (AI) дар «ҳайвон», «тайёр»
        // ҳам ёфт мешуд ва ихтисосҳои тасодуфӣ мебаромаданд.
        const keywords: string[] = [...new Set<string>((userScores?.specialtyKeywords || [])
            .map((k: string) => String(k).toLowerCase().trim())
            .filter((k: string) => k.length >= 3))];
        const words = (text: string): string[] => text.toLowerCase().split(/[^0-9a-zа-яёӣӯқғҳҷ]+/i).filter(Boolean);
        const hits = (list: string[], keyword: string): boolean => list.some((word) => word.startsWith(keyword));

        // Хол ва калимаҳое, ки ихтисосро боло бурданд — барои «чаро ин ихтисос?».
        const reasons = new Map<string, string[]>();
        const scoreOf = (career: Career): number => {
            if (!keywords.length) return 0;

            const name = words(career.name || '');
            const body = words([
                career.description || '',
                career.purpose || '',
                ...(career.skills?.technical || []),
                ...(career.skills?.soft || []),
            ].join(' '));

            const matched: string[] = [];
            const total = keywords.reduce((sum, keyword) => {
                if (hits(name, keyword)) { matched.push(keyword); return sum + 4; }
                if (hits(body, keyword)) { matched.push(keyword); return sum + 1; }
                return sum;
            }, 0);
            reasons.set(career.id, matched);
            return total;
        };

        // Имкони хонанда: шаҳр ва «танҳо ройгон». Ихтисосро хориҷ намекунем (шояд омода
        // бошад кӯчад), вале ихтисосҳое, ки дар шаҳраш ё бо ҷойи ройгон ҳастанд, болотар.
        const city = String(context?.city || '').trim();
        const wantsFree = context?.budget === 'free';
        const extra = new Map<string, { local: boolean; free: boolean }>();
        if ((city || wantsFree) && pool.length) {
            const rows: Array<{ id: string; local: boolean; free: boolean }> = await this.careerRepository.manager.query(
                `SELECT o."careerId" AS id,
                        bool_or($2 <> '' AND u.city = $2) AS local,
                        bool_or(o."paymentType" = 'ройгон') AS free
                 FROM career_offerings o JOIN universities u ON u.id = o."universityId"
                 WHERE o."careerId" = ANY($1) AND ($3::int IS NULL OR o."basedOn" = $3)
                 GROUP BY 1`,
                [pool.map((c) => c.id), city, grade],
            );
            for (const row of rows) extra.set(row.id, { local: !!row.local, free: !!row.free });
        }
        const bonus = (id: string) => (extra.get(id)?.local ? 2 : 0) + (wantsFree && extra.get(id)?.free ? 2 : 0);

        // Як ном дар якчанд рамз (донишгоҳҳои гуногун) — як бор, то ҳамеша 12 ихтисоси гуногун бошад.
        const seenNames = new Set<string>();
        const ranked = pool
            .map(career => ({ career, rank: scoreOf(career) + bonus(career.id) }))
            // Лайкҳо ба тартиб таъсир намекунанд (вагарна «ҳалқаи маъруфият» мешуд):
            // аввал мувофиқат бо ҷавобҳо, баъд алифбо.
            .sort((a, b) =>
                b.rank - a.rank ||
                (a.career.name || '').localeCompare(b.career.name || ''))
            .filter(({ career }) => {
                const key = (career.name || '').trim().toLowerCase();
                if (seenNames.has(key)) return false;
                seenNames.add(key);
                return true;
            })
            .slice(0, 12);

        // Фоизи ҳар ихтисос = нисфаш мувофиқати самт (тести қисми 1), нисфаш мувофиқат бо
        // ҷавобҳои қисми 2 (калимаҳо) нисбат ба мувофиқтарин ихтисос. Бе калимаҳо — фоизи самт.
        const bestRank = Math.max(0, ...ranked.map((r) => r.rank));
        const careerPercents = new Map(ranked.map((r) => [
            r.career.id,
            bestRank > 0 ? Math.round(matchPercentage * 0.5 + (r.rank / bestRank) * 50) : matchPercentage,
        ]));

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
            careerReasons: reasons,
            careerContext: extra,
            careerPercents,
        };
    }

    // Натиҷа барои Dashboard. Фоиз = мувофиқати САМТ (як барои ҳамаи ихтисосҳои самт) ва
    // ростқавлона ҳамин тавр ном дорад. Тартиби ихтисосҳо аз калимаҳои ҷавобҳои қисми 2;
    // ҳамон калимаҳо ҳамчун «чаро ин ихтисос» дода мешаванд. Cosine/Euclidean бардошта шуд:
    // профили ихтисос танҳо як кластер дошт ва онҳо маълумоти нав намедоданд.
    async matchCareers(userScores: any): Promise<any[]> {
        const { careers, matchPercentage, clusterScores, careerRanks, careerReasons, careerPercents } =
            await this.selectMatchedCareers(userScores);

        const userProfile: Record<string, number> = {};
        for (const entry of clusterScores) {
            userProfile[`c${entry.cluster.clusterId}`] = Math.round((entry.score / CareerService.MMT_MAX_SCORE) * 100);
        }

        return careers.map((career, index) => {
            const universities = (career.universities || []);
            return {
                id: career.id,
                code: career.code,
                name: career.name,
                description: career.description,
                purpose: career.purpose,
                matchPercentage: careerPercents.get(career.id) ?? matchPercentage,
                clusterMatch: matchPercentage,
                rank: index + 1,
                keywordScore: careerRanks.get(career.id) ?? 0,
                reasons: careerReasons.get(career.id) ?? [],
                userProfile,
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
                `learningResources: ${career.learningResources ? JSON.stringify(resourcesForAi(career.learningResources)) : 'not provided'}`,
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

        // Координатаҳои корбар (кӯдак) ба AI фиристода намешаванд — масофа то донишгоҳҳо
        // дар сервер ҳисоб мешавад ва танҳо «N км» дар контексти ихтисосҳо меравад.
        const locationContext = '';

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
- If the user asks for a full explanation of a specialty, cover: what the specialist does, workplaces, 10-year outlook, technologies and first 3 practical steps.
- NEVER invent names of books, courses, certificates, people, websites or numbers. Mention learning resources ONLY if they appear in the provided context (learningResources); otherwise suggest the general type (e.g. "a beginner course in Python on Stepik or Coursera") without specific titles.
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

        const remaining = user && user.role !== UserRole.ADMIN ? await this.reserveAiQuota(user.id) : null;

        const careers = await this.findRelevantCareers(question, careerName);
        const prompt = this.buildCareerChatPrompt({
            question,
            careerName,
            lang,
            user,
            careers,
            userLocation,
        });
        
        let answer: string;
        try {
            answer = await this.aiService.generateContent(prompt);
        } catch (error) {
            // AI ҷавоб надод — савол аз квота гирифта намешавад.
            if (user && user.role !== UserRole.ADMIN) await this.refundAiQuota(user.id);
            throw error;
        }

        if (user && user.role !== UserRole.ADMIN) {
            const history = user.chatHistory || [];
            history.push({ question, answer, careerName: careerName || undefined, createdAt: new Date().toISOString() });
            if (history.length > 100) history.splice(0, history.length - 100);

            await this.userRepository.update(user.id, { chatHistory: history });
            return { answer, remainingToday: remaining };
        }

        return { answer, remainingToday: null };
    }

    // Лимити рӯзонаи AI — атомӣ: ҷой бо як UPDATE банд мешавад. Пештар лимит пеш аз AI
    // хонда ва баъд навишта мешуд — 30 дархости якбора ҳама «count = 0»-ро медиданд.
    private async reserveAiQuota(userId: string): Promise<number | null> {
        if (!LIMIT_ON) return null;
        const today = new Date().toISOString().slice(0, 10);
        const rows: Array<{ count: number }> = await this.userRepository.manager.query(
            `UPDATE "user" SET "aiDailyUsage" = jsonb_build_object(
                    'date', $2::text,
                    'count', CASE WHEN "aiDailyUsage"->>'date' = $2 THEN COALESCE(("aiDailyUsage"->>'count')::int, 0) + 1 ELSE 1 END)
             WHERE id = $1
               AND ("aiDailyUsage" IS NULL OR "aiDailyUsage"->>'date' IS DISTINCT FROM $2
                    OR COALESCE(("aiDailyUsage"->>'count')::int, 0) < $3)
             RETURNING ("aiDailyUsage"->>'count')::int AS count`,
            [userId, today, DAILY_LIMIT],
        );
        const result: any[] = Array.isArray(rows?.[0]) ? (rows as any)[0] : rows;
        if (!result?.length) {
            throw new ForbiddenException(`Имрӯз ${DAILY_LIMIT} савол тамом шуд. Фардо дубора кӯшиш кунед.`);
        }
        return Math.max(0, DAILY_LIMIT - Number(result[0].count));
    }

    // Баргардонидани квота, агар AI хато дод (корбар саволашро гум намекунад).
    async refundAiQuota(userId: string): Promise<void> {
        if (!LIMIT_ON || !userId) return;
        const today = new Date().toISOString().slice(0, 10);
        await this.userRepository.manager.query(
            `UPDATE "user" SET "aiDailyUsage" = jsonb_set("aiDailyUsage", '{count}',
                to_jsonb(GREATEST(COALESCE(("aiDailyUsage"->>'count')::int, 0) - 1, 0)))
             WHERE id = $1 AND "aiDailyUsage"->>'date' = $2`,
            [userId, today],
        ).catch(() => undefined);
    }

    // Ҳисобот ва муқоиса — гаронтарин дархостҳои AI — ҳам ба квотаи рӯзона дохиланд.
    async withAiQuota<T>(userId: string | undefined, work: () => Promise<T>): Promise<T> {
        if (!userId) return work();
        const user = await this.userRepository.findOne({ where: { id: userId }, select: ['id', 'role'] });
        const limited = !!user && user.role !== UserRole.ADMIN;
        if (limited) await this.reserveAiQuota(userId);
        try {
            return await work();
        } catch (error) {
            if (limited) await this.refundAiQuota(userId);
            throw error;
        }
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

        const limited = user && user.role !== UserRole.ADMIN;
        const remaining = limited ? await this.reserveAiQuota(user!.id) : null;

        const offerings = await this.findOfferings(careerId);
        let answer: string;
        try {
            answer = await this.aiService.generateContent(
                this.buildSingleCareerPrompt(career, offerings, question, lang),
            );
        } catch (error) {
            if (limited) await this.refundAiQuota(user!.id);
            throw error;
        }

        if (limited) {
            const history = user!.chatHistory || [];
            history.push({ question, answer, careerName: career.name, createdAt: new Date().toISOString() });
            if (history.length > 100) history.splice(0, history.length - 100);

            await this.userRepository.update(user!.id, { chatHistory: history });
            return { answer, remainingToday: remaining };
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

    // Ҳисоботи AI ~10–20 сония мегирад. Ҳамон холҳо + забон + ҷавобҳо → ҳамон ҳисобот:
    // бори дуюм аз хотираи сервер фавран (24 соат).
    private static readonly advisorCache = new Map<string, { at: number; report: any }>();
    private static readonly advisorRunning = new Map<string, Promise<any>>();

    async generateCareerAdvisorReport(scores: any, lang: string = 'tj', quizProfile?: any): Promise<any> {
        const cacheKey = createHash('sha1').update(JSON.stringify([
            lang, scores?.mmtClusters || scores, scores?.specialtyKeywords || [], scores?.chosenCluster || '',
        ])).digest('hex');
        const cached = CareerService.advisorCache.get(cacheKey);
        if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) return cached.report;
        // Як ҳисобот якбора: агар пешакӣ сохта шуда истода бошад, ҳамонро интизор мешавем.
        const running = CareerService.advisorRunning.get(cacheKey);
        if (running) return running;
        const work = this.buildCareerAdvisorReport(scores, lang, quizProfile);
        CareerService.advisorRunning.set(cacheKey, work);
        let report: any;
        try {
            report = await work;
        } finally {
            CareerService.advisorRunning.delete(cacheKey);
        }
        if (CareerService.advisorCache.size > 500) CareerService.advisorCache.clear();
        // Ҳисоботи захиравӣ (AI наомад) нигоҳ дошта намешавад — бори дигар аз нав кӯшиш мекунем.
        if (!report?.report?.fallback && !report?.fallback) CareerService.advisorCache.set(cacheKey, { at: Date.now(), report });
        return report;
    }

    private async buildCareerAdvisorReport(scores: any, lang: string = 'tj', quizProfile?: any): Promise<any> {
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

        const candidates = topMatches.slice(0, 6);
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
            c.technologies?.length ? `  technologies: ${c.technologies.slice(0, 8).join(', ')}` : '',
            c.salaryAndMarket ? `  salaryAndMarket: ${JSON.stringify(c.salaryAndMarket)}` : '',
            c.careerOpportunities?.length ? `  opportunities: ${c.careerOpportunities.join(', ')}` : '',
            c.universities?.length ? `  universities: ${c.universities.slice(0, 6).map((u) => `${u.name} (${u.city || 'city unknown'})`).join('; ')}` : '',
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
                task: 'Хулосаи кӯтоҳи он чи ҷавобҳои санҷиш дар бораи шавқҳои корбар нишон медиҳанд (НА таҳлили психологӣ ва НА ташхиси шахсият) ва тавсияҳои касбиро ПУРРА БО ЗАБОНИ ТОҶИКӢ (бо алифбои кириллии тоҷикӣ) омода кунед. Тавсияҳо бояд ба ихтисосҳои воқеии боло зикршуда асос ёбанд.',
                format: 'Ҷавобро ТАНҲО дар қолаби JSON-и зерин баргардонед (бидуни ягон матни иловагӣ ё блокҳои код):',
                personalityAnalysis: "Он чи ҷавобҳои шумо нишон медиҳанд: шавқҳо ва тарзи кор, бо такя ба ҷавобҳои мушаххас. Ҳукм дар бораи шахсият накунед.",
                name: "Номи ихтисос (аз рӯйхати боло)",
                shortDescription: "Тавсифи мухтасар ва чаро ин ихтисос ба ин шахс мувофиқ аст",
                career: "Номи ихтисос",
                reason: "Сабаби мушаххаси интихоби ин ихтисос: кадом ҷавобҳо ва самт ба он ишора мекунанд",
                targetCareer: "Ихтисоси асосӣ барои оғоз",
                stepTitle: "Номи қадам (масалан, Омӯзиши иловагӣ)",
                stepDuration: "6 моҳ / 1 сол",
                stepDescription: "Тавсифи пурраи он ки дар ин қадам чӣ бояд кард"
            },
            Russian: {
                task: 'Подготовьте краткий вывод о том, что ответы теста говорят об интересах пользователя (НЕ психологический анализ и НЕ диагностика личности), и профессиональные рекомендации ПОЛНОСТЬЮ НА РУССКОМ ЯЗЫКЕ. Рекомендации должны быть основаны на реальных специальностях, указанных выше.',
                format: 'Возвращайте ответ СТРОГО в следующем формате JSON (без какого-либо дополнительного текста или блоков кода):',
                personalityAnalysis: "Что показывают ваши ответы: интересы и стиль работы, со ссылкой на конкретные ответы. Не делайте выводов о личности.",
                name: "Название специальности (из списка выше)",
                shortDescription: "Краткое описание и почему эта специальность подходит человеку",
                career: "Название специальности",
                reason: "Конкретная причина выбора этой специальности: какие ответы и направление на неё указывают",
                targetCareer: "Основная специальность для старта",
                stepTitle: "Название шага (например, Дополнительное обучение)",
                stepDuration: "6 месяцев / 1 год",
                stepDescription: "Полное описание того, что нужно сделать на этом шаге"
            },
            English: {
                task: 'Prepare a short summary of what the test answers say about the user\'s interests (NOT a psychological analysis and NOT a personality diagnosis) and career recommendations COMPLETELY IN ENGLISH. Recommendations must be based on the real careers listed above.',
                format: 'Return the response STRICTLY in the following JSON format (without any extra text or code blocks):',
                personalityAnalysis: "What your answers show: interests and working style, referring to specific answers. Do not make claims about personality.",
                name: "Career name (from the list above)",
                shortDescription: "Brief description and why this career suits the person",
                career: "Career name",
                reason: "Specific reason for this career: which answers and direction point to it",
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

Use the detailed answers above, not only the numeric scores. Describe what the answers show about interests and work style. You are NOT a psychologist: do not diagnose personality, do not write "you are a natural leader" type claims, do not call anything scientific.
For learning resources use ONLY items listed in the careers' learningResources above. Do NOT invent book titles, authors, course names or URLs; if none are listed, name only well-known platforms (Stepik, Coursera, Khan Academy) without specific titles.
Include a QUALITATIVE outlook for the target career (trends, opportunities, risks, skills that will matter) — WITHOUT any numbers, percentages, salaries, probabilities or demand levels. Nobody has data for such forecasts; do not invent them.

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
    "risks": ["Risk or challenge"]
  }
}
`;

        let rawResponse: string;
        try {
            // Модели тез (Flash-Lite): ~2–3 баробар тезтар аз модели пурра барои ҳамин ҳисоботи дароз.
            rawResponse = await this.aiService.generateLite(prompt, 20_000);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('Хатогӣ ҳангоми тавлиди тавсияи AI');
        }

        const parseReport = (raw: string) => {
            const text = String(raw || '').replace(/```(?:json)?/gi, '').trim();
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            return JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
        };
        let report: any;
        try {
            report = parseReport(rawResponse);
        } catch {
            // Модели тез JSON-ро вайрон кард — як бор бо модели пурра.
            try {
                report = parseReport(await this.aiService.generateContent(prompt, { timeoutMs: 55_000 }));
            } catch {
                report = null;
            }
        }
        if (!report) {
            report = {
                fallback: true,
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
            // Фоизро AI намесозад: ҳамон мувофиқати самт аз ҳисоби тест.
            const realPercent = top3[0]?.matchPercentage ?? 0;
            for (const rec of report.careerRecommendations) if (rec) rec.matchPercentage = realPercent;
            const kept = report.careerRecommendations.filter((r: any) => keepReal(r?.name));
            report.careerRecommendations = kept.length
                ? kept
                : top3.map((m: any) => ({
                    name: m.name,
                    matchPercentage: m.matchPercentage,
                    shortDescription: '',
                }));
        }
        // Пешгӯиҳои рақамӣ (эҳтимоли муваффақият, маош ва талабот баъди 10 сол) маълумот
        // надоранд — агар AI ҳам онҳоро нависад, бардошта мешаванд.
        delete report.successPrediction;
        if (report?.tenYearOutlook) {
            delete report.tenYearOutlook.salaryOutlook;
            delete report.tenYearOutlook.demandOutlook;
        }
        for (const field of ['explanation']) {
            if (Array.isArray(report?.[field])) {
                report[field] = report[field].filter((item: any) => keepReal(item?.career));
            }
        }
        if (report?.careerRoadmap && !keepReal(report.careerRoadmap.targetCareer)) {
            report.careerRoadmap.targetCareer = top3[0]?.name ?? '';
        }

        // Захираи сохта нест: пештар агар AI ин қисмҳоро намедод, барои ҲАР ихтисос як хел
        // «китоби муқаддимавӣ», маоши «1 500 – 3 000», «талабот: баланд» ва «ин ҷавоб дар
        // тавсия истифода шуд» навишта мешуд — маълумоте, ки вуҷуд надорад. Ҳоло қисми
        // холӣ дар саҳифа нишон дода намешавад.
        if (Array.isArray(report?.quizAnswerAnalysis)) {
            report.quizAnswerAnalysis = report.quizAnswerAnalysis.filter((item: any) => item?.insight);
        } else if (quizAnswers.length) {
            report.quizAnswerAnalysis = quizAnswers.map((answer) => ({
                question: answer.question || answer.questionId,
                answer: answer.selectedText || String(answer.selectedValue),
            }));
        }

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
                salaryRange: "холӣ гузоред — маошро сервер аз база илова мекунад",
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
                salaryRange: "оставьте пустым — зарплату добавит сервер из базы",
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
                salaryRange: "leave empty — the server adds salary from the database",
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
${compareQuestion?.trim() || 'No custom question. Compare broadly by fit, learning difficulty, pros/cons and qualitative future trends (no invented numbers).'}

If the user asks about jobs/places, include workplaces and university/employer context when available.
If the user asks about money, compare tuition from the data above; do NOT invent salary numbers.
If the user asks about 10 years, describe trends and automation risk in words only — no numbers, percentages or forecasts.
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

        // Рақамҳо аз маълумоти мо, на аз AI: фоиз — мувофиқати САМТ-и ихтисос аз тест;
        // маош — «тахмини муаллиф» аз база (танҳо барои ихтисосҳои бо тавсифи пурра).
        const mmtScores = scores?.mmtClusters || scores || {};
        const byCareer = new Map(careers.map((c) => [foldTajik(String(c.name).trim()), c]));
        if (Array.isArray(report?.careerComparison)) {
            for (const item of report.careerComparison) {
                const career: any = byCareer.get(foldTajik(String(item?.career || '').trim()));
                const clusterNo = career?.cluster?.clusterId;
                const score = Number(mmtScores?.[`c${clusterNo}`]);
                if (hasQuizScores && clusterNo && Number.isFinite(score)) {
                    item.matchPercentage = Math.max(0, Math.min(100, Math.round((score / CareerService.MMT_MAX_SCORE) * 100)));
                } else {
                    delete item.matchPercentage;
                }
                const salary = career?.contentWritten ? career?.salaryAndMarket : null;
                if (salary?.junior) item.salaryRange = `≈ ${salary.junior}${salary.mid ? ` … ${salary.mid}` : ''}`;
                else delete item.salaryRange;
            }
        }

        return report;
    }
}
