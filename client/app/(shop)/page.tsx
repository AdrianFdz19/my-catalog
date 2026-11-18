"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FormattedProduct } from "../lib/products";
import { createClient } from "@/app/utils/supabase/client";
import ChatWidget from "../components/ChatWidget";
import { useCart } from "@/app/context/CartProvider"; // Ajusta la ruta según donde guardaste CartProvider

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const ITEMS_PER_PAGE = 12;

function CatalogoContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hook del carrito
  const { cartIds, addToCart } = useCart();

  const searchQuery = searchParams.get("q") || "";
  const categoriaSeleccionada = searchParams.get("category") || "Todos";
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const [productos, setProductos] = useState<FormattedProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<string[]>(["Todos"]);

  // Cargar categorías
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          const categoryNames = data.map((cat: { name: string }) => cat.name);
          setCategories(["Todos", ...categoryNames]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // Cargar productos paginados y filtrados desde /api/products
  useEffect(() => {
    async function fetchProductos() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });

        if (categoriaSeleccionada && categoriaSeleccionada !== "Todos") {
          params.set("category", categoriaSeleccionada);
        }
        if (searchQuery) {
          params.set("q", searchQuery);
        }

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Error al cargar productos");

        const result = await res.json();
        setProductos(result.data || []);
        setPagination(result.pagination);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProductos();
  }, [currentPage, categoriaSeleccionada, searchQuery]);

  // Helper para actualizar URL manteniendo filtros activos
  function updateUrlParams(updates: { page?: number; category?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.category !== undefined) {
      if (updates.category === "Todos") params.delete("category");
      else params.set("category", updates.category);
    }

    if (updates.q !== undefined) {
      if (!updates.q) params.delete("q");
      else params.set("q", updates.q);
    }

    if (updates.page !== undefined) {
      if (updates.page <= 1) params.delete("page");
      else params.set("page", String(updates.page));
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/", { scroll: false });
  }

  function handleSelectCategory(cat: string) {
    updateUrlParams({ category: cat, page: 1 });
  }

  function handlePageChange(newPage: number) {
    updateUrlParams({ page: newPage });
    document.getElementById("catalogo-grid")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {/* INDICADOR DE BÚSQUEDA ACTIVA */}
      {searchQuery && (
        <div className="mb-6 flex items-center justify-between bg-slate-200/50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs">
          <span className="text-slate-700">
            Resultados para la búsqueda:{" "}
            <strong className="text-slate-950 font-semibold">&ldquo;{searchQuery}&rdquo;</strong>
          </span>
          <button
            type="button"
            onClick={() => updateUrlParams({ q: "", page: 1 })}
            className="text-slate-500 hover:text-slate-950 font-medium underline cursor-pointer"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {/* FILTROS POR CATEGORÍA */}
      <section id="catalogo-grid" className="mb-8 sm:mb-10 scroll-mt-8">
        {/* DESPLEGABLE TÁCTIL PARA CELULARES (< 640px) */}
        <div className="block sm:hidden w-full">
          <label htmlFor="categoria-select" className="sr-only">
            Seleccionar Categoría
          </label>
          <div className="relative">
            <select
              id="categoria-select"
              value={categoriaSeleccionada}
              onChange={(e) => handleSelectCategory(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 shadow-sm transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="text-slate-800 bg-white py-2">
                  {cat === "Todos" ? "Todas las Categorías" : cat}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* BOTONES HORIZONTALES PARA ESCRITORIO (>= 640px) */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const isActive = categoriaSeleccionada === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {!loading && pagination.totalItems > 0 && (
            <span className="text-xs font-mono text-slate-400 shrink-0">
              {pagination.totalItems} {pagination.totalItems === 1 ? "producto" : "productos"}
            </span>
          )}
        </div>
      </section>

      {/* GRID DE PRODUCTOS */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 sm:h-80 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-300 rounded-2xl">
            <p className="text-slate-500 text-sm">
              No encontramos productos que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {productos.map((producto) => {
                // Verificamos si el producto ya está agregado en el carrito
                const isAdded = cartIds.includes(producto.id);

                return (
                  <article
                    key={producto.id}
                    className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
                  >
                    {/* ETIQUETA / TAG */}
                    {producto.tag && (
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider bg-white/90 text-slate-800 border border-slate-200 backdrop-blur-md rounded-md shadow-sm">
                        {producto.tag}
                      </span>
                    )}

                    {/* BOTÓN DE AGREGAR AL CARRITO / FAVORITOS */}
                    <button
                      type="button"
                      onClick={() => addToCart(producto.id)}
                      title={isAdded ? "Agregado al carrito" : "Agregar al carrito"}
                      className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border backdrop-blur-md transition-all duration-200 shadow-sm cursor-pointer ${
                        isAdded
                          ? "bg-slate-950 text-white border-slate-950 scale-105"
                          : "bg-white/90 text-slate-600 border-slate-200 hover:bg-slate-950 hover:text-white hover:border-slate-950"
                      }`}
                    >
                      {isAdded ? (
                        /* Ícono de check / guardado */
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        /* Ícono de bolsa/carrito de compras */
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                      )}
                    </button>

                    {/* IMAGEN */}
                    <div className="relative w-full h-36 sm:h-52 bg-slate-100/70 overflow-hidden flex items-center justify-center p-2 sm:p-4">
                      <Image
                        src={
                          producto.image_url ||
                          "https://res.cloudinary.com/dk0mjtyze/image/upload/v1768884165/assets-manager/obnght3c0lewythyn7dc.png"
                        }
                        alt={producto.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out p-2 sm:p-4"
                      />
                    </div>

                    {/* DETALLES Y BOTONES */}
                    <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between border-t border-slate-100">
                      <div>
                        <p className="text-[9px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-mono font-medium">
                          {producto.category}
                        </p>
                        <h2 className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-2 sm:line-clamp-1 min-h-[2rem] sm:min-h-0">
                          {producto.name}
                        </h2>
                      </div>

                      <div className="mt-3 sm:mt-6 pt-2 border-t border-slate-100/60 sm:border-t-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-sm sm:text-base font-bold text-slate-950 tracking-tight font-mono">
                          ${producto.price}{" "}
                          <span className="text-[10px] text-slate-500 font-normal">USD</span>
                        </span>

                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                          <Link
                            href={`/product/${producto.id}`}
                            className="w-full text-center py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md sm:rounded-lg transition-all"
                          >
                            Ver
                          </Link>
                          <a
                            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                              `Hola, me interesa el producto: ${producto.name} ($${producto.price} USD). ¿Sigue disponible?`
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
                );
              })}
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-mono text-slate-500">
                  Página <span className="font-semibold text-slate-900">{pagination.page}</span> de{" "}
                  <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    ← Anterior
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1).map(
                      (pageNum) => {
                        const isActive = pageNum === pagination.page;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-mono transition-all cursor-pointer ${
                              isActive
                                ? "bg-slate-950 text-white font-semibold shadow-sm"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsAdmin(true);
      }
    }
    checkUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* HERO SECTION */}
        <section className="mb-14 text-left border-b border-slate-200 pb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
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
          </div>

          {/* BOTÓN DE ADMIN CONDICIONAL */}
          {isAdmin && (
            <div className="shrink-0">
              <Link
                href="/admin/products/add"
                className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                + Add Product
              </Link>
            </div>
          )}
        </section>

        {/* CONTENIDO DENTRO DE SUSPENSE */}
        <Suspense
          fallback={
            <div className="py-20 text-center">
              <p className="text-slate-500 text-sm font-mono animate-pulse">Cargando catálogo...</p>
            </div>
          }
        >
          <CatalogoContenido />
        </Suspense>
      </main>

      <ChatWidget />
    </div>
  );
}