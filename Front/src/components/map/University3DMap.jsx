import React, { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTranslation } from "react-i18next";


const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const DEFAULT_HEIGHT = 8;

const University3DMap = ({ universities = [], center, zoom = 15, onSelect }) => {
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const [failed, setFailed] = useState(null);
    const [ready, setReady] = useState(false);

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
            console.warn("3D map:", e?.error?.message || e);
        });

        map.on("load", () => {
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
