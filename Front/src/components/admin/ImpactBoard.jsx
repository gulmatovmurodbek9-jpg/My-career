import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Maximize2, Minimize2, RefreshCw, TrendingUp } from "lucide-react";
import { API } from "../../lib/config";
import { useAuthStore } from "../../store/authStore";

// «Лавҳаи таъсир» барои ҳимоя: на «сайт чӣ дорад», балки «ба хонандагон чӣ дод» —
// боварӣ пеш → баъд, чанд нафар фаҳмиданд, ки касб ба онҳо мувофиқ нест, ва ғ.
// big — реҷаи намоиш дар проектор (/admin/impact).
const TEXT = {
    tj: {
        title: "Таъсир ба хонандагон",
        subtitle: "Рақамҳои воқеӣ аз сайт, бе корбарони намоишӣ",
        show: "Намоиш барои журӣ",
        fullscreen: "Экрани пурра",
        exitFullscreen: "Баромадан",
        refresh: "Нав кардан",
        confTitle: "Боварӣ ба интихоби касб",
        confHint: "Пеш ва баъди «Худро дар касб санҷед» (аз 5), {{n}} санҷиш",
        before: "пеш",
        after: "баъд",
        up: "боварӣ зиёд шуд",
        notForMe: "фаҳмиданд, ки ин касб ба онҳо мувофиқ нест",
        notForMeHint: "пеш аз 4 соли таҳсил ва пулро сарф кардан",
        fit: "дарёфтанд, ки касб ба онҳо мувофиқ аст",
        trials: "санҷиши касб",
        careers: "ихтисоси гуногун санҷида шуд",
        quizFinished: "тестро тамом карданд",
        completion: "аз оғозкардагон тамом карданд",
        clear: "самти равшан гирифтанд",
        satisfied: "аз натиҷаи тест розӣ (баҳои 4–5)",
        users: "корбари бақайдгирифта",
        saved: "ихтисос захира карданд",
        plans: "нақшаи ҳуҷҷатсупорӣ сохтанд",
        classrooms: "синф дар сайт",
        classMembers: "хонанда дар синфҳо",
        teachers: "омӯзгор",
        activity: "14 рӯзи охир",
        quiz: "Тест",
        trial: "Санҷиши касб",
        empty: "Ҳанӯз маълумот нест — баъди пилот рақамҳо пайдо мешаванд.",
        updated: "Нав шуд: {{time}}",
    },
    ru: {
        title: "Влияние на учеников",
        subtitle: "Реальные данные сайта, без демо-пользователей",
        show: "Показ для жюри",
        fullscreen: "Во весь экран",
        exitFullscreen: "Выйти",
        refresh: "Обновить",
        confTitle: "Уверенность в выборе профессии",
        confHint: "До и после «Попробуйте себя в профессии» (из 5), {{n}} попыток",
        before: "до",
        after: "после",
        up: "уверенность выросла",
        notForMe: "поняли, что эта профессия им не подходит",
        notForMeHint: "до 4 лет учёбы и затрат",
        fit: "убедились, что профессия им подходит",
        trials: "попыток профессии",
        careers: "разных специальностей попробовано",
        quizFinished: "прошли тест",
        completion: "начавших дошли до конца",
        clear: "получили чёткое направление",
        satisfied: "довольны результатом теста (оценка 4–5)",
        users: "зарегистрированных",
        saved: "специальностей сохранено",
        plans: "составили план подачи документов",
        classrooms: "классов на сайте",
        classMembers: "учеников в классах",
        teachers: "учителей",
        activity: "Последние 14 дней",
        quiz: "Тест",
        trial: "Проба профессии",
        empty: "Данных пока нет — цифры появятся после пилота.",
        updated: "Обновлено: {{time}}",
    },
    en: {
        title: "Impact on students",
        subtitle: "Real site data, demo users excluded",
        show: "Show to the jury",
        fullscreen: "Full screen",
        exitFullscreen: "Exit",
        refresh: "Refresh",
        confTitle: "Confidence in the career choice",
        confHint: "Before and after “Try yourself in a career” (of 5), {{n}} tries",
        before: "before",
        after: "after",
        up: "became more confident",
        notForMe: "learned this career does not suit them",
        notForMeHint: "before 4 years of study and money",
        fit: "confirmed the career suits them",
        trials: "career tries",
        careers: "different specialties tried",
        quizFinished: "finished the test",
        completion: "of those who started finished",
        clear: "got a clear direction",
        satisfied: "satisfied with the test result (4–5)",
        users: "registered users",
        saved: "specialties saved",
        plans: "made an application plan",
        classrooms: "classes on the site",
        classMembers: "students in classes",
        teachers: "teachers",
        activity: "Last 14 days",
        quiz: "Test",
        trial: "Career try",
        empty: "No data yet — numbers will appear after the pilot.",
        updated: "Updated: {{time}}",
    },
};
const fill = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");
const show = (value, suffix = "") => (value === null || value === undefined ? "—" : `${value}${suffix}`);

