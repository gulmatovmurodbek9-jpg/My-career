import React from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

// Сиёсати махфият: истифодабарандагон асосан хонандагони ноболиғанд — бо забони содда,
// чӣ ҷамъ мешавад, ба кӣ меравад ва чӣ тавр нест кардан мумкин.
const CONTENT = {
    tj: {
        title: "Махфият ва маълумоти шумо",
        updated: "Навсозӣ: 03.10.2026",
        sections: [
            ["Мо чӣ нигоҳ медорем", "Ном ва почта (агар ба қайд гиред), ҷавобҳо ва натиҷаи санҷиш, ихтисосҳои захирашуда ва баҳои шумо ба натиҷа. Бе бақайдгирӣ ҷавобҳои санҷиш бе ном нигоҳ дошта мешаванд — танҳо барои беҳтар кардани тест."],
            ["Чӣ ба AI (Google Gemini) фиристода мешавад", "Танҳо матни савол ё ҷавобҳои санҷиш ва номи ихтисосҳо — бе ном, почта ва телефони шумо. Google ин маълумотро барои ҷавоб истифода мебарад."],
            ["Овоз", "Ҳангоми сӯҳбат бо ёвар садои шумо барои табдил ба матн ба ElevenLabs фиристода мешавад ва дар сайти мо нигоҳ дошта намешавад."],
            ["Ноболиғон", "Агар шумо аз 16 сол хурд бошед, пеш аз бақайдгирӣ бо падару модар ё омӯзгор маслиҳат кунед. Барои истифодаи санҷиш бақайдгирӣ ҳатмӣ нест."],
            ["Мо намекунем", "Маълумотро намефурӯшем, реклама нишон намедиҳем ва ба мактаб ё шахсони дигар намедиҳем."],
            ["Нест кардан", "Барои нест кардани ҳисоб ва ҳамаи маълумот ба почтаи лоиҳа нависед — дар 7 рӯз нест карда мешавад."],
        ],
    },
    ru: {
        title: "Конфиденциальность и ваши данные",
        updated: "Обновлено: 03.10.2026",
        sections: [
            ["Что мы храним", "Имя и почту (если вы зарегистрировались), ответы и результат теста, сохранённые специальности и вашу оценку результата. Без регистрации ответы теста хранятся без имени — только для улучшения теста."],
            ["Что отправляется AI (Google Gemini)", "Только текст вопроса или ответы теста и названия специальностей — без вашего имени, почты и телефона. Google использует эти данные для ответа."],
            ["Голос", "Во время разговора с помощником ваш голос отправляется в ElevenLabs для распознавания и на нашем сайте не хранится."],
            ["Несовершеннолетние", "Если вам меньше 16 лет, перед регистрацией посоветуйтесь с родителями или учителем. Для прохождения теста регистрация не нужна."],
            ["Чего мы не делаем", "Не продаём данные, не показываем рекламу и не передаём их школе или третьим лицам."],
            ["Удаление", "Чтобы удалить аккаунт и все данные, напишите на почту проекта — удалим в течение 7 дней."],
        ],
    },
    en: {
        title: "Privacy and your data",
        updated: "Updated: 03.10.2026",
        sections: [
            ["What we store", "Your name and email (if you register), your test answers and result, saved specialties and your rating of the result. Without registration, test answers are stored without a name — only to improve the test."],
            ["What is sent to AI (Google Gemini)", "Only the question text or test answers and specialty names — never your name, email or phone. Google uses this data to produce the answer."],
            ["Voice", "When you talk to the assistant, your voice is sent to ElevenLabs for speech recognition and is not stored on our site."],
            ["Minors", "If you are under 16, talk to a parent or teacher before registering. Registration is not needed to take the test."],
            ["What we do not do", "We do not sell data, show ads or pass it to schools or third parties."],
            ["Deletion", "To delete your account and all data, email the project — we delete it within 7 days."],
        ],
    },
};

export default function Privacy() {
    const { i18n } = useTranslation();
    const content = CONTENT[(i18n.language || "tj").slice(0, 2)] || CONTENT.tj;
    return (
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
            <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </span>
                <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{content.title}</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{content.updated}</p>
            <div className="mt-8 space-y-5">
                {content.sections.map(([title, body]) => (
                    <section key={title} className="rounded-2xl border border-border bg-card p-5">
                        <h2 className="font-bold text-foreground">{title}</h2>
                        <p className="mt-1.5 leading-relaxed text-muted-foreground">{body}</p>
                    </section>
                ))}
            </div>
        </div>
    );
}
