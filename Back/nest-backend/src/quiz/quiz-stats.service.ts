import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MMT_QUESTIONS } from './data/questions-mmt';

// Далел барои журӣ: ҳар супориши тест (бо ҷавобҳо) нигоҳ дошта мешавад, то
// 1) эътимоднокии тест (Cronbach's α) ҳисоб шавад,
// 2) test–retest: корбаре, ки ду бор супорид — самташ ҳамон монд?
// 3) баҳои хонанда: «натиҷа ба шумо мувофиқ буд? 1–5».
// Ном ва почта нигоҳ дошта намешаванд — танҳо userId (агар ворид шуда бошад).
@Injectable()
export class QuizStatsService implements OnModuleInit {
    constructor(private readonly dataSource: DataSource) { }

    async onModuleInit(): Promise<void> {
        // Ҷадвали нав бе migration (production synchronize надорад); такрор зарар намерасонад.
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
        await this.dataSource.query('CREATE INDEX IF NOT EXISTS quiz_attempts_user ON quiz_attempts ("userId")');
    }

    async record(answers: any[], scores: any, topCluster: string | null, grade: number | null, userId?: string): Promise<string | null> {
        try {
            const clean = (Array.isArray(answers) ? answers : [])
                .map((a) => ({ questionId: String(a?.questionId || '').slice(0, 40), selectedValue: a?.selectedValue }))
                .slice(0, 80);
            const [row] = await this.dataSource.query(
                `INSERT INTO quiz_attempts ("userId", answers, scores, "topCluster", grade) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [userId || null, JSON.stringify(clean), JSON.stringify(scores?.mmtClusters || {}), topCluster, grade],
            );
            return row?.id || null;
        } catch (error) {
            console.error('quiz_attempts:', (error as any)?.message || error);
            return null;
        }
    }

    async feedback(attemptId: string, rating: number, comment?: string): Promise<{ ok: boolean }> {
        const value = Math.round(Number(rating));
        if (!/^[0-9a-f-]{36}$/i.test(String(attemptId)) || value < 1 || value > 5) return { ok: false };
        const result = await this.dataSource.query(
            'UPDATE quiz_attempts SET rating = $2, comment = $3 WHERE id = $1 AND rating IS NULL',
            [attemptId, value, comment ? String(comment).slice(0, 500) : null],
        );
        return { ok: (result?.[1] ?? 0) > 0 };
    }

    // Cronbach's α барои ҳар кластер: k/(k−1)·(1 − Σσ²_савол / σ²_ҷамъ).
    static cronbachAlpha(matrix: number[][]): number | null {
        const n = matrix.length;
        const k = matrix[0]?.length ?? 0;
        if (n < 3 || k < 2) return null;
        const variance = (values: number[]) => {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
        };
        const itemVar = Array.from({ length: k }, (_, j) => variance(matrix.map((row) => row[j]))).reduce((a, b) => a + b, 0);
        const totalVar = variance(matrix.map((row) => row.reduce((a, b) => a + b, 0)));
        if (totalVar === 0) return null;
        return Math.round((k / (k - 1)) * (1 - itemVar / totalVar) * 100) / 100;
    }

    async quality() {
        const rows: Array<{ userId: string | null; answers: any[]; topCluster: string | null; rating: number | null; createdAt: string }> =
            await this.dataSource.query('SELECT "userId", answers, "topCluster", rating, "createdAt" FROM quiz_attempts ORDER BY "createdAt"');

        // Матритсаи холҳо: танҳо супоришҳое, ки ба ҳамаи саволҳои қисми 1 ҷавоб доданд.
        const items = MMT_QUESTIONS;
        const alpha: Record<string, number | null> = {};
        const complete = rows
            .map((row) => new Map((row.answers || []).map((a: any) => [a.questionId, Number(a.selectedValue)])))
            .filter((map) => items.every((q) => map.has(q.id)));
        for (const cluster of ['c1', 'c2', 'c3', 'c4', 'c5']) {
            const matrix = complete.map((map) => items.map((q) => Number((q.options[map.get(q.id) as number]?.scores as any)?.[cluster]) || 0));
            alpha[cluster] = QuizStatsService.cronbachAlpha(matrix);
        }

        // Test–retest: корбароне, ки ду ва зиёда бор супориданд — самти аввал ва охир.
        const byUser = new Map<string, string[]>();
        for (const row of rows) {
            if (!row.userId || !row.topCluster) continue;
            byUser.set(row.userId, [...(byUser.get(row.userId) || []), row.topCluster]);
        }
        const repeated = [...byUser.values()].filter((list) => list.length >= 2);
        const same = repeated.filter((list) => list[0] === list[list.length - 1]).length;

        const rated = rows.filter((row) => row.rating);
        const distribution = [1, 2, 3, 4, 5].map((value) => rated.filter((row) => row.rating === value).length);

        // Натиҷаҳои то пайдоиши ин ҷадвал (танҳо холҳо, бе ҷавобҳо) — аз профили корбарони
        // ВОҚЕӢ. Корбарони намоишӣ (як пароли умумӣ барои зиёда аз 3 нафар) ҳисоб намешаванд.
        const past: Array<{ scores: Record<string, number>; demo: boolean }> = await this.dataSource.query(`
            SELECT "quizResults"->'mmtClusters' AS scores,
                   (u.password IS NOT NULL AND u.password IN (
                        SELECT password FROM "user" WHERE password IS NOT NULL GROUP BY password HAVING count(*) > 3)) AS demo
            FROM "user" u
            WHERE "quizResults" ? 'mmtClusters'`);
        const summarize = (list: Array<{ scores: Record<string, number> }>) => {
            const byCluster: Record<string, number> = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
            let clear = 0;
            let topSum = 0;
            for (const { scores } of list) {
                const ranked = Object.entries(scores || {}).map(([key, value]) => [key, Number(value) || 0] as [string, number])
                    .filter(([key]) => key in byCluster).sort((a, b) => b[1] - a[1]);
                if (!ranked.length) continue;
                byCluster[ranked[0][0]] += 1;
                topSum += ranked[0][1];
                // «Натиҷаи равшан»: самти аввал аз дуюм камаш 15% пеш аст (ҳамон ҳадди саволи «баробар»).
                if (!ranked[1] || ranked[0][1] - ranked[1][1] >= 0.15 * Math.max(ranked[0][1], 1)) clear += 1;
            }
            return {
                users: list.length,
                byCluster,
                clearShare: list.length ? Math.round((clear / list.length) * 100) : null,
                averageTop: list.length ? Math.round((topSum / list.length / 40) * 100) : null,
            };
        };
        // Ҳама ва танҳо воқеӣ — ҷудо: корбарони намоишӣ (як пароли умумӣ) дар «воқеӣ» нестанд.
        const results = {
            all: { ...summarize(past), demo: past.filter((row) => row.demo).length },
            real: summarize(past.filter((row) => !row.demo)),
        };

        return {
            results,
            attempts: rows.length,
            completeAttempts: complete.length,
            alpha,
            alphaNote: complete.length < 30 ? 'Барои α камаш 30 супориши пурра лозим аст — рақам ҳанӯз боэътимод нест.' : null,
            retest: { users: repeated.length, sameDirection: same, share: repeated.length ? Math.round((same / repeated.length) * 100) : null },
            feedback: {
                count: rated.length,
                average: rated.length ? Math.round((rated.reduce((sum, row) => sum + Number(row.rating), 0) / rated.length) * 10) / 10 : null,
                distribution,
            },
        };
    }
}
