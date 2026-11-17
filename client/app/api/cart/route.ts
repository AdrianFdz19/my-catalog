import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { formatProduct } from "@/app/lib/products";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const supabase = await createClient();

    // Consultamos los productos cuyos IDs están en el arreglo del carrito
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, name, slug, tag, description, price, stock, is_active, created_at, image_url,
        categories ( id, name, slug ),
        product_images ( image_url, is_primary )
      `)
      .in("id", ids)
      .eq("is_active", true);

    if (error) {
      console.error("Error al consultar productos del carrito en Supabase:", error);
      return NextResponse.json({ error: "Error al obtener los productos" }, { status: 500 });
    }

    // Formateamos cada producto utilizando tu helper existente
    const formattedProducts = (data || []).map((prod) => {
      const baseFormatted = formatProduct(prod);
      const imagesList = prod.product_images && prod.product_images.length > 0
        ? prod.product_images.map((img: { image_url: string }) => img.image_url)
        : [prod.image_url || "https://res.cloudinary.com/dk0mjtyze/image/upload/v1768884165/assets-manager/obnght3c0lewythyn7dc.png"];

      return {
        ...baseFormatted,
        images: imagesList,
      };
    });

    return NextResponse.json({ data: formattedProducts }, { status: 200 });
  } catch (error) {
    console.error("Error en POST /api/cart:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}