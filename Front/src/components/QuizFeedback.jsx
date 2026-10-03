import React, { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API } from "../lib/config";

// «Натиҷа ба шумо мувофиқ буд? 1–5» — далели воқеӣ барои сифати тест (пилот, журӣ).
const TEXT = {
    tj: {
        title: "Натиҷа ба шумо мувофиқ буд?",
        hint: "1 — тамоман не, 5 — комилан мувофиқ. Ҷавоби шумо ба беҳтар кардани тест ёрӣ медиҳад.",
        comment: "Чӣ нодуруст буд? (ихтиёрӣ)",
        send: "Фиристодан",
        thanks: "Ташаккур! Баҳои шумо сабт шуд.",
    },
    ru: {
        title: "Результат вам подошёл?",
        hint: "1 — совсем нет, 5 — полностью подходит. Ваш ответ поможет улучшить тест.",
        comment: "Что было не так? (необязательно)",
        send: "Отправить",
        thanks: "Спасибо! Ваша оценка сохранена.",
    },
    en: {
        title: "Did the result fit you?",
        hint: "1 — not at all, 5 — a perfect fit. Your answer helps improve the test.",
        comment: "What was off? (optional)",
        send: "Send",
        thanks: "Thank you! Your rating has been saved.",
    },
};

export default function QuizFeedback({ attemptId }) {
    const { i18n } = useTranslation();
    const text = TEXT[(i18n.language || "tj").slice(0, 2)] || TEXT.tj;
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);

    if (!attemptId) return null;

    const send = async () => {
        if (!rating || sending) return;
        setSending(true);
        try {
            await axios.post(`${API}/quiz/feedback`, { attemptId, rating, comment: comment.trim() || undefined });
        } catch {
            /* баҳо нарасид — корбарро озор намедиҳем */
        }
        setSent(true);
        setSending(false);
    };

    return (
        <section className="rounded-[2rem] border border-border bg-card p-6 sm:p-8" aria-live="polite">
            {sent ? (
                <p className="text-center font-bold text-foreground">{text.thanks}</p>
            ) : (
                <>
                    <h2 className="text-lg font-black text-foreground">{text.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{text.hint}</p>
                    <div className="mt-4 flex gap-2" role="radiogroup" aria-label={text.title}>
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
                    <button
                        type="button"
                        onClick={send}
                        disabled={!rating || sending}
                        className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {text.send}
                    </button>
                </>
            )}
        </section>
    );
}
