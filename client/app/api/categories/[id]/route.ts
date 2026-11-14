import { createClient } from "@/app/utils/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// PATCH: Actualizar una categoría existente de forma parcial
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // 1. Verificar autenticación del administrador
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // 2. Obtener los datos enviados en la petición
        const body = await request.json();
        const { name, description, icon, slug } = body;

        // Construir objeto dinámico solo con los campos provistos
        const updateData: Record<string, unknown> = {};
        if (name !== undefined) {
            updateData.name = name;
            // Si actualizan el nombre y no mandan slug, podemos regenerarlo opcionalmente
            updateData.slug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        }
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No se proporcionaron campos para actualizar" }, { status: 400 });
        }

        // 3. Actualizar en Supabase
        const { data, error } = await supabase
            .from("categories")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE: Eliminar una categoría
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
            .from("categories")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Categoría eliminada correctamente" }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}