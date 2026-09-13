import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
// MapLibre ~200 КБ аст — танҳо ҳангоми гузариш ба 3D бор мешавад.
const University3DMap = lazy(() => import("./University3DMap"));
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

/*
 * Иконка аз рӯи навъи муассиса.
 *
 * Ҳамаи нишонаҳо рақами «1»-ро мебароварданд — маълумоти сифр ва дар харита
 * як девори якхела. Дар база панҷ навъ ҳаст (77 коллеҷ, 20 донишгоҳ, 17
 * донишкада, 13 филиал, 1 академия), ва довталаб маҳз ҳаминро фарқ кардан
 * мехоҳад: коллеҷ пас аз синфи 9, донишгоҳ пас аз 11.
 *
 * SVG дарунсохт аст, на ҷузъи React: Leaflet DivIcon танҳо сатри HTML
 * мегирад ва компонент дар он рендер намешавад.
*/
/** Тартиб аз рӯи шумораи муассиса дар база: 77 коллеҷ, 20 донишгоҳ, 17
    донишкада, 13 филиал, 1 академия. */
const LEGEND_KINDS = ["university", "college", "institute", "branch", "academy"];

const INSTITUTION_ICONS = {
  // Донишгоҳ — кулоҳи хатм
  university: '<path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3z"/><path d="M5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z"/>',
  // Академия — ситора
  academy: '<path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z"/>',
  // Донишкада — бино бо сутунҳо
  institute: '<path d="M12 2 2 7v2h20V7L12 2zM4 11v7H2v2h20v-2h-2v-7h-2v7h-3v-7h-2v7h-3v-7H6v7H4v-7z"/>',
  // Коллеҷ — китоби кушода
  college: '<path d="M12 6.2C10.3 5 8 4.3 5.5 4.3c-1.2 0-2.4.2-3.5.5v14c1.1-.3 2.3-.5 3.5-.5 2.5 0 4.8.7 6.5 1.9 1.7-1.2 4-1.9 6.5-1.9 1.2 0 2.4.2 3.5.5v-14c-1.1-.3-2.3-.5-3.5-.5-2.5 0-4.8.7-6.5 1.9z"/>',
  // Филиал — бино
  branch: '<path d="M4 3h10v18H4V3zm2 2v2h2V5H6zm4 0v2h2V5h-2zM6 9v2h2V9H6zm4 0v2h2V9h-2zm-4 4v2h2v-2H6zm4 0v2h2v-2h-2zM16 8h4v13h-4V8zm1.5 2v2h1v-2h-1zm0 4v2h1v-2h-1z"/>',
};

/** Навъро аз сатри тоҷикӣ ё тарҷумашуда мешиносад. */
function institutionKind(uni) {
  const type = (uni?.institutionType || "").toLowerCase();
  if (type.includes("академ") || type.includes("academ")) return "academy";
  if (type.includes("донишкада") || type.includes("институт") || type.includes("institut")) return "institute";
  if (type.includes("филиал") || type.includes("branch")) return "branch";
  if (type.includes("коллеҷ") || type.includes("колледж") || type.includes("college")) return "college";
  return "university";
}

