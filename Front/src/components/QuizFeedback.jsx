import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API } from "../lib/config";

// Баъди тест ду савол:
// 1) «Дар ММТ кадом кластерро интихоб кардед / мекунед?» — муқоисаи натиҷа бо интихоби ВОҚЕӢ;
// 2) «Натиҷа ба шумо писанд омад? 1–5» — қаноатмандӣ (на далели дурустӣ).
const TEXT = {
    tj: {
        ntcTitle: "Дар ММТ кадом кластерро интихоб кардед ё мекунед?",
        ntcHint: "Ин ба мо ёрӣ медиҳад санҷем, ки тест бо интихоби воқеии хонандагон чӣ қадар мувофиқ аст.",
        unknown: "Ҳанӯз намедонам",
        title: "Натиҷа ба шумо писанд омад?",
        hint: "1 — тамоман не, 5 — хеле. Ин фикри шумост — барои беҳтар кардани тест.",
        comment: "Чӣ нодуруст буд? (ихтиёрӣ)",
        send: "Фиристодан",
        thanks: "Ташаккур! Ҷавобҳои шумо сабт шуданд.",
        clusters: ["1. Табиӣ ва техникӣ", "2. Иқтисод ва география", "3. Филология, педагогика ва санъат", "4. Ҷомеашиносӣ ва ҳуқуқ", "5. Тиб, биология ва варзиш"],
    },
    ru: {
        ntcTitle: "Какой кластер вы выбрали или выберете в НЦТ?",
        ntcHint: "Это поможет проверить, насколько тест совпадает с реальным выбором учеников.",
        unknown: "Пока не знаю",
        title: "Вам понравился результат?",
        hint: "1 — совсем нет, 5 — очень. Это ваше мнение — для улучшения теста.",
        comment: "Что было не так? (необязательно)",
        send: "Отправить",
        thanks: "Спасибо! Ваши ответы сохранены.",
        clusters: ["1. Естественные и технические", "2. Экономика и география", "3. Филология, педагогика и искусство", "4. Обществознание и право", "5. Медицина, биология и спорт"],
    },
    en: {
        ntcTitle: "Which cluster did you (or will you) choose in the NTC exam?",
        ntcHint: "This helps us check how well the test matches students' real choices.",
        unknown: "I don't know yet",
        title: "Did you like the result?",
        hint: "1 — not at all, 5 — very much. This is your opinion — it helps improve the test.",
        comment: "What was off? (optional)",
        send: "Send",
        thanks: "Thank you! Your answers have been saved.",
        clusters: ["1. Natural & technical", "2. Economics & geography", "3. Philology, pedagogy & arts", "4. Social science & law", "5. Medicine, biology & sport"],
    },
};

export default function QuizFeedback({ attemptId }) {
    const { i18n } = useTranslation();
    const text = TEXT[(i18n.language || "tj").slice(0, 2)] || TEXT.tj;
    const [ntc, setNtc] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);

    if (!attemptId) return null;

    const send = async () => {
        if ((!rating && ntc === null) || sending) return;
        setSending(true);
        try {
            await Promise.all([
                ntc !== null ? axios.post(`${API}/quiz/ntc-choice`, { attemptId, cluster: ntc }) : null,
                rating ? axios.post(`${API}/quiz/feedback`, { attemptId, rating, comment: comment.trim() || undefined }) : null,
            ]);
        } catch {
            /* нарасид — корбарро озор намедиҳем */
        }
        setSent(true);
        setSending(false);
    };

    const chip = (active) => `rounded-xl border px-3 py-2 text-[13px] font-semibold text-left cursor-pointer focus-ring ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-foreground hover:border-primary"
    }`;

    return (
        <section className="rounded-[2rem] border border-border bg-card p-6 sm:p-8 space-y-6" aria-live="polite">
            {sent ? (
                <p className="text-center font-bold text-foreground">{text.thanks}</p>
            ) : (
                <>
                    <div>
                        <h2 className="text-lg font-black text-foreground">{text.ntcTitle}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{text.ntcHint}</p>
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label={text.ntcTitle}>
                            {text.clusters.map((label, index) => (
                                <button key={label} type="button" role="radio" aria-checked={ntc === index + 1} onClick={() => setNtc(index + 1)} className={chip(ntc === index + 1)}>
                                    {label}
                                </button>
                            ))}
                            <button type="button" role="radio" aria-checked={ntc === 0} onClick={() => setNtc(0)} className={chip(ntc === 0)}>
                                {text.unknown}
                            </button>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-black text-foreground">{text.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{text.hint}</p>
                        <div className="mt-3 flex gap-2" role="radiogroup" aria-label={text.title}>
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="radio"
                                    aria-checked={rating === value}
                                    onClick={() => setRating(value)}
                                    className={`h-12 w-12 rounded-xl border text-lg font-black cursor-pointer focus-ring ${
                                        rating === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-foreground hover:border-primary"
                                    }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                        {rating > 0 && rating <= 3 && (
                            <textarea
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                                maxLength={500}
                                rows={2}
                                placeholder={text.comment}
                                className="mt-3 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none focus:border-primary"
                            />
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={send}
                        disabled={(!rating && ntc === null) || sending}
                        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {text.send}
                    </button>
                </>
            )}
        </section>
    );
}
