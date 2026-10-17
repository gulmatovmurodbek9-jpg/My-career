import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash, randomBytes, randomInt } from 'crypto';
import { AiService } from '../ai/ai.service';
import { assertAiAllowed } from '../common/ai-limit';
import { SALARY_SOURCE, sectorFor } from '../common/salary-sectors';

// «Волидайн ҳам бигӯянд»: хонанда пайванд месозад (бо холҳои тести худ), волид бе ворид шудан
// ба 10 савол дар бораи фарзандаш ҷавоб медиҳад; ҳарду муқоисаро мебинанд. Ном ва почта нест —
// танҳо номи ихтиёрии фарзанд (барои «Ҷамшед аз шумо мепурсад»). 90 рӯз нигоҳ дошта мешавад.
// 17.10: як пайванди доимӣ барои тамоми оила — ихтисосҳо фавран намоёнанд (10 савол ихтиёрӣ),
// хешовандон зери ҳар ихтисос аз AI мепурсанд ё ба фарзанд менависанд (parent_notes);
// баъди тести нав фарзанд ҳамон пайвандро нав мекунад (refresh).
const CLUSTERS = ['c1', 'c2', 'c3', 'c4', 'c5'];
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const KEEP_DAYS = 90;
const hash = (secret: string) => createHash('sha256').update(secret).digest('hex');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Саволи волид ба AI: як пайванд — то 30 савол дар як рӯз.
const ASK_PER_DAY = 30;
const asks = new Map<string, number[]>();
// Ёддоштҳо ба фарзанд: як пайванд — то 60 дар як рӯз.
const NOTES_PER_DAY = 60;
const noteHits = new Map<string, number[]>();
const AUTHORS = ['father', 'mother', 'brother', 'sister', 'other'];
const AUTHOR_NAMES: Record<string, string> = { father: 'падари', mother: 'модари', brother: 'бародари', sister: 'хоҳари', other: 'хешованди' };
const CLUSTER_NAMES: Record<string, string> = { c1: 'Техникӣ', c2: 'Иқтисод', c3: 'Филология', c4: 'Ҷомеашиносӣ', c5: 'Тиб' };

