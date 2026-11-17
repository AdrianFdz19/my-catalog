import { formatProduct } from "@/app/lib/products";
import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// PATCH: Actualizar un producto existente de forma parcial
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // 1. Validar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // 2. Extraer datos del body
        const body = await request.json();
        const { name, slug, category_id, description, price, stock, is_active, images, tag } = body;

        if (!name || !slug || !category_id || price === undefined) {
            return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
        }

        // Definir la portada principal (la primera imagen del array)
        const primaryImageUrl = images && images.length > 0 ? images[0] : null;

        // 3. Actualizar datos principales en la tabla `products`
        const { error: updateError } = await supabase
            .from("products")
            .update({
                name,
                slug,
                category_id: Number(category_id),
                description,
                price: parseFloat(price),
                stock: parseInt(stock, 10) || 0,
                image_url: primaryImageUrl,
                is_active: is_active ?? true,
                tag: tag ? tag.trim() : null,
            })
            .eq("id", id);

        if (updateError) {
            throw new Error(`Error al actualizar el producto: ${updateError.message}`);
        }

        // 4. Sincronizar la tabla hija `product_images`
        // Estrategia limpia: Borramos las imágenes anteriores del producto y reinsertamos las actuales
        const { error: deleteImagesError } = await supabase
            .from("product_images")
            .delete()
            .eq("product_id", id);

        if (deleteImagesError) {
            throw new Error(`Error al limpiar imágenes anteriores: ${deleteImagesError.message}`);
        }

        if (images && Array.isArray(images) && images.length > 0) {
            const imageRecords = images.map((url: string, index: number) => ({
                product_id: Number(id),
                image_url: url,
                is_primary: index === 0, // La primera imagen es la portada
            }));

            const { error: insertImagesError } = await supabase
                .from("product_images")
                .insert(imageRecords);

            if (insertImagesError) {
                throw new Error(`Error al registrar las nuevas imágenes: ${insertImagesError.message}`);
            }
        }

        return NextResponse.json({ success: true, message: "Producto actualizado correctamente" }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error en PATCH product:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE: Eliminar un producto del inventario
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // 1. Verificar autenticación del administrador
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // 2. Eliminar de Supabase
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Producto eliminado correctamente" }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}