import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, ChevronLeft, ChevronRight,
  Grid3X3, LayoutList, Search, SlidersHorizontal,
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router";
import axios from "axios";
import { API } from "../../lib/config";
import SpecialtyCard, { SpecialtyCardList } from "../../components/jobCard";
import LucideIconRenderer from "../../components/admin/LucideIconRenderer";
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


/** Як сатри филтр дар панели канорӣ: ном дар чап, шумора дар рост. */
const FilterRow = ({ active, onClick, icon, label, count }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-200 focus-ring ${
      active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
    }`}
  >
    <span className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-[15px] font-semibold leading-snug">{label}</span>
    </span>
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
        active ? "bg-white/20" : "bg-muted text-muted-foreground"
      }`}
    >
      {count}
    </span>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Careers = () => {
  const { t } = useTranslation();
  const [careers, setCareers] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: LIMIT, lastPage: 1 });
  /*
   * Ҷустуҷӯ аз URL сар мешавад, то истиноди «ихтисоси вобаста» аз саҳифаи
   * ихтисос кор кунад: /careers?search=<ном> рӯйхатро аллакай филтршуда
   * мекушояд. Бе ин истинод мекушод, вале ҳамаи 884 ихтисосро нишон медод.
   */
  const [searchQuery, setSearchQuery] = useState(
    () => new URLSearchParams(window.location.search).get("search") ?? "",
  );
  /**
   * Кластери интихобшуда дар URL нигоҳ дошта мешавад, на дар useState.
   *
   * Қаблан ин ҳолати дохилӣ буд ва ҳамеша аз "all" оғоз мешуд, аз ин рӯ
   * истиноди /careers?clusterId=… аз сафҳаи асосӣ бесадо нодида гирифта мешуд
   * ва ҳамаи ихтисосҳо нишон дода мешуданд.
   *
   * Ҳоло URL сарчашмаи ягона аст: истинод кор мекунад, тугмаи "ба ақиб" кор
   * мекунад, ва корбар метавонад суроғаро бо филтри интихобшуда фиристад.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCluster = searchParams.get("clusterId") ?? "all";

  const setSelectedCluster = useCallback(
    (id) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (id === "all") next.delete("clusterId");
          else next.set("clusterId", id);
          return next;
        },
        // Филтр иваз кардан набояд таърихи браузерро пур кунад: "ба ақиб"
        // бояд корбарро ба саҳифаи қаблӣ барад, на ба филтри қаблӣ.
        { replace: true }
      );
    },
    [setSearchParams]
  );
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
  /**
   * Ихтисосҳо. Ҳар тағйири филтр дархости қаблиро бекор мекунад.
   *
   * Бе бекоркунӣ ду дархост ҳамзамон дар парвоз буданд ва ғолиб он мешуд, ки
   * ДЕРТАР мерасид, на он ки охирин фиристода шуд. Аз ин рӯ ҳангоми зуд гузаштан
   * аз кластер ба кластер рӯйхат баъзан ба ҳолати қаблӣ бармегашт: URL кластери
   * навро нишон медод, вале мазмун кӯҳна буд.
   *
   * Дар React StrictMode ҳар эффект ду бор иҷро мешавад, аз ин рӯ ин мусобиқа
   * дар development қариб ҳамеша рух медод.
   */
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = {
      page: currentPage,
      limit: LIMIT,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(selectedCluster !== "all" && { clusterId: selectedCluster }),
      ...(priceFilter !== "all" && { maxPrice: parseInt(priceFilter) }),
      ...(cityFilter !== "all" && { city: cityFilter }),
    };

    axios
      .get(`${API}/careers`, { params, signal: controller.signal })
      .then(({ data }) => {
        setCareers(data.data || []);
        setMeta(data.meta || { total: 0, page: 1, limit: LIMIT, lastPage: 1 });
        setLoading(false);
      })
      .catch((error) => {
        // Бекоркунӣ хато нест: дархости навтар аллакай дар роҳ аст, ва
        // setLoading(false) кардан ҷои холии кӯтоҳ месохт.
        if (axios.isCancel(error)) return;
        console.error("Fetch careers error:", error);
        setLoading(false);
      });

    return () => controller.abort();
  }, [currentPage, debouncedSearch, selectedCluster, priceFilter, cityFilter]);

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

  // Шумораи ихтисоси ҳар кластер аллакай дар худи ҷавоби API ҳаст
  // (relations: ['careers']), барои ҳамин дархости иловагӣ лозим нест.
  const clusterCounts = clusters.map((cluster) => ({
    id: cluster.id,
    name: cluster.clusterName,
    icon: cluster.clusterIcon,
    count: Array.isArray(cluster.careers) ? cluster.careers.length : 0,
  }));
  const totalCount = clusterCounts.reduce((sum, c) => sum + c.count, 0);

  const hasFilters =
    selectedCluster !== "all" || searchQuery || priceFilter !== "all" || cityFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCluster("all");
    setPriceFilter("all");
    setCityFilter("all");
  };

  const selectClass =
    "w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-[15px] font-medium text-foreground transition-colors focus-ring";

  return (
    <div className="pb-24">
      {/* ═══ САРЛАВҲА ═══ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
          <h1
            className="max-w-[18ch] leading-[1.05] text-foreground"
            style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}
          >
            {t("careers_page.hero_title_plain", "Ихтисосҳои Тоҷикистон")}
          </h1>
          <p className="mt-5 max-w-[54ch] text-xl leading-relaxed text-muted-foreground">
            {t("careers_page.hero_desc", {
              defaultValue:
                "Дар байни {{total}}+ ихтисос роҳи касбии худро ёбед. Ҳар як ихтисос бо маош, талабот ва фанҳои лозимӣ.",
              total: totalCount || meta.total,
            })}
          </p>
        </div>
      </section>

      {/* ═══ МАЗМУН ВА ФИЛТРҲО ═══ */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12">
          {/* ─── Чап: ҷустуҷӯ ва натиҷаҳо ─── */}
          <div className="min-w-0">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                placeholder={t("careers_page.search_placeholder", "Ҷустуҷӯи ихтисос...")}
                aria-label={t("careers_page.search_placeholder", "Ҷустуҷӯи ихтисос...")}
                className="min-h-[3.5rem] w-full rounded-xl border-2 border-border bg-card pl-14 pr-5 text-[17px] text-foreground transition-colors placeholder:text-muted-foreground focus-ring"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="text-[15px] text-muted-foreground">
                {loading
                  ? t("common.loading", "Боргузорӣ...")
                  : t("careers_page.found", {
                      defaultValue: "{{count}} ихтисос ёфт шуд",
                      count: meta.total,
                    })}
              </p>

              <div className="flex shrink-0 gap-1 rounded-xl border-2 border-border p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  aria-label={t("careers_page.view_grid", "Тӯр")}
                  className={`rounded-lg p-2.5 transition-colors focus-ring ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Grid3X3 className="h-5 w-5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  aria-label={t("careers_page.view_list", "Рӯйхат")}
                  className={`rounded-lg p-2.5 transition-colors focus-ring ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <LayoutList className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton h-64 rounded-2xl" />
                ))}
              </div>
            ) : careers.length === 0 ? (
              <div className="mt-8 rounded-2xl border-2 border-border p-12 text-center">
                <h3 className="text-2xl font-semibold text-foreground">
                  {t("careers_page.not_found_title", "Ихтисосе ёфт нашуд")}
                </h3>
                <p className="mx-auto mt-3 max-w-[42ch] text-lg text-muted-foreground">
                  {t("careers_page.not_found_desc", "Ҷустуҷӯ ё филтри худро иваз кунед.")}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-8 inline-flex min-h-[3.5rem] items-center gap-3 rounded-xl bg-foreground px-8 text-lg font-semibold text-background transition-colors hover:bg-foreground/88 focus-ring active:translate-y-px"
                >
                  {t("careers_page.clear_btn", "Пок кардан")}
                  <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
                </button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.ul
                  key={`${currentPage}-${selectedCluster}-${debouncedSearch}-${viewMode}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0 }}
                  className={viewMode === "grid" ? "mt-8 grid gap-5 sm:grid-cols-2" : "mt-8 grid gap-4"}
                >
                  {careers.map((career) => (
                    <motion.li key={career.id} variants={itemVariants}>
                      {viewMode === "grid" ? (
                        <SpecialtyCard specialty={career} />
                      ) : (
                        <SpecialtyCardList specialty={career} />
                      )}
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            )}

            {!loading && careers.length > 0 && (
              <>
                <Pagination
                  currentPage={currentPage}
                  lastPage={meta.lastPage}
                  onPageChange={handlePageChange}
                />
                <p className="mt-6 text-center text-[15px] text-muted-foreground">
                  {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, meta.total)} аз{" "}
                  {meta.total}
                </p>
              </>
            )}
          </div>

          {/* ─── Рост: филтрҳо ───
              lg:sticky — панел ҳангоми скролли рӯйхати дароз дар назар мемонад. */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border-2 border-border bg-card p-4">
              <h2 className="mb-3 flex items-center gap-2.5 px-2 pt-1 text-lg font-semibold text-foreground">
                <SlidersHorizontal className="h-5 w-5 text-primary" strokeWidth={2} aria-hidden />
                {t("careers_page.categories", "Категорияҳо")}
              </h2>

              <div className="space-y-1">
                <FilterRow
                  active={selectedCluster === "all"}
                  onClick={() => setSelectedCluster("all")}
                  label={t("careers_page.all_clusters", "Ҳама")}
                  count={totalCount}
                />
                {clusterCounts.map((cluster) => (
                  <FilterRow
                    key={cluster.id}
                    active={selectedCluster === cluster.id}
                    onClick={() => setSelectedCluster(cluster.id)}
                    icon={<LucideIconRenderer name={cluster.icon} className="h-4 w-4 shrink-0" />}
                    label={cluster.name}
                    count={cluster.count}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border-2 border-border bg-card p-5">
              {cities.length > 0 && (
                <label className="block">
                  <span className="mb-2 block text-[15px] font-semibold text-foreground">
                    {t("careers_page.city_label", "Шаҳр")}
                  </span>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className={selectClass}
                  >
                    <option value="all">{t("careers_page.all_cities", "Ҳамаи шаҳрҳо")}</option>
                    {cities.map((entry) => (
                      <option key={entry.city} value={entry.city}>
                        {entry.city} ({entry.count})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-[15px] font-semibold text-foreground">
                  {t("careers_page.price_label", "Нархи таҳсил")}
                </span>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{t("careers_page.all_prices", "Ҳамаи нархҳо")}</option>
                  <option value="2000">{t("careers_page.under_2k", "То 2,000 сомонӣ")}</option>
                  <option value="5000">{t("careers_page.under_5k", "То 5,000 сомонӣ")}</option>
                  <option value="10000">{t("careers_page.under_10k", "То 10,000 сомонӣ")}</option>
                  <option value="15000">{t("careers_page.under_15k", "То 15,000 сомонӣ")}</option>
                </select>
              </label>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-[3rem] w-full rounded-xl border-2 border-border text-[15px] font-semibold text-foreground transition-colors hover:bg-muted focus-ring"
                >
                  {t("careers_page.clear_btn", "Пок кардан")}
                </button>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Careers;
