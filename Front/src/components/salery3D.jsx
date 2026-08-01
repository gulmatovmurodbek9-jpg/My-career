import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, MeshDistortMaterial, Sphere, Box } from "@react-three/drei";
import { motion } from "framer-motion";

// 3D Scene Component
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4f46e5" />

      {/* Junior Level - Small Sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} position={[-3, -1, 0]}>
        <Sphere args={[0.8, 32, 32]}>
          <MeshDistortMaterial
            color="#10b981"
            attach="material"
            distort={0.3}
            speed={2}
            roughness={0.2}
          />
        </Sphere>
      </Float>

      {/* Mid Level - Medium Box */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8} position={[0, 0.5, 0]}>
        <Box args={[1.2, 1.2, 1.2]}>
          <MeshDistortMaterial
            color="#3b82f6"
            attach="material"
            distort={0.4}
            speed={1.5}
            roughness={0.1}
          />
        </Box>
      </Float>

      {/* Senior Level - Large Sphere */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={1} position={[3, 1.5, 0]}>
        <Sphere args={[1.2, 32, 32]}>
          <MeshDistortMaterial
            color="#a855f7"
            attach="material"
            distort={0.5}
            speed={1}
            roughness={0.1}
          />
        </Sphere>
      </Float>

      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
    </>
  );
}

const SalaryVisualization3D = ({ salaryData }) => {
  const levels = [
    {
      title: "Навкор",
      salary: salaryData?.junior,
      gradient: "from-green-500/20 via-green-500/10 to-transparent",
      borderColor: "border-green-500/30",
      textColor: "text-green-600",
      bgGlow: "bg-green-500/5",
      icon: "💼"
    },
    {
      title: "Таҷрибаи миёна",
      salary: salaryData?.mid,
      gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
      borderColor: "border-blue-500/30",
      textColor: "text-blue-600",
      bgGlow: "bg-blue-500/5",
      icon: "🚀"
    },
    {
      title: "Тарҷрибаи кории калон",
      salary: salaryData?.senior,
      gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
      borderColor: "border-purple-500/30",
      textColor: "text-purple-600",
      bgGlow: "bg-purple-500/5",
      icon: "⭐"
    }
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <Scene />
        </Canvas>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Сатҳи музди меҳнат
          </h3>
          <p className="text-muted-foreground">Дар асоси таҷриба ва малака</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {levels.map((level, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${level.gradient} border ${level.borderColor} backdrop-blur-sm overflow-hidden`}>
                <div className={`absolute inset-0 ${level.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform">
                    {level.icon}
                  </div>

                  <div className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    {level.title}
                  </div>

                  <div className={`text-2xl font-bold ${level.textColor} mb-2`}>
                    {level.salary}
                  </div>

                  <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-4">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(index + 1) * 33}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className={`h-full bg-gradient-to-r ${level.gradient.replace('/20', '/60').replace('/10', '/40')}`}
                    />
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    {index === 0 && "0-2 сол таҷриба"}
                    {index === 1 && "2-5 сол таҷриба"}
                    {index === 2 && "5+ сол таҷриба"}
                  </div>
                </div>

                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
              </div>

              <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${level.gradient} blur-xl opacity-50 group-hover:opacity-70 transition-opacity rounded-2xl`} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
             Музди меҳнат вобаста ба ҷойгиршавӣ, компания ва малакаҳои шахсӣ фарқ мекунад
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SalaryVisualization3D;
