import React from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

// Сиёсати махфият: истифодабарандагон асосан хонандагони ноболиғанд — бо забони содда,
// чӣ ҷамъ мешавад, ба кӣ меравад ва чӣ тавр нест кардан мумкин.
const EMAIL = "gulmatovmurodbek9@gmail.com";

const CONTENT = {
    tj: {
        title: "Махфият ва маълумоти шумо",
        updated: "Навсозӣ: 03.10.2026",
        sections: [
            ["Мо чӣ нигоҳ медорем", "Агар ба қайд гиред: ном, почта, натиҷаи тест, ихтисосҳои захирашуда ва писандидашуда, нақшаи ҳуҷҷатсупорӣ ва таърихи сӯҳбат бо AI (100 саволи охир). Ҳар супориши тест (ҷавобҳо, синф, баҳои шумо ба натиҷа) барои беҳтар кардани тест нигоҳ дошта мешавад — бо рамзи корбар, агар ворид шуда бошед, ё бе он."],
            ["Чӣ ба AI (Google Gemini / Vertex AI) фиристода мешавад", "Матни саволи шумо; дар чати AI ва ҳисобот инчунин натиҷаи тест, ихтисосҳои захирашуда ва писандидашуда. Ном, почта, телефон ва координатаҳои шумо фиристода намешаванд (агар ҷойгиршавиро иҷозат диҳед, дар сервер танҳо масофа то донишгоҳҳо ҳисоб мешавад). Google маълумотро тибқи шартҳои худ коркард мекунад."],
            ["Овоз", "Ҳангоми сӯҳбат бо ёвар садои шумо барои табдил ба матн ба ElevenLabs (ИМА) фиристода мешавад. Мо садоро нигоҳ намедорем; ElevenLabs онро тибқи шартҳои худ коркард мекунад. Агар нахоҳед — бо клавиатура нависед."],
            ["Мӯҳлати нигоҳдорӣ", "Супоришҳои тест 12 моҳ нигоҳ дошта мешаванд ва баъд худкор нест мешаванд. Ҳисоб ва таърихи сӯҳбат то он вақте ки шумо нест кардани онро напурсед."],
            ["Ноболиғон", "Сайт барои хонандагон аст. Тест бе бақайдгирӣ кор мекунад. Агар шумо аз 16 сол хурд бошед, ҳисобро бо розигии падару модар ё омӯзгор созед; волидон метавонанд нест кардани маълумоти фарзандро бипурсанд."],
            ["Мо намекунем", "Маълумотро намефурӯшем, реклама нишон намедиҳем ва ба мактаб ё шахсони дигар намедиҳем."],
            ["Нест кардан ва савол", "Барои нест кардани ҳисоб ва ҳамаи маълумот ё ҳар савол дар бораи махфият ба " + EMAIL + " нависед — дар 7 рӯз ҷавоб медиҳем."],
        ],
    },
    ru: {
        title: "Конфиденциальность и ваши данные",
        updated: "Обновлено: 03.10.2026",
        sections: [
            ["Что мы храним", "Если вы зарегистрировались: имя, почту, результат теста, сохранённые и понравившиеся специальности, план подачи документов и историю чата с AI (последние 100 вопросов). Каждое прохождение теста (ответы, класс, ваша оценка результата) хранится для улучшения теста — с идентификатором пользователя, если вы вошли, или без него."],
            ["Что отправляется AI (Google Gemini / Vertex AI)", "Текст вашего вопроса; в AI-чате и отчёте также результат теста, сохранённые и понравившиеся специальности. Имя, почта, телефон и ваши координаты не отправляются (если вы разрешите геолокацию, на сервере считается только расстояние до вузов). Google обрабатывает данные по своим условиям."],
            ["Голос", "Во время разговора с помощником ваш голос отправляется в ElevenLabs (США) для распознавания. Мы голос не храним; ElevenLabs обрабатывает его по своим условиям. Если не хотите — пишите с клавиатуры."],
            ["Срок хранения", "Прохождения теста хранятся 12 месяцев и затем удаляются автоматически. Аккаунт и история чата — пока вы не попросите их удалить."],
            ["Несовершеннолетние", "Сайт создан для школьников. Тест работает без регистрации. Если вам меньше 16 лет, создавайте аккаунт с согласия родителей или учителя; родители могут попросить удалить данные ребёнка."],
            ["Чего мы не делаем", "Не продаём данные, не показываем рекламу и не передаём их школе или третьим лицам."],
            ["Удаление и вопросы", "Чтобы удалить аккаунт и все данные или задать вопрос о конфиденциальности, напишите на " + EMAIL + " — ответим в течение 7 дней."],
        ],
    },
    en: {
        title: "Privacy and your data",
        updated: "Updated: 03.10.2026",
        sections: [
            ["What we store", "If you register: your name, email, test result, saved and liked specialties, application plan and AI chat history (last 100 questions). Every test attempt (answers, grade, your rating of the result) is stored to improve the test — with your user ID if you are signed in, or without it."],
            ["What is sent to AI (Google Gemini / Vertex AI)", "The text of your question; in the AI chat and report also your test result and saved and liked specialties. Your name, email, phone and coordinates are never sent (if you allow location, only the distance to universities is computed on our server). Google processes the data under its own terms."],
            ["Voice", "When you talk to the assistant, your voice is sent to ElevenLabs (USA) for speech recognition. We do not store it; ElevenLabs processes it under its own terms. If you prefer, type instead."],
            ["Retention", "Test attempts are kept for 12 months and then deleted automatically. Your account and chat history are kept until you ask us to delete them."],
            ["Minors", "The site is for school students. The test works without registration. If you are under 16, create an account with a parent's or teacher's consent; parents can ask us to delete their child's data."],
            ["What we do not do", "We do not sell data, show ads or pass it to schools or third parties."],
            ["Deletion and questions", "To delete your account and all data, or with any privacy question, email " + EMAIL + " — we reply within 7 days."],
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
