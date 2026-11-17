"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

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
    const [guestUuid, setGuestUuid] = useState<string | null>(null);
    const [cartIds, setCartIds] = useState<(number | string)[]>([]);
    const [showToast, setShowToast] = useState<boolean>(false);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let uuid = localStorage.getItem("guest_uuid");
        if (!uuid) {
            uuid = crypto.randomUUID();
            localStorage.setItem("guest_uuid", uuid);
        }
        setGuestUuid(uuid);

        const savedCart = localStorage.getItem("guest_cart_ids");
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) {
                    setCartIds(parsed);
                }
            } catch (error) {
                console.error("Error al leer los IDs del carrito:", error);
            }
        }
    }, []);

    const addToCart = (productId: number | string) => {
        setCartIds((prev) => {
            const updated = [...prev, productId];
            localStorage.setItem("guest_cart_ids", JSON.stringify(updated));
            return updated;
        });

        // 🔊 Reproducir sonido sutil de éxito al agregar al carrito
        try {
            const audio = new Audio("/sounds/added-to-cart-1.mp3"); // Puedes usar el mismo o apuntar a otro archivo ej: "/sounds/cart-pop.mp3"
            audio.volume = 0.3; // Un volumen discreto
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