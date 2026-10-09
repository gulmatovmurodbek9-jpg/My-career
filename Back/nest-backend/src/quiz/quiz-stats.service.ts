import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Далел барои журӣ — танҳо нишондиҳандаҳое, ки барои ин навъи тест маъно доранд.
// Тест «интихоби маҷбурӣ» (ipsative) аст: дар ҳар савол як вариант ба самтҳои гуногун хол
// медиҳад, бинобар ин Cronbach's α ва коэффитсиентҳои муқаррарии эътимоднокӣ барои он
// натиҷаи каҷ медиҳанд (Hicks 1970; Meade 2004) ва истифода намешаванд. Ба ҷояш:
//  1) равшании натиҷа — самти аввал аз дуюм камаш 15% пеш аст;
//  2) устуворӣ — ҳамон корбар пас аз ≥ 7 рӯз тестро такрор кард: самташ ҳамон монд?
//  3) мувофиқат бо интихоби воқеӣ — кластере, ки хонанда дар ММТ интихоб кард / мекунад;
//  4) қаноатмандӣ (1–5) — фикри хонанда, НА далели дурустӣ;
//  5) воронка — чанд кас тестро сар кард ва дар кадом савол монд.
// Ном ва почта нигоҳ дошта намешаванд — танҳо userId (агар ворид шуда бошад). 12 моҳ.
const RETEST_MIN_DAYS = 7;
const KEEP_MONTHS = 12;

@Injectable()
export class QuizStatsService implements OnModuleInit, OnModuleDestroy {
    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor(private readonly dataSource: DataSource) { }

