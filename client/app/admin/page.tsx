"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";

interface RecentProduct {
    id: string | number;
    name: string;
    price: number;
    image_url?: string | null;
    created_at: string;
}

export default function AdminDashboardPage() {
    const supabase = createClient();
    const [stats, setStats] = useState({
        productsCount: 0,
        categoriesCount: 0,
    });
    const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // 1. Contar productos correctamente con Supabase
                const { count: prodCount } = await supabase
                    .from("products")
                    .select("*", { count: "exact", head: true });

                // 2. Contar categorías correctamente con Supabase
                const { count: catCount } = await supabase
                    .from("categories")
                    .select("*", { count: "exact", head: true });

                // 3. Obtener últimos 5 productos
                const { data: latestProds } = await supabase
                    .from("products")
                    .select("id, name, price, image_url, created_at")
                    .order("created_at", { ascending: false })
                    .limit(5);

                setStats({
                    productsCount: prodCount || 0,
                    categoriesCount: catCount || 0,
                });
                setRecentProducts(latestProds || []);
            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [supabase]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Encabezado de Bienvenida */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Resumen general de tu catálogo, inventario y estado del asistente virtual.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/products/add" // O la ruta de tu formulario de productos
                        className="bg-slate-950 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm text-center"
                    >
                        + Nuevo Producto
                    </Link>
                </div>
            </div>

            {/* Tarjetas de Estadísticas (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Productos</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                            {loading ? "..." : stats.productsCount}
                        </h3>
                    </div>
                    <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg">
                        📦
                    </span>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Categorías Activas</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                            {loading ? "..." : stats.categoriesCount}
                        </h3>
                    </div>
                    <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg">
                        📁
                    </span>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estado IA / RAG</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-semibold text-emerald-700">Sincronizado</span>
                        </div>
                    </div>
                    <span className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg">
                        🤖
                    </span>
                </div>
            </div>

            {/* Accesos Directos / Secciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Últimos Productos Agregados */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Últimos Productos
                        </h2>
                        <Link href="/admin/products" className="text-xs font-semibold text-blue-600 hover:underline">
                            Ver todos →
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100 flex-1">
                        {loading ? (
                            <div className="p-6 text-center text-xs text-slate-400 font-mono">Cargando...</div>
                        ) : recentProducts.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">No hay productos registrados.</div>
                        ) : (
                            recentProducts.map((prod) => (
                                <div key={prod.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative shrink-0">
                                            {prod.image_url ? (
                                                <img src={prod.image_url} alt={prod.name} className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <span className="flex items-center justify-center h-full text-xs">📷</span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-xs">{prod.name}</h4>
                                            <p className="text-[10px] font-mono text-slate-500">${prod.price} USD</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {new Date(prod.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Accesos Rápidos de Gestión */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                            Accesos de Configuración
                        </h2>
                        <p className="text-xs text-slate-500 mb-6">
                            Gestiona las estructuras clave de tu catálogo digital y personaliza el comportamiento del widget de chat.
                        </p>

                        <div className="space-y-3">
                            <Link
                                href="/admin/categories"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-950 hover:bg-slate-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-base">📁</span>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Gestionar Categorías & Iconos</h4>
                                        <p className="text-[11px] text-slate-500">Configura las píldoras del chat y secciones.</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>

                            <Link
                                href="/admin/products"
                                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-950 hover:bg-slate-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-base">📦</span>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Inventario y Productos</h4>
                                        <p className="text-[11px] text-slate-500">Edita precios, fotos y descripciones.</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>MyCatalog v1.0 (Supabase + RAG)</span>
                        <span className="text-emerald-600 font-sans font-semibold">Seguro (RLS Active)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}