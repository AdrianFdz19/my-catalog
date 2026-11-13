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
    // Permitimos que categories sea un objeto o un arreglo para evitar conflictos de TS
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

    async function handleDeleteProduct(id: string | number) {
        if (!confirm("¿Estás seguro de eliminar este producto del inventario?")) return;

        try {
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) throw error;
            setProducts(products.filter((prod) => prod.id !== id));
        } catch (error: any) {
            alert("No se pudo eliminar el producto: " + error.message);
        }
    }

    // Función auxiliar para extraer el nombre de la categoría sin importar si viene como objeto o array
    const getCategoryName = (categories: Product["categories"]) => {
        if (!categories) return "Sin categoría";
        if (Array.isArray(categories)) {
            return categories.length > 0 ? categories[0].name : "Sin categoría";
        }
        return categories.name || "Sin categoría";
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inventario de Productos</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Gestiona los artículos de tu catálogo, precios y detalles sincronizados con el asistente virtual.
                    </p>
                </div>
                <div>
                    <Link
                        href="/admin/products/add"
                        className="inline-flex items-center justify-center bg-slate-950 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                    >
                        + Nuevo Producto
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Productos Registrados ({products.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-xs text-slate-400 font-mono">
                        Cargando inventario...
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <span className="text-2xl">📦</span>
                        <p className="text-xs text-slate-500">No hay productos en el inventario todavía.</p>
                        <div>
                            <Link
                                href="/admin/products/add"
                                className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                                Registrar el primer producto →
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {products.map((prod) => (
                            <div key={prod.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                                        {prod.image_url ? (
                                            <img
                                                src={prod.image_url}
                                                alt={prod.name}
                                                className="w-full h-full object-contain p-1"
                                            />
                                        ) : (
                                            <span className="text-base">📷</span>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-900">{prod.name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-mono font-bold text-slate-700">
                                                ${Number(prod.price).toLocaleString()} USD
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                                {getCategoryName(prod.categories)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                                        {prod.created_at ? new Date(prod.created_at).toLocaleDateString() : ""}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteProduct(prod.id)}
                                        className="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition-colors cursor-pointer text-xs font-medium"
                                        title="Eliminar producto"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}