import React from "react";
import { motion } from "framer-motion";

/**
 * StatsCard — Dashboard stat card with icon, value, label, and trend.
 * Props:
 *  - icon: Lucide icon component
 *  - label: string
 *  - value: string | number
 *  - color: string (tailwind text color)
 *  - bg: string (tailwind bg color)
 *  - delay: number (animation delay)
 */
const StatsCard = ({ icon: Icon, label, value, color, bg, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-[#0f172a]/80 border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-all duration-500 overflow-hidden"
    >
      {/* Subtle gradient glow on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${bg} blur-3xl -z-10`} />

      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="text-3xl font-extrabold text-white tracking-tight mb-1">
        {value ?? "—"}
      </div>
      <div className="text-sm font-medium text-white/40">{label}</div>
    </motion.div>
  );
};

export default StatsCard;
