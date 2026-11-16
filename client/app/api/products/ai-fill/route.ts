import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const body = await request.json();
    const { rawText } = body;

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json(
        { error: "Se requiere un texto válido para analizar." },
        { status: 400 }
      );
    }

    // Prompt del sistema experto en extracción de datos para tu e-commerce
    const systemPrompt = `
      Eres un asistente experto en extracción de datos para comercio electrónico.
      Tu trabajo es analizar descripciones libres, fichas técnicas o textos pegados por el usuario y extraer exactamente los siguientes campos para rellenar un formulario de productos de una tienda en línea ("MyCatalog"):

      Devuelve ÚNICAMENTE un objeto JSON válido con estas llaves exactas (sin bloques de markdown adicionales ni texto extra fuera del JSON):
      {
        "name": "Nombre comercial claro y limpio del producto",
        "slug": "nombre-del-producto-en-formato-slug-sin-acentos-ni-caracteres-especiales",
        "description": "Una descripción comercial atractiva y bien redactada basada en el texto",
        "price": 0.0, (debe ser un número flotante o entero, si no hay precio pon 0)
        "stock": "10", (en formato string tal como lo usa el formulario, por defecto "1" si no se especifica)
        "tag": "Una etiqueta corta destacada, por ejemplo: 'Nuevo', 'Oferta', 'Destacado' o '' si no aplica"
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText },
      ],
      temperature: 0.1, // Baja temperatura para que sea preciso y estricto con el JSON
      response_format: { type: "json_object" }, // Forzamos a OpenAI a responder estrictamente en formato JSON
    });

    const aiResponseText = completion.choices[0].message.content;
    const parsedData = JSON.parse(aiResponseText || "{}");

    return NextResponse.json(parsedData, { status: 200 });
  } catch (error: any) {
    console.error("Error al procesar la IA para autocompletar producto:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el texto con IA." },
      { status: 500 }
    );
  }
}