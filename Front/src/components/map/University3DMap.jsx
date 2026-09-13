import React, { useEffect, useRef, useState } from "react";
// MapLibre v6 экспорти default надорад — танҳо номдор.
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslation } from "react-i18next";

/*
 * Харитаи сеченака.
 *
 * Leaflet 3D намекунад, аз ин рӯ ин ҷо MapLibre GL истифода мешавад. Ҳамаи
 * манбаъҳо ройгонанд ва калид талаб намекунанд:
 *   • OpenFreeMap — вектор плиткаҳо бо қабати `building-3d` (fill-extrusion);
 *     танҳо дар Душанбе 39,827 бино;
 *   • AWS Terrain Tiles — релефи ҷаҳонӣ. Барои Тоҷикистон, ки 93%-аш кӯҳ
 *     аст, ин муҳимтарин қисм аст.
 *
 * Компонент ҷудогона аст: агар MapLibre бор нашавад, харитаи асосии Leaflet
 * бетағйир кор мекунад.
 */

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

/* Баландии пешфарз, вақте бино ошёна нишон надодааст: аз 39,827 бинои
   Душанбе танҳо 2,349-тояш баландӣ дорад. Бе ин боқимонда ҳамвор мемонад. */
const DEFAULT_HEIGHT = 8;

const University3DMap = ({ universities = [], center, zoom = 15, onSelect }) => {
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const [failed, setFailed] = useState(null);
    const [ready, setReady] = useState(false);

    // Сохтани харита — як бор
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        let map;
        try {
            map = new MapLibreMap({
                container: containerRef.current,
                style: STYLE_URL,
                center: [center?.lng ?? 68.787, center?.lat ?? 38.5598],
                zoom,
                pitch: 55,     // нигоҳи моил — бе ин ҳаҷм дида намешавад
                bearing: -18,
                antialias: true,
                attributionControl: { compact: true },
            });
        } catch (err) {
            setFailed(err.message);
            return;
        }

        mapRef.current = map;
        map.addControl(new NavigationControl({ visualizePitch: true }), "top-left");

        map.on("error", (e) => {
            // Хатои як плитка тамоми харитаро намекушад — танҳо сабт мешавад.
            console.warn("3D map:", e?.error?.message || e);
        });

        map.on("load", () => {
            /* Релеф: манбаи DEM-и AWS формати terrarium дорад. */
            try {
                map.addSource("terrain", {
                    type: "raster-dem",
                    tiles: ["https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"],
                    encoding: "terrarium",
                    tileSize: 256,
                    maxzoom: 13,
                });
                map.setTerrain({ source: "terrain", exaggeration: 1.3 });

                map.setSky({
                    "sky-color": "#8fc3ff",
                    "horizon-color": "#ffffff",
                    "fog-color": "#e8f1ff",
                    "sky-horizon-blend": 0.6,
                    "horizon-fog-blend": 0.5,
                });
            } catch (err) {
                console.warn("Релеф бор нашуд:", err.message);
            }

            /* Баландии биноҳо: агар ошёна маълум набошад, пешфарз. */
            if (map.getLayer("building-3d")) {
                map.setPaintProperty("building-3d", "fill-extrusion-height", [
                    "coalesce",
                    ["get", "render_height"],
                    ["*", ["coalesce", ["get", "render_min_height"], 0], 0],
                    DEFAULT_HEIGHT,
                ]);
                map.setPaintProperty("building-3d", "fill-extrusion-opacity", 0.9);
            }

            setReady(true);
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Нишонаҳо
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !ready) return;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        universities.forEach((uni) => {
            const lat = Number(uni.latitude);
            const lng = Number(uni.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            const el = document.createElement("button");
            el.type = "button";
            el.className = uni.hasExactLocation ? "map3d-pin map3d-pin--exact" : "map3d-pin";
            el.title = uni.hasExactLocation
                ? [uni.name, uni.address].filter(Boolean).join("\n")
                : t("misc.map3d_approx", { name: uni.name });
            el.setAttribute("aria-label", uni.name);
            if (onSelect) el.addEventListener("click", () => onSelect(uni));

            markersRef.current.push(
                new Marker({ element: el, anchor: "bottom" })
                    .setLngLat([lng, lat])
                    .addTo(map),
            );
        });
    }, [universities, ready, onSelect]);

    // Гузариш ба шаҳри интихобшуда
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !ready || !center) return;
        map.flyTo({ center: [center.lng, center.lat], zoom: center.zoom ?? zoom, pitch: 55, duration: 1400 });
    }, [center, ready, zoom]);

    if (failed) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    {t("misc.map3d_failed")}
                </p>
            </div>
        );
    }

    return <div ref={containerRef} className="h-full w-full" />;
};

export default University3DMap;