    async onModuleInit(): Promise<void> {
        // Ҷадвалҳо бе migration (production synchronize надорад); такрор зарар намерасонад.
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "userId" uuid NULL,
                answers jsonb NOT NULL,
                scores jsonb NOT NULL,
                "topCluster" varchar(4) NULL,
                grade smallint NULL,
                rating smallint NULL CHECK (rating BETWEEN 1 AND 5),
                comment text NULL,
                "createdAt" timestamptz NOT NULL DEFAULT now()
            )`);
        await this.dataSource.query('ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS "ntcChoice" smallint NULL');
        await this.dataSource.query('CREATE INDEX IF NOT EXISTS quiz_attempts_user ON quiz_attempts ("userId")');
        // Хонандаи бе почта дар синф ва 3 ихтисоси беҳтарин — барои саҳифаи омӯзгор.
        await this.dataSource.query('ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS "guestId" uuid NULL');
        await this.dataSource.query('ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS "topCareers" jsonb NULL');
        await this.dataSource.query('CREATE INDEX IF NOT EXISTS quiz_attempts_guest ON quiz_attempts ("guestId")');
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS quiz_sessions (
                id varchar(40) PRIMARY KEY,
                "maxStep" smallint NOT NULL DEFAULT 0,
                total smallint NULL,
                finished boolean NOT NULL DEFAULT false,
                "startedAt" timestamptz NOT NULL DEFAULT now()
            )`);
        await this.cleanup();
        this.cleanupTimer = setInterval(() => void this.cleanup(), 24 * 60 * 60 * 1000);
    }

    onModuleDestroy(): void {
        if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    }

    // Мӯҳлати нигоҳдорӣ (ниг. /privacy): кӯҳнатар аз 12 моҳ — нест.
    private async cleanup(): Promise<void> {
        try {
            await this.dataSource.query(`DELETE FROM quiz_attempts WHERE "createdAt" < now() - interval '${KEEP_MONTHS} months'`);
            await this.dataSource.query(`DELETE FROM quiz_sessions WHERE "startedAt" < now() - interval '${KEEP_MONTHS} months'`);
        } catch (error) {
            console.error('quiz cleanup:', (error as any)?.message || error);
        }
    }

    async record(answers: any[], scores: any, topCluster: string | null, grade: number | null, userId?: string, extra: { guestId?: string | null; topCareers?: Array<{ id: string; name: string }> } = {}): Promise<string | null> {
        try {
            const clean = (Array.isArray(answers) ? answers : [])
                .map((a) => ({ questionId: String(a?.questionId || '').slice(0, 40), selectedValue: a?.selectedValue }))
                .slice(0, 80);
            const [row] = await this.dataSource.query(
                `INSERT INTO quiz_attempts ("userId", answers, scores, "topCluster", grade, "guestId", "topCareers") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [userId || null, JSON.stringify(clean), JSON.stringify(scores?.mmtClusters || {}), topCluster, grade,
                    extra.guestId || null, extra.topCareers?.length ? JSON.stringify(extra.topCareers.slice(0, 3)) : null],
            );
            return row?.id || null;
        } catch (error) {
            console.error('quiz_attempts:', (error as any)?.message || error);
            return null;
        }
    }

    private static validId = (id: string) => /^[0-9a-f-]{36}$/i.test(String(id));

    async feedback(attemptId: string, rating: number, comment?: string): Promise<{ ok: boolean }> {
        const value = Math.round(Number(rating));
        if (!QuizStatsService.validId(attemptId) || value < 1 || value > 5) return { ok: false };
        const result = await this.dataSource.query(
            'UPDATE quiz_attempts SET rating = $2, comment = $3 WHERE id = $1 AND rating IS NULL',
            [attemptId, value, comment ? String(comment).slice(0, 500) : null],
        );
        return { ok: (result?.[1] ?? 0) > 0 };
    }

    // «Дар ММТ кадом кластерро интихоб кардед / мекунед?» — 1–5; 0 = ҳанӯз намедонам.
    async ntcChoice(attemptId: string, cluster: number): Promise<{ ok: boolean }> {
        const value = Math.round(Number(cluster));
        if (!QuizStatsService.validId(attemptId) || !(value >= 0 && value <= 5)) return { ok: false };
        const result = await this.dataSource.query(
            'UPDATE quiz_attempts SET "ntcChoice" = $2 WHERE id = $1 AND "ntcChoice" IS NULL',
            [attemptId, value],
        );
        return { ok: (result?.[1] ?? 0) > 0 };
    }

    // Воронка: ҳар ҷавоб «қадами охирини расида»-ро нав мекунад (бе маълумоти шахсӣ).
    async progress(sessionId: string, step: number, total: number, finished: boolean): Promise<{ ok: boolean }> {
        const id = String(sessionId || '');
        if (!/^[0-9a-z-]{8,40}$/i.test(id)) return { ok: false };
        const s = Math.max(0, Math.min(200, Math.round(Number(step) || 0)));
        const t = Number.isFinite(Number(total)) ? Math.max(0, Math.min(200, Math.round(Number(total)))) : null;
        await this.dataSource.query(
            `INSERT INTO quiz_sessions (id, "maxStep", total, finished) VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET "maxStep" = GREATEST(quiz_sessions."maxStep", EXCLUDED."maxStep"),
                 total = COALESCE(EXCLUDED.total, quiz_sessions.total),
                 finished = quiz_sessions.finished OR EXCLUDED.finished`,
            [id, s, t, !!finished],
        );
        return { ok: true };
    }

    // Самти аввал аз дуюм камаш 15% пеш (ҳамон ҳадди саволи «баробар»).
    static isClear(scores: Record<string, number>): boolean {
        const values = Object.values(scores || {}).map((v) => Number(v) || 0).sort((a, b) => b - a);
        if (!values.length) return false;
        return values.length < 2 || values[0] - values[1] >= 0.15 * Math.max(values[0], 1);
    }

    // Такрор: аввалин супориш ва аввалин супорише, ки камаш 7 рӯз баъд аст.
    static retest(rows: Array<{ userId: string | null; topCluster: string | null; createdAt: string | Date }>) {
        const byUser = new Map<string, Array<{ top: string; at: number }>>();
        for (const row of rows) {
            if (!row.userId || !row.topCluster) continue;
            byUser.set(row.userId, [...(byUser.get(row.userId) || []), { top: row.topCluster, at: new Date(row.createdAt).getTime() }]);
        }
        let users = 0;
        let same = 0;
        for (const list of byUser.values()) {
            list.sort((a, b) => a.at - b.at);
            const first = list[0];
            const later = list.find((item) => item.at - first.at >= RETEST_MIN_DAYS * 24 * 60 * 60 * 1000);
            if (!later) continue;
            users += 1;
            if (later.top === first.top) same += 1;
        }
        return { users, sameDirection: same, share: users ? Math.round((same / users) * 100) : null, minDays: RETEST_MIN_DAYS };
    }

    async quality() {
        const rows: Array<{ userId: string | null; topCluster: string | null; scores: Record<string, number>; rating: number | null; ntcChoice: number | null; createdAt: string }> =
            await this.dataSource.query('SELECT "userId", "topCluster", scores, rating, "ntcChoice", "createdAt" FROM quiz_attempts ORDER BY "createdAt"');

        const clear = rows.filter((row) => QuizStatsService.isClear(row.scores)).length;

        const chose = rows.filter((row) => row.ntcChoice && row.ntcChoice > 0 && row.topCluster);
        const agree = chose.filter((row) => row.topCluster === `c${row.ntcChoice}`).length;

        const rated = rows.filter((row) => row.rating);
        const distribution = [1, 2, 3, 4, 5].map((value) => rated.filter((row) => row.rating === value).length);

        const [funnel] = await this.dataSource.query(`
            SELECT count(*)::int AS started,
                   count(*) FILTER (WHERE finished)::int AS finished,
                   count(*) FILTER (WHERE NOT finished AND "maxStep" < 8)::int AS "leftEarly",
                   count(*) FILTER (WHERE NOT finished AND "maxStep" BETWEEN 8 AND 19)::int AS "leftMiddle",
                   count(*) FILTER (WHERE NOT finished AND "maxStep" >= 20)::int AS "leftLate"
            FROM quiz_sessions`);

        // Натиҷаҳои то пайдоиши ин ҷадвал (танҳо холҳо, бе ҷавобҳо) — аз профили корбарон.
        // Корбарони намоишӣ (як пароли умумӣ барои зиёда аз 3 нафар) ҷудо ҳисоб мешаванд.
        const past: Array<{ scores: Record<string, number>; demo: boolean }> = await this.dataSource.query(`
            SELECT "quizResults"->'mmtClusters' AS scores,
                   (u.password IS NOT NULL AND u.password IN (
                        SELECT password FROM "user" WHERE password IS NOT NULL GROUP BY password HAVING count(*) > 3)) AS demo
            FROM "user" u
            WHERE "quizResults" ? 'mmtClusters'`);
        const summarize = (list: Array<{ scores: Record<string, number> }>) => {
            const byCluster: Record<string, number> = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
            let clearCount = 0;
            let topSum = 0;
            for (const { scores } of list) {
                const ranked = Object.entries(scores || {}).map(([key, value]) => [key, Number(value) || 0] as [string, number])
                    .filter(([key]) => key in byCluster).sort((a, b) => b[1] - a[1]);
                if (!ranked.length) continue;
                byCluster[ranked[0][0]] += 1;
                topSum += ranked[0][1];
                if (QuizStatsService.isClear(scores)) clearCount += 1;
            }
            return {
                users: list.length,
                byCluster,
                clearShare: list.length ? Math.round((clearCount / list.length) * 100) : null,
                averageTop: list.length ? Math.round((topSum / list.length / 40) * 100) : null,
            };
        };

        return {
            results: {
                all: { ...summarize(past), demo: past.filter((row) => row.demo).length },
                real: summarize(past.filter((row) => !row.demo)),
            },
            attempts: rows.length,
            clarity: { count: rows.length, share: rows.length ? Math.round((clear / rows.length) * 100) : null },
            retest: QuizStatsService.retest(rows),
            ntcAgreement: { count: chose.length, share: chose.length ? Math.round((agree / chose.length) * 100) : null },
            satisfaction: {
                count: rated.length,
                average: rated.length ? Math.round((rated.reduce((sum, row) => sum + Number(row.rating), 0) / rated.length) * 10) / 10 : null,
                distribution,
            },
            funnel: {
                ...funnel,
                completion: funnel?.started ? Math.round((funnel.finished / funnel.started) * 100) : null,
            },
        };
    }
}
