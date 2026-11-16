"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: number | string;
  name: string;
  description?: string;
  icon?: string;
}

interface Product {
  id: number | string;
  name: string;
  slug: string;
  price: number;
  description: string;
  tag?: string;
  image_url?: string;
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

function CategoryContent({ params }: PageProps) {
  const { slug } = use(params);

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorNotFound, setErrorNotFound] = useState(false);

  useEffect(() => {
    async function fetchCategoryData() {
      if (!slug) return;

      try {
        setLoading(true);
        // Hacemos el fetch a nuestra propia API Route segura en el servidor
        const res = await fetch(`/api/categories/category/${slug}`);
        
        if (!res.ok) {
          setErrorNotFound(true);
          return;
        }

        const data = await res.json();
        setCategory(data.category);
        setProducts(data.products);
      } catch (err) {
        console.error("Error al consumir la API de categoría:", err);
        setErrorNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 text-center font-mono text-xs text-slate-400">
        Cargando categoría...
      </div>
    );
  }

  if (errorNotFound || !category) {
    return (
      <div className="min-h-screen bg-slate-50 py-24 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Categoría no encontrada</h1>
        <p className="text-xs text-slate-500">La categoría que buscas no existe o fue eliminada.</p>
        <Link
          href="/"
          className="inline-block text-xs font-semibold text-white bg-slate-950 px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div className="space-y-3">
          <nav className="text-xs font-medium text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition">
              Inicio
            </Link>{" "}
            / <span className="text-slate-900">Categoría</span>
          </nav>

          <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
            <span className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
              {category.icon || "📁"}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-xs text-slate-500 mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Listado de Productos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Productos Disponibles
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
              {products.length} ítems
            </span>
          </div>

          {products.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center">
              <p className="text-sm font-medium text-slate-600">
                No hay productos en esta categoría por el momento.
              </p>
              <Link
                href="/"
                className="inline-block mt-4 text-xs font-semibold text-white bg-slate-950 px-4 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                Volver al inicio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <Link
                  key={prod.id}
                  href={`/products/${prod.slug}`}
                  className="group bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                    <Image
                      src={prod.image_url || "https://via.placeholder.com/400"}
                      alt={prod.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                    {prod.tag && (
                      <span className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full shadow-xs">
                        {prod.tag}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {prod.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                        ${Number(prod.price).toLocaleString()}{" "}
                        <span className="text-xs font-normal text-slate-400">USD</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-600 group-hover:underline">
                        Ver detalles →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function CategoryPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 py-12 text-center text-sm font-mono text-slate-400">Cargando...</div>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}