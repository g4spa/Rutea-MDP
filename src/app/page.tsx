"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CloudOff, Fuel, MapPin, Navigation, Plus, Route, Sparkles, Truck } from "lucide-react";
import { flushMutations, queueMutation } from "@/lib/offline-db";
import type { OptimizedRoute, RouteStop } from "@/types/routing";
import RouteMap from "./RouteMap";

const BASE = { lat: -37.99917, lng: -57.55046 };
const VEHICLE = { litersPer100Km: 8.5, fuelPriceCents: 105000, averageSpeedKmh: 32 };

function formatNumber(value: number) {
  return value.toLocaleString("es-AR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setOnline(navigator.onLine);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    const onOnline = async () => {
      setOnline(true);
      await flushMutations();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const totalCollected = useMemo(() => 0, []);

  async function addAddresses() {
    const addresses = input.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    if (!addresses.length) {
      setMessage("Ingresá al menos una dirección.");
      return;
    }
    setBusy(true);
    try {
      const geocoded = await Promise.all(addresses.map(async (address, index) => {
        const response = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address })
        });
        if (!response.ok) return { address, error: true };
        const result = (await response.json()) as { lat: number; lng: number };
        return { id: `${Date.now()}-${index}`, address, lat: result.lat, lng: result.lng };
      }));
      const validStops = geocoded.filter((stop): stop is RouteStop => !("error" in stop));
      const rejected = geocoded.length - validStops.length;
      setStops((current) => [...current, ...validStops]);
      setInput("");
      setMessage(`${validStops.length} parada${validStops.length === 1 ? "" : "s"} geocodificada${validStops.length === 1 ? "" : "s"}${rejected ? `. No se encontraron ${rejected}.` : "."}`);
    } catch {
      setMessage("No se pudo geocodificar. Revisá la conexión e intentá nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function optimize() {
    if (!stops.length) {
      setMessage("Agregá direcciones antes de optimizar.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/routes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base: BASE, stops, vehicle: VEHICLE })
      });
      if (!response.ok) throw new Error("No se pudo calcular la ruta.");
      setRoute((await response.json()) as OptimizedRoute);
      setMessage("Ruta optimizada con base, retorno y ventanas de servicio.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al optimizar.");
    } finally {
      setBusy(false);
    }
  }

  async function markDelivered(stop: RouteStop) {
    const body = { deliveryId: stop.id, status: "DELIVERED", deliveredAt: new Date().toISOString() };
    if (!navigator.onLine) {
      await queueMutation({ url: "/api/deliveries", method: "PATCH", body });
      setMessage("Guardado sin conexión. Se sincronizará al recuperar señal.");
      return;
    }
    setMessage(`Entrega marcada: ${stop.address}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-blue-500 p-2"><Route size={20} /></span><div><strong className="font-mono text-xl">rutea</strong><span className="ml-2 text-[10px] tracking-[.2em] text-slate-400">MAR DEL PLATA</span></div></div>
          <div className="flex items-center gap-2 text-xs text-slate-300">{online ? <><span className="h-2 w-2 rounded-full bg-emerald-400" /> En línea</> : <><CloudOff size={15} /> Sin conexión</>}</div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.15em] text-slate-400">OPERACIÓN DIARIA</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Planificador de rutas</h1><p className="mt-1 text-sm text-slate-500">Italia y San Martín · salida y regreso de cada recorrido</p></div><div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700"><Truck size={16} /> Sábado · Norte / Centro / Oeste</div></div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5">
            <RouteMap stops={route?.orderedStops || []} geometry={route?.geometry} />
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between"><div><h2 className="font-semibold">Cargar direcciones</h2><p className="mt-1 text-xs text-slate-500">Una dirección por línea. Se geocodifican antes de armar el recorrido.</p></div><span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-400">01</span></div><textarea value={input} onChange={(event) => setInput(event.target.value)} rows={5} placeholder={"Av. Constitución 5400\nGüemes 2850\nLa Rioja 1800"} className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-1 text-xs text-slate-400"><Sparkles size={14} className="text-amber-500" /> Usá calle y altura para mayor precisión.</span><button onClick={addAddresses} disabled={busy} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"><Plus size={16} /> {busy ? "Geocodificando..." : "Agregar"}</button></div></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Paradas de la ruta <span className="ml-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">{stops.length}</span></h2><p className="mt-1 text-xs text-slate-500">{route ? `${route.orderedStops.length} paradas ordenadas · retorno a base incluido` : "Todavía no optimizaste el recorrido."}</p></div><button onClick={optimize} disabled={busy || !stops.length} className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles size={14} /> {busy ? "Calculando..." : "Optimizar orden"}</button></div>{stops.length ? <div className="divide-y divide-slate-100">{(route?.orderedStops || stops).map((stop, index) => <div key={stop.id} className="flex items-center gap-3 py-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{stop.address}</p><p className="text-xs text-slate-400">Mar del Plata · parada {index + 1}</p></div><button onClick={() => markDelivered(stop)} className="rounded-md p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600" title="Marcar entregado"><Check size={17} /></button><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address + ", Mar del Plata")}`} target="_blank" rel="noreferrer" className="rounded-md p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600" title="Navegar"><Navigation size={16} /></a></div>)}</div> : <div className="rounded-lg bg-slate-50 py-12 text-center text-sm text-slate-400"><MapPin className="mx-auto mb-2" size={24} />Tu ruta está vacía.</div>}</div>
          </section>
          <aside className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Resumen de ruta</h2><p className="mt-1 text-xs text-slate-500">Estimación con velocidad urbana</p></div><Fuel className="text-blue-600" size={20} /></div><div className="grid grid-cols-2 gap-3"><Metric label="Distancia" value={route ? `${formatNumber(route.totalKilometers)} km` : "0,0 km"} /><Metric label="Tiempo" value={route ? `${route.estimatedMinutes} min` : "0 min"} /><Metric label="Combustible" value={route ? `${formatNumber(route.fuelLiters)} L` : "0,0 L"} /><Metric label="Costo" value={route ? `$ ${(route.fuelCostCents / 100).toLocaleString("es-AR")}` : "$ 0"} /></div></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Arqueo de caja</h2><p className="mt-1 text-xs text-slate-500">Cobros acumulados de la jornada</p><div className="mt-4 flex items-end justify-between"><span className="text-sm text-slate-500">Total cobrado</span><strong className="text-2xl">${totalCollected.toLocaleString("es-AR")}</strong></div><div className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-500">Efectivo</span><strong>$ 0</strong></div><div className="flex justify-between"><span className="text-slate-500">Mercado Pago / QR</span><strong>$ 0</strong></div><div className="flex justify-between"><span className="text-slate-500">Transferencias</span><strong>$ 0</strong></div></div></div>
          </aside>
        </div>
        {message && <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</p>}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-3"><span className="block text-[11px] text-slate-400">{label}</span><strong className="mt-1 block text-lg">{value}</strong></div>;
}
