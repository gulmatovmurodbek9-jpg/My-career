import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/google-fonts/GolosText";

// Видеои омӯзишӣ: муқаддима → саҳнаҳо (скриншоти сайт, курсор, клик, зум, зерсарлавҳа, садо) → охир.
const { fontFamily } = loadFont("normal", { subsets: ["cyrillic", "cyrillic-ext", "latin"], weights: ["500", "700", "800"] });

export const FPS = 30;
const INTRO = 75;
const OUTRO_MIN = 105;
const SCALE = 1.5; // скриншот 1280×720 CSS → 1920×1080
const PRIMARY = "#2563eb";
const FRAME = { s: 0.92, x: 77, y: 64 };

type Rect = { x: number; y: number; w: number; h: number } | null;
type Scene = { img: string; rect: Rect; click: boolean; zoom: number; narr: string; audio?: string; duration?: number };
type Manifest = { id: string; lang: string; title: string; next: string | null; nextAudio?: string; nextDuration?: number; scenes: Scene[] };
export type TutorialProps = { manifest: Manifest };

const LABELS: Record<string, { step: string; next: string; site: string }> = {
    tj: { step: "Қадам", next: "Қадами навбатӣ", site: "ikhtisosiman.qobus.tj" },
    ru: { step: "Шаг", next: "Следующий шаг", site: "ikhtisosiman.qobus.tj" },
    en: { step: "Step", next: "Next step", site: "ikhtisosiman.qobus.tj" },
};

export function timeline(manifest: Manifest) {
    let from = INTRO;
    const scenes = manifest.scenes.map((scene) => {
        const length = Math.max(60, Math.ceil(((scene.duration || 3) + 0.7) * FPS));
        const item = { from, length };
        from += length;
        return item;
    });
    const outro = Math.max(OUTRO_MIN, Math.ceil(((manifest.nextDuration || 2) + 1.2) * FPS));
    return { scenes, outroFrom: from, outro, total: from + outro };
}

const src = (manifest: Manifest, file: string) => staticFile(`v/${manifest.id}/${manifest.lang}/${file}`);

const Cursor: React.FC<{ x: number; y: number; pressed: number }> = ({ x, y, pressed }) => (
    <svg width={54} height={54} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 6, top: y - 3, transform: `scale(${1 - pressed * 0.15})`, transformOrigin: "6px 3px", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
        <path d="M5 2l14 10.5-6.2 1.1 3.9 7.4-2.9 1.5-3.9-7.5L5 19.5z" fill="#0f172a" stroke="#ffffff" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
);

