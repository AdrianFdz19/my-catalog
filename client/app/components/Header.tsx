"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("q") || "";
  
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay sesión activa al montar el componente
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      }
    }
    checkAuth();
  }, [supabase]);

  // Manejador cuando el usuario escribe en el buscador
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (query) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    } else {
      router.push(`/`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* FILA SUPERIOR EN MÓVIL / LOGO Y ACCIONES RÁPIDAS */}
        <div className="w-full sm:w-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-slate-950 text-white font-mono font-bold text-sm flex items-center justify-center rounded-lg">
              M
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">
              Mi<span className="text-slate-400 font-normal">Catálogo</span>
            </span>
          </Link>

          {/* ACCIONES EN MÓVIL (Admin + WhatsApp) */}
          <div className="flex items-center gap-2 sm:hidden">
            {isAuthenticated && (
              <Link
                href="/admin"
                className="p-2 text-xs font-semibold text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all flex items-center justify-center"
                title="Panel de Administración"
              >
                <span>⚙️</span>
              </Link>
            )}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Consultar</span>
            </a>
          </div>
        </div>

        {/* BUSCADOR (Ocupa todo el ancho en móvil, se integra al centro en desktop) */}
        <div className="w-full sm:flex-1 sm:max-w-md">
          <div className="relative">
            <input
              type="text"
              defaultValue={currentSearch}
              onChange={handleSearchChange}
              placeholder="Buscar laptops, cámaras, M3..."
              className="w-full bg-slate-100 border border-slate-200/80 rounded-lg px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono hidden sm:inline">
              ⌘K
            </span>
          </div>
        </div>

        {/* ACCIONES EN ESCRITORIO (Panel Admin condicional + WhatsApp) */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && (
            <Link
              href="/admin"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all flex items-center gap-1.5"
              title="Ir al Panel de Administración"
            >
              <span>⚙️</span>
              <span>Panel Admin</span>
            </Link>
          )}

          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Consultar</span>
          </a>
        </div>

      </div>
    </header>
  );
}