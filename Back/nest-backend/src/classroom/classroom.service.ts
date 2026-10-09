import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';

// Ҳуҷраи омӯзгор: омӯзгор синф месозад, хонандагон бо рамз ҳамроҳ мешаванд (бо ҳисоб
// ё бе почта — танҳо бо ном) ва омӯзгор натиҷаи тест ва санҷиши касби онҳоро мебинад.
// Нақши «омӯзгор»-ро админ медиҳад (дархости «Ман омӯзгор ҳастам» ё дастӣ).

// Бе 0/O/1/I/L — то дар тахта ва аз телефон хато хонда нашавад.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const MAX_CLASSES = 30;
const MAX_MEMBERS = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const hash = (secret: string) => createHash('sha256').update(secret).digest('hex');
const average = (list: number[]) => (list.length ? Math.round((list.reduce((sum, value) => sum + value, 0) / list.length) * 10) / 10 : null);

export interface Actor {
    userId: string;
    role?: string;
}

export interface ClassroomInput {
    name?: string;
    school?: string;
    city?: string;
    grade?: number | string | null;
    archived?: boolean;
}

export interface TeacherRequestInput {
    school?: string;
    subject?: string;
    city?: string;
    phone?: string;
    note?: string;
}

type TrialRow = { careerId: string | null; careerName: string | null; solved: number; tasks: Array<{ liked?: boolean }>; rating: number | null; confBefore: number | null; confAfter: number | null; createdAt: string; userId: string | null; guestId: string | null };

@Injectable()
export class ClassroomService implements OnModuleInit {
    constructor(private readonly dataSource: DataSource) { }

