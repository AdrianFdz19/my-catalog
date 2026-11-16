"use client";

import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

// Subcomponente interno para manejar los links y el pathname protegido por Suspense
function AdminNavMenu() {
    const pathname = usePathname();

    const navLinks = [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/categories", label: "Categorías" },
        { href: "/admin/products", label: "Productos" },
    ];

    return (
        <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                                ? "bg-slate-100 text-slate-950"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const router = useRouter();

    async function handleLogout() {
        try {
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-12">
            {/* Header Superior del Panel Admin */}
            <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 mb-6">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                    {/* Izquierda: Logo + Navegación (con Suspense para evitar bloqueo de prerenderizado) */}
                    <div className="flex items-center gap-6">
                        <Link href="/admin" className="font-bold text-slate-900 tracking-tight flex items-center gap-2.5 group">
                            <span className="w-7 h-7 rounded-lg bg-slate-950 group-hover:bg-slate-800 transition-colors text-white flex items-center justify-center text-xs font-mono shadow-xs">
                                A
                            </span>
                            <span className="text-sm font-bold">Admin Panel</span>
                        </Link>

                        <Suspense fallback={<div className="h-6 w-48 bg-slate-100 rounded-lg animate-pulse" />}>
                            <AdminNavMenu />
                        </Suspense>
                    </div>

                    {/* Derecha: Ver Tienda + Cerrar Sesión */}
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 px-3 py-2 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all"
                        >
                            <span>Ver Tienda</span>
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                            </svg>
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 border border-transparent hover:border-rose-200/80 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            title="Cerrar Sesión"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            <span className="hidden md:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido de las páginas del Admin */}
            <main className="px-4 sm:px-6">
                {children}
            </main>
        </div>
    );
}