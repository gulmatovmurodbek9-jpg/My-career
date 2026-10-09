// E2E: корти натиҷа — 4 намуд кашида мешавад (тест/санҷиш × Story/мураббаъ, номҳои дароз),
// андоза ва PNG санҷида мешаванд; бо SHOTS=папка тасвирҳо нигоҳ дошта мешаванд.
// Танҳо бо сервери dev-и Vite (модули /src/... мустақим бор мешавад):
//   BASE_URL=http://localhost:5173 SHOTS=… node e2e/share-card.e2e.mjs
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const SHOTS = process.env.SHOTS || "";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const CARDS = {
    "quiz-story": { kind: "quiz", size: "story", lang: "tj", cluster: "c3", title: "Филология, педагогика ва санъат", percent: 72, careers: ["Тарҷумони забони англисӣ ва арабӣ", "Журналистика", "Забон ва адабиёти тоҷик. Забони англисӣ"] },
    "quiz-square": { kind: "quiz", size: "square", lang: "ru", cluster: "c1", title: "Естественно-технические науки", percent: 64, careers: ["Программная инженерия", "Электроэнергетика"], name: "Джамшед" },
    "trial-fit-story": { kind: "trial", size: "story", lang: "tj", cluster: "c5", career: "Технологияи иттилоотии ҳисоби бухгалтерӣ ва аудит дар соҳаи бонкӣ", fit: true, solved: 3, total: 4, confBefore: 2, confAfter: 4, name: "Ҷамшед Раҳимов" },
    "trial-notfit-square": { kind: "trial", size: "square", lang: "en", cluster: "c2", career: "Accounting", fit: false, solved: 1, total: 4, confBefore: 4, confAfter: 2 },
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });

for (const [name, card] of Object.entries(CARDS)) {
    const result = await page.evaluate(async (options) => {
        const { drawShareCard } = await import("/src/lib/shareCard.js");
        const canvas = await drawShareCard(options);
        return { w: canvas.width, h: canvas.height, data: canvas.toDataURL("image/png") };
    }, card);
    const expectH = card.size === "story" ? 1920 : 1080;
    check(`${name}: ${result.w}×${result.h}`, result.w === 1080 && result.h === expectH && result.data.length > 50000);
    if (SHOTS) fs.writeFileSync(path.join(SHOTS, `card-${name}.png`), Buffer.from(result.data.split(",")[1], "base64"));
}

check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
