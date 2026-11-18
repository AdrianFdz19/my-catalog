"use client";

import { createContext, useContext, useRef, useState } from "react";

interface CartContextType {
    guestUuid: string | null;
    cartIds: (number | string)[];
    addToCart: (productId: number | string) => void;
    removeFromCart: (productId: number | string) => void;
    clearCart: () => void;
    showToast: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    // 1. Inicialización segura del guestUuid sin useEffect
    const [guestUuid] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        let uuid = localStorage.getItem("guest_uuid");
        if (!uuid) {
            uuid = crypto.randomUUID();
            localStorage.setItem("guest_uuid", uuid);
        }
        return uuid;
    });

    // 2. Inicialización segura del carrito sin useEffect
    const [cartIds, setCartIds] = useState<(number | string)[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const savedCart = localStorage.getItem("guest_cart_ids");
            if (savedCart) {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (error) {
            console.error("Error al leer los IDs del carrito:", error);
        }
        return [];
    });

    const [showToast, setShowToast] = useState<boolean>(false);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const addToCart = (productId: number | string) => {
        const numericId = Number(productId); // Forzar a número desde el cliente
        setCartIds((prev) => {
            const updated = [...prev, numericId];
            localStorage.setItem("guest_cart_ids", JSON.stringify(updated));
            return updated;
        });

        // 🔊 Reproducir sonido sutil de éxito al agregar al carrito
        try {
            const audio = new Audio("/sounds/added-to-cart-1.mp3");
            audio.volume = 0.3;
            audio.play().catch((e) => {
                console.log("Audio bloqueado por políticas del navegador:", e);
            });
        } catch (err) {
            console.error("Error al reproducir audio:", err);
        }

        // Reiniciar temporizador del Toast
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }

        setShowToast(true);
        toastTimeoutRef.current = setTimeout(() => {
            setShowToast(false);
        }, 2500);
    };

    const removeFromCart = (productId: number | string) => {
        setCartIds((prev) => {
            const updated = prev.filter((id) => id !== productId);
            localStorage.setItem("guest_cart_ids", JSON.stringify(updated));
            return updated;
        });
    };

    const clearCart = () => {
        setCartIds([]);
        localStorage.removeItem("guest_cart_ids");
    };

    return (
        <CartContext.Provider
            value={{
                guestUuid,
                cartIds,
                addToCart,
                removeFromCart,
                clearCart,
                showToast,
            }}
        >
            {children}

            {/* TOAST GLOBAL CON TRANSICIÓN SUAVE */}
            <div
                className={`fixed top-20 right-4 sm:right-6 z-50 transition-all duration-300 ease-out ${showToast
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
                    }`}
            >
                <div className="bg-slate-950 text-white border border-slate-800/90 px-5 py-4 sm:px-6 sm:py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] sm:min-w-[360px]">
                    <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div className="flex-1">
                        <p className="text-sm sm:text-base font-bold text-white tracking-tight">
                            ¡Producto agregado!
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5">
                            Se añadió a tu lista de cotización.
                        </p>
                    </div>

                    <a
                        href="/cart"
                        className="shrink-0 text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors shadow-xs"
                    >
                        Ver carrito
                    </a>
                </div>
            </div>
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart debe usarse dentro de un CartProvider");
    }
    return context;
}