import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  if (!body.email || !body.password) return NextResponse.json({ error: "Email y contraseña son obligatorios." }, { status: 400 });
  const user = await signIn(body.email.trim(), body.password);
  if (!user) return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  return NextResponse.json({ user });
}
