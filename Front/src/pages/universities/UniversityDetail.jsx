import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API } from "../../lib/config";
import { 
  Building2, MapPin, ArrowLeft, BookOpen, Clock, 
  GraduationCap, Info, Search, Filter, ShieldCheck 
} from "lucide-react";
import { useTranslation } from "react-i18next";

const CLUSTER_COLORS = {
  1: { bg: "#FAEEDA", text: "#633806", name: "Илмҳои табиӣ ва техникӣ" },
  2: { bg: "#E1F5EE", text: "#085041", name: "Иқтисод ва география" },
  3: { bg: "#FAECE7", text: "#712B13", name: "Филология ва санъат" },
  4: { bg: "#EEEDFE", text: "#3C3489", name: "Ҷомеашиносӣ ва ҳуқуқ" },
  5: { bg: "#FBEAF0", text: "#72243E", name: "Тиб ва биология" },
};

export default function UniversityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [university, setUniversity] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCluster, setActiveCluster] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        setLoading(true);
        const [uniRes, specRes] = await Promise.all([
          axios.get(`${API}/universities/${id}`),
          axios.get(`${API}/universities/${id}/specialties`),
        ]);
        setUniversity(uniRes.data);
        setSpecialties(specRes.data);
      } catch (error) {
        console.error("Failed to fetch university details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const clusters = Array.from(new Set(specialties.map(s => s.cluster?.clusterId))).filter(Boolean).sort();

  const filteredSpecialties = specialties.filter(s => {
    const matchesCluster = activeCluster ? s.cluster?.clusterId === activeCluster : true;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCluster && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!university) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 text-center">
        <h2 className="text-2xl font-bold">Донишгоҳ ёфт нашуд</h2>
        <button onClick={() => navigate("/universities")} className="mt-4 text-primary font-bold">
          ← Бозгашт ба харита
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* BACK BUTTON */}
        <button 
          onClick={() => navigate("/universities")}
          className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Бозгашт ба харита
        </button>

        {/* UNIVERSITY HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-card/40 backdrop-blur-xl relative overflow-hidden mb-12"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center p-4">
              {university.logo ? (
                <img src={university.logo} alt={university.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-12 h-12 text-primary" />
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
                  {university.name}
                </h1>
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-muted-foreground border border-white/5">
                    <MapPin className="w-3.5 h-3.5" /> {university.city}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Аккредитатсияшуда
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-xs font-bold text-blue-400 border border-blue-500/20">
                    {university.type || "Давлатӣ"}
                  </span>
                </div>
              </div>
              
              <p className="text-muted-foreground font-medium leading-relaxed max-w-3xl line-clamp-3">
                {university.description || "Маълумоти иловагӣ дар бораи донишгоҳ ҳоло дастрас нест."}
              </p>

              <div className="flex gap-8 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Ихтисосҳо</p>
                  <p className="text-xl font-bold text-foreground">{specialties.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Кластерҳо</p>
                  <p className="text-xl font-bold text-foreground">{clusters.length}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FILTER BAR */}
        <section className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Ихтисосҳои пешниҳодшуда
            </h2>
            
            <div className="w-full md:w-80 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Ҷустуҷӯи ихтисос..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:border-primary/40 focus:bg-white/10 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveCluster(null)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeCluster === null 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
              }`}
            >
              Ҳама
            </button>
            {clusters.map(cId => (
              <button 
                key={cId}
                onClick={() => setActiveCluster(cId)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeCluster === cId 
                  ? "shadow-lg" 
                  : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                }`}
                style={activeCluster === cId ? {
                  backgroundColor: CLUSTER_COLORS[cId]?.bg || "var(--primary)",
                  color: CLUSTER_COLORS[cId]?.text || "var(--primary-foreground)",
                  borderColor: CLUSTER_COLORS[cId]?.text || "var(--primary)"
                } : {}}
              >
                {CLUSTER_COLORS[cId]?.name || `Кластери ${cId}`}
              </button>
            ))}
          </div>

          <p className="text-sm font-bold text-muted-foreground">
            Нишон дода шуд: <span className="text-foreground">{filteredSpecialties.length}</span> ихтисос
          </p>
        </section>

        {/* SPECIALTIES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSpecialties.map((spec, idx) => {
              const cData = CLUSTER_COLORS[spec.cluster?.clusterId];
              return (
                <motion.div
                  layout
                  key={spec.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="glass-card p-6 rounded-3xl border border-white/5 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all group cursor-pointer"
                  onClick={() => navigate(`/info/${spec.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                      style={{ backgroundColor: cData?.bg || "var(--primary/10)", color: cData?.text || "var(--primary)" }}
                    >
                      Класстери {spec.cluster?.clusterId}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground leading-snug mb-4 line-clamp-2 min-h-[3.5rem]">
                    {spec.name}
                  </h3>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {spec.durationYears || 4} сол
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {spec.degreeType || "Бакалавр"}
                      </div>
                    </div>
                    <div className="text-xs font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Муфассал
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredSpecialties.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-xl font-bold text-muted-foreground">Ихтисос ёфт нашуд</p>
            <button 
              onClick={() => {setActiveCluster(null); setSearchQuery("");}}
              className="text-primary font-bold hover:underline"
            >
              Тоза кардани филтрҳо
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