function Metric({ value, label, hint, tone = "text-foreground", big }) {
    return (
        <div className="min-w-0 rounded-2xl border border-border bg-card p-4">
            <div className={`font-black tabular-nums leading-none ${tone} ${big ? "text-4xl sm:text-5xl" : "text-3xl"}`}>{value}</div>
            <div className={`mt-2 font-semibold text-foreground ${big ? "text-lg" : "text-[14px]"}`}>{label}</div>
            {hint && <div className="mt-0.5 text-[13px] text-muted-foreground">{hint}</div>}
        </div>
    );
}

function Activity({ days, text, big }) {
    const max = Math.max(1, ...days.map((day) => day.quiz + day.trials));
    return (
        <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-foreground">{text.activity}</div>
                <div className="flex gap-3 text-[12px] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />{text.quiz}</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />{text.trial}</span>
                </div>
            </div>
            <div className={`mt-3 flex items-end gap-1 ${big ? "h-40" : "h-24"}`} role="img" aria-label={text.activity}>
                {days.map((day) => (
                    <div key={day.date} className="flex h-full flex-1 flex-col justify-end gap-px" title={`${day.date}: ${day.quiz} + ${day.trials}`}>
                        <div className="w-full rounded-t-sm bg-emerald-500" style={{ height: `${(day.trials / max) * 100}%` }} />
                        <div className="w-full bg-primary" style={{ height: `${(day.quiz / max) * 100}%` }} />
                    </div>
                ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{days[0]?.date.slice(5).split("-").reverse().join(".")}</span>
                <span>{days[days.length - 1]?.date.slice(5).split("-").reverse().join(".")}</span>
            </div>
        </div>
    );
}

export default function ImpactBoard({ big = false }) {
    const { i18n } = useTranslation();
    const text = TEXT[(i18n.language || "tj").slice(0, 2)] || TEXT.tj;
    const token = useAuthStore((state) => state.token);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    const load = () => {
        if (!token) return;
        setLoading(true);
        axios.get(`${API}/impact`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => setData(res.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    };
    useEffect(load, [token]);

    useEffect(() => {
        const sync = () => setFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", sync);
        return () => document.removeEventListener("fullscreenchange", sync);
    }, []);
    const toggleFullscreen = () => {
        try {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
        } catch {
            /* браузер иҷозат намедиҳад */
        }
    };

    if (!data) return null;
    const { quiz, trials, users } = data;
    const conf = trials.confidence;
    const hasConf = conf.count > 0 && conf.before !== null;

    return (
        <section className={`rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-card ${big ? "p-6 sm:p-10" : "p-5 sm:p-6"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><TrendingUp className="h-6 w-6" aria-hidden /></span>
                    <div>
                        <h2 className={`font-black text-foreground ${big ? "text-3xl sm:text-4xl" : "text-xl"}`}>{text.title}</h2>
                        <p className="text-[13px] text-muted-foreground">{text.subtitle}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-bold text-foreground hover:border-primary cursor-pointer">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden /> {text.refresh}
                    </button>
                    {big ? (
                        <button type="button" onClick={toggleFullscreen} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[13px] font-bold text-primary-foreground cursor-pointer">
                            {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
                            {fullscreen ? text.exitFullscreen : text.fullscreen}
                        </button>
                    ) : (
                        <Link to="/admin/impact" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[13px] font-bold text-primary-foreground">
                            {text.show} <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                    )}
                </div>
            </div>

            {!quiz.finished && !trials.count ? (
                <p className="mt-6 text-muted-foreground">{text.empty}</p>
            ) : (
                <div className="mt-6 space-y-4">
                    {/* Асосӣ: боварӣ пеш → баъд ва «фаҳмиданд, ки мувофиқ нест». */}
                    <div className="grid min-w-0 gap-4 lg:grid-cols-[1.4fr_1fr]">
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="font-bold text-foreground">{text.confTitle}</div>
                            <div className="text-[13px] text-muted-foreground">{fill(text.confHint, { n: conf.count })}</div>
                            {hasConf ? (
                                <>
                                    <div className={`mt-4 flex items-end gap-4 font-black tabular-nums ${big ? "text-6xl sm:text-7xl" : "text-5xl"}`}>
                                        <span className="text-muted-foreground">{conf.before}</span>
                                        <ArrowRight className={`${big ? "mb-4 h-10 w-10" : "mb-2 h-7 w-7"} text-primary`} aria-hidden />
                                        <span className="text-primary">{conf.after}</span>
                                    </div>
                                    <div className="mt-2 flex gap-6 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        <span>{text.before}</span><span>{text.after}</span>
                                    </div>
                                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${conf.upShare || 0}%` }} />
                                    </div>
                                    <div className="mt-1.5 text-[14px] font-semibold text-foreground">{show(conf.upShare, "%")} {text.up}</div>
                                </>
                            ) : <div className="mt-4 text-4xl font-black text-muted-foreground">—</div>}
                        </div>
                        <div className="grid gap-4">
                            <Metric big={big} value={show(trials.fitShare, "%")} label={text.fit} tone="text-emerald-600 dark:text-emerald-400" />
                            <Metric big={big} value={show(trials.notForMeShare, "%")} label={text.notForMe} hint={text.notForMeHint} tone="text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
                        <Metric big={big} value={show(quiz.finished)} label={text.quizFinished} />
                        <Metric big={big} value={show(quiz.completion, "%")} label={text.completion} />
                        <Metric big={big} value={show(trials.count)} label={text.trials} />
                        <Metric big={big} value={show(trials.careers)} label={text.careers} />
                        <Metric big={big} value={show(quiz.clearShare, "%")} label={text.clear} />
                        <Metric big={big} value={show(quiz.satisfiedShare, "%")} label={text.satisfied} />
                        <Metric big={big} value={show(users.saved)} label={text.saved} />
                        <Metric big={big} value={show(users.withPlan)} label={text.plans} />
                        {data.classes?.classrooms > 0 && (
                            <>
                                <Metric big={big} value={show(data.classes.classrooms)} label={text.classrooms} />
                                <Metric big={big} value={show(data.classes.members)} label={text.classMembers} />
                                <Metric big={big} value={show(data.classes.teachers)} label={text.teachers} />
                            </>
                        )}
                    </div>

                    <Activity days={data.activity} text={text} big={big} />
                    <p className="text-right text-[12px] text-muted-foreground">
                        {fill(text.updated, { time: new Date(data.generatedAt).toLocaleString() })} · {users.registered} {text.users}
                    </p>
                </div>
            )}
        </section>
    );
}