    async onModuleInit(): Promise<void> {
        // Production synchronize надорад: нақши нав ва ҷадвалҳо бо SQL; такрор зарар намерасонад.
        await this.dataSource.query(`ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'teacher'`).catch(() => undefined);
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS classrooms (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                code varchar(8) NOT NULL UNIQUE,
                name varchar(60) NOT NULL,
                school varchar(120) NULL,
                city varchar(60) NULL,
                grade smallint NULL,
                "teacherId" uuid NOT NULL,
                archived boolean NOT NULL DEFAULT false,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )`);
        await this.dataSource.query('CREATE INDEX IF NOT EXISTS classrooms_teacher ON classrooms ("teacherId")');
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS classroom_guests (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "secretHash" varchar(64) NOT NULL,
                "displayName" varchar(60) NOT NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )`);
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS classroom_members (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "classroomId" uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
                "userId" uuid NULL,
                "guestId" uuid NULL,
                "displayName" varchar(60) NOT NULL,
                "joinedAt" timestamptz NOT NULL DEFAULT now(),
                UNIQUE ("classroomId", "userId"),
                UNIQUE ("classroomId", "guestId")
            )`);
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS teacher_requests (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "userId" uuid NOT NULL UNIQUE,
                school varchar(120) NOT NULL,
                subject varchar(80) NULL,
                city varchar(60) NULL,
                phone varchar(30) NULL,
                note varchar(300) NULL,
                status varchar(10) NOT NULL DEFAULT 'pending',
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                "decidedAt" timestamptz NULL
            )`);
    }

    // ---------- Хонандаи бе почта ----------

    // Сарлавҳаи «X-Class-Guest: <id>.<калид>» → id-и хонанда (ё null). Калид дар база ҳамчун hash.
    async resolveGuest(header: unknown): Promise<string | null> {
        const [id, secret] = String(header || '').split('.');
        if (!UUID.test(id || '') || !secret || secret.length < 20) return null;
        const [row] = await this.dataSource.query('SELECT "secretHash" FROM classroom_guests WHERE id = $1', [id]);
        if (!row) return null;
        const a = Buffer.from(row.secretHash, 'hex');
        const b = Buffer.from(hash(secret), 'hex');
        return a.length === b.length && timingSafeEqual(a, b) ? id : null;
    }

    // ---------- Омӯзгор ----------

    private async role(userId: string): Promise<string | null> {
        const [row] = await this.dataSource.query('SELECT role FROM "user" WHERE id = $1', [userId]);
        return row?.role || null;
    }

    // Нақш аз база (на аз токен): баъди тасдиқи админ омӯзгор бе аз нав ворид шудан кор мекунад.
    private async assertTeacher(actor: Actor) {
        const role = await this.role(actor.userId);
        if (role !== 'teacher' && role !== 'admin') throw new ForbiddenException('Танҳо барои омӯзгорон');
        return role;
    }

    private async ownClassroom(actor: Actor, id: string) {
        if (!UUID.test(id)) throw new NotFoundException('Синф ёфт нашуд');
        const role = await this.assertTeacher(actor);
        const [room] = await this.dataSource.query('SELECT * FROM classrooms WHERE id = $1', [id]);
        if (!room || (room.teacherId !== actor.userId && role !== 'admin')) throw new NotFoundException('Синф ёфт нашуд');
        return room;
    }

    private async newCode(): Promise<string> {
        for (let attempt = 0; attempt < 20; attempt += 1) {
            const code = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
            const [taken] = await this.dataSource.query('SELECT 1 FROM classrooms WHERE code = $1', [code]);
            if (!taken) return code;
        }
        throw new BadRequestException('Рамз сохта нашуд. Боз кӯшиш кунед.');
    }

    private static grade(value: unknown): number | null {
        const number = Number(value);
        return Number.isInteger(number) && number >= 1 && number <= 12 ? number : null;
    }

    async create(actor: Actor, input: ClassroomInput) {
        await this.assertTeacher(actor);
        const name = clean(input?.name, 60);
        if (name.length < 1) throw new BadRequestException('Номи синфро нависед');
        const [{ count }] = await this.dataSource.query('SELECT count(*)::int AS count FROM classrooms WHERE "teacherId" = $1', [actor.userId]);
        if (count >= MAX_CLASSES) throw new BadRequestException(`Ҳадди аксар ${MAX_CLASSES} синф`);
        const code = await this.newCode();
        const [room] = await this.dataSource.query(
            `INSERT INTO classrooms (code, name, school, city, grade, "teacherId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [code, name, clean(input?.school, 120) || null, clean(input?.city, 60) || null, ClassroomService.grade(input?.grade), actor.userId],
        );
        return room;
    }

    async update(actor: Actor, id: string, input: ClassroomInput) {
        const room = await this.ownClassroom(actor, id);
        const name = input?.name !== undefined ? clean(input.name, 60) : room.name;
        if (!name) throw new BadRequestException('Номи синфро нависед');
        const [updated] = await this.dataSource.query(
            `UPDATE classrooms SET name = $2, school = $3, city = $4, grade = $5, archived = $6 WHERE id = $1 RETURNING *`,
            [
                id,
                name,
                input?.school !== undefined ? clean(input.school, 120) || null : room.school,
                input?.city !== undefined ? clean(input.city, 60) || null : room.city,
                input?.grade !== undefined ? ClassroomService.grade(input.grade) : room.grade,
                typeof input?.archived === 'boolean' ? input.archived : room.archived,
            ],
        );
        return updated;
    }

    async remove(actor: Actor, id: string) {
        await this.ownClassroom(actor, id);
        await this.dataSource.query('DELETE FROM classrooms WHERE id = $1', [id]);
        return { ok: true };
    }

    async removeMember(actor: Actor, id: string, memberId: string) {
        await this.ownClassroom(actor, id);
        if (!UUID.test(memberId)) throw new NotFoundException();
        await this.dataSource.query('DELETE FROM classroom_members WHERE id = $1 AND "classroomId" = $2', [memberId, id]);
        return { ok: true };
    }

    async mine(actor: Actor) {
        await this.assertTeacher(actor);
        const rooms = await this.dataSource.query(
            'SELECT * FROM classrooms WHERE "teacherId" = $1 ORDER BY archived, "createdAt" DESC', [actor.userId]);
        const result = [];
        for (const room of rooms) {
            const { summary } = await this.build(room);
            result.push({ ...room, summary });
        }
        return result;
    }

    async detail(actor: Actor, id: string) {
        const room = await this.ownClassroom(actor, id);
        return { ...room, ...(await this.build(room)) };
    }

    // Натиҷаи охирини тест ва ҳамаи санҷишҳои ҳар хонанда (натиҷаи пеш аз ҳамроҳ шудан ҳам).
    private async build(room: any) {
        const members: Array<{ id: string; userId: string | null; guestId: string | null; displayName: string; joinedAt: string; email: string | null; plan: number }> =
            await this.dataSource.query(`
                SELECT m.id, m."userId", m."guestId", m."displayName", m."joinedAt", u.email,
                       COALESCE(jsonb_array_length(u."applicationChoices"), 0)::int AS plan
                FROM classroom_members m LEFT JOIN "user" u ON u.id = m."userId"
                WHERE m."classroomId" = $1 ORDER BY m."displayName"`, [room.id]);
        const userIds = members.map((m) => m.userId).filter(Boolean);
        const guestIds = members.map((m) => m.guestId).filter(Boolean);

        const quiz: Array<{ userId: string | null; guestId: string | null; scores: Record<string, number>; topCluster: string | null; topCareers: Array<{ id: string; name: string }> | null; createdAt: string }> =
            userIds.length || guestIds.length
                ? await this.dataSource.query(`
                    SELECT DISTINCT ON (COALESCE("userId", "guestId")) "userId", "guestId", scores, "topCluster", "topCareers", "createdAt"
                    FROM quiz_attempts
                    WHERE "userId" = ANY($1::uuid[]) OR "guestId" = ANY($2::uuid[])
                    ORDER BY COALESCE("userId", "guestId"), "createdAt" DESC`, [userIds, guestIds])
                : [];
        // Натиҷаҳои то пайдоиши quiz_attempts — дар профили корбар.
        const profiles: Array<{ id: string; scores: Record<string, number> | null }> = userIds.length
            ? await this.dataSource.query(`SELECT id, "quizResults"->'mmtClusters' AS scores FROM "user" WHERE id = ANY($1::uuid[])`, [userIds])
            : [];
        const trials: TrialRow[] = userIds.length || guestIds.length
            ? await this.dataSource.query(`
                SELECT t."careerId", c.name AS "careerName", t.solved, t.tasks, t.rating, t."confBefore", t."confAfter", t."createdAt", t."userId", t."guestId"
                FROM trial_attempts t LEFT JOIN career c ON c.id = t."careerId"
                WHERE t."userId" = ANY($1::uuid[]) OR t."guestId" = ANY($2::uuid[])
                ORDER BY t."createdAt"`, [userIds, guestIds])
            : [];

        const topOf = (scores: Record<string, number> | null | undefined) => {
            const ranked = Object.entries(scores || {}).map(([key, value]) => [key, Number(value) || 0] as [string, number]).sort((a, b) => b[1] - a[1]);
            return ranked.length && ranked[0][1] > 0 ? ranked[0][0] : null;
        };
        const notForMe = (row: TrialRow) => {
            const tasks = row.tasks || [];
            return (row.rating !== null && row.rating <= 2) || tasks.filter((task) => task.liked).length < tasks.length / 3;
        };

        const rows = members.map((member) => {
            const mine = (row: { userId: string | null; guestId: string | null }) =>
                (member.userId && row.userId === member.userId) || (member.guestId && row.guestId === member.guestId);
            const lastQuiz = quiz.find(mine);
            const profile = member.userId ? profiles.find((p) => p.id === member.userId)?.scores : null;
            const scores = lastQuiz?.scores || (topOf(profile) ? profile : null);
            const memberTrials = trials.filter(mine).map((row) => ({
                careerId: row.careerId,
                careerName: row.careerName,
                solved: Number(row.solved),
                total: (row.tasks || []).length,
                liked: (row.tasks || []).filter((task) => task.liked).length,
                rating: row.rating,
                confBefore: row.confBefore,
                confAfter: row.confAfter,
                fit: !notForMe(row),
                createdAt: row.createdAt,
            }));
            const dates = [member.joinedAt, lastQuiz?.createdAt, ...memberTrials.map((t) => t.createdAt)].filter(Boolean).map((d) => new Date(d as string).getTime());
            return {
                id: member.id,
                displayName: member.displayName,
                kind: member.userId ? 'user' : 'guest',
                email: member.email,
                joinedAt: member.joinedAt,
                lastActive: new Date(Math.max(...dates)).toISOString(),
                quiz: scores ? { scores, topCluster: lastQuiz?.topCluster || topOf(scores), topCareers: lastQuiz?.topCareers || [], at: lastQuiz?.createdAt || null } : null,
                trials: memberTrials,
                plan: member.plan || 0,
            };
        });

        const clusters: Record<string, number> = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
        rows.forEach((row) => { if (row.quiz?.topCluster && row.quiz.topCluster in clusters) clusters[row.quiz.topCluster] += 1; });
        const allTrials = rows.flatMap((row) => row.trials);
        const paired = allTrials.filter((t) => t.confBefore && t.confAfter);
        return {
            members: rows,
            summary: {
                members: rows.length,
                withQuiz: rows.filter((row) => row.quiz).length,
                withTrial: rows.filter((row) => row.trials.length).length,
                trials: allTrials.length,
                clusters,
                confBefore: average(paired.map((t) => Number(t.confBefore))),
                confAfter: average(paired.map((t) => Number(t.confAfter))),
                notForMe: allTrials.filter((t) => !t.fit).length,
            },
        };
    }

    async csv(actor: Actor, id: string): Promise<string> {
        const data = await this.detail(actor, id);
        const cell = (value: unknown) => {
            const text = String(value ?? '');
            // Формула дар Excel иҷро нашавад (=, +, -, @ дар аввал).
            const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
            return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
        };
        const head = ['Ном', 'Тест', 'Самт', 'c1 %', 'c2 %', 'c3 %', 'c4 %', 'c5 %', 'Ихтисосҳои беҳтарин', 'Касбҳои санҷидашуда', 'Мувофиқ', 'Боварӣ пеш', 'Боварӣ баъд', 'Охирин фаъолият'];
        const lines = data.members.map((member) => {
            const pct = (key: string) => (member.quiz ? Math.round(((Number(member.quiz.scores?.[key]) || 0) / 40) * 100) : '');
            const lastTrial = member.trials[member.trials.length - 1];
            return [
                member.displayName,
                member.quiz ? 'ҳа' : 'не',
                member.quiz?.topCluster || '',
                pct('c1'), pct('c2'), pct('c3'), pct('c4'), pct('c5'),
                (member.quiz?.topCareers || []).map((c) => c.name).join('; '),
                member.trials.map((t) => t.careerName).filter(Boolean).join('; '),
                member.trials.filter((t) => t.fit).map((t) => t.careerName).filter(Boolean).join('; '),
                lastTrial?.confBefore ?? '',
                lastTrial?.confAfter ?? '',
                member.lastActive?.slice(0, 10),
            ].map(cell).join(';');
        });
        // BOM — то Excel ҳарфҳои тоҷикиро дуруст нишон диҳад.
        return '﻿' + [head.map(cell).join(';'), ...lines].join('\r\n');
    }

    // ---------- Хонанда ----------

    async publicInfo(code: string) {
        const room = await this.byCode(code);
        const [teacher] = await this.dataSource.query('SELECT name FROM "user" WHERE id = $1', [room.teacherId]);
        const [{ count }] = await this.dataSource.query('SELECT count(*)::int AS count FROM classroom_members WHERE "classroomId" = $1', [room.id]);
        return { code: room.code, name: room.name, school: room.school, city: room.city, grade: room.grade, teacher: teacher?.name || null, members: count, full: count >= MAX_MEMBERS };
    }

    private async byCode(code: string) {
        const normalized = clean(code, 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const [room] = normalized.length === CODE_LENGTH
            ? await this.dataSource.query('SELECT * FROM classrooms WHERE code = $1 AND archived = false', [normalized])
            : [];
        if (!room) throw new NotFoundException('Синф бо ин рамз ёфт нашуд');
        return room;
    }

    // Бо ҳисоб — ба корбар; бе ҳисоб — хонандаи бе почта (калид як бор ба браузер дода мешавад).
    async join(code: string, input: { displayName?: string }, user: Actor | null, guestHeader: unknown) {
        const room = await this.byCode(code);
        let displayName = clean(input?.displayName, 60);
        const [{ count }] = await this.dataSource.query('SELECT count(*)::int AS count FROM classroom_members WHERE "classroomId" = $1', [room.id]);

        if (user?.userId) {
            const [existing] = await this.dataSource.query('SELECT id FROM classroom_members WHERE "classroomId" = $1 AND "userId" = $2', [room.id, user.userId]);
            if (!existing && count >= MAX_MEMBERS) throw new BadRequestException('Синф пур аст');
            if (!displayName) {
                const [row] = await this.dataSource.query('SELECT name, email FROM "user" WHERE id = $1', [user.userId]);
                displayName = clean(row?.name || row?.email?.split('@')[0], 60) || 'Хонанда';
            }
            await this.dataSource.query(
                `INSERT INTO classroom_members ("classroomId", "userId", "displayName") VALUES ($1, $2, $3)
                 ON CONFLICT ("classroomId", "userId") DO UPDATE SET "displayName" = EXCLUDED."displayName"`,
                [room.id, user.userId, displayName],
            );
            return { classroom: await this.publicInfo(room.code), guest: null };
        }

        if (displayName.length < 2) throw new BadRequestException('Ном ва насабро нависед');
        let guestId = await this.resolveGuest(guestHeader);
        let token: string | null = null;
        if (!guestId) {
            const secret = randomBytes(24).toString('base64url');
            const [guest] = await this.dataSource.query(
                'INSERT INTO classroom_guests ("secretHash", "displayName") VALUES ($1, $2) RETURNING id', [hash(secret), displayName]);
            guestId = guest.id;
            token = `${guest.id}.${secret}`;
        } else {
            await this.dataSource.query('UPDATE classroom_guests SET "displayName" = $2 WHERE id = $1', [guestId, displayName]);
        }
        const [existing] = await this.dataSource.query('SELECT id FROM classroom_members WHERE "classroomId" = $1 AND "guestId" = $2', [room.id, guestId]);
        if (!existing && count >= MAX_MEMBERS) throw new BadRequestException('Синф пур аст');
        await this.dataSource.query(
            `INSERT INTO classroom_members ("classroomId", "guestId", "displayName") VALUES ($1, $2, $3)
             ON CONFLICT ("classroomId", "guestId") DO UPDATE SET "displayName" = EXCLUDED."displayName"`,
            [room.id, guestId, displayName],
        );
        return { classroom: await this.publicInfo(room.code), guest: token ? { token, displayName } : { displayName } };
    }

    async joined(user: Actor | null, guestHeader: unknown) {
        const guestId = await this.resolveGuest(guestHeader);
        if (!user?.userId && !guestId) return [];
        return this.dataSource.query(`
            SELECT c.id, c.code, c.name, c.school, c.city, m.id AS "memberId", m."displayName", u.name AS teacher
            FROM classroom_members m
            JOIN classrooms c ON c.id = m."classroomId"
            LEFT JOIN "user" u ON u.id = c."teacherId"
            WHERE c.archived = false AND (m."userId" = $1 OR m."guestId" = $2)
            ORDER BY m."joinedAt" DESC`, [user?.userId || null, guestId]);
    }

    async leave(user: Actor | null, guestHeader: unknown, memberId: string) {
        const guestId = await this.resolveGuest(guestHeader);
        if (!UUID.test(memberId) || (!user?.userId && !guestId)) throw new NotFoundException();
        await this.dataSource.query('DELETE FROM classroom_members WHERE id = $1 AND ("userId" = $2 OR "guestId" = $3)', [memberId, user?.userId || null, guestId]);
        return { ok: true };
    }

    // ---------- Дархости «Ман омӯзгор ҳастам» ----------

    async requestTeacher(actor: Actor, input: TeacherRequestInput) {
        const role = await this.role(actor.userId);
        if (role === 'teacher' || role === 'admin') return { status: 'approved' };
        const school = clean(input?.school, 120);
        if (school.length < 2) throw new BadRequestException('Номи мактабро нависед');
        const [row] = await this.dataSource.query(
            `INSERT INTO teacher_requests ("userId", school, subject, city, phone, note) VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT ("userId") DO UPDATE SET school = EXCLUDED.school, subject = EXCLUDED.subject, city = EXCLUDED.city,
                 phone = EXCLUDED.phone, note = EXCLUDED.note, status = 'pending', "createdAt" = now(), "decidedAt" = NULL
             RETURNING status, "createdAt"`,
            [actor.userId, school, clean(input?.subject, 80) || null, clean(input?.city, 60) || null, clean(input?.phone, 30) || null, clean(input?.note, 300) || null],
        );
        return row;
    }

    async myRequest(actor: Actor) {
        const role = await this.role(actor.userId);
        if (role === 'teacher' || role === 'admin') return { status: 'approved', role };
        const [row] = await this.dataSource.query('SELECT status, school, "createdAt" FROM teacher_requests WHERE "userId" = $1', [actor.userId]);
        return row ? { ...row, role } : { status: null, role };
    }

    // ---------- Админ ----------

    async adminRequests() {
        return this.dataSource.query(`
            SELECT r.id, r."userId", r.school, r.subject, r.city, r.phone, r.note, r.status, r."createdAt", u.name, u.email, u.role
            FROM teacher_requests r JOIN "user" u ON u.id = r."userId"
            ORDER BY (r.status = 'pending') DESC, r."createdAt" DESC LIMIT 200`);
    }

    async decide(requestId: string, approve: boolean) {
        if (!UUID.test(requestId)) throw new NotFoundException();
        const [request] = await this.dataSource.query('SELECT "userId" FROM teacher_requests WHERE id = $1', [requestId]);
        if (!request) throw new NotFoundException('Дархост ёфт нашуд');
        await this.dataSource.query(`UPDATE teacher_requests SET status = $2, "decidedAt" = now() WHERE id = $1`, [requestId, approve ? 'approved' : 'rejected']);
        // Админро ба омӯзгор иваз намекунем; рад кардан нақши омӯзгорро бармегардонад.
        if (approve) await this.dataSource.query(`UPDATE "user" SET role = 'teacher' WHERE id = $1 AND role = 'user'`, [request.userId]);
        else await this.dataSource.query(`UPDATE "user" SET role = 'user' WHERE id = $1 AND role = 'teacher'`, [request.userId]);
        return { ok: true };
    }

    async adminClassrooms() {
        return this.dataSource.query(`
            SELECT c.id, c.code, c.name, c.school, c.city, c.grade, c.archived, c."createdAt", u.name AS teacher, u.email AS "teacherEmail",
                   (SELECT count(*)::int FROM classroom_members m WHERE m."classroomId" = c.id) AS members
            FROM classrooms c LEFT JOIN "user" u ON u.id = c."teacherId"
            ORDER BY c."createdAt" DESC LIMIT 300`);
    }

    async totals() {
        const [row] = await this.dataSource.query(`
            SELECT (SELECT count(*)::int FROM classrooms WHERE archived = false) AS classrooms,
                   (SELECT count(*)::int FROM classroom_members) AS members,
                   (SELECT count(*)::int FROM "user" WHERE role = 'teacher') AS teachers`);
        return row;
    }
}
