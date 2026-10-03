import React from "react";
import { useTranslation } from "react-i18next";

// Сифати тест дар админка: эътимоднокӣ (Cronbach's α), test–retest ва баҳои хонандагон.
// Ин рақамҳо ба саволи журӣ «тест дуруст кор мекунад?» ҷавоб медиҳанд.
const TEXT = {
    tj: {
        title: "Сифати тест",
        attempts: "Супоришҳо (бо ҷавобҳо)",
        alpha: "Эътимоднокӣ (Cronbach's α) аз рӯи самт",
        alphaHint: "0,7 ва болотар — хуб; 0,6–0,7 — қобили қабул; камтар — саволҳои ин самт бояд дида шаванд.",
        alphaFew: "Барои α камаш 30 супориши пурра лозим аст — ҳоло {{n}}. Рақам ҳанӯз боэътимод нест.",
        retest: "Такрор (test–retest)",
        retestText: "{{users}} корбар ду бор супориданд; самти {{same}} нафар ({{share}}%) ҳамон монд.",
        feedback: "Баҳои хонандагон",
        feedbackText: "Миёна {{avg}} аз 5 ({{count}} баҳо)",
        none: "ҳанӯз нест",
        collecting: "Ҷамъ шуда истодааст", unitAttempts: "супориши пурра", unitRetest: "нафар ду бор супорид", unitRatings: "баҳо", pilot: "Пилот: 30 хонанда тестро супоранд ва баҳо диҳанд, пас аз як ҳафта такрор кунанд — ҳар се рақам пайдо мешавад.",
        pastTitle: "Натиҷаҳо то имрӯз",
        pastHint: "{{n}} нафар тестро супориданд — ба кадом самт рафтанд:",
        pastDemo: "аз онҳо {{d}} — корбарони намоишӣ",
        tabAll: "Ҳама ({{n}})",
        tabReal: "Танҳо воқеӣ ({{n}})",
        clear: "Натиҷаи равшан",
        clearHint: "самти аввал аз дуюм камаш 15% пеш",
        avgTop: "Холи миёнаи самти аввал",
        newTitle: "Аз имрӯз (бо ҷавобҳо)",
        names: { c1: "Табиӣ-техникӣ", c2: "Иқтисод-география", c3: "Филология-санъат", c4: "Ҷомеа-ҳуқуқ", c5: "Тиб-варзиш" },
    },
    ru: {
        title: "Качество теста",
        attempts: "Попытки (с ответами)",
        alpha: "Надёжность (альфа Кронбаха) по направлениям",
        alphaHint: "0,7 и выше — хорошо; 0,6–0,7 — приемлемо; ниже — вопросы направления нужно пересмотреть.",
        alphaFew: "Для α нужно минимум 30 полных прохождений — сейчас {{n}}. Число пока ненадёжно.",
        retest: "Повтор (test–retest)",
        retestText: "{{users}} пользователей прошли дважды; у {{same}} ({{share}}%) направление не изменилось.",
        feedback: "Оценки учеников",
        feedbackText: "Среднее {{avg}} из 5 ({{count}} оценок)",
        none: "пока нет",
        collecting: "Идёт сбор данных", unitAttempts: "полных прохождений", unitRetest: "прошли дважды", unitRatings: "оценок", pilot: "Пилот: 30 учеников проходят тест и ставят оценку, через неделю повторяют — появятся все три показателя.",
        pastTitle: "Результаты до сегодня",
        pastHint: "{{n}} человек прошли тест — куда они попали:",
        pastDemo: "из них {{d}} — демо-аккаунты",
        tabAll: "Все ({{n}})",
        tabReal: "Только реальные ({{n}})",
        clear: "Чёткий результат",
        clearHint: "первое направление опережает второе минимум на 15%",
        avgTop: "Средний балл первого направления",
        newTitle: "С сегодняшнего дня (с ответами)",
        names: { c1: "Естественно-технич.", c2: "Экономика-геогр.", c3: "Филология-искусство", c4: "Общество-право", c5: "Медицина-спорт" },
    },
    en: {
        title: "Test quality",
        attempts: "Attempts (with answers)",
        alpha: "Reliability (Cronbach's α) by direction",
        alphaHint: "0.7 and above — good; 0.6–0.7 — acceptable; lower — review that direction's questions.",
        alphaFew: "α needs at least 30 complete attempts — {{n}} so far. The number is not reliable yet.",
        retest: "Repeat (test–retest)",
        retestText: "{{users}} users took it twice; for {{same}} ({{share}}%) the direction stayed the same.",
        feedback: "Student ratings",
        feedbackText: "Average {{avg}} of 5 ({{count}} ratings)",
        none: "none yet",
        collecting: "Collecting data", unitAttempts: "complete attempts", unitRetest: "took it twice", unitRatings: "ratings", pilot: "Pilot: 30 students take the test and rate it, then retake it a week later — all three figures will appear.",
        pastTitle: "Results so far",
        pastHint: "{{n}} people took the test — where they landed:",
        pastDemo: "{{d}} of them are demo accounts",
        tabAll: "All ({{n}})",
        tabReal: "Real only ({{n}})",
        clear: "Clear result",
        clearHint: "the top direction leads the second by at least 15%",
        avgTop: "Average score of the top direction",
        newTitle: "From today (with answers)",
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

export default function TestQuality({ data }) {
    const { i18n } = useTranslation();
    const [scope, setScope] = React.useState("all");
    const text = TEXT[(i18n.language || "tj").slice(0, 2)] || TEXT.tj;
    if (!data) return null;
    const color = (value) => (value == null ? "text-muted-foreground" : value >= 0.7 ? "text-emerald-600" : value >= 0.6 ? "text-amber-600" : "text-rose-600");

    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-black text-foreground">{text.title}</h2>
                <span className="text-sm text-muted-foreground">{text.attempts}: <b className="text-foreground">{data.attempts}</b></span>
            </div>

            {data.results?.all?.users > 0 && (() => {
                const past = scope === "real" ? data.results.real : data.results.all;
                return (
                <div className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-sm font-bold text-foreground">{text.pastTitle}</div>
                            <p className="mt-0.5 text-[13px] text-muted-foreground">
                                {fill(text.pastHint, { n: past.users })}
                                {scope === "all" && data.results.all.demo > 0 && <> {" "}<span className="text-amber-700 dark:text-amber-400">({fill(text.pastDemo, { d: data.results.all.demo })})</span></>}
                            </p>
                        </div>
                        <div className="inline-flex rounded-lg border border-border p-0.5" role="group">
                            {[["all", fill(text.tabAll, { n: data.results.all.users })], ["real", fill(text.tabReal, { n: data.results.real.users })]].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setScope(value)}
                                    aria-pressed={scope === value}
                                    className={`rounded-md px-2.5 py-1 text-[12px] font-bold cursor-pointer ${scope === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
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
                );
            })()}

            <div className="text-sm font-bold text-foreground">{text.newTitle}</div>

            <div>
                <div className="text-sm font-bold text-foreground">{text.alpha}</div>
                {(data.completeAttempts ?? 0) < 30 ? (
                    <div className="mt-2 rounded-xl bg-muted/40 p-3">
                        <div className="text-[13px] font-bold text-amber-700 dark:text-amber-400">{text.collecting}</div>
                        <Progress value={data.completeAttempts} goal={30} unit={text.unitAttempts} />
                    </div>
                ) : (
                <div className="mt-2 grid grid-cols-5 gap-2">
                    {["c1", "c2", "c3", "c4", "c5"].map((key) => (
                        <div key={key} className="rounded-xl bg-muted/40 p-3 text-center">
                            <div className="text-xs font-semibold text-muted-foreground">{key.toUpperCase()}</div>
                            <div className={`text-xl font-black tabular-nums ${color(data.alpha?.[key])}`}>
                                {data.alpha?.[key] == null ? "—" : data.alpha[key].toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
                )}
                <p className="mt-2 text-[13px] text-muted-foreground">{(data.completeAttempts ?? 0) < 30 ? fill(text.alphaFew, { n: data.completeAttempts ?? 0 }) : text.alphaHint}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/40 p-4">
                    <div className="text-sm font-bold text-foreground">{text.retest}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {data.retest?.users ? fill(text.retestText, { users: data.retest.users, same: data.retest.sameDirection, share: data.retest.share }) : text.collecting}
                    </p>
                    {(data.retest?.users || 0) < 10 && <Progress value={data.retest?.users} goal={10} unit={text.unitRetest} />}
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                    <div className="text-sm font-bold text-foreground">{text.feedback}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {data.feedback?.count ? fill(text.feedbackText, { avg: data.feedback.average, count: data.feedback.count }) : text.collecting}
                    </p>
                    {(data.feedback?.count || 0) < 30 && <Progress value={data.feedback?.count} goal={30} unit={text.unitRatings} />}
                    {data.feedback?.count > 0 && (
                        <div className="mt-2 flex items-end gap-1.5 h-12">
                            {data.feedback.distribution.map((count, index) => {
                                const max = Math.max(...data.feedback.distribution, 1);
                                return (
                                    <div key={index} className="flex flex-1 flex-col items-center gap-1">
                                        <div className="w-full rounded bg-primary/70" style={{ height: `${Math.max(4, (count / max) * 36)}px` }} title={`${index + 1}: ${count}`} />
                                        <span className="text-[11px] text-muted-foreground">{index + 1}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            {((data.completeAttempts ?? 0) < 30 || (data.feedback?.count || 0) < 30) && (
                <p className="text-[13px] leading-relaxed text-muted-foreground">💡 {text.pilot}</p>
            )}
        </div>
    );
}
