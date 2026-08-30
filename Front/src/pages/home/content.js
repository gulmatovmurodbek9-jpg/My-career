/**
 * Тамоми матни сафҳаи асосӣ, дар се забон, дар як файл.
 *
 * Чаро дар ин ҷо, на дар lib/i18n.js: мазмуни ҳикоя сохтори чуқур дорад (панҷ
 * боб, ҳар яке бо чанд рӯйхат). Дар файли ҳамвори i18n он ба садҳо калиди
 * пароканда табдил меёфт. Дар ин ҷо ҳар се забон паҳлӯ ба паҳлӯ меистанд, ва
 * матнро иваз кардан осон аст: забони худро ёбед ва таҳрир кунед.
 *
 * Забон аз i18next гирифта мешавад (ниг. useHomeContent), барои ҳамин тугмаи
 * ивазкунии забон дар навбар ин саҳифаро низ иваз мекунад.
 */

const tj = {
  opening: {
    badge: "Роҳнамоии касбӣ · Тоҷикистон",
    title: "Кадом касб ба шумо мувофиқ аст?",
    lead:
      "Дар Тоҷикистон зиёда аз 150 ихтисос ҳаст. Мо кӯмак мекунем, ки аз онҳо " +
      "интихоби дуруст кунед.",
    ctaPrimary: "Тестро оғоз кунед",
    ctaSecondary: "Ихтисосҳоро дидан",
    imageAlt: "Муҳандис, омӯзгор ва табиб дар ҷойҳои кори худ",
  },

  overwhelm: {
    title: "Дар байни садҳо касб гум шудан осон аст",
    lead:
      "Барномасоз, табиб, ҳуқуқшинос, омӯзгор, муҳандис, иқтисодчӣ. Аз куҷо оғоз " +
      "кунед, агар ҳамааш ҷолиб бошад? Ё агар ҳеҷ кадомаш ҷолиб набошад?",
    videoAlt: "Марди тоҷик дар кӯҳ, дар атрофаш аломатҳои дурахшони касбҳои гуногун",
  },

  doors: {
    title: "Аз куҷо оғоз кунед",
    items: [
      {
        to: "/quiz",
        label: "Тестро супоред",
        body: "Тақрибан 10 дақиқа. Мо мефаҳмем, ки кадом касб ба шумо мувофиқ аст.",
        cta: "Оғоз кардан",
      },
      {
        to: "/careers",
        label: "Ихтисосҳоро бинед",
        body: "Зиёда аз 150 ихтисос: маош, талабот ва фанҳои лозимӣ.",
        cta: "Кушодан",
      },
      {
        to: "/universities",
        label: "Донишгоҳҳоро бинед",
        body: "Донишгоҳҳои Тоҷикистон ва ихтисосҳое, ки таълим медиҳанд.",
        cta: "Кушодан",
      },
    ],
  },


  journey: {
    title: "Ҳар ихтисоси Тоҷикистон ба яке аз панҷ кластер тааллуқ дорад",
    forWhoLabel: "Ин шумоед, агар",
    subjectsLabel: "Фанҳои асосии мактабӣ",
    workplacesLabel: "Куҷо кор мекунед",
    careersLabel: "Намунаи касбҳо",
    ctaWithCount: "{count} ихтисосро дидан",
    ctaFallback: "Ихтисосҳоро дидан",
  },

  clusters: [
    {
      clusterId: 1,
      title: "Созандагон",
      kicker: "Барои онҳое, ки месозанд",
      name: "Илмҳои табиӣ ва техникӣ",
      imageAlt: "Муҳандиси ҷавон дар утоқи идоракунии шабакаи барқ",
      description:
        "Барномасозӣ, муҳандисӣ, энергетика, сохтмон, нақлиёт ва технологияҳои иттилоотӣ. " +
        "Ин кластер дар бораи он аст, ки чизҳо чӣ тавр сохта мешаванд ва чӣ тавр кор мекунанд.",
      purpose:
        "Тайёр кардани муҳандисон ва мутахассисони техникӣ, ки инфрасохтор ва иқтисоди " +
        "рақамии кишварро месозанд ва нигоҳ медоранд.",
      forWho: [
        "Масъалаи мураккабро қадам ба қадам ҳал кардан ба шумо завқ медиҳад",
        "Мехоҳед бидонед, ки дар дохили телефон, мошин ё нерӯгоҳ чӣ мегузарад",
        "Рақам, схема ва мантиқ шуморо наметарсонад",
      ],
      subjects: ["Математика", "Физика", "Информатика", "Химия"],
      workplaces: [
        "Ширкатҳои IT ва алоқа",
        "Нерӯгоҳҳо ва шабакаи барқ",
        "Ширкатҳои сохтмонӣ ва меъморӣ",
        "Корхонаҳои саноатӣ",
        "Хадамоти нақлиёт ва логистика",
      ],
      sampleCareers: [
        "Барномасоз",
        "Муҳандиси барқ",
        "Меъмор",
        "Мутахассиси киберамният",
        "Муҳандиси нақлиёт",
      ],
      fields: ["Барномасозӣ", "Муҳандисӣ", "Энергетика", "Сохтмон", "Нақлиёт"],
    },
    {
      clusterId: 2,
      title: "Идоракунандагон",
      kicker: "Барои онҳое, ки идора мекунанд",
      name: "Иқтисод ва география",
      imageAlt: "Таҳлилгари молиявӣ дар идора, графикҳо дар рӯи миз",
      description:
        "Молия, баҳисобгирӣ, менеҷмент, савдо, сайёҳӣ ва география. Ин кластер дар бораи " +
        "он аст, ки пул, мол ва одамон чӣ тавр ҳаракат мекунанд ва чӣ тавр инро идора кардан мумкин.",
      purpose:
        "Тайёр кардани иқтисодчиён ва менеҷерон, ки метавонанд захираҳоро самаранок идора " +
        "кунанд ва тиҷорат ташкил намоянд.",
      forWho: [
        "Ба шумо маъқул аст, ки нақша кашед ва натиҷаро пешакӣ ҳисоб кунед",
        "Мехоҳед бифаҳмед, чаро нарх боло меравад ва пул ба куҷо меравад",
        "Бо одамон гуфтугӯ ва созиш кардан ба шумо осон аст",
      ],
      subjects: ["Математика", "География", "Иқтисод", "Забони хориҷӣ"],
      workplaces: [
        "Бонкҳо ва ташкилотҳои молиявӣ",
        "Ширкатҳои савдо ва истеҳсолӣ",
        "Мақомоти давлатӣ ва оморӣ",
        "Ширкатҳои сайёҳӣ ва меҳмонхонаҳо",
        "Тиҷорати шахсии худ",
      ],
      sampleCareers: [
        "Иқтисодчӣ",
        "Муҳосиб",
        "Менеҷери лоиҳа",
        "Таҳлилгари молиявӣ",
        "Мутахассиси логистика",
      ],
      fields: ["Молия", "Менеҷмент", "Савдо", "Сайёҳӣ", "География"],
    },
    {
      clusterId: 3,
      title: "Эҷодкорон",
      kicker: "Барои онҳое, ки эҷод мекунанд",
      name: "Филология, педагогика ва санъат",
      imageAlt: "Омӯзгор дар синфхона бо китоби кушода дар даст",
      description:
        "Забонҳо, адабиёт, омӯзгорӣ, мусиқӣ, дизайн ва ҳунар. Ин кластер дар бораи он аст, " +
        "ки чӣ тавр фикрро ба калима, овоз ё тасвир табдил диҳем ва ба дигарон расонем.",
      purpose:
        "Тайёр кардани омӯзгорон, филологҳо ва аҳли ҳунар, ки насли оянда ва фарҳанги " +
        "миллиро ташаккул медиҳанд.",
      forWho: [
        "Шумо хуб менависед, мехонед ё чизе месозед",
        "Фаҳмонда додан ба дигарон ба шумо завқ медиҳад",
        "Забон, мусиқӣ ё тасвир барои шумо роҳи муошират аст",
      ],
      subjects: ["Забони тоҷикӣ", "Адабиёт", "Забони хориҷӣ", "Таърих"],
      workplaces: [
        "Мактабҳо ва донишгоҳҳо",
        "Нашриёт ва воситаҳои ахбор",
        "Театр, студия ва галереяҳо",
        "Агентиҳои реклама ва дизайн",
        "Марказҳои фарҳангӣ",
      ],
      sampleCareers: ["Омӯзгор", "Тарҷумон", "Дизайнери графикӣ", "Муҳаррир", "Навозанда"],
      fields: ["Забонҳо", "Адабиёт", "Омӯзгорӣ", "Мусиқӣ", "Дизайн"],
    },
    {
      clusterId: 4,
      title: "Ҳимоягарон",
      kicker: "Барои онҳое, ки ҳимоя мекунанд",
      name: "Ҷомеашиносӣ ва ҳуқуқ",
      imageAlt: "Ҳуқуқшинос дар идора, дар назди рафҳои китобҳои ҳуқуқӣ",
      description:
        "Ҳуқуқшиносӣ, сиёсатшиносӣ, журналистика, кори иҷтимоӣ ва муносибатҳои байналмилалӣ. " +
        "Ин кластер дар бораи қоидаҳои ҳамзистии одамон ва ҳимояи онҳост.",
      purpose:
        "Тайёр кардани ҳуқуқшиносон ва мутахассисони соҳаи ҷамъиятӣ, ки ҳуқуқи шаҳрвандон " +
        "ва тартиби ҳуқуқиро ҳифз мекунанд.",
      forWho: [
        "Шумо зуд ҳис мекунед, ки кай ҳаққи касе поймол мешавад",
        "Баҳс кардан ва далели қавӣ овардан ба шумо маъқул аст",
        "Мехоҳед қоидаҳои ҷомеаро донед ва ба беҳтар шудани онҳо саҳм гузоред",
      ],
      subjects: ["Таърих", "Ҷомеашиносӣ", "Забони тоҷикӣ", "Забони хориҷӣ"],
      workplaces: [
        "Судҳо ва прокуратура",
        "Идораҳои ҳуқуқӣ ва адвокатӣ",
        "Мақомоти давлатӣ ва мунисипалӣ",
        "Ташкилотҳои байналмилалӣ",
        "Редаксияҳо ва воситаҳои ахбор",
      ],
      sampleCareers: ["Ҳуқуқшинос", "Адвокат", "Рӯзноманигор", "Дипломат", "Корманди иҷтимоӣ"],
      fields: ["Ҳуқуқшиносӣ", "Сиёсат", "Журналистика", "Кори иҷтимоӣ", "Дипломатия"],
    },
    {
      clusterId: 5,
      title: "Шифобахшон",
      kicker: "Барои онҳое, ки шифо мебахшанд",
      name: "Тиб, биология ва варзиш",
      imageAlt: "Табиб дар долони беморхона бо планшет дар даст",
      description:
        "Табобат, дорусозӣ, ҳамширагӣ, биология, экология ва тарбияи ҷисмонӣ. Ин кластер " +
        "дар бораи бадани инсон, табиати зинда ва нигоҳ доштани саломатист.",
      purpose:
        "Тайёр кардани кормандони тиб ва мутахассисони соҳаи саломатӣ, ки ҳаёт ва " +
        "тандурустии мардумро ҳифз мекунанд.",
      forWho: [
        "Шумо метавонед ором бимонед, вақте каси дигар ба ҳарос меафтад",
        "Ба шумо ҷолиб аст, ки бадан ва табиат чӣ тавр кор мекунанд",
        "Ба таҳсили дароз ва масъулияти вазнин тайёред",
      ],
      subjects: ["Биология", "Химия", "Физика", "Забони тоҷикӣ"],
      workplaces: [
        "Беморхонаҳо ва марказҳои тиббӣ",
        "Дорухонаҳо ва ширкатҳои дорусозӣ",
        "Лабораторияҳои таҳлилӣ",
        "Марказҳои варзишӣ",
        "Хадамоти санитарӣ ва экологӣ",
      ],
      sampleCareers: ["Табиб", "Дорусоз", "Ҳамшираи тиббӣ", "Биолог", "Мураббии варзиш"],
      fields: ["Табобат", "Дорусозӣ", "Ҳамширагӣ", "Биология", "Варзиш"],
    },
  ],


  topCareers: {
    title: "Ихтисосҳои пешқадам",
    subtitle: "Касбҳои талаботбаланд бо дурнамои хуб дар Тоҷикистон.",
    unavailable: "Ҳоло рӯйхати ихтисосҳо дастрас нест. Саҳифаи «Ихтисосҳо»-ро кушоед.",
  },


  closing: {
    badge: "Ройгон · тақрибан 10 дақиқа",
    title: "Кадоме аз панҷ роҳ аз они шумост?",
    lead:
      "Тести равонӣ шавқу қобилияти шуморо бо кластерҳо муқоиса мекунад ва рӯйхати " +
      "ихтисосҳои мувофиқро месозад. Ҷавоби дуруст ё нодуруст нест, танҳо ҷавоби ростқавлона.",
    cta: "Тестро оғоз кунед",
    videoAlt: "Хонандаи мактаб дар долони мактаб сарашро мебардорад",
  },
};

