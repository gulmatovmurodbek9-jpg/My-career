import { useState } from "react";
import axios from "axios";
import { Loader2, MessageCircle, Send, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useAuthStore } from "../store/authStore";
import { API } from "../lib/config";

/**
 * Саволу ҷавоб дар бораи як ихтисоси мушаххас.
 *
 * Ба `/careers/:id/ask` муроҷиат мекунад, на ба чати умумӣ: он нуқта худи
 * сабти ихтисос ва нархҳои воқеии донишгоҳҳоро ба модел медиҳад, аз ин рӯ
 * ҷавоб аз маълумоти база меояд, на аз тахмини модел.
 */
export default function CareerChat({ careerId, careerName }) {
  const { t, i18n } = useTranslation();
  const { token } = useAuthStore();

  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(null);

  const SUGGESTIONS = [
    t("career_chat.q1", "Ин ихтисос ба ман мувофиқ аст?"),
    t("career_chat.q2", "Баъди хатм дар куҷо кор кардан мумкин аст?"),
    t("career_chat.q3", "Кадом донишгоҳро интихоб кунам?"),
    t("career_chat.q4", "Барои дохилшавӣ чӣ тайёрӣ лозим аст?"),
  ];

  async function ask(text) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    setPending(true);
    setError(null);
    setQuestion("");
    setTurns((prev) => [...prev, { role: "user", text: trimmed }]);

    try {
      const { data } = await axios.post(
        `${API}/careers/${careerId}/ask`,
        { question: trimmed, lang: i18n.language },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTurns((prev) => [...prev, { role: "ai", text: data.answer }]);
      if (typeof data.remainingToday === "number") setRemaining(data.remainingToday);
    } catch (err) {
      // Лимити рӯзона ва хатои шабака ду чизи гуногунанд ва бояд ҷудо гуфта шаванд.
      const status = err.response?.status;
      setError(
        status === 403
          ? err.response?.data?.message ||
              t("career_chat.limit", "Лимити имрӯзаи саволҳо тамом шуд. Фардо кӯшиш кунед.")
          : t("career_chat.failed", "Ҷавоб нагирифтем. Пас аз чанд сония дубора кӯшиш кунед."),
      );
      setTurns((prev) => prev.slice(0, -1));
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="glass-card p-6">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
          <MessageCircle className="h-5 w-5 text-primary" />
          {t("career_chat.title", "Саволе доред?")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t(
            "career_chat.login_hint",
            "Барои пурсидан дар бораи ин ихтисос ба ҳисоби худ ворид шавед.",
          )}
        </p>
        <Link to="/login" className="btn-primary mt-4 inline-flex px-6 py-2.5 text-sm">
          {t("nav.login", "Ворид шудан")}
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
        <MessageCircle className="h-5 w-5 text-primary" />
        {t("career_chat.title", "Саволе доред?")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("career_chat.subtitle", "Дар бораи ин ихтисос бипурсед")}
      </p>

      {turns.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => ask(suggestion)}
              disabled={pending}
              className="rounded-full border border-border px-3.5 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {turns.length > 0 && (
        <div className="mt-5 space-y-3">
          {turns.map((turn, i) => (
            <div key={i} className={turn.role === "user" ? "flex justify-end" : "flex gap-2.5"}>
              {turn.role === "ai" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={
                  turn.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-4 py-3 text-sm leading-6 text-foreground"
                }
              >
                {turn.text}
              </div>
              {turn.role === "user" && (
                <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {pending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("career_chat.thinking", "Фикр карда истодааст…")}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t("career_chat.placeholder", "Саволи худро нависед…")}
          aria-label={t("career_chat.title", "Саволе доред?")}
          className="focus-ring min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={pending || !question.trim()}
          className="btn-primary inline-flex shrink-0 items-center gap-2 px-5 py-3 text-sm disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{t("career_chat.send", "Фиристодан")}</span>
        </button>
      </form>

      {remaining !== null && (
        <p className="mt-2.5 text-sm text-muted-foreground">
          {t("career_chat.remaining", "Имрӯз боз {{count}} савол мондааст", { count: remaining })}
        </p>
      )}

      <p className="mt-3 text-sm text-muted-foreground">
        {t(
          "career_chat.disclaimer",
          "Ҷавобҳо аз маълумоти базаи мо сохта мешаванд. Барои қарори ниҳоӣ маълумоти расмии донишгоҳро тафтиш кунед.",
        )}
      </p>
    </div>
  );
}
