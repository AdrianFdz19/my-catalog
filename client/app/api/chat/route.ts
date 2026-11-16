import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/app/utils/supabase/server";
import { getSystemPrompt } from "@/app/utils/ai/prompts";

export async function POST(request: Request) {

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const { message, history } = await request.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Se requiere un mensaje válido." },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Consultar TODAS las categorías activas para tenerlas siempre en el contexto global del RAG
        const { data: categoriesData } = await supabase
            .from("categories")
            .select("id, name, slug, description");

        const categoriesContext = (categoriesData || [])
            .map((c: any) => `- Categoría: ${c.name} (Slug: /category/${c.slug}) | Descripción: ${c.description || "Sin descripción"}`)
            .join("\n");

        // 2. Generar el embedding de la pregunta del usuario
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: message,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 3. Buscar productos similares usando la función RPC `match_products`
        const { data: matchedProducts, error: matchError } = await supabase.rpc(
            "match_products",
            {
                query_embedding: queryEmbedding,
                match_threshold: 0.25, // Ligeramente más flexible para capturar más contexto útil
                match_count: 4,
            }
        );

        if (matchError) {
            console.error("Error al buscar productos por similitud:", matchError);
        }

        // 4. Traer la información completa de los productos encontrados
        let productsContext = "";
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
          categories (name, slug),
          product_images (image_url, is_primary)
        `)
                .in("id", productIds)
                .eq("is_active", true);

            if (data && data.length > 0) {
                fullProducts = data;
                productsContext = fullProducts
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

        // 5. Construir el System Prompt unificado con categorías y productos
        const systemPrompt = getSystemPrompt(productsContext, categoriesContext);

        // 6. Llamar a GPT-4o-mini
        // Construimos los mensajes para OpenAI: System Prompt + Historial reciente + Mensaje actual
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...(history || []), // 👈 Inyectamos la memoria de la sesión aquí
                { role: "user", content: message },
            ],
            temperature: 0.3,
        });

        const reply = completion.choices[0].message.content;

        // Mapear productos para la interfaz visual
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