import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { Career } from '../career/career.entity';
import * as bcrypt from 'bcrypt';

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
        const DAILY_LIMIT = 5;

        const usedToday = usage.date === today ? usage.count : 0;
        return {
            usedToday,
            remainingToday: Math.max(0, DAILY_LIMIT - usedToday),
            limit: DAILY_LIMIT,
            isAdmin: false,
        };
    }
}
