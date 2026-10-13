// Маоши миёнаи соҳаҳо — ҳамон рақамҳои саҳифаи ихтисос (Front/src/lib/salarySectors.js),
// то AI ҳамон чизеро гӯяд, ки сайт нишон медиҳад. Ҳангоми навсозӣ ҳарду файлро иваз кунед.
export const SALARY_SOURCE = { agency: 'Агентии омори назди Президенти ҶТ', period: 'июни 2026', nationalAverage: 3800 };

const SECTORS: Record<string, { name: string; amount: number }> = {
    finance: { name: 'Молия ва суғурта', amount: 8300 },
    it: { name: 'Иттилоот ва алоқа', amount: 7000 },
    energy: { name: 'Энергетика', amount: 5700 },
    mining: { name: 'Саноати кӯҳӣ', amount: 5300 },
    education: { name: 'Маориф', amount: 4400 },
    construction: { name: 'Сохтмон', amount: 4000 },
    transport: { name: 'Нақлиёт ва анборпарварӣ', amount: 3700 },
    manufacturing: { name: 'Саноати коркард', amount: 3300 },
    services: { name: 'Хизматрасонӣ', amount: 3200 },
    publicAdmin: { name: 'Идораи давлатӣ', amount: 2779 },
    realEstate: { name: 'Амволи ғайриманқул', amount: 2500 },
    health: { name: 'Тандурустӣ', amount: 2400 },
    water: { name: 'Обтаъминкунӣ ва партовҳо', amount: 2000 },
    agriculture: { name: 'Кишоварзӣ ва ҷангалпарварӣ', amount: 1388 },
};

const KEYWORDS: Array<[RegExp, string]> = [
    [/барномасоз|информатика|компютер|технологияи итти|киберамният|шабака|барнома/i, 'it'],
    [/муҳосиб|молия|бонк|суғурта|андоз|аудит|қарз|буҷа/i, 'finance'],
    [/энергетик|барқ|нерӯгоҳ|гидроэнерг/i, 'energy'],
    [/кӯҳӣ|маъдан|геолог|нафт|газ|кон/i, 'mining'],
    [/сохтмон|меъмор|биноко|роҳсоз|архитект/i, 'construction'],
    [/нақлиёт|логистик|роҳи оҳан|автомобил|ҳавонавард/i, 'transport'],
    [/тиб|духтур|ҳамшира|дорусоз|стоматолог|педиатр|фарматс|санитар|биолог/i, 'health'],
    [/омӯзгор|педагог|муаллим|таълим|мактаб|тарбия|методик/i, 'education'],
    [/кишоварз|агроном|зооте|ҷангал|чорво|заминсоз|обёр/i, 'agriculture'],
    [/об ва |обтаъмин|партов|экология|муҳити зист/i, 'water'],
    [/ҳуқуқ|адлия|прокурор|суд|милитсия|гумрук|давлат|идораи/i, 'publicAdmin'],
    [/меҳмонхона|туризм|сайёҳ|хизматрасон|тарабхона|савдо/i, 'services'],
    [/амволи ғайриманқул|кадастр/i, 'realEstate'],
    [/саноат|технолог|мошинсоз|коркард|нассоҷ|хӯрокворӣ/i, 'manufacturing'],
];

const BY_CLUSTER: Record<string, string> = {
    'Табиӣ ва техникӣ': 'manufacturing',
    'Тиб, биология ва варзиш': 'health',
    'Иқтисод ва география': 'finance',
    'Ҷомеашиносӣ ва ҳуқуқ': 'publicAdmin',
    'Филология, педагогика ва санъат': 'education',
};

export function sectorFor(careerName?: string | null, clusterName?: string | null): { name: string; amount: number } | null {
    const hit = KEYWORDS.find(([pattern]) => pattern.test(careerName ?? ''));
    const key = hit ? hit[1] : BY_CLUSTER[clusterName ?? ''];
    return key ? SECTORS[key] : null;
}
