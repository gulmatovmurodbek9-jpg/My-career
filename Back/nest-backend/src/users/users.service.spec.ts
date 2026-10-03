import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';

// Нест кардани ҳисоб — ягона амали тамоман бебозгашт дар сайт.
function build(user: any) {
    const calls: string[] = [];
    const deleted: string[] = [];
    const manager = {
        query: async (sql: string) => { calls.push(sql); },
        getRepository: () => ({ delete: async (id: string) => { deleted.push(id); } }),
    };
    const repo: any = {
        findOne: async () => user,
        manager: { transaction: async (work: any) => work(manager) },
    };
    const service = new UsersService(repo, {} as any, {} as any);
    return { service, calls, deleted };
}

describe('UsersService.deleteOwnAccount', () => {
    it('ҳамаи маълумоти корбарро дар як транзаксия нест мекунад', async () => {
        const { service, calls, deleted } = build({ id: 'u1', role: UserRole.USER });
        await service.deleteOwnAccount('u1');
        expect(calls.some((sql) => sql.includes('DELETE FROM appointment'))).toBe(true);
        expect(calls.some((sql) => sql.includes('DELETE FROM quiz_attempts'))).toBe(true);
        expect(deleted).toEqual(['u1']);
    });

    it('хатои база пинҳон намешавад (транзаксия бекор мешавад)', async () => {
        const { service } = build({ id: 'u1', role: UserRole.USER });
        (service as any).usersRepository.manager.transaction = async (work: any) => work({
            query: async (sql: string) => { if (sql.includes('quiz_attempts')) throw new Error('relation does not exist'); },
            getRepository: () => ({ delete: async () => undefined }),
        });
        await expect(service.deleteOwnAccount('u1')).rejects.toThrow('relation does not exist');
    });

    it('админ худашро аз ин ҷо нест карда наметавонад', async () => {
        const { service, deleted } = build({ id: 'a1', role: UserRole.ADMIN });
        await expect(service.deleteOwnAccount('a1')).rejects.toBeInstanceOf(ForbiddenException);
        expect(deleted).toEqual([]);
    });

    it('корбари номавҷуд — 404', async () => {
        const { service } = build(null);
        await expect(service.deleteOwnAccount('x')).rejects.toBeInstanceOf(NotFoundException);
    });
});
