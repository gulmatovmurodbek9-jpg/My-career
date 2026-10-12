import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
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
const MAX_MESSAGE = 1000;
// Паём: аз як нафар то 30 дар 10 дақиқа (спам нашавад).
const MESSAGE_WINDOW_MS = 10 * 60_000;
const MESSAGE_LIMIT = 30;
const messageHits = new Map<string, number[]>();
const phoneDigits = (value: string) => value.replace(/\D/g, '').length;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const hash = (secret: string) => createHash('sha256').update(secret).digest('hex');
// Соли таҳсил: 1 сентябр — май. Аз 1 август соли нав ҳисоб мешавад.
export function currentSchoolYear(now = new Date()): string {
    const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    return `${start}-${start + 1}`;
}
const SCHOOL_YEAR = /^(\d{4})-(\d{4})$/;
function schoolYearOf(value: unknown): string {
    const match = SCHOOL_YEAR.exec(String(value ?? '').trim());
    if (!match || Number(match[2]) !== Number(match[1]) + 1) return currentSchoolYear();
    const start = Number(match[1]);
    const current = Number(currentSchoolYear().slice(0, 4));
    // Танҳо соли ҷорӣ ё соли оянда.
    return start >= current && start <= current + 1 ? `${start}-${start + 1}` : currentSchoolYear();
}
const average = (list: number[]) => (list.length ? Math.round((list.reduce((sum, value) => sum + value, 0) / list.length) * 10) / 10 : null);

export interface Actor {
    userId: string;
    role?: string;
}

export interface ClassroomInput {
    name?: string;
    district?: string;
    schoolYear?: string;
    school?: string;
    city?: string;
    grade?: number | string | null;
    archived?: boolean;
}

