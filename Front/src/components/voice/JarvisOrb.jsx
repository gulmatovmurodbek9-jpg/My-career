import React, { useEffect, useRef } from "react";

// Ёвар ба ҷои модели 3D: доираи зиндаи «HUD» мисли Jarvis дар canvas — сабук (бе three.js
// ва файли .glb), ба ҳолат ва баландии садо ҷавоб медиҳад:
//   listening — ҳалқаҳо бо садои корбар меларзанд (кабуди осмонӣ);
//   thinking  — ҳалқаҳо тез давр мезананд (бунафш);
//   speaking  — мавҷҳои радиалӣ бо садои ёвар (кабуди бренд);
//   idle      — нафаскашии нарм.
const PALETTE = {
    idle: [37, 99, 235],
    listening: [14, 165, 233],
    thinking: [139, 92, 246],
    speaking: [37, 99, 235],
};
const BARS = 72;

export default function JarvisOrb({ state = "idle", levelRef }) {
    const canvasRef = useRef(null);
    const stateRef = useRef(state);
    stateRef.current = state;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext("2d");
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        let width = 0;
        let height = 0;
        const resize = () => {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        };
        resize();
        const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
        observer?.observe(canvas);

        let frame = 0;
        let smooth = 0;
        let color = [...PALETTE.idle];
        const bars = new Float32Array(BARS);
        const started = performance.now();

        const draw = (now) => {
            const t = (now - started) / 1000;
            const mode = stateRef.current;
            const target = PALETTE[mode] || PALETTE.idle;
            color = color.map((c, i) => c + (target[i] - c) * 0.08);
            const level = Math.max(0, Math.min(1, levelRef?.current || 0));
            smooth += (level - smooth) * 0.25;
            const [r, g, b] = color.map(Math.round);
            const rgba = (a) => `rgba(${r},${g},${b},${a})`;

            ctx.clearRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;
            const base = Math.min(width, height) * 0.22;
            const breathe = mode === "idle" ? 0.04 * Math.sin(t * 1.6) : 0;
            const core = base * (0.78 + smooth * 0.32 + breathe);

            // Нури атроф.
            const glow = ctx.createRadialGradient(cx, cy, core * 0.2, cx, cy, base * 2.1);
            glow.addColorStop(0, rgba(0.35 + smooth * 0.3));
            glow.addColorStop(0.45, rgba(0.1 + smooth * 0.1));
            glow.addColorStop(1, rgba(0));
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);

            // Мавҷҳои радиалӣ: гап (ёвар ё корбар) — баландтар.
            const active = mode === "speaking" || mode === "listening";
            for (let i = 0; i < BARS; i += 1) {
                const angle = (i / BARS) * Math.PI * 2;
                const wave = active
                    ? smooth * (0.45 + 0.55 * Math.abs(Math.sin(t * 6 + i * 0.55) * Math.cos(t * 2.3 + i * 0.21)))
                    : 0.06 + 0.04 * Math.sin(t * 1.5 + i * 0.4);
                bars[i] += (wave - bars[i]) * 0.3;
                const inner = base * 1.08;
                const outer = inner + 4 + bars[i] * base * 0.55;
                ctx.strokeStyle = rgba(0.35 + bars[i] * 0.6);
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
                ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
                ctx.stroke();
            }

            // Ҳалқаҳои HUD: ду камони гардон ва як ҳалқаи нуқтагӣ.
            const speed = reduce ? 0 : mode === "thinking" ? 2.6 : mode === "listening" ? 1.1 : 0.45;
            const arc = (radius, start, length, widthPx, alpha) => {
                ctx.strokeStyle = rgba(alpha);
                ctx.lineWidth = widthPx;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, start, start + length);
                ctx.stroke();
            };
            arc(base * 1.62, t * speed, Math.PI * 0.55, 2.5, 0.75);
            arc(base * 1.62, t * speed + Math.PI, Math.PI * 0.3, 2.5, 0.5);
            arc(base * 1.82, -t * speed * 0.7, Math.PI * 0.9, 1.5, 0.45);
            ctx.setLineDash([2, 7]);
            arc(base * 1.42, t * speed * 0.3, Math.PI * 2, 1.2, 0.4);
            ctx.setLineDash([]);

            // Ядро.
            const fill = ctx.createRadialGradient(cx - core * 0.3, cy - core * 0.3, core * 0.1, cx, cy, core);
            fill.addColorStop(0, "rgba(255,255,255,0.95)");
            fill.addColorStop(0.35, rgba(0.95));
            fill.addColorStop(1, rgba(0.55));
            ctx.fillStyle = fill;
            ctx.beginPath();
            ctx.arc(cx, cy, core, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.55)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, core * 0.72, t * (reduce ? 0 : 1.2), t * (reduce ? 0 : 1.2) + Math.PI * 1.3);
            ctx.stroke();

            frame = requestAnimationFrame(draw);
        };
        frame = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(frame);
            observer?.disconnect();
        };
    }, [levelRef]);

    return <canvas ref={canvasRef} className="h-full w-full" aria-hidden data-jarvis-orb />;
}
