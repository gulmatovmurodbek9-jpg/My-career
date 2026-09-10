import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { Career } from '../career/career.entity';
import { CareerOffering } from '../career/career-offering.entity';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt } from 'crypto';

/* Дар база ҷои ройгон маҳз бо ҳамин калима нишон дода мешавад. */
const FREE_PAYMENT_TYPE = 'ройгон';

/* Тартиби шаклҳои таҳсил дар рӯйхати чоп. */
const STUDY_FORM_ORDER = ['рӯзона', 'шабона', 'ғоибона', 'фосилавӣ'];

/* Ҳадди интихобҳо дар як рӯйхати ҳуҷҷатсупорӣ. */
const MAX_APPLICATION_CHOICES = 12;

/* Коди барқарорсозӣ 15 дақиқа эътибор дорад. */
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

/* Баъди 5 кӯшиши нодуруст код бекор мешавад. */
const MAX_RESET_ATTEMPTS = 5;

export type PasswordResetResult = 'ok' | 'invalid' | 'expired' | 'too_many_attempts';

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

const DEFAULT_SPECIALIST_AVAILABILITY = {
    monday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    thursday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    friday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    saturday: ['10:00', '11:00', '12:00'],
};

const DEFAULT_SPECIALISTS = [
    {
        name: 'Фаррух Ализода',
        email: 'farrukh.specialist@mycareer.tj',
        password: 'specialist123',
        phoneNumber: '+992 90 111 22 33',
        specialization: 'Мушовири интихоби касб',
        bio: 'Мутахассиси роҳнамоии касбӣ бо таҷрибаи кор бо довталабон, интихоби кластерҳо ва таҳияи нақшаи таҳсил.',
        meetingLocation: 'Душанбе, маркази машваратии Ихтисоси ман',
        ratingAverage: 4.8,
        ratingCount: 12,
    },
    {
        name: 'Мадина Каримова',
        email: 'madina.specialist@mycareer.tj',
        password: 'specialist123',
        phoneNumber: '+992 93 222 44 55',
        specialization: 'Психологи касбӣ',
        bio: 'Бо тестҳои шавқ, қобилият ва профили шахсӣ кор мекунад, то донишҷӯ ихтисоси мувофиқтарро интихоб намояд.',
        meetingLocation: 'Душанбе, кӯчаи Рӯдакӣ 45',
        ratingAverage: 4.9,
        ratingCount: 18,
    },
];

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Career)
        private careerRepository: Repository<Career>,
        @InjectRepository(CareerOffering)
        private offeringRepository: Repository<CareerOffering>,
    ) { }

    async findOne(email: string): Promise<User | undefined> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findAll(): Promise<Partial<User>[]> {
        const users = await this.usersRepository.find({
            order: { createdAt: 'DESC' },
        });
        return users.map(({ password, chatHistory, aiDailyUsage, ...rest }) => rest);
    }

    async deleteUser(id: string): Promise<void> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('Корбар ёфт нашуд');
        }
        await this.usersRepository.remove(user);
    }

    async changeRole(id: string, newRole: string): Promise<Partial<User>> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('Корбар ёфт нашуд');
        }
        if (newRole === UserRole.ADMIN) user.role = UserRole.ADMIN;
        else if (newRole === UserRole.SPECIALIST) {
            user.role = UserRole.SPECIALIST;
            this.applyDefaultSpecialistProfile(user);
        } else user.role = UserRole.USER;
        const saved = await this.usersRepository.save(user);
        const { password, chatHistory, aiDailyUsage, ...result } = saved;
        return result;
    }

    async findById(id: string): Promise<User | undefined> {
        return this.usersRepository.findOne({ where: { id }, relations: ['savedCareers', 'likedCareers'] });
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.findOne(createUserDto.email);
        if (existingUser) {
            throw new ConflictException('Корбар аллакай вуҷуд дорад');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });

        return this.usersRepository.save(user);
    }

    async findOrCreateGoogleUser(profile: { email: string; name?: string; avatarUrl?: string }): Promise<User> {
        const existingUser = await this.findOne(profile.email);
        if (existingUser) {
            let changed = false;
            if (!existingUser.name && profile.name) {
                existingUser.name = profile.name;
                changed = true;
            }
            if (!existingUser.avatarUrl && profile.avatarUrl) {
                existingUser.avatarUrl = profile.avatarUrl;
                changed = true;
            }
            return changed ? this.usersRepository.save(existingUser) : existingUser;
        }

        const user = this.usersRepository.create({
            email: profile.email,
            name: profile.name || profile.email.split('@')[0],
            avatarUrl: profile.avatarUrl,
            password: null,
            role: UserRole.USER,
        });

        return this.usersRepository.save(user);
    }

    async findSpecialists(activeOnly = true): Promise<Partial<User>[]> {
        await this.ensureDefaultSpecialists();

        const where: any = { role: UserRole.SPECIALIST };
        if (activeOnly) where.isActive = true;

        const specialists = await this.usersRepository.find({
            where,
            order: { ratingAverage: 'DESC', ratingCount: 'DESC', name: 'ASC' },
        });

        return specialists.map(({ password, chatHistory, aiDailyUsage, ...rest }) => rest);
    }

    async createSpecialist(dto: CreateSpecialistDto): Promise<Partial<User>> {
        const existingUser = await this.findOne(dto.email);
        if (existingUser) {
            throw new ConflictException('Корбар бо ин email аллакай вуҷуд дорад');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const specialist = this.usersRepository.create({
            ...dto,
            password: hashedPassword,
            role: UserRole.SPECIALIST,
            isActive: dto.isActive ?? true,
            weeklyAvailability: dto.weeklyAvailability || DEFAULT_SPECIALIST_AVAILABILITY,
        });

        const saved = await this.usersRepository.save(specialist);
        const { password, chatHistory, aiDailyUsage, ...result } = saved;
        return result;
    }

    async updateSpecialist(id: string, dto: Partial<CreateSpecialistDto>): Promise<Partial<User>> {
        const specialist = await this.usersRepository.findOne({ where: { id, role: UserRole.SPECIALIST } });
        if (!specialist) {
            throw new NotFoundException('Мутахассис ёфт нашуд');
        }

        const { password, ...rest } = dto;
        Object.assign(specialist, rest);
        if (password) {
            specialist.password = await bcrypt.hash(password, 10);
        }

        const saved = await this.usersRepository.save(specialist);
        const { password: _password, chatHistory, aiDailyUsage, ...result } = saved;
        return result;
    }

    private applyDefaultSpecialistProfile(user: User): void {
        user.isActive = true;
        user.specialization = user.specialization || 'Мушовири касбӣ';
        user.bio = user.bio || 'Мутахассиси роҳнамоии касбӣ. Маълумоти пурраро админ метавонад баъдтар илова кунад.';
        user.meetingLocation = user.meetingLocation || 'Маркази машваратӣ';
        user.weeklyAvailability = user.weeklyAvailability || DEFAULT_SPECIALIST_AVAILABILITY;
    }

    private async ensureDefaultSpecialists(): Promise<void> {
        const existingCount = await this.usersRepository.count({
            where: { role: UserRole.SPECIALIST },
        });
        if (existingCount > 0) return;

        for (const item of DEFAULT_SPECIALISTS) {
            const existingUser = await this.findOne(item.email);
            if (existingUser) continue;

            const hashedPassword = await bcrypt.hash(item.password, 10);
            const specialist = this.usersRepository.create({
                ...item,
                password: hashedPassword,
                role: UserRole.SPECIALIST,
                isActive: true,
                weeklyAvailability: DEFAULT_SPECIALIST_AVAILABILITY,
            });
            await this.usersRepository.save(specialist);
        }
    }

    /**
     * Сохтани токени барқарорсозии парол.
     *
     * Худи токен бармегардад (вай ба нома меравад), вале дар база танҳо
     * sha256-и он нигоҳ дошта мешавад: агар база дуздида шавад, аз hash
     * пайванди кордиҳанда сохтан мумкин нест.
     */
    async createPasswordResetCode(email: string): Promise<{ user: User; code: string } | null> {
        const user = await this.findOne(email);
        // Корбари бо Google воридшуда парол надорад, вале гузоштани парол
        // тавассути ҳамин раванд ба ӯ иҷозат дода мешавад.
        if (!user) return null;

        // randomInt аз Math.random фарқ мекунад: он аз манбаи криптографӣ
        // мегирад, яъне коди навбатиро пешгӯӣ кардан мумкин нест.
        const code = String(randomInt(0, 1_000_000)).padStart(6, '0');

        await this.usersRepository.update(user.id, {
            resetTokenHash: hashCode(code),
            resetTokenExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
            resetAttempts: 0,
        });

        return { user, code };
    }

    /** Гузоштани пароли нав аз рӯи коди аз почта омада. */
    async resetPasswordWithCode(
        email: string,
        code: string,
        newPassword: string,
    ): Promise<PasswordResetResult> {
        const user = await this.usersRepository.findOne({
            where: { email },
            select: ['id', 'resetTokenHash', 'resetTokenExpiresAt', 'resetAttempts'],
        });

        if (!user?.resetTokenHash || !user.resetTokenExpiresAt) return 'invalid';
        if (user.resetTokenExpiresAt.getTime() < Date.now()) return 'expired';

        if (user.resetAttempts >= MAX_RESET_ATTEMPTS) {
            // Коди дуздидашуда набояд беохир озмуда шавад.
            await this.usersRepository.update(user.id, {
                resetTokenHash: null,
                resetTokenExpiresAt: null,
            });
            return 'too_many_attempts';
        }

        if (hashCode(code.trim()) !== user.resetTokenHash) {
            await this.usersRepository.update(user.id, { resetAttempts: user.resetAttempts + 1 });
            return 'invalid';
        }

        await this.usersRepository.update(user.id, {
            password: await bcrypt.hash(newPassword, 10),
            // Код якдафъаина аст — баъди истифода тоза мешавад.
            resetTokenHash: null,
            resetTokenExpiresAt: null,
            resetAttempts: 0,
        });

        return 'ok';
    }

    /**
     * Рӯйхати ҳуҷҷатсупорӣ бо тартиби омодаи чоп.
     *
     * Тартиб: аввал ҷойҳои РОЙГОН, баъд пулакӣ; дар дохили ҳар гурӯҳ аз рӯи
     * шакли таҳсил ва нархи камтар. Довталаб маҳз бо ҳамин тартиб ҳуҷҷат
     * месупорад — аввал ҷои буҷавиро мегирад, баъд шартномаро ҳамчун захира.
     */
    async getApplicationPlan(userId: string): Promise<{
        cluster: { id: string; name: string; number: number } | null;
        items: any[];
    }> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        const ids = user?.applicationChoices || [];
        if (!ids.length) return { cluster: null, items: [] };

        const offerings = await this.offeringRepository.find({
            where: { id: In(ids) },
            relations: ['career', 'career.cluster', 'university'],
        });

        const isFree = (offering: CareerOffering) => offering.paymentType === FREE_PAYMENT_TYPE;

        offerings.sort((a, b) => {
            if (isFree(a) !== isFree(b)) return isFree(a) ? -1 : 1;
            const formDiff = STUDY_FORM_ORDER.indexOf(a.studyForm) - STUDY_FORM_ORDER.indexOf(b.studyForm);
            if (formDiff !== 0) return formDiff;
            return (a.tuitionFee ?? 0) - (b.tuitionFee ?? 0);
        });

        const first = offerings[0]?.career?.cluster;

        return {
            cluster: first
                ? { id: first.id, name: first.clusterName, number: first.clusterId }
                : null,
            items: offerings.map((offering, index) => ({
                order: index + 1,
                offeringId: offering.id,
                careerId: offering.career?.id,
                code: offering.career?.code,
                careerName: offering.career?.name,
                universityName: offering.university?.name,
                universityShortName: offering.university?.shortName,
                city: offering.university?.city,
                studyForm: offering.studyForm,
                paymentType: offering.paymentType,
                isFree: isFree(offering),
                tuitionFee: offering.tuitionFee,
                seats: offering.seats,
                language: offering.language,
            })),
        };
    }

    /**
     * Илова кардани як интихоб.
     *
     * Ҳамаи интихобҳо бояд аз ЯК кластер бошанд: дар ММТ довталаб имтиҳони
     * як кластерро месупорад, аз ин рӯ омехтани кластери 1 ва 2 дар
     * ҳуҷҷатсупории воқеӣ имконнопазир аст.
     */
    async addApplicationChoice(userId: string, offeringId: string): Promise<{ added: boolean }> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Корбар ёфт нашуд');

        const offering = await this.offeringRepository.findOne({
            where: { id: offeringId },
            relations: ['career', 'career.cluster'],
        });
        if (!offering) throw new NotFoundException('Чунин пешниҳод ёфт нашуд');

        const current = user.applicationChoices || [];
        if (current.includes(offeringId)) return { added: false };

        if (current.length >= MAX_APPLICATION_CHOICES) {
            throw new ConflictException(
                `Дар рӯйхат аз ${MAX_APPLICATION_CHOICES} интихоб зиёд шуда наметавонад`,
            );
        }

        if (current.length) {
            const existing = await this.offeringRepository.findOne({
                where: { id: current[0] },
                relations: ['career', 'career.cluster'],
            });
            const existingCluster = existing?.career?.cluster;
            const newCluster = offering.career?.cluster;

            if (existingCluster && newCluster && existingCluster.id !== newCluster.id) {
                throw new ConflictException(
                    `Дар рӯйхат аллакай ихтисоси кластери «${existingCluster.clusterName}» ҳаст. ` +
                    `Дар ММТ ҳуҷҷат танҳо ба як кластер супорида мешавад — ` +
                    `аввал рӯйхатро тоза кунед ё ихтисоси ҳамон кластерро интихоб намоед.`,
                );
            }
        }

        await this.usersRepository.update(user.id, {
            applicationChoices: [...current, offeringId],
        });
        return { added: true };
    }

    async removeApplicationChoice(userId: string, offeringId: string): Promise<{ removed: boolean }> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Корбар ёфт нашуд');

        const current = user.applicationChoices || [];
        const next = current.filter((id) => id !== offeringId);
        if (next.length === current.length) return { removed: false };

        await this.usersRepository.update(user.id, { applicationChoices: next });
        return { removed: true };
    }

    async clearApplicationPlan(userId: string): Promise<{ cleared: number }> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Корбар ёфт нашуд');

        const count = (user.applicationChoices || []).length;
        await this.usersRepository.update(user.id, { applicationChoices: [] });
        return { cleared: count };
    }

    async saveQuizResults(userId: string, scores: any): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Корбар ёфт нашуд');
        }
        user.quizResults = scores;
        return this.usersRepository.save(user);
    }

    async toggleSaveCareer(userId: string, careerId: string): Promise<{ saved: boolean }> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['savedCareers'],
        });
        if (!user) {
            throw new NotFoundException('Корбар ёфт нашуд');
        }

        const career = await this.careerRepository.findOne({ where: { id: careerId } });
        if (!career) {
            throw new NotFoundException('Ихтисос ёфт нашуд');
        }

        const alreadySaved = user.savedCareers.some((c) => c.id === careerId);

        if (alreadySaved) {
            await this.usersRepository
                .createQueryBuilder()
                .relation(User, 'savedCareers')
                .of(userId)
                .remove(careerId);
            return { saved: false };
        } else {
            await this.usersRepository
                .createQueryBuilder()
                .relation(User, 'savedCareers')
                .of(userId)
                .add(careerId);
            return { saved: true };
        }
    }

    async getSavedCareers(userId: string): Promise<Career[]> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['savedCareers', 'savedCareers.cluster', 'savedCareers.universities'],
        });
        if (!user) {
            throw new NotFoundException('Корбар ёфт нашуд');
        }
        return user.savedCareers;
    }

    async getLikedCareers(userId: string): Promise<Career[]> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['likedCareers', 'likedCareers.cluster', 'likedCareers.universities'],
        });
        if (!user) {
            throw new NotFoundException('Корбар ёфт нашуд');
        }
        return user.likedCareers;
    }

    async getTotalUsers(): Promise<number> {
        return this.usersRepository.count();
    }

    async getChatHistory(userId: string) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Корбар ёфт нашуд');
        return user.chatHistory || [];
    }

    async getAiUsage(userId: string) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Корбар ёфт нашуд');

        if (user.role === UserRole.ADMIN) {
            return { usedToday: 0, remainingToday: null, limit: null, isAdmin: true };
        }

        const today = new Date().toISOString().slice(0, 10);
        const usage = user.aiDailyUsage || { date: null, count: 0 };
        // 0 = бе лимит; ба career.service.ts мувофиқ.
        const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 0);

        const usedToday = usage.date === today ? usage.count : 0;
        return {
            usedToday,
            remainingToday: DAILY_LIMIT > 0 ? Math.max(0, DAILY_LIMIT - usedToday) : null,
            limit: DAILY_LIMIT > 0 ? DAILY_LIMIT : null,
            isAdmin: false,
        };
    }
}
