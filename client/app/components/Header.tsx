"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import { useCart } from "../context/CartProvider";

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("q") || "";

  // Hook del carrito
  const { cartIds } = useCart();

  // Estado para saber si ya estamos en el cliente y evitar errores de hidratación
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const supabase = useMemo(() => createClient(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchValue, setSearchValue] = useState(currentSearch);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado local si cambian los searchParams externamente
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  // Verificar si hay sesión activa
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      }
    }
    checkAuth();
  }, [supabase]);

  // Atajo de teclado Cmd+K / Ctrl+K para enfocar el buscador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchValue(query);
    if (query) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    } else {
      router.push(`/`);
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    router.push(`/`);
    searchInputRef.current?.focus();
  };

  // Cantidad de items segura (devuelve 0 si aún no se monta en cliente)
  const totalCartItems = mounted ? cartIds.length : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">

        {/* FILA SUPERIOR EN MÓVIL / LOGO */}
        <div className="w-full sm:w-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-slate-950 group-hover:bg-slate-800 transition-colors text-white font-mono font-bold text-sm flex items-center justify-center rounded-xl shadow-xs">
              M
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
              Mi<span className="text-slate-400 font-normal">Catálogo</span>
            </span>
          </Link>

          {/* ACCIONES EN MÓVIL (Carrito + Admin + WhatsApp) */}
          <div className="flex items-center gap-2 sm:hidden">
            {/* Botón de Carrito (Móvil) */}
            <button
              type="button"
              onClick={() => alert(`Tienes ${totalCartItems} productos en tu carrito.`)}
              className="relative p-2 text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl transition-all flex items-center justify-center"
              title="Ver Carrito"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-slate-950 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalCartItems}
                </span>
              )}
            </button>

            {isAuthenticated && (
              <Link
                href="/admin"
                className="p-2 text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl transition-all flex items-center justify-center"
                title="Panel de Administración"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
              </Link>
            )}

            <a
              href={`https://wa.me/522291276558`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 active:scale-[0.98] rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Consultar</span>
            </a>
          </div>
        </div>

        {/* BUSCADOR CENTRAL */}
        <div className="w-full sm:flex-1 sm:max-w-md">
          <div className="relative group">
            <svg
              className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-slate-700 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>

            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Buscar laptops, cámaras, M3..."
              className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-xl pl-9 pr-14 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 transition-all"
            />

            {searchValue ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-slate-700 bg-slate-200/70 hover:bg-slate-200 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                ESC
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded-md shadow-2xs hidden sm:inline-block pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* ACCIONES EN ESCRITORIO (Carrito + Panel Admin condicional + WhatsApp) */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Botón de Carrito (Escritorio) */}
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="relative px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            title="Ver Carrito de Cotización"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Carrito</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-slate-950 text-white text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {totalCartItems}
              </span>
            )}
          </button>

          {isAuthenticated && (
            <Link
              href="/admin"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-xl transition-all flex items-center gap-1.5"
              title="Ir al Panel de Administración"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              <span>Panel Admin</span>
            </Link>
          )}

          <a
            href={`https://wa.me/522291276558`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 active:scale-[0.98] rounded-xl transition-all flex items-center gap-2 shadow-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Consultar</span>
          </a>
        </div>

      </div>
    </header>
  );
}