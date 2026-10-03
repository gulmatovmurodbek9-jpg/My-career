import type { QuizQuestion } from './questions';

// Қадами 1 — 16 вазъияти ҳаёти хонанда. Ҳар ҷавоб ба самти асосӣ 3 хол ва
// баъзан ба самти наздик 1 хол медиҳад, то натиҷаҳо камтар баробар бароянд.
// c1 — табиӣ ва техникӣ; c2 — иқтисод ва география; c3 — филология, педагогика
// ва санъат; c4 — ҷомеашиносӣ ва ҳуқуқ; c5 — тиб, биология ва варзиш.
// Холҳо дар quiz.service ба миқёси 0–40 мувофиқ карда мешаванд.

type Lang = { tj: string; ru: string; en: string };
type Scores = QuizQuestion['options'][number]['scores'];
const q = (id: string, type: QuizQuestion['type'], question: Lang, options: Array<[Lang, Scores]>): QuizQuestion => ({
    id,
    part: 'mmt' as QuizQuestion['part'],
    type,
    question,
    options: options.map(([text, scores]) => ({ text, scores })),
});

export const MMT_QUESTIONS: QuizQuestion[] = [
    q('m01', 'scenario', {
        tj: 'Рӯзи истироҳат аст ва ҳеҷ кор нест. Бо кадом машғулият вақт беш аз ҳама зуд мегузарад?',
        ru: 'Выходной, никаких дел. За каким занятием время летит быстрее всего?',
        en: 'It is a day off with nothing to do. Which activity makes time fly the most?',
    }, [
        [{ tj: 'Чизеро месозам ё таъмир мекунам — телефон, велосипед, барнома', ru: 'Что-то собираю или чиню — телефон, велосипед, программу', en: 'Building or fixing something — a phone, a bike, an app' }, { c1: 3 }],
        [{ tj: 'Китоб мехонам, менависам ё сурат мекашам', ru: 'Читаю, пишу или рисую', en: 'Reading, writing or drawing' }, { c3: 3 }],
        [{ tj: 'Варзиш мекунам ё дар бораи организми инсон видео мебинам', ru: 'Занимаюсь спортом или смотрю видео об организме человека', en: 'Doing sport or watching videos about the human body' }, { c5: 3 }],
        [{ tj: 'Дар бораи пул, бизнес ё дигар кишварҳо мехонам', ru: 'Читаю про деньги, бизнес или другие страны', en: 'Reading about money, business or other countries' }, { c2: 3 }],
        [{ tj: 'Бо дӯстон дар бораи воқеаҳо ва адолат баҳс мекунам', ru: 'Спорю с друзьями о событиях и справедливости', en: 'Debating events and fairness with friends' }, { c4: 3 }],
    ]),
    q('m02', 'environment', {
        tj: 'Дар мактаб олимпиада эълон шуд. Ба кадомаш худатон номнавис мешавед?',
        ru: 'В школе объявили олимпиаду. На какую вы запишетесь сами?',
        en: 'Your school announces olympiads. Which one would you sign up for yourself?',
    }, [
        [{ tj: 'Математика, физика ё информатика', ru: 'Математика, физика или информатика', en: 'Maths, physics or computer science' }, { c1: 3 }],
        [{ tj: 'Биология ё химия', ru: 'Биология или химия', en: 'Biology or chemistry' }, { c5: 3 }],
        [{ tj: 'Забон ва адабиёт ё забони хориҷӣ', ru: 'Язык и литература или иностранный язык', en: 'Language and literature or a foreign language' }, { c3: 3 }],
        [{ tj: 'Таърих ё ҳуқуқ', ru: 'История или право', en: 'History or law' }, { c4: 3 }],
        [{ tj: 'География ё иқтисод', ru: 'География или экономика', en: 'Geography or economics' }, { c2: 3 }],
    ]),
    q('m03', 'motivation', {
        tj: 'Хешовандон аз шумо ёрӣ мепурсанд. Кадом ёриро бо хурсандӣ мекунед?',
        ru: 'Родственники просят вас о помощи. Какую помощь вы окажете с радостью?',
        en: 'Your relatives ask for help. Which kind of help would you give gladly?',
    }, [
        [{ tj: 'Компютер ё телефонро танзим мекунам', ru: 'Настрою компьютер или телефон', en: 'Set up a computer or a phone' }, { c1: 3 }],
        [{ tj: 'Хароҷоти тӯй ё хариди калонро ҳисоб мекунам', ru: 'Посчитаю расходы на свадьбу или крупную покупку', en: 'Work out the budget for a wedding or a big purchase' }, { c2: 3, c1: 1 }],
        [{ tj: 'Ба бародару хоҳари хурд дарс мефаҳмонам', ru: 'Объясню уроки младшим братьям и сёстрам', en: 'Explain lessons to younger siblings' }, { c3: 3 }],
        [{ tj: 'Ҳуҷҷат ё аризаро дуруст пур мекунам ва ҳаққашонро мефаҳмонам', ru: 'Правильно заполню документы или заявление и объясню их права', en: 'Fill in documents correctly and explain their rights' }, { c4: 3 }],
        [{ tj: 'Аз бемор нигоҳубин мекунам ё доруҳояшро ба тартиб медарорам', ru: 'Поухаживаю за больным или разберусь с его лекарствами', en: 'Look after someone ill or sort out their medicines' }, { c5: 3 }],
    ]),
    q('m04', 'scenario', {
        tj: 'Барои намоишгоҳи мактаб бояд лоиҳа созед. Кадомашро интихоб мекунед?',
        ru: 'Для школьной выставки нужен проект. Какой вы выберете?',
        en: 'You need a project for the school fair. Which would you choose?',
    }, [
        [{ tj: 'Роботи хурд ё макети нерӯгоҳи барқи обӣ', ru: 'Маленький робот или макет ГЭС', en: 'A small robot or a model hydropower plant' }, { c1: 3 }],
        [{ tj: 'Таҳқиқ: оби ҷӯйи деҳа чӣ қадар тоза аст', ru: 'Исследование: насколько чиста вода в арыке', en: 'Research: how clean the village stream water is' }, { c5: 3, c1: 1 }],
        [{ tj: 'Нақшаи бизнеси хурд барои деҳа ё маҳалла', ru: 'Бизнес-план небольшого дела для села или махалли', en: 'A small business plan for a village or neighbourhood' }, { c2: 3 }],
        [{ tj: 'Филми кӯтоҳ ё маҷаллаи мактаб', ru: 'Короткий фильм или школьный журнал', en: 'A short film or a school magazine' }, { c3: 3 }],
        [{ tj: 'Пурсиш: хонандагон дар бораи ҳуқуқҳояшон чӣ медонанд', ru: 'Опрос: что ученики знают о своих правах', en: 'A survey: what students know about their rights' }, { c4: 3 }],
    ]),
    q('m05', 'environment', {
        tj: 'Тобистон метавонед як моҳ коромӯзӣ кунед. Куҷо меравед?',
        ru: 'Летом можно месяц поработать стажёром. Куда пойдёте?',
        en: 'You can do a one-month summer internship. Where would you go?',
    }, [
        [{ tj: 'Ба шифохона ё дорухона', ru: 'В больницу или аптеку', en: 'A hospital or a pharmacy' }, { c5: 3 }],
        [{ tj: 'Ба бонк ё ширкати сайёҳӣ', ru: 'В банк или туристическую компанию', en: 'A bank or a travel company' }, { c2: 3 }],
        [{ tj: 'Ба ширкати IT ё корхонаи сохтмонӣ', ru: 'В IT-компанию или на стройку', en: 'An IT company or a construction firm' }, { c1: 3 }],
        [{ tj: 'Ба суд, прокуратура ё дафтари адвокат', ru: 'В суд, прокуратуру или к адвокату', en: 'A court, prosecutor’s office or a law firm' }, { c4: 3 }],
        [{ tj: 'Ба радио, телевизион ё боғча', ru: 'На радио, телевидение или в детский сад', en: 'A radio or TV station, or a kindergarten' }, { c3: 3 }],
    ]),
    q('m06', 'motivation', {
        tj: 'Кадом хабарро дар интернет аввал мекушоед?',
        ru: 'Какую новость в интернете вы откроете первой?',
        en: 'Which news story would you open first?',
    }, [
        [{ tj: '«Олимони тоҷик доруи нав сохтанд»', ru: '«Таджикские учёные создали новое лекарство»', en: '“Tajik scientists develop a new medicine”' }, { c5: 3 }],
        [{ tj: '«Қонуни нав: чӣ барои ҷавонон тағйир меёбад»', ru: '«Новый закон: что изменится для молодёжи»', en: '“New law: what changes for young people”' }, { c4: 3 }],
        [{ tj: '«Нархи доллар ва бозор: пешгӯӣ барои сол»', ru: '«Курс доллара и рынок: прогноз на год»', en: '“Dollar and market: the forecast for the year”' }, { c2: 3 }],
        [{ tj: '«Роғун: турбинаи нав ба кор даромад»', ru: '«Рогун: запущена новая турбина»', en: '“Rogun: a new turbine starts working”' }, { c1: 3 }],
        [{ tj: '«Китоби нависандаи ҷавони тоҷик ҷоиза гирифт»', ru: '«Книга молодого таджикского писателя получила премию»', en: '“A young Tajik writer’s book wins an award”' }, { c3: 3 }],
    ]),
    q('m07', 'motivation', {
        tj: 'Кадом чиз шуморо бештар асабонӣ мекунад?',
        ru: 'Что вас раздражает сильнее всего?',
        en: 'What annoys you the most?',
    }, [
        [{ tj: 'Беадолатӣ — вақте ки ба касе ноҳақ муносибат мекунанд', ru: 'Несправедливость — когда с кем-то поступают нечестно', en: 'Injustice — when someone is treated unfairly' }, { c4: 3 }],
        [{ tj: 'Техникае, ки бад кор мекунад ва касе дуруст намекунад', ru: 'Техника, которая плохо работает, и никто её не чинит', en: 'Machines that work badly and nobody fixes them' }, { c1: 3 }],
        [{ tj: 'Пули беҳуда сарфшуда ва ҳисоби нодуруст', ru: 'Зря потраченные деньги и неверный расчёт', en: 'Wasted money and bad calculations' }, { c2: 3 }],
        [{ tj: 'Хатои имлоӣ ва сухани дағал', ru: 'Ошибки в письме и грубая речь', en: 'Spelling mistakes and rude speech' }, { c3: 3 }],
        [{ tj: 'Ифлосии муҳит ва бепарвоӣ ба саломатӣ', ru: 'Грязь вокруг и безразличие к здоровью', en: 'Pollution and carelessness about health' }, { c5: 3 }],
    ]),
    q('m08', 'scenario', {
        tj: 'Муаллимон дар бораи шумо одатан чӣ мегӯянд?',
        ru: 'Что о вас обычно говорят учителя?',
        en: 'What do teachers usually say about you?',
    }, [
        [{ tj: '«Масъаларо аз ҳама зудтар ҳал мекунад»', ru: '«Решает задачи быстрее всех»', en: '“Solves problems faster than anyone”' }, { c1: 3, c2: 1 }],
        [{ tj: '«Иншояш беҳтарин аст, зебо гап мезанад»', ru: '«Лучшие сочинения, красиво говорит»', en: '“Writes the best essays, speaks beautifully”' }, { c3: 3 }],
        [{ tj: '«Бодиққат ва меҳрубон аст, ба ҳама ёрӣ медиҳад»', ru: '«Внимательный и добрый, всем помогает»', en: '“Attentive and kind, helps everyone”' }, { c5: 3, c3: 1 }],
        [{ tj: '«Ҳаққашро медонад ва далел меорад»', ru: '«Знает свои права и приводит доводы»', en: '“Knows their rights and argues with evidence”' }, { c4: 3 }],
        [{ tj: '«Ташкилотчӣ аст, ҳама чизро ба нақша мегирад»', ru: '«Организатор, всё планирует заранее»', en: '“An organiser who plans everything ahead”' }, { c2: 3, c4: 1 }],
    ]),
    q('m09', 'motivation', {
        tj: 'Агар каналро дар YouTube кушоед, он дар бораи чӣ мешавад?',
        ru: 'Если бы вы открыли канал на YouTube, о чём бы он был?',
        en: 'If you started a YouTube channel, what would it be about?',
    }, [
        [{ tj: 'Барномасозӣ, гаҷетҳо ва ихтироъҳо', ru: 'Программирование, гаджеты и изобретения', en: 'Coding, gadgets and inventions' }, { c1: 3 }],
        [{ tj: 'Саломатӣ, ғизои дуруст ва варзиш', ru: 'Здоровье, правильное питание и спорт', en: 'Health, healthy food and sport' }, { c5: 3 }],
        [{ tj: 'Сафар ба шаҳру кишварҳо ва чӣ тавр пул кор кардан', ru: 'Путешествия по городам и странам и как зарабатывать', en: 'Travel to cities and countries and how to earn money' }, { c2: 3 }],
        [{ tj: 'Шеър, мусиқӣ, забонҳо ё дарсҳои мактаб', ru: 'Стихи, музыка, языки или школьные уроки', en: 'Poetry, music, languages or school lessons' }, { c3: 3 }],
        [{ tj: 'Таърих, ҳуқуқ ва мушкилоти ҷомеа', ru: 'История, право и проблемы общества', en: 'History, law and social problems' }, { c4: 3 }],
    ]),
    q('m10', 'environment', {
        tj: 'Дар маҳалла корҳои ихтиёрӣ ҳаст. Ба кадомаш ҳамроҳ мешавед?',
        ru: 'В махалле есть волонтёрские дела. К какому присоединитесь?',
        en: 'There is volunteer work in your neighbourhood. Which would you join?',
    }, [
        [{ tj: 'Дарахтшинонӣ ё ёрӣ ба пиронсолон', ru: 'Посадка деревьев или помощь пожилым', en: 'Planting trees or helping the elderly' }, { c5: 3, c4: 1 }],
        [{ tj: 'Таъмири чароғи кӯча ё қубури об', ru: 'Ремонт уличного фонаря или водопровода', en: 'Repairing a street light or a water pipe' }, { c1: 3 }],
        [{ tj: 'Дарс додан ба кӯдакони маҳалла', ru: 'Занятия с детьми махалли', en: 'Teaching the neighbourhood children' }, { c3: 3 }],
        [{ tj: 'Ҷамъоварии маблағ ва ҳисоботи харҷ', ru: 'Сбор средств и отчёт о расходах', en: 'Fundraising and reporting the spending' }, { c2: 3 }],
        [{ tj: 'Фаҳмондани ҳуқуқҳо ба одамон ва ҳалли низоъҳо', ru: 'Разъяснение людям их прав и решение споров', en: 'Explaining rights to people and settling disputes' }, { c4: 3 }],
    ]),
    q('m11', 'scenario', {
        tj: 'Ба шумо 1000 сомонӣ доданд, ки дар як сол зиёд кунед. Чӣ мекунед?',
        ru: 'Вам дали 1000 сомони, чтобы приумножить за год. Что сделаете?',
        en: 'You are given 1,000 somoni to grow within a year. What do you do?',
    }, [
        [{ tj: 'Мол харида, бо фоида мефурӯшам', ru: 'Куплю товар и продам с выгодой', en: 'Buy goods and resell them at a profit' }, { c2: 3 }],
        [{ tj: 'Асбоб мехарам ва таъмир ё сохтанро сар мекунам', ru: 'Куплю инструменты и начну чинить или мастерить', en: 'Buy tools and start repairing or making things' }, { c1: 3 }],
        [{ tj: 'Курси забон ё дарси хусусӣ мекушоям', ru: 'Открою курсы языка или репетиторство', en: 'Start language courses or private tutoring' }, { c3: 3, c2: 1 }],
        [{ tj: 'Гул, сабзӣ ё парранда парвариш мекунам', ru: 'Буду выращивать цветы, овощи или птицу', en: 'Grow flowers, vegetables or poultry' }, { c5: 3, c2: 1 }],
        [{ tj: 'Ба одамон дар пур кардани ҳуҷҷатҳо ёрӣ мерасонам', ru: 'Буду помогать людям оформлять документы', en: 'Help people with their paperwork' }, { c4: 3 }],
    ]),
    q('m12', 'environment', {
        tj: 'Синф ба сафар меравад. Шумо чӣ масъулият мегиред?',
        ru: 'Класс едет в поездку. Какую обязанность возьмёте?',
        en: 'Your class goes on a trip. Which responsibility do you take?',
    }, [
        [{ tj: 'Роҳ ва харитаро меомӯзам, хароҷотро ҳисоб мекунам', ru: 'Изучу маршрут и карту, посчитаю расходы', en: 'Plan the route on the map and count the costs' }, { c2: 3 }],
        [{ tj: 'Қуттии дору ва бехатарии ҳамаро ба дӯш мегирам', ru: 'Возьму аптечку и отвечаю за безопасность', en: 'Carry the first-aid kit and keep everyone safe' }, { c5: 3 }],
        [{ tj: 'Аксу видео мегирам ва дар бораи сафар менависам', ru: 'Буду снимать фото и видео и напишу о поездке', en: 'Take photos and videos and write about the trip' }, { c3: 3 }],
        [{ tj: 'Қоидаҳоро муқаррар мекунам ва баҳсҳоро ҳал мекунам', ru: 'Установлю правила и буду решать споры', en: 'Set the rules and settle arguments' }, { c4: 3, c2: 1 }],
        [{ tj: 'Техника — пауэрбанк, чароғ, интернет — бо ман', ru: 'Техника — пауэрбанк, фонарь, интернет — на мне', en: 'Gear — power bank, torch, internet — is on me' }, { c1: 3 }],
    ]),
    q('m13', 'motivation', {
        tj: 'Ба мактаб мутахассиси машҳур омад. Аз ӯ чӣ мепурсед?',
        ru: 'В школу пришёл известный специалист. О чём вы его спросите?',
        en: 'A famous expert visits your school. What would you ask?',
    }, [
        [{ tj: '«Чӣ тавр бемориҳои душворро табобат мекунанд?»', ru: '«Как лечат тяжёлые болезни?»', en: '“How are serious diseases treated?”' }, { c5: 3 }],
        [{ tj: '«Сунъӣ зеҳн чӣ тавр кор мекунад?»', ru: '«Как работает искусственный интеллект?»', en: '“How does artificial intelligence work?”' }, { c1: 3 }],
        [{ tj: '«Чӣ тавр кори худро аз сифр сар кунам?»', ru: '«Как начать своё дело с нуля?»', en: '“How do I start my own business from scratch?”' }, { c2: 3 }],
        [{ tj: '«Чӣ тавр китоби аввалинамро нависам?»', ru: '«Как написать свою первую книгу?»', en: '“How do I write my first book?”' }, { c3: 3 }],
        [{ tj: '«Дар баҳси ҳуқуқӣ чӣ тавр ғолиб шавам?»', ru: '«Как выиграть юридический спор?»', en: '“How do I win a legal dispute?”' }, { c4: 3 }],
    ]),
    q('m14', 'environment', {
        tj: 'Ҷойи кори орзуи шумо чӣ гуна аст?',
        ru: 'Какое у вас место работы мечты?',
        en: 'What does your dream workplace look like?',
    }, [
        [{ tj: 'Лаборатория, клиника ё табиати кушод', ru: 'Лаборатория, клиника или природа', en: 'A lab, a clinic or the outdoors' }, { c5: 3 }],
        [{ tj: 'Офиси ширкат бо мизи худ ва ҳисоботҳо', ru: 'Офис компании со своим столом и отчётами', en: 'A company office with my own desk and reports' }, { c2: 3 }],
        [{ tj: 'Синфхона, студия ё саҳна', ru: 'Класс, студия или сцена', en: 'A classroom, a studio or a stage' }, { c3: 3 }],
        [{ tj: 'Устохона, сохтмон ё утоқи серверҳо', ru: 'Мастерская, стройка или серверная', en: 'A workshop, a building site or a server room' }, { c1: 3 }],
        [{ tj: 'Толори суд, вазорат ё созмони байналмилалӣ', ru: 'Зал суда, министерство или международная организация', en: 'A courtroom, a ministry or an international organisation' }, { c4: 3 }],
    ]),
    q('m15', 'scenario', {
        tj: 'Ба шумо кадом супориш бештар маъқул аст?',
        ru: 'Какое задание вам нравится больше?',
        en: 'Which kind of task do you like more?',
    }, [
        [{ tj: 'Ҷадвал, омор ва хулоса аз рақамҳо', ru: 'Таблица, статистика и выводы из цифр', en: 'Tables, statistics and conclusions from numbers' }, { c2: 3, c1: 1 }],
        [{ tj: 'Ҳисоб, чертёж ё навиштани код', ru: 'Расчёт, чертёж или написание кода', en: 'Calculations, a drawing or writing code' }, { c1: 3 }],
        [{ tj: 'Тарҷума, ҳикоя ё нутқ барои чорабинӣ', ru: 'Перевод, рассказ или речь для мероприятия', en: 'A translation, a story or a speech for an event' }, { c3: 3 }],
        [{ tj: 'Таҷриба бо растанӣ, ҳайвон ё моддаҳо', ru: 'Опыт с растениями, животными или веществами', en: 'An experiment with plants, animals or substances' }, { c5: 3 }],
        [{ tj: 'Баҳси дебат: кӣ ҳақ аст ва чаро', ru: 'Дебаты: кто прав и почему', en: 'A debate: who is right and why' }, { c4: 3, c3: 1 }],
    ]),
    q('m16', 'motivation', {
        tj: 'Баъди 10 сол мехоҳед дар бораи шумо чӣ гӯянд?',
        ru: 'Что бы вы хотели, чтобы о вас говорили через 10 лет?',
        en: 'In 10 years, what would you like people to say about you?',
    }, [
        [{ tj: '«Ӯ ҷони одамонро наҷот медиҳад»', ru: '«Он спасает жизни людей»', en: '“They save people’s lives”' }, { c5: 3 }],
        [{ tj: '«Ӯ чизе сохт, ки зиндагии ҳамаро осон кард»', ru: '«Он создал то, что облегчило жизнь всем»', en: '“They built something that made life easier for all”' }, { c1: 3 }],
        [{ tj: '«Ӯ ширкати бузург кушод ва ҷои кор дод»', ru: '«Он открыл большую компанию и дал людям работу»', en: '“They started a big company and created jobs”' }, { c2: 3 }],
        [{ tj: '«Шогирдону хонандагонаш ӯро дӯст медоранд»', ru: '«Его любят ученики и читатели»', en: '“Their students and readers love them”' }, { c3: 3 }],
        [{ tj: '«Ӯ барои адолат ва ҳуқуқи одамон мубориза мебарад»', ru: '«Он борется за справедливость и права людей»', en: '“They fight for justice and people’s rights”' }, { c4: 3 }],
    ]),
    // ── Саволҳои «пинҳон» (m17–m24) ─────────────────────────────────────
    // Дар бораи тарзи кор ва вазъиятҳо, на дар бораи фан ё касб: аз матн маълум
    // нест, ки кадом самт санҷида мешавад. Ҳар ҷавоб ба ду самт хол медиҳад
    // (2 + 1), то натиҷаро аз як савол «интихоб» кардан натавонанд.
    q('m17', 'scenario', {
        tj: 'Ба гурӯҳ кори калон супориданд. Шумо одатан кадом қисмро ба дӯш мегиред?',
        ru: 'Группе дали большую работу. Какую часть вы обычно берёте на себя?',
        en: 'Your group gets a big assignment. Which part do you usually take?',
    }, [
        [{ tj: 'Нақша мекашам ва вақту захираҳоро тақсим мекунам', ru: 'Составляю план и распределяю время и ресурсы', en: 'I make the plan and split the time and resources' }, { c2: 2, c4: 1 }],
        [{ tj: 'Қисми душвортаринро, ки дақиқӣ мехоҳад, худам месозам', ru: 'Сам делаю самую сложную часть, где нужна точность', en: 'I do the hardest part that needs precision myself' }, { c1: 2, c5: 1 }],
        [{ tj: 'Матн ва намоиши ниҳоиро зебо месозам', ru: 'Делаю красивыми итоговый текст и презентацию', en: 'I make the final text and presentation look good' }, { c3: 2, c2: 1 }],
        [{ tj: 'Мебинам, ки касе хаста ё бемор нашуда бошад, ва ғамхорӣ мекунам', ru: 'Слежу, чтобы никто не устал и не заболел, и забочусь о ребятах', en: 'Make sure nobody gets exhausted or ill, and look after people' }, { c5: 2, c3: 1 }],
        [{ tj: 'Вақте баҳс сар мешавад, ҳамаро оштӣ медиҳам ва қоида мегузорам', ru: 'Когда начинается спор, мирю всех и ввожу правила', en: 'When an argument starts, I settle it and set the rules' }, { c4: 2, c3: 1 }],
    ]),
    q('m18', 'scenario', {
        tj: 'Дар хона чизе вайрон шуд ва касе намедонад чаро. Шумо чӣ мекунед?',
        ru: 'Дома что-то сломалось, и никто не знает почему. Что вы делаете?',
        en: 'Something broke at home and nobody knows why. What do you do?',
    }, [
        [{ tj: 'Қадам ба қадам месанҷам, то сабабро ёбам', ru: 'Проверяю шаг за шагом, пока не найду причину', en: 'Check it step by step until I find the cause' }, { c1: 2, c5: 1 }],
        [{ tj: 'Ҳисоб мекунам: таъмир арзонтар аст ё нав харидан', ru: 'Считаю: дешевле починить или купить новое', en: 'Work out whether fixing or buying new is cheaper' }, { c2: 2, c1: 1 }],
        [{ tj: 'Чек ва кафолатро меёбам ва бо фурӯшанда гуфтушунид мекунам', ru: 'Нахожу чек и гарантию и договариваюсь с продавцом', en: 'Find the receipt and warranty and negotiate with the seller' }, { c4: 2, c2: 1 }],
        [{ tj: 'Дастурро мехонам ва ба дигарон бо забони содда мефаҳмонам', ru: 'Читаю инструкцию и объясняю другим простыми словами', en: 'Read the manual and explain it to others in simple words' }, { c3: 2, c1: 1 }],
        [{ tj: 'Аввал месанҷам, ки касе захмӣ нашуда бошад ва ҳама бехатар бошанд', ru: 'Сначала проверяю, что никто не поранился и всё безопасно', en: 'First make sure nobody is hurt and everything is safe' }, { c5: 2, c4: 1 }],
    ]),
    q('m19', 'motivation', {
        tj: 'Кадом таъриф ба шумо бештар хуш меояд?',
        ru: 'Какая похвала вам приятнее всего?',
        en: 'Which compliment pleases you most?',
    }, [
        [{ tj: '«Бо ту ҳама чиз дақиқ ва бехато аст»', ru: '«С тобой всё точно и без ошибок»', en: '«With you everything is exact and error-free»' }, { c1: 2, c2: 1 }],
        [{ tj: '«Ту ҳамеша роҳи фоиданокро меёбӣ»', ru: '«Ты всегда находишь выгодный путь»', en: '«You always find the profitable way»' }, { c2: 2, c4: 1 }],
        [{ tj: '«Ту хеле зебо гап мезанӣ»', ru: '«Ты очень красиво говоришь»', en: '«You speak so beautifully»' }, { c3: 2, c4: 1 }],
        [{ tj: '«Бо ту одам худро бехатар ҳис мекунад»', ru: '«Рядом с тобой чувствуешь себя в безопасности»', en: '«People feel safe around you»' }, { c5: 2, c4: 1 }],
        [{ tj: '«Ту ҳамеша ҳаққониятро ҳимоя мекунӣ»', ru: '«Ты всегда защищаешь справедливость»', en: '«You always stand up for what is fair»' }, { c4: 2, c3: 1 }],
    ]),
    q('m20', 'environment', {
        tj: 'Рӯзи кории идеалии шумо чӣ гуна мегузарад?',
        ru: 'Как проходит ваш идеальный рабочий день?',
        en: 'What does your ideal working day look like?',
    }, [
        [{ tj: 'Танҳо, дар хомӯшӣ, бо як масъалаи душвор', ru: 'Один, в тишине, над одной сложной задачей', en: 'Alone, in quiet, on one hard problem' }, { c1: 2, c5: 1 }],
        [{ tj: 'Бисёр вохӯрӣ, гуфтушунид ва қарорҳои зуд', ru: 'Много встреч, переговоров и быстрых решений', en: 'Lots of meetings, negotiations and quick decisions' }, { c2: 2, c4: 1 }],
        [{ tj: 'Бо гурӯҳи хурд чизи нав эҷод мекунем', ru: 'С небольшой командой создаём что-то новое', en: 'Creating something new with a small team' }, { c3: 2, c1: 1 }],
        [{ tj: 'Дар ҳаракат, бо одамони гуногун, ҳар соат вазъияти нав', ru: 'В движении, с разными людьми, каждый час новая ситуация', en: 'On the move, with different people, a new situation every hour' }, { c5: 2, c2: 1 }],
        [{ tj: 'Ҳуҷҷатҳоро меомӯзам ва барои касе қарори муҳим омода мекунам', ru: 'Изучаю документы и готовлю важное решение для кого-то', en: 'Study documents and prepare an important decision for someone' }, { c4: 2, c2: 1 }],
    ]),
    q('m21', 'scenario', {
        tj: 'Ба шумо 1000 сомонӣ доданд, ки барои маҳалла чизи муфид кунед. Ба чӣ сарф мекунед?',
        ru: 'Вам дали 1000 сомони, чтобы сделать что-то полезное для махалли. На что потратите?',
        en: 'You get 1,000 somoni to do something useful for your neighbourhood. What do you spend it on?',
    }, [
        [{ tj: 'Чароғҳои кӯча бо панели офтобӣ', ru: 'Уличные фонари на солнечных панелях', en: 'Solar-powered street lights' }, { c1: 2, c2: 1 }],
        [{ tj: 'Дӯкони хурд, ки фоидааш ба маҳалла бимонад', ru: 'Маленький магазин, чтобы прибыль оставалась махалле', en: 'A small shop whose profit stays in the neighbourhood' }, { c2: 2, c4: 1 }],
        [{ tj: 'Китобхонаи хурд ва дарсҳои ройгон барои кӯдакон', ru: 'Маленькая библиотека и бесплатные уроки для детей', en: 'A small library and free lessons for children' }, { c3: 2, c5: 1 }],
        [{ tj: 'Қуттии ёрии аввал ва майдончаи варзишӣ', ru: 'Аптечка первой помощи и спортивная площадка', en: 'A first-aid kit and a sports ground' }, { c5: 2, c3: 1 }],
        [{ tj: 'Маслиҳати ройгони ҳуқуқшинос барои оилаҳои камбизоат', ru: 'Бесплатная консультация юриста для малообеспеченных семей', en: 'Free legal advice for low-income families' }, { c4: 2, c5: 1 }],
    ]),
    q('m22', 'scenario', {
        tj: 'Шумо хато кардед ва ҳама дид. Аввал чӣ мекунед?',
        ru: 'Вы ошиблись, и все это увидели. Что вы сделаете первым делом?',
        en: 'You made a mistake and everyone saw it. What do you do first?',
    }, [
        [{ tj: 'Мефаҳмам, ки хато дар куҷо буд, то дигар такрор нашавад', ru: 'Разбираюсь, где была ошибка, чтобы она не повторилась', en: 'Figure out where it went wrong so it does not happen again' }, { c1: 2, c4: 1 }],
        [{ tj: 'Ҳисоб мекунам, ки зарар чӣ қадар аст ва чӣ тавр ҷуброн кунам', ru: 'Считаю, какой ущерб, и как его компенсировать', en: 'Work out the damage and how to make up for it' }, { c2: 2, c1: 1 }],
        [{ tj: 'Ростқавлона мегӯям ва бо ҳазл вазъиятро сабук мекунам', ru: 'Честно признаю и разряжаю обстановку шуткой', en: 'Admit it honestly and lighten the mood with a joke' }, { c3: 2, c5: 1 }],
        [{ tj: 'Аввал мепурсам, ки ба касе зарар нарасид', ru: 'Сначала узнаю, не пострадал ли кто-нибудь', en: 'First check that nobody was harmed' }, { c5: 2, c3: 1 }],
        [{ tj: 'Мефаҳмам, ки кӣ масъул аст ва қоида чӣ мегӯяд', ru: 'Выясняю, кто отвечает и что говорят правила', en: 'Find out who is responsible and what the rules say' }, { c4: 2, c2: 1 }],
    ]),
    q('m23', 'environment', {
        tj: 'Дар сафар шуморо бештар чӣ ҷалб мекунад?',
        ru: 'Что вас больше всего привлекает в поездке?',
        en: 'What attracts you most when you travel?',
    }, [
        [{ tj: 'Пулҳо, нерӯгоҳҳо ва чӣ тавр сохта шудани биноҳо', ru: 'Мосты, электростанции и то, как устроены здания', en: 'Bridges, power plants and how buildings are made' }, { c1: 2, c2: 1 }],
        [{ tj: 'Бозорҳо, нархҳо ва чӣ мефурӯшанд', ru: 'Рынки, цены и чем там торгуют', en: 'Markets, prices and what people sell' }, { c2: 2, c3: 1 }],
        [{ tj: 'Забон, урфу одат ва ҳикояҳои мардум', ru: 'Язык, обычаи и истории людей', en: 'The language, customs and stories of the people' }, { c3: 2, c4: 1 }],
        [{ tj: 'Табиат, кӯҳҳо, ҳайвонот ва растаниҳо', ru: 'Природа, горы, животные и растения', en: 'Nature, mountains, animals and plants' }, { c5: 2, c2: 1 }],
        [{ tj: 'Ёдгориҳои таърихӣ ва чӣ тавр давлат идора мешавад', ru: 'Исторические памятники и как устроено государство', en: 'Historic sites and how the country is governed' }, { c4: 2, c3: 1 }],
    ]),
    q('m24', 'motivation', {
        tj: 'Кадом мушкил шуморо бештар асабонӣ мекунад?',
        ru: 'Какая проблема раздражает вас сильнее всего?',
        en: 'Which problem annoys you the most?',
    }, [
        [{ tj: 'Вақте чизе бад сохта шудааст ва кор намекунад', ru: 'Когда что-то плохо сделано и не работает', en: 'When something is badly made and does not work' }, { c1: 2, c3: 1 }],
        [{ tj: 'Вақте пул беҳуда сарф мешавад', ru: 'Когда деньги тратятся впустую', en: 'When money is wasted' }, { c2: 2, c4: 1 }],
        [{ tj: 'Вақте одамон якдигарро намефаҳманд', ru: 'Когда люди не понимают друг друга', en: 'When people do not understand each other' }, { c3: 2, c5: 1 }],
        [{ tj: 'Вақте касе бемор аст ва ёрӣ намерасад', ru: 'Когда кто-то болен, а помощь не приходит', en: 'When someone is ill and help does not come' }, { c5: 2, c4: 1 }],
        [{ tj: 'Вақте ба касе беадолатӣ мекунанд', ru: 'Когда с кем-то поступают несправедливо', en: 'When someone is treated unfairly' }, { c4: 2, c5: 1 }],
    ]),
];
