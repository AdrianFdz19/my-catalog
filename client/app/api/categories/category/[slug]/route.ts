import { createClient } from "@/app/utils/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // 1. Buscar la categoría por su slug
    const { data: category, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();

    if (catError || !category) {
      return NextResponse.json(
        { error: "Categoría no encontrada." },
        { status: 404 }
      );
    }

    // 2. Consultar los productos activos de esta categoría haciendo JOIN con product_images
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        tag,
        description,
        price,
        stock,
        is_active,
        created_at,
        product_images (
          image_url,
          is_primary
        )
      `)
      .eq("category_id", category.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (prodError) {
      console.error("Error al obtener productos de la categoría:", prodError);
      return NextResponse.json(
        { error: "No se pudieron obtener los productos de esta categoría." },
        { status: 500 }
      );
    }

    // 3. Mapear los productos para entregar la imagen principal limpia (igual que tu API de productos)
    const formattedProducts = products.map((product: any) => {
      const primaryImgObj =
        product.product_images?.find((img: any) => img.is_primary) ||
        product.product_images?.[0];

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        is_active: product.is_active,
        image_url: primaryImgObj ? primaryImgObj.image_url : null,
        tag: product.tag,
        product_images: product.product_images,
      };
    });

    return NextResponse.json(
      {
        category,
        products: formattedProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error interno en GET /api/categories/[slug]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}