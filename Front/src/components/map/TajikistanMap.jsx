import React, { useEffect, useMemo, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router";
import { useTheme } from "../../hooks/useTheme";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  SearchX,
  Users,
  X,
} from "lucide-react";

const DEFAULT_CITY = "Душанбе";
const DEFAULT_ZOOM = 11;
const CITY_OVERVIEW_ZOOM = 10;

// Every city and district that actually appears in the university data — all 42
// of them. The previous table held only 20, and inferCity() quietly sent every
// unlisted district to DEFAULT_CITY, so roughly a quarter of the country's
// institutions were drawn on top of Dushanbe.
//
// Coordinates come from OpenStreetMap/Nominatim, taken from the administrative
// boundary of the district (or the town, where the entry is a town). They are
// district-level, not campus-level: a marker says "this institution is in this
// district", which is as precise as the source data gets.
const CITY_CENTERS = {
  "Душанбе": { lat: 38.5598, lng: 68.787, zoom: 11 },
  "Хуҷанд": { lat: 40.2842, lng: 69.6191, zoom: 11 },
  "Бохтар": { lat: 37.8357, lng: 68.7821, zoom: 11 },
  "Кӯлоб": { lat: 37.9081, lng: 69.7739, zoom: 11 },
  "Хоруғ": { lat: 37.4909, lng: 71.5489, zoom: 11 },
  "Ваҳдат": { lat: 38.5614, lng: 69.0173, zoom: 11 },
  "Турсунзода": { lat: 38.5139, lng: 68.2317, zoom: 11 },
  "Ҳисор": { lat: 38.5297, lng: 68.5579, zoom: 11 },
  "Исфара": { lat: 40.1233, lng: 70.6134, zoom: 11 },
  "Истаравшан": { lat: 39.908, lng: 68.9956, zoom: 11 },
  "Панҷакент": { lat: 39.4962, lng: 67.6141, zoom: 11 },
  "Левакант": { lat: 37.8718, lng: 68.9256, zoom: 11 },
  "Данғара": { lat: 38.0954, lng: 69.3321, zoom: 11 },
  "Роғун": { lat: 38.6952, lng: 69.7572, zoom: 11 },
  "Конибодом": { lat: 40.2908, lng: 70.4255, zoom: 11 },
  "Бӯстон": { lat: 40.2355, lng: 69.6989, zoom: 11 },
  "Норак": { lat: 38.3897, lng: 69.3081, zoom: 11 },
  "Рашт": { lat: 39.2, lng: 70.3375, zoom: 10 },
  "Шаҳритус": { lat: 37.2665, lng: 68.1438, zoom: 11 },
  "Ёвон": { lat: 38.3177, lng: 69.047, zoom: 11 },
  "Гулистон": { lat: 40.267, lng: 69.7981, zoom: 11 },
  "Рӯдакӣ": { lat: 38.2559, lng: 68.5099, zoom: 10 },
  "Мастчоҳ": { lat: 40.4931, lng: 69.3664, zoom: 10 },
  "Зафаробод": { lat: 40.1527, lng: 68.7841, zoom: 10 },
  "Ҷаббор Расулов": { lat: 40.0843, lng: 69.4839, zoom: 10 },
  "Бобоҷон Ғафуров": { lat: 40.2216, lng: 69.7296, zoom: 10 },
  "Қубодиён": { lat: 37.4194, lng: 68.3111, zoom: 10 },
  "Нуробод": { lat: 38.828, lng: 70.0538, zoom: 10 },
  "Ҷайҳун": { lat: 37.3264, lng: 68.7268, zoom: 10 },
  "Панҷ": { lat: 37.3126, lng: 69.125, zoom: 10 },
  "Лахш": { lat: 39.2192, lng: 71.2001, zoom: 10 },
  "Вахш": { lat: 37.7716, lng: 68.9951, zoom: 10 },
  "Ховалинг": { lat: 38.3888, lng: 70.0931, zoom: 10 },
  "Ҷалолиддини Балхӣ": { lat: 37.5722, lng: 69.0113, zoom: 10 },
  "Муъминобод": { lat: 38.1729, lng: 70.0674, zoom: 10 },
  "Восеъ": { lat: 37.9424, lng: 69.5969, zoom: 10 },
  "Фархор": { lat: 37.4846, lng: 69.3303, zoom: 10 },
  "Дӯстӣ": { lat: 37.499, lng: 68.5011, zoom: 10 },
  "Тоҷикобод": { lat: 39.0722, lng: 70.9071, zoom: 10 },
  "Темурмалик": { lat: 38.1141, lng: 69.5242, zoom: 10 },
  "Сангвор": { lat: 38.7965, lng: 71.5314, zoom: 10 },
  "Мир Сайид Алии Ҳамадонӣ": { lat: 37.7183, lng: 69.5605, zoom: 10 },
};

