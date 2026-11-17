import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uuid, name, phone, email } = body;

    if (!uuid) {
      return NextResponse.json({ error: "Falta el identificador del usuario" }, { status: 400 });
    }

    const supabase = await createClient();

    // Hacemos un "upsert" usando el uuid del invitado para evitar duplicados 
    // si el mismo usuario cotiza varias veces.
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          id: uuid,
          name: name || "Cliente Invitado",
          phone: phone || null,
          email: email || null,
        },
        { onConflict: "id" }
      )
      .select();

    if (error) {
      console.error("Error al registrar usuario en Supabase:", error);
      return NextResponse.json({ error: "Error al guardar los datos del usuario" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error en POST /api/users:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}