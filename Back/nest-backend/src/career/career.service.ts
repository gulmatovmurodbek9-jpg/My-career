import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, HttpException } from '@nestjs/common';
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
        'start_quiz', 'open_universities', 'open_report', 'open_plan', 'answer',
    ];

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
        },
    };

    private async resolveCareer(name?: string): Promise<Career | null> {
        const wanted = String(name || '').trim();
        if (wanted.length < 3) return null;

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

        // 3) Роҳи охирин: ҳамон ранкинги ҷустуҷӯи чат.
        const ranked = await this.findRelevantCareers(wanted);
        if ((ranked as any).isFallback) return null;
        return ranked[0] || null;
    }

    async assistant(rawMessage: string, lang = 'tj', context: { careerName?: string } = {}) {
        const message = String(rawMessage || '').trim().slice(0, 400);
        const answerLang = ['tj', 'ru', 'en'].includes(lang) ? lang : 'tj';
        const langName = answerLang === 'ru' ? 'русӣ' : answerLang === 'en' ? 'англисӣ' : 'тоҷикӣ';
        if (!message) return { reply: '', action: 'answer', params: {}, answerLang };

        const readJson = (raw: string) => {
            let text = raw.trim();
            if (text.startsWith('```json')) text = text.slice(7);
            else if (text.startsWith('```')) text = text.slice(3);
            if (text.endsWith('```')) text = text.slice(0, -3);
            return JSON.parse(text.trim());
        };

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
            '- open_career — кушодани як ихтисоси мушаххас. params: {"name": "номи ихтисос"}',
            '- compare — муқоисаи ду ё зиёда ихтисос. params: {"names": ["ном1", "ном2"]}',
            '- save_career — захира кардани ихтисос. params: {"name": "номи ихтисос"}',
            '- start_quiz — оғози санҷиши касбӣ. params: {}',
            '- open_universities — донишгоҳҳо, як донишгоҳи мушаххас ё харита. params: {"name": "номи донишгоҳ", "city": "шаҳр"}',
            '- open_report — ҳисоботи AI аз рӯи санҷиш. params: {}',
            '- open_plan — рӯйхати ҳуҷҷатсупорӣ. params: {}',
            '- answer — танҳо ҷавоби шифоҳӣ, бе амал. params: {}',
            '',
            'ФОРМАТИ ҶАВОБ — танҳо JSON:',
            '{"action": "ном", "params": {...}, "reply": "як ҷумлаи кӯтоҳ"}',
            '',
            'МИСОЛҲО:',
            '«Салом, ман намедонам кадом касбро интихоб кунам» → {"action":"answer","params":{},"reply":"Биёед санҷиш гузарем. Сар кунам?"}',
            '«Ҳа, сар кун» → {"action":"start_quiz","params":{},"reply":"Санҷиш оғоз ёфт."}',
            '«Духтуриро кушо» → {"action":"open_career","params":{"name":"Духтур"},"reply":"Кушодам."}',
            '',
            'ҚОИДАҲО:',
            `- "reply" бо забони ${langName}, ҲАТМАН кӯтоҳ: то 15 калима, чунки онро овоз мехонад.`,
            '- Агар аниқ нафаҳмидӣ, "action": "answer" гузор ва саволи равшанкунанда бипурс.',
            '- Салом, шикоят ё саволи умумӣ → "answer". Амалро танҳо вақте интихоб кун, ки корбар онро равшан хоста бошад.',
            '- Номи ихтисосро тахмин накун; калимаи худи корбарро нависед.',
            '- Рақам, нарх ё номи донишгоҳ аз худат насоз.',
        ].filter(Boolean).join(String.fromCharCode(10));

        let parsed: any = null;
        try {
            parsed = readJson(await this.aiService.generateContent(prompt, { timeoutMs: 20000 }));
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

        if (action === 'search') {
            const rawQuery = String(given.query || message).trim().slice(0, 200);

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

        if (action === 'open_universities') {
            // «донишгоҳи Миллиро ёб» — аввал номи мушаххасро меҷӯем,
            // вагарна корбар ба рӯйхати 33-тоӣ мерасад.
            const wantedName = String(given.name || '').trim();
            if (wantedName.length >= 3) {
                const rows: Array<{ id: string; name: string }> = await this.careerRepository.manager.query(
                    `SELECT id, name FROM universities
                     WHERE ${TAJIK_FOLD('name')} LIKE $1
                        OR ${TAJIK_FOLD(`coalesce("shortName", '')`)} LIKE $1
                     ORDER BY (CASE WHEN ${TAJIK_FOLD('name')} LIKE $2 THEN 0 ELSE 1 END), length(name)
                     LIMIT 1`,
                    [`%${foldTajik(wantedName)}%`, `${foldTajik(wantedName)}%`],
                );
                if (rows[0]) params = { id: rows[0].id, name: rows[0].name };
            }

            if (!params.id) {
                const city = String(given.city || '').trim();
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
        const replyKey = action === 'open_universities' && params.id ? 'open_career' : action;
        const canned = CareerService.ASSISTANT_REPLIES[answerLang]?.[replyKey];
        return { reply: canned || reply, action, params, answerLang };
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

        const keywords: string[] = (userScores?.specialtyKeywords || [])
            .map((k: string) => k.toLowerCase())
            .filter(Boolean);

        const scoreOf = (career: Career): number => {
            if (!keywords.length) return 0;

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
