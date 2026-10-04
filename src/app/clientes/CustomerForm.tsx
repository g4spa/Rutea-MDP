"use client";

import { FormEvent, useState } from "react";
import { Check, X } from "lucide-react";

type CustomerFormProps = { onClose: () => void; onSaved: (name: string) => void };

export default function CustomerForm({ onClose, onSaved }: CustomerFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.paidParkingZone = form.get("paidParkingZone") === "on" ? "true" : "false";
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { error?: string; name?: string };
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el cliente.");
      onSaved(result.name || String(payload.name));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el cliente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-6">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div><p className="text-xs font-bold tracking-[.15em] text-blue-600">NUEVO REGISTRO</p><h2 className="mt-1 text-xl font-bold">Ficha técnica del cliente</h2><p className="mt-1 text-xs text-slate-500">Completá los datos para reutilizarlos en cada reparto.</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-6 px-5 py-6 sm:px-7">
          <fieldset><legend className="mb-3 text-sm font-semibold text-slate-800">Identificación comercial</legend><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre del local *" name="name" required placeholder="Ej: Almacén La Esquina" /><Field label="Razón social" name="businessName" placeholder="Razón social" /><Field label="CUIT" name="taxId" placeholder="20-12345678-9" /><Select label="Condición fiscal" name="taxCondition" options={[["CONSUMIDOR_FINAL", "Consumidor final"], ["RESPONSABLE_INSCRIPTO", "Responsable inscripto"], ["MONOTRIBUTO", "Monotributo"], ["EXENTO", "Exento"]]} /><Select label="Factura preferida" name="invoicePreference" options={[["A", "Factura A"], ["B", "Factura B"]]} /></div></fieldset>
          <fieldset><legend className="mb-3 text-sm font-semibold text-slate-800">Contacto y ubicación</legend><div className="grid gap-4 sm:grid-cols-2"><Field label="Teléfono" name="phone" type="tel" placeholder="223 555 0000" /><Field label="Persona que recibe" name="receiverName" placeholder="Ej: Roberto, mostrador" /><div className="sm:col-span-2"><Field label="Dirección exacta *" name="address" required placeholder="Calle y altura, Mar del Plata" /></div><Field label="Barrio" name="neighborhood" placeholder="Ej: Constitución" /><Select label="Tipo de calle" name="roadSurface" options={[["ASPHALT", "Asfalto"], ["GRAVEL", "Granza"], ["DIRT", "Tierra"]]} /><label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-600"><input type="checkbox" name="paidParkingZone" className="h-4 w-4 rounded border-slate-300 text-blue-600" /> Zona de estacionamiento medido</label></div></fieldset>
          <fieldset><legend className="mb-3 text-sm font-semibold text-slate-800">Recepción y condiciones</legend><div className="grid gap-4 sm:grid-cols-2"><Field label="Días habilitados" name="deliveryWeekdays" defaultValue="MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY" placeholder="MONDAY,WEDNESDAY,FRIDAY" /><div className="grid grid-cols-2 gap-3"><Field label="Recibe desde" name="receivingFrom" type="time" /><Field label="Recibe hasta" name="receivingUntil" type="time" /></div><div className="sm:col-span-2"><label className="block text-xs font-medium text-slate-600">Observaciones fijas<textarea name="fixedNotes" rows={3} placeholder="Timbre roto, llamar 5 min antes..." className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label></div></div></fieldset>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"><Check size={16} />{saving ? "Guardando..." : "Guardar cliente"}</button></div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", required, placeholder, defaultValue }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string }) {
  return <label className="block text-xs font-medium text-slate-600">{label}<input name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>;
}

function Select({ label, name, options }: { label: string; name: string; options: [string, string][] }) {
  return <label className="block text-xs font-medium text-slate-600">{label}<select name={name} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"><option value="">Seleccionar</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
}
