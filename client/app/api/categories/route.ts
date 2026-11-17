import { NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error al obtener categorías:", error);
      return NextResponse.json(
        { error: "No se pudieron cargar las categorías." },
        { status: 500 }
      );
    }

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Error interno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}