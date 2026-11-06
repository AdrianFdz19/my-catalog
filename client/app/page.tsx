"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Producto } from "./types/product";

const CATEGORIAS = ["Todos", "Laptops & MacBooks", "Cámaras de Seguridad", "Accesorios"];

// Componente interno que consume useSearchParams
function CatalogoContenido() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Todos");

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() || "";

  // Carga de productos desde la API Handler
  useEffect(() => {
    async function fetchProductos() {
      try {
        const res = await fetch("/api/productos");
        if (!res.ok) throw new Error("Error al cargar productos");
        const data: Producto[] = await res.json();
        setProductos(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProductos();
  }, []);

  // Filtrado combinado
  const productosFiltrados = productos.filter((producto) => {
    const cumpleCategoria =
      categoriaSeleccionada === "Todos" || producto.categoria === categoriaSeleccionada;

    const cumpleBusqueda =
      searchQuery === "" ||
      producto.nombre.toLowerCase().includes(searchQuery) ||
      producto.descripcion.toLowerCase().includes(searchQuery) ||
      producto.categoria.toLowerCase().includes(searchQuery);

    return cumpleCategoria && cumpleBusqueda;
  });

  return (
    <>
      {/* INDICADOR DE BÚSQUEDA ACTIVA */}
      {searchQuery && (
        <div className="mb-6 flex items-center justify-between bg-slate-200/50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs">
          <span className="text-slate-700">
            Resultados para la búsqueda: <strong className="text-slate-950 font-semibold">&ldquo;{searchQuery}&rdquo;</strong>
          </span>
          <Link href="/" className="text-slate-500 hover:text-slate-950 font-medium underline">
            Limpiar búsqueda
          </Link>
        </div>
      )}

      {/* FILTROS POR CATEGORÍA */}
      <section className="mb-8 sm:mb-10">

        {/* DESPLEGABLE TÁCTIL PARA CELULARES (< 640px) */}
        <div className="block sm:hidden w-full">
          <label htmlFor="categoria-select" className="sr-only">
            Seleccionar Categoría
          </label>
          <div className="relative">
            <select
              id="categoria-select"
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 shadow-sm transition-all"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat} className="text-slate-800 bg-white py-2">
                  {cat === "TODOS" ? "Todas las Categorías" : cat}
                </option>
              ))}
            </select>

            {/* ÍCONO DE FLECHA DROPDOWN */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg
                className="w-4 h-4 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* BOTONES HORIZONTALES PARA ESCRITORIO (>= 640px) */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto w-full pb-2 no-scrollbar">
          {CATEGORIAS.map((cat) => {
            const isActive = categoriaSeleccionada === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-200 border ${isActive
                    ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </section>

      {/* GRID DE PRODUCTOS */}
      <section>
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-slate-500 text-sm font-mono animate-pulse">
              Cargando catálogo...
            </p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-300 rounded-2xl">
            <p className="text-slate-500 text-sm">No encontramos productos que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {productosFiltrados.map((producto) => (
              <article
                key={producto.id}
                className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                {/* TAG / INSIGNIA */}
                {producto.tag && (
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 text-slate-800 border border-slate-200 backdrop-blur-md rounded-md shadow-sm">
                    {producto.tag}
                  </span>
                )}

                {/* CONTENEDOR DE IMAGEN (Adaptativo en altura) */}
                <div className="relative w-full h-36 sm:h-52 bg-slate-100/70 overflow-hidden flex items-center justify-center p-2 sm:p-4">
                  <Image
                    src={producto.imagen || "https://res.cloudinary.com/dk0mjtyze/image/upload/v1768884165/assets-manager/obnght3c0lewythyn7dc.png"}
                    alt={producto.nombre}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out p-2 sm:p-4"
                  />
                </div>

                {/* INFORMACIÓN DEL PRODUCTO */}
                <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between border-t border-slate-100">
                  <div>
                    <p className="text-[9px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-mono font-medium">
                      {producto.categoria}
                    </p>
                    <h2 className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-2 sm:line-clamp-1 min-h-[2rem] sm:min-h-0">
                      {producto.nombre}
                    </h2>
                  </div>

                  {/* PRECIO Y ACCIONES */}
                  <div className="mt-3 sm:mt-6 pt-2 border-t border-slate-100/60 sm:border-t-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm sm:text-base font-bold text-slate-950 tracking-tight font-mono">
                      ${producto.precio} <span className="text-[10px] text-slate-500 font-normal">USD</span>
                    </span>

                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                      <Link
                        href={`/producto/${producto.id}`}
                        className="w-full text-center py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md sm:rounded-lg transition-all"
                      >
                        Ver
                      </Link>
                      <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Hola, me interesa el producto: ${producto.nombre} ($${producto.precio} USD). ¿Sigue disponible?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-md sm:rounded-lg transition-all"
                      >
                        Cotizar
                      </a>
                    </div>
                  </div>

                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// Componente Principal de la Ruta
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* HERO SECTION */}
        <section className="mb-14 text-left border-b border-slate-200 pb-10">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-mono uppercase tracking-widest text-slate-600 bg-slate-200/60 border border-slate-300 rounded-md">
            Mi Catálogo
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 leading-tight">
            Tecnología y Seguridad <br />
            <span className="text-slate-400">Diseño & Rendimiento</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Explora nuestro catálogo de laptops, MacBooks y sistemas de vigilancia de última generación.
          </p>
        </section>

        {/* CONTENIDO DENTRO DE SUSPENSE */}
        <Suspense fallback={
          <div className="py-20 text-center">
            <p className="text-slate-500 text-sm font-mono animate-pulse">Cargando catálogo...</p>
          </div>
        }>
          <CatalogoContenido />
        </Suspense>

      </main>
    </div>
  );
}