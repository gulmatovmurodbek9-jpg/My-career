export enum QuizPart {
    MMT = 'mmt',
    MOTIVATION = 'motivation',
    SPECIALTY = 'specialty',
}

export type QuizQuestionType = 'scenario' | 'motivation' | 'environment' | 'refinement';

export interface QuizQuestionOption {
    text: {
        tj: string;
        ru: string;
        en: string;
    };
    scores?: { c1?: number; c2?: number; c3?: number; c4?: number; c5?: number; };
    keywords?: string[];
}

export interface QuizQuestion {
    id: string;
    part: QuizPart;
    type: QuizQuestionType;
    question: {
        tj: string;
        ru: string;
        en: string;
    };
    options: QuizQuestionOption[];
    targetCluster?: 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        "id": "sp_c1_1",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c1",
        "question": {
            "tj": "Кадом намуди технология бештар диққати шуморо ҷалб мекунад?",
            "ru": "Какой вид технологий привлекает вас больше всего?",
            "en": "What type of technology attracts you the most?"
        },
        "options": [
            {
                "text": {
                    "tj": "Барномасозӣ ва AI",
                    "ru": "Программирование и ИИ",
                    "en": "Programming & AI"
                },
                "keywords": [
                    "барном",
                    "ай",
                    "информ",
                    "кибер",
                    "ai",
                    "программ"
                ]
            },
            {
                "text": {
                    "tj": "Муҳандисӣ ва робототехника",
                    "ru": "Инженерия и робототехника",
                    "en": "Engineering & Robotics"
                },
                "keywords": [
                    "муҳандис",
                    "робот",
                    "механик",
                    "техника",
                    "мошин"
                ]
            },
            {
                "text": {
                    "tj": "Архитектура ва сохтмон",
                    "ru": "Архитектура и строительство",
                    "en": "Architecture & Construction"
                },
                "keywords": [
                    "сохтмон",
                    "архитектура",
                    "бино",
                    "лоиҳа"
                ]
            },
            {
                "text": {
                    "tj": "Энергетика ва электроника",
                    "ru": "Энергетика и электроника",
                    "en": "Energy & Electronics"
                },
                "keywords": [
                    "энергия",
                    "электр",
                    "физика"
                ]
            }
        ]
    },
    {
        "id": "sp_c1_2",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c1",
        "question": {
            "tj": "Ҳангоми кор дар лоиҳа, кадом қисмаш ба шумо маъқул аст?",
            "ru": "Работая над проектом, какая часть вам нравится?",
            "en": "When working on a project, which part do you like?"
        },
        "options": [
            {
                "text": {
                    "tj": "Навиштани алгоритмҳо",
                    "ru": "Написание алгоритмов",
                    "en": "Writing algorithms"
                },
                "keywords": [
                    "алгоритм",
                    "математика",
                    "код"
                ]
            },
            {
                "text": {
                    "tj": "Сохтани моделҳои 3D",
                    "ru": "Создание 3D моделей",
                    "en": "Creating 3D models"
                },
                "keywords": [
                    "3d",
                    "дизайн",
                    "графика"
                ]
            },
            {
                "text": {
                    "tj": "Таҳлили маълумот (Data)",
                    "ru": "Анализ данных",
                    "en": "Data analysis"
                },
                "keywords": [
                    "дата",
                    "маълумот",
                    "таҳлил"
                ]
            },
            {
                "text": {
                    "tj": "Таҷрибаҳои лабораторӣ",
                    "ru": "Лабораторные опыты",
                    "en": "Lab experiments"
                },
                "keywords": [
                    "лаборат",
                    "озмоиш",
                    "хими"
                ]
            }
        ]
    },
    {
        "id": "sp_c1_3",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c1",
        "question": {
            "tj": "Шумо кадом мушкилотро тезтар ҳал кардан мехоҳед?",
            "ru": "Какую проблему вы хотели бы решить быстрее?",
            "en": "Which problem would you like to solve faster?"
        },
        "options": [
            {
                "text": {
                    "tj": "Амнияти киберӣ",
                    "ru": "Кибербезопасность",
                    "en": "Cybersecurity"
                },
                "keywords": [
                    "кибер",
                    "амният",
                    "информ"
                ]
            },
            {
                "text": {
                    "tj": "Зилзила ва сохтмони бехатар",
                    "ru": "Землетрясения и безопасное строительство",
                    "en": "Earthquakes and safe construction"
                },
                "keywords": [
                    "сохтмон",
                    "геолог"
                ]
            },
            {
                "text": {
                    "tj": "Автоматикунонии корхонаҳо",
                    "ru": "Автоматизация фабрик",
                    "en": "Factory automation"
                },
                "keywords": [
                    "автомат",
                    "саноат",
                    "механик"
                ]
            },
            {
                "text": {
                    "tj": "Истеҳсоли барқи тоза",
                    "ru": "Чистая энергия",
                    "en": "Clean energy"
                },
                "keywords": [
                    "энергия",
                    "эколог",
                    "барқ"
                ]
            }
        ]
    },
    {
        "id": "sp_c1_4",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c1",
        "question": {
            "tj": "Шумо бо кадом асбобҳо кор карданро дӯст медоред?",
            "ru": "С какими инструментами вы любите работать?",
            "en": "Which tools do you like to work with?"
        },
        "options": [
            {
                "text": {
                    "tj": "Компютер ва IDE",
                    "ru": "Компьютер и IDE",
                    "en": "Computer and IDE"
                },
                "keywords": [
                    "компютер",
                    "барном"
                ]
            },
            {
                "text": {
                    "tj": "Асбобҳои ченкунӣ ва асбобҳои дастӣ",
                    "ru": "Измерительные и ручные инструменты",
                    "en": "Measuring and hand tools"
                },
                "keywords": [
                    "муҳандис",
                    "асбоб",
                    "метрология"
                ]
            },
            {
                "text": {
                    "tj": "Дронҳо ва сенсорҳо",
                    "ru": "Дроны и сенсоры",
                    "en": "Drones and sensors"
                },
                "keywords": [
                    "авиатсия",
                    "сенсор",
                    "радио"
                ]
            },
            {
                "text": {
                    "tj": "Таҷҳизоти химиявӣ",
                    "ru": "Химическое оборудование",
                    "en": "Chemical equipment"
                },
                "keywords": [
                    "хими",
                    "технолог"
                ]
            }
        ]
    },
    {
        "id": "sp_c1_5",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c1",
        "question": {
            "tj": "Кадом намуди натиҷа шуморо қонеъ мекунад?",
            "ru": "Какой результат вас удовлетворяет?",
            "en": "What type of result satisfies you?"
        },
        "options": [
            {
                "text": {
                    "tj": "Барномаи бенуқсон коркунанда",
                    "ru": "Идеально работающая программа",
                    "en": "Flawless working program"
                },
                "keywords": [
                    "барном",
                    "веб"
                ]
            },
            {
                "text": {
                    "tj": "Бинои зебо ва мустаҳкам",
                    "ru": "Красивое и прочное здание",
                    "en": "Beautiful and solid building"
                },
                "keywords": [
                    "архитектура",
                    "сохтмон"
                ]
            },
            {
                "text": {
                    "tj": "Дастгоҳи нави ихтироъшуда",
                    "ru": "Новое изобретенное устройство",
                    "en": "Newly invented device"
                },
                "keywords": [
                    "ихтироъ",
                    "механик"
                ]
            },
            {
                "text": {
                    "tj": "Раванди оптимизатсияшудаи истеҳсолот",
                    "ru": "Оптимизированный процесс производства",
                    "en": "Optimized production process"
                },
                "keywords": [
                    "истеҳсол",
                    "система"
                ]
            }
        ]
    },
    {
        "id": "sp_c2_1",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c2",
        "question": {
            "tj": "Дар соҳаи иқтисод кадом самт барои шумо шавқовар аст?",
            "ru": "Какое направление в экономике вам интересно?",
            "en": "Which area of economics is interesting to you?"
        },
        "options": [
            {
                "text": {
                    "tj": "Молия ва бонкдорӣ",
                    "ru": "Финансы и банкинг",
                    "en": "Finance and banking"
                },
                "keywords": [
                    "молия",
                    "бонк",
                    "кредит",
                    "андоз"
                ]
            },
            {
                "text": {
                    "tj": "Менеҷмент ва роҳбарӣ",
                    "ru": "Менеджмент и руководство",
                    "en": "Management and leadership"
                },
                "keywords": [
                    "менеҷ",
                    "идора",
                    "роҳбар"
                ]
            },
            {
                "text": {
                    "tj": "Маркетинг ва фурӯш",
                    "ru": "Маркетинг и продажи",
                    "en": "Marketing and sales"
                },
                "keywords": [
                    "маркет",
                    "фурӯш",
                    "реклам"
                ]
            },
            {
                "text": {
                    "tj": "Сайёҳӣ ва география",
                    "ru": "Туризм и география",
                    "en": "Tourism and geography"
                },
                "keywords": [
                    "сайёҳ",
                    "туризм",
                    "географ",
                    "эколог"
                ]
            }
        ]
    },
    {
        "id": "sp_c2_2",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c2",
        "question": {
            "tj": "Агар шумо ширкат кушоед, он чӣ гуна хоҳад буд?",
            "ru": "Если бы вы открыли компанию, какой бы она была?",
            "en": "If you opened a company, what would it be like?"
        },
        "options": [
            {
                "text": {
                    "tj": "Ширкати аудиторӣ ва ҳисобдорӣ",
                    "ru": "Аудиторская и бухгалтерская компания",
                    "en": "Audit and accounting company"
                },
                "keywords": [
                    "аудит",
                    "ҳисоб",
                    "бухгалтер"
                ]
            },
            {
                "text": {
                    "tj": "Агентии сайёҳӣ ва меҳмонхона",
                    "ru": "Турагентство и отель",
                    "en": "Travel agency and hotel"
                },
                "keywords": [
                    "меҳмонхона",
                    "туризм"
                ]
            },
            {
                "text": {
                    "tj": "Маркази савдои байналмилалӣ",
                    "ru": "Международный торговый центр",
                    "en": "International trade center"
                },
                "keywords": [
                    "савдо",
                    "байналмилал",
                    "гумрук"
                ]
            },
            {
                "text": {
                    "tj": "Ширкати стартап ва маркетинг",
                    "ru": "Стартап и маркетинговая компания",
                    "en": "Startup and marketing company"
                },
                "keywords": [
                    "стартап",
                    "маркет",
                    "бизнес"
                ]
            }
        ]
    },
    {
        "id": "sp_c2_3",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c2",
        "question": {
            "tj": "Шумо бо кадом намуди маълумот кор карданро дӯст медоред?",
            "ru": "С какими данными вы любите работать?",
            "en": "What type of data do you like working with?"
        },
        "options": [
            {
                "text": {
                    "tj": "Рақамҳо, ҳисоботҳо ва андоз",
                    "ru": "Цифры, отчеты и налоги",
                    "en": "Numbers, reports, and taxes"
                },
                "keywords": [
                    "андоз",
                    "ҳисобот",
                    "молия"
                ]
            },
            {
                "text": {
                    "tj": "Харитаҳо ва маълумоти географӣ",
                    "ru": "Карты и географические данные",
                    "en": "Maps and geographical data"
                },
                "keywords": [
                    "географ",
                    "харита",
                    "замин"
                ]
            },
            {
                "text": {
                    "tj": "Таҳлили рафтори истеъмолкунандагон",
                    "ru": "Анализ поведения потребителей",
                    "en": "Consumer behavior analysis"
                },
                "keywords": [
                    "истеъмол",
                    "маркет",
                    "псих"
                ]
            },
            {
                "text": {
                    "tj": "Қонунҳои савдо ва логистика",
                    "ru": "Торговые законы и логистика",
                    "en": "Trade laws and logistics"
                },
                "keywords": [
                    "савдо",
                    "логист"
                ]
            }
        ]
    },
    {
        "id": "sp_c2_4",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c2",
        "question": {
            "tj": "Ояндаи шумо бештар ба кадом нақш монанд аст?",
            "ru": "На какую роль больше похоже ваше будущее?",
            "en": "What role does your future look like?"
        },
        "options": [
            {
                "text": {
                    "tj": "Сармоягузор ё директори молиявӣ",
                    "ru": "Инвестор или финансовый директор",
                    "en": "Investor or CFO"
                },
                "keywords": [
                    "сармоя",
                    "директор",
                    "бонк"
                ]
            },
            {
                "text": {
                    "tj": "Гид, харитакаш ё мутахассиси экология",
                    "ru": "Гид, картограф или эколог",
                    "en": "Guide, cartographer, or ecologist"
                },
                "keywords": [
                    "гид",
                    "эколог",
                    "сайёҳ"
                ]
            },
            {
                "text": {
                    "tj": "Роҳбари лоиҳа ё соҳибкор",
                    "ru": "Менеджер проекта или предприниматель",
                    "en": "Project manager or entrepreneur"
                },
                "keywords": [
                    "соҳибкор",
                    "лоиҳа",
                    "менеҷ"
                ]
            },
            {
                "text": {
                    "tj": "Мутахассиси савдои байналмилалӣ",
                    "ru": "Специалист по международной торговле",
                    "en": "International trade specialist"
                },
                "keywords": [
                    "байналмилал",
                    "савдо",
                    "гумрук"
                ]
            }
        ]
    },
    {
        "id": "sp_c2_5",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c2",
        "question": {
            "tj": "Кадом малакаи шумо қавитар аст?",
            "ru": "Какой ваш навык сильнее?",
            "en": "Which is your strongest skill?"
        },
        "options": [
            {
                "text": {
                    "tj": "Таҳлили математикӣ ва омор",
                    "ru": "Математический анализ и статистика",
                    "en": "Math analysis and statistics"
                },
                "keywords": [
                    "омор",
                    "математика",
                    "иқтисод"
                ]
            },
            {
                "text": {
                    "tj": "Муошират ва ҷалби муштариён",
                    "ru": "Общение и привлечение клиентов",
                    "en": "Communication and client acquisition"
                },
                "keywords": [
                    "муштарӣ",
                    "фурӯш",
                    "коммуникатсия"
                ]
            },
            {
                "text": {
                    "tj": "Омӯзиши табиат ва муҳити зист",
                    "ru": "Изучение природы и окружающей среды",
                    "en": "Studying nature and environment"
                },
                "keywords": [
                    "табиат",
                    "географ",
                    "геолог"
                ]
            },
            {
                "text": {
                    "tj": "Ташкилкунӣ ва идоракунии гурӯҳ",
                    "ru": "Организация и управление командой",
                    "en": "Organization and team management"
                },
                "keywords": [
                    "ташкил",
                    "идора",
                    "менеҷ"
                ]
            }
        ]
    },
    {
        "id": "sp_c3_1",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c3",
        "question": {
            "tj": "Дар соҳаи филология ва санъат, шуморо чӣ бештар ҷалб мекунад?",
            "ru": "В сфере филологии и искусства, что вас привлекает больше?",
            "en": "In philology and arts, what attracts you most?"
        },
        "options": [
            {
                "text": {
                    "tj": "Омӯзиши забонҳои хориҷӣ",
                    "ru": "Изучение иностранных языков",
                    "en": "Studying foreign languages"
                },
                "keywords": [
                    "забон",
                    "хориҷ",
                    "тарҷум",
                    "лингвист"
                ]
            },
            {
                "text": {
                    "tj": "Журналистика ва навиштани мақолаҳо",
                    "ru": "Журналистика и написание статей",
                    "en": "Journalism and article writing"
                },
                "keywords": [
                    "журналист",
                    "рӯзном",
                    "мақола"
                ]
            },
            {
                "text": {
                    "tj": "Санъати тасвирӣ ва дизайн",
                    "ru": "Изобразительное искусство и дизайн",
                    "en": "Fine arts and design"
                },
                "keywords": [
                    "дизайн",
                    "расм",
                    "санъат"
                ]
            },
            {
                "text": {
                    "tj": "Омӯзгорӣ ва тарбия",
                    "ru": "Преподавание и воспитание",
                    "en": "Teaching and education"
                },
                "keywords": [
                    "омӯз",
                    "муаллим",
                    "тарбия",
                    "педагог"
                ]
            }
        ]
    },
    {
        "id": "sp_c3_2",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c3",
        "question": {
            "tj": "Шумо фикрҳои худро чӣ гуна баён мекунед?",
            "ru": "Как вы выражаете свои мысли?",
            "en": "How do you express your thoughts?"
        },
        "options": [
            {
                "text": {
                    "tj": "Тавассути суханронӣ ва мубоҳиса",
                    "ru": "Через выступления и дебаты",
                    "en": "Through speaking and debates"
                },
                "keywords": [
                    "сухан",
                    "оратор",
                    "журналист"
                ]
            },
            {
                "text": {
                    "tj": "Тавассути навиштани ҳикояҳо ё шеър",
                    "ru": "Через написание рассказов или стихов",
                    "en": "Through writing stories or poetry"
                },
                "keywords": [
                    "адабиёт",
                    "нависанд",
                    "шеър"
                ]
            },
            {
                "text": {
                    "tj": "Тавассути расмкашӣ ё видео",
                    "ru": "Через рисование или видео",
                    "en": "Through drawing or video"
                },
                "keywords": [
                    "расм",
                    "видео",
                    "режиссёр"
                ]
            },
            {
                "text": {
                    "tj": "Тавассути тарҷума ба забонҳои дигар",
                    "ru": "Через перевод на другие языки",
                    "en": "Through translating to other languages"
                },
                "keywords": [
                    "тарҷум",
                    "забон"
                ]
            }
        ]
    },
    {
        "id": "sp_c3_3",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c3",
        "question": {
            "tj": "Муҳити кории орзуи шумо кадом аст?",
            "ru": "Какая ваша работа мечты?",
            "en": "What is your dream work environment?"
        },
        "options": [
            {
                "text": {
                    "tj": "Мактаб ё донишгоҳ",
                    "ru": "Школа или университет",
                    "en": "School or university"
                },
                "keywords": [
                    "мактаб",
                    "донишгоҳ",
                    "педагог"
                ]
            },
            {
                "text": {
                    "tj": "Студияи телевизион ё радио",
                    "ru": "Студия телевидения или радио",
                    "en": "TV or radio studio"
                },
                "keywords": [
                    "телевизион",
                    "радио",
                    "медиа"
                ]
            },
            {
                "text": {
                    "tj": "Ширкати байналмилалӣ ва сафарҳо",
                    "ru": "Международная компания и путешествия",
                    "en": "International company and travel"
                },
                "keywords": [
                    "байналмилал",
                    "тарҷум",
                    "сафар"
                ]
            },
            {
                "text": {
                    "tj": "Студияи эҷодӣ ва галерея",
                    "ru": "Творческая студия и галерея",
                    "en": "Creative studio and gallery"
                },
                "keywords": [
                    "галерея",
                    "санъат",
                    "дизайн"
                ]
            }
        ]
    },
    {
        "id": "sp_c3_4",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c3",
        "question": {
            "tj": "Шумо кадом малакаро рушд додан мехоҳед?",
            "ru": "Какой навык вы хотите развить?",
            "en": "Which skill do you want to develop?"
        },
        "options": [
            {
                "text": {
                    "tj": "Маҳорати тарҷума ва муоширати бисёрзабона",
                    "ru": "Навык перевода и многоязычного общения",
                    "en": "Translation and multilingual communication"
                },
                "keywords": [
                    "забон",
                    "тарҷум",
                    "лингвист"
                ]
            },
            {
                "text": {
                    "tj": "Психологияи кӯдак ва методикаи таълим",
                    "ru": "Детская психология и методика преподавания",
                    "en": "Child psychology and teaching methodology"
                },
                "keywords": [
                    "псих",
                    "кӯдак",
                    "таълим"
                ]
            },
            {
                "text": {
                    "tj": "Маҳорати мусоҳиба ва таҳрир",
                    "ru": "Навык интервью и редактирования",
                    "en": "Interviewing and editing skills"
                },
                "keywords": [
                    "мусоҳиба",
                    "таҳрир",
                    "журналист"
                ]
            },
            {
                "text": {
                    "tj": "Эҷодкории визуалӣ ва графики компютерӣ",
                    "ru": "Визуальное творчество и компьютерная графика",
                    "en": "Visual creativity and computer graphics"
                },
                "keywords": [
                    "графика",
                    "визуал",
                    "дизайн"
                ]
            }
        ]
    },
    {
        "id": "sp_c3_5",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c3",
        "question": {
            "tj": "Кадом нақш ба шумо бештар мувофиқ аст?",
            "ru": "Какая роль вам больше подходит?",
            "en": "Which role suits you best?"
        },
        "options": [
            {
                "text": {
                    "tj": "Тарҷумон ё робита бо хориҷа",
                    "ru": "Переводчик или связи с зарубежьем",
                    "en": "Translator or foreign relations"
                },
                "keywords": [
                    "тарҷум",
                    "хориҷ",
                    "забон"
                ]
            },
            {
                "text": {
                    "tj": "Омӯзгор, мураббӣ ё равоншинос",
                    "ru": "Учитель, наставник или психолог",
                    "en": "Teacher, mentor, or psychologist"
                },
                "keywords": [
                    "муаллим",
                    "мурабб",
                    "равон"
                ]
            },
            {
                "text": {
                    "tj": "Дизайнер, рассом ё архитектор",
                    "ru": "Дизайнер, художник или архитектор",
                    "en": "Designer, artist, or architect"
                },
                "keywords": [
                    "расм",
                    "дизайн",
                    "меъмор"
                ]
            },
            {
                "text": {
                    "tj": "Хабарнигор, наттоқ ё блогер",
                    "ru": "Журналист, диктор или блогер",
                    "en": "Journalist, anchor, or blogger"
                },
                "keywords": [
                    "хабар",
                    "блог",
                    "медиа"
                ]
            }
        ]
    },
    {
        "id": "sp_c4_1",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c4",
        "question": {
            "tj": "Дар соҳаи ҳуқуқ ва ҷомеа шумо чӣ кор кардан мехоҳед?",
            "ru": "Что вы хотите делать в сфере права и общества?",
            "en": "What do you want to do in law and society?"
        },
        "options": [
            {
                "text": {
                    "tj": "Таъмини адолат ва муҳофизати ҳуқуқ",
                    "ru": "Обеспечение справедливости и защита прав",
                    "en": "Ensuring justice and protecting rights"
                },
                "keywords": [
                    "ҳуқуқ",
                    "адолат",
                    "суд",
                    "адвокат"
                ]
            },
            {
                "text": {
                    "tj": "Таҳлили ҷомеа ва ҳалли мушкилоти иҷтимоӣ",
                    "ru": "Анализ общества и решение соц. проблем",
                    "en": "Society analysis and solving social issues"
                },
                "keywords": [
                    "ҷомеа",
                    "сотсиолог",
                    "иҷтимо"
                ]
            },
            {
                "text": {
                    "tj": "Идоракунии давлатӣ ва сиёсат",
                    "ru": "Государственное управление и политика",
                    "en": "Public administration and politics"
                },
                "keywords": [
                    "давлат",
                    "сиёсат",
                    "идора"
                ]
            },
            {
                "text": {
                    "tj": "Амният ва мудофиаи кишвар",
                    "ru": "Безопасность и оборона страны",
                    "en": "National security and defense"
                },
                "keywords": [
                    "амният",
                    "гумрук",
                    "мудофиа",
                    "полис"
                ]
            }
        ]
    },
    {
        "id": "sp_c4_2",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c4",
        "question": {
            "tj": "Дар ҳолатҳои мураккаб шумо чӣ гуна амал мекунед?",
            "ru": "Как вы действуете в сложных ситуациях?",
            "en": "How do you act in complex situations?"
        },
        "options": [
            {
                "text": {
                    "tj": "Қонун ва қоидаҳоро ба таври қатъӣ риоя мекунам",
                    "ru": "Строго соблюдаю законы и правила",
                    "en": "Strictly observe laws and rules"
                },
                "keywords": [
                    "қонун",
                    "ҳуқуқ",
                    "прокурор"
                ]
            },
            {
                "text": {
                    "tj": "Кӯшиш мекунам муросо ва сулҳ кунам",
                    "ru": "Стараюсь найти компромисс и примирить",
                    "en": "Try to find compromise and make peace"
                },
                "keywords": [
                    "дипломат",
                    "сотсиолог",
                    "сулҳ"
                ]
            },
            {
                "text": {
                    "tj": "Стратегия месозам ва роҳбарӣ мекунам",
                    "ru": "Строю стратегию и руковожу",
                    "en": "Build strategy and lead"
                },
                "keywords": [
                    "сиёсат",
                    "стратег",
                    "роҳбар"
                ]
            },
            {
                "text": {
                    "tj": "Сабабҳои психологиро меомӯзам",
                    "ru": "Изучаю психологические причины",
                    "en": "Study psychological causes"
                },
                "keywords": [
                    "псих",
                    "равон",
                    "ҷомеа"
                ]
            }
        ]
    },
    {
        "id": "sp_c4_3",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c4",
        "question": {
            "tj": "Шумо бо кӣ бештар кор кардан мехоҳед?",
            "ru": "С кем вы хотите работать больше всего?",
            "en": "Who do you want to work with the most?"
        },
        "options": [
            {
                "text": {
                    "tj": "Бо шаҳрвандон, барои ҳалли ҳуқуқии онҳо",
                    "ru": "С гражданами, для решения их правовых проблем",
                    "en": "With citizens, solving legal issues"
                },
                "keywords": [
                    "шаҳрванд",
                    "адвокат",
                    "ҳуқуқ"
                ]
            },
            {
                "text": {
                    "tj": "Бо гурӯҳҳои осебпазир ва ниёзманд",
                    "ru": "С уязвимыми и нуждающимися группами",
                    "en": "With vulnerable and needy groups"
                },
                "keywords": [
                    "иҷтимо",
                    "ёрӣ",
                    "социал"
                ]
            },
            {
                "text": {
                    "tj": "Бо намояндагони кишварҳои дигар",
                    "ru": "С представителями других стран",
                    "en": "With representatives of other countries"
                },
                "keywords": [
                    "байналмилал",
                    "дипломат",
                    "хориҷ"
                ]
            },
            {
                "text": {
                    "tj": "Бо ҷинояткорон ё тафтишоти парвандаҳо",
                    "ru": "С преступниками или расследованием дел",
                    "en": "With criminals or case investigations"
                },
                "keywords": [
                    "тафтиш",
                    "ҷиноят",
                    "криминал"
                ]
            }
        ]
    },
    {
        "id": "sp_c4_4",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c4",
        "question": {
            "tj": "Кадом намуди ҳуҷҷатҳо барои шумо ҷолиб аст?",
            "ru": "Какой вид документов вам интересен?",
            "en": "What type of documents is interesting to you?"
        },
        "options": [
            {
                "text": {
                    "tj": "Кодексҳо, шартномаҳо ва қонунҳо",
                    "ru": "Кодексы, договоры и законы",
                    "en": "Codes, contracts, and laws"
                },
                "keywords": [
                    "кодекс",
                    "шартнома",
                    "ҳуқуқ"
                ]
            },
            {
                "text": {
                    "tj": "Анкетаҳо ва пурсишномаҳои сотсиологӣ",
                    "ru": "Анкеты и социологические опросники",
                    "en": "Surveys and sociological questionnaires"
                },
                "keywords": [
                    "пурсиш",
                    "сотсиолог",
                    "омор"
                ]
            },
            {
                "text": {
                    "tj": "Шартномаҳои байналмилалӣ ва гумрукӣ",
                    "ru": "Международные и таможенные договоры",
                    "en": "International and customs treaties"
                },
                "keywords": [
                    "байналмилал",
                    "гумрук",
                    "савдо"
                ]
            },
            {
                "text": {
                    "tj": "Санадҳои давлатӣ ва лоиҳаҳои миллӣ",
                    "ru": "Государственные акты и нац. проекты",
                    "en": "State acts and national projects"
                },
                "keywords": [
                    "давлат",
                    "милл",
                    "сиёсат"
                ]
            }
        ]
    },
    {
        "id": "sp_c4_5",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c4",
        "question": {
            "tj": "Ҳадафи асосии шумо дар касб чист?",
            "ru": "Какова ваша главная цель в профессии?",
            "en": "What is your main goal in your profession?"
        },
        "options": [
            {
                "text": {
                    "tj": "Адолат ва тартибот дар ҷомеа",
                    "ru": "Справедливость и порядок в обществе",
                    "en": "Justice and order in society"
                },
                "keywords": [
                    "адолат",
                    "тартиб",
                    "ҳуқуқ"
                ]
            },
            {
                "text": {
                    "tj": "Муносибатҳои байналмилалӣ ва дипломатия",
                    "ru": "Международные отношения и дипломатия",
                    "en": "International relations and diplomacy"
                },
                "keywords": [
                    "дипломат",
                    "байналмилал"
                ]
            },
            {
                "text": {
                    "tj": "Идоракунии муваффақонаи шаҳр ё давлат",
                    "ru": "Успешное управление городом или страной",
                    "en": "Successful city or state management"
                },
                "keywords": [
                    "идора",
                    "давлат",
                    "шаҳр"
                ]
            },
            {
                "text": {
                    "tj": "Кӯмак ба инсонҳо ва таҳлили рафтор",
                    "ru": "Помощь людям и анализ поведения",
                    "en": "Helping people and analyzing behavior"
                },
                "keywords": [
                    "кӯмак",
                    "рафтор",
                    "псих"
                ]
            }
        ]
    },
    {
        "id": "sp_c5_1",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c5",
        "question": {
            "tj": "Дар соҳаи тиб ва биология кадом самт маъқул аст?",
            "ru": "Какое направление в медицине и биологии вам нравится?",
            "en": "Which area in medicine and biology do you like?"
        },
        "options": [
            {
                "text": {
                    "tj": "Табобати бевоситаи беморон (Клиника)",
                    "ru": "Непосредственное лечение пациентов",
                    "en": "Direct patient treatment"
                },
                "keywords": [
                    "табобат",
                    "клиник",
                    "духтур",
                    "бемор"
                ]
            },
            {
                "text": {
                    "tj": "Таҳқиқоти лабораторӣ ва фармасевтика",
                    "ru": "Лабораторные исследования и фармацевтика",
                    "en": "Lab research and pharmaceuticals"
                },
                "keywords": [
                    "лаборат",
                    "фарма",
                    "дору",
                    "озмоиш"
                ]
            },
            {
                "text": {
                    "tj": "Биология, экология ва табиат",
                    "ru": "Биология, экология и природа",
                    "en": "Biology, ecology, and nature"
                },
                "keywords": [
                    "эколог",
                    "биолог",
                    "табиат",
                    "ҳайвон"
                ]
            },
            {
                "text": {
                    "tj": "Варзиш, фитнес ва тарбияи ҷисмонӣ",
                    "ru": "Спорт, фитнес и физическое воспитание",
                    "en": "Sports, fitness, and physical education"
                },
                "keywords": [
                    "варзиш",
                    "фитнес",
                    "ҷисм"
                ]
            }
        ]
    },
    {
        "id": "sp_c5_2",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c5",
        "question": {
            "tj": "Шумо бештар дар куҷо кор кардан мехоҳед?",
            "ru": "Где вы хотите работать больше всего?",
            "en": "Where do you want to work the most?"
        },
        "options": [
            {
                "text": {
                    "tj": "Беморхона ё маркази тиббӣ",
                    "ru": "Больница или медцентр",
                    "en": "Hospital or medical center"
                },
                "keywords": [
                    "беморхона",
                    "тибб",
                    "ҷарроҳ"
                ]
            },
            {
                "text": {
                    "tj": "Лабораторияи илмӣ ё заводи доруворӣ",
                    "ru": "Научная лаборатория или фармзавод",
                    "en": "Science lab or pharma factory"
                },
                "keywords": [
                    "лаборат",
                    "дору",
                    "завод"
                ]
            },
            {
                "text": {
                    "tj": "Дар табиат, бо наботот ё ҳайвонот",
                    "ru": "На природе, с растениями или животными",
                    "en": "In nature, with plants or animals"
                },
                "keywords": [
                    "наботот",
                    "ҳайвон",
                    "зоолог",
                    "табиат"
                ]
            },
            {
                "text": {
                    "tj": "Толори варзишӣ ё маркази солимгардонӣ",
                    "ru": "Спортзал или оздоровительный центр",
                    "en": "Gym or wellness center"
                },
                "keywords": [
                    "варзиш",
                    "толор",
                    "солим"
                ]
            }
        ]
    },
    {
        "id": "sp_c5_3",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c5",
        "question": {
            "tj": "Муносибати шумо бо хун ва ҷарроҳӣ чӣ гуна аст?",
            "ru": "Как вы относитесь к крови и хирургии?",
            "en": "How do you feel about blood and surgery?"
        },
        "options": [
            {
                "text": {
                    "tj": "Ман омодаам ҷарроҳӣ кунам (шавқовар аст)",
                    "ru": "Я готов оперировать (это интересно)",
                    "en": "I am ready to operate (it is interesting)"
                },
                "keywords": [
                    "ҷарроҳ",
                    "хун",
                    "анатом"
                ]
            },
            {
                "text": {
                    "tj": "Ман табобат бо доруҳоро авлотар медонам",
                    "ru": "Я предпочитаю лечение лекарствами",
                    "en": "I prefer treatment with medicine"
                },
                "keywords": [
                    "терапевт",
                    "дору",
                    "фарма"
                ]
            },
            {
                "text": {
                    "tj": "Ман таҳқиқоти микроскопӣ ва вирусҳоро дӯст медорам",
                    "ru": "Я люблю микроскопические исследования",
                    "en": "I love microscopic research"
                },
                "keywords": [
                    "микроскоп",
                    "вирус",
                    "бактери"
                ]
            },
            {
                "text": {
                    "tj": "Ман ба саломатии умумӣ ва варзиш таваҷҷӯҳ дорам",
                    "ru": "Я интересуюсь общим здоровьем и спортом",
                    "en": "I am interested in general health and sports"
                },
                "keywords": [
                    "варзиш",
                    "фитнес",
                    "саломат"
                ]
            }
        ]
    },
    {
        "id": "sp_c5_4",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c5",
        "question": {
            "tj": "Агар шумо як ихтироъ мекардед, он чӣ мешуд?",
            "ru": "Если бы вы что-то изобрели, что бы это было?",
            "en": "If you invented something, what would it be?"
        },
        "options": [
            {
                "text": {
                    "tj": "Усули нави табобати бемории душвор",
                    "ru": "Новый метод лечения сложной болезни",
                    "en": "New method to treat a difficult disease"
                },
                "keywords": [
                    "табобат",
                    "клиник",
                    "духтур"
                ]
            },
            {
                "text": {
                    "tj": "Доруи нав ё ваксина",
                    "ru": "Новое лекарство или вакцина",
                    "en": "New medicine or vaccine"
                },
                "keywords": [
                    "дору",
                    "ваксина",
                    "фарма"
                ]
            },
            {
                "text": {
                    "tj": "Технологияи тоза кардани ҳаво ва об",
                    "ru": "Технология очистки воздуха и воды",
                    "en": "Air and water purification tech"
                },
                "keywords": [
                    "эколог",
                    "ҳаво",
                    "об",
                    "муҳит"
                ]
            },
            {
                "text": {
                    "tj": "Методикаи нави машқ барои варзишгарон",
                    "ru": "Новая методика тренировок для спортсменов",
                    "en": "New training method for athletes"
                },
                "keywords": [
                    "машқ",
                    "варзиш",
                    "тренер"
                ]
            }
        ]
    },
    {
        "id": "sp_c5_5",
        part: QuizPart.SPECIALTY,
        "type": "refinement",
        "targetCluster": "c5",
        "question": {
            "tj": "Шумо бештар ба кадом фанни мактабӣ шавқ доштед?",
            "ru": "Какой школьный предмет вам был наиболее интересен?",
            "en": "Which school subject interested you the most?"
        },
        "options": [
            {
                "text": {
                    "tj": "Анатомия ва физиология",
                    "ru": "Анатомия и физиология",
                    "en": "Anatomy and physiology"
                },
                "keywords": [
                    "анатом",
                    "физиолог",
                    "инсон"
                ]
            },
            {
                "text": {
                    "tj": "Химия ва тайёр кардани маҳлулҳо",
                    "ru": "Химия и приготовление растворов",
                    "en": "Chemistry and making solutions"
                },
                "keywords": [
                    "хими",
                    "маҳлул",
                    "фарма"
                ]
            },
            {
                "text": {
                    "tj": "Ботаника, зоология ё география",
                    "ru": "Ботаника, зоология или география",
                    "en": "Botany, zoology, or geography"
                },
                "keywords": [
                    "ботаника",
                    "зоолог",
                    "табиат"
                ]
            },
            {
                "text": {
                    "tj": "Тарбияи ҷисмонӣ",
                    "ru": "Физическая культура",
                    "en": "Physical education"
                },
                "keywords": [
                    "варзиш",
                    "физкультур"
                ]
            }
        ]
    }
