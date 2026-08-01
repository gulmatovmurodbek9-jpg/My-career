/**
 * Builds a career page for specialties that do not yet have a hand-written entry.
 *
 * Content comes from the specialty's professional family (`families.ts`) combined
 * with its own name and level, so a generated page is specific — a page about
 * "Коркарди конҳои канданиҳои фоиданок (корҳои пармакунӣ)" talks about mining,
 * not about "the chosen field". A hand-written batch entry always wins over this.
 */
import { CareerContent } from './types';
import { resolveFamily } from './families';

/** NTC codes starting with 1 are higher education; 2 is secondary vocational. */
function levelOf(code: string): { degreeType: string; durationYears: number; isHigher: boolean } {
    const isHigher = code.startsWith('1');
    return {
        isHigher,
        degreeType: isHigher ? 'Бакалавр' : 'Миёнаи касбӣ',
        durationYears: isHigher ? 4 : 3,
    };
}

/** Drops the parenthetical qualifier: "Математика (омӯзгорӣ)" → "Математика". */
function baseName(name: string): string {
    return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function buildStubContent(
    name: string,
    clusterNumber: number,
    code = '',
): Omit<CareerContent, 'code'> {
    const family = resolveFamily(name, clusterNumber);
    const level = levelOf(code);
    const short = baseName(name);

    const roadmap = level.isHigher
        ? [
            'Соли 1: фанҳои умумӣ ва заминаи назариявии ихтисос',
            `Соли 2: фанҳои махсуси «${short}» ва корҳои амалӣ`,
            'Соли 3: таҷрибаомӯзӣ дар ташкилоти соҳавӣ',
            'Соли 4: кори хатм (дипломӣ) ва интихоби самти касбӣ',
            'Баъди хатм: кори аввал ҳамчун мутахассиси ҷавон, баъд рушд то мутахассиси пешбар',
        ]
        : [
            'Соли 1: фанҳои умумӣ ва асосҳои ихтисос',
            `Соли 2: малакаи амалии «${short}» дар устохона ва лаборатория`,
            'Соли 3: таҷрибаомӯзӣ дар ҷои кории воқеӣ ва кори хатм',
            'Баъди хатм: кор аз рӯи ихтисос ё идомаи таҳсил дар донишгоҳ',
        ];

    return {
        description:
            `«${name}» ихтисоси соҳаи ${family.field} мебошад. Мутахассиси ин соҳа ${family.summary}. ` +
            `Таҳсил дар ${level.isHigher ? 'зинаи бакалавр (4 сол)' : 'зинаи таҳсилоти миёнаи касбӣ (2–3 сол)'} ` +
            `сурат мегирад ва ҳам дониши назариявӣ, ҳам малакаи амалиро дар бар мегирад. ` +
            `Дар Тоҷикистон ин ихтисос дар якчанд муассисаи таълимӣ пешниҳод мешавад — рӯйхати пурраи ` +
            `донишгоҳҳо, шаклҳои таҳсил ва нархҳо дар поён оварда шудааст.`,
        purpose:
            `Тайёр кардани мутахассиси соҳаи ${family.field} аз рӯи самти «${short}», ки дар бозори меҳнати ` +
            `Тоҷикистон рақобатпазир бошад ва малакаи амалии барои кор заруриро дошта бошад.`,
        skills: {
            technical: family.technical,
            soft: family.soft,
        },
        technologies: family.technologies,
        roadmap,
        projectsExamples: [
            `Кори курсӣ аз фанҳои асосии ихтисоси «${short}»`,
            'Ҳисоботи таҷрибаомӯзӣ дар ташкилоти соҳавӣ',
            level.isHigher ? 'Кори хатм (дипломӣ)' : 'Кори хатми амалӣ',
        ],
        learningResources: {
            books: family.books,
            courses: family.courses,
            blogs: family.blogs,
        },
        careerOpportunities: family.opportunities,
        salaryAndMarket: family.salary,
        relatedSpecializations: [],
        advice: family.advice,
        certification: family.certification,
        durationYears: level.durationYears,
        degreeType: level.degreeType,
    };
}
