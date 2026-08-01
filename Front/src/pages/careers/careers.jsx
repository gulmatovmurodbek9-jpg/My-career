import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, BookOpen, Briefcase,
  Grid3X3, LayoutList, Search, ChevronLeft, ChevronRight,
  Cpu, LineChart, Palette, Scale, Stethoscope
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API } from "../../lib/config";
import SpecialtyCard, { SpecialtyCardList } from "../../components/jobCard";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";

const LIMIT = 12; // items per page

// ─── Pagination Component ─────────────────────────────────────────────────────
const Pagination = ({ currentPage, lastPage, onPageChange }) => {
  if (lastPage <= 1) return null;

  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta;

    for (let i = 1; i <= lastPage; i++) {
      if (i === 1 || i === lastPage || (i >= left && i <= right)) {
        pages.push(i);
      }
    }

    const result = [];
    let prev = null;
    for (const page of pages) {
      if (prev !== null && page - prev > 1) {
        result.push("...");
      }
      result.push(page);
      prev = page;
    }
    return result;
  };

  const pages = getPages();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 mt-16 flex-wrap"
    >
      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-11 h-11 rounded-2xl glass-card border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Pages */}
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="w-11 h-11 flex items-center justify-center text-muted-foreground/50 text-sm font-black">
            ···
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-11 h-11 rounded-2xl text-sm font-black transition-all ${currentPage === page
              ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
              : "glass-card border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className="w-11 h-11 rounded-2xl glass-card border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
      >
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </motion.div>
  );
};

