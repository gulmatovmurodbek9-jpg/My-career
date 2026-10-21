// Санҷиши сифати ёвари AI (evaluation set): 25 саволи воқеии корбарон бо ҷавоби интизоршуда.
// Ҳар савол: амали дуруст (action) ва, агар лозим бошад, калимае, ки дар ҷавоб бояд бошад.
// Иҷро: node scripts/eval-assistant.mjs [https://ikhtisosiman.qobus.tj/api]
const base = process.argv[2] || 'https://ikhtisosiman.qobus.tj/api';

const CASES = [
    // Ҷустуҷӯ ва самтҳо
    { q: 'Мехоҳам барномасоз шавам', action: ['choose_direction'], has: 'барнома' },
    { q: 'Мехоҳам духтур шавам', action: ['choose_direction'], has: 'Стоматология|дандон' },
    { q: 'Мехоҳам духтури ҳайвонот шавам', action: ['choose_direction'], has: 'байтор' },
    { q: 'Мехоҳам ошпаз шавам', action: ['choose_direction'], has: 'хӯрок|қаннод' },
    { q: 'Мехоҳам ҳуқуқшинос шавам', action: ['choose_direction'] },
    { q: 'Духтуриро кушо', action: ['open_career', 'choose_direction', 'search'] },
    // Донишгоҳҳо
    { q: 'Донишгоҳи миллиро кушо', action: ['open_universities'], has: 'Душанбе' },
    { q: 'Ҳамаи коллеҷҳоро нишон деҳ', action: ['open_universities'] },
    { q: 'Кадом донишгоҳ ихтисоси стоматология дорад?', action: ['choose_university'], has: 'тиббӣ' },
    { q: 'Барномасозиро дар кадом донишгоҳ мехонанд?', action: ['choose_university'], has: 'техникӣ|техникии' },
    { q: 'Дар донишгоҳи техникӣ кадом ихтисосҳои барномасозӣ ҳаст?', action: ['choose_direction'], has: 'барномавӣ' },
    { q: 'Донишгоҳи сайёҳӣ ва соҳибкорӣ хуб аст ё техникӣ?', action: ['choose_university'] },
    { q: 'Барномасозиро дар Хуҷанд хуб меомӯзанд ё дар Душанбе?', action: ['choose_university'], has: 'Хуҷанд' },
    { q: 'Донишгоҳҳои наздик ба Молия', action: ['choose_university'], has: 'метр|километр' },
    // Пул ва буҷет
    { q: 'Ман панҷ ҳазор сомонӣ дорам, мехоҳам барномасозӣ хонам', action: ['choose_direction'], has: 'сомонӣ' },
    // Тест ва роҳҳои дигар
    { q: 'Санҷишро сар кун', action: ['start_quiz'] },
    { q: 'Не, ман тест намехоҳам', action: ['choose_page'], has: 'свайп' },
    { q: 'Нет, я не хочу тест', lang: 'ru', action: ['choose_page'] },
    // Саволҳои шахсӣ ва маълумотӣ
    { q: 'Ман донишгоҳе мехоҳам, ки баъд ба хориҷ рафта хонам. Ба фикри ту кадомаш беҳтар аст?', action: ['choose_university', 'answer'] },
    { q: 'Ихтисоси зеҳни сунъӣ то кадом дараҷа дар кор лозим аст?', action: ['choose_direction', 'answer', 'open_career'] },
    { q: 'Кадом ихтисосҳо аз ҳама машҳуранд?', action: ['choose_direction'], has: 'бал' },
    { q: 'Санҷиш ройгон аст?', action: ['answer'], has: 'ройгон' },
    // Танзимот
    { q: 'Мавзӯи торикро гузор', action: ['set_theme'] },
    { q: 'Забонро русӣ кун', action: ['set_language'] },
    { q: 'Ман баъди синфи 9 ҳастам', action: ['set_grade'] },
];

let passed = 0;
const times = [];
for (const c of CASES) {
    const started = Date.now();
    let data = {};
    try {
        const response = await fetch(`${base}/careers/assistant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: c.q, lang: c.lang || 'tj' }),
        });
        data = await response.json();
    } catch (error) {
        data = { action: 'ERROR', reply: String(error) };
    }
    const ms = Date.now() - started;
    times.push(ms);
    const actionOk = c.action.includes(data.action);
    const textOk = !c.has || new RegExp(c.has, 'i').test(`${data.reply || ''} ${JSON.stringify(data.params || {})}`);
    const ok = actionOk && textOk;
    if (ok) passed += 1;
    console.log(`${ok ? '✓' : '✗'} ${String(ms).padStart(5)} мс  ${c.q}\n      → ${data.action}: ${String(data.reply || '').slice(0, 110)}`);
}
times.sort((a, b) => a - b);
const median = times[Math.floor(times.length / 2)];
console.log(`\nНатиҷа: ${passed}/${CASES.length} дуруст (${Math.round((passed / CASES.length) * 100)}%). Вақти миёна (median): ${median} мс.`);
