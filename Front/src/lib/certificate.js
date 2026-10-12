import QRCode from "qrcode";
import { BODY, DISPLAY, drawLogo, fontsReady, roundRect, wrap } from "./shareCard";

// Сертификати касбинтихобкунӣ (A4 уфуқӣ, 2000×1414) бо QR → /cert/:code.
export const CERT_TEXT = {
    tj: {
        badge: "СЕРТИФИКАТ", subtitle: "касбинтихобкунӣ", given: "Дода мешавад ба", passed: "барои гузаштани тести касбинтихобкунӣ дар платформаи «Ихтисоси ман»",
        direction: "Самти мувофиқ", careers: "Ихтисосҳои беҳтарин", trials: "Касбҳои санҷидашуда", date: "Сана", code: "Рамзи тасдиқ",
        scan: "Барои тасдиқ скан кунед", note: "Ин тавсия аст, на ҳуҷҷати расмӣ.",
    },
    ru: {
        badge: "СЕРТИФИКАТ", subtitle: "профориентации", given: "Выдан", passed: "за прохождение профориентационного теста на платформе «Ихтисоси ман»",
        direction: "Подходящее направление", careers: "Лучшие специальности", trials: "Опробованные профессии", date: "Дата", code: "Код проверки",
        scan: "Сканируйте для проверки", note: "Это рекомендация, а не официальный документ.",
    },
    en: {
        badge: "CERTIFICATE", subtitle: "of career guidance", given: "Awarded to", passed: "for completing the career guidance test on the “Ikhtisosi man” platform",
        direction: "Matching direction", careers: "Top specialties", trials: "Careers tried", date: "Date", code: "Verification code",
        scan: "Scan to verify", note: "This is a recommendation, not an official document.",
    },
};

export const certLink = (code) => `${window.location.origin}/cert/${code}`;

export async function drawCertificate({ code, name, createdAt, directionLabel, percent, careers = [], trials = [], lang = "tj" }) {
    const text = CERT_TEXT[lang] || CERT_TEXT.tj;
    await fontsReady();
    const W = 2000;
    const H = 1414;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Замина ва ҳошияи дуқабата.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    const frame = ctx.createLinearGradient(0, 0, W, H);
    frame.addColorStop(0, "#1d4ed8");
    frame.addColorStop(1, "#4f46e5");
    ctx.fillStyle = frame;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 40, 40, W - 80, H - 80, 36);
    ctx.fill();
    ctx.strokeStyle = "rgba(29,78,216,0.25)";
    ctx.lineWidth = 3;
    roundRect(ctx, 70, 70, W - 140, H - 140, 26);
    ctx.stroke();
    // Нурҳои нарм дар кунҷҳо.
    const glow = ctx.createRadialGradient(W - 220, 220, 20, W - 220, 220, 520);
    glow.addColorStop(0, "rgba(79,70,229,0.12)");
    glow.addColorStop(1, "rgba(79,70,229,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Сарлавҳа.
    await drawLogo(ctx, 150, 140, 130);
    ctx.fillStyle = "#1d4ed8";
    ctx.font = `800 34px ${BODY}`;
    ctx.fillText("ИХТИСОСИ МАН", 310, 200);
    ctx.fillStyle = "#64748b";
    ctx.font = `500 26px ${BODY}`;
    ctx.fillText("ikhtisosiman.qobus.tj", 310, 242);

    ctx.textAlign = "center";
    ctx.fillStyle = "#0f172a";
    ctx.font = `900 120px ${DISPLAY}`;
    ctx.fillText(text.badge, W / 2, 420);
    ctx.fillStyle = "#4f46e5";
    ctx.font = `700 44px ${BODY}`;
    ctx.fillText(text.subtitle, W / 2, 485);

    ctx.fillStyle = "#64748b";
    ctx.font = `500 34px ${BODY}`;
    ctx.fillText(text.given, W / 2, 575);
    ctx.fillStyle = "#0f172a";
    ctx.font = `900 92px ${DISPLAY}`;
    ctx.fillText(name, W / 2, 680, W - 400);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 520, 712);
    ctx.lineTo(W / 2 + 520, 712);
    ctx.stroke();
    ctx.fillStyle = "#475569";
    ctx.font = `500 32px ${BODY}`;
    wrap(ctx, text.passed, 1300, 2).forEach((line, i) => ctx.fillText(line, W / 2, 768 + i * 42));

    // Самт (корти кабуд).
    ctx.textAlign = "left";
    const boxY = 870;
    const dir = ctx.createLinearGradient(150, boxY, 820, boxY + 300);
    dir.addColorStop(0, "#2563eb");
    dir.addColorStop(1, "#4f46e5");
    ctx.fillStyle = dir;
    roundRect(ctx, 150, boxY, 640, 300, 28);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `700 28px ${BODY}`;
    ctx.fillText(text.direction.toUpperCase(), 190, boxY + 60);
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 58px ${DISPLAY}`;
    wrap(ctx, directionLabel, 560, 2).forEach((line, i) => ctx.fillText(line, 190, boxY + 135 + i * 64));
    ctx.font = `900 64px ${DISPLAY}`;
    ctx.fillText(`${percent}%`, 190, boxY + 268);

    // Ихтисосҳо ва санҷишҳо.
    let y = boxY + 40;
    ctx.fillStyle = "#64748b";
    ctx.font = `700 26px ${BODY}`;
    ctx.fillText(text.careers.toUpperCase(), 850, y);
    y += 50;
    ctx.fillStyle = "#0f172a";
    careers.slice(0, 3).forEach((career, i) => {
        ctx.font = `700 34px ${BODY}`;
        const line = wrap(ctx, `${i + 1}. ${career.name}`, 640, 1)[0];
        ctx.fillText(line, 850, y);
        y += 50;
    });
    if (trials.length) {
        y += 16;
        ctx.fillStyle = "#64748b";
        ctx.font = `700 26px ${BODY}`;
        ctx.fillText(text.trials.toUpperCase(), 850, y);
        y += 46;
        trials.slice(0, 2).forEach((trial) => {
            ctx.fillStyle = "#0f172a";
            ctx.font = `600 30px ${BODY}`;
            ctx.fillText(wrap(ctx, `${trial.fit ? "✓" : "•"} ${trial.name}`, 640, 1)[0], 850, y);
            y += 44;
        });
    }

    // QR ва рамз.
    const qr = new Image();
    qr.src = await QRCode.toDataURL(certLink(code), { width: 320, margin: 1, errorCorrectionLevel: "M" });
    await qr.decode();
    ctx.drawImage(qr, W - 150 - 280, boxY - 10, 280, 280);
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = `600 24px ${BODY}`;
    ctx.fillText(text.scan, W - 150 - 140, boxY + 300);

    // Поён: сана, рамз, эзоҳ.
    ctx.textAlign = "left";
    ctx.fillStyle = "#475569";
    ctx.font = `600 28px ${BODY}`;
    ctx.fillText(`${text.date}: ${new Date(createdAt || Date.now()).toLocaleDateString()}`, 150, H - 140);
    ctx.textAlign = "right";
    ctx.fillText(`${text.code}: ${code}`, W - 150, H - 140);
    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.font = `500 22px ${BODY}`;
    ctx.fillText(text.note, W / 2, H - 100);
    return canvas;
}
