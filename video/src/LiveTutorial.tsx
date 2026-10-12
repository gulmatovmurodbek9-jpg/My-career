import React from "react";
import { AbsoluteFill, interpolate, Easing, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Card, FPS, INTRO, LABELS, PRIMARY, fontFamily } from "./Tutorial";

// Видеои омӯзишии ЗИНДА: муқаддима → сабти зиндаи экран бо овози модел.
// То бинанда донад, ки куҷоро бинад: «камера» ба элементи амал зум мекунад, гирди он чорчӯбаи
// зард медурахшад ва дигар ҷойҳо каме торик мешаванд. Дар боло — дастури кӯтоҳи қадам,
// дар поён (берун аз экран) — матни овоз. Ду тарҳ: компютер (1920×1080) ва телефон (1080×1920).
type LiveScene = { start: number; duration: number; narr: string; hint?: string | null; audio: string };
type Mark = { t0: number; t1: number | null; x: number; y: number; w: number; h: number; vw: number; vh: number };
export type LiveManifest = { id: string; lang: string; title: string; next: string | null; mobile?: boolean; video: string; videoDuration: number; scenes: LiveScene[]; marks?: Mark[] };
export type LiveProps = { manifest: LiveManifest };

const FADE = 18;
const YELLOW = "#facc15";
export function liveTimeline(manifest: LiveManifest) {
    const body = Math.ceil(manifest.videoDuration * FPS);
    return { body, total: INTRO + body };
}
export const liveSize = (manifest: LiveManifest) => (manifest.mobile ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 });

const file = (m: LiveManifest, name: string) => staticFile(`v/${m.id}/${m.lang}/${name}`);

// Ҷойи экран дар кадр.
const DESK = { left: 231, top: 118, width: 1458, height: 820, radius: 18 };
const PHONE_H = 1330;
const PHONE = { width: Math.round((PHONE_H * 780) / 1688), height: PHONE_H, top: 250, radius: 54 };

const ease = Easing.bezier(0.45, 0, 0.25, 1);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// Камера дар лаҳзаи t (бе ҳамворкунӣ): зум ва маркази нигоҳ дар пикселҳои CSS-и саҳифа.
function rawCamera(marks: Mark[], t: number, vw: number, vh: number, mobile: boolean) {
    const m = marks.find((k) => t >= k.t0 && t <= (k.t1 ?? k.t0 + 3) + 0.5);
    if (!m) return { z: 1, cx: vw / 2, cy: vh / 2 };
    const zmax = mobile ? 1.45 : 1.75;
    const z = clamp(Math.min((vw * 0.6) / Math.max(m.w, 1), (vh * 0.55) / Math.max(m.h, 1)), 1, zmax);
    const cx = clamp(m.x + m.w / 2, vw / (2 * z), vw - vw / (2 * z));
    const cy = clamp(m.y + m.h / 2, vh / (2 * z), vh - vh / (2 * z));
    return { z, cx, cy };
}

// Ҳамворкунӣ: миёнаи камера дар 0.7 сонияи охир — зум ва гузариш нарм мешаванд.
function camera(marks: Mark[], t: number, vw: number, vh: number, mobile: boolean) {
    const N = 21;
    let z = 0, cx = 0, cy = 0, sum = 0;
    for (let i = 0; i < N; i += 1) {
        const w = 1 + i; // кадрҳои наздиктар вазни бештар доранд
        const c = rawCamera(marks, t - 0.7 + (0.7 * i) / (N - 1), vw, vh, mobile);
        z += c.z * w; cx += c.cx * w; cy += c.cy * w; sum += w;
    }
    return { z: z / sum, cx: cx / sum, cy: cy / sum };
}

