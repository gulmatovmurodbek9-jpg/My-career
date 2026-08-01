"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Float } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three"
const cubes = [
  {
    position: [0, 0, 0],
    color: "#6366f1",
    image: "https://media.istockphoto.com/id/1179633351/photo/nature-and-technology-abstract-concept-robot-hand-and-natural-hand-covered-with-grass.jpg?s=612x612&w=0&k=20&c=oIrNivd6U6lJfaf2sFEQydQo4ojRW-H5atud7xXF_Eo=",
    category: "Табиӣ ва техникӣ",
    description: "Математика, физика, техника ва технологияҳо. Омӯзиши назария ва амал барои сохтмон, муҳандисӣ ва барномасозӣ.",
  },
  {
    position: [2, 0, 0],
    color: "#8b5cf6",
    image: "https://thumbs.dreamstime.com/b/macroeconomics-illustrated-flat-design-concept-featuring-financial-charts-global-gdp-budget-stock-capital-rates-economy-384358494.jpg",
    category: "Иқтисод ва география",
    description: "Иқтисод, менеҷмент, молия ва география. Омӯзиши бозори кор, таҳлили маълумот ва идоракунии ресурсҳо.",
  },
  {
    position: [-2, 0, 0],
    color: "#06b6d4",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVMNLiXDL0J8iYU7ECu2hLz9nmfmExZDAtJw&s",
    category: "Филология, педагогика ва санъат",
    description: "Забон, адабиёт, педагогика ва санъат. Омӯзиши муошират, эҷодкорӣ ва таълими касбӣ.",
  },
  {
    position: [0, 2, 0],
    color: "#10b981",
    image: "https://thumbs.dreamstime.com/b/doctor-showing-tablet-sports-medicine-text-isolated-white-49825392.jpg",
    category: "Тиб, биология ва варзиш",
    description: "Тиб, биология, саломатӣ ва варзиш. Омӯзиши ташхис, нигоҳубин ва рушди ҷисмонӣ.",
  },
  {
    position: [0, -2, 0],
    color: "#f59e0b",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIbsd7pZ6OTRtlyJ8NsaPRSzAvMicBPXBbgA&s",
    category: "Ҷомеашиносӣ ва ҳуқуқ",
    description: "Сиёсат, ҳуқуқ, ҷамъиятшиносӣ ва соҳаҳои иҷтимоӣ. Омӯзиши қонун, таҳлили ҷомеа ва роҳҳои ҳалли мушкилот.",
  },
];

function InteractiveCube({ cube, onHover, isActive }) {
  const texture = useLoader(THREE.TextureLoader, cube.image)
  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
      <Box
        position={cube.position}
        args={[1, 1, 1]}
        onPointerEnter={() => onHover(cube)}
        onPointerLeave={() => onHover(null)}
      >
        <meshStandardMaterial
          map={texture}
          emissive={cube.color}

          emissiveIntensity={isActive ? 0.3 : 0.1}
          transparent
          opacity={isActive ? 1 : 0.8}
        />
      </Box>
    </Float>
  );
}

function Scene3D({ setHoveredInfo }) {
  const [hoveredCube, setHoveredCube] = useState(null);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <directionalLight position={[-10, -10, -5]} />

      {cubes.map((cube, index) => (
        <InteractiveCube
          key={index}
          cube={cube}
          onHover={(cube) => {
            setHoveredCube(cube);
            setHoveredInfo(cube);
          }}
          isActive={hoveredCube?.category === cube.category}
        />
      ))}

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        autoRotate
        autoRotateSpeed={0.5}
        maxDistance={10}
        minDistance={3}
      />
    </>
  );
}

export default function Interactive3DSection() {
  const [hoveredInfo, setHoveredInfo] = useState(null);

  return (
    <section className="py-28 section-wash relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground tracking-tight">
            Ҳар бахш ва ихтисосро <span className="text-gradient-primary">омӯзед</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Бар рӯи кубҳо курсор гузоред ва ихтисосҳоро кашф кунед.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 3D Canvas */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card overflow-hidden aspect-square !p-0"
          >
            <Canvas camera={{ position: [5, 5, 5], fov: 75 }}>
              <Scene3D setHoveredInfo={setHoveredInfo} />
            </Canvas>
          </motion.div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="glass-card p-6">
              <h3 className="text-2xl font-semibold mb-4 text-gradient-primary">
                Чӣ гуна истифода бурдан
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Барои чарх додан клик кунед</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                  <span>Барои тағйир додани назар чарх занонед</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>
                    Бар рӯи кубҳо курсор гузоред, то гуруҳи ихтисосҳоро бинед
                  </span>
                </li>
              </ul>
            </div>

            <div className="glass-card min-h-[200px] p-6 flex items-center justify-center">
              {hoveredInfo ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: hoveredInfo.color }}
                    />
                    <h4 className="text-xl font-semibold text-foreground">
                      {hoveredInfo.category}
                    </h4>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {hoveredInfo.description}
                  </p>
                </motion.div>
              ) : (
                <p className="text-muted-foreground text-center">
                  Курсорро ба куб равона кунед ва ихтисосро кашф кунед
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Lazy loading wrapper
export const LazyInteractive3DSection = (props) => (
    <React.Suspense fallback={
        <div className="py-28 section-wash relative">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="glass-card overflow-hidden aspect-square !p-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Боргузорӣ...</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-4"></div>
                            <div className="space-y-2">
                                <div className="h-3 bg-muted rounded animate-pulse"></div>
                                <div className="h-3 bg-muted rounded animate-pulse"></div>
                                <div className="h-3 bg-muted rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="glass-card min-h-[200px] p-6"></div>
                    </div>
                </div>
            </div>
        </div>
    }>
        <Interactive3DSection {...props} />
    </React.Suspense>
);