function createDotIcon(isActive, uni) {
  const kind = institutionKind(uni);
  return new L.DivIcon({
    className: "university-marker-wrapper",
    html: `
      <div class="university-cluster-marker is-single is-${kind} ${isActive ? "is-active" : ""}">
        <span class="university-cluster-marker__ring"></span>
        <span class="university-cluster-marker__core">
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">${INSTITUTION_ICONS[kind]}</svg>
        </span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
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

  /*
   * Муассисаҳое, ки суроғаи ВОҚЕӢ доранд, ҳеҷ гоҳ ҷобаҷо карда намешаванд.
   *
   * Барои 14 донишгоҳи асосӣ координатаи ҳақиқӣ аз OpenStreetMap гирифта
   * шудааст. Онҳоро ба спирал андохтан маънои аз ҷои дурусташ ба ҷои бофта
   * кӯчонидан аст — маҳз баръакси он чи лозим аст.
   */
  const exact = anchored.filter((uni) => uni.hasExactLocation);
  const approximate = anchored.filter((uni) => !uni.hasExactLocation);

  // Боқимонда ҳамагӣ координатаи маркази шаҳрро доранд, аз ин рӯ нишонаҳояшон
  // ба як пиксел меафтанд ва танҳо болоияш пахш мешавад. Ҳар даста бо спирали
  // тиллоӣ пароканда мешавад: муайян, баробар ва дар дохили ҳамон шаҳр.
  const stacks = new Map();
  approximate.forEach((uni) => {
    const key = `${uni.anchorLat.toFixed(4)},${uni.anchorLng.toFixed(4)}`;
    if (!stacks.has(key)) stacks.set(key, []);
    stacks.get(key).push(uni);
  });

  const spread = exact.map((uni) => ({
    ...uni,
    displayLat: uni.anchorLat,
    displayLng: uni.anchorLng,
  }));

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
      const bounds = map.getBounds();
      onViewportChange({
        zoom: map.getZoom(),
        center: { lat: center.lat, lng: center.lng },
        bounds: {
          south: bounds.getSouth(),
          west: bounds.getWest(),
          north: bounds.getNorth(),
          east: bounds.getEast(),
        },
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

/**
 * Ҳангоми ҷустуҷӯ харитаро ба натиҷаҳо мебарад.
 *
 * Пештар ҷустуҷӯ танҳо рӯйхати нишонаҳоро кам мекард, вале камера дар ҷои
 * худ мемонд: корбар «милли» менавишт, се натиҷа мегирифт ва харитаро худаш
 * бояд ба Душанбе меовард ва zoom мекард. Дар телефон ин қариб ғайриимкон
 * буд.
 */
function FitToResults({ points, enabled }) {
  const map = useMap();

  /* Калиди матнӣ: массив ҳар рендер нав аст, ва бе ин эффект бемаврид
     такрор мешуд ва камераро ҳангоми ҳаракати корбар бармегардонд. */
  const key = enabled ? points.map((p) => p.id).join(",") : "";

  useEffect(() => {
    if (!enabled || points.length === 0) return;

    /* Ҷустуҷӯ филтри фаврӣ аст — бе таъхир харита ҳангоми навиштани
       «милли» панҷ бор парвоз мекард. Пас аз истодани дастҳо як парвоз. */
    const timer = setTimeout(() => {
      if (points.length === 1) {
        const only = points[0];
        map.flyTo([only.displayLat, only.displayLng], 16, { duration: 0.8 });
        return;
      }

      const bounds = points.map((p) => [p.displayLat, p.displayLng]);
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 0.8 });
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map, enabled]);

  return null;
}

export default function TajikistanMap({ universities = [], focusResults = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [geoData, setGeoData] = useState(null);
  const [activeCity, setActiveCity] = useState(DEFAULT_CITY);
  const [selectedUni, setSelectedUni] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);

  /* Реҷаи харита: нақшаи хокистарӣ, тасвири моҳвораӣ ё 3D.
     Моҳвора пешфарз аст — 68 донишгоҳ координатаи воқеӣ дорад ва рӯи
     тасвир бинои аслии онҳо дида мешавад. */
  const [mapMode, setMapMode] = useState("satellite");
  const satellite = mapMode === "satellite";
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

    /*
     * Аз рӯи он чизе ки дар экран аст, на аз рӯи номи шаҳри интихобшуда.
     *
     * Пештар филтр `inferredCity === activeCity` буд, ва вақте корбар
     * харитаро бо даст ба ҷои дигар мебурд, activeCity ҳамон шаҳри пештара
     * мемонд — харитаи холӣ бе ягон маркер, бе он ки сабабаш маълум бошад.
     */
    const box = viewport.bounds;
    return displayUniversities
      .filter((uni) =>
        !box
          ? uni.inferredCity === activeCity
          : uni.displayLat >= box.south &&
            uni.displayLat <= box.north &&
            uni.displayLng >= box.west &&
            uni.displayLng <= box.east,
      )
      .sort((a, b) => (b.careerCount || 0) - (a.careerCount || 0));
  }, [activeCity, displayUniversities, viewport.bounds, viewport.zoom]);

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

      {/* Гузариши намуди харита. z-[500] лозим аст: қабатҳои Leaflet то
          z-index 400 мебароянд ва тугмаро мепӯшонанд. */}
      <div className="absolute right-4 top-4 z-[500] flex gap-1 rounded-xl border border-border bg-card/90 p-1 shadow-lg backdrop-blur">
        {[
          { id: "canvas", label: t("career_page.m_plan") },
          { id: "satellite", label: t("career_page.m_satellite") },
          { id: "3d", label: "3D" },
        ].map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setMapMode(mode.id)}
            aria-pressed={mapMode === mode.id}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${mapMode === mode.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/*
        Реҷаи 3D ҷудогона аст: Leaflet ҳаҷм намекашад, аз ин рӯ он ҷо
        MapLibre GL кор мекунад. Агар он бор нашавад, ду реҷаи дигар
        бетағйир мемонанд.
      */}
      {mapMode === "3d" ? (
        <div className="h-[620px] w-full md:h-[700px]">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
              </div>
            }
          >
            <University3DMap
              universities={displayUniversities}
              center={CITY_CENTERS[activeCity] || CITY_CENTERS[DEFAULT_CITY]}
              onSelect={setSelectedUni}
            />
          </Suspense>
        </div>
      ) : (
      <div className="h-[620px] w-full md:h-[700px]">
        <MapContainer
          center={[CITY_CENTERS[DEFAULT_CITY].lat, CITY_CENTERS[DEFAULT_CITY].lng]}
          zoom={DEFAULT_ZOOM}
          maxZoom={20}
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
          {/*
            Ду навъи плитка: нақшаи хокистарӣ ва тасвири МОҲВОРАӢ.

            Нақшаи хокистарӣ мавқеъро абстрактӣ нишон медиҳад — барои ҳамин
            харита «ғайривоқеӣ» менамуд. Тасвири моҳвораии Esri Тоҷикистонро
            пурра мепӯшонад ва бе калид кор мекунад: биноҳои воқеии
            донишгоҳ, роҳҳо ва ҳудуди кампус дида мешаванд.

            Диққат: тартиби порчаҳо {z}/{y}/{x} аст, на {z}/{x}/{y}.
          */}
          {satellite ? (
            <TileLayer
              key="satellite"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Тасвир &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics'
              /*
               * Барои Душанбе тасвири воқеӣ то z=19 мерасад — дар он сатҳ
               * бино ва ҳавлӣ дида мешавад; z=20 аллакай холӣ бармегардад.
               * `maxNativeZoom` ҳамон 19-ро калон карда нишон медиҳад, то
               * харита дар z=20 сафед нашавад.
               */
              maxNativeZoom={19}
              maxZoom={20}
            />
          ) : (
            <TileLayer
              key={isDark ? "dark" : "light"}
              url={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${
                isDark ? "Dark" : "Light"
              }_Gray_Base/MapServer/tile/{z}/{y}/{x}`}
              attribution='Плиткаҳо &copy; <a href="https://www.esri.com/">Esri</a>'
              maxZoom={16}
            />
          )}

          {/* Дар тасвири моҳвораӣ номи кӯчаву шаҳр нест — қабати шаффофи
              номҳо болои он гузошта мешавад, вагарна мавқеъро фаҳмидан
              душвор аст. */}
          {satellite && (
            <TileLayer
              key="labels"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={16}
              maxZoom={20}
            />
          )}

          <CityOverviewMap
            activeCity={activeCity}
            onViewportChange={setViewport}
            preferredCity={DEFAULT_CITY}
          />

          <FitToResults points={displayUniversities} enabled={focusResults} />

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
                      {t("career_page.m_count", { count: group.count })}
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
                icon={createDotIcon(selectedUni?.id === uni.id, uni)}
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
      )}

      {/* Шарҳи нишонаҳо.

          Иконкаҳо панҷ навъи муассисаро фарқ мекунанд, вале бе шарҳ корбар
          намедонад, ки норинҷӣ коллеҷ аст ва кабуд донишгоҳ. Дар телефон он
          ҷамъ мешавад — дар экрани хурд ҷои харита муҳимтар аст. */}
      {cityGroups.length > 0 && (
        <details
          open
          className="absolute bottom-4 left-4 z-[600] max-w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-black/70 text-white shadow-xl backdrop-blur-md [&[open]>summary]:mb-2"
        >
          <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
            {t("career_page.m_legend")}
          </summary>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 px-3 pb-3">
            {LEGEND_KINDS.map((kind) => (
              <li key={kind} className="flex items-center gap-2 text-[12px] text-white/85">
                <span
                  className={`legend-dot legend-dot--${kind}`}
                  dangerouslySetInnerHTML={{
                    __html: `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true">${INSTITUTION_ICONS[kind]}</svg>`,
                  }}
                />
                {t(`career_page.m_kind_${kind}`)}
              </li>
            ))}
          </ul>
        </details>
      )}

      {!cityGroups.length && (
        <div className="absolute inset-0 z-[650] flex items-center justify-center bg-black/45 p-6 backdrop-blur-sm">
          <div className="max-w-md rounded-[2rem] border border-white/10 bg-black/60 p-8 text-center text-white shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <SearchX className="h-8 w-8 text-white/65" />
            </div>
            <h3 className="text-2xl font-black">Маълумот барои харита ёфт нашуд</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {t("career_page.m_no_data")}
            </p>
          </div>
        </div>
      )}

      {/*
        Наздикшавӣ ба ҷои холӣ харитаро тамоман бе маркер мемонад. Бе ин ишорат
        корбар намедонад, ки ин холигӣ аст ё сомона вайрон шудааст.
      */}
      {Boolean(cityGroups.length) &&
        viewport.zoom > CITY_OVERVIEW_ZOOM &&
        !visibleUniversities.length && (
          <div className="pointer-events-none absolute left-1/2 top-6 z-[650] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 px-4 py-2.5 text-sm font-semibold text-white shadow-xl backdrop-blur-xl">
            {t("career_page.m_zoom_out")}
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
            {/* Дар телефон баландӣ камтар аст, то харита зери панел
                намонад; мазмун скролл мешавад — пештар он танҳо бурида
                мешуд ва тугмаи «Муфассал дидан» ба поён намерасид. */}
            <div className="flex max-h-[58vh] flex-col overflow-y-auto overscroll-contain rounded-[2rem] border border-white/10 bg-black/72 p-4 text-white shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:max-h-[78vh] md:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[15px] font-black leading-snug md:text-lg md:leading-tight">{selectedUni.name}</p>
                  {/* Суроғаи пурра, вақте маълум аст — довталабро маҳз ҳамин
                      ба бинои дуруст мебарад, на номи шаҳр. */}
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-white/65">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{selectedUni.address || selectedUni.inferredCity}</span>
                  </p>
                  {!selectedUni.hasExactLocation && (
                    <p className="mt-1 text-xs text-white/45">
                      {t("career_page.m_approx")}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedUni(null);
                    setPanelOpen(false);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label={t("career_page.m_close")}
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
                {/* Ном дар сарлавҳаи панел аллакай ҳаст. Дар телефон
                    такрори он ним экранро мегирифт. */}
                <div className="hidden items-start gap-3 md:flex">
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
                        {t("career_page.m_city", { city: selectedUni.inferredCity })}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                        {selectedUni.careerCount || 0} ихтисос
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-white/70">
                  {selectedUni.description || t("career_page.m_no_short")}
                </p>

                <button
                  onClick={() => navigate(`/universities/${selectedUni.id}`)}
                  className="mt-4 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-primary/40 md:mt-5"
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
