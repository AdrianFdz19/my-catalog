import { createClient } from "@/app/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, cartIds, guestUuid } = body;

    if (!name?.trim() || !phone?.trim() || !cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
      return NextResponse.json(
        { error: "El nombre y el teléfono son obligatorios para enviar la cotización." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let userId: string;

    if (guestUuid) {
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .upsert(
          {
            guest_uuid: guestUuid,
            name: name.trim(),
            phone: phone.trim(),
            email: email?.trim() || null,
          },
          { onConflict: "guest_uuid" }
        )
        .select()
        .single();

      if (userError || !userRecord) {
        console.error("Error al hacer upsert del lead:", userError);
        return NextResponse.json(
          { error: "No se pudo registrar la información del prospecto." },
          { status: 500 }
        );
      }
      userId = userRecord.id;
    } else {
      const { data: newLead, error: insertError } = await supabase
        .from("users")
        .insert({
          name: name.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
        })
        .select()
        .single();

      if (insertError || !newLead) {
        return NextResponse.json({ error: "Error al crear usuario." }, { status: 500 });
      }
      userId = newLead.id;
    }

    // 🧹 IMPORTANTE: Eliminar los ítems anteriores de este usuario para evitar basura o duplicados acumulados
    await supabase.from("cart_items").delete().eq("user_id", userId);

    // Mapear e insertar los productos actuales del carrito
    const counts: Record<number, number> = {};
    cartIds.forEach((id) => {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        counts[numericId] = (counts[numericId] || 0) + 1;
      }
    });

    const cartItemsPayload = Object.entries(counts).map(([productId, quantity]) => ({
      user_id: userId,
      product_id: Number(productId),
      quantity,
    }));

    const { error: cartError } = await supabase
      .from("cart_items")
      .insert(cartItemsPayload);

    if (cartError) {
      console.error("Error al guardar ítems del carrito:", cartError);
      return NextResponse.json(
        { error: "Se registró el usuario pero hubo un error al guardar los ítems." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Cotización guardada exitosamente.", userId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error interno en POST /api/cart/sync:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}