const IconMapper = ({ iconName, className }) => {
  const icons = {
    Cpu: Cpu,
    LineChart: LineChart,
    Palette: Palette,
    Scale: Scale,
    Stethoscope: Stethoscope,
  };
  const Icon = icons[iconName] || Briefcase;
  return <Icon className={className} />;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Careers = () => {
  const { t } = useTranslation();
  const [careers, setCareers] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: LIMIT, lastPage: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [cities, setCities] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { refreshProfile } = useAuthStore();

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCluster, priceFilter, cityFilter]);

  // Fetch careers (server-side pagination)
  const fetchCareers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: LIMIT,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCluster !== "all" && { clusterId: selectedCluster }),
        ...(priceFilter !== "all" && { maxPrice: parseInt(priceFilter) }),
        ...(cityFilter !== "all" && { city: cityFilter }),
      };
      const { data } = await axios.get(`${API}/careers`, { params });
      setCareers(data.data || []);
      setMeta(data.meta || { total: 0, page: 1, limit: LIMIT, lastPage: 1 });
    } catch (error) {
      console.error("Fetch careers error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedCluster, priceFilter, cityFilter]);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  // Fetch clusters and cities once
  useEffect(() => {
    axios.get(`${API}/clusters`).then(r => setClusters(r.data)).catch(console.error);
    axios.get(`${API}/universities/cities`)
      .then(r => setCities(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCities([]));
    refreshProfile();
    window.scrollTo(0, 0);
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="pb-24">
      {/* ═══ HERO ═══ */}
      <section className="pt-20 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 tajik-pattern opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              <Briefcase className="w-3.5 h-3.5" />
              {t('careers_page.hero_tag', "Кашфи Истеъдодҳо")}
            </div>
            <h1
              className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tighter leading-[0.9]"
              dangerouslySetInnerHTML={{ __html: t('careers_page.hero_title', "Ояндаи худро <br /> <span class=\"text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-gradient\">аз ин ҷо ёб!</span>").replace(/className=/g, 'class=') }}
            />
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              {t('careers_page.hero_desc', { defaultValue: "Дар байни {{total}}+ ихтисосҳои муосир роҳи беҳтарини касбии худро пайдо кунед.", total: meta.total })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ SEARCH & FILTERS ═══ */}
      <section className="sticky top-20 z-40 py-4 mb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="glass-card p-2 !rounded-[2.5rem] flex flex-col md:flex-row items-center gap-4 bg-card/60 backdrop-blur-2xl border-white/5 shadow-2xl">
            {/* Search */}
            <div className="flex-1 w-full relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder={t('careers_page.search_placeholder', "Ҷустуҷӯи ихтисос...")}
                className="w-full pl-16 pr-6 py-4 bg-transparent text-foreground placeholder:text-muted-foreground/50 font-bold text-sm focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* City Filter */}
            {cities.length > 0 && (
              <div className="flex items-center mx-2 my-2 md:my-0">
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 text-foreground text-xs font-bold rounded-[1.8rem] px-4 py-3 outline-none focus:border-primary/50 transition-colors max-w-[180px]"
                >
                  <option value="all" className="bg-[#0c1222]">{t('careers_page.all_cities', "Ҳамаи шаҳрҳо")}</option>
                  {cities.map((entry) => (
                    <option key={entry.city} value={entry.city} className="bg-[#0c1222]">
                      {entry.city} ({entry.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Filter */}
            <div className="flex items-center mx-2 my-2 md:my-0">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="bg-white/5 border border-white/10 text-foreground text-xs font-bold rounded-[1.8rem] px-4 py-3 outline-none focus:border-primary/50 transition-colors"
               >
                 <option value="all" className="bg-[#0c1222]">{t('careers_page.all_prices', "Ҳамаи нархҳо")}</option>
                 <option value="2000" className="bg-[#0c1222]">{t('careers_page.under_2k', "То 2,000 сомонӣ")}</option>
                 <option value="5000" className="bg-[#0c1222]">{t('careers_page.under_5k', "То 5,000 сомонӣ")}</option>
                 <option value="10000" className="bg-[#0c1222]">{t('careers_page.under_10k', "То 10,000 сомонӣ")}</option>
                 <option value="15000" className="bg-[#0c1222]">{t('careers_page.under_15k', "То 15,000 сомонӣ")}</option>
               </select>
            </div>
            {/* View Mode */}
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-[2rem] border border-white/5 mr-2">
              <button onClick={() => setViewMode("grid")}
                className={`px-5 py-3 rounded-[1.8rem] transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest ${viewMode === "grid" ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}>
                <Grid3X3 className="h-4 w-4" /> {t('careers_page.view_grid', "Грит")}
              </button>
              <button onClick={() => setViewMode("list")}
                className={`px-5 py-3 rounded-[1.8rem] transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest ${viewMode === "list" ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutList className="h-4 w-4" /> {t('careers_page.view_list', "Рӯйхат")}
              </button>
            </div>
          </div>

          {/* Clusters */}
          <div className="mt-8 flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
            <button onClick={() => setSelectedCluster("all")}
              className={`flex-shrink-0 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${selectedCluster === "all" ? "bg-primary text-white shadow-lg shadow-primary/20" : "glass-card border-white/5 text-muted-foreground hover:text-foreground"}`}>
              {t('careers_page.all_clusters', "Ҳамаи Кластерҳо")}
            </button>
            {clusters.map((cluster) => (
              <button key={cluster.id} onClick={() => setSelectedCluster(cluster.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${selectedCluster === cluster.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "glass-card border-white/5 text-muted-foreground hover:text-foreground"}`}>
                <IconMapper iconName={cluster.clusterIcon} className="w-4 h-4" />
                {cluster.clusterName}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CAREERS LISTING ═══ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 listing-section">
        {loading ? (
          <div className={viewMode === "grid" ? "bento-grid" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`glass-card p-10 h-[350px] ${viewMode === "grid" ? (i === 0 ? "col-span-12 md:col-span-8" : "col-span-12 md:col-span-4") : ""}`}>
                <div className="h-4 skeleton w-1/4 mb-8 opacity-20" />
                <div className="h-12 skeleton w-3/4 mb-4" />
                <div className="h-4 skeleton w-full mb-2" />
                <div className="h-4 skeleton w-2/3 mb-12" />
                <div className="flex justify-between items-center mt-auto">
                  <div className="h-10 w-10 skeleton rounded-full" />
                  <div className="h-10 w-32 skeleton rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : careers.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-32 glass-card p-20 flex flex-col items-center gap-8">
            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center">
              <Search className="w-10 h-10 text-primary/50" />
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-foreground">{t('careers_page.not_found_title', "Ихтисосе ёфт нашуд")}</h3>
              <p className="text-muted-foreground font-bold">{t('careers_page.not_found_desc', "Ҷустуҷӯ ё филтри худро иваз кунед.")}</p>
            </div>
            <button onClick={() => { setSearchQuery(""); setSelectedCluster("all"); setPriceFilter("all"); setCityFilter("all"); }} className="btn-primary px-10 py-4 group">
              {t('careers_page.clear_btn', "Пок кардан")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1" />
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentPage}-${selectedCluster}-${debouncedSearch}-${viewMode}`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className={viewMode === "grid" ? "bento-grid" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}
            >
              {careers.map((career, i) => (
                <motion.div
                  key={career.id}
                  variants={itemVariants}
                  className={viewMode === "grid" ? `col-span-12 ${i === 0 ? "md:col-span-8" : "md:col-span-4"}` : ""}
                >
                  {viewMode === "grid"
                    ? <SpecialtyCard specialty={career} />
                    : <SpecialtyCardList specialty={career} />}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ─── Pagination ─── */}
        {!loading && careers.length > 0 && (
          <>
            <Pagination
              currentPage={currentPage}
              lastPage={meta.lastPage}
              onPageChange={handlePageChange}
            />

            <div className="text-center mt-6 flex items-center justify-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">
                {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, meta.total)} / {meta.total} {t('careers_page.specialties_count', "ихтисос")}
              </span>
              <span className="text-muted-foreground opacity-20">·</span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-40">
                {t('careers_page.page_info', { defaultValue: "Саҳ. {{current}} аз {{last}}", current: currentPage, last: meta.lastPage })}
              </span>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Careers;
