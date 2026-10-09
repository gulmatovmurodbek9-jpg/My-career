import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuizStatsService } from '../quiz/quiz-stats.service';

// «Лавҳаи таъсир» барои ҳимоя: ҳамаи рақамҳо аз ҷадвалҳои воқеӣ (корбарони намоишӣ —
// як пароли умумӣ барои зиёда аз 3 нафар — ҳисоб намешаванд).
const DEMO_USERS = `SELECT password FROM "user" WHERE password IS NOT NULL GROUP BY password HAVING count(*) > 3`;
const DAYS = 14;

type TrialRow = { careerId: string | null; family: string; solved: number; rating: number | null; confBefore: number | null; confAfter: number | null; tasks: Array<{ liked?: boolean }>; createdAt: string };

const average = (list: number[]) => (list.length ? Math.round((list.reduce((sum, value) => sum + value, 0) / list.length) * 10) / 10 : null);
const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : null);

@Injectable()
export class ImpactService {
    constructor(private readonly dataSource: DataSource) { }

    // Ҳамон қоидаи «касби дигарро санҷед» дар хулосаи санҷиш (trial.service finishScenario).
    static notForMe(row: Pick<TrialRow, 'rating' | 'tasks'>): boolean {
        const tasks = row.tasks || [];
        return (row.rating !== null && row.rating <= 2) || tasks.filter((task) => task.liked).length < tasks.length / 3;
    }

    static summarizeTrials(rows: TrialRow[]) {
        const paired = rows.filter((row) => row.confBefore && row.confAfter);
        const notForMe = rows.filter((row) => ImpactService.notForMe(row)).length;
        return {
            count: rows.length,
            careers: new Set(rows.map((row) => row.careerId).filter(Boolean)).size,
            rating: average(rows.map((row) => Number(row.rating)).filter((value) => value > 0)),
            confidence: {
                count: paired.length,
                before: average(paired.map((row) => Number(row.confBefore))),
                after: average(paired.map((row) => Number(row.confAfter))),
                upShare: percent(paired.filter((row) => Number(row.confAfter) > Number(row.confBefore)).length, paired.length),
                downShare: percent(paired.filter((row) => Number(row.confAfter) < Number(row.confBefore)).length, paired.length),
            },
            notForMe,
            notForMeShare: percent(notForMe, rows.length),
            fitShare: percent(rows.length - notForMe, rows.length),
        };
    }

    async impact() {
        const quiz: Array<{ scores: Record<string, number>; rating: number | null; createdAt: string }> =
            await this.dataSource.query('SELECT scores, rating, "createdAt" FROM quiz_attempts');
        const [sessions] = await this.dataSource.query(
            'SELECT count(*)::int AS started, count(*) FILTER (WHERE finished)::int AS finished FROM quiz_sessions');
        const trials: TrialRow[] = await this.dataSource.query(
            'SELECT "careerId", family, solved, rating, "confBefore", "confAfter", tasks, "createdAt" FROM trial_attempts');
        const [users] = await this.dataSource.query(`
            SELECT count(*)::int AS registered,
                   count(*) FILTER (WHERE u."quizResults" ? 'mmtClusters')::int AS "withResult",
                   count(*) FILTER (WHERE jsonb_array_length(COALESCE(u."applicationChoices", '[]'::jsonb)) > 0)::int AS "withPlan",
                   (SELECT count(*)::int FROM user_saved_careers s WHERE s."userId" IN (
                        SELECT id FROM "user" WHERE password IS NULL OR password NOT IN (${DEMO_USERS}))) AS saved
            FROM "user" u
            WHERE u.role = 'user' AND (u.password IS NULL OR u.password NOT IN (${DEMO_USERS}))`);

        const [classes] = await this.dataSource.query(`
            SELECT (SELECT count(*)::int FROM classrooms WHERE archived = false) AS classrooms,
                   (SELECT count(*)::int FROM classroom_members) AS members,
                   (SELECT count(*)::int FROM "user" WHERE role = 'teacher') AS teachers`).catch(() => [{ classrooms: 0, members: 0, teachers: 0 }]);
        const rated = quiz.filter((row) => row.rating);
        const since = Date.now() - DAYS * 24 * 60 * 60 * 1000;
        const day = (value: string) => new Date(value).toISOString().slice(0, 10);
        const activity = Array.from({ length: DAYS }, (_, i) => {
            const date = new Date(Date.now() - (DAYS - 1 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            return {
                date,
                quiz: quiz.filter((row) => new Date(row.createdAt).getTime() >= since && day(row.createdAt) === date).length,
                trials: trials.filter((row) => new Date(row.createdAt).getTime() >= since && day(row.createdAt) === date).length,
            };
        });

        return {
            quiz: {
                started: Math.max(sessions?.started || 0, quiz.length),
                finished: quiz.length,
                completion: percent(quiz.length, Math.max(sessions?.started || 0, quiz.length)),
                rating: average(rated.map((row) => Number(row.rating))),
                ratedCount: rated.length,
                satisfiedShare: percent(rated.filter((row) => Number(row.rating) >= 4).length, rated.length),
                clearShare: percent(quiz.filter((row) => QuizStatsService.isClear(row.scores)).length, quiz.length),
            },
            trials: ImpactService.summarizeTrials(trials),
            users,
            classes,
            activity,
            generatedAt: new Date().toISOString(),
        };
    }
}
