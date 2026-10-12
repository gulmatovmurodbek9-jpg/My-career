import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash, randomBytes, randomInt } from 'crypto';

// «Дӯстон маро чӣ гуна мебинанд» (360°): хонанда худро аз рӯи 8 сифат баҳо медиҳад ва
// пайвандро ба дӯстон мефиристад; онҳо бе бақайдгирӣ баҳо медиҳанд. Натиҷа — танҳо миёна
// ва танҳо аз 2 ҷавоб боло (ҷавоби ҳар дӯст алоҳида нишон дода намешавад). 90 рӯз.
export const PEER_TRAITS = ['leader', 'accurate', 'creative', 'helpful', 'logical', 'patient', 'brave', 'social'] as const;
const RELATIONS = ['friend', 'classmate', 'teacher', 'family'];
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const KEEP_DAYS = 90;
const MIN_ANSWERS = 2;
const MAX_ANSWERS = 40;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const hits = new Map<string, number[]>();
function limit(key: string, max: number, windowMs = 3600_000) {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((at) => now - at < windowMs);
    if (recent.length >= max) throw new HttpException('Кӯшиш зиёд шуд. Баъдтар боз кӯшиш кунед.', HttpStatus.TOO_MANY_REQUESTS);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
}

@Injectable()
export class PeerService implements OnModuleInit {
    constructor(private readonly dataSource: DataSource) { }

    async onModuleInit() {
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS peer_invites (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                code varchar(10) NOT NULL UNIQUE,
                "secretHash" varchar(64) NOT NULL,
                name varchar(40) NOT NULL,
                lang varchar(2) NOT NULL DEFAULT 'tj',
                "selfScores" jsonb NOT NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )`);
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS peer_answers (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "inviteId" uuid NOT NULL REFERENCES peer_invites(id) ON DELETE CASCADE,
                scores jsonb NOT NULL,
                relation varchar(10) NULL,
                "ipHash" varchar(64) NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )`);
        await this.dataSource.query(`DELETE FROM peer_invites WHERE "createdAt" < now() - interval '${KEEP_DAYS} days'`).catch(() => undefined);
    }

    private static scores(input: any): Record<string, number> {
        const out: Record<string, number> = {};
        for (const key of PEER_TRAITS) {
            const value = Math.round(Number(input?.[key]));
            if (!Number.isFinite(value) || value < 1 || value > 5) throw new BadRequestException('Ҳамаи сифатҳоро баҳо диҳед');
            out[key] = value;
        }
        return out;
    }

    async create(body: { name?: string; self?: any; lang?: string }, ip?: string) {
        limit(`create:${ip}`, 15);
        const name = String(body?.name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        if (name.length < 2) throw new BadRequestException('Номи худро нависед');
        const selfScores = PeerService.scores(body?.self);
        const lang = ['tj', 'ru', 'en'].includes(String(body?.lang)) ? String(body?.lang) : 'tj';
        const secret = randomBytes(18).toString('base64url');
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
            try {
                await this.dataSource.query(
                    'INSERT INTO peer_invites (code, "secretHash", name, lang, "selfScores") VALUES ($1, $2, $3, $4, $5)',
                    [code, hash(secret), name, lang, JSON.stringify(selfScores)]);
                return { code, secret };
            } catch { /* рамз такрор шуд */ }
        }
        throw new BadRequestException('Пайванд сохта нашуд');
    }

    private async byCode(code: string) {
        const clean = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const [row] = clean.length === 8 ? await this.dataSource.query('SELECT * FROM peer_invites WHERE code = $1', [clean]) : [];
        if (!row) throw new NotFoundException('Пайванд ёфт нашуд ё мӯҳлаташ гузаштааст');
        return row;
    }

    // Барои дӯст: танҳо ном (баҳои худи хонанда нишон дода намешавад — то таъсир накунад).
    async forFriend(code: string) {
        const row = await this.byCode(code);
        return { code: row.code, name: row.name, lang: row.lang };
    }

    async answer(code: string, body: { scores?: any; relation?: string }, ip?: string) {
        const row = await this.byCode(code);
        limit(`answer:${ip}`, 30);
        // Аз як шабака (масалан, Wi-Fi-и мактаб) якчанд нафар ҷавоб медиҳанд — то 4 ҷавоб.
        const ipHash = ip ? hash(`${row.id}:${ip}`) : null;
        const [{ count, fromIp }] = await this.dataSource.query(
            'SELECT count(*)::int AS count, count(*) FILTER (WHERE "ipHash" = $2)::int AS "fromIp" FROM peer_answers WHERE "inviteId" = $1', [row.id, ipHash]);
        if (count >= MAX_ANSWERS) throw new BadRequestException('Ҷавобҳо пур шуданд');
        if (ipHash && fromIp >= 4) throw new HttpException('Аз ин дастгоҳ ҷавоб аллакай дода шудааст', HttpStatus.TOO_MANY_REQUESTS);
        const scores = PeerService.scores(body?.scores);
        const relation = RELATIONS.includes(String(body?.relation)) ? String(body?.relation) : null;
        await this.dataSource.query('INSERT INTO peer_answers ("inviteId", scores, relation, "ipHash") VALUES ($1, $2, $3, $4)',
            [row.id, JSON.stringify(scores), relation, ipHash]);
        return { ok: true, name: row.name };
    }

    // Барои хонанда (бо калид): баҳои худ ва миёнаи дигарон (аз 2 ҷавоб боло).
    async result(code: string, secret: string) {
        const row = await this.byCode(code);
        if (!secret || hash(secret) !== row.secretHash) throw new NotFoundException('Пайванд ёфт нашуд');
        const answers: Array<{ scores: Record<string, number>; relation: string | null }> = await this.dataSource.query(
            'SELECT scores, relation FROM peer_answers WHERE "inviteId" = $1', [row.id]);
        const relations: Record<string, number> = {};
        answers.forEach((a) => { if (a.relation) relations[a.relation] = (relations[a.relation] || 0) + 1; });
        const others = answers.length >= MIN_ANSWERS
            ? Object.fromEntries(PEER_TRAITS.map((key) => [key, Math.round((answers.reduce((s, a) => s + Number(a.scores[key] || 0), 0) / answers.length) * 10) / 10]))
            : null;
        return { code: row.code, name: row.name, self: row.selfScores, count: answers.length, min: MIN_ANSWERS, others, relations, createdAt: row.createdAt };
    }
}
