import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash, randomBytes, randomInt } from 'crypto';

// «Волидайн ҳам бигӯянд»: хонанда пайванд месозад (бо холҳои тести худ), волид бе ворид шудан
// ба 10 савол дар бораи фарзандаш ҷавоб медиҳад; ҳарду муқоисаро мебинанд. Ном ва почта нест —
// танҳо номи ихтиёрии фарзанд (барои «Ҷамшед аз шумо мепурсад»). 90 рӯз нигоҳ дошта мешавад.
const CLUSTERS = ['c1', 'c2', 'c3', 'c4', 'c5'];
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const KEEP_DAYS = 90;
const hash = (secret: string) => createHash('sha256').update(secret).digest('hex');

const hits = new Map<string, number[]>();
function limit(ip: string | undefined, max = 20) {
    const key = ip || 'unknown';
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((at) => now - at < 3600_000);
    if (recent.length >= max) throw new HttpException('Кӯшиш зиёд шуд. Баъдтар боз кӯшиш кунед.', HttpStatus.TOO_MANY_REQUESTS);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
}

@Injectable()
export class ParentService implements OnModuleInit {
    constructor(private readonly dataSource: DataSource) { }

    async onModuleInit() {
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS parent_invites (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                code varchar(10) NOT NULL UNIQUE,
                "secretHash" varchar(64) NOT NULL,
                "childName" varchar(40) NULL,
                "childScores" jsonb NOT NULL,
                lang varchar(2) NOT NULL DEFAULT 'tj',
                relation varchar(10) NULL,
                answers jsonb NULL,
                "parentScores" jsonb NULL,
                wish varchar(4) NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now(),
                "answeredAt" timestamptz NULL
            )`);
        await this.dataSource.query(`DELETE FROM parent_invites WHERE "createdAt" < now() - interval '${KEEP_DAYS} days'`).catch(() => undefined);
    }

    private static scores(input: any): Record<string, number> {
        const out: Record<string, number> = {};
        for (const key of CLUSTERS) {
            const value = Number(input?.[key]);
            out[key] = Number.isFinite(value) ? Math.max(0, Math.min(40, Math.round(value * 10) / 10)) : 0;
        }
        return out;
    }

    async create(body: { childName?: string; scores?: any; lang?: string }, ip?: string) {
        limit(ip);
        const childScores = ParentService.scores(body?.scores);
        if (!Object.values(childScores).some((v) => v > 0)) throw new BadRequestException('Аввал тестро гузаред');
        const childName = String(body?.childName || '').replace(/\s+/g, ' ').trim().slice(0, 40) || null;
        const lang = ['tj', 'ru', 'en'].includes(String(body?.lang)) ? String(body?.lang) : 'tj';
        const secret = randomBytes(18).toString('base64url');
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
            try {
                await this.dataSource.query(
                    `INSERT INTO parent_invites (code, "secretHash", "childName", "childScores", lang) VALUES ($1, $2, $3, $4, $5)`,
                    [code, hash(secret), childName, JSON.stringify(childScores), lang]);
                return { code, secret };
            } catch { /* рамз такрор шуд — боз */ }
        }
        throw new BadRequestException('Пайванд сохта нашуд');
    }

    private async byCode(code: string) {
        const clean = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const [row] = clean.length === 8 ? await this.dataSource.query('SELECT * FROM parent_invites WHERE code = $1', [clean]) : [];
        if (!row) throw new NotFoundException('Пайванд ёфт нашуд ё мӯҳлаташ гузаштааст');
        return row;
    }

    private static view(row: any) {
        return {
            code: row.code,
            childName: row.childName,
            lang: row.lang,
            answered: !!row.answeredAt,
            relation: row.relation,
            childScores: row.childScores,
            parentScores: row.parentScores,
            wish: row.wish,
            answeredAt: row.answeredAt,
        };
    }

    // Барои волид: пеш аз ҷавоб натиҷаи фарзанд намоён нест (то фикри худашро гӯяд).
    async forParent(code: string) {
        const row = await this.byCode(code);
        const view = ParentService.view(row);
        return row.answeredAt ? view : { ...view, childScores: null };
    }

    async answer(code: string, body: { answers?: string[]; wish?: string; relation?: string }, ip?: string) {
        limit(ip, 40);
        const row = await this.byCode(code);
        const answers = (Array.isArray(body?.answers) ? body.answers : []).map(String);
        if (answers.length < 6 || answers.length > 12 || !answers.every((a) => CLUSTERS.includes(a))) throw new BadRequestException('Ба ҳамаи саволҳо ҷавоб диҳед');
        const counts: Record<string, number> = Object.fromEntries(CLUSTERS.map((k) => [k, 0]));
        answers.forEach((a) => { counts[a] += 1; });
        // Ба ҳамон миқёси тест (0–40), то муқоиса баробар бошад.
        const parentScores = Object.fromEntries(CLUSTERS.map((k) => [k, Math.round((counts[k] / answers.length) * 400) / 10]));
        const wish = CLUSTERS.includes(String(body?.wish)) ? String(body.wish) : null;
        const relation = ['father', 'mother', 'other'].includes(String(body?.relation)) ? String(body.relation) : null;
        await this.dataSource.query(
            `UPDATE parent_invites SET answers = $2, "parentScores" = $3, wish = $4, relation = $5, "answeredAt" = now() WHERE id = $1`,
            [row.id, JSON.stringify(answers), JSON.stringify(parentScores), wish, relation]);
        return ParentService.view({ ...row, answers, parentScores, wish, relation, answeredAt: new Date().toISOString() });
    }

    // Барои хонанда (бо калиде, ки ҳангоми сохтан гирифт).
    async forChild(code: string, secret: string) {
        const row = await this.byCode(code);
        if (!secret || hash(secret) !== row.secretHash) throw new NotFoundException('Пайванд ёфт нашуд');
        return ParentService.view(row);
    }
}