export interface TeacherRequestInput {
    fullName?: string;
    homeroom?: string;
    contactName?: string;
    contactPhone?: string;
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
        // Ноҳия ва соли таҳсил (12.10): баъди соли таҳсил синф худкор ба бойгонӣ меравад.
        await this.dataSource.query('ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS district varchar(60) NULL');
        await this.dataSource.query('ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS "schoolYear" varchar(9) NULL');
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
        // Дархости пурра (12.10): ному насаб, роҳбари синф, директор/котиба барои тасдиқ.
        for (const column of ['"fullName" varchar(100)', 'homeroom varchar(40)', '"contactName" varchar(100)', '"contactPhone" varchar(30)']) {
            await this.dataSource.query(`ALTER TABLE teacher_requests ADD COLUMN IF NOT EXISTS ${column} NULL`);
        }
        // Фидбеки омӯзгор ↔ хонанда (чат дар доираи синф).
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS classroom_messages (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "classroomId" uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
                "memberId" uuid NOT NULL REFERENCES classroom_members(id) ON DELETE CASCADE,
                author varchar(10) NOT NULL,
                body varchar(${MAX_MESSAGE}) NOT NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                "readAt" timestamptz NULL
            )`);
        await this.dataSource.query('CREATE INDEX IF NOT EXISTS classroom_messages_member ON classroom_messages ("memberId", "createdAt")');
        await this.dataSource.query('ALTER TABLE classroom_messages ADD COLUMN IF NOT EXISTS "authorId" uuid NULL');
        // Омӯзгорони ёрирасон (масалан, омӯзгори технология дар синфи роҳбари синф).
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS classroom_teachers (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "classroomId" uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
                "teacherId" uuid NOT NULL,
                subject varchar(60) NULL,
                focus varchar(4) NULL,
                "addedAt" timestamptz NOT NULL DEFAULT now(),
                UNIQUE ("classroomId", "teacherId")
            )`);
        await this.archiveFinished();
        // Сервер моҳҳо бе бозоғоз кор мекунад — ҳар 6 соат месанҷем.
        setInterval(() => void this.archiveFinished().catch(() => undefined), 6 * 3600_000).unref();
    }

    // Синфҳое, ки соли таҳсилашон гузашт, ба бойгонӣ (рамз дигар кор намекунад; натиҷаҳо мемонанд).
    async archiveFinished() {
        const current = Number(currentSchoolYear().slice(0, 4));
        await this.dataSource.query(
            `UPDATE classrooms SET archived = true
             WHERE archived = false AND "schoolYear" ~ '^[0-9]{4}-[0-9]{4}$' AND split_part("schoolYear", '-', 1)::int < $1`, [current]);
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

    // Танҳо соҳиби синф (ё админ): иваз, бойгонӣ, нест кардан, хориҷи хонанда, идораи омӯзгорон.
    private async ownClassroom(actor: Actor, id: string) {
        const { room, owner } = await this.classroomAccess(actor, id);
        if (!owner) throw new ForbiddenException('Танҳо роҳбари синф ин корро карда метавонад');
        return room;
    }

    // Соҳиб ё омӯзгори ёрирасон: дидан, омор ва паёмҳо.
    private async classroomAccess(actor: Actor, id: string) {
        if (!UUID.test(id)) throw new NotFoundException('Синф ёфт нашуд');
        const role = await this.assertTeacher(actor);
        const [room] = await this.dataSource.query('SELECT * FROM classrooms WHERE id = $1', [id]);
        if (!room) throw new NotFoundException('Синф ёфт нашуд');
        if (room.teacherId === actor.userId || role === 'admin') return { room, owner: true, co: null as any };
        const [co] = await this.dataSource.query('SELECT * FROM classroom_teachers WHERE "classroomId" = $1 AND "teacherId" = $2', [id, actor.userId]);
        if (!co) throw new NotFoundException('Синф ёфт нашуд');
        return { room, owner: false, co };
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
            `INSERT INTO classrooms (code, name, school, city, grade, "teacherId", district, "schoolYear") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [code, name, clean(input?.school, 120) || null, clean(input?.city, 60) || null, ClassroomService.grade(input?.grade), actor.userId,
                clean(input?.district, 60) || null, schoolYearOf(input?.schoolYear)],
        );
        return room;
    }

    async update(actor: Actor, id: string, input: ClassroomInput) {
        const room = await this.ownClassroom(actor, id);
        const name = input?.name !== undefined ? clean(input.name, 60) : room.name;
        if (!name) throw new BadRequestException('Номи синфро нависед');
        const [updated] = await this.dataSource.query(
            `UPDATE classrooms SET name = $2, school = $3, city = $4, grade = $5, archived = $6, district = $7, "schoolYear" = $8 WHERE id = $1 RETURNING *`,
            [
                id,
                name,
                input?.school !== undefined ? clean(input.school, 120) || null : room.school,
                input?.city !== undefined ? clean(input.city, 60) || null : room.city,
                input?.grade !== undefined ? ClassroomService.grade(input.grade) : room.grade,
                typeof input?.archived === 'boolean' ? input.archived : room.archived,
                input?.district !== undefined ? clean(input.district, 60) || null : room.district,
                input?.schoolYear !== undefined ? schoolYearOf(input.schoolYear) : room.schoolYear,
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
        await this.archiveFinished();
        const rooms = await this.dataSource.query(`
            SELECT c.*, t.subject AS "coSubject", t.focus AS "coFocus", (t.id IS NOT NULL) AS "isCo", o.name AS "ownerName"
            FROM classrooms c
            LEFT JOIN classroom_teachers t ON t."classroomId" = c.id AND t."teacherId" = $1
            LEFT JOIN "user" o ON o.id = c."teacherId"
            WHERE c."teacherId" = $1 OR t.id IS NOT NULL
            ORDER BY c.archived, (t.id IS NOT NULL), c."createdAt" DESC`, [actor.userId]);
        const result = [];
        for (const room of rooms) {
            const { summary } = await this.build(room);
            result.push({ ...room, summary });
        }
        return result;
    }

    async detail(actor: Actor, id: string) {
        const { room, owner, co } = await this.classroomAccess(actor, id);
        const teachers = await this.dataSource.query(`
            SELECT t."teacherId" AS id, u.name, u.email, t.subject, t.focus, t."addedAt"
            FROM classroom_teachers t JOIN "user" u ON u.id = t."teacherId"
            WHERE t."classroomId" = $1 ORDER BY t."addedAt"`, [id]);
        const [ownerRow] = await this.dataSource.query('SELECT name FROM "user" WHERE id = $1', [room.teacherId]);
        return {
            ...room,
            ...(await this.build(room)),
            access: owner ? 'owner' : 'co',
            myFocus: co?.focus || null,
            mySubject: co?.subject || null,
            ownerName: ownerRow?.name || null,
            teachers: owner ? teachers : teachers.map(({ email, ...rest }: any) => rest),
        };
    }

    // ---------- Омӯзгорони ёрирасон ----------

    async addTeacher(actor: Actor, id: string, input: { email?: string; subject?: string; focus?: string }) {
        const room = await this.ownClassroom(actor, id);
        const email = clean(input?.email, 120).toLowerCase();
        if (!email.includes('@')) throw new BadRequestException('Почтаи омӯзгорро нависед');
        const [user] = await this.dataSource.query('SELECT id, name, role FROM "user" WHERE lower(email) = $1', [email]);
        if (!user) throw new BadRequestException('Корбар бо ин почта ёфт нашуд. Бигӯед, ки аввал дар сайт ба қайд гирад.');
        if (user.role !== 'teacher' && user.role !== 'admin') throw new BadRequestException('Ин корбар ҳанӯз омӯзгор нест — бигӯед, ки дар «Ҳуҷраи омӯзгор» дархост фиристад.');
        if (user.id === room.teacherId) throw new BadRequestException('Шумо аллакай роҳбари ин синф ҳастед');
        const [{ count }] = await this.dataSource.query('SELECT count(*)::int AS count FROM classroom_teachers WHERE "classroomId" = $1', [id]);
        if (count >= 15) throw new BadRequestException('Ҳадди аксар 15 омӯзгор');
        const focus = ['c1', 'c2', 'c3', 'c4', 'c5'].includes(String(input?.focus)) ? String(input?.focus) : null;
        await this.dataSource.query(
            `INSERT INTO classroom_teachers ("classroomId", "teacherId", subject, focus) VALUES ($1, $2, $3, $4)
             ON CONFLICT ("classroomId", "teacherId") DO UPDATE SET subject = EXCLUDED.subject, focus = EXCLUDED.focus`,
            [id, user.id, clean(input?.subject, 60) || null, focus]);
        return { ok: true, name: user.name };
    }

    // Соҳиб ҳар омӯзгорро мебарорад; ёрирасон — танҳо худашро.
    async removeTeacher(actor: Actor, id: string, teacherId: string) {
        const { owner } = await this.classroomAccess(actor, id);
        if (!UUID.test(teacherId)) throw new NotFoundException();
        if (!owner && teacherId !== actor.userId) throw new ForbiddenException('Танҳо роҳбари синф');
        await this.dataSource.query('DELETE FROM classroom_teachers WHERE "classroomId" = $1 AND "teacherId" = $2', [id, teacherId]);
        return { ok: true };
    }

    // Як паём ба якчанд хонанда (масалан, ба ҳамаи хонандагони самти техникӣ).
    async broadcast(actor: Actor, id: string, input: { memberIds?: string[]; body?: string }) {
        await this.classroomAccess(actor, id);
        const ids = [...new Set((Array.isArray(input?.memberIds) ? input.memberIds : []).map(String).filter((m) => UUID.test(m)))].slice(0, MAX_MEMBERS);
        if (!ids.length) throw new BadRequestException('Хонандагонро интихоб кунед');
        const members: Array<{ id: string }> = await this.dataSource.query(
            'SELECT id FROM classroom_members WHERE "classroomId" = $1 AND id = ANY($2::uuid[])', [id, ids]);
        if (!members.length) throw new BadRequestException('Хонандагон ёфт нашуданд');
        const text = ClassroomService.cleanBody(input?.body);
        ClassroomService.assertRate(`broadcast:${actor.userId}`);
        for (const member of members) {
            await this.dataSource.query(
                `INSERT INTO classroom_messages ("classroomId", "memberId", author, body, "authorId") VALUES ($1, $2, 'teacher', $3, $4)`,
                [id, member.id, text, actor.userId]);
        }
        return { sent: members.length };
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

        // Омори пурра: шумораи тестҳо, захираҳо, рӯйхати ҳуҷҷатсупорӣ ва паёмҳо.
        const quizStats: Array<{ key: string; count: number; first: string }> = userIds.length || guestIds.length
            ? await this.dataSource.query(`
                SELECT COALESCE("userId", "guestId")::text AS key, count(*)::int AS count, min("createdAt") AS first
                FROM quiz_attempts WHERE "userId" = ANY($1::uuid[]) OR "guestId" = ANY($2::uuid[])
                GROUP BY 1`, [userIds, guestIds])
            : [];
        const saved: Array<{ userId: string; id: string; name: string }> = userIds.length
            ? await this.dataSource.query(`
                SELECT s."userId", c.id, c.name FROM user_saved_careers s JOIN career c ON c.id = s."careerId"
                WHERE s."userId" = ANY($1::uuid[]) ORDER BY c.name`, [userIds])
            : [];
        const planRows: Array<{ userId: string; career: string; careerId: string; university: string; paymentType: string; studyForm: string }> = userIds.length
            ? await this.dataSource.query(`
                SELECT u.id AS "userId", c.name AS career, c.id AS "careerId", un.name AS university, o."paymentType", o."studyForm"
                FROM "user" u
                CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(u."applicationChoices"::jsonb, '[]'::jsonb)) AS choice(id)
                JOIN career_offerings o ON o.id::text = choice.id
                JOIN career c ON c.id = o."careerId"
                LEFT JOIN universities un ON un.id = o."universityId"
                WHERE u.id = ANY($1::uuid[])`, [userIds]).catch(() => [])
            : [];
        const messageStats: Array<{ memberId: string; total: number; unread: number; last: string }> = members.length
            ? await this.dataSource.query(`
                SELECT "memberId", count(*)::int AS total,
                       count(*) FILTER (WHERE author = 'student' AND "readAt" IS NULL)::int AS unread, max("createdAt") AS last
                FROM classroom_messages WHERE "classroomId" = $1 GROUP BY "memberId"`, [room.id])
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
            const stats = quizStats.find((q) => q.key === (member.userId || member.guestId));
            const messages = messageStats.find((m) => m.memberId === member.id);
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
                quizCount: stats?.count || 0,
                firstQuiz: stats?.first || null,
                saved: member.userId ? saved.filter((row) => row.userId === member.userId).map(({ id, name }) => ({ id, name })) : [],
                planItems: member.userId
                    ? planRows.filter((row) => row.userId === member.userId).map(({ career, careerId, university, paymentType, studyForm }) => ({ career, careerId, university, paymentType, studyForm }))
                    : [],
                messages: { total: messages?.total || 0, unread: messages?.unread || 0, last: messages?.last || null },
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
                unread: rows.reduce((sum, row) => sum + row.messages.unread, 0),
            },
        };
    }

    async csv(actor: Actor, id: string): Promise<string> {
        await this.classroomAccess(actor, id);
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
        return { code: room.code, name: room.name, school: room.school, city: room.city, district: room.district, schoolYear: room.schoolYear, grade: room.grade, teacher: teacher?.name || null, members: count, full: count >= MAX_MEMBERS };
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
            SELECT c.id, c.code, c.name, c.school, c.city, m.id AS "memberId", m."displayName", u.name AS teacher,
                   (SELECT count(*)::int FROM classroom_messages x WHERE x."memberId" = m.id AND x.author = 'teacher' AND x."readAt" IS NULL) AS unread
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

    // Аъзогии худи хонанда (ҳисоб ё бе почта) — барои омор ва паёмҳо.
    private async ownMembership(user: Actor | null, guestHeader: unknown, memberId: string) {
        const guestId = await this.resolveGuest(guestHeader);
        if (!UUID.test(memberId) || (!user?.userId && !guestId)) throw new NotFoundException('Синф ёфт нашуд');
        const [member] = await this.dataSource.query(
            'SELECT * FROM classroom_members WHERE id = $1 AND ("userId" = $2 OR "guestId" = $3)', [memberId, user?.userId || null, guestId]);
        if (!member) throw new NotFoundException('Синф ёфт нашуд');
        const [room] = await this.dataSource.query('SELECT * FROM classrooms WHERE id = $1', [member.classroomId]);
        if (!room) throw new NotFoundException('Синф ёфт нашуд');
        return { member, room };
    }

    // «Синфи ман»: омори умумии синф БЕ НОМҲО (хонандагон ноболиғанд — натиҷаи ҳар кас
    // танҳо ба омӯзгор намоён аст) ва ҷойи худи хонанда дар он.
    async overview(user: Actor | null, guestHeader: unknown, memberId: string) {
        const { member, room } = await this.ownMembership(user, guestHeader, memberId);
        const { members, summary } = await this.build(room);
        const me = members.find((row) => row.id === member.id);
        const [teacher] = await this.dataSource.query('SELECT name FROM "user" WHERE id = $1', [room.teacherId]);

        const careers = new Map<string, { id: string; name: string; count: number; mine: boolean }>();
        for (const row of members) {
            for (const career of (row.quiz?.topCareers || []).slice(0, 5)) {
                const entry = careers.get(career.id) || { id: career.id, name: career.name, count: 0, mine: false };
                entry.count += 1;
                if (row.id === member.id) entry.mine = true;
                careers.set(career.id, entry);
            }
        }
        const tried = new Map<string, { id: string; name: string; students: Set<string>; fit: number; mine: boolean }>();
        for (const row of members) {
            for (const trial of row.trials) {
                if (!trial.careerId) continue;
                const entry = tried.get(trial.careerId) || { id: trial.careerId, name: trial.careerName || '—', students: new Set<string>(), fit: 0, mine: false };
                entry.students.add(row.id);
                if (trial.fit) entry.fit += 1;
                if (row.id === member.id) entry.mine = true;
                tried.set(trial.careerId, entry);
            }
        }
        const [{ unread }] = await this.dataSource.query(
            `SELECT count(*)::int AS unread FROM classroom_messages WHERE "memberId" = $1 AND author = 'teacher' AND "readAt" IS NULL`, [member.id]);
        return {
            classroom: { name: room.name, school: room.school, city: room.city, district: room.district, schoolYear: room.schoolYear, grade: room.grade, teacher: teacher?.name || null },
            summary: { members: summary.members, withQuiz: summary.withQuiz, withTrial: summary.withTrial, clusters: summary.clusters, confBefore: summary.confBefore, confAfter: summary.confAfter },
            careers: [...careers.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 10),
            tried: [...tried.values()].map(({ students, ...rest }) => ({ ...rest, students: students.size }))
                .sort((a, b) => b.students - a.students || a.name.localeCompare(b.name)).slice(0, 10),
            me: { topCluster: me?.quiz?.topCluster || null, quiz: !!me?.quiz, trials: me?.trials.length || 0 },
            unread,
        };
    }

    // ---------- Паёмҳо (фидбеки омӯзгор) ----------

    private static assertRate(key: string) {
        const now = Date.now();
        const list = (messageHits.get(key) || []).filter((time) => time > now - MESSAGE_WINDOW_MS);
        if (list.length >= MESSAGE_LIMIT) throw new HttpException('Паём зиёд шуд. Каме интизор шавед.', HttpStatus.TOO_MANY_REQUESTS);
        list.push(now);
        messageHits.set(key, list);
        if (messageHits.size > 5000) messageHits.clear();
    }

    private async thread(memberId: string, reader: 'teacher' | 'student') {
        // Паёмҳои тарафи дигар ҳангоми кушодан хонда мешаванд.
        await this.dataSource.query(
            `UPDATE classroom_messages SET "readAt" = now() WHERE "memberId" = $1 AND author <> $2 AND "readAt" IS NULL`, [memberId, reader]);
        return this.dataSource.query(
            `SELECT m.id, m.author, m.body, m."createdAt", m."readAt", m."authorId", u.name AS "authorName"
             FROM classroom_messages m LEFT JOIN "user" u ON u.id = m."authorId"
             WHERE m."memberId" = $1 ORDER BY m."createdAt" LIMIT 300`, [memberId]);
    }

    private static cleanBody(body: unknown) {
        const text = String(body ?? '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_MESSAGE);
        if (!text) throw new BadRequestException('Паём холӣ аст');
        return text;
    }

    private async post(roomId: string, memberId: string, author: 'teacher' | 'student', body: unknown, authorId: string | null = null) {
        const text = ClassroomService.cleanBody(body);
        ClassroomService.assertRate(`${author}:${authorId || ''}:${memberId}`);
        const [row] = await this.dataSource.query(
            `INSERT INTO classroom_messages ("classroomId", "memberId", author, body, "authorId") VALUES ($1, $2, $3, $4, $5)
             RETURNING id, author, body, "createdAt", "readAt", "authorId"`,
            [roomId, memberId, author, text, authorId]);
        if (authorId) {
            const [user] = await this.dataSource.query('SELECT name FROM "user" WHERE id = $1', [authorId]);
            row.authorName = user?.name || null;
        }
        return row;
    }

    private async ownMember(actor: Actor, id: string, memberId: string) {
        const { room } = await this.classroomAccess(actor, id);
        if (!UUID.test(memberId)) throw new NotFoundException();
        const [member] = await this.dataSource.query('SELECT id FROM classroom_members WHERE id = $1 AND "classroomId" = $2', [memberId, id]);
        if (!member) throw new NotFoundException('Хонанда ёфт нашуд');
        return room;
    }

    async teacherThread(actor: Actor, id: string, memberId: string) {
        await this.ownMember(actor, id, memberId);
        return this.thread(memberId, 'teacher');
    }

    async teacherPost(actor: Actor, id: string, memberId: string, body: unknown) {
        await this.ownMember(actor, id, memberId);
        return this.post(id, memberId, 'teacher', body, actor.userId);
    }

    async studentThread(user: Actor | null, guestHeader: unknown, memberId: string) {
        await this.ownMembership(user, guestHeader, memberId);
        return this.thread(memberId, 'student');
    }

    async studentPost(user: Actor | null, guestHeader: unknown, memberId: string, body: unknown) {
        const { room } = await this.ownMembership(user, guestHeader, memberId);
        return this.post(room.id, memberId, 'student', body);
    }

    // ---------- Дархости «Ман омӯзгор ҳастам» ----------

    async requestTeacher(actor: Actor, input: TeacherRequestInput) {
        const role = await this.role(actor.userId);
        if (role === 'teacher' || role === 'admin') return { status: 'approved' };
        const school = clean(input?.school, 120);
        const fullName = clean(input?.fullName, 100);
        const phone = clean(input?.phone, 30);
        const contactName = clean(input?.contactName, 100);
        const contactPhone = clean(input?.contactPhone, 30);
        if (fullName.length < 3) throw new BadRequestException('Ному насабро пурра нависед');
        if (school.length < 2) throw new BadRequestException('Номи мактабро нависед');
        if (phoneDigits(phone) < 7) throw new BadRequestException('Рақами телефонро нависед');
        if (contactName.length < 3) throw new BadRequestException('Ному насаби директор ё котибаро нависед');
        if (phoneDigits(contactPhone) < 7) throw new BadRequestException('Телефони директор ё котибаро нависед');
        const [row] = await this.dataSource.query(
            `INSERT INTO teacher_requests ("userId", school, subject, city, phone, note, "fullName", homeroom, "contactName", "contactPhone")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT ("userId") DO UPDATE SET school = EXCLUDED.school, subject = EXCLUDED.subject, city = EXCLUDED.city,
                 phone = EXCLUDED.phone, note = EXCLUDED.note, "fullName" = EXCLUDED."fullName", homeroom = EXCLUDED.homeroom,
                 "contactName" = EXCLUDED."contactName", "contactPhone" = EXCLUDED."contactPhone",
                 status = 'pending', "createdAt" = now(), "decidedAt" = NULL
             RETURNING status, "createdAt"`,
            [actor.userId, school, clean(input?.subject, 80) || null, clean(input?.city, 60) || null, phone, clean(input?.note, 300) || null,
                fullName, clean(input?.homeroom, 40) || null, contactName, contactPhone],
        );
        return row;
    }

    async myRequest(actor: Actor) {
        const role = await this.role(actor.userId);
        if (role === 'teacher' || role === 'admin') return { status: 'approved', role };
        const [row] = await this.dataSource.query('SELECT status, school, "createdAt" FROM teacher_requests WHERE "userId" = $1', [actor.userId]);
        // «none» — дархост нест (null-ро браузер бо «бор шуда истодааст» иштибоҳ мекард).
        return row ? { ...row, role } : { status: 'none', role };
    }

    // ---------- Админ ----------

    async adminRequests() {
        return this.dataSource.query(`
            SELECT r.id, r."userId", r.school, r.subject, r.city, r.phone, r.note, r.status, r."createdAt",
                   r."fullName", r.homeroom, r."contactName", r."contactPhone", u.name, u.email, u.role
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
            SELECT c.id, c.code, c.name, c.school, c.city, c.district, c."schoolYear", c.grade, c.archived, c."createdAt", u.name AS teacher, u.email AS "teacherEmail",
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
