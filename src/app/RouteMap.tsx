"use client";

import { Home, Maximize2, MapPinned, Navigation } from "lucide-react";
import type { Coordinate, RouteStop, OptimizedRoute } from "@/types/routing";

const BASE: Coordinate = { lat: -37.99917, lng: -57.55046 };

export default function RouteMap({ stops, geometry }: { stops: RouteStop[]; geometry?: OptimizedRoute["geometry"] }) {
  const points = [BASE, ...stops, BASE];
  const geometryPoints = geometry?.coordinates.map(([lng, lat]) => ({ lat, lng })) || [];
  const boundsPoints = geometryPoints.length ? geometryPoints : points;
  const lats = boundsPoints.map((point) => point.lat);
  const lngs = boundsPoints.map((point) => point.lng);
  const minLat = Math.min(...lats, BASE.lat) - 0.004;
  const maxLat = Math.max(...lats, BASE.lat) + 0.004;
  const minLng = Math.min(...lngs, BASE.lng) - 0.004;
  const maxLng = Math.max(...lngs, BASE.lng) + 0.004;
  const project = (point: Coordinate) => ({
    x: 30 + ((point.lng - minLng) / Math.max(maxLng - minLng, 0.001)) * 540,
    y: 350 - ((point.lat - minLat) / Math.max(maxLat - minLat, 0.001)) * 300
  });
  const projected = points.map(project);
  const routePath = geometryPoints.map(project).map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><h2 className="font-semibold">Mapa del recorrido optimizado</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {stops.length ? `${stops.length} paradas · bucle con regreso a base` : "Agregá paradas para visualizar la ruta"}</p></div>
        <button className="rounded-lg border border-slate-200 p-2 text-slate-400" title="Ampliar mapa"><Maximize2 size={16} /></button>
      </div>
      <div className="relative h-[330px] overflow-hidden bg-[#e9f1ef]" style={{ backgroundImage: "linear-gradient(35deg, transparent 47%, #d3dfdc 48%, #d3dfdc 50%, transparent 51%), linear-gradient(-25deg, transparent 47%, #d3dfdc 48%, #d3dfdc 50%, transparent 51%)", backgroundSize: "145px 110px, 180px 130px" }}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-cyan-100/30" />
        <svg viewBox="0 0 600 390" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-label="Mapa de la ruta">
          <path d="M20 335 C140 280 160 220 280 210 S420 120 570 55" fill="none" stroke="white" strokeWidth="10" opacity=".8" />
          {routePath && <path d={routePath} fill="none" stroke="#2476f3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
        <div className="absolute left-3 top-5 text-[9px] font-bold tracking-widest text-slate-500/70">NORTE</div><div className="absolute bottom-5 right-4 text-[9px] font-bold tracking-widest text-slate-500/70">PUERTO</div>
        {stops.length === 0 ? <div className="absolute inset-0 grid place-items-center text-center text-sm text-slate-500"><div><MapPinned className="mx-auto mb-2 text-blue-500" size={28} /><p>La ruta aparecerá acá<br />después de optimizarla.</p></div></div> : projected.slice(1, -1).map((point, index) => <a key={stops[index].id} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stops[index].address + ", Mar del Plata")}`} target="_blank" rel="noreferrer" className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-bold text-white shadow-md transition hover:scale-125" style={{ left: `${(point.x / 600) * 100}%`, top: `${(point.y / 390) * 100}%` }} title={`Parada ${index + 1}: ${stops[index].address}`}>{index + 1}</a>)}
        <div className="absolute bottom-8 left-4 flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[9px] font-bold text-white shadow"><Home size={12} /> BASE</div>
        {stops.length > 0 && <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] text-slate-600 shadow"><Navigation size={12} className="text-blue-600" /> Tocá un marcador para navegar</div>}
      </div>
    </section>
  );
}
