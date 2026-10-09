import QRCode from "qrcode";

// Корти натиҷа барои Telegram / Instagram: тасвир дар худи браузер (canvas) кашида мешавад —
// бе сервер. Ду намуд: «Самти ман» (тест) ва «😊/🤔 касб» (санҷиши касб). Ду андоза:
// Story 1080×1920 ва мураббаъ 1080×1080. Ном ихтиёрӣ; маълумоти дигари шахсӣ нест.
export const SITE = "ikhtisosiman.qobus.tj";
export const CARD_LINK = `https://${SITE}/?ref=card`;

// Ранги ҳар самти ММТ (ҳамон рангҳои саҳифаи омӯзгор).
export const CLUSTER_GRADIENT = {
    c1: ["#0284c7", "#1e3a8a"],
    c2: ["#d97706", "#7c2d12"],
    c3: ["#7c3aed", "#312e81"],
    c4: ["#059669", "#064e3b"],
    c5: ["#e11d48", "#701a75"],
};
const DEFAULT_GRADIENT = ["#1d4ed8", "#312e81"];

// Рангҳое, ки хонанда худаш интихоб мекунад («auto» — ранги самт).
export const CARD_COLORS = {
    blue: ["#2563eb", "#1e3a8a"],
    sky: ["#0ea5e9", "#0c4a6e"],
    teal: ["#14b8a6", "#134e4a"],
    green: ["#22c55e", "#14532d"],
    orange: ["#f97316", "#7c2d12"],
    red: ["#ef4444", "#7f1d1d"],
    pink: ["#ec4899", "#701a75"],
    purple: ["#8b5cf6", "#312e81"],
    dark: ["#334155", "#020617"],
};

export const CARD_TEXT = {
    tj: {
        direction: "Самти ман",
        careers: "Ихтисосҳои ба ман мувофиқ",
        fit: "Ба ман мувофиқ аст",
        notFit: "Фаҳмидам, ки ин касб ба ман мувофиқ нест — ин ҳам натиҷа аст",
        solved: "Ҳал кардам: {{n}} аз {{t}}",
        confidence: "Боварӣ: {{a}} → {{b}}",
        quizCta: "Ту ҳам бисанҷ — 10 дақиқа",
        trialCta: "Ту ҳам худро дар касб санҷ",
    },
    ru: {
        direction: "Моё направление",
        careers: "Подходящие мне специальности",
        fit: "Мне подходит",
        notFit: "Я понял(а), что эта профессия мне не подходит — это тоже результат",
        solved: "Решено: {{n}} из {{t}}",
        confidence: "Уверенность: {{a}} → {{b}}",
        quizCta: "Проверь и ты — 10 минут",
        trialCta: "Попробуй себя в профессии",
    },
    en: {
        direction: "My direction",
        careers: "Specialties that suit me",
        fit: "This suits me",
        notFit: "I learned this career is not for me — that is a result too",
        solved: "Solved: {{n}} of {{t}}",
        confidence: "Confidence: {{a}} → {{b}}",
        quizCta: "Try it too — 10 minutes",
        trialCta: "Try yourself in a career",
    },
};
const fill = (text, values) => String(text).replace(/\{\{(\w+)\}\}/g, (_, key) => values?.[key] ?? "");

const DISPLAY = "Geologica, 'Golos Text', system-ui, sans-serif";
const BODY = "'Golos Text', system-ui, sans-serif";

async function fontsReady() {
    try {
        await Promise.all([
            document.fonts.load(`900 80px ${DISPLAY}`),
            document.fonts.load(`700 40px ${BODY}`),
            document.fonts.load(`500 36px ${BODY}`),
        ]);
    } catch {
        /* ҳарфи системавӣ */
    }
}

// Матнро ба сатрҳо дар паҳнои max тақсим мекунад (то maxLines; охирин бо «…»).
function wrap(ctx, text, max, maxLines = 3) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width <= max || !line) line = next;
        else {
            lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
        const kept = lines.slice(0, maxLines);
        let last = kept[maxLines - 1];
        while (last && ctx.measureText(`${last}…`).width > max) last = last.slice(0, -1);
        kept[maxLines - 1] = `${last.trimEnd()}…`;
        return kept;
    }
    return lines;
}

