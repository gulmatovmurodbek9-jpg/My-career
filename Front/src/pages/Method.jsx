import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { IP_CREDIT } from "../lib/interestProfiler";

// Асоси илмӣ: аз куҷо будани ҳар қисм ва чӣ ҳанӯз тасдиқ нашудааст. Ҳамон матн дар барнома: mobile/lib/screens/method_screen.dart.
const CONTENT = {
    tj: {
        title: "Асоси илмӣ",
        test: "Тести шавқро супоред",
        sections: [
            ["Вазъи расмӣ", "Тестҳои ин сайт ҳоло аз ҷониби Вазорати маориф ё Маркази миллии тестӣ тасдиқ нашудаанд. Натиҷа маслиҳат аст, на қарор ё ташхис."],
            ["Тести асосӣ", "Саволҳоро дастаи мо сохтааст. Онҳо ба 5 кластери имтиҳонҳои Маркази миллии тестӣ вобастаанд."],
            ["Тести шавқ", "O*NET Interest Profiler Short Form: 60 кор ва 6 шавқи Холланд. Онро Вазорати меҳнати ИМА таҳия кардааст. Тарҷумаи тоҷикӣ ва русӣ аз они мост ва ҳанӯз дар Тоҷикистон санҷида нашудааст."],
            ["Балл ва ҷойҳо", "Маълумоти Маркази миллии тестӣ (stat.ntc.tj)."],
            ["Маош", "Маоши миёна аз рӯи маълумоти Агентии омор. Тақсим аз рӯи ихтисос тахминӣ аст."],
            ["AI", "Ҷавоби AI хато шуда метавонад. Қарори муҳимро бо омӯзгор, волидайн ё мутахассис муҳокима кунед."],
            ["Адабиёт", "Давлатзода С., Назирӣ Л., Миралиев А. Асосҳои интихоби касб. Душанбе: Маориф, 2017.\nМаркази миллии тестӣ. Тавсияҳои методӣ оид ба интихоби касб. Душанбе, 2013."],
        ],
    },
    ru: {
        title: "Научная основа",
        test: "Пройти тест интересов",
        sections: [
            ["Официальный статус", "Тесты этого сайта пока не утверждены Министерством образования или Национальным центром тестирования. Результат является советом, а не решением или диагнозом."],
            ["Основной тест", "Вопросы составлены нашей командой. Они связаны с 5 кластерами экзаменов Национального центра тестирования."],
            ["Тест интересов", "O*NET Interest Profiler Short Form: 60 занятий и 6 интересов по Холланду. Разработан Министерством труда США. Таджикский и русский переводы сделаны нами и ещё не проверялись в Таджикистане."],
            ["Баллы и места", "Данные Национального центра тестирования (stat.ntc.tj)."],
            ["Зарплаты", "Средняя зарплата по данным Агентства по статистике. Разбивка по специальностям является оценкой."],
            ["AI", "AI может ошибаться. Важные решения обсуждайте с учителем, родителями или специалистом."],
            ["Литература", "Давлатзода С., Назири Л., Миралиев А. Основы выбора профессии. Душанбе: Маориф, 2017.\nНациональный центр тестирования. Методические рекомендации по выбору профессии. Душанбе, 2013."],
        ],
    },
    en: {
        title: "Scientific basis",
        test: "Take the interest test",
        sections: [
            ["Official status", "The tests on this site are not yet approved by the Ministry of Education or the National Testing Center. A result is advice, not a decision or a diagnosis."],
            ["Main test", "The questions were written by our team. They are linked to the 5 clusters of the National Testing Center exams."],
            ["Interest test", "O*NET Interest Profiler Short Form: 60 activities and 6 Holland interests, developed by the U.S. Department of Labor. The Tajik and Russian translations are ours and have not yet been tested in Tajikistan."],
            ["Scores and places", "National Testing Center data (stat.ntc.tj)."],
            ["Salaries", "Average salary from the Statistics Agency. The breakdown by specialty is an estimate."],
            ["AI", "AI can make mistakes. Discuss important decisions with a teacher, parents or a specialist."],
            ["Literature", "Davlatzoda S., Naziri L., Miraliev A. Fundamentals of Choosing a Profession. Dushanbe: Maorif, 2017.\nNational Testing Center. Methodological recommendations on choosing a profession. Dushanbe, 2013."],
        ],
    },
};

const Method = () => {
    const { i18n } = useTranslation();
    const c = CONTENT[i18n.language?.slice(0, 2)] || CONTENT.tj;
    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="mb-6 text-3xl font-bold text-foreground">{c.title}</h1>
            {c.sections.map(([head, body]) => (
                <section key={head} className="mb-6">
                    <h2 className="mb-1 text-lg font-bold text-foreground">{head}</h2>
                    <p className="whitespace-pre-line leading-relaxed text-foreground">{body}</p>
                </section>
            ))}
            <Link to="/interest-test" className="inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">{c.test}</Link>
            <p className="mt-8 text-xs leading-relaxed text-muted-foreground">{IP_CREDIT}</p>
        </div>
    );
};

export default Method;
