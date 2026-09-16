import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API } from "../../lib/config";
import { usePageMeta } from "../../lib/usePageMeta";
import { withLang } from "../../lib/apiLang";
import { 
  Building2, MapPin, ArrowLeft, BookOpen, Clock, 
  GraduationCap, Info, Search, Filter, ShieldCheck 
} from "lucide-react";
import { useTranslation } from "react-i18next";

const CLUSTER_COLORS = {
  1: { bg: "#FAEEDA", text: "#633806" },
  2: { bg: "#E1F5EE", text: "#085041" },
  3: { bg: "#FAECE7", text: "#712B13" },
  4: { bg: "#EEEDFE", text: "#3C3489" },
  5: { bg: "#FBEAF0", text: "#72243E" },
};

const clusterName = (t, id) => t(`career_page.cl_${id}`);

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
          axios.get(`${API}/universities/${id}`, { params: withLang() }),
          axios.get(`${API}/universities/${id}/specialties`, { params: withLang() }),
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

  usePageMeta({
    ready: !!university,
    title: university ? `${university.name}${university.city ? ` — ${university.city}` : ""}` : undefined,
    description: university
      ? [
        university.description,
        specialties.length ? t("career_page.u_specialties_meta", { count: specialties.length }) : null,
      ].filter(Boolean).join(" ") ||
      t("career_page.u_meta_fallback", {
        name: university.nameTranslated || university.name,
        city: university.city ? `, ${university.city}` : "",
      })
      : undefined,
    path: `/universities/${id}`,
    image: university?.logo || undefined,
    jsonLd: university
      ? {
        "@context": "https://schema.org",
        "@type": "CollegeOrUniversity",
        name: university.name,
        alternateName: university.shortName || undefined,
        description: university.description || undefined,
        url: university.website || undefined,
        address: university.city
          ? {
            "@type": "PostalAddress",
            streetAddress: university.address || undefined,
            addressLocality: university.city,
            addressCountry: "TJ",
          }
          : undefined,
        geo: university.latitude && university.longitude
          ? {
            "@type": "GeoCoordinates",
            latitude: university.latitude,
            longitude: university.longitude,
          }
          : undefined,
      }
      : undefined,
  });

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
        <h2 className="text-2xl font-bold">{t("career_page.u_not_found")}</h2>
        <button onClick={() => navigate("/universities")} className="mt-4 text-primary font-bold">
          ← {t("career_page.u_back_to_map")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <button 
          onClick={() => navigate("/universities")}
          className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {t("career_page.u_back_to_map")}
        </button>

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
                  {university.nameTranslated || university.name}
                </h1>
                {university.nameTranslated && (
                  <p className="text-sm text-muted-foreground">{university.name}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-muted-foreground border border-white/5">
                    <MapPin className="w-3.5 h-3.5" />
                    {[university.city, university.region].filter(Boolean).join(", ")}
                  </span>

                  {university.institutionType && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-muted-foreground border border-white/5">
                      <Building2 className="w-3.5 h-3.5" /> {university.institutionType}
                    </span>
                  )}

                  <span
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      university.isState
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-secondary/10 text-secondary border-secondary/20"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {university.isState ? t("career_page.u_state") : t("career_page.u_non_state")}
                  </span>
                </div>
              </div>

              {university.description && (
                <p className="text-muted-foreground font-medium leading-relaxed max-w-3xl">
                  {university.description}
                </p>
              )}

              <div className="flex gap-8 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t("career_page.u_specialties")}</p>
                  <p className="text-xl font-bold text-foreground">{specialties.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t("career_page.u_clusters")}</p>
                  <p className="text-xl font-bold text-foreground">{clusters.length}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <section className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {t("career_page.u_offered")}
            </h2>
            
            <div className="w-full md:w-80 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder={t("career_page.u_search_specialty")}
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
              {t("career_page.u_all")}
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
                {clusterName(t, cId)}
              </button>
            ))}
          </div>

          <p className="text-sm font-bold text-muted-foreground">
            {t("misc.shown", { count: filteredSpecialties.length })}
          </p>
        </section>

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
                      {t("misc.cluster_short", { id: spec.cluster?.clusterId })}
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
                        {t("misc.years", { count: spec.durationYears || 4 })}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {spec.degreeType || t("misc.bachelor")}
                      </div>
                    </div>
                    <div className="text-xs font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {t("misc2.detail")}
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
            <p className="text-xl font-bold text-muted-foreground">{t("misc2.no_specialty")}</p>
            <button 
              onClick={() => {setActiveCluster(null); setSearchQuery("");}}
              className="text-primary font-bold hover:underline"
            >
              {t("career_page.u_clear_filters")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
