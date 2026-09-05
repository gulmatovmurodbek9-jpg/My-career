/**
 * City and region for every settlement that appears in the NTC admission table.
 *
 * The official table names the institution only, so location is resolved here.
 * Most names carry the place ("дар шаҳри Хуҷанд", "ноҳияи Рашт", "Донишгоҳи
 * давлатии Кӯлоб"); republic-wide institutions sit in Душанбе.
 *
 * Coordinates are given only for the larger cities, where they are reliable
 * enough for the "nearest university" distance in career.service.ts. Smaller
 * districts are left without coordinates rather than guessed — `latitude` and
 * `longitude` are nullable and the distance helper already skips nulls.
 */

export interface Settlement {
    region: string;
    latitude?: number;
    longitude?: number;
}

/** Settlement → region (+ coordinates where reliable). */
export const SETTLEMENTS: Record<string, Settlement> = {
    // ── Republican cities ──
    'Душанбе': { region: 'Душанбе', latitude: 38.5598, longitude: 68.787 },

    // ── Суғд ──
    'Хуҷанд': { region: 'Суғд', latitude: 40.2833, longitude: 69.6333 },
    'Истаравшан': { region: 'Суғд', latitude: 39.9111, longitude: 69.0089 },
    'Конибодом': { region: 'Суғд', latitude: 40.2833, longitude: 70.4333 },
    'Исфара': { region: 'Суғд', latitude: 40.1269, longitude: 70.6222 },
    'Панҷакент': { region: 'Суғд', latitude: 39.4953, longitude: 67.6086 },
    'Бӯстон': { region: 'Суғд', latitude: 40.2355, longitude: 69.6989 },
    'Гулистон': { region: 'Суғд', latitude: 40.267, longitude: 69.7981 },
    'Мастчоҳ': { region: 'Суғд', latitude: 40.4931, longitude: 69.3664 },
    'Зафаробод': { region: 'Суғд', latitude: 40.1527, longitude: 68.7841 },
    'Ҷаббор Расулов': { region: 'Суғд', latitude: 40.0843, longitude: 69.4839 },
    'Бобоҷон Ғафуров': { region: 'Суғд', latitude: 40.2216, longitude: 69.7296 },

    // ── Хатлон ──
    'Бохтар': { region: 'Хатлон', latitude: 37.8364, longitude: 68.7808 },
    'Кӯлоб': { region: 'Хатлон', latitude: 37.9144, longitude: 69.7808 },
    'Норак': { region: 'Хатлон', latitude: 38.3861, longitude: 69.3222 },
    'Левакант': { region: 'Хатлон', latitude: 37.8718, longitude: 68.9256 },
    'Данғара': { region: 'Хатлон', latitude: 38.0954, longitude: 69.3321 },
    'Ёвон': { region: 'Хатлон', latitude: 38.3177, longitude: 69.047 },
    'Восеъ': { region: 'Хатлон', latitude: 37.9424, longitude: 69.5969 },
    'Фархор': { region: 'Хатлон', latitude: 37.4846, longitude: 69.3303 },
    'Ховалинг': { region: 'Хатлон', latitude: 38.3888, longitude: 70.0931 },
    'Муъминобод': { region: 'Хатлон', latitude: 38.1729, longitude: 70.0674 },
    'Шаҳритус': { region: 'Хатлон', latitude: 37.2665, longitude: 68.1438 },
    'Қубодиён': { region: 'Хатлон', latitude: 37.4194, longitude: 68.3111 },
    'Панҷ': { region: 'Хатлон', latitude: 37.3126, longitude: 69.125 },
    'Дӯстӣ': { region: 'Хатлон', latitude: 37.499, longitude: 68.5011 },
    'Ҷайҳун': { region: 'Хатлон', latitude: 37.3264, longitude: 68.7268 },
    'Вахш': { region: 'Хатлон', latitude: 37.7716, longitude: 68.9951 },
    'Мир Сайид Алии Ҳамадонӣ': { region: 'Хатлон', latitude: 37.7183, longitude: 69.5605 },
    'Темурмалик': { region: 'Хатлон', latitude: 38.1141, longitude: 69.5242 },
    'Ҷалолиддини Балхӣ': { region: 'Хатлон', latitude: 37.5722, longitude: 69.0113 },

    // ── ВМКБ ──
    'Хоруғ': { region: 'ВМКБ', latitude: 37.4897, longitude: 71.5514 },

    // ── Ноҳияҳои тобеи ҷумҳурӣ ──
    'Турсунзода': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 38.5108, longitude: 68.2331 },
    'Ваҳдат': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 38.5581, longitude: 69.0186 },
    'Ҳисор': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 38.5281, longitude: 68.5533 },
    'Роғун': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 38.6952, longitude: 69.7572 },
    'Рашт': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 39.2, longitude: 70.3375 },
    'Лахш': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 39.2192, longitude: 71.2001 },
    'Нуробод': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 38.828, longitude: 70.0538 },
    'Сангвор': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 38.7965, longitude: 71.5314 },
    'Тоҷикобод': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 39.0722, longitude: 70.9071 },
    'Рӯдакӣ': { region: 'Ноҳияҳои тобеи ҷумҳурӣ', latitude: 38.2559, longitude: 68.5099 },
};

