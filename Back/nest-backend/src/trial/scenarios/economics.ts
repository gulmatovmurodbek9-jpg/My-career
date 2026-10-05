import { Scenario } from '../trial.types';

const TABLE = {
    tj: { head: ['Мол', 'Фурӯхта шуд (моҳ)', 'Нархи харид', 'Нархи фурӯш'], rows: [['Нон', '300 дона', '3 сом.', '4 сом.'], ['Шир', '100 литр', '8 сом.', '10 сом.'], ['Шоколад', '30 дона', '12 сом.', '20 сом.'], ['Равған', '50 шиша', '28 сом.', '30 сом.']] },
    ru: { head: ['Товар', 'Продано (месяц)', 'Цена закупки', 'Цена продажи'], rows: [['Хлеб', '300 шт.', '3 сом.', '4 сом.'], ['Молоко', '100 л', '8 сом.', '10 сом.'], ['Шоколад', '30 шт.', '12 сом.', '20 сом.'], ['Масло', '50 бут.', '28 сом.', '30 сом.']] },
    en: { head: ['Item', 'Sold (month)', 'Buy price', 'Sell price'], rows: [['Bread', '300 pcs', '3 som.', '4 som.'], ['Milk', '100 l', '8 som.', '10 som.'], ['Chocolate', '30 pcs', '12 som.', '20 som.'], ['Oil', '50 bottles', '28 som.', '30 som.']] },
};

