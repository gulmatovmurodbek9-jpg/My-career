import { Scenario } from '../trial.types';

const CODE = [
    '1  нарх   = 200        // сомонӣ',
    '2  тахфиф = 10         // фоиз',
    '3  нархи_нав = нарх - тахфиф',
    '4  нишон_деҳ(нархи_нав)',
].join('\n');

const CODE_RU = [
    '1  цена   = 200        // сомони',
    '2  скидка = 10         // процентов',
    '3  новая_цена = цена - скидка',
    '4  показать(новая_цена)',
].join('\n');

const CODE_EN = [
    '1  price    = 200      // somoni',
    '2  discount = 10       // percent',
    '3  new_price = price - discount',
    '4  show(new_price)',
].join('\n');

export const IT: Scenario = {
    family: 'it',
    minutes: 10,
    keys: [
        { id: 't1', kind: 'choice', skill: 'hard', answer: 'b', related: ['1400101', '198010101'] },
        { id: 't2', kind: 'order', skill: 'hard', answer: ['a', 'c', 'b'], mustFirst: 'a', related: ['140010102', '126020225'] },
        { id: 't3', kind: 'choice', skill: 'soft', answer: 'c', related: ['125011024', '1260201'] },
    ],
    text: {
        tj: {
            role: 'Барномасоз',
            place: 'Душанбе · мағозаи онлайн · соати 9:00',
            intro: 'Шумо барномасози як мағозаи онлайн дар Душанбе ҳастед. Қаҳва ҳанӯз гарм аст, ки дар чат се паём меояд.',
            tasks: [
                {
                    title: 'Хаторо ёбед',
                    prompt: 'Мизоҷ навиштааст:',
                    quote: 'Дар сайт тахфифи 10% навиштаед. Пойафзол 200 сомонӣ аст — бояд 180 шавад, аммо сайт 190 нишон медиҳад!',
                    code: CODE,
                    question: 'Хато дар кадом сатр аст ва чӣ тавр ислоҳ мекунед?',
                    options: [
                        { id: 'a', text: 'Сатри 1: нарх бояд 180 бошад', feedback: 'Нарх дуруст аст. Агар онро иваз кунем, ҳамаи нархҳо вайрон мешаванд.' },
                        { id: 'b', text: 'Сатри 3: нархи_нав = нарх − нарх × тахфиф / 100', feedback: 'Дуруст! Код 10 сомониро кам мекард, на 10 фоизро. Барномасоз аксар вақт маҳз чунин хатоҳои «хурд»-ро меҷӯяд.' },
                        { id: 'c', text: 'Сатри 2: тахфиф бояд 20 бошад', feedback: 'Барои ин пойафзол 180 мебарояд, аммо моли 1000-сомонӣ 980 мешавад, на 900. Ин ислоҳ нест — пинҳон кардани хатост.' },
                        { id: 'd', text: 'Сатри 4: нишон додан хато дорад', feedback: 'Сатри 4 ҳамон рақамеро нишон медиҳад, ки ба он доданд. Хато пештар аст.' },
                    ],
                    skillName: "Диққат ба тафсилот",
                    steps: ["Аввал рақамро санҷед: 200 − 10 = 190. Яъне код 10 сомонӣ кам кард.", "Аммо бояд 10 фоиз кам мешуд: 200 × 10 / 100 = 20 сомонӣ.", "Пас хато дар сатри 3 аст — ҳамон ҷое, ки нарх ҳисоб мешавад."],
                    realLife: "Барномасоз рӯзе даҳҳо бор ҳамин корро мекунад: хаторо меёбад, сабабашро мефаҳмад ва ислоҳ мекунад.",
                },
                {
                    title: 'Аввал чӣ?',
                    prompt: 'Ҳамзамон се кор омад.',
                    question: 'Онҳоро аз рӯи тартиб гузоред: аз муҳимтарин то камаҳамияттарин.',
                    options: [
                        { id: 'b', text: 'Директор: «Ранги логотип каме торик аст, иваз кун».' },
                        { id: 'c', text: 'Менеҷер: «То ҷумъа тугмаи нави "Харид бо насия" лозим».' },
                        { id: 'a', text: 'Пардохт бо корт дар сайт тамоман кор намекунад — аз соати 8:30.' },
                    ],
                    skillName: "Муайян кардани афзалият",
                    steps: ["Пардохт кор намекунад — мағоза ҳар дақиқа пул гум мекунад. Ин аввал.", "Тугмаи нав то ҷумъа лозим аст — вақт ҳаст, аммо мӯҳлат дорад.", "Ранги логотип ба касе зарар намерасонад — метавонад интизор шавад."],
                    realLife: "Дар кор ҳамеша вазифа аз вақт зиёд аст. Барномасози хуб аввал он чиро мекунад, ки зарари бештар дорад.",
                },
                {
                    title: 'Ба мизоҷ ҷавоб диҳед',
                    prompt: 'Мизоҷи вазифаи якум боз менависад:',
                    quote: 'Шумо фиребгаред! Ман 190 пардохтам!',
                    question: 'Кадом ҷавоб беҳтар аст?',
                    options: [
                        { id: 'a', text: '«Хато аз мо нест, сервер айбдор аст.»', feedback: 'Мизоҷро сервер ба ташвиш намеорад. Айбро ба дигарон партофтан эътимодро мекушад.' },
                        { id: 'b', text: '«Дар формулаи discount operator-и нодуруст буд, hotfix deploy кардем.»', feedback: 'Ҳама гап дуруст аст — аммо мизоҷ ҳеҷ чизро нафаҳмид.' },
                        { id: 'c', text: '«Шумо дуруст мегӯед, бубахшед. Хато дар ҳисоби тахфиф буд — ислоҳ кардем. 10 сомонии иловагиро имрӯз ба кортатон бармегардонем.»', feedback: 'Эътироф, фаҳмонидани содда, ҳалли мушаххас ва мӯҳлат. Ҳамин тавр мизоҷ мемонад.' },
                        { id: 'd', text: 'Ҳоло ҷавоб намедиҳам — аввал хаторо ислоҳ мекунам.', feedback: 'Мизоҷи бе ҷавоб монда то ислоҳ шудани хато дар ҳамаи шабакаҳо менависад.' },
                    ],
                    skillName: "Муошират бо мизоҷ",
                    steps: ["Аввал эътироф кунед: «Шумо дуруст мегӯед». Одами асабонӣ ором мешавад.", "Бо забони содда гӯед, ки чӣ шуд — бе калимаҳои техникӣ.", "Бигӯед, ки чӣ мекунед ва кай: «имрӯз пулро бармегардонем»."],
                    realLife: "Барномасоз на танҳо бо компютер, балки бо одамон ҳам кор мекунад. Мизоҷе, ки ӯро шуниданд, бармегардад.",
                },
            ],
            reality: [
                'Аксари вақт хондан ва ҷустуҷӯи хато аст, на навиштани чизи нав.',
                'Технологияҳо ҳар 2–3 сол иваз мешаванд — тамоми умр меомӯзед, бисёр мавод бо забони англисӣ.',
                'Соатҳои дароз дар назди компютер; бо даста ва мизоҷ бисёр гап мезанед.',
            ],
        },
        ru: {
            role: 'Программист',
            place: 'Душанбе · интернет-магазин · 9:00',
            intro: 'Вы программист интернет-магазина в Душанбе. Кофе ещё горячий, а в чат уже пришло три сообщения.',
            tasks: [
                {
                    title: 'Найдите ошибку',
                    prompt: 'Клиент пишет:',
                    quote: 'На сайте написано: скидка 10%. Обувь стоит 200 сомони — должно быть 180, а сайт показывает 190!',
                    code: CODE_RU,
                    question: 'В какой строке ошибка и как её исправить?',
                    options: [
                        { id: 'a', text: 'Строка 1: цена должна быть 180', feedback: 'Цена верная. Если её поменять, сломаются все цены.' },
                        { id: 'b', text: 'Строка 3: новая_цена = цена − цена × скидка / 100', feedback: 'Верно! Код вычитал 10 сомони, а не 10 процентов. Программист часто ищет именно такие «мелкие» ошибки.' },
                        { id: 'c', text: 'Строка 2: скидка должна быть 20', feedback: 'Для этой обуви выйдет 180, но товар за 1000 станет 980, а не 900. Это не исправление, а маскировка ошибки.' },
                        { id: 'd', text: 'Строка 4: ошибка в выводе', feedback: 'Строка 4 показывает то число, которое ей дали. Ошибка раньше.' },
                    ],
                    skillName: "Внимание к деталям",
                    steps: ["Сначала проверьте число: 200 − 10 = 190. Значит, код вычел 10 сомони.", "А нужно было вычесть 10 процентов: 200 × 10 / 100 = 20 сомони.", "Значит, ошибка в строке 3 — там, где считается цена."],
                    realLife: "Программист делает это десятки раз в день: находит ошибку, понимает причину и исправляет.",
                },
                {
                    title: 'Что сначала?',
                    prompt: 'Одновременно пришли три задачи.',
                    question: 'Расставьте по порядку — от самого важного к наименее важному.',
                    options: [
                        { id: 'b', text: 'Директор: «Логотип немного тёмный, поменяй цвет».' },
                        { id: 'c', text: 'Менеджер: «К пятнице нужна новая кнопка "Купить в рассрочку"».' },
                        { id: 'a', text: 'Оплата картой на сайте не работает совсем — с 8:30.' },
                    ],
                    skillName: "Расстановка приоритетов",
                    steps: ["Оплата не работает — магазин теряет деньги каждую минуту. Это первое.", "Новая кнопка нужна к пятнице — время есть, но есть и срок.", "Цвет логотипа никому не вредит — может подождать."],
                    realLife: "Задач всегда больше, чем времени. Хороший программист сначала берёт то, что вредит сильнее всего.",
                },
                {
                    title: 'Ответьте клиенту',
                    prompt: 'Клиент из первой задачи пишет снова:',
                    quote: 'Вы обманщики! Я заплатил 190!',
                    question: 'Какой ответ лучше?',
                    options: [
                        { id: 'a', text: '«Это не наша ошибка, виноват сервер.»', feedback: 'Клиенту не важен сервер. Перекладывание вины убивает доверие.' },
                        { id: 'b', text: '«В формуле discount был неверный operator, мы задеплоили hotfix.»', feedback: 'Всё верно — но клиент ничего не понял.' },
                        { id: 'c', text: '«Вы правы, извините. Ошибка была в расчёте скидки — мы её исправили. Лишние 10 сомони вернём на вашу карту сегодня.»', feedback: 'Признание, простое объяснение, конкретное решение и срок. Так клиент остаётся.' },
                        { id: 'd', text: 'Пока не отвечать — сначала исправить ошибку.', feedback: 'Клиент без ответа успеет написать во все соцсети.' },
                    ],
                    skillName: "Общение с клиентом",
                    steps: ["Сначала признайте: «Вы правы». Взволнованный человек успокаивается.", "Простыми словами скажите, что случилось — без технических терминов.", "Скажите, что и когда сделаете: «сегодня вернём деньги»."],
                    realLife: "Программист работает не только с компьютером, но и с людьми. Клиент, которого услышали, возвращается.",
                },
            ],
            reality: [
                'Большая часть времени — чтение кода и поиск ошибок, а не написание нового.',
                'Технологии меняются каждые 2–3 года — учиться придётся всю жизнь, много материалов на английском.',
                'Долгие часы за компьютером; много общения с командой и клиентами.',
            ],
        },
        en: {
            role: 'Programmer',
            place: 'Dushanbe · online shop · 9:00',
            intro: 'You are a programmer at an online shop in Dushanbe. Your coffee is still hot when three messages arrive in the chat.',
            tasks: [
                {
                    title: 'Find the bug',
                    prompt: 'A customer writes:',
                    quote: 'Your site says 10% off. The shoes cost 200 somoni — it should be 180, but the site shows 190!',
                    code: CODE_EN,
                    question: 'Which line has the bug and how do you fix it?',
                    options: [
                        { id: 'a', text: 'Line 1: the price should be 180', feedback: 'The price is correct. Changing it would break every price.' },
                        { id: 'b', text: 'Line 3: new_price = price − price × discount / 100', feedback: 'Correct! The code subtracted 10 somoni, not 10 percent. Programmers spend a lot of time hunting exactly these "small" bugs.' },
                        { id: 'c', text: 'Line 2: the discount should be 20', feedback: 'That gives 180 here, but a 1000-somoni item becomes 980, not 900. That hides the bug instead of fixing it.' },
                        { id: 'd', text: 'Line 4: the output is wrong', feedback: 'Line 4 shows whatever number it is given. The bug is earlier.' },
                    ],
                    skillName: "Attention to detail",
                    steps: ["First check the number: 200 − 10 = 190. So the code took off 10 somoni.", "But it should take off 10 percent: 200 × 10 / 100 = 20 somoni.", "So the bug is in line 3 — where the price is calculated."],
                    realLife: "A programmer does this dozens of times a day: find the bug, understand why, fix it.",
                },
                {
                    title: 'What first?',
                    prompt: 'Three tasks arrive at once.',
                    question: 'Put them in order — from most to least important.',
                    options: [
                        { id: 'b', text: 'Director: "The logo is a bit dark, change the colour."' },
                        { id: 'c', text: 'Manager: "We need a new "Buy in instalments" button by Friday."' },
                        { id: 'a', text: 'Card payments on the site do not work at all — since 8:30.' },
                    ],
                    skillName: "Prioritising",
                    steps: ["Payments are down — the shop loses money every minute. That comes first.", "The new button is due Friday — there is time, but there is a deadline.", "The logo colour hurts nobody — it can wait."],
                    realLife: "There are always more tasks than time. A good programmer starts with whatever causes the most harm.",
                },
                {
                    title: 'Answer the customer',
                    prompt: 'The customer from task one writes again:',
                    quote: 'You are cheats! I paid 190!',
                    question: 'Which reply is best?',
                    options: [
                        { id: 'a', text: '"It is not our fault, the server is to blame."', feedback: 'The customer does not care about servers. Shifting blame kills trust.' },
                        { id: 'b', text: '"The discount formula had a wrong operator, we deployed a hotfix."', feedback: 'All true — but the customer understood nothing.' },
                        { id: 'c', text: '"You are right, sorry. The discount was calculated wrongly — we fixed it. We will refund the extra 10 somoni to your card today."', feedback: 'Admit, explain simply, give a concrete fix and a time. That keeps the customer.' },
                        { id: 'd', text: 'Do not reply yet — fix the bug first.', feedback: 'A customer left without a reply will post about it everywhere.' },
                    ],
                    skillName: "Talking to customers",
                    steps: ["First admit it: “You are right.” An upset person calms down.", "Say what happened in plain words — no technical terms.", "Say what you will do and when: “we refund you today”."],
                    realLife: "Programmers work with people, not just computers. A customer who feels heard comes back.",
                },
            ],
            reality: [
                'Most of the time is reading code and hunting bugs, not writing new things.',
                'Technologies change every 2–3 years — you keep learning all your life, much of it in English.',
                'Long hours at a computer; lots of talking with the team and customers.',
            ],
        },
    },
};