const ru = {
  opening: {
    badge: "Профориентация · Таджикистан",
    title: "Какая профессия вам подходит?",
    lead:
      "В Таджикистане более 150 специальностей. Мы поможем выбрать из них " +
      "подходящую.",
    ctaPrimary: "Пройти тест",
    ctaSecondary: "Смотреть специальности",
    imageAlt: "Инженер, учительница и врач на своих рабочих местах",
  },

  overwhelm: {
    title: "Среди сотен профессий легко потеряться",
    lead:
      "Программист, врач, юрист, учитель, инженер, экономист. С чего начать, если " +
      "интересно всё? Или если не интересно ничего?",
    videoAlt: "Таджикский мужчина в горах, вокруг светящиеся символы разных профессий",
  },

  doors: {
    title: "С чего начать",
    items: [
      {
        to: "/quiz",
        label: "Пройдите тест",
        body: "Около 10 минут. Мы поймём, какая профессия вам подходит.",
        cta: "Начать",
      },
      {
        to: "/careers",
        label: "Посмотрите специальности",
        body: "Более 150 специальностей: зарплата, спрос и нужные предметы.",
        cta: "Открыть",
      },
      {
        to: "/universities",
        label: "Посмотрите вузы",
        body: "Университеты Таджикистана и специальности, которым они учат.",
        cta: "Открыть",
      },
    ],
  },


  journey: {
    title: "Каждая специальность Таджикистана относится к одному из пяти кластеров",
    forWhoLabel: "Это про вас, если",
    subjectsLabel: "Ключевые школьные предметы",
    workplacesLabel: "Где вы будете работать",
    careersLabel: "Примеры профессий",
    ctaWithCount: "Смотреть {count} специальностей",
    ctaFallback: "Смотреть специальности",
  },

  clusters: [
    {
      clusterId: 1,
      title: "Созидатели",
      kicker: "Для тех, кто строит",
      name: "Естественные и технические науки",
      imageAlt: "Молодой инженер в диспетчерской электросети",
      description:
        "Программирование, инженерия, энергетика, строительство, транспорт и информационные " +
        "технологии. Этот кластер о том, как вещи создаются и как они работают.",
      purpose:
        "Готовить инженеров и технических специалистов, которые строят и поддерживают " +
        "инфраструктуру и цифровую экономику страны.",
      forWho: [
        "Вам нравится решать сложную задачу шаг за шагом",
        "Хотите знать, что происходит внутри телефона, автомобиля или электростанции",
        "Цифры, схемы и логика вас не пугают",
      ],
      subjects: ["Математика", "Физика", "Информатика", "Химия"],
      workplaces: [
        "IT- и телеком-компании",
        "Электростанции и энергосети",
        "Строительные и архитектурные компании",
        "Промышленные предприятия",
        "Транспорт и логистика",
      ],
      sampleCareers: [
        "Программист",
        "Инженер-энергетик",
        "Архитектор",
        "Специалист по кибербезопасности",
        "Инженер транспорта",
      ],
      fields: ["Программирование", "Инженерия", "Энергетика", "Строительство", "Транспорт"],
    },
    {
      clusterId: 2,
      title: "Управленцы",
      kicker: "Для тех, кто управляет",
      name: "Экономика и география",
      imageAlt: "Финансовый аналитик в офисе, графики на столе",
      description:
        "Финансы, бухгалтерия, менеджмент, торговля, туризм и география. Этот кластер о том, " +
        "как движутся деньги, товары и люди, и как этим управлять.",
      purpose:
        "Готовить экономистов и менеджеров, способных эффективно управлять ресурсами " +
        "и создавать бизнес.",
      forWho: [
        "Вам нравится планировать и заранее просчитывать результат",
        "Хотите понимать, почему растут цены и куда уходят деньги",
        "Вам легко договариваться с людьми",
      ],
      subjects: ["Математика", "География", "Экономика", "Иностранный язык"],
      workplaces: [
        "Банки и финансовые организации",
        "Торговые и производственные компании",
        "Государственные и статистические органы",
        "Туристические компании и отели",
        "Собственный бизнес",
      ],
      sampleCareers: [
        "Экономист",
        "Бухгалтер",
        "Менеджер проектов",
        "Финансовый аналитик",
        "Специалист по логистике",
      ],
      fields: ["Финансы", "Менеджмент", "Торговля", "Туризм", "География"],
    },
    {
      clusterId: 3,
      title: "Творцы",
      kicker: "Для тех, кто создаёт",
      name: "Филология, педагогика и искусство",
      imageAlt: "Учительница в классе с открытой книгой в руках",
      description:
        "Языки, литература, преподавание, музыка, дизайн и ремёсла. Этот кластер о том, как " +
        "превратить мысль в слово, звук или образ и донести её до других.",
      purpose:
        "Готовить учителей, филологов и людей искусства, которые формируют следующее " +
        "поколение и национальную культуру.",
      forWho: [
        "Вы хорошо пишете, читаете или что-то создаёте",
        "Вам нравится объяснять другим",
        "Язык, музыка или изображение: ваш способ общения",
      ],
      subjects: ["Таджикский язык", "Литература", "Иностранный язык", "История"],
      workplaces: [
        "Школы и вузы",
        "Издательства и СМИ",
        "Театры, студии и галереи",
        "Рекламные и дизайн-агентства",
        "Культурные центры",
      ],
      sampleCareers: ["Учитель", "Переводчик", "Графический дизайнер", "Редактор", "Музыкант"],
      fields: ["Языки", "Литература", "Преподавание", "Музыка", "Дизайн"],
    },
    {
      clusterId: 4,
      title: "Защитники",
      kicker: "Для тех, кто защищает",
      name: "Обществознание и право",
      imageAlt: "Юрист в офисе у полок с юридическими книгами",
      description:
        "Юриспруденция, политология, журналистика, социальная работа и международные " +
        "отношения. Этот кластер о правилах совместной жизни людей и о защите этих правил.",
      purpose:
        "Готовить юристов и специалистов общественной сферы, которые защищают права " +
        "граждан и правопорядок.",
      forWho: [
        "Вы быстро чувствуете, когда чьи-то права нарушают",
        "Вам нравится спорить и приводить сильные аргументы",
        "Хотите понимать правила общества и участвовать в их улучшении",
      ],
      subjects: ["История", "Обществознание", "Таджикский язык", "Иностранный язык"],
      workplaces: [
        "Суды и прокуратура",
        "Юридические и адвокатские бюро",
        "Государственные и муниципальные органы",
        "Международные организации",
        "Редакции и СМИ",
      ],
      sampleCareers: ["Юрист", "Адвокат", "Журналист", "Дипломат", "Социальный работник"],
      fields: ["Право", "Политика", "Журналистика", "Социальная работа", "Дипломатия"],
    },
    {
      clusterId: 5,
      title: "Целители",
      kicker: "Для тех, кто лечит",
      name: "Медицина, биология и спорт",
      imageAlt: "Врач в коридоре больницы с планшетом в руках",
      description:
        "Лечебное дело, фармация, сестринское дело, биология, экология и физическая культура. " +
        "Этот кластер о теле человека, живой природе и сохранении здоровья.",
      purpose:
        "Готовить медицинских работников и специалистов сферы здоровья, которые защищают " +
        "жизнь и здоровье людей.",
      forWho: [
        "Вы можете сохранять спокойствие, когда другие паникуют",
        "Вам интересно, как устроены тело и живая природа",
        "Вы готовы к долгой учёбе и большой ответственности",
      ],
      subjects: ["Биология", "Химия", "Физика", "Таджикский язык"],
      workplaces: [
        "Больницы и медицинские центры",
        "Аптеки и фармацевтические компании",
        "Аналитические лаборатории",
        "Спортивные центры",
        "Санитарные и экологические службы",
      ],
      sampleCareers: ["Врач", "Фармацевт", "Медсестра", "Биолог", "Спортивный тренер"],
      fields: ["Лечебное дело", "Фармация", "Сестринское дело", "Биология", "Спорт"],
    },
  ],


  topCareers: {
    title: "Востребованные специальности",
    subtitle: "Профессии с высоким спросом и хорошими перспективами в Таджикистане.",
    unavailable: "Список специальностей сейчас недоступен. Откройте страницу «Специальности».",
  },


  closing: {
    badge: "Бесплатно · около 10 минут",
    title: "Какой из пяти путей ваш?",
    lead:
      "Психологический тест сопоставит ваши интересы и способности с кластерами и составит " +
      "список подходящих специальностей. Здесь нет правильных или неправильных ответов, только честные.",
    cta: "Пройти тест",
    videoAlt: "Школьница в школьном коридоре поднимает голову",
  },
};

