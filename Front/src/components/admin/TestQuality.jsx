import React from "react";
import { useTranslation } from "react-i18next";

// Сифати тест — танҳо нишондиҳандаҳое, ки барои тести «интихоби маҷбурӣ» маъно доранд.
// Cronbach's α бардошта шуд: барои тестҳои ipsative натиҷаи каҷ медиҳад (Hicks 1970).
const TEXT = {
    tj: {
        title: "Сифати тест",
        attempts: "Супоришҳо (бо ҷавобҳо)",
        clarity: "Равшании натиҷа",
        clarityHint: "Самти аввал аз дуюм камаш 15% пеш — тест ҷавоби аниқ дод.",
        retest: "Устуворӣ (такрор пас аз ≥ 7 рӯз)",
        retestText: "{{users}} нафар пас аз ≥ 7 рӯз такрор карданд; самти {{same}} нафар ({{share}}%) ҳамон монд.",
        ntc: "Мувофиқат бо интихоби ММТ",
        ntcText: "Аз {{count}} хонанда, ки кластери ММТ-ро гуфтанд, натиҷаи тести {{share}}% бо он мувофиқ аст.",
        satisfaction: "Қаноатмандӣ (1–5)",
        satisfactionText: "Миёна {{avg}} аз 5 ({{count}} баҳо). Ин фикри хонанда аст, на далели дурустӣ.",
        funnel: "Воронкаи тест",
        funnelText: "Сар карданд: {{started}} · то охир: {{finished}} ({{completion}}%)",
        left: "Монданд: дар аввал {{early}} · дар миёна {{middle}} · дар охир {{late}}",
        collecting: "Ҷамъ шуда истодааст",
        unitAttempts: "супориш",
        unitRetest: "нафар такрор кард",
        unitNtc: "ҷавоб",
        unitRatings: "баҳо",
        unitStarts: "оғоз",
        pilot: "Пилот: 30 хонанда тестро супоранд ва ба ду саволи охир ҷавоб диҳанд, пас аз як ҳафта такрор кунанд — ҳамаи рақамҳо пайдо мешаванд.",
        pastTitle: "Натиҷаҳо то имрӯз",
        pastHint: "{{n}} нафар тестро супориданд — ба кадом самт рафтанд:",
        clear: "Натиҷаи равшан",
        clearHint: "самти аввал аз дуюм камаш 15% пеш",
        avgTop: "Холи миёнаи самти аввал",
        newTitle: "Аз 03.10.2026 (бо ҷавобҳо)",
        names: { c1: "Табиӣ-техникӣ", c2: "Иқтисод-география", c3: "Филология-санъат", c4: "Ҷомеа-ҳуқуқ", c5: "Тиб-варзиш" },
    },
    ru: {
        title: "Качество теста",
        attempts: "Попытки (с ответами)",
        clarity: "Чёткость результата",
        clarityHint: "Первое направление опережает второе минимум на 15% — тест дал однозначный ответ.",
        retest: "Устойчивость (повтор через ≥ 7 дней)",
        retestText: "{{users}} человек повторили через ≥ 7 дней; у {{same}} ({{share}}%) направление не изменилось.",
        ntc: "Совпадение с выбором в НЦТ",
        ntcText: "Из {{count}} учеников, назвавших свой кластер НЦТ, у {{share}}% результат теста с ним совпал.",
        satisfaction: "Удовлетворённость (1–5)",
        satisfactionText: "Среднее {{avg}} из 5 ({{count}} оценок). Это мнение ученика, а не доказательство точности.",
        funnel: "Воронка теста",
        funnelText: "Начали: {{started}} · дошли до конца: {{finished}} ({{completion}}%)",
        left: "Ушли: в начале {{early}} · в середине {{middle}} · в конце {{late}}",
        collecting: "Идёт сбор данных",
        unitAttempts: "попыток",
        unitRetest: "повторили",
        unitNtc: "ответов",
        unitRatings: "оценок",
        unitStarts: "запусков",
        pilot: "Пилот: 30 учеников проходят тест и отвечают на два последних вопроса, через неделю повторяют — появятся все показатели.",
        pastTitle: "Результаты до сегодня",
        pastHint: "{{n}} человек прошли тест — куда они попали:",
        clear: "Чёткий результат",
        clearHint: "первое направление опережает второе минимум на 15%",
        avgTop: "Средний балл первого направления",
        newTitle: "С 03.10.2026 (с ответами)",
        names: { c1: "Естественно-технич.", c2: "Экономика-геогр.", c3: "Филология-искусство", c4: "Общество-право", c5: "Медицина-спорт" },
    },
    en: {
        title: "Test quality",
        attempts: "Attempts (with answers)",
        clarity: "Result clarity",
        clarityHint: "The top direction leads the second by at least 15% — a clear answer.",
        retest: "Stability (retake after ≥ 7 days)",
        retestText: "{{users}} people retook it after ≥ 7 days; for {{same}} ({{share}}%) the direction stayed the same.",
        ntc: "Match with the NTC choice",
        ntcText: "Of {{count}} students who named their NTC cluster, {{share}}% got the same direction in the test.",
        satisfaction: "Satisfaction (1–5)",
        satisfactionText: "Average {{avg}} of 5 ({{count}} ratings). This is the student's opinion, not proof of accuracy.",
        funnel: "Test funnel",
        funnelText: "Started: {{started}} · finished: {{finished}} ({{completion}}%)",
        left: "Dropped: early {{early}} · middle {{middle}} · late {{late}}",
        collecting: "Collecting data",
        unitAttempts: "attempts",
        unitRetest: "retook it",
        unitNtc: "answers",
        unitRatings: "ratings",
        unitStarts: "starts",
        pilot: "Pilot: 30 students take the test and answer the last two questions, then retake it a week later — every figure will appear.",
        pastTitle: "Results so far",
        pastHint: "{{n}} people took the test — where they landed:",
        clear: "Clear result",
        clearHint: "the top direction leads the second by at least 15%",
        avgTop: "Average score of the top direction",
        newTitle: "Since 03.10.2026 (with answers)",
        names: { c1: "Natural-technical", c2: "Economics-geography", c3: "Philology-arts", c4: "Society-law", c5: "Medicine-sport" },
    },
};
const fill = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");

