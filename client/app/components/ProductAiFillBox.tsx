"use client";

import { useState } from "react";

interface AiFillBoxProps {
    onFill: (data: {
        name: string;
        slug: string;
        description: string;
        price: string;
        stock: string;
        tag: string;
    }) => void;
}

export default function ProductAiFillBox({ onFill }: AiFillBoxProps) {
    const [rawText, setRawText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleProcess = async (textToProcess: string) => {
        if (!textToProcess.trim() || loading) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/products/ai-fill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rawText: textToProcess }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al procesar la información con IA.");
            }

            onFill({
                name: data.name || "",
                slug: data.slug || "",
                description: data.description || "",
                price: String(data.price || ""),
                stock: String(data.stock || "10"),
                tag: data.tag || "",
            });

            setRawText("");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
                const text = await file.text();
                await handleProcess(text);
            } else {
                const text = await file.text();
                await handleProcess(text);
            }
        } catch (err) {
            setError("No se pudo leer el archivo seleccionado.");
        } finally {
            setLoading(false);
            e.target.value = "";
        }
    };

    return (
        <div className="max-w-5xl mx-auto mb-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Autocompletar con Inteligencia Artificial
                    </h3>
                </div>

                <label className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Subir archivo (.txt)</span>
                    <input type="file" accept=".txt,.md,.pdf" onChange={handleFileUpload} className="hidden" />
                </label>
            </div>

            <div className="pt-3 space-y-2.5">
                <textarea
                    rows={2}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Pega aquí la descripción o ficha técnica del producto para autocompletar el formulario..."
                    className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white resize-none transition"
                />

                <div className="flex items-center justify-between">
                    {error ? (
                        <span className="text-[11px] text-rose-500 font-medium">{error}</span>
                    ) : (
                        <span className="text-[11px] text-slate-400">La IA rellenará los campos automáticamente.</span>
                    )}

                    <button
                        type="button"
                        disabled={loading || !rawText.trim()}
                        onClick={() => handleProcess(rawText)}
                        className="bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Procesando...</span>
                            </>
                        ) : (
                            <span>Generar campos</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}