"use client";

import { useEffect, useState } from "react";

interface ChatCategoryPillsProps {
    onSelectCategory: (query: string) => void;
}

export default function ChatCategoryPills({
    onSelectCategory
}: ChatCategoryPillsProps) {
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/categories");
                if (res.ok) {
                    const data = await res.json();
                    // Extraemos únicamente los nombres de las categorías reales de la BD
                    const categoryNames = data.map((cat: any) => cat.name);
                    setCategories(categoryNames);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        }
        fetchCategories();
    }, []);

    // Si aún está cargando o no hay categorías, no renderizamos nada para evitar espacios vacíos
    if (categories.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[95%]">
            {categories.map((categoryName) => (
                <button
                    key={categoryName}
                    type="button"
                    onClick={() => onSelectCategory(`Muéstrame productos de la categoría ${categoryName}`)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200 hover:border-slate-950 hover:bg-slate-950 hover:text-white shadow-sm transition-all cursor-pointer active:scale-95"
                >
                    <span>{categoryName}</span>
                </button>
            ))}
        </div>
    );
}