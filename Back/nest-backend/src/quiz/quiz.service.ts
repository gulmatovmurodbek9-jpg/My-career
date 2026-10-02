import { Injectable } from '@nestjs/common';
import { parseGrade } from '../common/grade';
import { Career } from '../career/career.entity';
import { Cluster } from '../cluster/cluster.entity';
import { QUIZ_QUESTIONS, QuizQuestion, QuizPart } from './data/questions';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { AiService } from '../ai/ai.service';
import { CareerService } from '../career/career.service';

export interface MMTScores {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
}

export interface UserScores {
    mmtClusters: MMTScores;
    cognitive: Record<string, number>;
    motivation: Record<string, any>;
    specialtyKeywords: string[];
}

@Injectable()
export class QuizService {
    constructor(
        private readonly aiService: AiService,
        private readonly careerService: CareerService,
    ) { }

    getQuestions(): QuizQuestion[] {
        return this.getRandomQuestions();
    }

    private shuffleArray<T>(arr: T[]): T[] {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    private getRandomQuestions(): QuizQuestion[] {
        const baseQuestions = QUIZ_QUESTIONS.filter(q => q.part !== QuizPart.SPECIALTY);
        return this.shuffleArray(baseQuestions);
    }

    getSpecialtyQuestions(clusterNumber: string | number): QuizQuestion[] {
        const target = `c${clusterNumber}`;
        const specialtyQuestions = QUIZ_QUESTIONS.filter(q => q.part === QuizPart.SPECIALTY && q.targetCluster === target);
        return this.shuffleArray(specialtyQuestions);
    }

    calculateScores(dto: SubmitQuizDto): UserScores {
        const scores: UserScores = {
            mmtClusters: { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 },
            cognitive: {},
            motivation: {},
            specialtyKeywords: []
        };

        // Холҳои хом ва ҳадди имконпазир барои ҳар кластер — баъд ба миқёси 0–40.
        const CLUSTERS = ['c1', 'c2', 'c3', 'c4', 'c5'] as const;
        const raw: Record<string, number> = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
        const max: Record<string, number> = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
        let tiebreak: string | null = null;
        const seen = new Set<string>();

        for (const answer of dto.answers) {
            // Саволи «кадоме аз ин ду самт наздиктар?» — вақте ки ду самт баробар баромаданд.
            if (answer.questionId === 'tiebreak') {
                const value = String(answer.selectedValue);
                if ((CLUSTERS as readonly string[]).includes(value)) tiebreak = value;
                continue;
            }
            if (seen.has(answer.questionId)) continue;
            seen.add(answer.questionId);

            const question = QUIZ_QUESTIONS.find((q) => q.id === answer.questionId);
            if (!question) continue;

            const optionIndex = Number(answer.selectedValue);
            const selectedOption = question.options[optionIndex];

            if (question.part === QuizPart.MMT && selectedOption) {
                for (const key of CLUSTERS) {
                    max[key] += Math.max(0, ...question.options.map((o) => Number(o.scores?.[key]) || 0));
                    raw[key] += Number(selectedOption.scores?.[key]) || 0;
                }
            } else if (question.part === QuizPart.MOTIVATION) {
                const optText = selectedOption?.text?.en || answer.selectedValue;
                scores.motivation[question.type] = optText;
            } else if (question.part === QuizPart.SPECIALTY) {
                if (selectedOption?.keywords) {
                    scores.specialtyKeywords.push(...selectedOption.keywords);
                }
            }
        }

        for (const key of CLUSTERS) {
            scores.mmtClusters[key] = max[key] > 0 ? Math.round((raw[key] / max[key]) * 400) / 10 : 0;
        }
        if (tiebreak) {
            scores.mmtClusters[tiebreak as keyof MMTScores] = Math.min(40, scores.mmtClusters[tiebreak as keyof MMTScores] + 3);
        }

        return scores;
    }

    async matchCareers(userScores: UserScores, lang: string = 'tj', rawGrade?: number | string): Promise<any> {
        const grade = parseGrade(rawGrade);
        const selection = await this.careerService.selectMatchedCareers(userScores, grade ?? undefined);
        const { clusterScores, careers: topCareers, matchPercentage: clusterMatchPct } = selection;

        const topCluster = selection.cluster;
        if (!topCluster) {
            return { topCluster: null, topType: '', personality: '', aiAdvice: '', allMatches: [] };
        }

        const specializations = topCareers.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            purpose: c.purpose,
            matchPercentage: clusterMatchPct,
            tuitionFee: c.tuitionFee,
            // Номи ихтисос бо забони корбар — фронтенд аз ин тарҷума мегирад.
            translations: c.translations,
        }));

        const personality = "Натиҷаи тести шумо мутобиқати баландро бо " + topCluster.clusterName + " нишон медиҳад.";
        const aiAdvice = await this.generateAiAdvice(userScores, topCluster, topCareers, lang, clusterScores, grade);

        return {
            grade,
            topCluster: {
                id: topCluster.id,
                clusterName: topCluster.clusterName,
                clusterNumber: topCluster.clusterId,
                clusterDescription: topCluster.description,
                specializations,
                averageMatch: clusterMatchPct,
            },
            topType: topCluster.clusterName,
            personality,
            aiAdvice,
            allMatches: clusterScores.map(cs => ({
                clusterName: cs.cluster.clusterName,
                score: cs.score,
            })),
        };
    }

    private async generateAiAdvice(
        userScores: UserScores,
        cluster: Cluster,
        careers: Career[],
        lang: string = 'tj',
        clusterScores: { cluster: Cluster; score: number }[] = [],
        grade: number | null = null,
    ): Promise<string> {
        const fallback = this.staticAdvice(cluster, lang);

        try {
            const langName = lang === 'ru' ? 'русӣ' : lang === 'en' ? 'англисӣ' : 'тоҷикӣ';

            const others = clusterScores
                .filter(cs => cs.cluster.id !== cluster.id)
                .map(cs => `${cs.cluster.clusterName}: ${cs.score}`)
                .join(', ');

            const motivation = Object.entries(userScores.motivation || {})
                .map(([k, v]) => `${k}: ${v}`)
                .join('; ') || 'нишон дода нашуд';

            const keywords = (userScores.specialtyKeywords || []).slice(0, 12).join(', ') || 'нест';

            const prompt = [
                'Ту мушовири касбии ботаҷрибаи тоҷик ҳастӣ. Бо хонандаи мактаб сӯҳбат мекунӣ,',
                'ки навакак тести касбии ММТ супорид. Ӯро «шумо» муроҷиат кун.',
                '',
                'НАТИҶАИ ТЕСТ:',
                `- Кластери пешбар: ${cluster.clusterName}`,
                cluster.description ? `- Тавсифи кластер: ${cluster.description}` : '',
                others ? `- Холи кластерҳои дигар: ${others}` : '',
                `- Ангезаҳои интихобкарда: ${motivation}`,
                `- Мавзӯъҳое, ки ҷавобҳо ба онҳо ишора мекунанд (танҳо барои фаҳмиши ту): ${keywords}`,
                `- Ихтисосҳои мувофиқ: ${careers.slice(0, 6).map(c => c.name).join(', ')}`,
                grade === 9 ? '- Хонанда БАЪДИ СИНФИ 9 аст: танҳо ба КОЛЛЕҶ дохил шуда метавонад. Дар бораи донишгоҳ ва имтиҳони донишгоҳ нагӯ.' : '',
                grade === 11 ? '- Хонанда баъди синфи 11 аст: ҳам коллеҷ, ҳам донишгоҳ мумкин.' : '',
                '',
                'ВАЗИФА:',
                'Маслиҳати кӯтоҳ ва мушаххас нависед аз 3–4 ҷумла:',
                '1) чаро маҳз ин самт ба ҷавобҳои ӯ мувофиқ аст — бо калимаҳои оддӣ, ба ангезаҳо ва мавзӯъҳои боло такя кунед;',
                '2) ба кадом фанҳо диққати бештар диҳад;',
                '3) як қадами мушаххаси наздик (чӣ кор кунад).',
                '',
                'ҚОИДАҲО:',
                `- Танҳо бо забони ${langName} нависед.`,
                '- Матни оддӣ, бе рӯйхат, бе сарлавҳа, бе Markdown.',
                '- Маълумоти сохта нанависед: рақами имтиҳон, сана ё номи донишгоҳро тахмин накунед.',
                '- Гарму дилгарм, вале бе шиору муболиға.',
                '- Калидвожаҳо, холҳо ва истилоҳҳои дохилиро айнан ва дар нохунак нанависед (масалан, «кибер», «информ»).',
                '- Агар холи чанд кластер баробар ё наздик бошад, ростқавлона гӯед, ки якчанд самт мувофиқ аст.',
                '- Ҳадди аксар 90 калима.',
            ].filter(Boolean).join('\n');

            const text = (await this.aiService.generateContent(prompt))?.trim();
            return text && text.length > 40 ? text : fallback;
        } catch (error) {
            console.error('AI advice афтод, матни захиравӣ истифода мешавад:', error?.message || error);
            return fallback;
        }
    }

    private staticAdvice(cluster: Cluster, lang: string): string {
        if (lang === 'ru') {
            return `Основываясь на вашем тесте, мы рекомендуем готовиться к экзаменам кластера «${cluster.clusterName}» НЦТ.`;
        }
        if (lang === 'en') {
            return `Based on your quiz, we recommend preparing for the "${cluster.clusterName}" MMT cluster exams.`;
        }
        return `Дар асоси тести шумо, мо тавсия медиҳем, ки барои имтиҳонҳои кластери «${cluster.clusterName}» ММТ тайёрӣ бинед.`;
    }

    async interpretAnswer(
        rawQuestion?: string,
        rawOptions?: string[],
        rawText?: string,
        rawLang?: string,
    ): Promise<{ position: number | null }> {
        const question = String(rawQuestion || '').trim().slice(0, 300);
        const options = (Array.isArray(rawOptions) ? rawOptions : [])
            .map((option) => String(option || '').trim().slice(0, 200))
            .slice(0, 6);
        const text = String(rawText || '').trim().slice(0, 300);
        if (!question || options.length < 2 || text.length < 2) return { position: null };

        const prompt = [
            'Дар санҷиши касбӣ корбар ба ҷои интихоби вариант ҷавоби худро навишт.',
            'Муайян кун, ки ин ҷавоб аз рӯи МАЪНО ба кадом вариант наздиктар аст.',
            'Агар ҷавоб ба ҳеҷ вариант умуман рабт надошта бошад (масалан, шӯхӣ, бемаънӣ, «намедонам»), null деҳ.',
            '',
            `САВОЛ: ${question}`,
            'ВАРИАНТҲО:',
            ...options.map((option, index) => `${index + 1}. ${option}`),
            '',
            `ҶАВОБИ КОРБАР: ${text}`,
            '',
            'Танҳо JSON: {"option": рақами вариант (1-' + options.length + ') ё null}',
        ].join(String.fromCharCode(10));

        try {
            const raw = await this.aiService.generateFast(prompt, 6000);
            const match = String(raw || '').match(/"option"\s*:\s*(\d+|null)/);
            const number = match && match[1] !== 'null' ? Number(match[1]) : NaN;
            return { position: number >= 1 && number <= options.length ? number - 1 : null };
        } catch {
            return { position: null };
        }
    }
}
