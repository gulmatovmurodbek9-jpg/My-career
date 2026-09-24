import {
  ArrowRight, ChevronLeft, ChevronRight,
  ChevronDown, Grid3X3, LayoutList, Search, SlidersHorizontal,
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router";
import axios from "axios";
import { API } from "../../lib/config";
import SpecialtyCard, { SpecialtyCardList } from "../../components/jobCard";
import LucideIconRenderer from "../../components/admin/LucideIconRenderer";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";
import { clusterLabel } from "../../lib/clusterLabel";
import { Sparkles, X } from "lucide-react";
import { usePageMeta } from "../../lib/usePageMeta";
import FilterSelect from "../../components/FilterSelect";
import { withLang, currentApiLang } from "../../lib/apiLang";

const LIMIT = 12;

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
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-11 h-11 rounded-2xl glass-card border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

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
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "glass-card border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className="w-11 h-11 rounded-2xl glass-card border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};


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

const Careers = () => {
  const { t, i18n } = useTranslation();
  const [careers, setCareers] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: LIMIT, lastPage: 1 });
  const [searchQuery, setSearchQuery] = useState(
    () => new URLSearchParams(window.location.search).get("search") ?? "",
  );
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
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [cityFilter, setCityFilter] = useState("all");
  const [cities, setCities] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Ёвари овозӣ бо ?ai= ё ?search= меояд — ҳатто вақте саҳифа аллакай кушода бошад.
  useEffect(() => {
    const askedAi = searchParams.get("ai");
    const askedPlain = searchParams.get("search");
    if (askedAi) {
      setSearchQuery(askedAi);
      setAiQuery((old) => (old === askedAi ? old : askedAi));
      setCurrentPage(1);
    } else if (askedPlain) {
      setSearchQuery(askedPlain);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const { refreshProfile } = useAuthStore();

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [aiQuery, setAiQuery] = useState(
    () => new URLSearchParams(window.location.search).get("ai") ?? "",
  );
  const [aiFilters, setAiFilters] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [aiQuestion, setAiQuestion] = useState(null);
  const [aiOptions, setAiOptions] = useState([]);
  const [aiChoice, setAiChoice] = useState(null);
  const [aiLang, setAiLang] = useState(null);

  const aiT = (key, options) => t(key, { ...(options || {}), lng: aiLang || undefined });
  const aiActive = Boolean(aiQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const toNumber = (text) => {
        const number = parseInt(String(text).replace(/\D/g, ""), 10);
        return Number.isFinite(number) && number > 0 ? number : null;
      };
      let min = toNumber(minPriceInput);
      let max = toNumber(maxPriceInput);
      if (min !== null && max !== null && min > max) [min, max] = [max, min];
      setPriceRange((prev) => (prev.min === min && prev.max === max ? prev : { min, max }));
    }, 450);
    return () => clearTimeout(timer);
  }, [minPriceInput, maxPriceInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCluster, priceRange.min, priceRange.max, cityFilter]);

  useEffect(() => {
    if (aiActive) return;

    const controller = new AbortController();
    setLoading(true);

    const params = {
      page: currentPage,
      limit: LIMIT,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(selectedCluster !== "all" && { clusterId: selectedCluster }),
      ...(priceRange.min !== null && { minPrice: priceRange.min }),
      ...(priceRange.max !== null && { maxPrice: priceRange.max }),
      ...(cityFilter !== "all" && { city: cityFilter }),
    };

    axios
      .get(`${API}/careers`, { params: withLang(params), signal: controller.signal })
      .then(({ data }) => {
        setCareers(data.data || []);
        setMeta(data.meta || { total: 0, page: 1, limit: LIMIT, lastPage: 1 });
        setLoading(false);
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        console.error("Fetch careers error:", error);
        setLoading(false);
      });

    return () => controller.abort();
  }, [currentPage, debouncedSearch, selectedCluster, priceRange.min, priceRange.max, cityFilter, i18n.language, aiActive]);

  useEffect(() => {
    if (!aiQuery) return;

    const controller = new AbortController();
    setLoading(true);

    if (aiChoice) {
      axios
        .get(`${API}/careers`, {
          params: withLang({
            page: currentPage,
            limit: LIMIT,
            ...(aiChoice.filters?.search && { search: aiChoice.filters.search }),
            ...(aiChoice.filters?.searchAny?.length && { searchAny: aiChoice.filters.searchAny }),
            ...(aiChoice.filters?.names?.length && { names: aiChoice.filters.names }),
            ...(aiChoice.filters?.clusterId && { clusterId: aiChoice.filters.clusterId }),
            ...(aiChoice.filters?.maxPrice && { maxPrice: aiChoice.filters.maxPrice }),
            ...(aiChoice.filters?.city && { city: aiChoice.filters.city }),
            ...(aiChoice.filters?.onlyFree && { freeSeatsOnly: "true" }),
          }),
          paramsSerializer: { indexes: null },
          signal: controller.signal,
        })
        .then(({ data }) => {
          setCareers(data.data || []);
          setMeta(data.meta || { total: 0, page: 1, limit: LIMIT, lastPage: 1 });
          setLoading(false);
        })
        .catch((error) => {
          if (axios.isCancel(error)) return;
          console.error("AI choice fetch error:", error);
          setLoading(false);
        });

      return () => controller.abort();
    }

    setAiLoading(true);
    setAiError(false);

    axios
      .post(
        `${API}/careers/ai-search`,
        { query: aiQuery, lang: currentApiLang() || "tj", page: currentPage, limit: LIMIT },
        { signal: controller.signal },
      )
      .then(({ data }) => {
        setCareers(data.data || []);
        setMeta(data.meta || { total: 0, page: 1, limit: LIMIT, lastPage: 1 });
        setAiFilters({ ...(data.filters || {}), understood: data.understood });
        setAiQuestion(data.question || null);
        setAiLang(data.answerLang || null);
        setAiOptions(Array.isArray(data.options) ? data.options : []);
        setAiLoading(false);
        setLoading(false);
      })
      .catch((error) => {
        if (axios.isCancel(error)) return;
        console.error("AI search error:", error);
        setAiError(true);
        setAiFilters(null);
        setAiQuestion(null);
        setAiOptions([]);
        setAiLoading(false);
        setLoading(false);
      });

    return () => controller.abort();
  }, [aiQuery, aiChoice, currentPage, i18n.language]);

  // Ҷустуҷӯи AI танҳо бо пахши тугма: ҳар даъват як дархост ба модел аст.
  const runAiSearch = () => {
    const text = searchQuery.trim();
    if (!text) return;
    setCurrentPage(1);
    setAiChoice(null);
    setAiQuestion(null);
    setAiOptions([]);
    setAiQuery(text);
  };

  const chooseAiOption = (option) => {
    setCurrentPage(1);
    setAiChoice(option);
  };

  const clearAiSearch = () => {
    setAiQuery("");
    setAiFilters(null);
    setAiError(false);
    setAiQuestion(null);
    setAiOptions([]);
    setAiChoice(null);
    setAiLang(null);
  };

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

  const clusterCounts = clusters
    .map((cluster) => ({
      id: cluster.id,
      number: cluster.clusterId,
      name: clusterLabel(t, cluster),
      icon: cluster.clusterIcon,
      count: cluster.careerCount ?? (Array.isArray(cluster.careers) ? cluster.careers.length : 0),
    }))
    .sort((a, b) => (a.number ?? 99) - (b.number ?? 99));
  const totalCount = clusterCounts.reduce((sum, c) => sum + c.count, 0);

  const hasFilters =
    selectedCluster !== "all" || searchQuery || minPriceInput || maxPriceInput || cityFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCluster("all");
    setMinPriceInput("");
    setMaxPriceInput("");
    setCityFilter("all");
  };

  const priceInputClass =
    "w-full rounded-[0.75rem] border border-border bg-background px-3 py-2.5 text-[15px] font-medium tabular-nums text-foreground placeholder:text-muted-foreground focus-ring";

  usePageMeta({
    title: t("misc2.meta_careers_title"),
    description: t("misc2.meta_careers_desc"),
    path: "/careers",
  });

  return (
    <div>
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

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12">
          <div className="min-w-0">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                placeholder={t("ai_search.placeholder")}
                aria-label={t("careers_page.search_placeholder", "Ҷустуҷӯи ихтисос...")}
                className="min-h-[3.5rem] w-full rounded-xl border-2 border-border bg-card pl-14 pr-28 sm:pr-44 text-[17px] text-foreground transition-colors placeholder:text-muted-foreground focus-ring"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (aiActive) clearAiSearch();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runAiSearch();
                  }
                }}
              />

              <button
                type="button"
                onClick={runAiSearch}
                disabled={!searchQuery.trim() || aiLoading}
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-40 focus-ring"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {aiLoading ? t("ai_search.searching") : t("ai_search.button")}
                </span>
              </button>
            </div>

            <p className="mt-2 text-[13px] text-muted-foreground">{t("ai_search.example")}</p>

            {aiActive && !aiError && !aiLoading && meta.total === 0 && (
              <p className="mt-3 text-[14px] font-semibold text-muted-foreground">
                {aiT("ai_search.empty")}
              </p>
            )}

            {aiError && (
              <p className="mt-3 text-[14px] font-semibold text-destructive">{aiT("ai_search.error")}</p>
            )}

            {aiFilters && !aiError && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-bold text-muted-foreground">
                  {aiFilters.understood ? aiT("ai_search.understood") : aiT("ai_search.not_understood")}
                </span>

                {(aiFilters.search || aiFilters.keywords?.length > 0 || aiFilters.names?.length > 0) && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary">
                    {aiT("ai_search.word", { word: aiFilters.names?.length ? aiFilters.names.join(", ") : aiFilters.keywords?.length ? aiFilters.keywords.join(", ") : aiFilters.search })}
                  </span>
                )}
                {aiFilters.clusterNumber && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary">
                    {clusterLabel(aiT, { clusterId: aiFilters.clusterNumber })}
                  </span>
                )}
                {aiFilters.maxPrice && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary">
                    {aiT("ai_search.price", { price: aiFilters.maxPrice.toLocaleString("ru-RU") })}
                  </span>
                )}
                {aiFilters.city && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary">
                    {aiT("ai_search.city", { city: aiFilters.city })}
                  </span>
                )}
                {aiFilters.onlyFree && (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary">
                    {aiT("ai_search.free")}
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearAiSearch}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-ring"
                >
                  <X className="h-3.5 w-3.5" />
                  {aiT("ai_search.clear")}
                </button>
              </div>
            )}

            {aiFilters?.note && !aiError && (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-[14px] leading-relaxed text-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {aiFilters.note}
              </p>
            )}

            {aiOptions.length > 0 && !aiChoice && !aiError && (
              <div className="mt-5 rounded-[1.5rem] border border-primary/20 bg-primary/5 p-3 sm:rounded-[1.75rem] sm:p-4">
                <p className="flex items-start gap-2 px-1 pt-1 text-[15px] font-bold text-foreground">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {aiQuestion || aiT("ai_search.pick_field")}
                </p>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {aiOptions.map((option, index) => {
                    const label = option.clusterNumber
                      ? clusterLabel(aiT, { clusterId: option.clusterNumber })
                      : option.label;
                    const hint = option.clusterNumber
                      ? aiT(`career_page.cl_${option.clusterNumber}_desc`)
                      : option.hint;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => chooseAiOption(option)}
                        className="flex h-full flex-col items-start gap-1.5 rounded-[0.75rem] border border-border bg-card p-4 text-left hover:border-primary/50 focus-ring"
                      >
                        <span className="flex w-full items-start justify-between gap-3">
                          <span className="text-[15px] font-bold leading-snug text-foreground">
                            {label}
                          </span>
                          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[12px] font-bold tabular-nums text-muted-foreground">
                            {option.count}
                          </span>
                        </span>
                        {hint && (
                          <span className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                            {hint}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {aiChoice && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary">
                  {aiChoice.clusterNumber
                    ? clusterLabel(aiT, { clusterId: aiChoice.clusterNumber })
                    : aiChoice.label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    setAiChoice(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-ring"
                >
                  <X className="h-3.5 w-3.5" />
                  {aiT("ai_search.other_options")}
                </button>
              </div>
            )}

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
              <ul className={viewMode === "grid" ? "mt-8 grid gap-5 sm:grid-cols-2" : "mt-8 grid gap-4"}>
                  {careers.map((career) => (
                    <li key={career.id}>
                      {viewMode === "grid" ? (
                        <SpecialtyCard specialty={career} />
                      ) : (
                        <SpecialtyCardList specialty={career} />
                      )}
                    </li>
                  ))}
              </ul>
            )}

            {!loading && careers.length > 0 && (
              <>
                <Pagination
                  currentPage={currentPage}
                  lastPage={meta.lastPage}
                  onPageChange={handlePageChange}
                />
                <p className="mt-4 text-center text-[15px] text-muted-foreground">
                  {t("careers_page.range", {
                    from: (currentPage - 1) * LIMIT + 1,
                    to: Math.min(currentPage * LIMIT, meta.total),
                    total: meta.total,
                  })}
                </p>
              </>
            )}
          </div>

          <aside className="order-first space-y-5 lg:order-none lg:sticky lg:top-24 lg:self-start">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className="flex min-h-[3.25rem] w-full items-center justify-between rounded-2xl border-2 border-border bg-card px-4 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted focus-ring lg:hidden"
            >
              <span className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-5 w-5 text-primary" strokeWidth={2} aria-hidden />
                {t("careers_page.filters", "Филтр ва тартиб")}
                {hasFilters && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                    {t("careers_page.active", "фаъол")}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            <div className={`space-y-5 ${filtersOpen ? "" : "hidden"} lg:block`}>
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
                    label={cluster.number ? `${cluster.number}. ${cluster.name}` : cluster.name}
                    count={cluster.count}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-5 rounded-2xl border-2 border-border bg-card p-5">
              {cities.length > 0 && (
                <div>
                  <span className="mb-2 block text-[15px] font-semibold text-foreground">
                    {t("careers_page.city_label", "Шаҳр")}
                  </span>
                  <FilterSelect
                    value={cityFilter}
                    onChange={setCityFilter}
                    searchable
                    ariaLabel={t("careers_page.city_label", "Шаҳр")}
                    searchPlaceholder={t("careers_page.city_search", "Ҷустуҷӯи шаҳр...")}
                    emptyText={t("careers_page.city_empty", "Шаҳр ёфт нашуд")}
                    options={[
                      { value: "all", label: t("careers_page.all_cities", "Ҳамаи шаҳрҳо") },
                      ...cities.map((entry) => ({ value: entry.city, label: entry.city, count: entry.count })),
                    ]}
                  />
                </div>
              )}

              <fieldset>
                <legend className="mb-2 block text-[15px] font-semibold text-foreground">
                  {t("careers_page.price_label", "Нархи таҳсил")}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[13px] font-medium text-muted-foreground">
                      {t("careers_page.price_min", "Аз")}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="0"
                      className={priceInputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[13px] font-medium text-muted-foreground">
                      {t("careers_page.price_max", "То")}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder={t("careers_page.price_no_limit", "бе ҳад")}
                      className={priceInputClass}
                    />
                  </label>
                </div>
                <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                  {t("careers_page.price_hint", "Сомонӣ дар як сол")}
                </p>
              </fieldset>

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
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Careers;