// Маош барои AI: миёнаи соҳа (Агентии омор) ва тахминҳои сайт — ҳамон рақамҳои саҳифаи ихтисос.
function salaryFacts(career: any): string {
    const sector = sectorFor(career?.name, career?.cluster);
    const lines = [];
    if (sector) lines.push(`Маоши миёнаи соҳаи «${sector.name}»: ${sector.amount} сомонӣ дар як моҳ (${SALARY_SOURCE.agency}, ${SALARY_SOURCE.period}; миёнаи кишвар ${SALARY_SOURCE.nationalAverage})`);
    const s = career?.salaryAndMarket;
    if (s && (s.junior || s.mid || s.senior)) {
        lines.push(`Тахминӣ (аз эълонҳои кор, на омори расмӣ): навкор ${s.junior || '—'}, ботаҷриба ${s.mid || '—'}, мутахассиси пешбар ${s.senior || '—'}`);
    }
    return lines.join('\n');
}

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
    constructor(private readonly dataSource: DataSource, private readonly ai: AiService) { }

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
        // Ихтисосҳои фарзанд (12.10): рӯйхати тест ва ҳисоби фарзанд (захираҳо, рӯйхати ҳуҷҷатсупорӣ).
        await this.dataSource.query('ALTER TABLE parent_invites ADD COLUMN IF NOT EXISTS "childCareers" jsonb NULL');
        await this.dataSource.query('ALTER TABLE parent_invites ADD COLUMN IF NOT EXISTS "userId" uuid NULL');
        await this.dataSource.query('ALTER TABLE parent_invites ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NULL');
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS parent_notes (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "inviteId" uuid NOT NULL REFERENCES parent_invites(id) ON DELETE CASCADE,
                "careerId" uuid NOT NULL,
                author varchar(10) NOT NULL,
                kind varchar(4) NOT NULL,
                text varchar(500) NOT NULL,
                answer text NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )`);
        await this.dataSource.query('CREATE INDEX IF NOT EXISTS parent_notes_invite ON parent_notes ("inviteId", "createdAt")');
        await this.dataSource.query(`DELETE FROM parent_invites WHERE COALESCE("updatedAt", "createdAt") < now() - interval '${KEEP_DAYS} days'`).catch(() => undefined);
    }

    private static scores(input: any): Record<string, number> {
        const out: Record<string, number> = {};
        for (const key of CLUSTERS) {
            const value = Number(input?.[key]);
            out[key] = Number.isFinite(value) ? Math.max(0, Math.min(40, Math.round(value * 10) / 10)) : 0;
        }
        return out;
    }

    private static careers(input: any): Array<{ id: string; name: string; percent: number | null }> {
        return (Array.isArray(input) ? input : [])
            .filter((c: any) => c && UUID.test(String(c.id)) && String(c.name || '').trim())
            .slice(0, 12)
            .map((c: any) => {
                const percent = Number(c.percent);
                return { id: String(c.id), name: String(c.name).trim().slice(0, 160), percent: Number.isFinite(percent) ? Math.max(0, Math.min(100, Math.round(percent))) : null };
            });
    }

    async create(body: { childName?: string; scores?: any; lang?: string; careers?: any }, ip?: string, userId?: string | null) {
        limit(ip);
        const childScores = ParentService.scores(body?.scores);
        // Бе тест танҳо бо ҳисоб: волид ихтисосҳои захирашуда ва рӯйхати ҳуҷҷатсупориро мебинад.
        if (!Object.values(childScores).some((v) => v > 0) && !userId) throw new BadRequestException('Аввал тестро гузаред');
        const childName = String(body?.childName || '').replace(/\s+/g, ' ').trim().slice(0, 40) || null;
        const lang = ['tj', 'ru', 'en'].includes(String(body?.lang)) ? String(body?.lang) : 'tj';
        const secret = randomBytes(18).toString('base64url');
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const code = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
            try {
                await this.dataSource.query(
                    `INSERT INTO parent_invites (code, "secretHash", "childName", "childScores", lang, "childCareers", "userId") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [code, hash(secret), childName, JSON.stringify(childScores), lang, JSON.stringify(ParentService.careers(body?.careers)), userId || null]);
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

    // Ихтисосҳои фарзанд: аз тест (дар лаҳзаи пайванд) ва аз ҳисоби фарзанд (зинда).
    private async childData(row: any) {
        const fromTest = Array.isArray(row.childCareers) ? row.childCareers : [];
        if (!row.userId) return { fromTest, saved: [], plan: [], tried: [] };
        const saved = await this.dataSource.query(
            `SELECT c.id, c.name FROM user_saved_careers s JOIN career c ON c.id = s."careerId" WHERE s."userId" = $1 ORDER BY c.name LIMIT 30`, [row.userId]);
        const plan = await this.dataSource.query(`
            SELECT c.id, c.name, un.name AS university, o."paymentType"
            FROM "user" u
            CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(u."applicationChoices"::jsonb, '[]'::jsonb)) AS choice(id)
            JOIN career_offerings o ON o.id::text = choice.id
            JOIN career c ON c.id = o."careerId"
            LEFT JOIN universities un ON un.id = o."universityId"
            WHERE u.id = $1`, [row.userId]).catch(() => []);
        const tried = await this.dataSource.query(`
            SELECT DISTINCT ON (t."careerId") t."careerId" AS id, c.name, t.solved, jsonb_array_length(t.tasks) AS total,
                   (SELECT count(*) FROM jsonb_array_elements(t.tasks) x WHERE (x->>'liked')::boolean) AS liked
            FROM trial_attempts t JOIN career c ON c.id = t."careerId"
            WHERE t."userId" = $1 ORDER BY t."careerId", t."createdAt" DESC`, [row.userId]);
        return {
            fromTest,
            saved,
            plan,
            tried: tried.map((t: any) => ({ id: t.id, name: t.name, solved: Number(t.solved), total: Number(t.total), liked: Number(t.liked) })),
        };
    }

    private async notes(row: any) {
        return this.dataSource.query(
            `SELECT id, "careerId", author, kind, text, answer, "createdAt" FROM parent_notes WHERE "inviteId" = $1 ORDER BY "createdAt" LIMIT 300`, [row.id]);
    }

    private async fullView(row: any) {
        return { ...ParentService.view(row), careers: await this.childData(row), notes: await this.notes(row) };
    }

    private static isChild(row: any, secret: unknown) {
        return !!secret && hash(String(secret)) === row.secretHash;
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
            updatedAt: row.updatedAt || null,
        };
    }

    // Барои волид: ихтисосҳо ва ёддоштҳо фавран; холҳои тести фарзанд — танҳо баъди 10 савол
    // (то волид аввал фикри худашро гӯяд).
    async forParent(code: string) {
        const row = await this.byCode(code);
        const full = { ...ParentService.view(row), careers: await this.childData(row), notes: await this.notes(row) };
        return row.answeredAt ? full : { ...full, childScores: null };
    }

    // Фарзанд тестро аз нав гузашт: ҳамон пайванд, холҳо ва ихтисосҳои нав; 10 саволи волид аз нав.
    // Ёддоштҳои оила мемонанд.
    async refresh(code: string, body: { secret?: string; scores?: any; careers?: any; childName?: string }, ip?: string) {
        limit(ip);
        const row = await this.byCode(code);
        if (!ParentService.isChild(row, body?.secret)) throw new NotFoundException('Пайванд ёфт нашуд');
        const childScores = ParentService.scores(body?.scores);
        if (!Object.values(childScores).some((v) => v > 0) && !row.userId) throw new BadRequestException('Аввал тестро гузаред');
        const careers = Array.isArray(body?.careers) ? ParentService.careers(body.careers) : row.childCareers;
        const childName = String(body?.childName || '').replace(/\s+/g, ' ').trim().slice(0, 40) || row.childName;
        const [updated] = await this.dataSource.query(
            `UPDATE parent_invites SET "childScores" = $2, "childCareers" = $3, "childName" = $4, answers = NULL, "parentScores" = NULL,
                    wish = NULL, relation = NULL, "answeredAt" = NULL, "updatedAt" = now() WHERE id = $1 RETURNING *`,
            [row.id, JSON.stringify(childScores), JSON.stringify(careers || []), childName]);
        return this.fullView(updated[0] || updated);
    }

    // Хешованд ба фарзанд зери ихтисос менависад (ё фарзанд бо калид ба оила).
    async note(code: string, body: { careerId?: string; text?: string; author?: string; secret?: string }, ip?: string) {
        limit(ip, 60);
        const row = await this.byCode(code);
        const text = String(body?.text || '').replace(/\s+/g, ' ').trim().slice(0, 500);
        if (text.length < 2) throw new BadRequestException('Матнро нависед');
        const careerId = String(body?.careerId || '');
        const data = await this.childData(row);
        if (![...data.fromTest, ...data.saved, ...data.plan, ...data.tried].some((c: any) => c.id === careerId)) throw new NotFoundException('Ихтисос ёфт нашуд');
        const now = Date.now();
        const recent = (noteHits.get(row.code) || []).filter((at) => now - at < 86_400_000);
        if (recent.length >= NOTES_PER_DAY) throw new HttpException('Барои имрӯз кофист. Фардо боз нависед.', HttpStatus.TOO_MANY_REQUESTS);
        recent.push(now);
        noteHits.set(row.code, recent);
        const author = ParentService.isChild(row, body?.secret) ? 'child' : AUTHORS.includes(String(body?.author)) ? String(body?.author) : 'other';
        const [note] = await this.dataSource.query(
            `INSERT INTO parent_notes ("inviteId", "careerId", author, kind, text) VALUES ($1, $2, $3, 'note', $4)
             RETURNING id, "careerId", author, kind, text, answer, "createdAt"`, [row.id, careerId, author, text]);
        return note;
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
        return this.fullView({ ...row, answers, parentScores, wish, relation, answeredAt: new Date().toISOString() });
    }

    // Барои хонанда (бо калиде, ки ҳангоми сохтан гирифт).
    async forChild(code: string, secret: string) {
        const row = await this.byCode(code);
        if (!ParentService.isChild(row, secret)) throw new NotFoundException('Пайванд ёфт нашуд');
        return this.fullView(row);
    }

    // Волид (ё фарзанд бо калид) дар бораи ихтисоси фарзанд аз AI мепурсад.
    async ask(code: string, body: { careerId?: string; question?: string; lang?: string; secret?: string; author?: string; history?: Array<{ q?: string; a?: string }> }, ip?: string) {
        const row = await this.byCode(code);
        const isChild = ParentService.isChild(row, body?.secret);
        const author = isChild ? 'child' : AUTHORS.includes(String(body?.author)) ? String(body?.author) : 'other';
        const question = String(body?.question || '').replace(/\s+/g, ' ').trim().slice(0, 500);
        if (question.length < 3) throw new BadRequestException('Саволро нависед');
        const careerId = String(body?.careerId || '');
        const data = await this.childData(row);
        const known = [...data.fromTest, ...data.saved, ...data.plan, ...data.tried].find((c: any) => c.id === careerId);
        if (!known) throw new NotFoundException('Ихтисос ёфт нашуд');

        const now = Date.now();
        const recent = (asks.get(row.code) || []).filter((at) => now - at < 86_400_000);
        if (recent.length >= ASK_PER_DAY) throw new HttpException('Барои имрӯз саволҳо тамом шуданд. Фардо боз пурсед.', HttpStatus.TOO_MANY_REQUESTS);
        assertAiAllowed(ip);
        recent.push(now);
        asks.set(row.code, recent);

        const lang = ['tj', 'ru', 'en'].includes(String(body?.lang)) ? String(body?.lang) : row.lang || 'tj';
        const [career] = await this.dataSource.query(
            `SELECT c.name, c.description, c.purpose, c.skills, c."careerOpportunities", c."durationYears", c."hasFreeSeats", c.advice, c."salaryAndMarket", cl."clusterName" AS cluster,
                    (SELECT string_agg(DISTINCT un.name, '; ') FROM career_offerings o JOIN universities un ON un.id = o."universityId" WHERE o."careerId" = c.id) AS universities,
                    (SELECT count(*) FROM career_offerings o WHERE o."careerId" = c.id AND o."paymentType" = 'ройгон') AS free
             FROM career c LEFT JOIN cluster cl ON cl.id = c."clusterId" WHERE c.id = $1`, [careerId]).catch(async () =>
            this.dataSource.query(`SELECT c.name, c.description, c.purpose, c.skills, c."careerOpportunities", cl."clusterName" AS cluster
                FROM career c LEFT JOIN cluster cl ON cl.id = c."clusterId" WHERE c.id = $1`, [careerId]));
        if (!career) throw new NotFoundException('Ихтисос ёфт нашуд');

        const scores = Object.entries(row.childScores || {})
            .map(([key, value]) => `${CLUSTER_NAMES[key] || key} ${Math.round((Number(value) / 40) * 100)}%`).join(', ');
        const parentTop = Object.entries(row.parentScores || {}).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];
        const where = [
            data.fromTest.some((c: any) => c.id === careerId) ? `дар натиҷаи тест (${data.fromTest.find((c: any) => c.id === careerId)?.percent ?? '?'}% мувофиқат)` : '',
            data.saved.some((c: any) => c.id === careerId) ? 'фарзанд онро захира кардааст' : '',
            data.plan.some((c: any) => c.id === careerId) ? 'дар рӯйхати ҳуҷҷатсупории фарзанд аст' : '',
            data.tried.some((c: any) => c.id === careerId) ? 'фарзанд «Худро дар касб санҷед»-ро гузаштааст' : '',
        ].filter(Boolean).join('; ');
        const facts = [
            `Ихтисос: ${career.name}${career.cluster ? ` (кластери ММТ: ${career.cluster})` : ''}`,
            career.description ? `Тавсиф: ${String(career.description).slice(0, 800)}` : '',
            career.purpose ? `Ҳадаф: ${String(career.purpose).slice(0, 400)}` : '',
            career.skills ? `Малакаҳо: ${JSON.stringify(career.skills).slice(0, 400)}` : '',
            career.careerOpportunities?.length ? `Ҷойҳои кор: ${[].concat(career.careerOpportunities).slice(0, 8).join(', ')}` : '',
            career.durationYears ? `Муддати таҳсил: ${career.durationYears} сол` : '',
            career.advice ? `Маслиҳат: ${String(career.advice).slice(0, 300)}` : '',
            career.universities ? `Дар куҷо таҳсил мекунанд: ${String(career.universities).slice(0, 500)}` : '',
            salaryFacts(career),
            career.free !== undefined || career.hasFreeSeats !== undefined ? `Ҷойҳои буҷетӣ (ройгон) ҳаст: ${Number(career.free) > 0 || career.hasFreeSeats ? 'ҳа' : 'не'}` : '',
            `Натиҷаи тести фарзанд аз рӯи самтҳо: ${scores}`,
            parentTop ? `Аз ҷавобҳои волид бештар самти «${CLUSTER_NAMES[parentTop]}» намоён аст` : '',
            row.wish ? `Волид мехоҳад фарзандаш дар самти «${CLUSTER_NAMES[row.wish]}» бошад` : '',
            where ? `Ин ихтисос: ${where}` : '',
        ].filter(Boolean).join('\n');
        const languageName = { tj: 'тоҷикии адабӣ (кириллица, бо ӣ ӯ қ ғ ҳ ҷ)', ru: 'русский', en: 'English' }[lang as 'tj' | 'ru' | 'en'];
        const who = isChild ? 'хонанда (худи фарзанд)' : `${AUTHOR_NAMES[author] || 'волиди'} хонанда`;
        // Саволҳои пештара дар ҳамин ихтисос: «Мисол» баъди «маош чанд аст?» маънои «мисоли маош»-ро дорад.
        const history = (Array.isArray(body?.history) ? body.history : [])
            .slice(-3)
            .map((item) => ({ q: String(item?.q || '').trim().slice(0, 200), a: String(item?.a || '').trim().slice(0, 400) }))
            .filter((item) => item.q && item.a)
            .map((item) => `Савол: ${item.q}\nҶавоб: ${item.a}`)
            .join('\n\n');
        const prompt = `Ту маслиҳатчии касбии «Ихтисоси ман» (Тоҷикистон) ҳастӣ. Ба ${who} дар бораи як ихтисос ҷавоб медиҳӣ.

ҚОИДАҲО:
- Ҳадди аксар 3–4 ҷумлаи содда (то 70 калима), як сархат, бе markdown ва бе рӯйхат.
- Салом нагӯ ва саволро такрор накун — рост аз ҷавоб сар кун.
- Агар савол кӯтоҳ ё норавшан бошад («Мисол», «Боз?», «Чаро?»), онро ҳамчун давоми саволи охирини сӯҳбат фаҳм. Агар сӯҳбат набошад, як саволи кӯтоҳи аниқкунанда деҳ.
- Танҳо ба ҳамин савол ҷавоб деҳ. Чизеро, ки дар ҷавобҳои пештара гуфта шуд, такрор накун.
- Танҳо фактҳои поёнро истифода бар. Рақами маош, номи ширкат ё ташкилот (масалан FAO, USAID), «ҳамеша талабот дорад», «ояндаи дурахшон» ва дигар ваъдаҳоро аз худ НАСОЗ. Агар маълумот нест — дар як ҷумла ростқавлона бигӯ.
- Дар бораи маош: аввал маоши миёнаи соҳаро аз Агентии омор бигӯ, баъд тахминҳоро ҳамчун «тахминӣ» бигӯ.
- Фоизи самт ин мувофиқати тест аст. Танҳо самти аввалро «пешбар» гӯй; фоизи пастро «баланд» нагӯй.
- Агар фикри волид ва натиҷаи тест фарқ кунанд, мулоимона як ҷумла гӯй ва маслиҳат деҳ, ки бо фарзанд гап зананд — танҳо агар савол ба ин рабт дошта бошад.
- Бо эҳтиром «шумо» гӯй.
- Забони ҷавоб: ${languageName}.

ФАКТҲО:
${facts}
${history ? `\nСӮҲБАТИ ПЕШТАРА:\n${history}\n` : ''}
САВОЛ: ${question}
ҶАВОБ:`;
        // Модели тез (flash-lite, ~1 с), мисли ёвари сайт; агар наояд — Gemini-и муқаррарӣ.
        const answer = (await this.ai.generateFast(prompt, 12000))
            .replace(/^\s*[*#>-]+\s*/gm, '')
            .replace(/^(салом|ассалому алейкум|здравствуйте|hello|hi)[.!,]?\s*/i, '')
            .trim();
        // Савол ва ҷавоб барои тамоми оила ва фарзанд намоён мемонад.
        const [note] = await this.dataSource.query(
            `INSERT INTO parent_notes ("inviteId", "careerId", author, kind, text, answer) VALUES ($1, $2, $3, 'ask', $4, $5)
             RETURNING id, "careerId", author, kind, text, answer, "createdAt"`, [row.id, careerId, author, question, answer]).catch(() => [null]);
        return { answer, note };
    }
}
