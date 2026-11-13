"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface ProductCard {
    productId: number | string;
    image_url: string;
    name: string;
    price: string;
}

export default function ChatProductCard({ 
    productId,
    image_url,
    name,
    price
}: ProductCard) {
  const router = useRouter();

  // Generamos el enlace dinámico de WhatsApp
  const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=${encodeURIComponent(
      `Hola, vi el producto "${name}" ($${price} USD) en el asistente virtual y me interesa. ¿Sigue disponible?`
  )}`;

  return (
    <div className="flex justify-start">
      {/* Usamos un div interactivo en lugar de <Link> para evitar el anidamiento de <a> */}
      <div
        onClick={() => router.push(`/product/${productId}`)}
        className="w-full max-w-[320px] bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-2.5 flex items-center gap-3 shadow-sm transition-all group cursor-pointer"
      >
        {/* Miniatura de la imagen */}
        <div className="relative w-14 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0">
          <Image
            src={image_url}
            alt={name}
            fill
            sizes="56px"
            className="object-contain p-1 group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Información del producto */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {name}
          </h4>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">${price} USD</p>
        </div>

        {/* Botón de WhatsApp independiente */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()} // Evita que se dispare el router.push al hacer clic en WhatsApp
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider transition-all shrink-0 flex items-center gap-1 shadow-sm"
          title="Cotizar por WhatsApp"
        >
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}