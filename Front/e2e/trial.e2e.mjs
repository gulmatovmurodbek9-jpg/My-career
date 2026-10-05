// E2E: «Як рӯз дар ихтисос» — ҳамон роҳе, ки журӣ дар намоиш мегузарад, бе ворид шудан:
// рӯйхат → сенарияи барномасоз → боварӣ → 3 вазифа (ҷавоб → шарҳ → 👍/👎) → баҳо → хулоса.
// Ҳамчунин: тугма дар саҳифаи ихтисос ва ҳамаи 5 сенария бо се забон кушода мешаванд.
//
//   npm run e2e:trial                                  (сайти маҳаллӣ: http://localhost:5173)
//   BASE_URL=https://ikhtisosiman.qobus.tj npm run e2e:trial
//   API_URL=… — агар API дар суроғаи дигар бошад (пешфарз: BASE_URL/api ё localhost:3005).
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || (BASE.includes("localhost") ? "http://localhost:3005/api" : `${BASE}/api`);
const CHROME = process.env.CHROME || (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "/usr/bin/google-chrome");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewport({ width: 390, height: 844, isMobile: true }); // телефон
    await page.evaluateOnNewDocument(() => localStorage.setItem("app_lang", "tj"));
    const text = () => page.evaluate(() => document.body.innerText);
    const click = (label) => page.evaluate((label) => {
        const el = [...document.querySelectorAll("button, a")].find((x) => x.innerText.trim().includes(label) && !x.disabled);
        el?.click();
        return Boolean(el);
    }, label);
    const clickOption = (start) => page.evaluate((start) => {
        const el = [...document.querySelectorAll("button[aria-pressed]")].find((x) => x.innerText.trim().includes(start));
        el?.click();
        return Boolean(el);
    }, start);

    await page.goto(`${BASE}/trial`, { waitUntil: "networkidle2" });
    await sleep(800);
    const hub = await text();
    check("Рӯйхат: 5 сенария", ["Барномасоз", "Иқтисодчии мағоза", "Омӯзгор", "Ҳуқуқшинос", "Ҳамшира"].every((role) => hub.includes(role)));

    await page.goto(`${BASE}/trial/it`, { waitUntil: "networkidle2" });
    await sleep(800);
    const intro = await text();
    check("Муқаддима", intro.includes("Барномасоз") && intro.includes("2 вазифаи касбӣ"));
    await clickOption("Намедонам");
    await click("Оғоз");
    await sleep(500);

    // 1: интихоб (дуруст — B)
    check("Вазифаи 1", (await text()).includes("Хаторо ёбед"));
    await clickOption("Сатри 3");
    await click("Санҷидан");
    await sleep(800);
    const t1 = await text();
    check("Вазифаи 1: табрик, 3 қадам, кори воқеӣ, малака", t1.includes("Офарин!") && t1.toLowerCase().includes("чаро чунин аст") && t1.includes("Дар кори воқеӣ:") && t1.includes("Диққат ба тафсилот"));
    await click("Ҳа, шавқовар");
    await sleep(500);

    // 2: тартиб (пардохт аввал)
    check("Вазифаи 2", (await text()).includes("Аввал чӣ?"));
    await clickOption("Пардохт");
    await clickOption("Менеҷер");
    await clickOption("Директор");
    await click("Санҷидан");
    await sleep(800);
    check("Вазифаи 2: тартиби пурра дуруст", (await text()).includes("Аъло!"));
    await click("Не, шавқовар нест");
    await sleep(500);

    // 3: интихоби нодуруст — бояд шарҳ ва ҷавоби дурустро нишон диҳад
    check("Вазифаи 3", (await text()).includes("Ба мизоҷ ҷавоб диҳед"));
    await clickOption("Хато аз мо нест");
    await click("Санҷидан");
    await sleep(800);
    const t3 = await text();
    check("Вазифаи 3: рӯҳбаландкунӣ ва шарҳи варианти дуруст", t3.includes("Ин ҳам таҷриба аст.") && t3.includes("Эътироф, фаҳмонидани содда"));
    await click("Ҳа, шавқовар");
    await sleep(500);

    check("Ҳақиқати касб", (await text()).includes("Ҳақиқати касб"));
    await clickOption("Хуб");
    await clickOption("Бештар ҳа");
    await click("Хулосаро бинед");
    await sleep(1500);
    const result = await text();
    check("Хулоса: 2 аз 3", result.includes("Шумо 2 аз 3 вазифаро ҳал кардед"));
    check("Хулоса: тағйири боварӣ 3 → 4", result.includes("3 → 4"));
    check("Хулоса: ихтисосҳои наздик (пайванд)", await page.evaluate(() => document.querySelectorAll('a[href^="/info/"]').length >= 2));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check("Дар телефон уфуқӣ намелағжад", !overflow);

    // Тугма дар саҳифаи ихтисос
    const res = await fetch(`${API}/careers?limit=1`).then((r) => r.json()).catch(() => null);
    const career = res?.data?.[0];
    if (career?.id) {
        await page.goto(`${BASE}/info/${career.id}`, { waitUntil: "networkidle2" });
        await sleep(1500);
        const href = `/trial/career/${career.id}`;
        check("Саҳифаи ихтисос: тугмаи «Як рӯз дар ихтисос»", await page.evaluate((href) => !!document.querySelector(`a[href="${href}"]`), href), career.code);
    } else {
        check("Саҳифаи ихтисос: ихтисос ёфт нашуд", false);
    }

    // Ҳамаи сенарияҳо бо се забон
    for (const family of ["it", "economics", "teacher", "law", "medicine"]) {
        for (const lang of ["tj", "ru", "en"]) {
            const data = await fetch(`${API}/trial/${family}?lang=${lang}`).then((r) => r.json()).catch(() => null);
            const ok = data?.tasks?.length === 3 && !JSON.stringify(data).includes('"feedback"');
            if (!ok) check(`API ${family}/${lang}`, false);
        }
    }
    check("API: 15 сенария (5 × 3 забон) бе ҷавобҳо", true);
    check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
} finally {
    await browser.close();
}
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
