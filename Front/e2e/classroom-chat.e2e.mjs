// E2E: Ҳуҷраи омӯзгор 2.0 — синф бо ноҳия ва соли таҳсил, фидбеки омӯзгор (чат) бо хонандаи
// бе почта, саҳифаи «Синфи ман» (омори синф бе номҳо), омори пурра ва дархости пурраи омӯзгор.
//   TEACHER_TOKEN=… TEACHER_USER='{…}' USER_TOKEN=… USER_USER='{…}' BASE_URL=http://localhost:5173 node e2e/classroom-chat.e2e.mjs
// Дар охир CLASS_ID ва GUEST_ID чоп мешаванд — барои нест кардани сатрҳои санҷишӣ.
import puppeteer, { KnownDevices } from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_URL || (BASE.includes("localhost") ? "http://localhost:3005/api" : `${BASE}/api`);
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const clickByText = (page, selector, pattern) => page.evaluate((sel, source) => {
    const re = new RegExp(source);
    const el = [...document.querySelectorAll(sel)].find((node) => re.test(node.innerText));
    if (el) el.click();
    return Boolean(el);
}, selector, pattern.source);
const login = async (page, token, user) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate((token, user) => {
        localStorage.setItem("auth-storage", JSON.stringify({ state: { user, token, isAuthenticated: true }, version: 0 }));
        localStorage.setItem("app_lang", "tj");
        localStorage.setItem("assistant_greeted_v1", "1");
    }, token, user);
};
const bodyText = (page) => page.evaluate(() => document.body.innerText);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const errors = [];

// 1. Омӯзгор: синф бо ноҳия ва соли таҳсил.
const teacher = await browser.newPage();
teacher.on("pageerror", (e) => errors.push(e.message));
await teacher.setViewport({ width: 1280, height: 900 });
await login(teacher, process.env.TEACHER_TOKEN, JSON.parse(process.env.TEACHER_USER));
await teacher.goto(`${BASE}/dashboard/teacher`, { waitUntil: "networkidle2" });
await teacher.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /Синф созед/.test(b.innerText)), { timeout: 20000 });
await clickByText(teacher, "button", /Синф созед/);
await teacher.waitForSelector('input[placeholder^="Масалан: 11"]');
await teacher.type('input[placeholder^="Масалан: 11"]', "11 «В» (санҷиш)");
await teacher.type('input[list="tj-districts"]', "Спитамен");
await teacher.type('input[list="tj-cities"]', "Хуҷанд");
const years = await teacher.evaluate(() => [...document.querySelectorAll("select option")].map((o) => o.value).filter((v) => /^\d{4}-\d{4}$/.test(v)));
check("Соли таҳсил: ҷорӣ ва оянда", years.length === 2, years.join(", "));
await clickByText(teacher, "button", /^Сохтан$/);
await teacher.waitForFunction(() => [...document.querySelectorAll("a[href^='/dashboard/teacher/']")].some((a) => a.innerText.includes("(санҷиш)")), { timeout: 15000 });
const cardText = await teacher.evaluate(() => [...document.querySelectorAll("a[href^='/dashboard/teacher/']")].find((a) => a.innerText.includes("(санҷиш)")).innerText);
check("Корти синф: ноҳия ва соли таҳсил", cardText.includes("Спитамен") && /Соли таҳсил \d{4}–\d{4}/.test(cardText), cardText.replace(/\n/g, " | ").slice(0, 120));
const classHref = await teacher.evaluate(() => [...document.querySelectorAll("a[href^='/dashboard/teacher/']")].find((a) => a.innerText.includes("(санҷиш)")).getAttribute("href"));
const classId = classHref.split("/").pop();
console.log(`CLASS_ID=${classId}`);
await teacher.goto(`${BASE}${classHref}`, { waitUntil: "networkidle2" });
await teacher.waitForSelector("img[alt^='QR']", { timeout: 15000 });
const code = await teacher.evaluate(() => [...document.querySelectorAll(".font-mono")].map((el) => el.innerText.trim()).find((value) => /^[A-Z2-9]{6}$/.test(value)));

// 2. Хонандаи бе почта (iPhone): ҳамроҳ мешавад ва тест мегузарад.
const context = await browser.createBrowserContext();
const student = await context.newPage();
student.on("pageerror", (e) => errors.push(e.message));
await student.emulate(KnownDevices["iPhone 13"]);
await student.goto(`${BASE}/class/${code}`, { waitUntil: "networkidle2" });
await student.waitForSelector("#class-name");
await student.type("#class-name", "Нигина Каримова");
await clickByText(student, "button", /Ҳамроҳ шудан/);
await student.waitForFunction(() => document.body.innerText.includes("Шумо дар синфи"), { timeout: 15000 });
await student.waitForFunction(() => [...document.querySelectorAll("a")].some((a) => a.getAttribute("href")?.startsWith("/class/my/")), { timeout: 10000 });
check("Баъди ҳамроҳшавӣ: пайванди «Синфи ман»", true);
const guest = await student.evaluate(() => JSON.parse(localStorage.getItem("class_guest_v1") || "null"));
const headers = { "Content-Type": "application/json", "X-Class-Guest": guest.token };
const questions = await fetch(`${API}/quiz/questions`).then((r) => r.json());
const answers = questions.filter((q) => q.part === "mmt").map((q, i) => ({ questionId: q.id, selectedValue: String((i * 3) % q.options.length) }));
const quiz = await fetch(`${API}/quiz/submit`, { method: "POST", headers, body: JSON.stringify({ answers, lang: "tj", grade: 11 }) }).then((r) => r.json());
check("Тест сабт шуд", Boolean(quiz.attemptId));