const SceneView: React.FC<{ manifest: Manifest; index: number; length: number }> = ({ manifest, index, length }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const scene = manifest.scenes[index];
    const prev = manifest.scenes.slice(0, index).reverse().find((s) => s.rect)?.rect;
    const r = scene.rect ? { x: scene.rect.x * SCALE, y: scene.rect.y * SCALE, w: scene.rect.w * SCALE, h: scene.rect.h * SCALE } : null;
    const target = r ? { x: r.x + Math.min(r.w / 2, 60), y: r.y + r.h / 2 } : null;
    const start = prev ? { x: prev.x * SCALE + Math.min(prev.w * SCALE / 2, 60), y: prev.y * SCALE + prev.h * SCALE / 2 } : { x: 1500, y: 900 };

    const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
    const move = spring({ frame: frame - 6, fps, config: { damping: 200 }, durationInFrames: 24 });
    const cx = target ? interpolate(move, [0, 1], [start.x, target.x]) : start.x;
    const cy = target ? interpolate(move, [0, 1], [start.y, target.y]) : start.y;
    const clickAt = 34;
    const pressed = scene.click ? interpolate(frame, [clickAt, clickAt + 4, clickAt + 10], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
    const ripple = scene.click ? interpolate(frame, [clickAt, clickAt + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
    const ring = r ? interpolate(frame, [22, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

    // Зуми нарм ба сӯи элемент (Ken Burns), то ҳадде ки канори скриншот берун наояд.
    const zoom = interpolate(frame, [0, length], [1, scene.zoom || 1], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
    const ox = target ? Math.min(1920, Math.max(0, target.x)) : 960;
    const oy = target ? Math.min(1080, Math.max(0, target.y)) : 540;

    return (
        <AbsoluteFill style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)", opacity: fadeIn }}>
            {/* Скриншот дар чорчӯба (92%) — болояш ҷой барои рақами қадам. */}
            <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920 * FRAME.s, height: 1080 * FRAME.s, borderRadius: 22, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
            <AbsoluteFill style={{ width: 1920, height: 1080, transform: `scale(${FRAME.s})`, transformOrigin: "0 0" }}>
            <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${ox}px ${oy}px` }}>
                <Img src={src(manifest, scene.img)} style={{ width: 1920, height: 1080 }} />
                {r && (
                    <div style={{
                        position: "absolute", left: r.x - 10, top: r.y - 10, width: r.w + 20, height: r.h + 20, borderRadius: 18,
                        border: `5px solid ${PRIMARY}`, boxShadow: `0 0 0 ${8 + 6 * Math.sin(frame / 6)}px rgba(37,99,235,0.18)`, opacity: ring,
                    }} />
                )}
                {scene.click && target && (
                    <div style={{
                        position: "absolute", left: target.x - 60 * ripple, top: target.y - 60 * ripple, width: 120 * ripple, height: 120 * ripple,
                        borderRadius: "50%", border: `4px solid ${PRIMARY}`, opacity: 1 - ripple,
                    }} />
                )}
                {target && <Cursor x={cx} y={cy} pressed={pressed} />}
            </AbsoluteFill>
            </AbsoluteFill>
            </div>

            {/* Рақами қадам */}
            <div style={{ position: "absolute", top: 14, left: FRAME.x, display: "flex", alignItems: "center", gap: 14, fontFamily }}>
                <div style={{ background: PRIMARY, color: "white", borderRadius: 999, padding: "6px 20px", fontSize: 26, fontWeight: 800, boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}>
                    {LABELS[manifest.lang]?.step} {index + 1}/{manifest.scenes.length}
                </div>
                <div style={{ color: "white", padding: "6px 4px", fontSize: 26, fontWeight: 700, opacity: 0.92 }}>{manifest.title}</div>
            </div>

            {/* Зерсарлавҳа */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", fontFamily }}>
                <div style={{
                    maxWidth: 1560, background: "rgba(15,23,42,0.86)", color: "white", borderRadius: 26, padding: "22px 36px",
                    fontSize: 40, lineHeight: 1.35, fontWeight: 600, textAlign: "center", boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                    opacity: interpolate(frame, [4, 14], [0, 1], { extrapolateRight: "clamp" }),
                }}>{scene.narr}</div>
            </div>
            {scene.audio && <Sequence from={6} layout="none"><Audio src={src(manifest, scene.audio)} /></Sequence>}
        </AbsoluteFill>
    );
};

const Card: React.FC<{ manifest: Manifest; kind: "intro" | "outro" }> = ({ manifest, kind }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const pop = spring({ frame, fps, config: { damping: 14 } });
    const labels = LABELS[manifest.lang] || LABELS.tj;
    return (
        <AbsoluteFill style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #312e81 100%)", alignItems: "center", justifyContent: "center", fontFamily, color: "white" }}>
            <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: -300, right: -200 }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34, transform: `scale(${0.85 + 0.15 * pop})`, opacity: pop, padding: "0 120px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
                    <Img src={staticFile("icon-512.png")} style={{ width: 130, height: 130, borderRadius: 30, boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }} />
                    <div style={{ fontSize: 70, fontWeight: 800, letterSpacing: 1 }}>ИХТИСОСИ МАН</div>
                </div>
                {kind === "intro" ? (
                    <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.1 }}>{manifest.title}</div>
                ) : (
                    <>
                        {manifest.next && (
                            <>
                                <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.8 }}>{labels.next}:</div>
                                <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.15, maxWidth: 1500 }}>{manifest.next}</div>
                            </>
                        )}
                        <div style={{ marginTop: 20, fontSize: 46, fontWeight: 700, background: "rgba(255,255,255,0.16)", borderRadius: 999, padding: "16px 44px" }}>{labels.site}</div>
                    </>
                )}
            </div>
            {kind === "outro" && manifest.nextAudio && <Sequence from={10} layout="none"><Audio src={src(manifest, manifest.nextAudio)} /></Sequence>}
        </AbsoluteFill>
    );
};

export const Tutorial: React.FC<TutorialProps> = ({ manifest }) => {
    const t = timeline(manifest);
    return (
        <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
            <Sequence durationInFrames={INTRO}><Card manifest={manifest} kind="intro" /></Sequence>
            {manifest.scenes.map((scene, i) => (
                <Sequence key={scene.img} from={t.scenes[i].from} durationInFrames={t.scenes[i].length}>
                    <SceneView manifest={manifest} index={i} length={t.scenes[i].length} />
                </Sequence>
            ))}
            <Sequence from={t.outroFrom} durationInFrames={t.outro}><Card manifest={manifest} kind="outro" /></Sequence>
        </AbsoluteFill>
    );
};
