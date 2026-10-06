import Link from "next/link";
import { Archive } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  if (!await getCurrentUser()) redirect("/login");
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-6xl"><Link href="/" className="text-sm text-blue-600">← Volver a operación</Link><div className="mt-8"><p className="text-xs font-bold tracking-[.15em] text-slate-400">REGISTRO</p><h1 className="mt-2 text-3xl font-bold">Historial de días trabajados</h1><p className="mt-2 text-sm text-slate-500">Consultá las planillas guardadas y exportá cada jornada.</p></div><HistoryClient /><div className="mt-6 flex items-center gap-2 text-xs text-slate-400"><Archive size={15} /> Las jornadas se guardan por usuario.</div></div></main>;
}
