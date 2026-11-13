import { NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función para generar embeddings con OpenAI
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Consultamos productos activos, haciendo JOIN con categories y product_images
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        tag,
        description,
        price,
        stock,
        is_active,
        created_at,
        categories (
          id,
          name,
          slug
        ),
        product_images (
          image_url,
          is_primary
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener productos de Supabase:", error);
      return NextResponse.json(
        { error: "No se pudieron obtener los productos." },
        { status: 500 }
      );
    }

    // Mapeamos cada producto para entregar directamente su imagen principal limpia
    const formattedProducts = products.map((product: any) => {
      // Buscamos la marcada como is_primary, o tomamos la primera de la lista
      const primaryImgObj =
        product.product_images?.find((img: any) => img.is_primary) ||
        product.product_images?.[0];

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        is_active: product.is_active,
        category: product.categories?.name || "Sin categoría",
        category_slug: product.categories?.slug || "",
        image_url: primaryImgObj ? primaryImgObj.image_url : null,
        tag: product.tag,
      };
    });

    return NextResponse.json(formattedProducts, {
      status: 200,
    });
  } catch (error) {
    console.error("Error interno en GET /api/products:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Validar autenticación del administrador
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión como administrador." },
        { status: 401 }
      );
    }

    // 2. Extraer el body de la petición
    const body = await request.json();
    const { name, slug, category_id, description, price, stock, is_active, images, tag } = body;

    if (!name || !slug || !category_id || price === undefined) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para registrar el producto." },
        { status: 400 }
      );
    }

    // Tomamos la primera imagen como la portada principal para products.image_url (si existe)
    const primaryImageUrl = images && images.length > 0 ? images[0] : null;

    // 3. Insertar el producto principal (incluyendo image_url para la portada y category_id como número)
    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert([
        {
          name,
          slug,
          category_id: Number(category_id), // Aseguramos que sea número (int4)
          description,
          price: parseFloat(price),
          stock: parseInt(stock, 10) || 0,
          image_url: primaryImageUrl, // Guardamos la portada principal aquí
          is_active: is_active ?? true,
          tag: tag ? tag.trim() : null,
        },
      ])
      .select("id")
      .single();

    if (insertError || !newProduct) {
      console.error("Error al insertar producto en Supabase:", insertError);
      return NextResponse.json(
        { error: `Error en la base de datos (Categoría o campos inválidos): ${insertError?.message}` },
        { status: 500 }
      );
    }

    const productId = newProduct.id;

    // 4. Insertar todas las imágenes en la tabla hija `product_images`
    if (images && Array.isArray(images) && images.length > 0) {
      const imageRecords = images.map((url: string, index: number) => ({
        product_id: productId,
        image_url: url,
        is_primary: index === 0, // La primera es portada
      }));

      const { error: imagesError } = await supabase
        .from("product_images")
        .insert(imageRecords);

      if (imagesError) {
        console.error("Error al insertar imágenes en tabla hija:", imagesError);
        return NextResponse.json(
          { error: `El producto se creó, pero falló el registro de imágenes: ${imagesError.message}` },
          { status: 500 }
        );
      }
    }

    // 5. Generar y guardar el Embedding para el RAG
    try {
      // Armamos un texto rico que contenga toda la info clave del producto
      const textToEmbed = `Producto: ${name}. Categoría ID: ${category_id}. Precio: $${price} USD. Stock: ${stock}. Descripción: ${description || "Sin descripción"}. Etiqueta: ${tag || "Ninguna"}`;

      const vector = await generateEmbedding(textToEmbed);

      const { error: embeddingError } = await supabase
        .from("product_embeddings")
        .insert([
          {
            product_id: productId,
            chunk_text: textToEmbed,
            embedding: vector, // Supabase con pgvector acepta arreglos de números directamente
          },
        ]);

      if (embeddingError) {
        console.error("Error al guardar el embedding en Supabase:", embeddingError);
        // No detenemos la respuesta principal, pero lo logueamos
      }
    } catch (embedErr) {
      console.error("Error al comunicarse con OpenAI para el embedding:", embedErr);
    }

    return NextResponse.json(
      { success: true, product_id: productId },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error interno en el servidor:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el producto." },
      { status: 500 }
    );
  }
}