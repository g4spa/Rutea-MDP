import Link from "next/link";
import { ArrowRight, Building2, Plus } from "lucide-react";

export default function CustomersPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-blue-600">← Volver a operación</Link>
        <div className="mt-8 flex items-end justify-between gap-4">
          <div><p className="text-xs font-bold tracking-[.15em] text-slate-400">CRM</p><h1 className="mt-2 text-3xl font-bold">Ficha técnica de clientes</h1><p className="mt-2 text-sm text-slate-500">Datos comerciales, ubicación, ventanas de atención, envases y cuenta corriente.</p></div>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /> Nuevo cliente</button>
        </div>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Building2 className="mx-auto text-blue-600" size={28} />
          <h2 className="mt-3 font-semibold">Módulo CRM preparado</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">El modelo Customer ya contempla CUIT, condición fiscal, geocodificación, estacionamiento medido, horarios y saldos. El CRUD se conecta en la siguiente etapa.</p>
          <Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">Ir al planificador <ArrowRight size={15} /></Link>
        </div>
      </div>
    </main>
  );
}