// Longest first, so "Мир Сайид Алии Ҳамадонӣ" is tried before a short name that
// happens to be a substring of it.
const CITY_KEYWORDS = Object.keys(CITY_CENTERS).sort((a, b) => b.length - a.length);

function createClusterIcon({ count, isActive }) {
  return new L.DivIcon({
    className: "university-marker-wrapper",
    html: `
      <div class="university-cluster-marker ${isActive ? "is-active" : ""}">
        <span class="university-cluster-marker__ring"></span>
        <span class="university-cluster-marker__core">${count}</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function createDotIcon(isActive) {
  return new L.DivIcon({
    className: "university-marker-wrapper",
    html: `
      <div class="university-cluster-marker is-single ${isActive ? "is-active" : ""}">
        <span class="university-cluster-marker__ring"></span>
        <span class="university-cluster-marker__core">1</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

// Returns null rather than falling back to the capital. Silently relocating an
// institution to Dushanbe because its district was missing from the table is
// what put a quarter of the country on one pin.
function inferCity(uni) {
  if (uni.city && CITY_CENTERS[uni.city]) return uni.city;

  const haystack = `${uni.city || ""} ${uni.name || ""}`;
  return CITY_KEYWORDS.find((keyword) => haystack.includes(keyword)) || null;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function buildDisplayUniversities(universities) {
  const anchored = universities
    .filter((uni) => uni.id && uni.name)
    .map((uni) => {
      const inferredCity = inferCity(uni);
      if (!inferredCity) return null;

      // Prefer the institution's own coordinates; fall back to its district.
      const lat = Number(uni.latitude);
      const lng = Number(uni.longitude);
      const anchor =
        Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
          ? { lat, lng }
          : CITY_CENTERS[inferredCity];

      return { ...uni, inferredCity, anchorLat: anchor.lat, anchorLng: anchor.lng };
    })
    .filter(Boolean);

  // Institutions in the same city all carry that city's single coordinate, so
  // their markers land on the exact same pixel and only the top one is
  // clickable. Fan each stack out along a golden-angle spiral: deterministic,
  // evenly spaced, and tight enough that a marker stays inside its own city.
  const stacks = new Map();
  anchored.forEach((uni) => {
    const key = `${uni.anchorLat.toFixed(4)},${uni.anchorLng.toFixed(4)}`;
    if (!stacks.has(key)) stacks.set(key, []);
    stacks.get(key).push(uni);
  });

  const spread = [];
  stacks.forEach((group) => {
    if (group.length === 1) {
      const [uni] = group;
      spread.push({ ...uni, displayLat: uni.anchorLat, displayLng: uni.anchorLng });
      return;
    }

    group.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    group.forEach((uni, index) => {
      const radius = 0.013 * Math.sqrt(index + 1);
      const angle = index * GOLDEN_ANGLE;
      // A degree of longitude is shorter than a degree of latitude away from
      // the equator; divide by cos(lat) so the spiral stays round on screen.
      const lngScale = Math.cos((uni.anchorLat * Math.PI) / 180) || 1;
      spread.push({
        ...uni,
        displayLat: uni.anchorLat + Math.sin(angle) * radius,
        displayLng: uni.anchorLng + (Math.cos(angle) * radius) / lngScale,
      });
    });
  });

  return spread;
}

function CityOverviewMap({ activeCity, onViewportChange, preferredCity }) {
  const map = useMap();

  useEffect(() => {
    const city = CITY_CENTERS[preferredCity] || CITY_CENTERS[DEFAULT_CITY];
    map.setView([city.lat, city.lng], city.zoom, { animate: true });
  }, [map, preferredCity]);

  useEffect(() => {
    const update = () => {
      const center = map.getCenter();
      onViewportChange({
        zoom: map.getZoom(),
        center: { lat: center.lat, lng: center.lng },
      });
    };

    update();
    map.on("moveend zoomend", update);
    return () => {
      map.off("moveend zoomend", update);
    };
  }, [map, onViewportChange]);

  useEffect(() => {
    if (!activeCity || map.getZoom() <= CITY_OVERVIEW_ZOOM) return;
    const city = CITY_CENTERS[activeCity];
    if (!city) return;
    map.flyTo([city.lat, city.lng], city.zoom, { duration: 0.7 });
  }, [activeCity, map]);

  return null;
}

export default function TajikistanMap({ universities = [] }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [geoData, setGeoData] = useState(null);
  const [activeCity, setActiveCity] = useState(DEFAULT_CITY);
  const [selectedUni, setSelectedUni] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [viewport, setViewport] = useState({
    zoom: DEFAULT_ZOOM,
    center: CITY_CENTERS[DEFAULT_CITY],
  });

  useEffect(() => {
    fetch("/data/TJK.geo.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  const displayUniversities = useMemo(
    () => buildDisplayUniversities(universities),
    [universities]
  );

  const cityGroups = useMemo(() => {
    const grouped = new Map();

    displayUniversities.forEach((uni) => {
      if (!grouped.has(uni.inferredCity)) {
        grouped.set(uni.inferredCity, []);
      }
      grouped.get(uni.inferredCity).push(uni);
    });

    return Array.from(grouped.entries()).map(([city, items]) => ({
      city,
      count: items.length,
      totalCareers: items.reduce((acc, item) => acc + (item.careerCount || 0), 0),
      lat: CITY_CENTERS[city]?.lat || CITY_CENTERS[DEFAULT_CITY].lat,
      lng: CITY_CENTERS[city]?.lng || CITY_CENTERS[DEFAULT_CITY].lng,
      items,
    }));
  }, [displayUniversities]);

  const visibleUniversities = useMemo(() => {
    if (viewport.zoom <= CITY_OVERVIEW_ZOOM) return [];
    return displayUniversities
      .filter((uni) => uni.inferredCity === activeCity)
      .sort((a, b) => (b.careerCount || 0) - (a.careerCount || 0));
  }, [activeCity, displayUniversities, viewport.zoom]);

  useEffect(() => {
    if (selectedUni && selectedUni.inferredCity !== activeCity) {
      setSelectedUni(null);
    }
  }, [activeCity, selectedUni]);

  useEffect(() => {
    if (viewport.zoom > CITY_OVERVIEW_ZOOM) {
      setPanelOpen(Boolean(selectedUni));
    }
  }, [selectedUni, viewport.zoom]);

  const currentCityGroup = cityGroups.find((group) => group.city === activeCity) || null;

  const geojsonStyle = {
    fillColor: "hsl(var(--primary))",
    weight: 1.2,
    opacity: 0.7,
    color: isDark ? "rgba(255,255,255,0.18)" : "rgba(30,41,59,0.25)",
    dashArray: "4",
    fillOpacity: 0.07,
  };

  return (
    <div
      className={`university-map-shell relative overflow-hidden rounded-[2rem] border bg-card/70 ${
        isDark ? "is-dark" : "is-light"
      }`}
    >
      {/* Scrim behind the floating controls — dark over dark tiles, light over
          light ones, otherwise the city name on top of it is unreadable. */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-[500] h-40 bg-gradient-to-b ${
          isDark
            ? "from-black/60 via-black/20 to-transparent"
            : "from-white/80 via-white/30 to-transparent"
        }`}
      />

      <div className="h-[620px] w-full md:h-[700px]">
        <MapContainer
          center={[CITY_CENTERS[DEFAULT_CITY].lat, CITY_CENTERS[DEFAULT_CITY].lng]}
          zoom={DEFAULT_ZOOM}
          zoomControl={true}
          scrollWheelZoom={true}
          className="university-map h-full w-full"
        >
          {/*
            Плиткаҳо аз Esri, на аз CARTO.

            CARTO барои basemap-ҳои худ калиди API талаб кардан гирифт ва ба
            ҷои хато плиткаро бо навиштаи "API KEY REQUIRED" бармегардонад.
            Ҳолати HTTP 200 мемонад, аз ин рӯ ин дар код ҳамчун хато дида
            намешавад — танҳо дар экран.

            Esri ҳам варианти торик, ҳам равшан дорад, бидуни калид. Диққат:
            тартиби порчаҳо {z}/{y}/{x} аст, на {z}/{x}/{y}.
          */}
          <TileLayer
            key={isDark ? "dark" : "light"}
            url={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${
              isDark ? "Dark" : "Light"
            }_Gray_Base/MapServer/tile/{z}/{y}/{x}`}
            attribution='Плиткаҳо &copy; <a href="https://www.esri.com/">Esri</a>'
            maxZoom={16}
          />

          <CityOverviewMap
            activeCity={activeCity}
            onViewportChange={setViewport}
            preferredCity={DEFAULT_CITY}
          />

          {geoData && <GeoJSON data={geoData} style={geojsonStyle} />}

          {viewport.zoom <= CITY_OVERVIEW_ZOOM &&
            cityGroups.map((group) => (
              <Marker
                key={group.city}
                position={[group.lat, group.lng]}
                icon={createClusterIcon({ count: group.count, isActive: group.city === activeCity })}
                eventHandlers={{
                  click: () => {
                    setActiveCity(group.city);
                    setSelectedUni(null);
                    setPanelOpen(true);
                  },
                }}
              >
                <Popup className="university-popup" offset={[0, -12]}>
                  <div className="space-y-2">
                    <p className="text-sm font-bold leading-tight text-foreground">{group.city}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {group.count} донишгоҳ
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {viewport.zoom > CITY_OVERVIEW_ZOOM &&
            visibleUniversities.map((uni) => (
              <Marker
                key={uni.id}
                position={[uni.displayLat, uni.displayLng]}
                icon={createDotIcon(selectedUni?.id === uni.id)}
                eventHandlers={{
                  click: () => {
                    setSelectedUni(uni);
                    setPanelOpen(true);
                  },
                }}
              >
                <Popup className="university-popup" offset={[0, -10]}>
                  <div className="space-y-2">
                    <p className="text-sm font-bold leading-tight text-foreground">{uni.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {uni.inferredCity}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {!cityGroups.length && (
        <div className="absolute inset-0 z-[650] flex items-center justify-center bg-black/45 p-6 backdrop-blur-sm">
          <div className="max-w-md rounded-[2rem] border border-white/10 bg-black/60 p-8 text-center text-white shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <SearchX className="h-8 w-8 text-white/65" />
            </div>
            <h3 className="text-2xl font-black">Маълумот барои харита ёфт нашуд</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Барои ин саҳифа ҳоло ягон донишгоҳ бо маълумоти намоишӣ дастрас нест.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setActiveCity(DEFAULT_CITY);
          setSelectedUni(null);
          setPanelOpen(true);
        }}
        className="absolute bottom-5 left-5 z-[700] inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/65 px-4 py-3 text-sm font-bold text-white shadow-xl backdrop-blur-xl transition hover:bg-black/80"
      >
        <LocateFixed className="h-4 w-4" />
        Ба Душанбе
      </button>

      <AnimatePresence>
        {viewport.zoom > CITY_OVERVIEW_ZOOM && currentCityGroup && panelOpen && selectedUni && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-4 bottom-4 z-[700] md:left-auto md:right-6 md:top-6 md:bottom-6 md:w-[430px]"
          >
            <div className="flex max-h-[78vh] flex-col rounded-[2rem] border border-white/10 bg-black/72 p-5 text-white shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black leading-tight">{selectedUni.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-white/65">
                    <MapPin className="h-4 w-4" />
                    {selectedUni.inferredCity}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedUni(null);
                    setPanelOpen(false);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Пӯшидан"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Шаҳр</p>
                  <p className="mt-1 text-lg font-black">{selectedUni.inferredCity}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Ихтисосҳо</p>
                  <p className="mt-1 text-lg font-black">{selectedUni.careerCount || 0}</p>
                </div>
              </div>

              <div className="flex-1 rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {selectedUni.logo ? (
                      <img src={selectedUni.logo} alt={selectedUni.name} className="h-full w-full object-contain p-1.5" />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-black leading-6 text-white">{selectedUni.name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                        Шаҳр: {selectedUni.inferredCity}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                        {selectedUni.careerCount || 0} ихтисос
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-white/70">
                  {selectedUni.description || "Маълумоти кӯтоҳ дастрас нест."}
                </p>

                <button
                  onClick={() => navigate(`/universities/${selectedUni.id}`)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-primary/40"
                >
                  Муфассал дидан
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
