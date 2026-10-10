// «Волидайн ҳам бигӯянд»: 9 савол дар бораи он чӣ волид дар фарзанд мебинад (ҳар вариант = як
// самти ММТ: c1 техникӣ, c2 иқтисод, c3 филология/санъат, c4 ҷомеа/ҳуқуқ, c5 тиб/биология/варзиш)
// ва 1 савол дар бораи хоҳиши худи волид (алоҳида нишон дода мешавад).
export const PARENT_QUESTIONS = [
    {
        tj: { q: "Дар вақти холӣ фарзандатон бештар чӣ кор мекунад?", o: ["Чизҳоро месозад, таъмир мекунад ё бо компютер кор мекунад", "Ҳисоб мекунад, савдо мекунад ё пул ҷамъ мекунад", "Китоб мехонад, расм мекашад ё менависад", "Бо дӯстон баҳс мекунад ва хабарҳоро пайгирӣ мекунад", "Варзиш мекунад ё ба ҳайвонот ва растаниҳо машғул аст"] },
        ru: { q: "Чем ваш ребёнок чаще всего занимается в свободное время?", o: ["Мастерит, чинит или сидит за компьютером", "Считает, торгует или копит деньги", "Читает, рисует или пишет", "Спорит с друзьями и следит за новостями", "Занимается спортом, животными или растениями"] },
        en: { q: "What does your child do most in free time?", o: ["Builds, fixes things or works on a computer", "Counts, trades or saves money", "Reads, draws or writes", "Debates with friends and follows the news", "Plays sport or cares for animals and plants"] },
    },
    {
        tj: { q: "Кадом фанҳо ба ӯ осонтар медиҳанд?", o: ["Математика, физика, информатика", "География, иқтисод", "Забонҳо ва адабиёт", "Таърих, ҳуқуқ, ҷамъиятшиносӣ", "Биология, химия, тарбияи ҷисмонӣ"] },
        ru: { q: "Какие предметы ему (ей) даются легче?", o: ["Математика, физика, информатика", "География, экономика", "Языки и литература", "История, право, обществознание", "Биология, химия, физкультура"] },
        en: { q: "Which subjects come easier to them?", o: ["Maths, physics, computer science", "Geography, economics", "Languages and literature", "History, law, social studies", "Biology, chemistry, PE"] },
    },
    {
        tj: { q: "Агар дар хона чизе вайрон шавад, ӯ…", o: ["Худаш мекушояд ва мефаҳмад, ки чаро вайрон шуд", "Ҳисоб мекунад, ки нав харидан арзонтар аст ё таъмир", "Барои ҳама мефаҳмонад, ки чӣ шуд", "Ба ҳама кор тақсим мекунад ва роҳбарӣ мекунад", "Аввал месанҷад, ки касе зарар надидааст"] },
        ru: { q: "Если дома что-то сломалось, он (она)…", o: ["Сам разбирает и выясняет причину", "Считает, что дешевле — купить новое или чинить", "Всем объясняет, что случилось", "Распределяет дела и руководит", "Сначала проверяет, не пострадал ли кто-то"] },
        en: { q: "If something breaks at home, they…", o: ["Take it apart and find out why", "Work out whether buying new or repairing is cheaper", "Explain to everyone what happened", "Share out the jobs and take charge", "First check that nobody got hurt"] },
    },
    {
        tj: { q: "Ӯ бо одамон чӣ гуна аст?", o: ["Бештар танҳо ё бо як-ду дӯсти наздик кор мекунад", "Хуб гап мезанад ва савдо карда метавонад", "Хуб мефаҳмонад ва ба хурдсолон ёрӣ медиҳад", "Ҳақро ҳимоя мекунад ва баҳсро дӯст медорад", "Ба касе, ки бемор ё ғамгин аст, ғамхорӣ мекунад"] },
        ru: { q: "Какой он (она) с людьми?", o: ["Чаще один или с парой близких друзей", "Хорошо говорит и умеет договариваться", "Хорошо объясняет и помогает младшим", "Отстаивает справедливость, любит спорить", "Заботится о тех, кто болеет или грустит"] },
        en: { q: "How are they with people?", o: ["Mostly alone or with one or two close friends", "Talk well and can make deals", "Explain well and help younger children", "Stand up for fairness and enjoy debating", "Care for anyone who is ill or sad"] },
    },
    {
        tj: { q: "Дар оила ба ӯ кадом корро бештар бовар мекунед?", o: ["Насби телефон, телевизор, интернет", "Харид ва ҳисоби пул", "Навиштани табрик ё ёрӣ дар дарсҳои хурдсолон", "Ҳалли баҳс ё гап задан бо ҳамсояҳо", "Нигоҳубини бемор ё ҳайвонот"] },
        ru: { q: "Какое дело в семье вы чаще доверяете ему (ей)?", o: ["Настроить телефон, телевизор, интернет", "Покупки и учёт денег", "Написать поздравление или помочь младшим с уроками", "Уладить спор или поговорить с соседями", "Ухаживать за больным или за животными"] },
        en: { q: "Which family job do you trust them with most?", o: ["Setting up the phone, TV or internet", "Shopping and keeping track of money", "Writing greetings or helping younger ones with homework", "Settling an argument or talking to neighbours", "Looking after someone ill or the animals"] },
    },
    {
        tj: { q: "Вақте мушкил пайдо мешавад, ӯ…", o: ["Қадам ба қадам мантиқан ҳал мекунад", "Фоида ва зарарро ҳисоб мекунад", "Роҳи ғайриоддӣ ва эҷодӣ меёбад", "Бо дигарон гап мезанад ва онҳоро бовар мекунонад", "Ором мемонад ва ба дигарон ёрӣ медиҳад"] },
        ru: { q: "Когда возникает проблема, он (она)…", o: ["Решает логично, шаг за шагом", "Считает плюсы и минусы", "Находит необычный, творческий путь", "Говорит с людьми и убеждает их", "Сохраняет спокойствие и помогает другим"] },
        en: { q: "When a problem comes up, they…", o: ["Solve it logically, step by step", "Weigh the gains and losses", "Find an unusual, creative way", "Talk to people and persuade them", "Stay calm and help others"] },
    },
    {
        tj: { q: "Ӯ кадом мавзӯъҳоро бештар мепурсад ё тамошо мекунад?", o: ["Техника, мошинҳо, бозиҳои компютерӣ", "Тиҷорат, нархҳо, одамони бой", "Китобҳо, филмҳо, мусиқӣ, забонҳо", "Сиёсат, қонун, адолат", "Бадан, саломатӣ, табиат, варзиш"] },
        ru: { q: "О чём он (она) чаще всего спрашивает или смотрит?", o: ["Техника, машины, компьютерные игры", "Бизнес, цены, успешные люди", "Книги, фильмы, музыка, языки", "Политика, законы, справедливость", "Тело, здоровье, природа, спорт"] },
        en: { q: "What topics do they ask about or watch most?", o: ["Technology, cars, video games", "Business, prices, successful people", "Books, films, music, languages", "Politics, law, justice", "The body, health, nature, sport"] },
    },
    {
        tj: { q: "Кадом муҳити кор ба табиати ӯ мувофиқ аст?", o: ["Устохона, лаборатория ё компютер", "Идора бо рақамҳо ва ҳуҷҷатҳо", "Синф, студия ё саҳна", "Суд, идораи давлатӣ ё хабарнигорӣ", "Беморхона, толори варзиш ё саҳро"] },
        ru: { q: "Какая рабочая среда подходит его (её) характеру?", o: ["Мастерская, лаборатория или компьютер", "Офис с цифрами и документами", "Класс, студия или сцена", "Суд, госучреждение или журналистика", "Больница, спортзал или поле"] },
        en: { q: "Which workplace fits their nature?", o: ["A workshop, lab or computer", "An office with numbers and papers", "A classroom, studio or stage", "A court, government office or newsroom", "A hospital, gym or the outdoors"] },
    },
    {
        tj: { q: "Шумо ӯро баъд аз 10 сол чӣ гуна мебинед?", o: ["Муҳандис ё барномасоз", "Иқтисодчӣ ё соҳибкор", "Омӯзгор, тарҷумон ё рассом", "Ҳуқуқшинос ё корманди давлатӣ", "Табиб ё мураббӣ"] },
        ru: { q: "Каким вы видите его (её) через 10 лет?", o: ["Инженер или программист", "Экономист или предприниматель", "Учитель, переводчик или художник", "Юрист или госслужащий", "Врач или тренер"] },
        en: { q: "How do you see them in 10 years?", o: ["An engineer or programmer", "An economist or business owner", "A teacher, translator or artist", "A lawyer or civil servant", "A doctor or coach"] },
    },
];

