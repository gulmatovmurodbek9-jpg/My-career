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
        pastTitle: "Натиҷаҳо то имрӯз",
        pastHint: "{{n}} корбари воқеӣ (корбарони намоишӣ ҳисоб нашудаанд). Ҷавобҳои ҳар савол нигоҳ дошта нашуда буданд, бинобар ин α аз инҳо ҳисоб намешавад.",
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
        pastTitle: "Результаты до сегодня",
        pastHint: "{{n}} реальных пользователей (демо-аккаунты не учтены). Ответы на каждый вопрос не сохранялись, поэтому α по ним не считается.",
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
        pastTitle: "Results so far",
        pastHint: "{{n}} real users (demo accounts excluded). Per-question answers were not stored, so α cannot be computed from these.",
        clear: "Clear result",
        clearHint: "the top direction leads the second by at least 15%",
        avgTop: "Average score of the top direction",
        newTitle: "From today (with answers)",
        names: { c1: "Natural-technical", c2: "Economics-geography", c3: "Philology-arts", c4: "Society-law", c5: "Medicine-sport" },
    },
};
const fill = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");

export default function TestQuality({ data }) {
    const { i18n } = useTranslation();
    const text = TEXT[(i18n.language || "tj").slice(0, 2)] || TEXT.tj;
    if (!data) return null;
    const color = (value) => (value == null ? "text-muted-foreground" : value >= 0.7 ? "text-emerald-600" : value >= 0.6 ? "text-amber-600" : "text-rose-600");

    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-black text-foreground">{text.title}</h2>
                <span className="text-sm text-muted-foreground">{text.attempts}: <b className="text-foreground">{data.attempts}</b></span>
            </div>

            {data.results?.users > 0 && (
                <div className="rounded-xl border border-border p-4 space-y-3">
                    <div>
                        <div className="text-sm font-bold text-foreground">{text.pastTitle}</div>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">{fill(text.pastHint, { n: data.results.users })}</p>
                    </div>
                    <div className="space-y-2">
                        {["c1", "c2", "c3", "c4", "c5"].map((key) => {
                            const count = data.results.byCluster?.[key] || 0;
                            const share = Math.round((count / data.results.users) * 100);
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
                            <div className="text-xl font-black text-foreground">{data.results.clearShare}%</div>
                            <div className="text-[12px] font-semibold text-muted-foreground">{text.clear} — {text.clearHint}</div>
                        </div>
                        <div className="rounded-xl bg-muted/40 p-3">
                            <div className="text-xl font-black text-foreground">{data.results.averageTop}%</div>
                            <div className="text-[12px] font-semibold text-muted-foreground">{text.avgTop}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-sm font-bold text-foreground">{text.newTitle}</div>

            <div>
                <div className="text-sm font-bold text-foreground">{text.alpha}</div>
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
                <p className="mt-2 text-[13px] text-muted-foreground">{(data.completeAttempts ?? 0) < 30 ? fill(text.alphaFew, { n: data.completeAttempts ?? 0 }) : text.alphaHint}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/40 p-4">
                    <div className="text-sm font-bold text-foreground">{text.retest}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {data.retest?.users ? fill(text.retestText, { users: data.retest.users, same: data.retest.sameDirection, share: data.retest.share }) : text.none}
                    </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                    <div className="text-sm font-bold text-foreground">{text.feedback}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {data.feedback?.count ? fill(text.feedbackText, { avg: data.feedback.average, count: data.feedback.count }) : text.none}
                    </p>
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
        </div>
    );
}
