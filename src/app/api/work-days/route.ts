import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const days = await db.workedDay.findMany({
    where: { userId: user.id },
    orderBy: { workedDate: "desc" },
    include: { stops: { orderBy: { sequence: "asc" } } }
  });
  return NextResponse.json({ days });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  try {
    const body = (await request.json()) as {
      workedDate?: string;
      stops?: Array<{ address: string; lat?: number; lng?: number; status?: string }>;
    };
    const workedDate = body.workedDate ? new Date(body.workedDate) : new Date();
    if (Number.isNaN(workedDate.getTime()) || !body.stops?.length || body.stops.length > 500) {
      return NextResponse.json({ error: "La jornada debe tener una fecha y al menos una parada." }, { status: 400 });
    }
    const day = await db.workedDay.upsert({
      where: { userId_workedDate: { userId: user.id, workedDate } },
      update: {
        totalStops: body.stops.length,
        completedStops: body.stops.filter((stop) => stop.status === "VISITED").length,
        stops: {
          deleteMany: {},
          create: body.stops.map((stop, index) => ({
            sequence: index + 1,
            address: stop.address.trim(),
            latitude: stop.lat,
            longitude: stop.lng,
            status: stop.status === "VISITED" ? "VISITED" : "NOT_VISITED"
          }))
        }
      },
      create: {
        userId: user.id,
        workedDate,
        totalStops: body.stops.length,
        completedStops: body.stops.filter((stop) => stop.status === "VISITED").length,
        stops: {
          create: body.stops.map((stop, index) => ({
            sequence: index + 1,
            address: stop.address.trim(),
            latitude: stop.lat,
            longitude: stop.lng,
            status: stop.status === "VISITED" ? "VISITED" : "NOT_VISITED"
          }))
        }
      },
      include: { stops: true }
    });
    return NextResponse.json({ day }, { status: 201 });
  } catch (error) {
    console.error("Worked day save failed:", error);
    return NextResponse.json({ error: "No se pudo guardar la jornada." }, { status: 500 });
  }
}
