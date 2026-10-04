import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  businessName: z.string().trim().max(160).optional().or(z.literal("")),
  taxId: z.string().trim().max(20).optional().or(z.literal("")),
  taxCondition: z.string().max(40).optional().or(z.literal("")),
  invoicePreference: z.enum(["A", "B"]).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  receiverName: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().min(3).max(200),
  neighborhood: z.string().trim().max(100).optional().or(z.literal("")),
  roadSurface: z.enum(["ASPHALT", "GRAVEL", "DIRT"]).optional().or(z.literal("")),
  paidParkingZone: z.string().transform((value) => value === "true"),
  deliveryWeekdays: z.string().min(3).max(120),
  receivingFrom: z.string().max(5).optional().or(z.literal("")),
  receivingUntil: z.string().max(5).optional().or(z.literal("")),
  fixedNotes: z.string().trim().max(1000).optional().or(z.literal(""))
});

export async function POST(request: Request) {
  try {
    const data = customerSchema.parse(await request.json());
    const customer = await db.customer.create({ data: { ...data, geocodedAt: null } });
    return NextResponse.json({ id: customer.id, name: customer.name }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Revisá los datos obligatorios del cliente." }, { status: 400 });
    return NextResponse.json({ error: "No se pudo guardar el cliente." }, { status: 500 });
  }
}
