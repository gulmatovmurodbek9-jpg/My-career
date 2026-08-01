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
const CITY_OVERVIEW_ZOOM = 8;

const CITY_CENTERS = {
  "Душанбе": { lat: 38.5737, lng: 68.787, zoom: 11 },
  "Хуҷанд": { lat: 40.2824, lng: 69.6222, zoom: 11 },
  "Бохтар": { lat: 37.8375, lng: 68.7791, zoom: 11 },
  "Кӯлоб": { lat: 37.9146, lng: 69.7845, zoom: 11 },
  "Хоруғ": { lat: 37.4897, lng: 71.5538, zoom: 11 },
  "Ваҳдат": { lat: 38.5563, lng: 69.0135, zoom: 11 },
  "Турсунзода": { lat: 38.5127, lng: 68.2316, zoom: 11 },
  "Ҳисор": { lat: 38.525, lng: 68.551, zoom: 11 },
  "Исфара": { lat: 40.1265, lng: 70.6252, zoom: 11 },
  "Истаравшан": { lat: 39.9142, lng: 69.0023, zoom: 11 },
  "Панҷакент": { lat: 39.4952, lng: 67.6093, zoom: 11 },
  "Левакант": { lat: 37.822, lng: 68.809, zoom: 11 },
  "Данғара": { lat: 38.095, lng: 69.339, zoom: 11 },
  "Роғун": { lat: 38.6933, lng: 69.7798, zoom: 11 },
  "Конибодом": { lat: 40.2923, lng: 70.4312, zoom: 11 },
  "Бӯстон": { lat: 40.2917, lng: 69.6297, zoom: 11 },
  "Норак": { lat: 38.3892, lng: 69.3227, zoom: 11 },
  "Рашт": { lat: 39.0287, lng: 70.3745, zoom: 11 },
  "Шаҳритус": { lat: 37.2622, lng: 68.1385, zoom: 11 },
  "Ёвон": { lat: 38.3141, lng: 69.0378, zoom: 11 },
};

const CITY_KEYWORDS = Object.keys(CITY_CENTERS);

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
      <div class="university-cluster-marker ${isActive ? "is-active" : ""}">
        <span class="university-cluster-marker__ring"></span>
        <span class="university-cluster-marker__core">1</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function hashCode(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function inferCity(uni) {
  if (uni.city && CITY_CENTERS[uni.city]) return uni.city;

  const matchedKeyword = CITY_KEYWORDS.find((keyword) => uni.name?.includes(keyword));
  if (matchedKeyword) return matchedKeyword;

  return DEFAULT_CITY;
}

function buildDisplayUniversity(uni) {
  const inferredCity = inferCity(uni);
  const center = CITY_CENTERS[inferredCity] || CITY_CENTERS[DEFAULT_CITY];
  const seed = hashCode(`${uni.id}-${inferredCity}`);
  const angle = (seed % 360) * (Math.PI / 180);
  const ring = Math.floor(seed / 360) % 10;
  const radius = 0.012 + ring * 0.0035;
  const lat = center.lat + Math.sin(angle) * radius;
  const lng = center.lng + Math.cos(angle) * radius;

  return {
    ...uni,
    inferredCity,
    displayLat: lat,
    displayLng: lng,
  };
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
    () =>
      universities
        .filter((uni) => uni.id && uni.name)
        .map(buildDisplayUniversity)
        .filter((uni) => uni.inferredCity),
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
    color: "rgba(255,255,255,0.18)",
    dashArray: "4",
    fillOpacity: 0.07,
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] h-40 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />

      <div className="h-[620px] w-full md:h-[700px]">
        <MapContainer
          center={[CITY_CENTERS[DEFAULT_CITY].lat, CITY_CENTERS[DEFAULT_CITY].lng]}
          zoom={DEFAULT_ZOOM}
          zoomControl={true}
          scrollWheelZoom={true}
          className="university-map h-full w-full"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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
                    <p className="text-sm font-bold leading-tight text-white">{group.city}</p>
                    <p className="flex items-center gap-1 text-xs text-white/70">
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
                    <p className="text-sm font-bold leading-tight text-white">{uni.name}</p>
                    <p className="flex items-center gap-1 text-xs text-white/70">
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