// Андозаи ҳарф то матн дар maxLines ҷой гирад.
function fitFont(ctx, text, max, maxLines, from, to, weight, family) {
    for (let size = from; size >= to; size -= 4) {
        ctx.font = `${weight} ${size}px ${family}`;
        const lines = wrap(ctx, text, max, 99);
        // Калимаи дароз (масалан «ЕСТЕСТВЕННО-ТЕХНИЧЕСКИЕ») ҳам бояд дар паҳно ҷой гирад.
        if (lines.length <= maxLines && lines.every((line) => ctx.measureText(line).width <= max)) return { size, lines };
    }
    ctx.font = `${weight} ${to}px ${family}`;
    return { size: to, lines: wrap(ctx, text, max, maxLines) };
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Нишонаи барнома (512×512, гӯшаҳои мудаввар) — равшан дар корти 1080 пиксел; сояи нарм.
async function drawLogo(ctx, x, y, size) {
    try {
        const img = new Image();
        img.src = "/icon-512.png";
        await img.decode();
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        roundRect(ctx, x, y, size, size, size * 0.22);
        ctx.fillStyle = "#05060a";
        ctx.fill();
        ctx.restore();
        ctx.save();
        roundRect(ctx, x, y, size, size, size * 0.22);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
        return true;
    } catch {
        return false;
    }
}

/**
 * @param {object} options
 * @param {"quiz"|"trial"} options.kind
 * @param {"story"|"square"} options.size
 * @param {"tj"|"ru"|"en"} options.lang
 * @param {string} [options.name]       — номи хонанда (ихтиёрӣ)
 * @param {string} [options.cluster]    — c1…c5 (ранг)
 * quiz:  { title, percent, careers: string[] }
 * trial: { career, fit: boolean, solved, total, confBefore, confAfter }
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function drawShareCard(options) {
    await fontsReady();
    const text = CARD_TEXT[options.lang] || CARD_TEXT.tj;
    const W = 1080;
    const H = options.size === "square" ? 1080 : 1920;
    const story = H > W;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const [from, to] = CARD_COLORS[options.color] || CLUSTER_GRADIENT[options.cluster] || DEFAULT_GRADIENT;

    // Замина: градиент ва доираҳои нарм.
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, from);
    bg.addColorStop(1, to);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.beginPath(); ctx.arc(W * 0.9, H * 0.08, 320, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W * 0.05, H * 0.75, 260, 0, Math.PI * 2); ctx.fill();

    const pad = 80;
    const inner = W - pad * 2;
    let y = story ? 120 : 70;
    // Мазмун набояд ба поён (даъват + QR) расад.
    const qrSize = story ? 260 : 200;
    const footY = H - pad - qrSize;
    const limit = footY - (story ? 60 : 40);

    // Сарлавҳа: логотип + «ИХТИСОСИ МАН».
    const logoSize = story ? 120 : 100;
    const logo = await drawLogo(ctx, pad, y, logoSize);
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${story ? 54 : 48}px ${DISPLAY}`;
    ctx.textBaseline = "middle";
    ctx.fillText("ИХТИСОСИ МАН", pad + (logo ? logoSize + 28 : 0), y + logoSize / 2);
    ctx.textBaseline = "alphabetic";
    y += story ? 230 : 175;

    if (options.name) {
        ctx.font = `600 40px ${BODY}`;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(wrap(ctx, options.name, inner, 1)[0], pad, y);
        y += story ? 80 : 60;
    }

    if (options.kind === "quiz") {
        ctx.font = `700 ${story ? 44 : 38}px ${BODY}`;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(`${text.direction}:`, pad, y);
        y += story ? 40 : 30;

        const title = fitFont(ctx, String(options.title || "").toUpperCase(), inner - (options.percent ? 0 : 0), story ? 3 : 2, story ? 96 : 76, 52, 900, DISPLAY);
        ctx.fillStyle = "#ffffff";
        title.lines.forEach((line) => { y += title.size * 1.08; ctx.fillText(line, pad, y); });
        y += story ? 60 : 40;

        if (Number.isFinite(options.percent)) {
            const barH = story ? 34 : 28;
            ctx.fillStyle = "rgba(255,255,255,0.22)";
            roundRect(ctx, pad, y, inner - 190, barH, barH / 2); ctx.fill();
            ctx.fillStyle = "#ffffff";
            roundRect(ctx, pad, y, Math.max(barH, (inner - 190) * Math.min(1, options.percent / 100)), barH, barH / 2); ctx.fill();
            ctx.font = `900 ${story ? 72 : 60}px ${DISPLAY}`;
            ctx.textAlign = "right";
            ctx.fillText(`${options.percent}%`, W - pad, y + barH - 2);
            ctx.textAlign = "left";
            y += barH + (story ? 120 : 80);
        }

        const careers = (options.careers || []).filter(Boolean).slice(0, story ? 3 : 2);
        if (careers.length) {
            ctx.font = `700 ${story ? 42 : 36}px ${BODY}`;
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.fillText(`${text.careers}:`, pad, y);
            y += story ? 40 : 28;
            careers.forEach((career, index) => {
                ctx.font = `700 ${story ? 46 : 40}px ${BODY}`;
                const lines = wrap(ctx, career, inner - 150, 2);
                const boxH = 44 + lines.length * (story ? 56 : 48);
                if (y + boxH > limit) return;
                ctx.fillStyle = "rgba(255,255,255,0.14)";
                roundRect(ctx, pad, y, inner, boxH, 32); ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.font = `900 ${story ? 50 : 44}px ${DISPLAY}`;
                ctx.fillText(String(index + 1), pad + 36, y + 22 + (story ? 52 : 44));
                ctx.font = `700 ${story ? 46 : 40}px ${BODY}`;
                lines.forEach((line, i) => ctx.fillText(line, pad + 110, y + 22 + (story ? 50 : 42) + i * (story ? 56 : 48)));
                y += boxH + (story ? 24 : 18);
            });
        }
    } else {
        const emoji = options.fit ? "😊" : "🤔";
        ctx.font = `${story ? 220 : 120}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = story ? "center" : "left";
        ctx.fillText(emoji, story ? W / 2 : pad, y + (story ? 200 : 100));
        ctx.textAlign = "left";
        y += story ? 300 : 150;

        if (options.fit) {
            ctx.font = `700 ${story ? 48 : 40}px ${BODY}`;
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.fillText(`${text.fit}:`, pad, y);
            y += story ? 30 : 20;
            const career = fitFont(ctx, String(options.career || "").toUpperCase(), inner, story ? 4 : 3, story ? 92 : 72, 48, 900, DISPLAY);
            ctx.fillStyle = "#ffffff";
            career.lines.forEach((line) => { y += career.size * 1.1; ctx.fillText(line, pad, y); });
        } else {
            const career = fitFont(ctx, String(options.career || "").toUpperCase(), inner, 3, story ? 80 : 64, 44, 900, DISPLAY);
            ctx.fillStyle = "#ffffff";
            career.lines.forEach((line) => { y += career.size * 1.1; ctx.fillText(line, pad, y); });
            y += story ? 30 : 20;
            ctx.font = `600 ${story ? 42 : 36}px ${BODY}`;
            ctx.fillStyle = "rgba(255,255,255,0.88)";
            wrap(ctx, text.notFit, inner, 3).forEach((line) => { y += story ? 56 : 48; ctx.fillText(line, pad, y); });
        }
        y += story ? 90 : 60;

        const facts = [
            options.total ? fill(text.solved, { n: options.solved, t: options.total }) : null,
            options.confBefore && options.confAfter ? fill(text.confidence, { a: options.confBefore, b: options.confAfter }) : null,
        ].filter(Boolean);
        // Чипҳо паҳлӯ ба паҳлӯ; агар ҷой нашавад — сатри нав.
        const chipH = story ? 92 : 76;
        let x = pad;
        facts.forEach((fact) => {
            ctx.font = `700 ${story ? 44 : 36}px ${BODY}`;
            const w = ctx.measureText(fact).width + 64;
            if (x > pad && x + w > W - pad) { x = pad; y += chipH + 20; }
            if (y + chipH > limit) return;
            ctx.fillStyle = "rgba(255,255,255,0.16)";
            roundRect(ctx, x, y, w, chipH, chipH / 2); ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.fillText(fact, x + 32, y + chipH * 0.64);
            x += w + 16;
        });
    }

    // Поён: даъват + сайт + QR.
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, CARD_LINK, { width: qrSize, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } });
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, W - pad - qrSize - 16, footY - 16, qrSize + 32, qrSize + 32, 28); ctx.fill();
    ctx.drawImage(qrCanvas, W - pad - qrSize, footY, qrSize, qrSize);

    ctx.fillStyle = "#ffffff";
    const ctaWidth = inner - qrSize - 60;
    ctx.font = `900 ${story ? 56 : 46}px ${DISPLAY}`;
    const cta = wrap(ctx, options.kind === "quiz" ? text.quizCta : text.trialCta, ctaWidth, 2);
    let fy = footY + (story ? 70 : 56);
    cta.forEach((line) => { ctx.fillText(line, pad, fy); fy += story ? 66 : 54; });
    ctx.font = `700 ${story ? 38 : 32}px ${BODY}`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(SITE, pad, fy + (story ? 20 : 12));

    return canvas;
}

export const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

// Телефон: менюи «Поделиться» бо файл (Telegram, Instagram…); вагарна — боргирӣ.
export async function shareOrDownload(canvas, filename, shareText) {
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], text: shareText });
            return "shared";
        } catch (error) {
            if (error?.name === "AbortError") return "cancelled";
        }
    }
    downloadBlob(blob, filename);
    return "downloaded";
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
}
