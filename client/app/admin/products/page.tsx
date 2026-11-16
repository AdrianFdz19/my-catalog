"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";

interface Product {
    id: string | number;
    name: string;
    price: number;
    image_url?: string | null;
    created_at?: string;
    categories?: {
        name: string;
    } | {
        name: string;
    }[] | null;
}

export default function AdminProductsPage() {
    const supabase = createClient();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados para el Modal de Eliminación Segura
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [confirmInput, setConfirmInput] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from("products")
                    .select(`
                        id,
                        name,
                        price,
                        image_url,
                        created_at,
                        categories (
                            name
                        )
                    `)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setProducts(data || []);
            } catch (err: unknown) {
                console.error("Error cargando productos:", err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [supabase]);

    // Ejecutar la eliminación a través de la API protegida
    async function handleConfirmDelete() {
        if (!productToDelete) return;

        try {
            setDeleting(true);
            const response = await fetch(`/api/products/${productToDelete.id}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Error al eliminar el producto");

            setProducts(products.filter((prod) => prod.id !== productToDelete.id));
            closeDeleteModal();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert("No se pudo eliminar el producto: " + message);
        } finally {
            setDeleting(false);
        }
    }

    function openDeleteModal(product: Product) {
        setProductToDelete(product);
        setConfirmInput("");
    }

    function closeDeleteModal() {
        setProductToDelete(null);
        setConfirmInput("");
    }

    const getCategoryName = (categories: Product["categories"]) => {
        if (!categories) return "Sin categoría";
        if (Array.isArray(categories)) {
            return categories.length > 0 ? categories[0].name : "Sin categoría";
        }
        return categories.name || "Sin categoría";
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative">
            {/* Encabezado */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            Inventario de Productos
                        </h1>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                            {products.length} ítems
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Gestiona los artículos de tu catálogo, precios y detalles sincronizados con el asistente virtual.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/products/add"
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nuevo Producto
                    </Link>
                </div>
            </div>

            {/* Lista de Productos */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Productos Registrados
                        </h2>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                            {products.length}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                        </div>
                        <p className="text-xs font-medium text-slate-600">
                            No hay productos en el inventario todavía.
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 mb-4">
                            Agrega artículos para que aparezcan en tu catálogo y en las respuestas del chat.
                        </p>
                        <Link
                            href="/admin/products/add"
                            className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        >
                            <span>+ Registrar el primer producto</span>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {products.map((prod) => (
                            <div
                                key={prod.id}
                                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden relative shrink-0 flex items-center justify-center">
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
                                        <h4 className="text-xs font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                                            {prod.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-[11px] font-mono font-semibold text-slate-700 tabular-nums">
                                                ${Number(prod.price).toLocaleString()} <span className="text-slate-400 font-normal">USD</span>
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/70 text-slate-600 font-medium">
                                                {getCategoryName(prod.categories)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="text-[11px] font-mono text-slate-400 tabular-nums hidden sm:inline">
                                        {prod.created_at ? new Date(prod.created_at).toLocaleDateString() : ""}
                                    </span>
                                    <Link
                                        href={`/admin/products/edit/${prod.id}`}
                                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium"
                                    >
                                        <span>Editar</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => openDeleteModal(prod)}
                                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 border border-transparent hover:border-rose-200/80 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs font-medium"
                                        title="Eliminar producto"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                        <span className="hidden sm:inline">Eliminar</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ----------------- MODAL DE ELIMINACIÓN SEGURA ----------------- */}
            {productToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                Confirmar Eliminación Definitiva
                            </h3>
                            <button
                                onClick={closeDeleteModal}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer text-xs font-mono"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tarjeta resumen del producto a eliminar */}
                        <div className="flex items-center gap-3.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                            <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {productToDelete.image_url ? (
                                    <img src={productToDelete.image_url} alt={productToDelete.name} className="w-full h-full object-contain p-1" />
                                ) : (
                                    <span className="text-base">📦</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 truncate">{productToDelete.name}</h4>
                                <p className="text-[11px] font-mono text-slate-500 mt-0.5">${Number(productToDelete.price).toLocaleString()} USD</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-slate-600">
                                Esta acción no se puede deshacer. Para confirmar, escribe exactamente el nombre del producto:{" "}
                                <span className="font-semibold text-slate-900 select-all font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                    {productToDelete.name}
                                </span>
                            </p>

                            <input
                                type="text"
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value)}
                                placeholder="Escribe el nombre aquí..."
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900 transition-all font-mono"
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={confirmInput !== productToDelete.name || deleting}
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-sm"
                            >
                                {deleting ? "Eliminando..." : "Eliminar Definitivamente"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}