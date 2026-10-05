"use client";

import "leaflet/dist/leaflet.css";

import { Home, MapPinned, Maximize2, Navigation } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Coordinate, RouteStop } from "@/types/routing";

const BASE: Coordinate = { lat: -37.99917, lng: -57.55046 };
const DEFAULT_CENTER: [number, number] = [-38.005, -57.55];
const OSRM_URL = "https://router.project-osrm.org";

type RouteMapProps = {
  stops: RouteStop[];
  onOptimized?: (orderedStops: RouteStop[], distanceMeters: number, durationSeconds: number) => void;
};

type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: GeoJSON.LineString;
  }>;
};

function formatCoordinates(points: Coordinate[]) {
  return points.map((point) => `${point.lng},${point.lat}`).join(";");
}

function numberedIcon(leaflet: typeof import("leaflet"), label: string, base = false) {
  return leaflet.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;width:28px;height:28px;border:2px solid white;border-radius:9999px;background:${base ? "#172433" : "#2476f3"};color:white;font:700 12px/1 system-ui;box-shadow:0 1px 4px #0006">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

export default function RouteMap({ stops, onOptimized }: RouteMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const onOptimizedRef = useRef(onOptimized);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    onOptimizedRef.current = onOptimized;
  }, [onOptimized]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    let disposed = false;
    void import("leaflet").then((leaflet) => {
      if (disposed || !mapElement.current) return;
      const map = leaflet.map(mapElement.current, { zoomControl: true }).setView(DEFAULT_CENTER, 12);
      const tiles = leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      tiles.on("tileerror", () => {
        // The canonical endpoint avoids subdomain/DNS blocks on restricted networks.
        tiles.setUrl("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
      });
      leafletRef.current = leaflet;
      mapRef.current = map;
      layersRef.current = leaflet.layerGroup().addTo(map);
      setStatus("ready");
      requestAnimationFrame(() => {
        if (!disposed) map.invalidateSize({ animate: false });
      });
      window.setTimeout(() => {
        if (!disposed) map.invalidateSize({ animate: false });
      }, 250);
    }).catch(() => setStatus("error"));

    return () => {
      disposed = true;
      layersRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    const leaflet = leafletRef.current;
    if (status !== "ready" || !map || !layers || !leaflet) return;

    layers.clearLayers();
    map.invalidateSize({ animate: false });
    leaflet.marker([BASE.lat, BASE.lng], {
      icon: numberedIcon(leaflet, "B", true),
      title: "Base: Italia y San Martín"
    }).addTo(layers);

    if (!stops.length) {
      map.setView(DEFAULT_CENTER, 12);
      requestAnimationFrame(() => map.invalidateSize({ animate: false }));
      return;
    }

    const controller = new AbortController();
    const points = [BASE, ...stops, BASE];
    const routeUrl = `${OSRM_URL}/route/v1/driving/${formatCoordinates(points)}?overview=full&geometries=geojson`;

    void fetch(routeUrl, { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`OSRM route failed with status ${response.status}`);
        return (await response.json()) as OsrmRouteResponse;
      })
      .then((payload) => {
        if (payload.code !== "Ok") throw new Error(`OSRM returned ${payload.code || "an invalid response"}`);
        const route = payload.routes?.[0];
        if (!route?.geometry || route.geometry.type !== "LineString") throw new Error("OSRM route geometry is unavailable");

        leaflet.geoJSON(route.geometry, {
          style: { color: "#2476f3", weight: 5, opacity: 0.9 }
        }).addTo(layers);

        stops.forEach((stop, index) => {
          leaflet.marker([stop.lat, stop.lng], {
            icon: numberedIcon(leaflet, String(index + 1)),
            title: `Parada ${index + 1}: ${stop.address}`
          })
            .on("click", () => {
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.address}, Mar del Plata`)}`,
                "_blank",
                "noopener,noreferrer"
              );
            })
            .addTo(layers);
        });

        const bounds = leaflet.geoJSON(route.geometry).getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
        requestAnimationFrame(() => map.invalidateSize({ animate: false }));
        onOptimizedRef.current?.(stops, route.distance || 0, route.duration || 0);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [status, stops]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><h2 className="font-semibold">Mapa del recorrido optimizado</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${status === "ready" ? "bg-emerald-500" : "bg-amber-500"}`} /> {stops.length ? `${stops.length} paradas · OpenStreetMap / OSRM` : "Agregá paradas para visualizar la ruta"}</p></div>
        <button className="rounded-lg border border-slate-200 p-2 text-slate-400" title="Ampliar mapa"><Maximize2 size={16} /></button>
      </div>
      <div className="route-map-shell relative h-[330px] overflow-hidden bg-[#e9f1ef]">
        {status === "loading" && <MapMessage icon={<MapPinned size={28} />} text="Cargando mapa..." />}
        {status === "error" && <MapMessage icon={<MapPinned size={28} />} text="No se pudo calcular la ruta vial con OSRM." />}
        <div ref={mapElement} className={`route-map-container h-full w-full ${status === "ready" ? "block" : "hidden"}`} />
        <div className="absolute bottom-8 left-4 z-[400] flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[9px] font-bold text-white shadow"><Home size={12} /> BASE</div>
        {stops.length > 0 && status === "ready" && <div className="absolute bottom-3 right-3 z-[400] flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] text-slate-600 shadow"><Navigation size={12} className="text-blue-600" /> Tocá un marcador para navegar</div>}
      </div>
    </section>
  );
}

function MapMessage({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="absolute inset-0 z-10 grid place-items-center text-center text-sm text-slate-500"><div><div className="mb-2 flex justify-center text-blue-500">{icon}</div><p>{text}</p></div></div>;
}