const en = {
  opening: {
    badge: "Career guidance · Tajikistan",
    title: "Which career fits you?",
    lead:
      "Tajikistan has over 150 specialties. We help you choose the right one.",
    ctaPrimary: "Start the test",
    ctaSecondary: "Browse specialties",
    imageAlt: "An engineer, a teacher and a doctor at their workplaces",
  },

  overwhelm: {
    title: "It is easy to get lost among hundreds of professions",
    lead:
      "Developer, doctor, lawyer, teacher, engineer, economist. Where do you start " +
      "if everything looks interesting? Or if nothing does?",
    videoAlt: "A Tajik man in the mountains surrounded by glowing symbols of different professions",
  },

  doors: {
    title: "Where to start",
    items: [
      {
        to: "/quiz",
        label: "Take the test",
        body: "About 10 minutes. We work out which career fits you.",
        cta: "Start",
      },
      {
        to: "/careers",
        label: "Browse specialties",
        body: "Over 150 specialties, with pay, demand and the subjects you need.",
        cta: "Open",
      },
      {
        to: "/universities",
        label: "Browse universities",
        body: "Universities in Tajikistan and the specialties they teach.",
        cta: "Open",
      },
    ],
  },


  journey: {
    title: "Every specialty in Tajikistan belongs to one of five clusters",
    forWhoLabel: "This is you if",
    subjectsLabel: "Key school subjects",
    workplacesLabel: "Where you would work",
    careersLabel: "Example professions",
    ctaWithCount: "See {count} specialties",
    ctaFallback: "See specialties",
  },

  clusters: [
    {
      clusterId: 1,
      title: "The Builders",
      kicker: "For those who build",
      name: "Natural and technical sciences",
      imageAlt: "A young engineer in an electrical grid control room",
      description:
        "Programming, engineering, energy, construction, transport and information technology. " +
        "This cluster is about how things get built and how they work.",
      purpose:
        "To train engineers and technical specialists who build and maintain the country's " +
        "infrastructure and digital economy.",
      forWho: [
        "You enjoy taking a hard problem apart step by step",
        "You want to know what happens inside a phone, a car or a power plant",
        "Numbers, diagrams and logic do not scare you",
      ],
      subjects: ["Mathematics", "Physics", "Computer science", "Chemistry"],
      workplaces: [
        "IT and telecom companies",
        "Power plants and electrical grids",
        "Construction and architecture firms",
        "Industrial plants",
        "Transport and logistics services",
      ],
      sampleCareers: [
        "Software developer",
        "Power engineer",
        "Architect",
        "Cybersecurity specialist",
        "Transport engineer",
      ],
      fields: ["Programming", "Engineering", "Energy", "Construction", "Transport"],
    },
    {
      clusterId: 2,
      title: "The Organisers",
      kicker: "For those who manage",
      name: "Economics and geography",
      imageAlt: "A financial analyst in an office with charts on the desk",
      description:
        "Finance, accounting, management, trade, tourism and geography. This cluster is about " +
        "how money, goods and people move, and how to steer that.",
      purpose:
        "To train economists and managers who can allocate resources efficiently and build " +
        "businesses.",
      forWho: [
        "You like planning and working out the result in advance",
        "You want to understand why prices rise and where money goes",
        "Talking to people and reaching agreement comes easily to you",
      ],
      subjects: ["Mathematics", "Geography", "Economics", "Foreign language"],
      workplaces: [
        "Banks and financial institutions",
        "Trading and manufacturing companies",
        "Government and statistics bodies",
        "Travel companies and hotels",
        "Your own business",
      ],
      sampleCareers: [
        "Economist",
        "Accountant",
        "Project manager",
        "Financial analyst",
        "Logistics specialist",
      ],
      fields: ["Finance", "Management", "Trade", "Tourism", "Geography"],
    },
    {
      clusterId: 3,
      title: "The Creators",
      kicker: "For those who create",
      name: "Philology, education and the arts",
      imageAlt: "A teacher in a classroom holding an open book",
      description:
        "Languages, literature, teaching, music, design and craft. This cluster is about turning " +
        "a thought into a word, a sound or an image, and getting it across to other people.",
      purpose:
        "To train teachers, philologists and artists who shape the next generation and the " +
        "national culture.",
      forWho: [
        "You write, read or make things well",
        "Explaining something to others gives you satisfaction",
        "Language, music or images are how you communicate",
      ],
      subjects: ["Tajik language", "Literature", "Foreign language", "History"],
      workplaces: [
        "Schools and universities",
        "Publishing houses and media",
        "Theatres, studios and galleries",
        "Advertising and design agencies",
        "Cultural centres",
      ],
      sampleCareers: ["Teacher", "Translator", "Graphic designer", "Editor", "Musician"],
      fields: ["Languages", "Literature", "Teaching", "Music", "Design"],
    },
    {
      clusterId: 4,
      title: "The Defenders",
      kicker: "For those who defend",
      name: "Social sciences and law",
      imageAlt: "A lawyer in an office beside shelves of legal books",
      description:
        "Law, political science, journalism, social work and international relations. This " +
        "cluster is about the rules people live by together, and about defending them.",
      purpose:
        "To train lawyers and public-sector specialists who protect citizens' rights and the " +
        "rule of law.",
      forWho: [
        "You notice quickly when someone's rights are being violated",
        "You enjoy arguing a case and backing it with strong evidence",
        "You want to understand society's rules and help improve them",
      ],
      subjects: ["History", "Social studies", "Tajik language", "Foreign language"],
      workplaces: [
        "Courts and the prosecutor's office",
        "Law firms and legal practices",
        "State and municipal bodies",
        "International organisations",
        "Newsrooms and media",
      ],
      sampleCareers: ["Lawyer", "Defence attorney", "Journalist", "Diplomat", "Social worker"],
      fields: ["Law", "Politics", "Journalism", "Social work", "Diplomacy"],
    },
    {
      clusterId: 5,
      title: "The Healers",
      kicker: "For those who heal",
      name: "Medicine, biology and sport",
      imageAlt: "A doctor in a hospital corridor holding a tablet",
      description:
        "Medicine, pharmacy, nursing, biology, ecology and physical education. This cluster is " +
        "about the human body, living nature and keeping people healthy.",
      purpose:
        "To train medical workers and health specialists who protect people's lives and " +
        "wellbeing.",
      forWho: [
        "You can stay calm when everyone around you panics",
        "You are curious about how the body and living nature work",
        "You are ready for long study and heavy responsibility",
      ],
      subjects: ["Biology", "Chemistry", "Physics", "Tajik language"],
      workplaces: [
        "Hospitals and medical centres",
        "Pharmacies and pharmaceutical companies",
        "Analytical laboratories",
        "Sports centres",
        "Public health and environmental services",
      ],
      sampleCareers: ["Doctor", "Pharmacist", "Nurse", "Biologist", "Sports coach"],
      fields: ["Medicine", "Pharmacy", "Nursing", "Biology", "Sport"],
    },
  ],


  topCareers: {
    title: "In-demand specialties",
    subtitle: "Professions with strong demand and good prospects in Tajikistan.",
    unavailable: "The specialty list is unavailable right now. Open the Specialties page.",
  },


  closing: {
    badge: "Free · about 10 minutes",
    title: "Which of the five paths is yours?",
    lead:
      "The aptitude test matches your interests and strengths against the clusters and builds a " +
      "list of specialties that fit. There are no right or wrong answers, only honest ones.",
    cta: "Start the test",
    videoAlt: "A schoolgirl in a school corridor lifting her head",
  },
};

export const HOME_CONTENT = { tj, ru, en };

/** Забони i18next ("tj-TJ", "ru" ва ғ.) ба калиди HOME_CONTENT. */
export function resolveLang(language) {
  const code = (language || "tj").slice(0, 2).toLowerCase();
  if (code === "ru") return "ru";
  if (code === "en") return "en";
  return "tj";
}
