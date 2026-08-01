import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import {
  ArrowRight,
  BookOpen,
  Building2,
  List,
  Map as MapIcon,
  MapPin,
  Search,
} from "lucide-react";
import TajikistanMap from "../../components/map/TajikistanMap";
import { API } from "../../lib/config";

const CITY_KEYWORDS = [
  "Душанбе",
  "Хуҷанд",
  "Бохтар",
  "Кӯлоб",
  "Хоруғ",
  "Ваҳдат",
  "Турсунзода",
  "Ҳисор",
  "Исфара",
  "Истаравшан",
  "Панҷакент",
  "Левакант",
  "Данғара",
  "Роғун",
  "Конибодом",
  "Бӯстон",
  "Норак",
  "Рашт",
  "Шаҳритус",
  "Ёвон",
];

const COORDINATE_CITY_FALLBACKS = {
  "38.53670,68.75080": "Душанбе",
  "38.56000,68.78000": "Душанбе",
  "38.56060,68.75110": "Душанбе",
  "38.58780,68.77330": "Душанбе",
  "40.28280,69.62220": "Хуҷанд",
  "37.91500,69.78200": "Кӯлоб",
  "37.84440,68.85780": "Бохтар",
  "37.49170,71.55390": "Хоруғ",
};

function inferCity(uni) {
  if (uni.city) return uni.city;

  const matchedKeyword = CITY_KEYWORDS.find((keyword) => uni.name?.includes(keyword));
  if (matchedKeyword) return matchedKeyword;

  if (uni.latitude == null || uni.longitude == null) return null;
  const key = `${Number(uni.latitude).toFixed(5)},${Number(uni.longitude).toFixed(5)}`;
  return COORDINATE_CITY_FALLBACKS[key] || "Ҷойгиршавӣ номаълум";
}

export default function Universities() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("map");

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchUniversities = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/universities`);
        setUniversities(data || []);
      } catch (error) {
        console.error("Failed to fetch universities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredUnis = useMemo(
    () =>
      universities.filter((uni) => {
        if (!normalizedQuery) return true;

        return [uni.name, uni.city, uni.shortName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      }),
    [normalizedQuery, universities]
  );

  const mappedCount = useMemo(
    () =>
      filteredUnis.filter(
        (uni) =>
          uni.latitude !== null &&
          uni.latitude !== undefined &&
          uni.longitude !== null &&
          uni.longitude !== undefined
      ).length,
    [filteredUnis]
  );

  const cityCount = useMemo(
    () => new Set(filteredUnis.map((uni) => inferCity(uni)).filter(Boolean)).size,
    [filteredUnis]
  );

  const totalSpecialties = useMemo(
    () => filteredUnis.reduce((acc, uni) => acc + (uni.careerCount || 0), 0),
    [filteredUnis]
  );

  return (
    <div className="min-h-screen bg-background pb-24 pt-24">
      <section className="relative overflow-hidden px-6 pb-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-80 max-w-6xl rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute left-1/2 top-16 -z-10 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[120px]" />

        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2.25rem] border border-white/10 bg-card/60 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div className="space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-primary">
                  <Building2 className="h-3.5 w-3.5" />
                  Universities Map
                </span>

                <div className="space-y-4">
                  <h1 className="max-w-3xl text-4xl font-black leading-tight text-foreground md:text-5xl">
                    Харитаи донишгоҳҳоро зебо, равшан ва осон барои истифода кардем
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                    Ҷустуҷӯ кунед, байни харита ва рӯйхат гузаред ва донишгоҳҳоро аз рӯи шаҳр,
                    ҷойгиршавӣ ва шумораи ихтисосҳо зуд муқоиса намоед.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Донишгоҳҳо
                  </p>
                  <p className="mt-2 text-3xl font-black text-foreground">{universities.length}</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Дар харита
                  </p>
                  <p className="mt-2 text-3xl font-black text-foreground">{mappedCount}</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    Ихтисосҳо
                  </p>
                  <p className="mt-2 text-3xl font-black text-foreground">{totalSpecialties}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-[2rem] border border-white/10 bg-card/50 p-4 shadow-xl backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-5">
          <div className="flex w-full flex-col gap-4 md:max-w-xl">
            <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-black/5 px-4 py-3 dark:bg-white/5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ҷустуҷӯи донишгоҳ ё шаҳр..."
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                {filteredUnis.length} натиҷа
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                {cityCount} шаҳр
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                {mappedCount} нуқтаи харита
              </span>
            </div>
          </div>

          <div className="inline-flex rounded-[1.2rem] border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setViewMode("map")}
              className={`inline-flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-black transition ${
                viewMode === "map"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="h-4 w-4" />
              Харита
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-black transition ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
              Рӯйхат
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-8 max-w-7xl px-6 lg:px-8">
        {loading ? (
          <div className="flex h-[620px] items-center justify-center rounded-[2rem] border border-white/10 bg-card/60 backdrop-blur-xl">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filteredUnis.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-card/50 px-6 py-20 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-5 text-2xl font-black text-foreground">Натиҷа пайдо нашуд</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Барои пайдо кардани донишгоҳ, номи дигар ё номи шаҳрро санҷед.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "map" ? (
              <motion.div
                key="map-view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <TajikistanMap universities={filteredUnis} />
              </motion.div>
            ) : (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                {filteredUnis.map((uni) => (
                  <article
                    key={uni.id}
                    onClick={() => navigate(`/universities/${uni.id}`)}
                    className="group flex cursor-pointer flex-col justify-between rounded-[1.75rem] border border-white/10 bg-card/70 p-6 shadow-xl transition duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-2xl"
                  >
                    <div>
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                          {uni.logo ? (
                            <img src={uni.logo} alt={uni.name} className="h-full w-full rounded-2xl object-contain p-2" />
                          ) : (
                            <Building2 className="h-5 w-5" />
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {uni.city || "Шаҳр номаълум"}
                        </span>
                      </div>

                      <h3 className="text-xl font-black leading-snug text-foreground">{uni.name}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {uni.description || "Барои ин донишгоҳ маълумоти кӯтоҳ дар ҳоли ҳозир дастрас нест."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        {uni.careerCount || 0} ихтисос
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-black text-primary transition group-hover:translate-x-1">
                        Муфассал
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}
