import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API } from "../../lib/config";
import { FolderKanban, ArrowRight, Target, Info } from "lucide-react";
import LucideIconRenderer from "../../components/admin/LucideIconRenderer";

export default function Clusters() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCluster, setActiveCluster] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchClusters = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/clusters`);
        setClusters(data || []);
        if (data && data.length > 0) {
          setActiveCluster(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch clusters:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClusters();
  }, []);

  return (
    <div className="pb-24 pt-24 min-h-screen">
      {/* ═══ HERO ═══ */}
      <section className="relative px-6 py-12 lg:px-8 text-center">
        <div className="absolute inset-0 bg-secondary/5 blur-3xl rounded-full" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-black uppercase tracking-[0.3em] text-secondary">
            <FolderKanban className="w-3.5 h-3.5" />
            {t("clusters.hero_tag", "5 Кластери ММТ")}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
            {t("clusters.hero_title", "Самтҳои Асосии Оянда")}
          </h1>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed">
            {t(
              "clusters.hero_desc",
              "Маркази миллии тестӣ 5 кластери асосиро барои касбҳои гуногун пешниҳод мекунад. Мақсад ва моҳияти ҳар як кластерро биомӯзед."
            )}
          </p>
        </div>
      </section>

      {/* ═══ CONTENT ═══ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 mt-12 relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 flex flex-col gap-4">
               {[...Array(5)].map((_, i) => <div key={i} className="glass-card h-20 shadow-none skeleton" />)}
            </div>
            <div className="md:col-span-8 glass-card min-h-[400px] skeleton rounded-[2rem]" />
          </div>
        ) : clusters.length === 0 ? (
           <div className="text-center py-20">
             <p className="text-xl text-muted-foreground font-bold">{t("clusters.not_found", "Кластерҳо ёфт нашуданд")}</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Sidebar list */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {clusters.map((cluster) => (
                <button
                  key={cluster.id}
                  onClick={() => setActiveCluster(cluster)}
                  className={`flex items-center gap-4 p-4 rounded-3xl transition-all cursor-pointer text-left border ${
                    activeCluster?.id === cluster.id 
                    ? "bg-secondary/10 border-secondary/30 shadow-lg shadow-secondary/5" 
                    : "glass-card border-white/5 hover:border-white/20 text-muted-foreground hover:text-foreground shadow-none"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    activeCluster?.id === cluster.id ? "bg-secondary text-white shadow-md shadow-secondary/30" : "bg-white/5"
                  }`}>
                    <LucideIconRenderer name={cluster.clusterIcon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-[15px] ${activeCluster?.id === cluster.id ? "text-foreground" : ""}`}>
                      {cluster.clusterName}
                    </h3>
                    <div className="text-xs opacity-60 font-bold uppercase tracking-widest mt-1">
                      {t("common.cluster")} {cluster.clusterId}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Display Area */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {activeCluster && (
                  <motion.div
                    key={activeCluster.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="glass-card p-8 md:p-12 rounded-[2rem] border border-white/10 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[100px] pointer-events-none" />
                    
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/20 flex items-center justify-center text-secondary shadow-xl shadow-secondary/10">
                        <LucideIconRenderer name={activeCluster.clusterIcon} className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-secondary tracking-[0.2em] uppercase mb-1">
                          Категорияи {activeCluster.clusterId}
                        </div>
                        <h2 className="text-3xl font-extrabold text-foreground leading-tight">
                          {activeCluster.clusterName}
                        </h2>
                      </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                      {/* Description */}
                      {activeCluster.description && (
                        <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                          <div className="flex items-center gap-2 text-foreground font-black mb-3 text-sm tracking-widest uppercase">
                            <Info className="w-4 h-4 text-secondary" /> {t("clusters.desc_title", "Тавсиф")}
                          </div>
                          <p className="text-muted-foreground leading-relaxed text-sm">
                            {activeCluster.description}
                          </p>
                        </div>
                      )}

                      {/* Purpose */}
                      {(activeCluster.purpose || activeCluster.description) && (
                        <div className="bg-secondary/5 border border-secondary/10 p-6 rounded-3xl">
                          <div className="flex items-center gap-2 text-foreground font-black mb-3 text-sm tracking-widest uppercase">
                            <Target className="w-4 h-4 text-secondary" /> {t("clusters.purpose_title", "Мақсад (Барои Чӣ?)")}
                          </div>
                          <p className="text-secondary-foreground leading-relaxed font-medium">
                            {activeCluster.purpose || "Тайёр кардани мутахассисони сатҳи баланд барои ниёзҳои ҷомеа ва давлат."}
                          </p>
                        </div>
                      )}

                      <div className="pt-8 flex flex-wrap gap-4">
                        <button 
                          onClick={() => navigate(`/careers?clusterId=${activeCluster.id}`)}
                          className="btn-primary !bg-secondary !border-secondary !shadow-secondary/20 hover:!bg-secondary/90 px-8 py-4 group"
                        >
                          {t("clusters.view_careers", "Ихтисосҳоро дидан")}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}
      </section>
    </div>
  );
}
