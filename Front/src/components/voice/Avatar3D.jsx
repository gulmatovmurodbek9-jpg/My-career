import React, { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/murod-agent.glb";

// Модел аниматсия надорад — ҳаракатро худамон месозем.
function Character({ state, levelRef }) {
    const { scene } = useGLTF(MODEL_URL);
    const group = useRef(null);

    // Нусхаи алоҳида: як модел дар ду ҷо истифода шуданаш мумкин аст.
    const model = useMemo(() => scene.clone(true), [scene]);

    // Моделро ба маркази кадр меорем ва андозаашро ба воҳид меоварем.
    useLayoutEffect(() => {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const height = size.y || 1;

        model.position.set(-center.x, -box.min.y - height / 2, -center.z);
        model.scale.setScalar(2 / height);

        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = false;
                node.receiveShadow = false;
                if (node.material) node.material.envMapIntensity = 0.8;
            }
        });
    }, [model]);

    useFrame((_, delta) => {
        const node = group.current;
        if (!node) return;

        const time = performance.now() / 1000;
        const level = levelRef.current || 0;

        // Оромона нафас мекашад.
        const breath = Math.sin(time * 1.6) * 0.012;
        // Ҳангоми гап задан ё гӯш кардан бо садо ҷунбиш мекунад.
        const pulse = state === "speaking" ? level * 0.06 : 0;

        node.position.y = breath + pulse;
        node.scale.setScalar(1 + pulse * 0.4);

        // Каме ба тарафи бинанда рӯ мегардонад; ҳангоми фикр — ба паҳлӯ.
        const target = state === "thinking" ? 0.35 : state === "listening" ? -0.12 : 0;
        node.rotation.y += (target + Math.sin(time * 0.5) * 0.08 - node.rotation.y) * Math.min(1, delta * 2.5);
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
