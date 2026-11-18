"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";

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

    // Estados del formulario de Creación
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("💻");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Estados para el modo de Edición (Fila actual en edición)
    const [editingCategoryId, setEditingCategoryId] = useState<string | number | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editIcon, setEditIcon] = useState("💻");
    const [updating, setUpdating] = useState(false);

    // Función principal para cargar categorías (accesible globalmente en el componente)
    const fetchCategories = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCategories(data || []);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("Error al cargar categorías:", message);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Cargar al montar la página usando el efecto
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchCategories();
    }, [fetchCategories]);

    // Crear nueva categoría a través de la API protegida
    async function handleCreateCategory(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            setSubmitting(true);
            setErrorMsg("");

            const response = await fetch("/api/admin/categories", {
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setErrorMsg(message || "Error al conectar con el servidor");
        } finally {
            setSubmitting(false);
        }
    }

    // Iniciar edición de una categoría
    function startEditing(cat: Category) {
        setEditingCategoryId(cat.id);
        setEditName(cat.name);
        setEditDescription(cat.description || "");
        setEditIcon(cat.icon || "💻");
    }

    // Cancelar edición
    function cancelEditing() {
        setEditingCategoryId(null);
        setEditName("");
        setEditDescription("");
        setEditIcon("💻");
    }

    // Guardar cambios usando el endpoint PATCH
    async function handleUpdateCategory(id: string | number) {
        if (!editName.trim()) return;

        try {
            setUpdating(true);
            setErrorMsg("");

            const response = await fetch(`/api/admin/categories/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: editName.trim(),
                    description: editDescription.trim() ? editDescription.trim() : null,
                    icon: editIcon,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar la categoría");
            }

            // Salir del modo edición y refrescar lista
            cancelEditing();
            fetchCategories();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert("No se pudo actualizar: " + message);
        } finally {
            setUpdating(false);
        }
    }

    // Eliminar categoría
    async function handleDeleteCategory(id: string | number) {
        if (!confirm("¿Estás seguro de eliminar esta categoría? Si hay productos asociados, asegúrate de desvincularlos primero.")) return;

        try {
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Error al eliminar");

            setCategories(categories.filter((cat) => cat.id !== id));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert("No se pudo eliminar: " + message);
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Encabezado */}
            <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors mb-3"
            >
                ← Volver al Panel Admin
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            Gestión de Categorías
                        </h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                            {categories.length} activas
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Administra las categorías de tu catálogo y asigna iconos predeterminados para las vistas del chat.
                    </p>
                </div>
            </div>

            {/* Formulario de Creación */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Nueva Categoría
                    </h2>

                    {/* Vista previa en vivo de la píldora del chat */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-slate-400">Vista previa chat:</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 shadow-2xs">
                            <span>{selectedIcon}</span>
                            <span className="truncate max-w-[120px]">{name.trim() || "Categoría"}</span>
                        </span>
                    </div>
                </div>

                {errorMsg && (
                    <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
                        <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleCreateCategory} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 focus:bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 text-slate-900 transition-all font-medium"
                            />
                        </div>

                        {/* Input de Descripción */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Descripción <span className="text-slate-400 font-normal">(Opcional)</span>
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej. Equipos fotográficos y accesorios..."
                                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 focus:bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 text-slate-900 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Selector de Icono Predeterminado */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Icono Predeterminado
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                            {PRESET_ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${selectedIcon === icon
                                        ? "bg-slate-950 text-white shadow-sm scale-105"
                                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs"
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
                            className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Crear Categoría
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Lista / Tabla de Categorías Existentes */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Categorías Registradas
                        </h2>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                            {categories.length}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                            </svg>
                        </div>
                        <p className="text-xs font-medium text-slate-600">
                            No hay categorías registradas todavía.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {categories.map((cat) => {
                            const isEditing = editingCategoryId === cat.id;

                            return (
                                <div
                                    key={cat.id}
                                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                                >
                                    {isEditing ? (
                                        /* ----------------- MODO EDICIÓN EN LÍNEA ----------------- */
                                        <div className="flex-1 space-y-3.5 py-1">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    placeholder="Nombre"
                                                    className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 text-slate-900 font-medium"
                                                />
                                                <input
                                                    type="text"
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    placeholder="Descripción opcional"
                                                    className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 text-slate-900 sm:col-span-2 font-medium"
                                                />
                                            </div>

                                            {/* Selector rápido de iconos en edición */}
                                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Icono:</span>
                                                {PRESET_ICONS.map((ic) => (
                                                    <button
                                                        key={ic}
                                                        type="button"
                                                        onClick={() => setEditIcon(ic)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer ${editIcon === ic ? "bg-slate-950 text-white shadow-2xs" : "bg-white hover:bg-slate-100 border border-slate-200/80"
                                                            }`}
                                                    >
                                                        {ic}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                <button
                                                    type="button"
                                                    disabled={updating || !editName.trim()}
                                                    onClick={() => handleUpdateCategory(cat.id)}
                                                    className="bg-slate-950 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs"
                                                >
                                                    {updating ? "Guardando..." : "Guardar Cambios"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEditing}
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ----------------- MODO VISTA NORMAL ----------------- */
                                        <>
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                                                    {cat.icon || "📁"}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-xs font-semibold text-slate-900">
                                                            {cat.name}
                                                        </h4>
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 text-[10px] font-mono text-slate-500">
                                                            /{cat.slug || "n-a"}
                                                        </span>
                                                    </div>
                                                    {cat.description && (
                                                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                                            {cat.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(cat)}
                                                    className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs font-medium"
                                                    title="Editar categoría"
                                                >
                                                    <span>Editar</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 border border-transparent hover:border-rose-200/80 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs font-medium"
                                                    title="Eliminar categoría"
                                                >
                                                    <span>Eliminar</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}