export const ECONOMICS: Scenario = {
    family: 'economics',
    minutes: 10,
    keys: [
        { id: 't1', kind: 'choice', skill: 'hard', answer: 'd', related: ['2250135', '1250104'] },
        { id: 't2', kind: 'choice', skill: 'hard', answer: 'b', related: ['125010201', '1250102'] },
        { id: 't3', kind: 'choice', skill: 'soft', answer: 'c', related: ['1260202', '1260203'] },
    ],
    text: {
        tj: {
            role: 'Иқтисодчии мағоза',
            place: 'Хуҷанд · шабакаи мағозаҳо · соати 10:00',
            intro: 'Шумо иқтисодчии шабакаи мағозаҳои «Ҳамсоя» ҳастед. Соҳиб ҳисоботи моҳро мехоҳад: чӣ фоида дорад ва чӣ не.',
            tasks: [
                {
                    title: 'Кадом мол камтарин фоида медиҳад?',
                    prompt: 'Фурӯши моҳи гузашта:',
                    table: TABLE.tj,
                    question: 'Кадом мол ба мағоза камтарин фоида овард? (фоида = фурӯхташуда × (нархи фурӯш − нархи харид))',
                    options: [
                        { id: 'a', text: 'Нон', feedback: 'Нон арзонтарин аст, аммо бештарин фоидаро медиҳад: 300 × 1 = 300 сомонӣ.' },
                        { id: 'b', text: 'Шир', feedback: 'Шир: 100 × 2 = 200 сомонӣ — аз равған зиёдтар.' },
                        { id: 'c', text: 'Шоколад', feedback: 'Шоколад гаронтарин аст, аммо 30 × 8 = 240 сомонӣ медиҳад.' },
                        { id: 'd', text: 'Равған', feedback: 'Дуруст: 50 × 2 = 100 сомонӣ — камтарин, гарчанде нархаш баланд аст.' },
                    ],
                    skillName: "Кор бо рақамҳо",
                    steps: ["Аз ҳар мол чанд сомонӣ мемонад? Нон: 4 − 3 = 1. Равған: 30 − 28 = 2.", "Ба шумораи фурӯхташуда зарб кунед: нон 300 × 1 = 300, равған 50 × 2 = 100.", "Моли гарон на ҳамеша фоидаовар аст — муҳим он аст, ки чӣ қадар мефурӯшед."],
                    realLife: "Иқтисодчӣ ҳар моҳ ҳамин тавр ҳисоб мекунад ва мегӯяд: чиро бештар оварем, чиро камтар.",
                },
                {
                    title: 'Нархи нонро баланд кунем?',
                    prompt: 'Соҳиб мегӯяд:',
                    quote: 'Нархи нонро 5 сомонӣ мекунем — фоида зиёд мешавад!',
                    question: 'Соли гузашта мағозаи ҳамсоя ҳамин корро кард ва фурӯши нонаш аз 300 то 150 кам шуд. Агар бо мо ҳам ҳамин шавад, чӣ мешавад?',
                    options: [
                        { id: 'a', text: 'Фоида ду баробар мешавад', feedback: 'Фоида аз ҳар нон ду баробар мешавад — аммо харидорон ним мешаванд.' },
                        { id: 'b', text: 'Фоида ҳамон 300 мемонад, вале 150 мизоҷ ба ҷои дигар мераванд', feedback: 'Дуруст: 150 × (5 − 3) = 300. Фоида тағйир наёфт, вале мизоҷон рафтанд — ва ширу равғанро ҳам дигар аз мо намехаранд.' },
                        { id: 'c', text: 'Фоида кам мешавад', feedback: 'Ҳисоб кунед: 150 × 2 = 300 — ҳамон қадар.' },
                    ],
                    skillName: "Қарор аз рӯи маълумот",
                    steps: ["Нархи нав 5 сомонӣ: аз ҳар нон 5 − 3 = 2 сомонӣ мемонад.", "Аммо харидорон ним мешаванд: 150 × 2 = 300 — ҳамон фоидаи пештара.", "Ва 150 мизоҷ ба мағозаи дигар мераванд — шояд дигар барнагарданд."],
                    realLife: "Иқтисодчӣ пеш аз ҳар қарор мепурсад: «Агар ин корро кунем, баъд чӣ мешавад?»",
                },
                {
                    title: 'Ба соҳиб фаҳмонед',
                    prompt: 'Соҳиби мағоза 60-сола аст, ҷадвалҳоро дӯст намедорад ва аллакай қарор кардааст.',
                    question: 'Чӣ мекунед?',
                    options: [
                        { id: 'a', text: 'Ҷадвали Excel-и 5-саҳифагиро бо формулаҳо нишон медиҳам', feedback: 'Дуруст аст — аммо ӯ онро намехонад.' },
                        { id: 'b', text: '«Ман иқтисодчӣ ҳастам, ба ман бовар кунед.»', feedback: 'Унвон далел нест. Соҳиб ранҷида мешавад.' },
                        { id: 'c', text: '«Фоида ҳамон 300 мемонад, аммо 150 харидор ба ҳамсоя мераванд — ва ширу равғанро ҳам дар он ҷо мехаранд. Биёед аввал як ҳафта санҷем.»', feedback: 'Як ҷумла, як рақам ва як пешниҳоди бехатар. Рақамро ба забони одам гуфтан — малакаи асосии иқтисодчӣ.' },
                        { id: 'd', text: 'Розӣ мешавам, то ҷанҷол нашавад', feedback: 'Иқтисодчие, ки хаторо медонад ва хомӯш аст, кори худро намекунад.' },
                    ],
                    skillName: "Фаҳмонидани рақамҳо ба одамон",
                    steps: ["Ҷадвали калон нишон надиҳед — як рақами асосиро гӯед.", "Бигӯед, ки ин барои ӯ чӣ маъно дорад: «мизоҷон ба ҳамсоя мераванд».", "Роҳи бехатар пешниҳод кунед: «аввал як ҳафта санҷем»."],
                    realLife: "Иқтисодчии хуб на он аст, ки беҳтар ҳисоб мекунад, балки он ки дигаронро бовар кунонда метавонад.",
                },
            ],
            reality: [
                'Бисёр кор такрорӣ аст: воридкунии рақамҳо, тафтиши ҳисоботҳо ва ҷадвалҳо.',
                'Як хатои хурд (як сифр) метавонад ҳазорон сомонӣ арзад — диққат аз суръат муҳимтар аст.',
                'Мӯҳлатҳои ҳисобот (андоз, моҳона) сахтанд; Excel асбоби ҳаррӯза аст.',
            ],
        },
        ru: {
            role: 'Экономист магазина',
            place: 'Худжанд · сеть магазинов · 10:00',
            intro: 'Вы экономист сети магазинов «Хамсоя». Владелец хочет отчёт за месяц: что приносит прибыль, а что нет.',
            tasks: [
                {
                    title: 'Какой товар даёт меньше всего прибыли?',
                    prompt: 'Продажи за прошлый месяц:',
                    table: TABLE.ru,
                    question: 'Какой товар принёс магазину меньше всего прибыли? (прибыль = продано × (цена продажи − цена закупки))',
                    options: [
                        { id: 'a', text: 'Хлеб', feedback: 'Хлеб самый дешёвый, но приносит больше всех: 300 × 1 = 300 сомони.' },
                        { id: 'b', text: 'Молоко', feedback: 'Молоко: 100 × 2 = 200 сомони — больше, чем масло.' },
                        { id: 'c', text: 'Шоколад', feedback: 'Шоколад самый дорогой, но даёт 30 × 8 = 240 сомони.' },
                        { id: 'd', text: 'Масло', feedback: 'Верно: 50 × 2 = 100 сомони — меньше всех, хотя цена высокая.' },
                    ],
                    skillName: "Работа с цифрами",
                    steps: ["Сколько остаётся с одной штуки? Хлеб: 4 − 3 = 1. Масло: 30 − 28 = 2.", "Умножьте на количество проданного: хлеб 300 × 1 = 300, масло 50 × 2 = 100.", "Дорогой товар не всегда выгоден — важно, сколько вы продаёте."],
                    realLife: "Экономист каждый месяц так считает и говорит, что закупать больше, а что меньше.",
                },
                {
                    title: 'Поднять цену на хлеб?',
                    prompt: 'Владелец говорит:',
                    quote: 'Сделаем хлеб по 5 сомони — прибыль вырастет!',
                    question: 'В прошлом году соседний магазин так сделал, и продажи хлеба упали с 300 до 150. Если у нас будет так же, что произойдёт?',
                    options: [
                        { id: 'a', text: 'Прибыль удвоится', feedback: 'Прибыль с одного хлеба удвоится — но покупателей станет вдвое меньше.' },
                        { id: 'b', text: 'Прибыль останется 300, но 150 покупателей уйдут', feedback: 'Верно: 150 × (5 − 3) = 300. Прибыль не изменилась, а покупатели ушли — и молоко с маслом они тоже купят у соседей.' },
                        { id: 'c', text: 'Прибыль уменьшится', feedback: 'Посчитайте: 150 × 2 = 300 — столько же.' },
                    ],
                    skillName: "Решения на основе данных",
                    steps: ["Новая цена 5 сомони: с хлеба остаётся 5 − 3 = 2 сомони.", "Но покупателей вдвое меньше: 150 × 2 = 300 — та же прибыль.", "А 150 покупателей уйдут к соседям — и могут не вернуться."],
                    realLife: "Перед любым решением экономист спрашивает: «Если так сделаем — что будет дальше?»",
                },
                {
                    title: 'Объясните владельцу',
                    prompt: 'Владельцу 60 лет, таблицы он не любит и уже всё решил.',
                    question: 'Что вы сделаете?',
                    options: [
                        { id: 'a', text: 'Покажу таблицу Excel на 5 страниц с формулами', feedback: 'Всё верно — но он её не прочитает.' },
                        { id: 'b', text: '«Я экономист, поверьте мне.»', feedback: 'Должность — не аргумент. Владелец обидится.' },
                        { id: 'c', text: '«Прибыль останется 300, но 150 покупателей уйдут к соседям — и молоко с маслом купят там же. Давайте сначала попробуем неделю.»', feedback: 'Одна фраза, одно число и безопасное предложение. Сказать цифры человеческим языком — главный навык экономиста.' },
                        { id: 'd', text: 'Соглашусь, чтобы не спорить', feedback: 'Экономист, который видит ошибку и молчит, не делает свою работу.' },
                    ],
                    skillName: "Объяснять цифры людям",
                    steps: ["Не показывайте большую таблицу — назовите одно главное число.", "Объясните, что это значит для него: «покупатели уйдут к соседям».", "Предложите безопасный шаг: «давайте сначала попробуем неделю»."],
                    realLife: "Хороший экономист — не тот, кто лучше считает, а тот, кто умеет убедить других.",
                },
            ],
            reality: [
                'Много рутины: ввод цифр, проверка отчётов и таблиц.',
                'Одна маленькая ошибка (лишний ноль) может стоить тысячи сомони — внимательность важнее скорости.',
                'Жёсткие сроки отчётности (налоги, ежемесячные отчёты); Excel — ежедневный инструмент.',
            ],
        },
        en: {
            role: 'Shop economist',
            place: 'Khujand · chain of shops · 10:00',
            intro: 'You are the economist of the "Hamsoya" chain of shops. The owner wants the monthly report: what makes a profit and what does not.',
            tasks: [
                {
                    title: 'Which item makes the least profit?',
                    prompt: 'Last month\'s sales:',
                    table: TABLE.en,
                    question: 'Which item brought the least profit? (profit = sold × (sell price − buy price))',
                    options: [
                        { id: 'a', text: 'Bread', feedback: 'Bread is the cheapest but makes the most: 300 × 1 = 300 somoni.' },
                        { id: 'b', text: 'Milk', feedback: 'Milk: 100 × 2 = 200 somoni — more than oil.' },
                        { id: 'c', text: 'Chocolate', feedback: 'Chocolate is the most expensive but gives 30 × 8 = 240 somoni.' },
                        { id: 'd', text: 'Oil', feedback: 'Correct: 50 × 2 = 100 somoni — the least, despite the high price.' },
                    ],
                    skillName: "Working with numbers",
                    steps: ["How much is left per item? Bread: 4 − 3 = 1. Oil: 30 − 28 = 2.", "Multiply by how many were sold: bread 300 × 1 = 300, oil 50 × 2 = 100.", "An expensive item is not always profitable — what matters is how much you sell."],
                    realLife: "An economist does this every month and says what to stock more of and what less.",
                },
                {
                    title: 'Raise the price of bread?',
                    prompt: 'The owner says:',
                    quote: 'Let\'s sell bread for 5 somoni — profit will grow!',
                    question: 'Last year a neighbouring shop did this and its bread sales fell from 300 to 150. If the same happens to us, what then?',
                    options: [
                        { id: 'a', text: 'Profit doubles', feedback: 'Profit per loaf doubles — but there are half as many buyers.' },
                        { id: 'b', text: 'Profit stays at 300, but 150 customers leave', feedback: 'Correct: 150 × (5 − 3) = 300. Profit did not change, but customers left — and they will buy milk and oil elsewhere too.' },
                        { id: 'c', text: 'Profit falls', feedback: 'Calculate: 150 × 2 = 300 — the same.' },
                    ],
                    skillName: "Data-based decisions",
                    steps: ["New price 5 somoni: each loaf leaves 5 − 3 = 2 somoni.", "But buyers halve: 150 × 2 = 300 — the same profit as before.", "And 150 customers go elsewhere — and may not come back."],
                    realLife: "Before any decision an economist asks: “If we do this, what happens next?”",
                },
                {
                    title: 'Explain it to the owner',
                    prompt: 'The owner is 60, does not like spreadsheets and has already decided.',
                    question: 'What do you do?',
                    options: [
                        { id: 'a', text: 'Show a 5-page Excel sheet with formulas', feedback: 'All correct — but he will not read it.' },
                        { id: 'b', text: '"I am the economist, trust me."', feedback: 'A job title is not an argument. The owner will be offended.' },
                        { id: 'c', text: '"Profit stays at 300, but 150 customers go next door — and buy their milk and oil there too. Let\'s try it for one week first."', feedback: 'One sentence, one number, one safe proposal. Turning numbers into plain words is an economist\'s key skill.' },
                        { id: 'd', text: 'Agree, to avoid an argument', feedback: 'An economist who sees a mistake and stays silent is not doing the job.' },
                    ],
                    skillName: "Explaining numbers to people",
                    steps: ["Do not show a big spreadsheet — give one key number.", "Say what it means for him: “customers will go next door”.", "Offer a safe step: “let's try it for a week first”."],
                    realLife: "A good economist is not the one who calculates best but the one who can convince others.",
                },
            ],
            reality: [
                'Lots of routine: entering numbers, checking reports and spreadsheets.',
                'One small mistake (an extra zero) can cost thousands — accuracy matters more than speed.',
                'Strict reporting deadlines (taxes, monthly reports); Excel is an everyday tool.',
            ],
        },
    },
};
