import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import {
  formatProduct,
  getPaginationParams,
  buildPaginationMeta,
} from "../../lib/products";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, from, to } = getPaginationParams(searchParams, 12);

    const category = searchParams.get("category")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";

    const supabase = await createClient();

    // Si filtran por categoría específica, usamos !inner para filtrar en el JOIN
    const categorySelect =
      category && category !== "Todos"
        ? "categories!inner ( id, name, slug )"
        : "categories ( id, name, slug )";

    let query = supabase
      .from("products")
      .select(
        `
        id, name, slug, tag, description, price, stock, is_active, created_at,
        ${categorySelect},
        product_images ( image_url, is_primary )
        `,
        { count: "exact" }
      )
      .eq("is_active", true);

    // Filtro por categoría en PostgreSQL
    if (category && category !== "Todos") {
      query = query.eq("categories.name", category);
    }

    // Búsqueda por nombre o descripción en PostgreSQL
    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error en GET /api/products:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: (data || []).map(formatProduct),
      pagination: buildPaginationMeta(page, limit, count ?? 0),
    });
  } catch (error) {
    console.error("Error interno en GET /api/products:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}