/**
 * Institutions whose name does not name their location, or where the name would
 * mislead a text match (a branch is located somewhere other than its parent).
 * Everything else is resolved by `resolveCity` below.
 */
const EXPLICIT_CITIES: Record<string, string> = {
    'Академияи идоракунии давлатии назди Президенти Ҷумҳурии Точикистон': 'Душанбе',
    'Донишгоҳи (славянии) Россия ва Тоҷикистон': 'Душанбе',
    'Донишгоҳи Осиёи Марказӣ': 'Хоруғ',
    'Донишгоҳи аграрии Тоҷикистон ба номи Шириншоҳ Шоҳтемур': 'Душанбе',
    'Донишгоҳи байналмилалии забонҳои хориҷии Тоҷикистон ба номи Сотим Улуғзода': 'Душанбе',
    'Донишгоҳи байналмилалии сайёҳӣ ва соҳибкории Тоҷикистон': 'Душанбе',
    'Донишгоҳи давлатии молия ва иқтисоди Тоҷикистон': 'Душанбе',
    'Донишгоҳи давлатии омӯзгории Тоҷикистон ба номи Садриддин Айнӣ': 'Душанбе',
    'Донишгоҳи давлатии тиббии Тоҷикистон ба номи Абӯалӣ ибни Сино': 'Душанбе',
    'Донишгоҳи давлатии тиббии Хатлон': 'Данғара',
    'Донишгоҳи давлатии тиҷорати Тоҷикистон': 'Душанбе',
    'Донишгоҳи давлатии ҳуқуқ, бизнес ва сиёсати Тоҷикистон': 'Хуҷанд',
    'Донишгоҳи инноватсия ва технологияҳои рақамии Тоҷикистон': 'Душанбе',
    'Донишгоҳи миллии Тоҷикистон': 'Душанбе',
    'Донишгоҳи техникии Тоҷикистон ба номи академик М. С. Осимӣ': 'Душанбе',
    'Донишгоҳи технологии Тоҷикистон': 'Душанбе',
    'Донишкадаи давлатии санъати тасвирӣ ва дизайни Тоҷикистон': 'Душанбе',
    'Донишкадаи давлатии фарҳанг ва санъати Тоҷикистон ба номи Мирзо Турсунзода': 'Душанбе',
    'Донишкадаи исломии Тоҷикистон ба номи Имоми Аъзам‐Абӯҳанифа Нуъмон ибни Собит': 'Душанбе',
    'Донишкадаи кӯҳӣ-металлургии Тоҷикистон': 'Бӯстон',
    'Донишкадаи саноат ва хизматрасонӣ (ғайридавлатӣ)': 'Душанбе',
    'Донишкадаи тарбияи ҷисмонии Тоҷикистон ба номи С. Раҳимов': 'Душанбе',
    'Донишкадаи тиббӣ-иҷтимоии Тоҷикистон (ғайридавлатӣ)': 'Душанбе',
    'Донишкадаи энергетикии Тоҷикистон': 'Бохтар',
    'Коллеҷи тарбияи ҷисмонии Тоҷикистон': 'Душанбе',
    'Коллеҷи технологӣ-фарматсевтии Тоҷикистон': 'Душанбе',
    'Коллеҷи тиббии ҷумҳуриявӣ': 'Душанбе',
    'Коллеҷи техникии Донишгоҳи техникии Тоҷикистон ба номи академик М. С. Осимӣ': 'Душанбе',
    'Коллеҷи омӯзгории ба номи Хосият Махсумоваи Донишгоҳи давлатии омӯзгории Тоҷикистон ба номи Садриддин Айнӣ': 'Душанбе',
    'Коллеҷи технологияҳои инноватсионӣ ва иттилоотӣ-коммуникатсионии Кӯлоб': 'Кӯлоб',
    'Коллеҷи тиббии Донишгоҳи давлатии тиббии Хатлон дар деҳаи Кангурти ноҳияи Темурмалик': 'Темурмалик',
    'Коллеҷи тиббии Донишгоҳи давлатии тиббии Хатлон дар ноҳияи Данғара': 'Данғара',
    'Коллеҷи политехникии Донишгоҳи давлатии Данғара': 'Данғара',
    'Коллеҷи омӯзгории Донишгоҳи давлатии Бохтар ба номи Носири Хусрав': 'Бохтар',
    'Коллеҷи омӯзгории Донишгоҳи давлатии Кӯлоб ба номи Абӯабдуллоҳи Рӯдакӣ': 'Кӯлоб',
    'Коллеҷи омӯзгории Донишгоҳи давлатии Хуҷанд ба номи академик Бобоҷон Ғафуров': 'Хуҷанд',
    'Коллеҷи кӯҳии ба номи С. Юсуповаи шаҳри Душанбе': 'Душанбе',
    'Коллеҷи тиббии шаҳри Хуҷанд ба номи Ю. Б. Исҳоқӣ': 'Хуҷанд',
    'Коллеҷи омӯзгории ба номи М. Турсунзодаи шаҳри Конибодом': 'Конибодом',
    'Коллеҷи технологии ба номи А. Қаҳҳорови шаҳри Конибодом': 'Конибодом',
    'Коллеҷи тиббии "Оби Гарм"-и шаҳри Роғун (ғайридавлатӣ)': 'Роғун',
    'Коллеҷи тиббии хусусии "Даво"-и шаҳри Бохтар': 'Бохтар',
    'Коллеҷи тиббии ноҳияи Мир Сайид Алии Ҳамадонӣ (ғайридавлатӣ)': 'Мир Сайид Алии Ҳамадонӣ',

    // Branches: the location is the trailing "дар ...", not the parent's city.
    'Филиали "Донишгоҳи миллии тадқиқотӣ"-и Донишкадаи энергетикии Москва дар шаҳри Душанбе': 'Душанбе',
    'Филиали Донишгоҳи давлатии Москва ба номи М. В. Ломоносов дар шаҳри Душанбе': 'Душанбе',
    'Филиали Донишгоҳи миллии таҳқиқотии технологӣ "МИСиС" дар шаҳри Душанбе': 'Душанбе',
    'Филиали Донишгоҳи технологии Тоҷикистон дар шаҳри Исфара': 'Исфара',
    'Филиали Коллеҷи муҳандисию омӯзгории шаҳри Душанбе дар ноҳияи Ёвон': 'Ёвон',
    'Филиали Коллеҷи муҳандисӣ-омӯзгории шаҳри Бохтар (ғайридавлатӣ) дар ноҳияи Ёвон': 'Ёвон',
    'Филиали Коллеҷи муҳандисӣ-омӯзгории шаҳри Бохтар (ғайридавлатӣ) дар ноҳияи Шаҳритус': 'Шаҳритус',
    'Филиали Коллеҷи муҳандисӣ-омӯзгории шаҳри Бохтар (ғайридавлатӣ) дар ноҳияи Ҳамадонӣ': 'Мир Сайид Алии Ҳамадонӣ',
    'Филиали Коллеҷи омӯзгорӣ-муҳандисии ноҳияи Ҷайҳун (ғайридавлатӣ) дар ноҳияи Дӯстӣ': 'Дӯстӣ',
    'Филиали Коллеҷи тарбияи ҷисмонии Тоҷикистон дар шаҳри Бӯстон': 'Бӯстон',
    'Филиали Коллеҷи тиббӣ-инноватсионии ноҳияи Панҷ (ғайридавлатӣ) дар ноҳияи Сангвор': 'Сангвор',
    'Филиали Коллеҷи тиббӣ-инноватсионии ноҳияи Панҷ (ғайридавлатӣ) дар ноҳияи Тоҷикобод': 'Тоҷикобод',
    'Филиали Коллеҷи тиббӣ-иҷтимоии шаҳри Левакант (ғайридавлатӣ) дар шаҳри Норак': 'Норак',
};

