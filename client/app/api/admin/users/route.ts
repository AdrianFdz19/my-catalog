import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Validar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Consultamos la tabla public.users ordenada del más reciente al más antiguo
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error al obtener usuarios desde Supabase:", error);
            return NextResponse.json(
                { error: "Error al cargar la lista de usuarios" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, data: data || [] },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error interno en GET /api/admin/users:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}