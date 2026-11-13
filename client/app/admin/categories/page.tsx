"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";

interface Category {
    id: string | number;
    name: string;
    slug?: string;
    description?: string | null;
    icon: string | null;
    created_at?: string;
}

// Set de iconos predeterminados recomendados para e-commerce de tecnología
const PRESET_ICONS = ["💻", "📷", "🎧", "📱", "⌚", "🎒", "🔌", "⌨️", "🖱️", "💡", "🛠️", "📦"];

export default function AdminCategoriesPage() {
    const supabase = createClient();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados del formulario (incluyendo description)
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("💻");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Cargar categorías al montar la página
    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("name", { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error: any) {
            console.error("Error cargando categorías:", error.message);
        } finally {
            setLoading(false);
        }
    }

    // Crear nueva categoría a través de la API protegida
    async function handleCreateCategory(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setSubmitting(true);
            setErrorMsg("");

            const response = await fetch("/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() ? description.trim() : null,
                    icon: selectedIcon,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al crear la categoría");
            }

            // Limpiar formulario y recargar lista de categorías
            setName("");
            setDescription("");
            setSelectedIcon("💻");
            fetchCategories();
        } catch (error: any) {
            setErrorMsg(error.message || "Error al conectar con el servidor");
        } finally {
            setSubmitting(false);
        }
    }

    // Eliminar categoría
    async function handleDeleteCategory(id: string | number) {
        if (!confirm("¿Estás seguro de eliminar esta categoría? Si hay productos asociados, asegúrate de desvincularlos primero.")) return;

        try {
            const { error } = await supabase.from("categories").delete().eq("id", id);
            if (error) throw error;
            setCategories(categories.filter((cat) => cat.id !== id));
        } catch (error: any) {
            alert("No se pudo eliminar: " + error.message);
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Encabezado */}
            <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestión de Categorías</h1>
                <p className="text-xs text-slate-500 mt-1">
                    Administra las categorías de tu catálogo y asigna iconos predeterminados para las vistas del chat.
                </p>
            </div>

            {/* Formulario de Creación */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                    Nueva Categoría
                </h2>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Input de Nombre */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Nombre de la Categoría
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej. Monitores, Audio, Gaming..."
                                required
                                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 transition"
                            />
                        </div>

                        {/* Input de Descripción */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Descripción (Opcional)
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej. Equipos fotográficos y accesorios..."
                                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 transition"
                            />
                        </div>
                    </div>

                    {/* Selector de Icono Predeterminado */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Icono Predeterminado
                        </label>
                        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                            {PRESET_ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                                        selectedIcon === icon
                                            ? "bg-slate-950 text-white shadow-sm scale-105"
                                            : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                                    }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={submitting || !name.trim()}
                            className="bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                        >
                            {submitting ? "Guardando..." : "Crear Categoría"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Lista / Tabla de Categorías Existentes */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Categorías Registradas ({categories.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-mono">
                        Cargando categorías...
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                        No hay categorías registradas todavía. Crea la primera arriba.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {categories.map((cat) => (
                            <div key={cat.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-base shrink-0">
                                        {cat.icon || "📁"}
                                    </span>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-900">{cat.name}</h4>
                                        {cat.description && (
                                            <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
                                        )}
                                        <span className="text-[10px] font-mono text-slate-400">Slug: {cat.slug || 'N/A'}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition-colors cursor-pointer text-xs font-medium"
                                    title="Eliminar categoría"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}