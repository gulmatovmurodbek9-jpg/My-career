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
];
