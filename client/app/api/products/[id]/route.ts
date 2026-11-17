import { formatProduct } from "@/app/lib/products";
import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("products")
            .select(
                `
                id, name, slug, tag, description, price, stock, is_active, created_at, image_url,
                categories ( id, name, slug ),
                product_images ( image_url, is_primary )
                `
            )
            .eq("id", id)
            .eq("is_active", true)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: "Producto no encontrado" },
                { status: 404 }
            );
        }

        // Formateamos el producto base
        const formatted = formatProduct(data);

        // Agregamos o unificamos las imágenes provenientes de product_images
        const imagesList = data.product_images && data.product_images.length > 0
            ? data.product_images.map((img: { image_url: string }) => img.image_url)
            : [data.image_url || "https://res.cloudinary.com/dk0mjtyze/image/upload/v1768884165/assets-manager/obnght3c0lewythyn7dc.png"];

        // Adjuntamos el array de imágenes a la respuesta que espera el frontend
        const responseData = {
            ...formatted,
            images: imagesList,
        };

        return NextResponse.json({ data: responseData }, { status: 200 });
    } catch (error) {
        console.error("Error en GET /api/products/[id]:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}