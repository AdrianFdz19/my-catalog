"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { FormattedProduct } from "../../../lib/products";

// Número de WhatsApp institucional hardcodeado para evitar errores de inyección en contenedores
const WHATSAPP_PHONE_NUMBER = "522291276558";

function ProductoDetalleContenido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [producto, setProducto] = useState<FormattedProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado para la imagen principal seleccionada
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Estado para controlar el modal de zoom
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchProducto() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          setProducto(null);
          return;
        }
        const result = await res.json();
        setProducto(result.data || null);
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
          className="mt-6 inline-block px-4 py-2 text-xs font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const defaultFallbackImage = "https://res.cloudinary.com/dk0mjtyze/image/upload/v1768884165/assets-manager/obnght3c0lewythyn7dc.png";
  
  const productImages: string[] = 
    (producto as any).images && Array.isArray((producto as any).images) && (producto as any).images.length > 0
      ? (producto as any).images
      : [producto.image_url || defaultFallbackImage];

  const currentImage = productImages[activeImageIndex] || defaultFallbackImage;

  // Funciones para navegar entre imágenes de forma circular
  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const mensajeWhatsApp = encodeURIComponent(
    `Hola, me interesa obtener más información sobre el producto: ${producto.name} ($${producto.price} USD). ¿Sigue disponible?`
  );

  return (
    <>
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10">
        
        {/* SECCIÓN DE GALERÍA DE IMÁGENES */}
        <div className="flex flex-col gap-4">
          {/* Imagen Principal con flechas integradas si hay más de 1 imagen */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="relative w-full h-80 sm:h-[420px] bg-slate-100/80 rounded-2xl overflow-hidden flex items-center justify-center p-6 border border-slate-100 cursor-zoom-in group"
            title="Haz clic para ampliar la imagen"
          >
            {producto.tag && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200/60 rounded-md shadow-sm">
                {producto.tag}
              </span>
            )}
            
            {/* Indicador visual flotante de zoom */}
            <div className="absolute bottom-4 right-4 z-10 bg-slate-950/70 text-white text-[10px] font-mono px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-md">
              <span>🔍 Ampliar</span>
            </div>

            <Image
              key={currentImage}
              src={currentImage}
              alt={`${producto.name} - Vista ${activeImageIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-4 transition-all duration-300 group-hover:scale-105"
              priority
            />

            {/* Flechas de navegación en la tarjeta principal (solo si hay más de 1 imagen) */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-slate-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Anterior"
                >
                  ❮
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-slate-800 w-9 h-9 rounded-full flex items-center justify-center shadow-md border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Siguiente"
                >
                  ❯
                </button>
              </>
            )}
          </div>

          {/* Miniaturas (Thumbnails) */}
          {productImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {productImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border-2 transition-all ${
                    activeImageIndex === idx 
                      ? "border-slate-950 ring-2 ring-slate-950/20 scale-105" 
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Miniatura ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFORMACIÓN Y SPECS */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-mono font-semibold">
              {producto.category}
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {producto.name}
            </h1>

            <div className="mt-4 pb-6 border-b border-slate-100">
              <span className="text-3xl font-bold text-slate-950 font-mono">
                ${producto.price} USD
              </span>
            </div>

            {/* FICHA TÉCNICA / DESCRIPCIÓN */}
            <div className="mt-6 space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-mono font-semibold text-slate-500">
                Especificaciones Técnicas
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                {producto.description || "Sin especificaciones adicionales proporcionadas."}
              </p>
            </div>
          </div>

          {/* ACCIONES */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
            <a
              href={`https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${mensajeWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3.5 px-6 text-center text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Consultar Disponibilidad vía WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* MODAL / LIGHTBOX DE PANTALLA COMPLETA CON FLECHAS */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-12 animate-fadeIn"
        >
          {/* Botón de cierre */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 z-50 text-white bg-slate-900/80 hover:bg-slate-900 w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold border border-white/20 transition-colors shadow-lg"
            title="Cerrar"
          >
            ✕
          </button>

          {/* Contador de imágenes en el modal (Ej: 1 / 3) */}
          {productImages.length > 1 && (
            <div className="absolute top-6 left-6 z-50 text-white/80 bg-slate-900/60 font-mono text-xs px-3 py-1.5 rounded-lg border border-white/10">
              {activeImageIndex + 1} / {productImages.length}
            </div>
          )}

          {/* Flecha Izquierda del Modal */}
          {productImages.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 text-white bg-slate-900/70 hover:bg-slate-900 w-12 h-12 rounded-full flex items-center justify-center text-xl border border-white/20 transition-all shadow-xl"
              title="Anterior"
            >
              ❮
            </button>
          )}

          {/* Contenedor de la imagen ampliada */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-5xl h-[82vh] bg-transparent rounded-2xl overflow-hidden flex items-center justify-center"
          >
            <Image
              key={currentImage}
              src={currentImage}
              alt={`${producto.name} - Vista Ampliada`}
              fill
              sizes="100vw"
              className="object-contain p-2"
              priority
            />
          </div>

          {/* Flecha Derecha del Modal */}
          {productImages.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 text-white bg-slate-900/70 hover:bg-slate-900 w-12 h-12 rounded-full flex items-center justify-center text-xl border border-white/20 transition-all shadow-xl"
              title="Siguiente"
            >
              ❯
            </button>
          )}
        </div>
      )}
    </>
  );
}

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