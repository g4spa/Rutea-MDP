import Link from "next/link";
import { Archive, Filter } from "lucide-react";

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-blue-600">← Volver a operación</Link>
        <div className="mt-8 flex items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.15em] text-slate-400">REGISTRO</p><h1 className="mt-2 text-3xl font-bold">Histórico de repartos</h1><p className="mt-2 text-sm text-slate-500">Consultá rutas cerradas, cobranzas, incidencias y kilometraje real.</p></div><button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"><Filter size={16} /> Filtros</button></div>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><Archive className="mx-auto text-blue-600" size={28} /><h2 className="mt-3 font-semibold">Histórico listo para conectar</h2><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">RouteHistory y AuditLog consolidarán métricas por fecha, corredor, repartidor y ruta finalizada.</p></div>
      </div>
    </main>
  );
}
