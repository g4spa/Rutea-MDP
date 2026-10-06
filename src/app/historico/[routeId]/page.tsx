import Link from "next/link";

export default async function RouteHistoryDetail({ params }: { params: Promise<{ routeId: string }> }) {
  const { routeId } = await params;
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link href="/historico" className="text-sm text-blue-600">← Volver al histórico</Link>
        <h1 className="mt-8 text-3xl font-bold">Detalle de ruta</h1>
        <p className="mt-2 text-sm text-slate-500">Ruta {routeId}. Aquí se mostrará el mapa real, entregas, incidencias, cobros y arqueo.</p>
      </div>
    </main>
  );
}
