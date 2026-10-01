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

import { MMT_QUESTIONS } from './questions-mmt';

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
                                        "информ",
                    "кибер",
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
                    "механик",
                    "механика",
                    "конструкт",
                    "мошинсоз",
                    "дастгоҳ"
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
                    "псих",
                    "реклам",
                    "сервис",
                    "тиҷорат"
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
                    "логист",
                    "тиҷорат",
                    "гумрук",
                    "бозор"
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
                    "коммуникатсия",
                    "сервис",
                    "маркет",
                    "реклам",
                    "хизмат",
                    "тиҷорат"
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
                    "журналист",
                    "рӯзноманиг",
                    "актёр",
                    "радио",
                    "телевиз"
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
                    "режиссёр",
                    "телеоператор",
                    "режисс",
                    "санъат",
                    "ороиш",
                    "дизайн",
                    "графика"
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
                    "медиа",
                    "телеоператор",
                    "режисс",
                    "рӯзноманиг"
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
                    "журналист",
                    "рӯзноманиг",
                    "нашриёт",
                    "китоб"
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
                    "равон",
                    "педагог",
                    "таҳсилот",
                    "таълим",
                    "омӯзгор",
                    "олигофрен",
                    "сурдопедагог",
                    "психолог"
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
                    "медиа",
                    "рӯзноманиг",
                    "радио",
                    "телевиз",
                    "журналист",
                    "web"
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
                    "полис",
                    "ҳифзи",
                    "суд",
                    "прокурор"
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
                    "сулҳ",
                    "муносибат",
                    "консул",
                    "минтақа"
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
                    "социал",
                    "психолог",
                    "оилав"
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
                    "криминал",
                    "суд",
                    "прокурор",
                    "муфаттиш",
                    "ҳифзи",
                    "киберҷиноят",
                    "санҷиш"
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
                    "омор",
                    "иҷтимо",
                    "психолог"
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
                    "табиат",
                    "агроном",
                    "зоотех",
                    "байтор",
                    "биолог",
                    "дендролог",
                    "эколог",
                    "паррандапарвар",
                    "меваю",
                    "ҷангал",
                    "энтомолог",
                    "растан",
                    "марғзор",
                    "занбӯр",
                    "харгӯш",
                    "селексия",
                    "биоэколог"
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
                    "солим",
                    "ҷисм"
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
                    "анатом",
                    "табобат",
                    "стоматолог",
                    "дандон",
                    "педиатр",
                    "момодо",
                    "ҳамшира",
                    "тиббию",
                    "тиббӣ"
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
                    "бактери",
                    "биохим",
                    "биофиз",
                    "биотехнолог",
                    "ташхис",
                    "лаборат",
                    "микробиолог",
                    "биологӣ"
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
                    "саломат",
                    "ҷисм",
                    "офият",
                    "профилакт"
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
                    "инсон",
                    "табобат",
                    "стоматолог",
                    "дандон",
                    "педиатр",
                    "момодо",
                    "ҳамшира",
                    "тиббию",
                    "тиббӣ"
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
                    "табиат",
                    "агроном",
                    "зоотех",
                    "байтор",
                    "биолог",
                    "дендролог",
                    "эколог",
                    "паррандапарвар",
                    "меваю",
                    "ҷангал",
                    "энтомолог",
                    "растан",
                    "марғзор",
                    "занбӯр",
                    "харгӯш",
                    "селексия",
                    "биоэколог"
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
                    "физкультур",
                    "ҷисм"
                ]
            }
        ]
    }
];

// Қадами 1 — саволҳои нав (01.10.2026), алоҳида дар questions-mmt.ts.
QUIZ_QUESTIONS.push(...MMT_QUESTIONS);
