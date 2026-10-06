"use client";

import { FormEvent, useState } from "react";
import { Route } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const responseText = await response.text();
      let payload: { error?: string } = {};
      if (responseText) {
        try {
          payload = JSON.parse(responseText) as { error?: string };
        } catch {
          payload = {};
        }
      }
      if (!response.ok) setError(payload.error || `No se pudo iniciar sesión (HTTP ${response.status}).`);
      else router.push("/");
    } catch {
      setError("No se pudo conectar con el servidor. Verificá que el túnel siga activo.");
    }
    setBusy(false);
  }

  return <main className="grid min-h-screen place-items-center bg-slate-950 px-4"><form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl"><div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-blue-600 p-2 text-white"><Route size={20} /></span><strong className="text-xl">rutea</strong></div><h1 className="text-2xl font-bold">Iniciar sesión</h1><p className="mt-1 text-sm text-slate-500">Accedé a tu operación de reparto.</p><label className="mt-6 block text-sm font-medium">Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-1 w-full rounded-lg border p-3" /></label><label className="mt-4 block text-sm font-medium">Contraseña<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required className="mt-1 w-full rounded-lg border p-3" /></label>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={busy} className="mt-6 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white disabled:opacity-50">{busy ? "Ingresando..." : "Ingresar"}</button><a href="/registro" className="mt-4 block text-center text-sm text-blue-600">Crear una cuenta</a></form></main>;
}
