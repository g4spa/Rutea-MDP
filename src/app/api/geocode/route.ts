import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodeMarDelPlata } from "@/lib/geocoding";

const schema = z.object({ address: z.string().trim().min(3).max(200) });

export async function POST(request: Request) {
  try {
    const { address } = schema.parse(await request.json());
    const result = await geocodeMarDelPlata(address);
    if (!result) return NextResponse.json({ error: "No se encontró la dirección" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Dirección inválida" }, { status: 400 });
    return NextResponse.json({ error: "Servicio de geocodificación no disponible" }, { status: 502 });
  }
}
