// O*NET Interest Profiler Short Form: 60 кор ва 6 шавқи Холланд (RIASEC). Матни англисӣ аслист;
// тоҷикӣ ва русӣ тарҷумаи мост ва ҳанӯз аз санҷиши мутахассис нагузаштааст.

class IpItem {
  const IpItem(this.type, this.tj, this.ru, this.en);
  final String type, tj, ru, en;
}

class IpType {
  const IpType(this.tj, this.ru, this.en, this.tjDesc, this.ruDesc, this.enDesc);
  final String tj, ru, en, tjDesc, ruDesc, enDesc;
}

const ipItems = <IpItem>[
  IpItem('R', 'Ҷевони ошхона сохтан', 'Делать кухонные шкафы', 'Build kitchen cabinets'),
  IpItem('I', 'Доруи нав сохтан', 'Разрабатывать новое лекарство', 'Develop a new medicine'),
  IpItem('A', 'Китоб ё намоишнома навиштан', 'Писать книги или пьесы', 'Write books or plays'),
  IpItem('S', 'Ба одам машқҳои варзиширо омӯзондан', 'Обучать человека комплексу упражнений', 'Teach an individual an exercise routine'),
  IpItem('E', 'Саҳмия ва вомбарг харидану фурӯхтан', 'Покупать и продавать акции и облигации', 'Buy and sell stocks and bonds'),
  IpItem('C', 'Дар компютер ҷадвали ҳисоб сохтан', 'Создавать электронную таблицу на компьютере', 'Develop a spreadsheet using computer software'),
  IpItem('R', 'Хишт ё сафолак гузоштан', 'Класть кирпич или плитку', 'Lay brick or tile'),
  IpItem('I', 'Роҳҳои кам кардани ифлосшавии обро омӯхтан', 'Изучать способы уменьшить загрязнение воды', 'Study ways to reduce water pollution'),
  IpItem('A', 'Асбоби мусиқӣ навохтан', 'Играть на музыкальном инструменте', 'Play a musical instrument'),
  IpItem('S', 'Ба одамон дар мушкилоти шахсӣ ва рӯҳӣ ёрӣ расондан', 'Помогать людям с личными или эмоциональными проблемами', 'Help people with personal or emotional problems'),
  IpItem('E', 'Мағозаро идора кардан', 'Управлять розничным магазином', 'Manage a retail store'),
  IpItem('C', 'Хатоҳои сабтҳо ва варақаҳоро санҷидан', 'Вычитывать записи и бланки', 'Proofread records or forms'),
  IpItem('R', 'Асбобҳои рӯзғорро таъмир кардан', 'Ремонтировать бытовую технику', 'Repair household appliances'),
  IpItem('I', 'Таҷрибаҳои химиявӣ гузарондан', 'Проводить химические опыты', 'Conduct chemical experiments'),
  IpItem('A', 'Оҳанг эҷод ё аранжировка кардан', 'Сочинять или аранжировать музыку', 'Compose or arrange music'),
  IpItem('S', 'Ба одамон дар интихоби касб маслиҳат додан', 'Давать людям советы по выбору профессии', 'Give career guidance to people'),
  IpItem('E', 'Толори зебоӣ ё сартарошхонаро пеш бурдан', 'Вести салон красоты или парикмахерскую', 'Operate a beauty salon or barber shop'),
  IpItem('C', 'Дар шабакаи калон ба компютерҳо барнома насб кардан', 'Устанавливать программы на компьютеры в большой сети', 'Install software across computers on a large network'),
  IpItem('R', 'Дар моҳипарварӣ моҳӣ парваридан', 'Разводить рыбу в рыбном хозяйстве', 'Raise fish in a fish hatchery'),
  IpItem('I', 'Ҳаракати сайёраҳоро омӯхтан', 'Изучать движение планет', 'Study the movement of planets'),
  IpItem('A', 'Расм кашидан', 'Рисовать картины', 'Draw pictures'),
  IpItem('S', 'Табобати барқарорсозӣ гузарондан', 'Проводить восстановительную терапию', 'Perform rehabilitation therapy'),
  IpItem('E', 'Шӯъбаи ширкати калонро идора кардан', 'Руководить отделом большой компании', 'Manage a department within a large company'),
  IpItem('C', 'Бо ҳисобкунак кор кардан', 'Работать на калькуляторе', 'Operate a calculator'),
  IpItem('R', 'Қисмҳои электрониро ҷамъ кардан', 'Собирать электронные детали', 'Assemble electronic parts'),
  IpItem('I', 'Намунаи хунро зери микроскоп дидан', 'Исследовать образцы крови под микроскопом', 'Examine blood samples using a microscope'),
  IpItem('A', 'Барои филм эффектҳои махсус сохтан', 'Создавать спецэффекты для фильмов', 'Create special effects for movies'),
  IpItem('S', 'Дар ташкилоти ғайритиҷоратӣ ихтиёрӣ кор кардан', 'Работать волонтёром в некоммерческой организации', 'Do volunteer work at a non-profit organization'),
  IpItem('E', 'Кори худро оғоз кардан', 'Открыть собственное дело', 'Start your own business'),
  IpItem('C', 'Сабти фиристодан ва қабули борро бурдан', 'Вести учёт отправки и получения грузов', 'Keep shipping and receiving records'),
  IpItem('R', 'Бо мошини боркаш борҳоро ба идораю хонаҳо расондан', 'Водить грузовик и доставлять посылки в офисы и дома', 'Drive a truck to deliver packages to offices and homes'),
  IpItem('I', 'Сабаби сӯхторро таҳқиқ кардан', 'Расследовать причину пожара', 'Investigate the cause of a fire'),
  IpItem('A', 'Ороиши саҳнаи намоишро ранг кардан', 'Расписывать декорации для спектаклей', 'Paint sets for plays'),
  IpItem('S', 'Ба кӯдакон варзиш омӯзондан', 'Учить детей заниматься спортом', 'Teach children how to play sports'),
  IpItem('E', 'Дар бораи шартномаҳои тиҷоратӣ гуфтушунид кардан', 'Вести переговоры о деловых контрактах', 'Negotiate business contracts'),
  IpItem('C', 'Музди кормандонро ҳисоб кардан', 'Рассчитывать зарплату сотрудников', 'Calculate the wages of employees'),
  IpItem('R', 'Пеш аз фиристодан сифати қисмҳоро санҷидан', 'Проверять качество деталей перед отправкой', 'Test the quality of parts before shipment'),
  IpItem('I', 'Роҳи дақиқтари пешгӯии обу ҳаво ёфтан', 'Разрабатывать способ точнее предсказывать погоду', 'Develop a way to better predict the weather'),
  IpItem('A', 'Барои филм ё барномаи телевизионӣ сенария навиштан', 'Писать сценарии для фильмов или телепередач', 'Write scripts for movies or television shows'),
  IpItem('S', 'Ба одамони ношунаво ё гаронгӯш забони имову ишора омӯзондан', 'Обучать языку жестов глухих и слабослышащих людей', 'Teach sign language to people who are deaf or hard of hearing'),
  IpItem('E', 'Дар суд манфиати мизоҷро ҳимоя кардан', 'Представлять клиента в суде', 'Represent a client in a lawsuit'),
  IpItem('C', 'Бо дастгоҳи дастӣ молҳоро ба ҳисоб гирифтан', 'Вести инвентаризацию с помощью карманного компьютера', 'Inventory supplies using a hand-held computer'),
  IpItem('R', 'Қулфҳоро таъмир ва насб кардан', 'Ремонтировать и устанавливать замки', 'Repair and install locks'),
  IpItem('I', 'Дар озмоишгоҳи биология кор кардан', 'Работать в биологической лаборатории', 'Work in a biology lab'),
  IpItem('A', 'Раққоси ҷаз ё степ шудан', 'Исполнять джазовый танец или степ', 'Perform jazz or tap dance'),
  IpItem('S', 'Дар гузарондани ҷаласаи терапияи гурӯҳӣ ёрӣ додан', 'Помогать проводить сеанс групповой терапии', 'Help conduct a group therapy session'),
  IpItem('E', 'Силсилаи нави либосро ба бозор баровардан', 'Продвигать новую линию одежды', 'Market a new line of clothing'),
  IpItem('C', 'Пардохти иҷораро сабт кардан', 'Записывать платежи за аренду', 'Record rent payments'),
  IpItem('R', 'Дастгоҳҳои истеҳсолиро танзим ва идора кардан', 'Настраивать станки для выпуска продукции и работать на них', 'Set up and operate machines to make products'),
  IpItem('I', 'Ивазкунандаи қанд ихтироъ кардан', 'Изобрести заменитель сахара', 'Invent a replacement for sugar'),
  IpItem('A', 'Дар гурӯҳи мусиқӣ суруд хондан', 'Петь в музыкальной группе', 'Sing in a band'),
  IpItem('S', 'Дар боғча аз кӯдакон нигоҳубин кардан', 'Присматривать за детьми в детском саду', 'Take care of children at a day-care center'),
  IpItem('E', 'Дар универмаг мол фурӯхтан', 'Продавать товары в универмаге', 'Sell merchandise at a department store'),
  IpItem('C', 'Сабти молҳои анборро бурдан', 'Вести учёт товаров на складе', 'Keep inventory records'),
  IpItem('R', 'Сӯхтори ҷангалро хомӯш кардан', 'Тушить лесные пожары', 'Put out forest fires'),
  IpItem('I', 'Барои муайян кардани беморӣ таҳлили озмоишгоҳӣ кардан', 'Делать лабораторные анализы для выявления болезней', 'Do laboratory tests to identify diseases'),
  IpItem('A', 'Филмро монтаж кардан', 'Монтировать фильмы', 'Edit movies'),
  IpItem('S', 'Дар синфҳои болоӣ дарс додан', 'Преподавать в старших классах', 'Teach a high-school class'),
  IpItem('E', 'Мағозаи либосро идора кардан', 'Управлять магазином одежды', 'Manage a clothing store'),
  IpItem('C', 'Номаҳои ташкилотро мӯҳр задан, ҷудо ва тақсим кардан', 'Штамповать, сортировать и разносить почту организации', 'Stamp, sort, and distribute mail for an organization'),
];