// 3. Омӯзгор: омори пурра ва фидбек.
await teacher.reload({ waitUntil: "networkidle2" });
await teacher.waitForFunction(() => document.body.innerText.includes("Нигина Каримова"), { timeout: 15000 });
await clickByText(teacher, "li button", /Нигина/);
await sleep(400);
await clickByText(teacher, "[role=tab]", /Омори пурра/);
await sleep(300);
const stats = await bodyText(teacher);
check("Омори пурра: тест 1 бор, бе почта", stats.includes("1 бор") && stats.includes("Хонандаи бе почта"));
await clickByText(teacher, "[role=tab]", /Фидбек/);
await teacher.waitForSelector("[data-class-chat] textarea", { timeout: 10000 });
await teacher.type("[data-class-chat] textarea", "Офарин! Самти шумо ба тиб наздик аст — касби «Ҳамшира»-ро санҷед.");
await teacher.click("[data-class-chat] button[type=submit]");
await teacher.waitForFunction(() => document.querySelector("[data-class-chat]")?.innerText.includes("Офарин!"), { timeout: 10000 });
check("Омӯзгор паём фиристод", true);
if (SHOTS) await teacher.screenshot({ path: `${SHOTS}/teacher-chat.png`, fullPage: true });

// 4. Хонанда: /class → «Синфҳои шумо» (1 паёми нав) → «Синфи ман».
await student.goto(`${BASE}/class`, { waitUntil: "networkidle2" });
await student.waitForFunction(() => [...document.querySelectorAll("a")].some((a) => a.getAttribute("href")?.startsWith("/class/my/")), { timeout: 15000 });
const listText = await bodyText(student);
check("/class: синфи ман бо нишонаи паёми нав", /синфҳои шумо/i.test(listText) && /11 «В» \(санҷиш\)[\s\S]*1/.test(listText), listText.slice(0, 160).replace(/\n/g, " | "));
await student.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.getAttribute("href")?.startsWith("/class/my/")).click());
await student.waitForSelector("[data-my-class]", { timeout: 15000 });
await student.waitForFunction(() => document.querySelector("[data-class-chat]")?.innerText.includes("Офарин!"), { timeout: 15000 });
const mine = await bodyText(student);
check("Синфи ман: омор ва «Самти шумо»", mine.includes("Ихтисосҳои маъмул дар синф") && mine.includes("Самти шумо") && mine.includes("Спитамен"));
check("Синфи ман: номи дигарон нест, паёми омӯзгор ҳаст", !mine.includes("Ҷамшед") && mine.includes("Офарин!"));
await student.type("[data-class-chat] textarea", "Ташаккур! Имрӯз месанҷам.");
await student.$eval("[data-class-chat] button[type=submit]", (b) => b.scrollIntoView({ block: "center" }));
await sleep(800); // scroll-и нарм тамом шавад
await student.tap("[data-class-chat] button[type=submit]"); // телефон: ламс
await student.waitForFunction(() => document.querySelector("[data-class-chat]")?.innerText.includes("Ташаккур!"), { timeout: 10000 }).catch(async (e) => {
    console.log("DEBUG", await student.evaluate(() => ({ value: document.querySelector("[data-class-chat] textarea").value, chat: document.querySelector("[data-class-chat]").innerText.slice(-300), at: (() => { const b = document.querySelector("[data-class-chat] button[type=submit]"); const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return `${b.disabled} ${el?.tagName} ${el?.className?.toString().slice(0, 80)}`; })() })));
    throw e;
});
if (SHOTS) await student.screenshot({ path: `${SHOTS}/my-class.png`, fullPage: true });

// 5. Омӯзгор ҷавобро мебинад (нишонаи «нав»).
await teacher.reload({ waitUntil: "networkidle2" });
await teacher.waitForFunction(() => document.body.innerText.includes("Нигина Каримова"), { timeout: 15000 });
const unread = await bodyText(teacher);
check("Омӯзгор: «1 паёми нав»", unread.includes("1 паёми нав"));
await clickByText(teacher, "li button", /Нигина/);
await sleep(300);
await clickByText(teacher, "[role=tab]", /Фидбек/);
await teacher.waitForFunction(() => document.querySelector("[data-class-chat]")?.innerText.includes("Ташаккур!"), { timeout: 10000 });
check("Омӯзгор ҷавоби хонандаро дид", true);

// 6. Дархости пурраи омӯзгор (корбари оддӣ): форма фавран (на скелет).
const userCtx = await browser.createBrowserContext();
const user = await userCtx.newPage();
user.on("pageerror", (e) => errors.push(e.message));
await user.setViewport({ width: 1280, height: 900 });
await login(user, process.env.USER_TOKEN, JSON.parse(process.env.USER_USER));
await user.goto(`${BASE}/dashboard/teacher`, { waitUntil: "networkidle2" });
await user.waitForSelector("#tr-fullname", { timeout: 15000 });
check("Дархост: форма намоён аст (на қуттии холӣ)", true);
await user.evaluate(() => { document.querySelector("#tr-fullname").value = ""; });
await user.type("#tr-fullname", "Раҳимова Нигина Каримовна");
await user.type("#tr-phone", "+992 92 000 00 00");
await user.type("#tr-school", "Мактаби №14");
await user.type("#tr-contact-name", "Саидов Акбар");
await user.type("#tr-contact-phone", "+992 3422 0 00 00");
const formText = await bodyText(user);
check("Дархост: матни «дар давоми 1 рӯз»", formText.includes("дар давоми 1 рӯз"));
await clickByText(user, "button[type=submit]", /Фиристодан|Дархост/);
await user.waitForFunction(() => /интизори тасдиқ/.test(document.body.innerText), { timeout: 10000 });
check("Дархост фиристода шуд", true);

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(`GUEST_ID=${guest?.token?.split(".")[0]}`);
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
