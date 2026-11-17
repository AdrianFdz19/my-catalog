"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FormattedProduct } from "@/app/lib/products";
import { useCart } from "@/app/context/CartProvider";

const WHATSAPP_PHONE_NUMBER = "522291276558";

export default function CartPage() {
    const { cartIds, removeFromCart, clearCart } = useCart();
    const [cartProducts, setCartProducts] = useState<FormattedProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [clientName, setClientName] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientNotes, setClientNotes] = useState("");

    // Estado para el modal de vaciar todo el carrito (único caso donde mantenemos confirmación)
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

    // Sincronizar IDs del localStorage con la API para traer los productos completos
    useEffect(() => {
        async function fetchCartProducts() {
            if (cartIds.length === 0) {
                setCartProducts([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await fetch("/api/cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: cartIds }),
                });

                if (!res.ok) throw new Error("Error al sincronizar carrito");

                const result = await res.json();
                setCartProducts(result.data || []);
            } catch (error) {
                console.error("Error cargando carrito:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCartProducts();
    }, [cartIds]);

    // Calcular el total general de la cotización
    const totalPrice = cartProducts.reduce((acc, prod) => acc + (Number(prod.price) || 0), 0);

    const handleConfirmClear = () => {
        clearCart();
        setIsConfirmOpen(false);
    };

    // Función para generar el mensaje consolidado de WhatsApp
    const handleCheckoutWhatsApp = async () => {
        if (cartProducts.length === 0) return;

        // 1. Guardar o actualizar los datos del usuario en Supabase si llenó al menos el nombre o teléfono
        if (clientName.trim() || clientPhone.trim()) {
            try {
                const guestUuid = localStorage.getItem("guest_uuid");
                await fetch("/api/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        uuid: guestUuid,
                        name: clientName,
                        phone: clientPhone,
                        email: clientEmail
                    }),
                });
            } catch (err) {
                console.error("No se pudo registrar el usuario en la base de datos:", err);
                // No detenemos el flujo de WhatsApp si falla el registro secundario para no afectar la conversión
            }
        }

        // 2. Construir el mensaje de WhatsApp (como lo teníamos)
        let message = "Hola, me interesa cotizar los siguientes productos:\n\n";

        cartProducts.forEach((prod, index) => {
            message += `${index + 1}. *${prod.name}* - $${prod.price} USD\n`;
        });

        message += `\n*Total estimado: $${totalPrice.toFixed(2)} USD*\n`;

        if (clientName.trim() || clientPhone.trim() || clientNotes.trim()) {
            message += `\n-------------------\n`;
            message += `*Datos del cliente:*\n`;
            if (clientName) message += `• Nombre: ${clientName}\n`;
            if (clientPhone) message += `• Teléfono: ${clientPhone}\n`;
            if (clientNotes) message += `• Notas: ${clientNotes}\n`;
        }

        message += `\n¿Están disponibles para entrega o envío?`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodedMessage}`, "_blank");
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 text-sm font-mono animate-pulse">Cargando tu carrito de cotización...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 relative">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ENCABEZADO */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors mb-3"
                        >
                            ← Seguir explorando el catálogo
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                            Cotizador de Carrito
                        </h1>
                    </div>

                    {cartProducts.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setIsConfirmOpen(true)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200/60 cursor-pointer"
                        >
                            Vaciar carrito
                        </button>
                    )}
                </div>

                {/* CONTENIDO DEL CARRITO */}
                {cartProducts.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Tu carrito está vacío</h2>
                        <p className="mt-1 text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                            Aún no has agregado ningún producto para cotizar. Explora nuestro catálogo y selecciona los artículos que te interesen.
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-block px-5 py-2.5 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
                        >
                            Ver Catálogo
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LISTA DE PRODUCTOS SELECCIONADOS */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartProducts.map((producto) => (
                                <div
                                    key={producto.id}
                                    className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4 shadow-2xs hover:shadow-sm transition-shadow group"
                                >
                                    {/* IMAGEN (Clicable a pestaña nueva) */}
                                    <Link
                                        href={`/product/${producto.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-2 cursor-pointer"
                                    >
                                        <Image
                                            src={producto.image_url || "https://res.cloudinary.com/dk0mjtyze/image/upload/v1768884165/assets-manager/obnght3c0lewythyn7dc.png"}
                                            alt={producto.name}
                                            fill
                                            sizes="80px"
                                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </Link>

                                    {/* INFO DEL PRODUCTO */}
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                                            {producto.category}
                                        </span>
                                        <Link
                                            href={`/product/${producto.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-xs sm:text-sm font-bold text-slate-900 truncate hover:underline"
                                        >
                                            {producto.name}
                                        </Link>
                                        <p className="mt-1 text-sm font-mono font-bold text-slate-950">
                                            ${producto.price} <span className="text-[10px] text-slate-400 font-normal">USD</span>
                                        </p>
                                    </div>

                                    {/* ACCIONES (Ver en pestaña nueva + Eliminar directo) */}
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/product/${producto.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
                                        >
                                            Ver
                                        </Link>

                                        {/* Botón directo de eliminación (sin confirmación) */}
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(producto.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                            title="Eliminar producto"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* RESUMEN DE COTIZACIÓN & WHATSAPP */}
                        {/* RESUMEN DE COTIZACIÓN & DATOS OPCIONALES */}
                        <div className="lg:col-span-1">
                            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm sticky top-24 space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
                                    Resumen de Cotización
                                </h3>

                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-xs text-slate-600">
                                        <span>Artículos seleccionados:</span>
                                        <span className="font-mono font-bold text-slate-900">{cartProducts.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-bold text-slate-950 pt-3 border-t border-slate-100">
                                        <span>Total Estimado:</span>
                                        <span className="font-mono text-lg">${totalPrice.toFixed(2)} USD</span>
                                    </div>
                                </div>

                                {/* FORMULARIO OPCIONAL DE DATOS (Sin fricción obligatoria) */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                                        Datos de contacto (Opcional)
                                    </span>

                                    <input
                                        type="text"
                                        placeholder="Tu nombre o empresa"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950 transition-all"
                                    />

                                    <input
                                        type="tel"
                                        placeholder="Teléfono de contacto"
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950 transition-all"
                                    />

                                    <input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        value={clientEmail}
                                        onChange={(e) => setClientEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950 transition-all"
                                    />

                                    <textarea
                                        placeholder="Notas o comentarios adicionales..."
                                        value={clientNotes}
                                        onChange={(e) => setClientNotes(e.target.value)}
                                        rows={2}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-950 transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCheckoutWhatsApp}
                                    className="w-full py-3.5 px-4 text-center text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                                >
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                    </span>
                                    <span>Enviar Cotización por WhatsApp</span>
                                </button>

                                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                                    Se abrirá WhatsApp con tu lista de productos y tus datos listos para enviar.
                                </p>
                            </div>
                        </div>

                    </div>
                )}

            </main>

            {/* MODAL DE CONFIRMACIÓN SOLO PARA VACIAR TODO EL CARRITO */}
            {isConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-xl text-center space-y-4">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-slate-950">¿Vaciar todo el carrito?</h3>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                Se eliminarán todos los productos seleccionados de golpe.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsConfirmOpen(false)}
                                className="w-full py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmClear}
                                className="w-full py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                                Sí, vaciar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}