const ipTypes = <String, IpType>{
  'R': IpType('Амалӣ', 'Практический', 'Realistic', 'Кор бо дасту техника, абзор ва табиат.', 'Работа руками, с техникой, инструментами и на природе.', 'Hands-on work with machines, tools and nature.'),
  'I': IpType('Таҳқиқотӣ', 'Исследовательский', 'Investigative', 'Омӯхтан, таҳлил кардан ва ҳал кардани масъалаҳои илмӣ.', 'Изучение, анализ и решение научных задач.', 'Studying, analysing and solving scientific problems.'),
  'A': IpType('Эҷодӣ', 'Творческий', 'Artistic', 'Сохтани чизи нав дар санъат, матн, мусиқӣ ва дизайн.', 'Создание нового в искусстве, текстах, музыке и дизайне.', 'Creating in art, writing, music and design.'),
  'S': IpType('Иҷтимоӣ', 'Социальный', 'Social', 'Омӯзондан, нигоҳубин ва ёрӣ расондан ба одамон.', 'Обучение, забота и помощь людям.', 'Teaching, caring for and helping people.'),
  'E': IpType('Соҳибкорӣ', 'Предпринимательский', 'Enterprising', 'Роҳбарӣ, фурӯш, гуфтушунид ва оғози кор.', 'Руководство, продажи, переговоры и запуск дела.', 'Leading, selling, negotiating and starting ventures.'),
  'C': IpType('Ташкилӣ', 'Организационный', 'Conventional', 'Кор бо рақам, ҳуҷҷат, сабт ва тартибу низом.', 'Работа с числами, документами, записями и порядком.', 'Working with numbers, records and order.'),
};

const ipCredit = 'This page includes information from the O*NET Career Exploration Tools by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the O*NET Tools Developer License. O*NET® is a trademark of USDOL/ETA. Ikhtisosi Man has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.';
