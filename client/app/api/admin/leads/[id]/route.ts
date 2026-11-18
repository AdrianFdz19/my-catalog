import { createClient } from "@/app/utils/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Validar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Obtener datos del prospecto (lead)
    const { data: lead, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (userError || !lead) {
      return NextResponse.json(
        { error: "Prospecto no encontrado." },
        { status: 404 }
      );
    }

    // 3. Obtener ítems en carrito usando product_id que es la FK en cart_items
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        created_at,
        products:product_id (
          id,
          name,
          slug,
          price,
          product_images (
            image_url,
            is_primary
          )
        )
      `)
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    if (cartError) {
      console.error("Error al cargar ítems del carrito:", cartError.message);
    }

    // 4. Mapear resultados para limpiar la estructura de la imagen
    const formattedItems = (cartItems || []).map((item: any) => {
      const product = item.products;
      if (!product) return item;

      const primaryImgObj =
        product.product_images?.find((img: any) => img.is_primary) ||
        product.product_images?.[0];

      return {
        id: item.id,
        quantity: item.quantity,
        created_at: item.created_at,
        products: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image_url: primaryImgObj ? primaryImgObj.image_url : null,
        },
      };
    });

    return NextResponse.json(
      {
        lead,
        items: formattedItems,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error interno en GET /api/admin/leads/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}