"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Producto } from "@/app/types/product";

// Componente interno que consume los params asíncronos
function ProductoDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchProducto() {
      try {
        const res = await fetch("/api/productos");
        if (!res.ok) throw new Error("Error al consultar API");
        const productos: Producto[] = await res.json();
        const encontrado = productos.find((p) => String(p.id) === String(id));
        setProducto(encontrado || null);
      } catch (error) {
        console.error("Error cargando detalle del producto:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducto();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500 text-sm font-mono animate-pulse">
          Cargando detalle del producto...
        </p>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Producto no encontrado</h1>
        <p className="mt-2 text-slate-600 text-sm">
          El producto que buscas no existe o ya no está disponible.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-4 py-2 text-xs font-semibold text-white bg-slate-950 rounded-lg"
        >
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const mensajeWhatsApp = encodeURIComponent(
    `Hola, me interesa obtener más información sobre el producto: ${producto.nombre} ($${producto.precio} USD).`
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10">
      
      {/* FOTO DEL PRODUCTO */}
      <div className="relative w-full h-80 sm:h-96 bg-slate-100/80 rounded-2xl overflow-hidden flex items-center justify-center p-6">
        {producto.tag && (
          <span className="absolute top-4 left-4 z-10 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-white text-slate-800 border border-slate-200 rounded-md shadow-sm">
            {producto.tag}
          </span>
        )}
        <Image
          src={
            producto.imagen ||
            "https://res.cloudinary.com/dk0mjtyze/image/upload/v1768884165/assets-manager/obnght3c0lewythyn7dc.png"
          }
          alt={producto.nombre}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-6"
          priority
        />
      </div>

      {/* INFORMACIÓN Y SPECS */}
      <div className="flex flex-col justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-mono font-semibold">
            {producto.categoria}
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            {producto.nombre}
          </h1>

          <div className="mt-4 pb-6 border-b border-slate-100">
            <span className="text-3xl font-bold text-slate-950 font-mono">
              ${producto.precio} USD
            </span>
          </div>

          {/* FICHA TÉCNICA / DESCRIPCIÓN */}
          <div className="mt-6 space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-mono font-semibold text-slate-500">
              Especificaciones Técnicas
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              {producto.descripcion || "Sin especificaciones adicionales proporcionadas."}
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${mensajeWhatsApp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-3 px-6 text-center text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Consultar Disponibilidad vía WhatsApp</span>
          </a>
        </div>

      </div>

    </div>
  );
}

// Componente Principal de la Ruta
export default function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* BOTÓN VOLVER */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
          >
            ← Volver al catálogo
          </Link>
        </div>

        {/* CONTENIDO DENTRO DE SUSPENSE */}
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <p className="text-slate-500 text-sm font-mono animate-pulse">
                Cargando producto...
              </p>
            </div>
          }
        >
          <ProductoDetalleContenido params={params} />
        </Suspense>

      </main>
    </div>
  );
}