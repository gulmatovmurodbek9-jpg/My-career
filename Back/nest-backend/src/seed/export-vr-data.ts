/**
 * Содироти маълумоти саволҳо ва векторҳои санҷишӣ барои барномаи VR.
 *
 * Чаро ин лозим аст: барномаи Unity профилро ХУДАШ дар C# ҳисоб мекунад, то
 * дар фестивал бе интернет кор кунад. Агар саволҳо ва баллҳо дар ду ҷо дастӣ
 * нигоҳ дошта шаванд, онҳо рӯзе аз ҳам ҷудо мешаванд ва натиҷаи айнак бо
 * натиҷаи сайт мувофиқ намеояд. Аз ин рӯ манбаи ягона `questions.ts` мемонад,
 * ва ин скрипт аз он ду файл месозад:
 *
 *   vr-questions.json — худи саволҳо барои Unity
 *   vr-golden.json    — ҷавобҳои намунавӣ бо натиҷаи ҲИСОБКАРДАИ backend,
 *                       ки тести C# бо он муқоиса мешавад
 *
 * Иҷро:  npm run export:vr
 */

import * as fs from 'fs';
import * as path from 'path';
import { QUIZ_QUESTIONS, QuizPart } from '../quiz/data/questions';
import { QuizService } from '../quiz/quiz.service';

/** Ҷои Unity-и лоиҳа — файлҳо рост ба StreamingAssets мераванд. */
const OUT_DIR = path.resolve(__dirname, '../../../../VR/Assets/StreamingAssets');

/**
 * `JsonUtility`-и Unity калиди набудаистодаро аз сифр фарқ карда наметавонад
 * ва `Dictionary`-ро умуман намехонад. Аз ин рӯ ҳамаи панҷ кластер ҳамеша
 * навишта мешаванд, ҳатто агар холашон сифр бошад.
 */
function normalizeScores(scores?: Record<string, number>) {
    return {
        c1: Number(scores?.c1 ?? 0),
        c2: Number(scores?.c2 ?? 0),
        c3: Number(scores?.c3 ?? 0),
        c4: Number(scores?.c4 ?? 0),
        c5: Number(scores?.c5 ?? 0),
    };
}

function exportQuestions() {
    const questions = QUIZ_QUESTIONS.map(q => ({
        id: q.id,
        part: q.part as string,
        type: q.type as string,
        targetCluster: q.targetCluster ?? '',
        question: {
            tj: q.question?.tj ?? '',
            ru: q.question?.ru ?? '',
            en: q.question?.en ?? '',
        },
        options: (q.options ?? []).map(o => ({
            text: {
                tj: o.text?.tj ?? '',
                ru: o.text?.ru ?? '',
                en: o.text?.en ?? '',
            },
            scores: normalizeScores(o.scores),
            keywords: o.keywords ?? [],
        })),
    }));

    return { questions };
}

/**
 * Векторҳои санҷишӣ.
 *
 * `calculateScores` ба ягон вобастагӣ даст намерасонад, аз ин рӯ хидматро бе
 * DI сохтан мумкин аст — ин ҷо танҳо худи формула санҷида мешавад.
 */
function exportGolden() {
    const service = new QuizService(null as any, null as any);

    const mmt = QUIZ_QUESTIONS.filter(q => q.part === QuizPart.MMT);
    const specialty = QUIZ_QUESTIONS.filter(q => q.part === QuizPart.SPECIALTY);

    const cases: Array<{ name: string; answers: Array<{ questionId: string; selectedValue: any }> }> = [];

    /* 1–5: ҳар дафъа ҳамаи ҷавобҳо ба як кластер — профили тоза.
       Интизор меравад: ҳамон кластер 40, боқимонда 0. */
    for (let cluster = 0; cluster < 5; cluster++) {
        cases.push({
            name: `hama-javob-c${cluster + 1}`,
            answers: mmt.map(q => ({ questionId: q.id, selectedValue: cluster })),
        });
    }

    /* 6: омехта — вариантҳо навбат ба навбат. */
    cases.push({
        name: 'omekhta',
        answers: mmt.map((q, i) => ({ questionId: q.id, selectedValue: i % 5 })),
    });

    /* 7: ҷавоби нопурра — танҳо нисфи саволҳо. */
    cases.push({
        name: 'nimta-javob',
        answers: mmt.slice(0, 5).map(q => ({ questionId: q.id, selectedValue: 0 })),
    });

    /* 8: саволи номавҷуд бояд бесадо партофта шавад. */
    cases.push({
        name: 'savoli-nomavjud',
        answers: [
            { questionId: 'in-savol-nest', selectedValue: 0 },
            ...mmt.slice(0, 3).map(q => ({ questionId: q.id, selectedValue: 1 })),
        ],
    });

    /* 9: индекси берун аз ҳудуд — бе шикастан. */
    cases.push({
        name: 'indeksi-beruna',
        answers: mmt.slice(0, 3).map(q => ({ questionId: q.id, selectedValue: 99 })),
    });

    /* 10: калидвожаҳои саволҳои ихтисос ҷамъ мешаванд. */
    cases.push({
        name: 'kalidvozhaho',
        answers: [
            ...mmt.map(q => ({ questionId: q.id, selectedValue: 0 })),
            ...specialty.slice(0, 3).map(q => ({ questionId: q.id, selectedValue: 0 })),
        ],
    });

    /* 11: рақам ҳамчун сатр — Unity метавонад ҳамин тавр фиристад. */
    cases.push({
        name: 'raqam-hamchun-satr',
        answers: mmt.slice(0, 4).map(q => ({ questionId: q.id, selectedValue: '2' })),
    });

    /* 12: ҷавобҳои холӣ. */
    cases.push({ name: 'javob-nest', answers: [] });

    const vectors = cases.map(c => {
        const result = service.calculateScores({ answers: c.answers as any });
        return {
            name: c.name,
            answers: c.answers.map(a => ({
                questionId: a.questionId,
                selectedValue: String(a.selectedValue),
            })),
            expected: {
                scores: {
                    c1: result.mmtClusters.c1,
                    c2: result.mmtClusters.c2,
                    c3: result.mmtClusters.c3,
                    c4: result.mmtClusters.c4,
                    c5: result.mmtClusters.c5,
                },
                specialtyKeywords: result.specialtyKeywords,
            },
        };
    });

    return { vectors };
}

function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const questions = exportQuestions();
    const golden = exportGolden();

    const questionsPath = path.join(OUT_DIR, 'vr-questions.json');
    const goldenPath = path.join(OUT_DIR, 'vr-golden.json');

    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
    fs.writeFileSync(goldenPath, JSON.stringify(golden, null, 2), 'utf8');

    const byPart = questions.questions.reduce<Record<string, number>>((acc, q) => {
        acc[q.part] = (acc[q.part] ?? 0) + 1;
        return acc;
    }, {});

    console.log('✅ Маълумоти VR содир шуд');
    console.log(`   ${questionsPath}`);
    console.log(`   ${questions.questions.length} савол:`, byPart);
    console.log(`   ${goldenPath}`);
    console.log(`   ${golden.vectors.length} вектори санҷишӣ`);
}

main();
