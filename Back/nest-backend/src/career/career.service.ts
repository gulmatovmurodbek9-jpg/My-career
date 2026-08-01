import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, In } from 'typeorm';
import { Career } from './career.entity';
import { CareerOffering } from './career-offering.entity';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { GetCareersDto } from './dto/get-careers.dto';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { User, UserRole } from '../users/user.entity';

const DAILY_LIMIT = 5;

@Injectable()
export class CareerService {
    constructor(
        @InjectRepository(Career)
        private careerRepository: Repository<Career>,
        @InjectRepository(CareerOffering)
        private offeringRepository: Repository<CareerOffering>,
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
                '(career.name ILIKE :search OR career.description ILIKE :search OR career.code ILIKE :search)',
                { search: `%${search}%` },
            );
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
    async findOfferings(careerId: string) {
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
                university: {
                    id: offering.university?.id,
                    name: offering.university?.name,
                    city: offering.university?.city,
                    region: offering.university?.region,
                    institutionType: offering.university?.institutionType,
                    isState: offering.university?.isState,
                },
            }))
            .sort((a, b) => (a.tuitionFee ?? -1) - (b.tuitionFee ?? -1));
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

    async matchCareers(userScores: any): Promise<any[]> {
        const careers = await this.careerRepository.find();
        const mmtScores = userScores?.mmtClusters || { c1:0, c2:0, c3:0, c4:0, c5:0 };
        const maxScore = 60; // Max possible score

        const scored = careers.map(career => {
            const clusterId = career.mmtCluster || 1;
            let clusterScore = 0;
            switch(clusterId) {
                case 1: clusterScore = mmtScores.c1 || 0; break;
                case 2: clusterScore = mmtScores.c2 || 0; break;
                case 3: clusterScore = mmtScores.c3 || 0; break;
                case 4: clusterScore = mmtScores.c4 || 0; break;
                case 5: clusterScore = mmtScores.c5 || 0; break;
            }

            const matchPercentage = Math.min(100, Math.round((clusterScore / maxScore) * 100));

            return {
                id: career.id,
                name: career.name,
                description: career.description,
                purpose: career.purpose,
                matchPercentage,
                likesCount: career.likesCount,
                _score: matchPercentage
            };
        });

        scored.sort((a, b) => b._score - a._score);
        return scored.slice(0, 12);
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
            'ихтисос', 'ихтисосҳои', 'профессия', 'профессии', 'хочу', 'где', 'что', 'как', 'the', 'and', 'for',
        ]);

        return Array.from(new Set(
            text
                .split(' ')
                .map((word) => word.trim())
                .filter((word) => word.length >= 3 && !stopWords.has(word)),
        )).slice(0, 8);
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
                    const condition = `
                        career.name ILIKE :${param}
                        OR career.description ILIKE :${param}
                        OR career.purpose ILIKE :${param}
                        OR cluster.clusterName ILIKE :${param}
                        OR universities.name ILIKE :${param}
                        OR universities.city ILIKE :${param}
                    `;
                    if (index === 0) where.where(condition, { [param]: `%${term}%` });
                    else where.orWhere(condition, { [param]: `%${term}%` });
                });
            }));
        }

        const matched = await qb
            .orderBy('career.likesCount', 'DESC')
            .take(10)
            .getMany();

        if (matched.length >= 4) return matched;

        const fallback = await this.careerRepository.find({
            relations: ['cluster', 'universities'],
            order: { likesCount: 'DESC' },
            take: 10,
        });

        const byId = new Map<string, Career>();
        [...matched, ...fallback].forEach((career) => byId.set(career.id, career));
        return Array.from(byId.values()).slice(0, 10);
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
        if (!user) return 'Guest user or profile not loaded.';

        const saved = (user.savedCareers || []).slice(0, 12).map((career) => career.name).join(', ') || 'none';
        const liked = (user.likedCareers || []).slice(0, 12).map((career) => career.name).join(', ') || 'none';

        return [
            `name: ${user.name || 'not provided'}`,
            `email: ${user.email || 'not provided'}`,
            `role: ${user.role}`,
            `quizResults: ${user.quizResults ? JSON.stringify(user.quizResults) : 'not completed'}`,
            `savedCareers: ${saved}`,
            `likedCareers: ${liked}`,
        ].join('\n');
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
        const locationContext = params.userLocation
            ? `latitude=${params.userLocation.latitude}, longitude=${params.userLocation.longitude}`
            : 'not provided';

        return `
You are MyCareer AI, a practical career advisor for students in Tajikistan.
Answer in ${language}. If the user writes in Tajik, use natural Tajik Cyrillic.

USER QUESTION:
${params.question}

SELECTED CAREER FIELD:
${params.careerName || 'not selected'}

USER PROFILE AND HISTORY:
${userContext}

USER LOCATION:
${locationContext}

DATABASE CONTEXT - use this first, do not invent facts that are missing:
${careerContext}

TASK:
- Give a useful chat answer based on the user's profile, quiz results, saved careers, and database context.
- If the user asks for salary like 3000-4000 somoni, compare it with salaryAndMarket when available; when not available, say it is an estimate and explain why.
- If the user asks for a city, university, price, or distance, list matching universities with city, tuitionFee, duration, and distanceFromUserKm when available.
- If the user asks for a full explanation of a specialty, cover: what the specialist does, workplaces, 10-year outlook, technologies, books, video courses, certifications, and first 3 practical steps.
- If the user asks for doctor/medical fields, prefer cluster 5 or health-related rows if they exist in the database context.
- If official university website or current tuition is missing from context, clearly say it is not in the database yet and recommend checking the official admissions page. Do not invent links or prices.
- Keep the tone friendly and concise, but give enough detail to act.
- Format with short headings and bullet points. Avoid JSON.
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
            if (usage.count >= DAILY_LIMIT) {
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
            return { answer, remainingToday: Math.max(0, DAILY_LIMIT - usage.count) };
        }

        return { answer, remainingToday: DAILY_LIMIT };
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
        const topNames = top3.map((career) => career.name).filter(Boolean);
        const detailedCareers = topNames.length
            ? await this.careerRepository.find({
                where: { name: In(topNames) },
                relations: ['cluster', 'universities'],
            })
            : [];

        const careersContext = (detailedCareers.length ? detailedCareers : top3).map((c: any) => [
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

        const prompt = `Шумо як мушовири касбии ботаҷриба ҳастед. 
Натиҷаҳои санҷиши MMT-и корбар (Кластерҳои Маркази Миллии Тестӣ): ${JSON.stringify(mmt)}.
Ихтисосҳои мувофиқтарин аз базаи мо барои ин корбар:
${careersContext}

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
            riasecScores: scores?.riasec || scores?.cognitive || mmt,
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
Натиҷаҳои санҷиши MMT-и корбар: ${JSON.stringify(mmt)}.
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
