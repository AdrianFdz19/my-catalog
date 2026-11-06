import { Producto } from "@/app/types/product";
import { NextResponse } from "next/server";
import Papa from "papaparse";

// Reemplaza con la URL publicada de tu Google Sheet en formato CSV
const GOOGLE_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL || "";

export async function GET() {
  try {
    // Revalida los datos desde Google Sheets cada 60 segundos
    const res = await fetch(GOOGLE_SHEET_CSV_URL, {
      next: { revalidate: 60 },
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
      },
    });

    if (!res.ok) {
      throw new Error(`Error al consultar Google Sheets: ${res.statusText}`);
    }

    const csvText = await res.text();

    // Parseo del CSV en el servidor de Next.js
    const parsed = Papa.parse<Producto>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    // Filtramos únicamente los productos con disponible = TRUE
    const productosDisponibles = parsed.data.filter(
      (p) => p.disponible && p.disponible.toUpperCase() === "TRUE"
    );

    return NextResponse.json(productosDisponibles, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Error en /api/productos:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los productos." },
      { status: 500 }
    );
  }
}