const Body: React.FC<{ manifest: LiveManifest; length: number }> = ({ manifest, length }) => {
    const frame = useCurrentFrame();
    const t = frame / FPS;
    const mobile = !!manifest.mobile;
    const marks = manifest.marks || [];
    const vw = marks[0]?.vw ?? (mobile ? 390 : 1280);
    const vh = marks[0]?.vh ?? (mobile ? 664 : 720);
    const index = Math.max(0, manifest.scenes.findIndex((s, i) => t >= s.start && t < (manifest.scenes[i + 1]?.start ?? Infinity)));
    const scene = manifest.scenes[index];
    const since = t - (scene?.start ?? 0);
    const appear = interpolate(since, [0, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const out = interpolate(frame, [length - FADE, length], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const screen = mobile
        ? { left: (1080 - PHONE.width) / 2, top: PHONE.top, width: PHONE.width, height: PHONE.height, radius: PHONE.radius }
        : DESK;
    const k = screen.width / vw; // пикселҳои CSS → пикселҳои экран дар кадр
    const cam = camera(marks, t, vw, vh, mobile);
    const tx = screen.width / 2 - cam.cx * k * cam.z;
    const ty = screen.height / 2 - cam.cy * k * cam.z;

    // Нишонаи фаъол: чорчӯбаи зард ва торикии атроф.
    const mark = marks.find((m) => t >= m.t0 && t <= (m.t1 ?? m.t0 + 3) + 0.35);
    const spot = mark
        ? interpolate(t, [mark.t0 + 0.15, mark.t0 + 0.55, (mark.t1 ?? mark.t0 + 3) + 0.05, (mark.t1 ?? mark.t0 + 3) + 0.35], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })
        : 0;
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    const pad = 8;

    const steps = manifest.scenes.length;
    const labels = LABELS[manifest.lang] || LABELS.tj;

    return (
        <AbsoluteFill style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)", opacity: out, fontFamily }}>
            {/* Дастури қадам */}
            <div style={{ position: "absolute", left: mobile ? 40 : DESK.left, right: mobile ? 40 : 1920 - DESK.left - DESK.width, top: mobile ? 50 : 22, height: mobile ? 170 : 80, display: "flex", flexDirection: mobile ? "column" : "row", alignItems: "center", justifyContent: mobile ? "center" : "flex-start", gap: mobile ? 14 : 22 }}>
                <div style={{ flex: "none", background: PRIMARY, color: "white", borderRadius: 999, padding: mobile ? "8px 26px" : "8px 24px", fontSize: mobile ? 34 : 30, fontWeight: 800, boxShadow: "0 8px 24px rgba(37,99,235,0.45)" }}>
                    {labels.step} {index + 1}/{steps}
                </div>
                {scene?.hint && (
                    <div style={{ opacity: appear, transform: `translateY(${(1 - appear) * 12}px)`, color: YELLOW, fontSize: mobile ? 50 : 46, fontWeight: 800, lineHeight: 1.15, textAlign: mobile ? "center" : "left", textShadow: "0 3px 12px rgba(0,0,0,0.35)" }}>
                        {scene.hint}
                    </div>
                )}
            </div>

            {/* Экран */}
            <div style={{ position: "absolute", left: screen.left, top: screen.top, width: screen.width, height: screen.height, borderRadius: screen.radius, border: mobile ? "12px solid #0b1020" : "none", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", background: "#fff" }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: screen.width, height: screen.height, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${cam.z})` }}>
                    <OffthreadVideo src={file(manifest, manifest.video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                    {mark && spot > 0 && (
                        <div style={{
                            position: "absolute",
                            left: mark.x * k - pad, top: mark.y * k - pad, width: mark.w * k + pad * 2, height: mark.h * k + pad * 2,
                            borderRadius: 14 / cam.z + 6,
                            border: `${4 / cam.z + 1}px solid ${YELLOW}`,
                            boxShadow: `0 0 0 9999px rgba(15,23,42,${0.42 * spot}), 0 0 ${(10 + 14 * pulse) / cam.z}px ${(3 + 4 * pulse) / cam.z}px rgba(250,204,21,0.75)`,
                            opacity: spot,
                        }} />
                    )}
                </div>
            </div>

            {/* Матни овоз — берун аз экран, то ҳеҷ чизро напӯшонад */}
            {scene && (
                <div style={{ position: "absolute", left: mobile ? 40 : 120, right: mobile ? 40 : 120, top: mobile ? PHONE.top + PHONE.height + 40 : DESK.top + DESK.height + 12, bottom: mobile ? 40 : 10, display: "flex", alignItems: mobile ? "flex-start" : "center", justifyContent: "center", opacity: appear }}>
                    <div style={{ color: "white", fontSize: mobile ? 44 : 36, lineHeight: 1.3, fontWeight: 600, textAlign: "center", textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                        {scene.narr}
                    </div>
                </div>
            )}

            {manifest.scenes.map((s) => (
                <Sequence key={s.audio} from={Math.round(s.start * FPS) + 4} layout="none">
                    <Audio src={file(manifest, s.audio)} />
                </Sequence>
            ))}
        </AbsoluteFill>
    );
};

export const LiveTutorial: React.FC<LiveProps> = ({ manifest }) => {
    const tl = liveTimeline(manifest);
    const card = { ...manifest, next: null } as any;
    return (
        <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
            <Sequence durationInFrames={INTRO}><Card manifest={card} kind="intro" /></Sequence>
            <Sequence from={INTRO} durationInFrames={tl.body}><Body manifest={manifest} length={tl.body} /></Sequence>
        </AbsoluteFill>
    );
};
