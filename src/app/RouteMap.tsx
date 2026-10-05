"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { Home, MapPinned, Maximize2, Navigation } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Coordinate, RouteStop } from "@/types/routing";

const BASE: Coordinate = { lat: -37.99917, lng: -57.55046 };
const DEFAULT_CENTER = { lat: -38.005, lng: -57.55 };
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type RouteMapProps = {
  stops: RouteStop[];
  onOptimized?: (orderedStops: RouteStop[], distanceMeters: number, durationSeconds: number) => void;
};

export default function RouteMap({ stops, onOptimized }: RouteMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const onOptimizedRef = useRef(onOptimized);
  const [status, setStatus] = useState<"loading" | "ready" | "missing-key" | "error">(
    GOOGLE_MAPS_API_KEY ? "loading" : "missing-key"
  );

  useEffect(() => {
    onOptimizedRef.current = onOptimized;
  }, [onOptimized]);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !mapElement.current) return;
    let cancelled = false;
    setOptions({ key: GOOGLE_MAPS_API_KEY, v: "weekly" });
    void Promise.all([importLibrary("maps"), importLibrary("routes")]).then(([mapsLibrary]) => {
      if (cancelled || !mapElement.current) return;
      const { Map } = mapsLibrary as google.maps.MapsLibrary;
      mapRef.current = new Map(mapElement.current, {
        center: DEFAULT_CENTER,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true
      });
      rendererRef.current = new google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true,
        preserveViewport: false,
        polylineOptions: { strokeColor: "#2476f3", strokeOpacity: 0.9, strokeWeight: 5 }
      });
      setStatus("ready");
    }).catch(() => setStatus("error"));

    return () => {
      cancelled = true;
      rendererRef.current?.setMap(null);
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !rendererRef.current) return;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    rendererRef.current.setDirections(null);

    const baseMarker = new google.maps.Marker({
      map: mapRef.current,
      position: BASE,
      title: "Base: Italia y San Martín",
      label: { text: "B", color: "#ffffff", fontWeight: "700" },
      icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: "#172433", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2, scale: 12 }
    });
    markersRef.current.push(baseMarker);
    if (!stops.length) {
      mapRef.current.setCenter(DEFAULT_CENTER);
      mapRef.current.setZoom(12);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const waypoints = stops.map((stop) => ({
      location: { lat: stop.lat, lng: stop.lng },
      stopover: true
    }));

    void directionsService.route({
      origin: BASE,
      destination: BASE,
      waypoints,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING
    }).then((result) => {
      rendererRef.current?.setDirections(result);
      const route = result.routes[0];
      const waypointOrder = route?.waypoint_order || stops.map((_, index) => index);
      const orderedStops = waypointOrder.map((index) => stops[index]).filter(Boolean);
      const distanceMeters = route?.legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0) || 0;
      const durationSeconds = route?.legs.reduce((total, leg) => total + (leg.duration?.value || 0), 0) || 0;
      orderedStops.forEach((stop, index) => {
        const marker = new google.maps.Marker({
          map: mapRef.current,
          position: { lat: stop.lat, lng: stop.lng },
          title: `Parada ${index + 1}: ${stop.address}`,
          label: { text: String(index + 1), color: "#ffffff", fontWeight: "700" },
          icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: "#2476f3", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2, scale: 12 }
        });
        marker.addListener("click", () => {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address + ", Mar del Plata")}`, "_blank", "noopener");
        });
        markersRef.current.push(marker);
      });
      onOptimizedRef.current?.(orderedStops, distanceMeters, durationSeconds);
    }).catch(() => setStatus("error"));
  }, [status, stops]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><h2 className="font-semibold">Mapa del recorrido optimizado</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${status === "ready" ? "bg-emerald-500" : "bg-amber-500"}`} /> {stops.length ? `${stops.length} paradas · Google Maps Driving` : "Agregá paradas para visualizar la ruta"}</p></div>
        <button className="rounded-lg border border-slate-200 p-2 text-slate-400" title="Ampliar mapa"><Maximize2 size={16} /></button>
      </div>
      <div className="relative h-[330px] overflow-hidden bg-[#e9f1ef]">
        {!GOOGLE_MAPS_API_KEY && <MapMessage icon={<MapPinned size={28} />} text="Configurá NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para activar Google Maps." />}
        {GOOGLE_MAPS_API_KEY && status === "loading" && <MapMessage icon={<MapPinned size={28} />} text="Cargando Google Maps..." />}
        {GOOGLE_MAPS_API_KEY && status === "error" && <MapMessage icon={<MapPinned size={28} />} text="No se pudo cargar Google Maps o calcular la ruta." />}
        <div ref={mapElement} className={`h-full w-full ${status === "ready" ? "block" : "hidden"}`} />
        <div className="absolute bottom-8 left-4 flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[9px] font-bold text-white shadow"><Home size={12} /> BASE</div>
        {stops.length > 0 && status === "ready" && <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] text-slate-600 shadow"><Navigation size={12} className="text-blue-600" /> Tocá un marcador para navegar</div>}
      </div>
    </section>
  );
}

function MapMessage({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="absolute inset-0 z-10 grid place-items-center text-center text-sm text-slate-500"><div><div className="mb-2 flex justify-center text-blue-500">{icon}</div><p>{text}</p></div></div>;
}
