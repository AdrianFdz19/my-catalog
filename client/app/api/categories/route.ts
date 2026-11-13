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

// POST: Crear una nueva categoría (Protegido por Autenticación RLS)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Validar autenticación del usuario (Admin RLS)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión como administrador." },
        { status: 401 }
      );
    }

    // 2. Obtener y validar los datos del body
    const body = await request.json();
    const { name, description, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la categoría es obligatorio." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    
    // Generar un slug básico a partir del nombre (ej. "Cámaras Pro" -> "camaras-pro")
    const slug = trimmedName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover tildes
      .replace(/[^a-z0-9 ]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    // 3. Comprobar si la categoría ya existe (por nombre o slug)
    const { data: existingCategory, error: checkError } = await supabase
      .from("categories")
      .select("id")
      .or(`name.ilike.${trimmedName},slug.eq.${slug}`)
      .maybeSingle();

    if (checkError) {
      console.error("Error al verificar duplicados:", checkError);
    }

    if (existingCategory) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre o slug." },
        { status: 409 }
      );
    }

    // 4. Insertar la nueva categoría en Supabase
    const { data: newCategory, error: insertError } = await supabase
      .from("categories")
      .insert([
        {
          name: trimmedName,
          slug,
          description: description ? description.trim() : null,
          icon: icon || "💻", // Icono por defecto si no se envía
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error al insertar categoría:", insertError);
      return NextResponse.json(
        { error: "No se pudo crear la categoría en la base de datos." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Categoría creada exitosamente.",
        category: newCategory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error interno en POST categories:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}