// Навори пешрафт: «12 / 30» — то рақам боэътимод шавад.
function Progress({ value, goal, unit }) {
    const share = Math.min(100, Math.round(((value || 0) / goal) * 100));
    return (
        <div className="mt-2">
            <div className="flex justify-between text-[12px] font-semibold text-muted-foreground">
                <span>{value || 0} / {goal} {unit}</span>
                <span>{share}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${share}%` }} />
            </div>
        </div>
    );
}

function Metric({ title, ready, children, value, goal, unit, collecting }) {
    return (
        <div className="rounded-xl bg-muted/40 p-4">
            <div className="text-sm font-bold text-foreground">{title}</div>
            {ready ? (
                <div className="mt-1 text-sm text-muted-foreground">{children}</div>
            ) : (
                <>
                    <div className="mt-1 text-[13px] font-bold text-amber-700 dark:text-amber-400">{collecting}</div>
                    <Progress value={value} goal={goal} unit={unit} />
                </>
            )}
        </div>
    );
}

export default function TestQuality({ data }) {
    const { i18n } = useTranslation();
    const text = TEXT[(i18n.language || "tj").slice(0, 2)] || TEXT.tj;
    if (!data) return null;
    // Як рӯйхати умумӣ (бе ҷудо кардан ба «ҳама / танҳо воқеӣ»).
    const past = data.results ? data.results.all : null;
    const funnel = data.funnel || {};

    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-black text-foreground">{text.title}</h2>
                <span className="text-sm text-muted-foreground">{text.attempts}: <b className="text-foreground">{data.attempts}</b></span>
            </div>

            {past?.users > 0 && (
                <div className="rounded-xl border border-border p-4 space-y-3">
                    <div>
                        <div className="text-sm font-bold text-foreground">{text.pastTitle}</div>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">{fill(text.pastHint, { n: past.users })}</p>
                    </div>
                    <div className="space-y-2">
                        {["c1", "c2", "c3", "c4", "c5"].map((key) => {
                            const count = past.byCluster?.[key] || 0;
                            const share = past.users ? Math.round((count / past.users) * 100) : 0;
                            return (
                                <div key={key}>
                                    <div className="mb-1 flex justify-between text-[13px]">
                                        <span className="font-semibold text-foreground">{text.names[key]}</span>
                                        <span className="tabular-nums text-muted-foreground">{count} · {share}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-muted/40 p-3">
                            <div className="text-xl font-black text-foreground">{past.clearShare ?? 0}%</div>
                            <div className="text-[12px] font-semibold text-muted-foreground">{text.clear} — {text.clearHint}</div>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-3">
                            <div className="text-xl font-black text-foreground">{past.averageTop ?? 0}%</div>
                            <div className="text-[12px] font-semibold text-muted-foreground">{text.avgTop}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-sm font-bold text-foreground">{text.newTitle}</div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric title={text.clarity} ready={(data.clarity?.count || 0) >= 30} value={data.clarity?.count} goal={30} unit={text.unitAttempts} collecting={text.collecting}>
                    <span className="text-xl font-black text-foreground">{data.clarity?.share}%</span> — {text.clarityHint}
                </Metric>
                <Metric title={text.retest} ready={(data.retest?.users || 0) >= 10} value={data.retest?.users} goal={10} unit={text.unitRetest} collecting={text.collecting}>
                    {fill(text.retestText, { users: data.retest?.users, same: data.retest?.sameDirection, share: data.retest?.share })}
                </Metric>
                <Metric title={text.ntc} ready={(data.ntcAgreement?.count || 0) >= 20} value={data.ntcAgreement?.count} goal={20} unit={text.unitNtc} collecting={text.collecting}>
                    {fill(text.ntcText, { count: data.ntcAgreement?.count, share: data.ntcAgreement?.share })}
                </Metric>
                <Metric title={text.satisfaction} ready={(data.satisfaction?.count || 0) >= 30} value={data.satisfaction?.count} goal={30} unit={text.unitRatings} collecting={text.collecting}>
                    {fill(text.satisfactionText, { avg: data.satisfaction?.average, count: data.satisfaction?.count })}
                </Metric>
            </div>

            <Metric title={text.funnel} ready={(funnel.started || 0) >= 20} value={funnel.started} goal={20} unit={text.unitStarts} collecting={text.collecting}>
                <div>{fill(text.funnelText, { started: funnel.started, finished: funnel.finished, completion: funnel.completion ?? 0 })}</div>
                <div className="mt-1">{fill(text.left, { early: funnel.leftEarly ?? 0, middle: funnel.leftMiddle ?? 0, late: funnel.leftLate ?? 0 })}</div>
            </Metric>

            <p className="text-[13px] leading-relaxed text-muted-foreground">💡 {text.pilot}</p>
        </div>
    );
}
