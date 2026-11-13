import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/app/utils/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Se requiere un mensaje válido." },
                { status: 400 }
            );
        }

        // 1. Generar el embedding de la pregunta del usuario
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: message,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 2. Conectar a Supabase y buscar productos similares usando la función RPC `match_products`
        const supabase = await createClient();

        const { data: matchedProducts, error: matchError } = await supabase.rpc(
            "match_products",
            {
                query_embedding: queryEmbedding,
                match_threshold: 0.3, // Umbral de similitud (ajustable)
                match_count: 4,       // Máximo de productos a traer como contexto
            }
        );

        if (matchError) {
            console.error("Error al buscar productos por similitud:", matchError);
            return NextResponse.json(
                { error: "Error al buscar información en la base de datos." },
                { status: 500 }
            );
        }

        // 3. Si hay productos relevantes, traemos su información completa (incluyendo precio, stock y nombre real de products)
        let contextText = "";
        let fullProducts: any[] = [];

        if (matchedProducts && matchedProducts.length > 0) {
            const productIds = matchedProducts.map((p: any) => p.product_id);

            const { data } = await supabase
                .from("products")
                .select(`
          id,
          name,
          description,
          price,
          stock,
          tag,
          categories (name),
          product_images (image_url, is_primary)
        `)
                .in("id", productIds);

            if (data && data.length > 0) {
                fullProducts = data;
                contextText = fullProducts
                    .map((p: any) => {
                        const primaryImg =
                            p.product_images?.find((img: any) => img.is_primary)?.image_url ||
                            p.product_images?.[0]?.image_url ||
                            "Sin imagen";
                        return `- ID: ${p.id} | Nombre: ${p.name} | Categoría: ${p.categories?.name || "N/A"} | Precio: $${p.price} USD | Stock: ${p.stock} unidades | Etiqueta: ${p.tag || "Ninguna"} | Descripción: ${p.description || "N/A"} | Imagen: ${primaryImg}`;
                    })
                    .join("\n");
            }
        }

        // 4. Construir el System Prompt para OpenAI
        const systemPrompt = `
            Eres el asistente virtual experto y amigable de "MyCatalog", una tienda en línea de tecnología, computadoras, cámaras y accesorios.
            Tu objetivo es ayudar a los clientes a encontrar productos y resolver dudas basados EXCLUSIVAMENTE en el contexto de productos recuperados.

            REGLAS ESTRICTAS DE FORMATO:
            Para cada producto que decidas recomendar o mencionar, DEBES seguir exactamente esta estructura en formato de texto plano (sin inventar viñetas raras ni markdown de imágenes):

            - **Nombre:** [Nombre exacto del producto]
            - **Categoría:** [Categoría]
            - **Precio:** $[Precio] USD
            - **Stock:** [Número] disponibles
            - **Descripción:** [Breve descripción comercial]

            REGLA CRÍTICA: NUNCA incluyas URLs, enlaces web ni sintaxis de imágenes Markdown (![...]) en tu respuesta de texto. La interfaz visual mostrará automáticamente las fotos y botones de compra debajo de tu mensaje.

            Si hay varios productos, sepáralos claramente con saltos de línea. No inventes productos ni precios que no estén en el contexto. Sé conciso, profesional y directo.

            Contexto de productos encontrados en la tienda:
            ${contextText || "No se encontraron productos directamente relacionados con la consulta en este momento."}
            `;

        // 5. Llamar a GPT-4o-mini para generar la respuesta final
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
            ],
            temperature: 0.3,
        });

        const reply = completion.choices[0].message.content;

        // Mapeamos los productos completos para asegurar que el frontend reciba la imagen limpia formateada
        const formattedProductsForChat = (fullProducts || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock,
            image_url:
                p.product_images?.find((img: any) => img.is_primary)?.image_url ||
                p.product_images?.[0]?.image_url ||
                null,
        }));

        console.log(formattedProductsForChat);

        return NextResponse.json({
            reply,
            products: formattedProductsForChat
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error interno en /api/chat:", error);
        return NextResponse.json(
            { error: "Error interno del servidor en el chat." },
            { status: 500 }
        );
    }
}