import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const patchSchema = z.object({
  deliveryId: z.string().min(1),
  status: z.enum(["DELIVERED", "CLOSED", "REJECTED", "NO_MONEY", "RESCHEDULED", "PENDING"]),
  deliveredAt: z.string().datetime().optional()
});

export async function PATCH(request: Request) {
  try {
    const body = patchSchema.parse(await request.json());
    const delivery = await db.delivery.update({
      where: { id: body.deliveryId },
      data: {
        status: body.status,
        deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : undefined
      }
    });
    return NextResponse.json({ id: delivery.id, status: delivery.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Actualización de entrega inválida" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo actualizar la entrega" }, { status: 500 });
  }
}
