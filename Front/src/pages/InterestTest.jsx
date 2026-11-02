import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { IP_ITEMS, IP_TYPES } from "../lib/interestProfiler";

const PER_PAGE = 6;
const TEXT = {
    tj: { title: "Тести шавқ", ask: "Кадом корҳоро кардан мехоҳед?", hint: "Ба таҳсил ва маош нигоҳ накунед. Ҳар чанд кор, ки хоҳед, қайд кунед.", back: "Қафо", next: "Давом", result: "Натиҷа", main: "Шавқҳои асосии шумо", tied: "Баъзе шавқҳо холи баробар доранд. Худатон бинед, ки кадомаш ба шумо наздиктар аст.", note: "Ин натиҷа шавқи шуморо нишон медиҳад, на қобилият ё ихтисоси ниҳоиро. Барои пайдо кардани ихтисосҳо тести асосиро супоред.", again: "Аз нав", from: "Ин тест аз куҷост?", none: "Ягон кор қайд нашуд." },
    ru: { title: "Тест интересов", ask: "Чем бы вы хотели заниматься?", hint: "Не думайте об обучении и зарплате. Отметьте сколько угодно.", back: "Назад", next: "Далее", result: "Результат", main: "Ваши главные интересы", tied: "У некоторых интересов равные баллы. Решите сами, какой вам ближе.", note: "Результат показывает ваши интересы, а не способности или окончательную специальность. Чтобы подобрать специальности, пройдите основной тест.", again: "Заново", from: "Откуда этот тест?", none: "Ничего не отмечено." },
    en: { title: "Interest test", ask: "Which activities would you like to do?", hint: "Do not think about education or pay. Tick as many as you like.", back: "Back", next: "Next", result: "Result", main: "Your main interests", tied: "Some interests are tied. Decide which one fits you better.", note: "This shows your interests, not your ability or a final specialty. Take the main test to find specialties.", again: "Start over", from: "Where is this test from?", none: "Nothing was ticked." },
};

// Тести шавқ (O*NET): ҳисоб дар браузер; чизе ба сервер фиристода намешавад.
const InterestTest = () => {
    const { i18n } = useTranslation();
    const lang = TEXT[i18n.language?.slice(0, 2)] ? i18n.language.slice(0, 2) : "tj";
    const x = TEXT[lang];
    const [checked, setChecked] = useState(() => new Set());
    const [page, setPage] = useState(0);
    const [done, setDone] = useState(false);
    const pages = IP_ITEMS.length / PER_PAGE;

    const ranked = useMemo(() => {
        const scores = Object.fromEntries(Object.keys(IP_TYPES).map((k) => [k, 0]));
        checked.forEach((i) => { scores[IP_ITEMS[i].type] += 1; });
        return Object.entries(scores).sort((a, b) => b[1] - a[1]);
    }, [checked]);

    const toggle = (i) => setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i); else next.add(i);
        return next;
    });
    const restart = () => { setChecked(new Set()); setPage(0); setDone(false); };
    const btn = "rounded-xl px-5 py-3 font-semibold";

    if (done) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-10">
                <h1 className="mb-6 text-3xl font-bold text-foreground">{checked.size ? x.main : x.none}</h1>
                {checked.size > 0 && ranked.map(([key, score], index) => (
                    <div key={key} className="mb-4">
                        <div className="flex justify-between text-foreground">
                            <span className={index < 3 && score > 0 ? "font-bold" : ""}>{IP_TYPES[key][lang]}</span>
                            <span className="font-bold">{score}/10</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-muted">
                            <div className={`h-2 rounded-full bg-primary ${index < 3 ? "" : "opacity-40"}`} style={{ width: `${score * 10}%` }} />
                        </div>
                        {index < 3 && score > 0 && <p className="mt-1 text-sm text-muted-foreground">{IP_TYPES[key][`${lang}Desc`]}</p>}
                    </div>
                ))}
                {checked.size > 0 && ranked[2][1] === ranked[3][1] && ranked[2][1] > 0 && <p className="text-sm text-muted-foreground">{x.tied}</p>}
                {checked.size > 0 && <p className="mt-4 leading-relaxed text-foreground">{x.note}</p>}
                <div className="mt-6 flex flex-wrap items-center gap-4">
                    <button type="button" onClick={restart} className={`${btn} bg-primary text-primary-foreground`}>{x.again}</button>
                    <Link to="/method" className="font-semibold text-primary">{x.from}</Link>
                </div>
            </div>
        );
    }

    const start = page * PER_PAGE;
    return (
        <div className="mx-auto max-w-2xl px-4 py-10">
            <div className="mb-6 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${((page + 1) / pages) * 100}%` }} /></div>
            <h1 className="text-2xl font-bold text-foreground">{x.ask}</h1>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">{x.hint}</p>
            {IP_ITEMS.slice(start, start + PER_PAGE).map((item, offset) => {
                const i = start + offset;
                return (
                    <label key={item.en} className={`mb-2 flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-foreground ${checked.has(i) ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                        <input type="checkbox" className="h-5 w-5 shrink-0" checked={checked.has(i)} onChange={() => toggle(i)} />
                        <span>{item[lang]}</span>
                    </label>
                );
            })}
            <div className="mt-4 flex gap-3">
                {page > 0 && <button type="button" onClick={() => setPage(page - 1)} className={`${btn} border border-border text-foreground`}>{x.back}</button>}
                <button type="button" onClick={() => (page < pages - 1 ? setPage(page + 1) : setDone(true))} className={`${btn} flex-1 bg-primary text-primary-foreground`}>
                    {page < pages - 1 ? `${x.next} (${page + 1}/${pages})` : x.result}
                </button>
            </div>
        </div>
    );
};

export default InterestTest;
