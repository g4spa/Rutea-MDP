"use client";

import { useEffect, useState } from "react";
import { Archive, Download, MapPin } from "lucide-react";

type Stop = { id: string; sequence: number; address: string; status: string };
type Day = { id: string; workedDate: string; totalStops: number; completedStops: number; stops: Stop[] };

function csv(day: Day) {
  const rows = [["Fecha", "Orden", "Dirección", "Estado"], ...day.stops.map((stop) => [new Date(day.workedDate).toLocaleDateString("es-AR"), String(stop.sequence), stop.address, stop.status === "VISITED" ? "Visitado" : "No visitado"])];
  return rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(";")).join("\n");
}

function downloadCsv(day: Day) {
  const blob = new Blob(["\ufeff" + csv(day)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jornada-${day.workedDate.slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function HistoryClient() {
  const [days, setDays] = useState<Day[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/work-days").then(async (response) => {
      if (!response.ok) throw new Error("No se pudo cargar el historial.");
      const payload = (await response.json()) as { days: Day[] };
      setDays(payload.days);
      setSelected(payload.days[0]?.id || null);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "No se pudo cargar el historial."));
  }, []);

  const activeDay = days.find((day) => day.id === selected);
  return <div className="mt-8 grid gap-5 lg:grid-cols-[300px_1fr]">
    <div className="space-y-3">{days.length ? days.map((day) => <button key={day.id} onClick={() => setSelected(day.id)} className={`w-full rounded-xl border p-4 text-left ${selected === day.id ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white"}`}><p className="font-semibold">{new Date(day.workedDate).toLocaleDateString("es-AR", { dateStyle: "full" })}</p><p className="mt-1 text-xs text-slate-500">{day.completedStops}/{day.totalStops} paradas completadas</p></button>) : <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Todavía no hay jornadas guardadas.</div>}</div>
    {activeDay ? <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold tracking-[.15em] text-slate-400">RESUMEN DE JORNADA</p><h2 className="mt-1 text-xl font-bold">{new Date(activeDay.workedDate).toLocaleDateString("es-AR", { dateStyle: "long" })}</h2><p className="mt-1 text-sm text-slate-500">{activeDay.completedStops} visitadas de {activeDay.totalStops}</p></div><button onClick={() => downloadCsv(activeDay)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><Download size={16} /> Exportar CSV</button></div><div className="mt-5 divide-y divide-slate-100">{activeDay.stops.map((stop) => <div key={stop.id} className="flex items-center gap-3 py-3"><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${stop.status === "VISITED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{stop.sequence}</span><MapPin size={16} className="shrink-0 text-slate-400" /><span className="flex-1 text-sm">{stop.address}</span><span className={`text-xs font-semibold ${stop.status === "VISITED" ? "text-emerald-600" : "text-slate-400"}`}>{stop.status === "VISITED" ? "Visitado" : "No visitado"}</span></div>)}</div></section> : <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">{error || "Seleccioná una jornada para ver el detalle."}</div>}
  </div>;
}
