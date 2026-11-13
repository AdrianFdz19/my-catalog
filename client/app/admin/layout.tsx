"use client";

import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 mb-8">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/admin" className="font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-950 text-white flex items-center justify-center text-xs font-mono">A</span>
                            <span>Admin Panel</span>
                        </Link>
                        
                        <nav className="hidden sm:flex items-center gap-4 text-xs font-semibold">
                            <Link href="/admin" className="text-slate-600 hover:text-slate-900 transition">
                                Dashboard
                            </Link>
                            <Link href="/admin/categories" className="text-slate-600 hover:text-slate-900 transition">
                                Categorías
                            </Link>
                            <Link href="/admin/products" className="text-slate-600 hover:text-slate-900 transition">
                                Productos
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            target="_blank"
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                        >
                            Ver Tienda ↗
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>🚪</span>
                            <span>Cerrar Sesión</span>
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