/** Longest settlement names first, so "Мир Сайид Алии Ҳамадонӣ" wins over "Ҳамадонӣ". */
const SETTLEMENT_NAMES = Object.keys(SETTLEMENTS).sort((a, b) => b.length - a.length);

/**
 * Resolves the settlement an institution sits in.
 *
 * A branch ("Филиали X дар Y") is located at Y, so the trailing "дар ..." is
 * checked before the rest of the name.
 */
export function resolveCity(universityName: string): string | null {
    const explicit = EXPLICIT_CITIES[universityName];
    if (explicit) return explicit;

    const branchSuffix = universityName.match(/\bдар\s+(?:шаҳри|ноҳияи|деҳаи)?\s*([^()]+)$/);
    if (branchSuffix) {
        const tail = branchSuffix[1].trim();
        const match = SETTLEMENT_NAMES.find((name) => tail.includes(name));
        if (match) return match;
    }

    // Honorific names collide with district names: "Донишгоҳи давлатии Кӯлоб ба
    // номи Абӯабдуллоҳи Рӯдакӣ" is in Кӯлоб, not in Рӯдакӣ district, and Хуҷанд's
    // university is named after Бобоҷон Ғафуров. The place always sits in the
    // part before "ба номи" — unless the name is listed in EXPLICIT_CITIES above,
    // which is checked first.
    const withoutHonorific = universityName.split(/\s+ба\s+номи\s+/)[0];

    const match = SETTLEMENT_NAMES.find((name) => withoutHonorific.includes(name))
        ?? SETTLEMENT_NAMES.find((name) => universityName.includes(name));
    return match ?? null;
}

/** "Донишгоҳ" | "Донишкада" | "Коллеҷ" | "Академия" | "Филиал" */
export function resolveInstitutionType(universityName: string): string {
    if (universityName.startsWith('Филиали')) return 'Филиал';
    if (universityName.startsWith('Академия')) return 'Академия';
    if (universityName.startsWith('Донишгоҳ')) return 'Донишгоҳ';
    if (universityName.startsWith('Донишкада')) return 'Донишкада';
    if (universityName.startsWith('Коллеҷ')) return 'Коллеҷ';
    return 'Муассисаи таълимӣ';
}

/**
 * Моликияти муассиса аз номи расмии он муайян мешавад.
 *
 * Ҷадвали ММТ сутуни алоҳидаи моликият надорад, вале ном онро ҳамеша нишон
 * медиҳад. Ду шакл истифода мешавад: «(ғайридавлатӣ)» ва «хусусӣ» — масалан
 * «Коллеҷи тиббии хусусии "Даво"». Танҳо шакли аввалро санҷидан он як
 * коллеҷро ҳамчун давлатӣ нишон медод.
 */
export function isStateOwned(universityName: string): boolean {
    const name = universityName.toLowerCase();
    return !name.includes('ғайридавлат') && !name.includes('хусус');
}