export const PARENT_WISH = {
    tj: { q: "Ва хоҳиши худи шумо: шумо фарзандатонро дар кадом самт бештар дидан мехоҳед?", o: ["Техника ва технология", "Иқтисод ва тиҷорат", "Таълим, забонҳо, санъат", "Ҳуқуқ ва хизмати давлатӣ", "Тиб ва варзиш"] },
    ru: { q: "И ваше собственное желание: в каком направлении вы больше хотите видеть ребёнка?", o: ["Техника и технологии", "Экономика и бизнес", "Образование, языки, искусство", "Право и госслужба", "Медицина и спорт"] },
    en: { q: "And your own wish: which direction would you most like for your child?", o: ["Engineering and technology", "Economics and business", "Teaching, languages, arts", "Law and public service", "Medicine and sport"] },
};

export const CLUSTER_KEYS = ["c1", "c2", "c3", "c4", "c5"];

export const PARENT_TEXT = {
    tj: {
        inviteTitle: "Волидайн чӣ фикр доранд?",
        inviteText: "Пайвандро ба падар ё модар фиристед. Онҳо бе бақайдгирӣ ба 10 саволи кӯтоҳ дар бораи шумо ҷавоб медиҳанд (2 дақиқа). Баъд мебинед, ки фикри онҳо бо натиҷаи тести шумо дар куҷо мувофиқ аст ва дар куҷо фарқ дорад.",
        childName: "Номи шумо (то волидайн донанд, ки аз кист)",
        create: "Пайванд барои волидайн",
        send: "Фиристодан",
        copy: "Нусха",
        copied: "Нусха шуд",
        waiting: "Интизори ҷавоби волидайн…",
        refresh: "Санҷидан",
        shareText: "{{name}} аз шумо мепурсад: «Ман кадом касбро интихоб кунам?» Ба 10 саволи кӯтоҳ дар бораи ман ҷавоб диҳед (2 дақиқа):",
        newLink: "Пайванди нав",
        // Волид
        askTitle: "{{name}} аз шумо маслиҳат мепурсад",
        askTitleNoName: "Фарзандатон аз шумо маслиҳат мепурсад",
        askText: "Фарзандатон тести касбинтихобкуниро гузашт. Ҳоло фикри шумо муҳим аст: ба 10 саволи кӯтоҳ ҷавоб диҳед — он чиро, ки дар ӯ мебинед. Ҷавоби дуруст ё нодуруст нест. Бақайдгирӣ лозим нест.",
        relation: "Шумо кӣ ҳастед?",
        relations: { father: "Падар", mother: "Модар", other: "Хешованд" },
        start: "Оғоз",
        question: "Саволи {{n}} аз {{t}}",
        wishLabel: "Хоҳиши шумо",
        back: "Бозгашт",
        notFound: "Пайванд ёфт нашуд ё мӯҳлаташ гузаштааст.",
        // Муқоиса
        compareTitle: "Фарзанд ва волидайн: муқоиса",
        child: "Тести фарзанд",
        parent: "Фикри волидайн",
        agreement: "Мувофиқат",
        same: "Шумо ҳамфикр ҳастед: самти асосӣ ҳам дар тест ва ҳам ба назари волидайн — «{{a}}».",
        differ: "Самти асосӣ фарқ дорад: тест — «{{a}}», волидайн — «{{b}}». Ин муҳим аст: якҷоя гап занед.",
        wish: "Хоҳиши волидайн: «{{w}}».",
        wishDiffers: "Хоҳиши волидайн аз он чӣ онҳо дар фарзанд мебинанд, фарқ дорад — дар бораи он ки чаро, ростқавлона гап занед.",
        tipsTitle: "Барои гуфтугӯи оила",
        tips: [
            "Натиҷаро якҷоя бинед: барои ҳар самт бигӯед, ки чаро чунин фикр мекунед.",
            "Аз самтҳои фарқкунанда якто касб интихоб кунед ва «Худро дар касб санҷед»-ро якҷоя гузаред (10 дақиқа).",
            "Дар бораи пул ва шаҳр пешакӣ гап занед: буҷетӣ ё пулакӣ, дар хона ё дар шаҳри дигар.",
        ],
        tryTogether: "Касбро якҷоя санҷед",
        thanks: "Ташаккур! Ҷавобҳои шумо ба фарзандатон намоён шуданд.",
    },
    ru: {
        inviteTitle: "Что думают родители?",
        inviteText: "Отправьте ссылку маме или папе. Без регистрации они ответят на 10 коротких вопросов о вас (2 минуты). Потом вы увидите, где их мнение совпадает с вашим тестом, а где различается.",
        childName: "Ваше имя (чтобы родители знали, от кого)",
        create: "Ссылка для родителей",
        send: "Отправить",
        copy: "Копировать",
        copied: "Скопировано",
        waiting: "Ждём ответа родителей…",
        refresh: "Проверить",
        shareText: "{{name}} спрашивает вас: «Какую профессию мне выбрать?» Ответьте на 10 коротких вопросов обо мне (2 минуты):",
        newLink: "Новая ссылка",
        askTitle: "{{name}} просит вашего совета",
        askTitleNoName: "Ваш ребёнок просит вашего совета",
        askText: "Ваш ребёнок прошёл тест профориентации. Теперь важно ваше мнение: ответьте на 10 коротких вопросов — о том, что вы в нём видите. Правильных ответов нет. Регистрация не нужна.",
        relation: "Кто вы?",
        relations: { father: "Отец", mother: "Мать", other: "Родственник" },
        start: "Начать",
        question: "Вопрос {{n}} из {{t}}",
        wishLabel: "Ваше желание",
        back: "Назад",
        notFound: "Ссылка не найдена или устарела.",
        compareTitle: "Ребёнок и родители: сравнение",
        child: "Тест ребёнка",
        parent: "Мнение родителей",
        agreement: "Совпадение",
        same: "Вы единодушны: главное направление и по тесту, и по мнению родителей — «{{a}}».",
        differ: "Главное направление различается: тест — «{{a}}», родители — «{{b}}». Это важно: поговорите вместе.",
        wish: "Желание родителей: «{{w}}».",
        wishDiffers: "Желание родителей отличается от того, что они видят в ребёнке, — честно обсудите почему.",
        tipsTitle: "Для семейного разговора",
        tips: [
            "Посмотрите результат вместе: по каждому направлению скажите, почему вы так думаете.",
            "Выберите по профессии из направлений, где мнения расходятся, и пройдите «Попробуйте себя в профессии» вместе (10 минут).",
            "Заранее обсудите деньги и город: бюджет или платно, дома или в другом городе.",
        ],
        tryTogether: "Попробовать профессию вместе",
        thanks: "Спасибо! Ваши ответы видны вашему ребёнку.",
    },
    en: {
        inviteTitle: "What do your parents think?",
        inviteText: "Send the link to your mum or dad. Without signing up they answer 10 short questions about you (2 minutes). Then you see where their view matches your test and where it differs.",
        childName: "Your name (so your parents know who it is from)",
        create: "Link for parents",
        send: "Send",
        copy: "Copy",
        copied: "Copied",
        waiting: "Waiting for your parents to answer…",
        refresh: "Check",
        shareText: "{{name}} is asking you: “Which career should I choose?” Answer 10 short questions about me (2 minutes):",
        newLink: "New link",
        askTitle: "{{name}} is asking for your advice",
        askTitleNoName: "Your child is asking for your advice",
        askText: "Your child took the career test. Now your view matters: answer 10 short questions about what you see in them. There are no right answers. No sign-up needed.",
        relation: "Who are you?",
        relations: { father: "Father", mother: "Mother", other: "Relative" },
        start: "Start",
        question: "Question {{n}} of {{t}}",
        wishLabel: "Your wish",
        back: "Back",
        notFound: "The link was not found or has expired.",
        compareTitle: "Child and parents: comparison",
        child: "Child’s test",
        parent: "Parents’ view",
        agreement: "Agreement",
        same: "You agree: the main direction is “{{a}}” both in the test and in your parents’ view.",
        differ: "The main direction differs: the test says “{{a}}”, the parents “{{b}}”. This matters — talk it over together.",
        wish: "Parents’ wish: “{{w}}”.",
        wishDiffers: "The parents’ wish differs from what they see in the child — talk honestly about why.",
        tipsTitle: "For the family conversation",
        tips: [
            "Look at the result together: for each direction say why you think so.",
            "Pick one career from each direction where you differ and do “Try yourself in a career” together (10 minutes).",
            "Talk about money and city early: state-funded or paid, at home or in another city.",
        ],
        tryTogether: "Try a career together",
        thanks: "Thank you! Your answers are now visible to your child.",
    },
};

export const parentText = (lang) => PARENT_TEXT[String(lang || "tj").slice(0, 2)] || PARENT_TEXT.tj;
export const fill = (text, values) => String(text).replace(/\{\{(\w+)\}\}/g, (_, key) => values?.[key] ?? "");

// Мувофиқат: ҳарду тақсимот ба ҳиссаҳо (ҷамъ = 1) табдил ёфта, 1 − ½·Σ|a−b|.
export function agreement(child, parent) {
    const share = (s) => {
        const total = CLUSTER_KEYS.reduce((sum, k) => sum + (Number(s?.[k]) || 0), 0) || 1;
        return CLUSTER_KEYS.map((k) => (Number(s?.[k]) || 0) / total);
    };
    const a = share(child);
    const b = share(parent);
    const diff = a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0);
    return Math.round((1 - diff / 2) * 100);
}

export const topOf = (s) => CLUSTER_KEYS.reduce((best, k) => ((Number(s?.[k]) || 0) > (Number(s?.[best]) || 0) ? k : best), "c1");
