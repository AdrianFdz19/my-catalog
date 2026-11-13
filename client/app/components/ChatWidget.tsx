"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import ChatProductCard from "./ChatProductCard";
import ChatCategoryPills from "./ChatCategoryPills";

interface Message {
    role: "user" | "assistant";
    content: string;
    showProductCard?: boolean;
    showCategories?: boolean;
}

export default function ChatWidget() {
    const [selectedTemplate, setSelectedTemplate] = useState("product-card");

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "¡Hola! Soy tu asistente virtual de MyCatalog. ¿Buscas alguna laptop, cámara o accesorio en particular?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll hacia abajo al recibir un nuevo mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Ocurrió un error en el chat.");
            }

            // La IA solo responde texto normal
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply },
            ]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Lo siento, tuve un problema procesando tu duda. Inténtalo de nuevo en un momento.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Función para activar manualmente el Mock de la Product Card
    const handleTriggerTemplate = () => {
        if (selectedTemplate === "product-card") {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Aquí tienes una tarjeta de producto de prueba:",
                    showProductCard: true, // Renderiza la tarjeta en este mensaje
                },
            ]);
        } else if (selectedTemplate === "categories") {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Explora nuestras categorías principales:",
                    showCategories: true, // Renderiza las categorías en este mensaje
                },
            ]);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 font-sans">
            {/* Botón flotante para abrir/cerrar */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2.5 bg-slate-950 hover:bg-slate-800 text-white px-5 py-3.5 rounded-full shadow-xl transition-all duration-300 hover:scale-105 border border-slate-800 group"
                >
                    <svg
                        className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider">Asistente IA</span>
                </button>
            )}

            {/* Ventana de chat desplegada */}
            {isOpen && (
                <div className="w-[90vw] sm:w-[380px] h-[520px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Header del Chat */}
                    <div className="bg-slate-950 text-white px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider">Soporte MyCatalog</h3>
                                <p className="text-[10px] text-slate-400">Impulsado por Inteligencia Artificial</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Barra de herramientas / Selector libre de plantillas para Devs */}
                    <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Dev Sandbox:</span>
                        <div className="flex items-center gap-1.5">
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="bg-white border border-slate-300 text-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-950 cursor-pointer"
                            >
                                <option value="product-card">Product Card</option>
                                <option value="categories">Categories Pills</option>
                            </select>
                            <button
                                type="button"
                                onClick={handleTriggerTemplate}
                                className="bg-slate-950 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>

                    {/* Cuerpo de mensajes */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div
                                    className={`max-w-[95%] px-3.5 py-2.5 rounded-xl leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                                            ? "bg-slate-950 text-white rounded-br-none"
                                            : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none"
                                        }`}
                                >
                                    {msg.content}
                                </div>

                                {/* Si este mensaje tiene la bandera de categorías, las muestra */}
                                {msg.showCategories && (
                                    <div className="mt-2 w-full max-w-[95%]">
                                        <ChatCategoryPills
                                            onSelectCategory={(query) => {
                                                setMessages((prev) => [...prev, { role: "user", content: query }]);
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Si este mensaje tiene la bandera de product card, la muestra */}
                                {msg.showProductCard && (
                                    <div className="mt-2 w-full max-w-[95%]">
                                        <ChatProductCard
                                            productId={10}
                                            name="Laptop 2019"
                                            price="12,500"
                                            image_url="https://cgofuouwfjfawyeimexa.supabase.co/storage/v1/object/public/products/1794536186109-zhwtd8a.jpg"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-slate-500 border border-slate-200 px-3.5 py-2 rounded-xl text-[11px] font-mono shadow-sm animate-pulse">
                                    Escribiendo respuesta...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input para escribir mensaje */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pregúntame sobre algún producto..."
                            className="flex-1 px-3.5 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 transition"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                        >
                            Enviar
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}