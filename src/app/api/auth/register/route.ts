import { NextResponse } from "next/server";
import { createUser, signIn } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    if (!body.name?.trim() || !body.email?.includes("@") || !body.password || body.password.length < 8) {
      return NextResponse.json({ error: "Nombre, email válido y contraseña de 8 caracteres son obligatorios." }, { status: 400 });
    }
    const user = await createUser(body.name.trim(), body.email.trim(), body.password);
    await signIn(user.email, body.password);
    return NextResponse.json({ user: { name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email." }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo crear el usuario." }, { status: 500 });
  }
}
