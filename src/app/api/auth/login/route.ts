import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios." }, { status: 400 });
    }
    const user = await signIn(body.email.trim(), body.password);
    if (!user) return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión. Verificá DATABASE_URL y que el usuario exista en la base del servidor." },
      { status: 500 }
    );
  }
}
