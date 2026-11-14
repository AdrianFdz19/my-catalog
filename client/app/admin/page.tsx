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
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Encabezado de Bienvenida */}
            {/* Encabezado de Bienvenida */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                            Admin
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Resumen general de tu catálogo, inventario y estado del asistente virtual.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/products"
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-center"
                    >
                        Ver Catálogo
                    </Link>
                    <Link
                        href="/admin/products/add"
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm text-center"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nuevo Producto
                    </Link>
                </div>
            </div>

            {/* Tarjetas de Estadísticas (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* KPI 1: Total Productos */}
                <div className="bg-white border border-slate-200/80 hover:border-slate-300 transition-colors p-5 rounded-2xl shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Total Productos
                        </p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums tracking-tight">
                            {loading ? (
                                <span className="inline-block w-12 h-8 bg-slate-100 animate-pulse rounded-md" />
                            ) : (
                                stats.productsCount
                            )}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1">Ítems publicados</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                    </div>
                </div>

                {/* KPI 2: Categorías Activas */}
                <div className="bg-white border border-slate-200/80 hover:border-slate-300 transition-colors p-5 rounded-2xl shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Categorías Activas
                        </p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums tracking-tight">
                            {loading ? (
                                <span className="inline-block w-12 h-8 bg-slate-100 animate-pulse rounded-md" />
                            ) : (
                                stats.categoriesCount
                            )}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1">Secciones organizadas</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                    </div>
                </div>

                {/* KPI 3: Estado IA / RAG */}
                <div className="bg-white border border-slate-200/80 hover:border-slate-300 transition-colors p-5 rounded-2xl shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Estado IA / RAG
                        </p>
                        <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-emerald-700">Sincronizado</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">Embeddings al día</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                        </svg>
                    </div>
                </div>
            </div>


            {/* Accesos Directos / Secciones */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Últimos Productos Agregados */}
                <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Últimos Productos
                        </h2>
                        <Link
                            href="/admin/products"
                            className="text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors flex items-center gap-1 group"
                        >
                            Ver todos
                            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100 flex-1">
                        {loading ? (
                            <div className="p-6 space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : recentProducts.length === 0 ? (
                            <div className="p-10 text-center flex flex-col items-center justify-center">
                                <p className="text-xs font-medium text-slate-500">No hay productos registrados.</p>
                                <Link
                                    href="/admin/products/add"
                                    className="mt-2.5 text-xs font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-600"
                                >
                                    + Agregar el primero
                                </Link>
                            </div>
                        ) : (
                            recentProducts.map((prod) => (
                                <div
                                    key={prod.id}
                                    className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-11 h-11 bg-slate-50 rounded-xl border border-slate-200/80 overflow-hidden relative shrink-0 flex items-center justify-center">
                                            {prod.image_url ? (
                                                <img
                                                    src={prod.image_url}
                                                    alt={prod.name}
                                                    className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                                                {prod.name}
                                            </h4>
                                            <p className="text-[11px] font-mono font-medium text-slate-600 tabular-nums mt-0.5">
                                                ${prod.price} <span className="text-slate-400">USD</span>
                                            </p>
                                        </div>
                                    </div>

                                    <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                                        {new Date(prod.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Accesos Rápidos de Gestión */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Accesos de Configuración
                        </h2>
                        <p className="text-xs text-slate-500 mt-1.5 mb-5 leading-relaxed">
                            Gestiona las estructuras clave de tu catálogo digital y personaliza el comportamiento del widget de chat.
                        </p>

                        <div className="space-y-3">
                            <Link
                                href="/admin/categories"
                                className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 hover:border-slate-900 hover:bg-slate-50/70 transition-all group"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-950 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors shrink-0 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-900">
                                            Gestionar Categorías & Iconos
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Configura las píldoras del chat y secciones.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all">
                                    →
                                </span>
                            </Link>

                            <Link
                                href="/admin/products"
                                className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 hover:border-slate-900 hover:bg-slate-50/70 transition-all group"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-950 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors shrink-0 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-900">
                                            Inventario y Productos
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Edita precios, fotos y descripciones.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all">
                                    →
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Footer de Seguridad y Versión */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>MyCatalog v1.0 (Supabase + RAG)</span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 font-sans font-semibold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Seguro (RLS Active)
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}