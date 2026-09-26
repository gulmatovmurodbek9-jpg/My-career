import React, { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/murod-agent.glb";

// Устухонҳое, ки ҳаракат медиҳем.
const BONES = [
    "UpperArm_L", "Forearm_L", "Hand_L",
    "UpperArm_R", "Forearm_R", "Hand_R",
    "Head", "Neck", "Chest", "Spine",
];

const lerp = (from, to, amount) => from + (to - from) * amount;

// Ишораҳои гап задан. u = китф (x — ба пеш, z — ба паҳлӯ), f = оринҷ, h = панҷа.
// Ҳар 1–2 сония яке интихоб мешавад, то ҳаракат такрорӣ нанамояд.
const GESTURES = [
    // Ҳарду даст кушода — «ана, бинед».
    { ruX: -0.65, ruZ: -0.55, rfX: -1.05, rhZ: 0.35, luX: -0.65, luZ: 0.55, lfX: -1.05, lhZ: -0.35 },
    // Дасти рост мефаҳмонад, чап поён.
    { ruX: -0.95, ruZ: -0.25, rfX: -1.35, rhZ: 0.2, luX: -0.2, luZ: 0.12, lfX: -0.35, lhZ: 0 },
    // Дасти чап мефаҳмонад, рост поён.
    { ruX: -0.2, ruZ: -0.12, rfX: -0.35, rhZ: 0, luX: -0.95, luZ: 0.25, lfX: -1.35, lhZ: -0.2 },
    // Ҳарду даст дар пеш — шумурдан, фаҳмондани тафсилот.
    { ruX: -0.85, ruZ: -0.12, rfX: -1.5, rhZ: 0.1, luX: -0.85, luZ: 0.12, lfX: -1.5, lhZ: -0.1 },
    // Як даст боло — таъкид.
    { ruX: -1.2, ruZ: -0.35, rfX: -1.1, rhZ: 0.4, luX: -0.45, luZ: 0.2, lfX: -0.9, lhZ: 0 },
];
const REST_POSE = { ruX: 0, ruZ: 0, rfX: 0, rhZ: 0, luX: 0, luZ: 0, lfX: 0, lhZ: 0 };

// Модел аниматсияи тайёр надорад — ҳаракатро худамон месозем.
function Character({ state, levelRef }) {
    const { scene } = useGLTF(MODEL_URL);
    const group = useRef(null);
    const bones = useRef({});
    const rest = useRef({});
    const mouth = useRef(null);
    const gesture = useRef({ phase: 0, amount: 0, pose: { ...REST_POSE }, target: REST_POSE, next: 0, index: -1 });

    // Нусхаи алоҳида: як модел дар ду ҷо истифода шуданаш мумкин аст.
    const model = useMemo(() => scene.clone(true), [scene]);

    useLayoutEffect(() => {
        // Моделро ба маркази кадр меорем ва андозаашро ба воҳид меоварем.
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const height = size.y || 1;

        // Мавқеъ бояд бо ҳамон миқёс зарб шавад — вагарна модел аз -1…1
        // мелағжад ва камераи «то камар» сарро мебурид.
        const scale = 2 / height;
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        bones.current = {};
        rest.current = {};

        model.traverse((node) => {
            if (BONES.includes(node.name) && !bones.current[node.name]) {
                bones.current[node.name] = node;
                rest.current[node.name] = node.rotation.clone();
            }
            // Ду даҳон: пӯшида ва кушода. Барои гап задан онҳоро иваз мекунем.
            if (node.name === "Mouth" && !mouth.current) mouth.current = { closed: node, open: null };
            if (node.name === "MouthOpen" && mouth.current) mouth.current.open = node;
        });

        if (mouth.current?.open) mouth.current.open.visible = false;
    }, [model]);

    useFrame((_, delta) => {
        const node = group.current;
        if (!node) return;

        const time = performance.now() / 1000;
        const level = levelRef.current || 0;
        const smooth = Math.min(1, delta * 6);
        const bone = bones.current;
        const base = rest.current;

        // Нафаскашии доимӣ, то мурда нанамояд.
        node.position.y = Math.sin(time * 1.6) * 0.012;

        // Ҳангоми гап задан дастҳо ишора мекунанд: ишораи нав ҳар 1–2 сония,
        // бо зарбаҳои хурд аз рӯи баландии садо.
        const talking = state === "speaking";
        const g = gesture.current;
        g.amount = lerp(g.amount, talking ? 1 : 0, Math.min(1, delta * 3));
        g.phase += delta * (talking ? 3.2 : 1);
        if (talking && time > g.next) {
            let index = Math.floor(Math.random() * GESTURES.length);
            if (index === g.index) index = (index + 1) % GESTURES.length;
            g.index = index;
            g.target = GESTURES[index];
            g.next = time + 1 + Math.random() * 1.1;
        }
        if (!talking) g.target = REST_POSE;
        const ease = Math.min(1, delta * 4);
        for (const key of Object.keys(g.pose)) g.pose[key] = lerp(g.pose[key], g.target[key], ease);

        const wave = Math.sin(g.phase);
        const wave2 = Math.sin(g.phase * 0.8 + 1.1);
        const beat = talking ? 0.12 + level * 0.35 : 0;
        const pose = g.pose;

        const apply = (name, dx, dy, dz) => {
            const target = bone[name];
            const start = base[name];
            if (!target || !start) return;
            target.rotation.x = lerp(target.rotation.x, start.x + dx, smooth);
            target.rotation.y = lerp(target.rotation.y, start.y + dy, smooth);
            target.rotation.z = lerp(target.rotation.z, start.z + dz, smooth);
        };

        apply("UpperArm_R", pose.ruX + wave * beat * 0.4, 0, pose.ruZ);
        apply("Forearm_R", pose.rfX - wave * beat, 0, 0);
        apply("Hand_R", 0, 0, pose.rhZ + wave * beat * 0.5);
        apply("UpperArm_L", pose.luX + wave2 * beat * 0.4, 0, pose.luZ);
        apply("Forearm_L", pose.lfX - wave2 * beat, 0, 0);
        apply("Hand_L", 0, 0, pose.lhZ - wave2 * beat * 0.5);

        // Вақте корбар гап мезанад, персонаж гӯш карда фикр мекунад:
        // сар каме хам ва ба паҳлӯ мегардад.
        const pondering = state === "listening" || state === "thinking";
        const tilt = pondering ? 0.22 : 0;
        const turn = pondering ? 0.18 : 0;

        apply("Head",
            (pondering ? 0.12 : 0) + (talking ? wave * 0.05 : 0),
            turn + Math.sin(time * 0.4) * 0.05,
            tilt);
        apply("Neck", pondering ? 0.08 : 0, turn * 0.4, tilt * 0.4);
        apply("Chest", talking ? wave * 0.04 : 0, talking ? (pose.ruX - pose.luX) * 0.08 : 0, 0);
        apply("Spine", 0, Math.sin(time * 0.3) * 0.03, 0);

        // Даҳон ҳангоми гап задан кушода мешавад.
        if (mouth.current?.open && mouth.current?.closed) {
            const speaking = talking && (level > 0.28 || Math.sin(gesture.current.phase * 3.4) > 0.2);
            mouth.current.open.visible = speaking;
            mouth.current.closed.visible = !speaking;
        }
    });

    return (
        <group ref={group}>
            <primitive object={model} />
        </group>
    );
}

const STATE_COLOR = {
    idle: "#3b82f6",
    listening: "#38bdf8",
    thinking: "#f59e0b",
    speaking: "#10b981",
};

export default function Avatar3D({ state = "idle", levelRef }) {
    const color = STATE_COLOR[state] || STATE_COLOR.idle;
    const fallbackLevel = useRef(0);

    return (
        <Canvas
            dpr={[1, 1.75]}
            // То камар: камера ба нимаи болоии бадан (модел аз -1 то 1).
            // rotation лозим аст: бе он R3F камераро ба (0,0,0), яъне ба камар, нигарон мекунад.
            camera={{ position: [0, 0.5, 1.95], rotation: [0, 0, 0], fov: 35 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: "100%", height: "100%" }}
        >
            <ambientLight intensity={1.1} />
            <directionalLight position={[2.5, 4, 3]} intensity={1.6} />
            <directionalLight position={[-3, 1.5, -2]} intensity={0.5} color={color} />

            <Suspense fallback={null}>
                <Character state={state} levelRef={levelRef || fallbackLevel} />
            </Suspense>
        </Canvas>
    );
}

useGLTF.preload(MODEL_URL);
