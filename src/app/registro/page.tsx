"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!response.ok) setError(((await response.json()) as { error?: string }).error || "No se pudo crear la cuenta.");
    else router.push("/");
  }
  return <main className="grid min-h-screen place-items-center bg-slate-950 px-4"><form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl"><h1 className="text-2xl font-bold">Crear cuenta</h1><p className="mt-1 text-sm text-slate-500">La cuenta permitirá cargar clientes y operar rutas.</p>{(["name", "email", "password"] as const).map((field) => <label key={field} className="mt-4 block text-sm font-medium">{field === "name" ? "Nombre" : field === "email" ? "Email" : "Contraseña"}<input required minLength={field === "password" ? 8 : undefined} type={field === "password" ? "password" : field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-1 w-full rounded-lg border p-3" /></label>)}{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<button className="mt-6 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white">Crear cuenta</button><a href="/login" className="mt-4 block text-center text-sm text-blue-600">Ya tengo una cuenta</a></form></main>;
}
