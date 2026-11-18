import { createClient } from "@/app/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestUuid = searchParams.get("uuid");

    if (!guestUuid) {
      return NextResponse.json({ lead: null }, { status: 200 });
    }

    const supabase = await createClient();

    const { data: lead, error } = await supabase
      .from("users")
      .select("name, phone, email")
      .eq("guest_uuid", guestUuid)
      .single();

    if (error || !lead) {
      return NextResponse.json({ lead: null }, { status: 200 });
    }

    return NextResponse.json({ lead }, { status: 200 });
  } catch (error) {
    console.error("Error al consultar guest lead:", error);
    return NextResponse.json({ lead: null }, { status: 200 });
  }
}