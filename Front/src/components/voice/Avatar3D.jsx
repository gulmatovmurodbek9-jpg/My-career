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

// Модел аниматсияи тайёр надорад — ҳаракатро худамон месозем.
function Character({ state, levelRef }) {
    const { scene } = useGLTF(MODEL_URL);
    const group = useRef(null);
    const bones = useRef({});
    const rest = useRef({});
    const mouth = useRef(null);
    const gesture = useRef({ phase: 0, amount: 0 });

    // Нусхаи алоҳида: як модел дар ду ҷо истифода шуданаш мумкин аст.
    const model = useMemo(() => scene.clone(true), [scene]);

    useLayoutEffect(() => {
        // Моделро ба маркази кадр меорем ва андозаашро ба воҳид меоварем.
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const height = size.y || 1;

        model.position.set(-center.x, -box.min.y - height / 2, -center.z);
        model.scale.setScalar(2 / height);

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

        // Ҳангоми гап задан дастҳо оҳиста ишора мекунанд.
        const talking = state === "speaking";
        gesture.current.amount = lerp(gesture.current.amount, talking ? 0.6 + level * 0.4 : 0, smooth);
        gesture.current.phase += delta * (talking ? 2.6 : 1);

        const wave = Math.sin(gesture.current.phase);
        const wave2 = Math.sin(gesture.current.phase * 0.7 + 1.1);
        const amount = gesture.current.amount;

        const apply = (name, dx, dy, dz) => {
            const target = bone[name];
            const start = base[name];
            if (!target || !start) return;
            target.rotation.x = lerp(target.rotation.x, start.x + dx, smooth);
            target.rotation.y = lerp(target.rotation.y, start.y + dy, smooth);
            target.rotation.z = lerp(target.rotation.z, start.z + dz, smooth);
        };

        // Дастҳо: ҳангоми гап задан аз бадан дур мешаванд ва ишора мекунанд.
        apply("UpperArm_R", -0.55 * amount + wave * 0.18 * amount, 0, -0.3 * amount);
        apply("Forearm_R", -0.7 * amount - wave * 0.3 * amount, 0, 0);
        apply("UpperArm_L", -0.45 * amount + wave2 * 0.16 * amount, 0, 0.28 * amount);
        apply("Forearm_L", -0.6 * amount - wave2 * 0.26 * amount, 0, 0);

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
        apply("Chest", talking ? wave * 0.03 : 0, 0, 0);
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

// Ҳалқаи ранга дар таги қадам — ҳолатро нишон медиҳад.
function Glow({ color }) {
    const mesh = useRef(null);
    useFrame(() => {
        if (mesh.current) mesh.current.rotation.z += 0.004;
    });
    return (
        <mesh ref={mesh} position={[0, -1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.62, 0.8, 48]} />
            <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
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
            camera={{ position: [0, 0.15, 3.1], fov: 35 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: "100%", height: "100%" }}
        >
            <ambientLight intensity={1.1} />
            <directionalLight position={[2.5, 4, 3]} intensity={1.6} />
            <directionalLight position={[-3, 1.5, -2]} intensity={0.5} color={color} />

            <Suspense fallback={null}>
                <Character state={state} levelRef={levelRef || fallbackLevel} />
                <Glow color={color} />
            </Suspense>
        </Canvas>
    );
}

useGLTF.preload(MODEL_URL);
