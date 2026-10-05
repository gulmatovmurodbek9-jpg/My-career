import { Scenario } from '../trial.types';

// Моддаҳои қонун номбар карда намешаванд: ҳамаи қоидаҳо аз шартномаи дар вазифа
// додашуда — ҳамон кори воқеии ҳуқуқшинос (матнро дақиқ хондан ва ба ҳолат татбиқ кардан).
export const LAW: Scenario = {
    family: 'law',
    icon: '⚖️',
    minutes: 10,
    keys: [
        { id: 't1', kind: 'choice', skill: 'hard', answer: 'b', related: ['1240103', '124010104'] },
        { id: 't2', kind: 'multi', skill: 'hard', answer: ['a', 'c'], related: ['1930101', '1930102'] },
        { id: 't3', kind: 'choice', skill: 'soft', answer: 'b', related: ['1260101', '124010106'] },
    ],
    text: {
        tj: {
            role: 'Ҳуқуқшинос',
            place: 'Душанбе · бюрои ҳуқуқӣ · соати 14:00',
            intro: 'Мизоҷи нав — Фаррух, 24-сола. Ӯ квартираро ба иҷора гирифта буд ва ҳоло холӣ кард. Соҳибхона пули гарав — 1500 сомониро барнамегардонад.',
            disclaimer: 'Ҳолат ва шартнома сохтаанд; ин маслиҳати ҳуқуқӣ нест.',
            tasks: [
                {
                    title: 'Ҳақ бо кист?',
                    prompt: 'Аз шартнома:',
                    quote: '4.2. Пули гарав пурра баргардонида мешавад, агар квартира бе зарар супорида шавад.\n4.3. Фарсудашавии муқаррарӣ аз истифодаи оддӣ зарар ҳисоб намешавад.\n4.4. Зарари расонидаи иҷорагир аз пули гарав тарҳ карда мешавад.',
                    code: '• Обои ранги худро гум кардааст (квартира 2 сол боз иҷора дода мешавад).\n• Шишаи як тиреза шикаст — бародари хурдии Фаррух тӯб бозӣ мекард. Таъмир: 300 сомонӣ.',
                    question: 'Мо аз соҳибхона чӣ талаб мекунем?',
                    options: [
                        { id: 'a', text: 'Ҳамаи 1500 сомонӣ', feedback: 'Тиреза шикастааст — ин зарар аст (б. 4.4). Агар инро пинҳон кунем, дар суд мағлуб мешавем.' },
                        { id: 'b', text: '1200 сомонӣ — гарав бе арзиши тиреза', feedback: 'Дуруст. Обои — фарсудашавии муқаррарӣ (б. 4.3), тиреза — зарар (б. 4.4). Ҳуқуқшинос ҳар ҷумлаи шартномаро ба ҳар далел мувофиқ мекунад.' },
                        { id: 'c', text: 'Ҳеҷ чиз — соҳиб ҳақ аст', feedback: 'Шартнома ба соҳиб ҳақ намедиҳад, ки тамоми гаравро барои обои кӯҳна нигоҳ дорад.' },
                    ],
                    explain: 'Ҳуқуқшинос бо «ҳиссиёт» кор намекунад: ҳар далелро бо ҷумлаи мушаххаси ҳуҷҷат муқоиса мекунад.',
                },
                {
                    title: 'Кадом далелҳо қавитаранд?',
                    prompt: 'Барои баҳс бо соҳибхона мо далел ҷамъ мекунем.',
                    question: '2 далели аз ҳама қавиро интихоб кунед.',
                    options: [
                        { id: 'a', text: 'Суратҳои квартира дар рӯзи даромадан, бо сана', feedback: 'Қавӣ: нишон медиҳад, ки обои аллакай чӣ ҳол дошт.' },
                        { id: 'b', text: 'Ҳамсоя мегӯяд: «Фаррух бачаи хуб аст»', feedback: 'Ин тавсифи шахс аст, на далел дар бораи квартира.' },
                        { id: 'c', text: 'Паёми WhatsApp-и соҳибхона: «Обои аллакай кӯҳна буд, ҳеҷ гап не»', feedback: 'Қавӣ: худи тарафи муқобил навиштааст.' },
                        { id: 'd', text: 'Фаррух ваъда медиҳад, ки «ҳамааш тоза буд»', feedback: 'Суханони тарафи манфиатдор — далели заиф.' },
                    ],
                    explain: 'Ҳуқуқшинос на бо савол «кӣ ҳақ аст?», балки бо савол «чиро исбот карда метавонем?» кор мекунад.',
                },
                {
                    title: 'Ба мизоҷ рост гӯед',
                    prompt: 'Фаррух хашмгин аст:',
                    quote: 'Ман ба суд медиҳам! 1500 ва боз 5000 барои асабам!',
                    question: 'Чӣ ҷавоб медиҳед?',
                    options: [
                        { id: 'a', text: '«Албатта, ғолиб мешавем!»', feedback: 'Ваъдаи дурӯғ. Вақте натиҷа 1200 бошад, мизоҷ шуморо айбдор мекунад.' },
                        { id: 'b', text: '«Барои тиреза 300 сомонӣ ҳақ доранд, 1200 — ҳаққи шумо. Аввал ба соҳиб бо суратҳо ва паёмҳо номаи расмӣ мефиристем — аксар вақт ҳамин кифоя аст. Агар не, баъд суд.»', feedback: 'Ростқавлӣ, интизории воқеӣ ва аввал қадами арзонтарин.' },
                        { id: 'c', text: '«Суд дароз ва гарон аст — фаромӯш кунед.»', feedback: 'Шумо ҳуқуқи ӯро ҳимоя накардед.' },
                    ],
                    explain: 'Ҳуқуқшинос бояд ором бошад ва ҳақиқатро гӯяд — ҳатто вақте ки он ба мизоҷ хуш намеояд.',
                },
            ],
            reality: [
                'Бисёр хондан: қонунҳо, шартномаҳо, ҳуҷҷатҳо — як калима метавонад парвандаро иваз кунад.',
                'Қонунҳо тағйир меёбанд — омӯзиш доимӣ аст.',
                'Мизоҷон аксар вақт асабонӣ ҳастанд; ҳуқуқшинос бояд ором бошад.',
            ],
        },
        ru: {
            role: 'Юрист',
            place: 'Душанбе · юридическое бюро · 14:00',
            intro: 'Новый клиент — Фаррух, 24 года. Он снимал квартиру и теперь съехал. Хозяин не возвращает залог — 1500 сомони.',
            disclaimer: 'Ситуация и договор вымышлены; это не юридическая консультация.',
            tasks: [
                {
                    title: 'Кто прав?',
                    prompt: 'Из договора:',
                    quote: '4.2. Залог возвращается полностью, если квартира сдана без ущерба.\n4.3. Естественный износ от обычного использования ущербом не считается.\n4.4. Ущерб, причинённый арендатором, вычитается из залога.',
                    code: '• Обои выцвели (квартиру сдают уже 2 года).\n• Разбито стекло в одном окне — младший брат Фарруха играл в мяч. Ремонт: 300 сомони.',
                    question: 'Что мы требуем от хозяина?',
                    options: [
                        { id: 'a', text: 'Все 1500 сомони', feedback: 'Окно разбито — это ущерб (п. 4.4). Если это скрыть, в суде проиграем.' },
                        { id: 'b', text: '1200 сомони — залог за вычетом окна', feedback: 'Верно. Обои — естественный износ (п. 4.3), окно — ущерб (п. 4.4). Юрист сопоставляет каждый пункт договора с каждым фактом.' },
                        { id: 'c', text: 'Ничего — хозяин прав', feedback: 'Договор не даёт хозяину права удерживать весь залог из-за старых обоев.' },
                    ],
                    explain: 'Юрист работает не с «ощущениями»: каждый факт он сверяет с конкретной фразой документа.',
                },
                {
                    title: 'Какие доказательства сильнее?',
                    prompt: 'Для спора с хозяином собираем доказательства.',
                    question: 'Выберите 2 самых сильных.',
                    options: [
                        { id: 'a', text: 'Фото квартиры в день заселения, с датой', feedback: 'Сильное: показывает, в каком состоянии уже были обои.' },
                        { id: 'b', text: 'Сосед говорит: «Фаррух хороший парень»', feedback: 'Это характеристика человека, а не доказательство о квартире.' },
                        { id: 'c', text: 'Сообщение хозяина в WhatsApp: «Обои и так были старые, ничего страшного»', feedback: 'Сильное: это написала сама противоположная сторона.' },
                        { id: 'd', text: 'Фаррух уверяет, что «всё было чисто»', feedback: 'Слова заинтересованной стороны — слабое доказательство.' },
                    ],
                    explain: 'Юрист думает не «кто прав?», а «что мы можем доказать?».',
                },
                {
                    title: 'Скажите клиенту правду',
                    prompt: 'Фаррух злится:',
                    quote: 'Я подам в суд! 1500 и ещё 5000 за мои нервы!',
                    question: 'Что вы ответите?',
                    options: [
                        { id: 'a', text: '«Конечно, выиграем!»', feedback: 'Ложное обещание. Когда результатом будет 1200, клиент обвинит вас.' },
                        { id: 'b', text: '«За окно 300 сомони они вправе удержать, 1200 — ваши. Сначала отправим хозяину официальное письмо с фото и сообщениями — часто этого достаточно. Если нет — суд.»', feedback: 'Честность, реалистичные ожидания и сначала самый дешёвый шаг.' },
                        { id: 'c', text: '«Суд — это долго и дорого, забудьте.»', feedback: 'Вы не защитили его права.' },
                    ],
                    explain: 'Юрист должен быть спокойным и говорить правду — даже когда она не нравится клиенту.',
                },
            ],
            reality: [
                'Много чтения: законы, договоры, документы — одно слово может изменить дело.',
                'Законы меняются — учиться приходится постоянно.',
                'Клиенты часто взволнованы; юрист должен оставаться спокойным.',
            ],
        },
        en: {
            role: 'Lawyer',
            place: 'Dushanbe · law office · 14:00',
            intro: 'A new client — Farrukh, 24. He rented a flat and has now moved out. The landlord will not return the 1500-somoni deposit.',
            disclaimer: 'The case and contract are invented; this is not legal advice.',
            tasks: [
                {
                    title: 'Who is right?',
                    prompt: 'From the contract:',
                    quote: '4.2. The deposit is returned in full if the flat is handed back without damage.\n4.3. Normal wear and tear from ordinary use is not damage.\n4.4. Damage caused by the tenant is deducted from the deposit.',
                    code: '• The wallpaper has faded (the flat has been rented out for 2 years).\n• One window pane is broken — Farrukh\'s little brother was playing football. Repair: 300 somoni.',
                    question: 'What do we claim from the landlord?',
                    options: [
                        { id: 'a', text: 'All 1500 somoni', feedback: 'The window is broken — that is damage (cl. 4.4). Hiding it loses the case.' },
                        { id: 'b', text: '1200 somoni — the deposit minus the window', feedback: 'Correct. Wallpaper is normal wear (cl. 4.3), the window is damage (cl. 4.4). A lawyer matches each clause to each fact.' },
                        { id: 'c', text: 'Nothing — the landlord is right', feedback: 'The contract does not let the landlord keep the whole deposit for old wallpaper.' },
                    ],
                    explain: 'A lawyer does not work with "feelings": each fact is checked against a specific sentence of the document.',
                },
                {
                    title: 'Which evidence is strongest?',
                    prompt: 'We are gathering evidence for the dispute.',
                    question: 'Choose the 2 strongest pieces.',
                    options: [
                        { id: 'a', text: 'Dated photos of the flat on move-in day', feedback: 'Strong: shows what state the wallpaper was already in.' },
                        { id: 'b', text: 'A neighbour says: "Farrukh is a good lad"', feedback: 'That describes a person, not the flat.' },
                        { id: 'c', text: 'The landlord\'s WhatsApp message: "The wallpaper was old anyway, no problem"', feedback: 'Strong: the other side wrote it themselves.' },
                        { id: 'd', text: 'Farrukh promises "everything was clean"', feedback: 'Words of an interested party are weak evidence.' },
                    ],
                    explain: 'A lawyer asks not "who is right?" but "what can we prove?".',
                },
                {
                    title: 'Tell the client the truth',
                    prompt: 'Farrukh is angry:',
                    quote: 'I\'m going to court! 1500 plus 5000 for my nerves!',
                    question: 'What do you say?',
                    options: [
                        { id: 'a', text: '"Of course we will win!"', feedback: 'A false promise. When the result is 1200, the client will blame you.' },
                        { id: 'b', text: '"They may keep 300 for the window; 1200 is yours. First we send the landlord a formal letter with the photos and messages — that is often enough. If not, then court."', feedback: 'Honesty, realistic expectations and the cheapest step first.' },
                        { id: 'c', text: '"Court is long and expensive — forget it."', feedback: 'You did not defend his rights.' },
                    ],
                    explain: 'A lawyer must stay calm and tell the truth — even when the client does not like it.',
                },
            ],
            reality: [
                'Lots of reading: laws, contracts, documents — one word can change a case.',
                'Laws change — learning never stops.',
                'Clients are often upset; a lawyer has to stay calm.',
            ],
        },
    },
};
