"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import ChatProductCard from "./ChatProductCard";
import ChatCategoryPills from "./ChatCategoryPills";

interface ProductItem {
    id: number | string;
    name: string;
    price: number;
    stock: number;
    image_url?: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    products?: ProductItem[];
    showCategories?: boolean;
}

export default function ChatWidget() {
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
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loading, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");

        // Creamos el nuevo arreglo incluyendo el mensaje actual del usuario
        const updatedMessages = [...messages, { role: "user" as const, content: userMessage }];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            // Tomamos los últimos mensajes anteriores para enviarlos como historial de contexto
            const recentHistory = updatedMessages.slice(-5, -1).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: recentHistory
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Ocurrió un error en el chat.");
            }

            // 🔊 Reproducir sonido coqueto al recibir respuesta del asistente
            try {
                const audio = new Audio("/sounds/notification.mp3");
                audio.volume = 0.4; // Volumen sutil (de 0.0 a 1.0)
                audio.play().catch((e) => {
                    // Los navegadores a veces bloquean el audio si el usuario no ha interactuado antes con la página, 
                    // este catch evita que la consola muestre errores molestos si eso pasa.
                    console.log("Audio bloqueado por políticas del navegador:", e);
                });
            } catch (err) {
                console.error("Error al reproducir audio:", err);
            }

            // Agregamos la respuesta del asistente y sus productos dinámicos
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: data.reply,
                    products: data.products || []
                },
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

    return (
        <div className="fixed bottom-5 right-5 z-50 font-sans">
            {/* Botón flotante para abrir/cerrar */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2.5 bg-slate-950 hover:bg-slate-800 text-white px-5 py-3.5 rounded-full shadow-xl transition-all duration-300 hover:scale-105 border border-slate-800 group cursor-pointer"
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
                <div className="w-[90vw] sm:w-[400px] h-[560px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Header del Chat */}
                    <div className="bg-slate-950 text-white px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider">Soporte MyCatalog</h3>
                                <p className="text-[10px] text-slate-400">Impulsado por Inteligencia Artificial</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Cuerpo de mensajes (Tipografía ampliada a text-sm para mayor comodidad visual) */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 text-sm">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div
                                    className={`max-w-[95%] px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-wrap shadow-xs ${msg.role === "user"
                                        ? "bg-slate-950 text-white rounded-br-none"
                                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                                        }`}
                                >
                                    {msg.content}
                                </div>

                                {/* Si el mensaje incluye productos encontrados por el RAG, renderizamos las tarjetas dinámicamente */}
                                {msg.products && msg.products.length > 0 && (
                                    <div className="mt-2.5 w-full max-w-[95%] space-y-2">
                                        {msg.products.map((prod) => (
                                            <ChatProductCard
                                                key={prod.id}
                                                productId={prod.id}
                                                name={prod.name}
                                                price={String(prod.price)}
                                                image_url={prod.image_url || "https://via.placeholder.com/400"}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Si el mensaje muestra categorías */}
                                {msg.showCategories && (
                                    <div className="mt-2 w-full max-w-[95%]">
                                        <ChatCategoryPills
                                            onSelectCategory={(query) => {
                                                setMessages((prev) => [...prev, { role: "user", content: query }]);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-slate-500 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-mono shadow-xs animate-pulse">
                                    Buscando en el catálogo...
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
                            className="flex-1 px-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 transition"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                        >
                            Enviar
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}