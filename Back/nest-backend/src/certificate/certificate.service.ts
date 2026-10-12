import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomInt } from 'crypto';

// Сертификати касбинтихобкунӣ: натиҷаи тест (самт, 3 ихтисос, санҷишҳо) бо рамзи 8-рақама;
// QR дар сертификат → /cert/:code — саҳифаи тасдиқ, ки он дар сайт дода шудааст.
// Ин тавсия аст, на ҳуҷҷати расмӣ; ном дар саҳифаи тасдиқ кӯтоҳ нишон дода мешавад.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CLUSTERS = ['c1', 'c2', 'c3', 'c4', 'c5'];
const clean = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

const hits = new Map<string, number[]>();
function limit(ip: string | undefined) {
    const key = ip || 'unknown';
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((at) => now - at < 3600_000);
    if (recent.length >= 20) throw new HttpException('Кӯшиш зиёд шуд. Баъдтар боз кӯшиш кунед.', HttpStatus.TOO_MANY_REQUESTS);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
}

@Injectable()
export class CertificateService implements OnModuleInit {
    constructor(private readonly dataSource: DataSource) { }

    async onModuleInit() {
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS certificates (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                code varchar(10) NOT NULL UNIQUE,
                name varchar(60) NOT NULL,
                data jsonb NOT NULL,
                "userId" uuid NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )`);
    }

    async create(body: any, ip?: string, userId?: string | null) {
        limit(ip);
        const name = clean(body?.name, 60);
        if (name.length < 2) throw new BadRequestException('Ному насабро нависед');
        const scores: Record<string, number> = {};
        for (const key of CLUSTERS) {
            const value = Number(body?.scores?.[key]);
            scores[key] = Number.isFinite(value) ? Math.max(0, Math.min(40, Math.round(value * 10) / 10)) : 0;
        }
        const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
        if (!top || top[1] <= 0) throw new BadRequestException('Аввал тестро гузаред');
        const careers = (Array.isArray(body?.careers) ? body.careers : []).slice(0, 3)
            .map((c: any) => ({ name: clean(c?.name, 120), percent: Number.isFinite(Number(c?.percent)) ? Math.round(Number(c.percent)) : null }))
            .filter((c: any) => c.name);
        const trials = (Array.isArray(body?.trials) ? body.trials : []).slice(0, 4)
            .map((t: any) => ({ name: clean(t?.name, 120), fit: Boolean(t?.fit) }))
            .filter((t: any) => t.name);
        const data = {
            topCluster: top[0],
            percent: Math.round((top[1] / 40) * 100),
            scores,
            careers,
            trials,
            lang: ['tj', 'ru', 'en'].includes(String(body?.lang)) ? String(body.lang) : 'tj',
        };
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
            try {
                const [row] = await this.dataSource.query(
                    'INSERT INTO certificates (code, name, data, "userId") VALUES ($1, $2, $3, $4) RETURNING code, "createdAt"',
                    [code, name, JSON.stringify(data), userId || null]);
                return { code: row.code, createdAt: row.createdAt, name, ...data };
            } catch { /* рамз такрор шуд */ }
        }
        throw new BadRequestException('Сертификат сохта нашуд');
    }

    // Саҳифаи тасдиқ: «Ҷамшед Раҳимов» → «Ҷамшед Р.».
    async verify(code: string) {
        const normalized = clean(code, 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const [row] = normalized.length === 8 ? await this.dataSource.query('SELECT code, name, data, "createdAt" FROM certificates WHERE code = $1', [normalized]) : [];
        if (!row) throw new NotFoundException('Сертификат ёфт нашуд');
        const parts = String(row.name).split(' ').filter(Boolean);
        const shortName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
        return { code: row.code, name: shortName, createdAt: row.createdAt, ...row.data };
    }
}
