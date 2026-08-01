import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Career } from '../career/career.entity';
import { Cluster } from '../cluster/cluster.entity';
import { QUIZ_QUESTIONS, QuizQuestion, QuizPart } from './data/questions';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { AiService } from '../ai/ai.service';

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
        @InjectRepository(Career)
        private readonly careerRepository: Repository<Career>,
        @InjectRepository(Cluster)
        private readonly clusterRepository: Repository<Cluster>,
        private readonly aiService: AiService,
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
        // Only return part 1 questions for the initial fetch
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

        for (const answer of dto.answers) {
            const question = QUIZ_QUESTIONS.find((q) => q.id === answer.questionId);
            if (!question) continue;

            const optionIndex = Number(answer.selectedValue);
            const selectedOption = question.options[optionIndex];

            if (question.part === QuizPart.MMT && selectedOption) {
                // Now MMT questions direct points to specific clusters
                for (const [type, points] of Object.entries(selectedOption.scores)) {
                    if (type in scores.mmtClusters) {
                        (scores.mmtClusters as any)[type] += Number(points);
                    }
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

        return scores;
    }

    async matchCareers(userScores: UserScores, lang: string = 'tj'): Promise<any> {
        const clusters = await this.clusterRepository.find({ relations: ['careers'] });
        
        // Match user's mmt score directly with the cluster id
        const clusterScores = clusters.map(cluster => {
            let score = 0;
            switch(cluster.clusterId) {
                case 1: score = userScores.mmtClusters.c1; break;
                case 2: score = userScores.mmtClusters.c2; break;
                case 3: score = userScores.mmtClusters.c3; break;
                case 4: score = userScores.mmtClusters.c4; break;
                case 5: score = userScores.mmtClusters.c5; break;
            }
            return { cluster, score };
        });

        clusterScores.sort((a, b) => b.score - a.score);

        const topClusterEntry = clusterScores[0];
        if (!topClusterEntry) {
            return { topCluster: null, topType: '', personality: '', aiAdvice: '', allMatches: [] };
        }

        const topCluster = topClusterEntry.cluster;

        const maxPossible = 40; // 10 questions * 4 points max per question
        const clusterMatchPct = Math.min(100, Math.round((topClusterEntry.score / maxPossible) * 100));

        let topCareers = await this.careerRepository.find({
            where: { clusterId: topCluster.id },
            take: 24, // Fetch more to rank them
        });

        // Refinement sorting based on specialty keywords
        if (userScores.specialtyKeywords && userScores.specialtyKeywords.length > 0) {
            topCareers.forEach(career => {
                let matchPoints = 0;
                const searchString = `${career.name} ${career.description || ''} ${career.purpose || ''} ${(career.skills?.technical || []).join(' ')} ${(career.skills?.soft || []).join(' ')}`.toLowerCase();
                
                userScores.specialtyKeywords.forEach(keyword => {
                    if (searchString.includes(keyword.toLowerCase())) {
                        matchPoints += 1;
                    }
                });
                (career as any).refinementScore = matchPoints;
            });
            // Sort by refinement score descending
            topCareers.sort((a: any, b: any) => (b.refinementScore || 0) - (a.refinementScore || 0));
        }

        // Limit to top 12 for the UI
        topCareers = topCareers.slice(0, 12);

        const specializations = topCareers.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            purpose: c.purpose,
            matchPercentage: clusterMatchPct,
            tuitionFee: c.tuitionFee,
        }));

        const personality = "Натиҷаи тести шумо мутобиқати баландро бо " + topCluster.clusterName + " нишон медиҳад.";
        const aiAdvice = await this.generateAiAdvice(userScores, topCluster, topCareers, lang);

        return {
            topCluster: {
                id: topCluster.id,
                clusterName: topCluster.clusterName,
                clusterNumber: topCluster.clusterId,
                clusterDescription: topCluster.description,
                specializations,
                averageMatch: clusterMatchPct,
            },
            topType: "Cluster " + topCluster.clusterId,
            personality,
            aiAdvice,
            allMatches: clusterScores.map(cs => ({
                clusterName: cs.cluster.clusterName,
                score: cs.score,
            })),
        };
    }

    private async generateAiAdvice(userScores: UserScores, cluster: Cluster, careers: Career[], lang: string = 'tj'): Promise<string> {
        let text = "Based on your quiz, we recommend you prepare for MMT Cluster " + cluster.clusterId + " exams.";
        if (lang === 'tj') text = "Дар асоси тести шумо, мо тавсия медиҳем, ки барои имтиҳонҳои Кластери " + cluster.clusterId + " ММТ тайёрӣ бинед.";
        if (lang === 'ru') text = "Основываясь на вашем тесте, мы рекомендуем вам готовиться к экзаменам Кластера " + cluster.clusterId + " НЦТ.";
        return text;
    }
}
