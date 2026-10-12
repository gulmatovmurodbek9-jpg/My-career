// E2E: «Реҷаи овозӣ»-и тест — савол бо овоз хонда мешавад (/voice/speak воқеӣ), микрофон
// (дастгоҳи сохтаи Chrome) гӯш мекунад, ҷавоби STT («дуюм») → варианти 2 интихоб мешавад,
// тасдиқ бо овоз ва гузариш ба саволи навбатӣ. STT тақлид мешавад (садои сохта нутқ нест).
//   USER_TOKEN=… USER_USER='{…}' BASE_URL=http://localhost:5173 node e2e/voice-quiz.e2e.mjs
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
let failed = 0;
const check = (name, ok, detail = "") => {
    if (!ok) failed += 1;
    console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const errors = [];
const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(e.message));
await page.setViewport({ width: 1280, height: 900 });

// Ҳар бор, ки браузер садоро ба /voice/stt мефиристад — «дуюм» бармегардад.
let sttCalls = 0;
let speakCalls = 0;
await page.setRequestInterception(true);
page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/voice/stt") && request.method() === "POST") {
        sttCalls += 1;
        const origin = new URL(BASE).origin;
        request.respond({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true" },
            body: JSON.stringify({ text: "дуюм" }),
        });
        return;
    }
    if (url.includes("/voice/speak") && request.method() === "POST") speakCalls += 1;
    request.continue();
});

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.evaluate((token, user) => {
    localStorage.clear();
    localStorage.setItem("app_lang", "tj");
    localStorage.setItem("assistant_greeted_v1", "1");
    localStorage.setItem("auth-storage", JSON.stringify({ state: { user, token, isAuthenticated: true }, version: 0 }));
}, process.env.USER_TOKEN, JSON.parse(process.env.USER_USER || "{}"));
await page.goto(`${BASE}/quiz`, { waitUntil: "networkidle2" });
await page.waitForSelector("[data-voice-mode-start]", { timeout: 20000 });
check("Тугмаи «Тестро бо овоз гузаред» ҳаст", true);
await page.click("[data-voice-mode-start]");
await page.waitForSelector("[data-voice-mode]");

// Саволи аввал — «баъди кадом синф?»: «дуюм» → синфи 11 → саволи 1.
const waitStatus = (status, timeout = 60000) => page.waitForFunction((s) => document.querySelector("[data-voice-mode]")?.dataset.status === s, { timeout }, status);
await waitStatus("speaking");
check("Савол хонда мешавад", true);
await waitStatus("listening");
check("Баъди хондан микрофон гӯш мекунад", true);
if (process.env.DEBUG_VOICE) {
    for (let i = 0; i < 10; i += 1) {
        await new Promise((r) => setTimeout(r, 3000));
        console.log("DBG", sttCalls, speakCalls, await page.evaluate(() => `${document.querySelector("[data-voice-mode]")?.dataset.status} | ${document.querySelector("[data-voice-mode]")?.innerText.replace(/\s+/g, " ")} | ${JSON.stringify(window.__quizVoice && { id: window.__quizVoice.id, step: window.__quizVoice.step })}`));
    }
}
await page.waitForFunction(() => /1\s*\/\s*\d+/.test(document.body.innerText) && !!window.__quizVoice && window.__quizVoice.step === 0, { timeout: 60000 });
check("«Дуюм» → синфи 11 интихоб шуд, саволи 1 кушода шуд", true);

// Саволи 1: «дуюм» → варианти 2 → саволи 2.
await page.waitForFunction(() => window.__quizVoice?.step === 1, { timeout: 90000 });
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("quiz_progress_v1") || localStorage.getItem("quiz_answers_v1") || "null"));
check("Саволи 1 бо овоз ҷавоб дода шуд → саволи 2", true, stored ? "progress saved" : "");
check("Тасдиқ бо овоз: «Шумо интихоб кардед»", (await page.evaluate(() => document.querySelector("[data-voice-mode]")?.innerText || "")).includes("Шунидам: «дуюм»"));
check("STT ва TTS истифода шуданд", sttCalls >= 2 && speakCalls >= 4, `stt ${sttCalls}, speak ${speakCalls}`);

// Хомӯш кардан.
await page.evaluate(() => [...document.querySelectorAll("[data-voice-mode] button")].find((b) => /Хомӯш/.test(b.innerText)).click());
await page.waitForSelector("[data-voice-mode-start]");
check("Реҷаи овозӣ хомӯш шуд", true);
check("Хатои JavaScript нест", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} санҷиш нагузашт` : "\nҲамааш гузашт");
process.exit(failed ? 1 : 0);