,
    {
        id: 'mmt1', part: QuizPart.MMT, type: 'scenario',
        question: {
            tj: 'Рӯзи истироҳат аст. Бо кадом кор вақт зуд мегузарад?',
            ru: 'Выходной день. За каким занятием время летит быстрее всего?',
            en: 'It is a day off. Which activity makes time fly for you?',
        },
        options: [
            { text: { tj: 'Китоб мехонам, менависам ё сурат мекашам', ru: 'Читаю, пишу или рисую', en: 'Reading, writing or drawing' }, scores: { c3: 4 } },
            { text: { tj: 'Чизе месозам ё дар компютер меозмоям', ru: 'Что-то собираю или пробую на компьютере', en: 'Building something or tinkering on a computer' }, scores: { c1: 4 } },
            { text: { tj: 'Варзиш мекунам ё дар бораи бадани инсон мехонам', ru: 'Занимаюсь спортом или читаю о теле человека', en: 'Doing sport or reading about the human body' }, scores: { c5: 4 } },
            { text: { tj: 'Ҳисоб мекунам: чӣ харам, чӣ фурӯшам', ru: 'Считаю: что купить, что продать', en: 'Working out what to buy and what to sell' }, scores: { c2: 4 } },
            { text: { tj: 'Бо одамон баҳс мекунам ва ҳақиқатро меёбам', ru: 'Спорю с людьми и ищу правду', en: 'Debating with people and finding the truth' }, scores: { c4: 4 } },
        ],
    },
    {
        id: 'mmt2', part: QuizPart.MMT, type: 'environment',
        question: {
            tj: 'Дар мактаб кадом дарс барои шумо зуд мегузарад?',
            ru: 'Какой урок в школе для вас проходит быстрее всего?',
            en: 'Which school lesson goes by fastest for you?',
        },
        options: [
            { text: { tj: 'География ва иқтисод', ru: 'География и экономика', en: 'Geography and economics' }, scores: { c2: 4 } },
            { text: { tj: 'Биология, химия, тарбияи ҷисмонӣ', ru: 'Биология, химия, физкультура', en: 'Biology, chemistry, PE' }, scores: { c5: 4 } },
            { text: { tj: 'Математика, физика, информатика', ru: 'Математика, физика, информатика', en: 'Maths, physics, computing' }, scores: { c1: 4 } },
            { text: { tj: 'Таърих ва ҷомеашиносӣ', ru: 'История и обществознание', en: 'History and social studies' }, scores: { c4: 4 } },
            { text: { tj: 'Забон, адабиёт ва санъат', ru: 'Язык, литература и искусство', en: 'Language, literature and art' }, scores: { c3: 4 } },
        ],
    },
    {
        id: 'mmt3', part: QuizPart.MMT, type: 'motivation',
        question: {
            tj: 'Дӯстатон ба мушкилӣ афтод. Шумо аввал чӣ мекунед?',
            ru: 'У друга беда. Что вы сделаете первым делом?',
            en: 'A friend is in trouble. What do you do first?',
        },
        options: [
            { text: { tj: 'Роҳи амалии ҳалро пешниҳод мекунам', ru: 'Предложу практическое решение', en: 'Offer a practical solution' }, scores: { c1: 4 } },
            { text: { tj: 'Ҳимояш мекунам ва ҳаққашро металабам', ru: 'Защищу его и буду добиваться справедливости', en: 'Stand up for them and demand fairness' }, scores: { c4: 4 } },
            { text: { tj: 'Гӯш мекунам ва рӯҳашро мебардорам', ru: 'Выслушаю и поддержу', en: 'Listen and lift their spirits' }, scores: { c3: 4 } },
            { text: { tj: 'Аввал мепурсам, ки саломатиаш чӣ хел аст', ru: 'Сначала спрошу о здоровье', en: 'First ask how they are feeling' }, scores: { c5: 4 } },
            { text: { tj: 'Ҳисоб мекунам, чӣ қадар маблағ лозим аст', ru: 'Посчитаю, сколько нужно денег', en: 'Work out how much money is needed' }, scores: { c2: 4 } },
        ],
    },
    {
        id: 'mmt4', part: QuizPart.MMT, type: 'motivation',
        question: {
            tj: 'Кадом видеоро дар интернет то охир мебинед?',
            ru: 'Какое видео в интернете вы досмотрите до конца?',
            en: 'Which kind of video do you watch to the end?',
        },
        options: [
            { text: { tj: 'Дар бораи бадани инсон, ҳайвонот ё варзиш', ru: 'О теле человека, животных или спорте', en: 'About the human body, animals or sport' }, scores: { c5: 4 } },
            { text: { tj: 'Дар бораи филм, мусиқӣ ё таърихи фарҳанг', ru: 'О кино, музыке или истории культуры', en: 'About film, music or cultural history' }, scores: { c3: 4 } },
            { text: { tj: 'Дар бораи техника, робот ё барномасозӣ', ru: 'О технике, роботах или программировании', en: 'About tech, robots or programming' }, scores: { c1: 4 } },
            { text: { tj: 'Дар бораи пул, бизнес ва савдо', ru: 'О деньгах, бизнесе и торговле', en: 'About money, business and trade' }, scores: { c2: 4 } },
            { text: { tj: 'Дар бораи қонун, ҷомеа ва воқеаҳои дунё', ru: 'О законе, обществе и событиях в мире', en: 'About law, society and world events' }, scores: { c4: 4 } },
        ],
    },
    {
        id: 'mmt5', part: QuizPart.MMT, type: 'scenario',
        question: {
            tj: 'Фикри худро чӣ тавр беҳтар мефаҳмонед?',
            ru: 'Как вам проще всего объяснить свою мысль?',
            en: 'How do you explain your idea best?',
        },
        options: [
            { text: { tj: 'Далел меорам ва исбот мекунам', ru: 'Привожу аргументы и доказываю', en: 'Give arguments and prove the point' }, scores: { c4: 4 } },
            { text: { tj: 'Нақша мекашам ё бо рақам нишон медиҳам', ru: 'Черчу схему или показываю цифрами', en: 'Draw a diagram or show it with numbers' }, scores: { c1: 4 } },
            { text: { tj: 'Менависам ё бо сухан мефаҳмонам', ru: 'Пишу или объясняю словами', en: 'Write it down or explain it in words' }, scores: { c3: 4 } },
            { text: { tj: 'Ҷадвал ва ҳисоб нишон медиҳам', ru: 'Показываю таблицу и расчёт', en: 'Show a table and the maths' }, scores: { c2: 4 } },
            { text: { tj: 'Бо мисоли зинда ва таҷриба нишон медиҳам', ru: 'Показываю на живом примере и опыте', en: 'Show it with a live example or experiment' }, scores: { c5: 4 } },
        ],
    },
    {
        id: 'mmt6', part: QuizPart.MMT, type: 'motivation',
        question: {
            tj: 'Агар як мушкили Тоҷикистонро ҳал карда метавонистед, кадомашро?',
            ru: 'Если бы вы могли решить одну проблему Таджикистана — какую?',
            en: 'If you could solve one problem in Tajikistan, which one?',
        },
        options: [
            { text: { tj: 'Бекорӣ ва камбизоатӣ', ru: 'Безработицу и бедность', en: 'Unemployment and poverty' }, scores: { c2: 4 } },
            { text: { tj: 'Барқ, роҳ ва технологияи кӯҳна', ru: 'Электричество, дороги и устаревшие технологии', en: 'Power, roads and outdated technology' }, scores: { c1: 4 } },
            { text: { tj: 'Бемориҳо ва саломатии мардум', ru: 'Болезни и здоровье людей', en: 'Illness and public health' }, scores: { c5: 4 } },
            { text: { tj: 'Беадолатӣ ва вайронкунии қонун', ru: 'Несправедливость и нарушение закона', en: 'Injustice and broken laws' }, scores: { c4: 4 } },
            { text: { tj: 'Гум шудани забон ва фарҳанги мо', ru: 'Утрату нашего языка и культуры', en: 'The loss of our language and culture' }, scores: { c3: 4 } },
        ],
    },
    {
        id: 'mmt7', part: QuizPart.MMT, type: 'scenario',
        question: {
            tj: 'Кадом бозӣ ба шумо бештар маъқул аст?',
            ru: 'Какая игра вам больше нравится?',
            en: 'Which kind of game do you enjoy most?',
        },
        options: [
            { text: { tj: 'Муаммоҳои мантиқӣ ва рақамӣ', ru: 'Логические и числовые головоломки', en: 'Logic and number puzzles' }, scores: { c1: 4 } },
            { text: { tj: 'Бозиҳои ҳаракатӣ ва варзишӣ', ru: 'Подвижные и спортивные игры', en: 'Active and sporting games' }, scores: { c5: 4 } },
            { text: { tj: 'Бозиҳое, ки дар онҳо шаҳр ё ширкат месозед', ru: 'Игры, где строишь город или компанию', en: 'Games where you build a city or a company' }, scores: { c2: 4 } },
            { text: { tj: 'Бозиҳои калимавӣ ва ҳикоявӣ', ru: 'Словесные и сюжетные игры', en: 'Word and story games' }, scores: { c3: 4 } },
            { text: { tj: 'Бозиҳои детективӣ — кӣ гунаҳкор аст?', ru: 'Детективные игры — кто виноват?', en: 'Detective games — who is guilty?' }, scores: { c4: 4 } },
        ],
    },
    {
        id: 'mmt8', part: QuizPart.MMT, type: 'environment',
        question: {
            tj: 'Дар кори гурӯҳӣ шумо одатан кӣ мешавед?',
            ru: 'Кем вы обычно становитесь в командной работе?',
            en: 'What role do you usually take in a team?',
        },
        options: [
            { text: { tj: 'Он ки матн менависад ва зебо мекунад', ru: 'Тем, кто пишет текст и делает красиво', en: 'The one who writes the text and makes it look good' }, scores: { c3: 4 } },
            { text: { tj: 'Он ки гурӯҳро ҷамъ мекунад ва роҳбарӣ мекунад', ru: 'Тем, кто собирает команду и ведёт её', en: 'The one who gathers the team and leads' }, scores: { c4: 4 } },
            { text: { tj: 'Он ки худи корро месозад', ru: 'Тем, кто делает саму работу', en: 'The one who actually builds it' }, scores: { c1: 4 } },
            { text: { tj: 'Он ки ҳисоб ва нақшаро мебарад', ru: 'Тем, кто ведёт расчёты и план', en: 'The one who runs the numbers and the plan' }, scores: { c2: 4 } },
            { text: { tj: 'Он ки маълумот меҷӯяд ва месанҷад', ru: 'Тем, кто ищет и проверяет данные', en: 'The one who finds and checks the facts' }, scores: { c5: 4 } },
        ],
    },
    {
        id: 'mmt9', part: QuizPart.MMT, type: 'motivation',
        question: {
            tj: 'Кадом хислати худро бештар қадр мекунед?',
            ru: 'Какое своё качество вы цените больше всего?',
            en: 'Which of your own traits do you value most?',
        },
        options: [
            { text: { tj: 'Меҳрубонӣ ва диққат ба ҷузъиёт', ru: 'Доброту и внимание к деталям', en: 'Kindness and attention to detail' }, scores: { c5: 4 } },
            { text: { tj: 'Ақли мантиқӣ ва дасти моҳир', ru: 'Логику и умелые руки', en: 'Logical thinking and skilled hands' }, scores: { c1: 4 } },
            { text: { tj: 'Хаёли бой ва эҷодкорӣ', ru: 'Богатое воображение и творчество', en: 'Imagination and creativity' }, scores: { c3: 4 } },
            { text: { tj: 'Ҳисобкорӣ ва дурандешӣ', ru: 'Расчётливость и дальновидность', en: 'Being calculating and far-sighted' }, scores: { c2: 4 } },
            { text: { tj: 'Ростқавлӣ ва ҷасорат', ru: 'Честность и смелость', en: 'Honesty and courage' }, scores: { c4: 4 } },
        ],
    },
    {
        id: 'mmt10', part: QuizPart.MMT, type: 'motivation',
        question: {
            tj: 'Баъди 10 сол дар бораи шумо чӣ гӯянд?',
            ru: 'Что скажут о вас через 10 лет?',
            en: 'What will people say about you in 10 years?',
        },
        options: [
            { text: { tj: '«Ӯ кори худро кушод ва одамонро ба кор гирифт»', ru: '«Он открыл своё дело и дал людям работу»', en: '"They started a business and gave people jobs"' }, scores: { c2: 4 } },
            { text: { tj: '«Ӯ чизе сохт, ки одамон то ҳол мехонанд ва мебинанд»', ru: '«Он создал то, что люди читают и смотрят до сих пор»', en: '"They made something people still read and watch"' }, scores: { c3: 4 } },
            { text: { tj: '«Ӯ чизе сохт, ки кори ҳамаро осон кард»', ru: '«Он сделал то, что упростило жизнь всем»', en: '"They built something that made life easier"' }, scores: { c1: 4 } },
            { text: { tj: '«Ӯ ба одамон дар ёфтани ҳақиқат кӯмак кард»', ru: '«Он помог людям добиться правды»', en: '"They helped people find justice"' }, scores: { c4: 4 } },
            { text: { tj: '«Ӯ ҳаёти одамонро наҷот дод»', ru: '«Он спасал жизни»', en: '"They saved lives"' }, scores: { c5: 4 } },
        ],
    }
];
