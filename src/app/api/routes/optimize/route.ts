import { NextResponse } from "next/server";
import { z } from "zod";
import { optimizeRoute } from "@/lib/routing";

const coordinateSchema = z.object({ lat: z.number().finite(), lng: z.number().finite() });
const stopSchema = coordinateSchema.extend({
  id: z.string().min(1),
  address: z.string().min(1),
  receivingFrom: z.string().optional().nullable(),
  receivingUntil: z.string().optional().nullable(),
  serviceMinutes: z.number().int().positive().max(120).optional()
});

const requestSchema = z.object({
  base: coordinateSchema,
  stops: z.array(stopSchema).max(500),
  vehicle: z.object({
    litersPer100Km: z.number().positive().max(100),
    fuelPriceCents: z.number().nonnegative(),
    averageSpeedKmh: z.number().positive().max(150).optional()
  })
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    return NextResponse.json(await optimizeRoute(body.base, body.stops, body.vehicle));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos de ruta inválidos", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo obtener una ruta vial desde OSRM" }, { status: 502 });
  }
}
