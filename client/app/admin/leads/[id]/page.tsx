"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";

interface UserLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

interface CartItem {
  id: string | number;
  quantity: number;
  created_at: string;
  products: {
    id: string | number;
    name: string;
    slug: string;
    price: number;
    image_url?: string | null;
  } | null;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function LeadProfileContent({ params }: PageProps) {
  const { id } = use(params);

  const [lead, setLead] = useState<UserLead | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeadProfile() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/leads/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar el perfil");

        const json = await res.json();
        console.log(json);
        setLead(json.lead);
        setItems(json.items || []);
      } catch (error) {
        console.error("Error cargando perfil del lead:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchLeadProfile();
  }, [id]);

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6">
        <div className="h-32 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />
          <div className="lg:col-span-2 h-64 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Prospecto no encontrado</h1>
        <p className="text-xs text-slate-500">El registro que buscas no existe o fue eliminado.</p>
        <Link
          href="/admin/leads"
          className="inline-block text-xs font-semibold text-white bg-slate-950 px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
        >
          ← Volver a Prospectos
        </Link>
      </div>
    );
  }

  const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, "") : "";
  const waMessage = encodeURIComponent(
    `Hola ${lead.name}, te contactamos respecto a los productos de tu cotización.`
  );
  const waLink = `https://wa.me/${cleanPhone}?text=${waMessage}`;

  const totalQuoteValue = items.reduce((acc, item) => {
    const price = item.products?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Navegación superior */}
      <div>
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors"
        >
          ← Volver a Prospectos (Leads)
        </Link>
      </div>

      {/* Cabecera del Perfil */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-xs">
            {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {lead.name}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Prospecto Activo
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Registrado el{" "}
              {new Date(lead.created_at).toLocaleString("es-MX", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Botones de Acción Rápida */}
        <div className="flex items-center gap-2.5">
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 transition"
            >
              Enviar Correo
            </a>
          )}
          {lead.phone && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition shadow-xs"
            >
              <span>WhatsApp ↗</span>
            </a>
          )}
        </div>
      </div>

      {/* Contenido Principal en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Métodos de Contacto */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
              Información de Contacto
            </h2>

            {/* Nombre */}
            <div>
              <span className="block text-[10px] font-mono uppercase text-slate-400">
                Nombre / Empresa
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-1">
                {lead.name}
              </p>
            </div>

            {/* Teléfono / WhatsApp */}
            <div>
              <span className="block text-[10px] font-mono uppercase text-slate-400">
                Teléfono (WhatsApp)
              </span>
              {lead.phone ? (
                <div className="flex items-center justify-between gap-2 mt-1">
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono font-semibold text-emerald-700 hover:underline"
                  >
                    {lead.phone} ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(lead.phone!, "phone")}
                    className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  >
                    {copiedField === "phone" ? "Copiado" : "Copiar"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">No proporcionado</p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div>
              <span className="block text-[10px] font-mono uppercase text-slate-400">
                Correo Electrónico
              </span>
              {lead.email ? (
                <div className="flex items-center justify-between gap-2 mt-1">
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-xs font-mono text-slate-700 hover:underline truncate"
                  >
                    {lead.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(lead.email!, "email")}
                    className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0 cursor-pointer"
                  >
                    {copiedField === "email" ? "Copiado" : "Copiar"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">No proporcionado</p>
              )}
            </div>
          </div>

          {/* Resumen de Valor */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <span className="block text-[10px] font-mono uppercase text-slate-400">
              Valor Estimado en Carrito
            </span>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              ${totalQuoteValue.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-400">USD</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Basado en {items.reduce((sum, i) => sum + i.quantity, 0)} unidades guardadas
            </p>
          </div>
        </div>

        {/* Columna Derecha: Carrito / Cotizaciones Previas */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Ítems en Carrito / Cotizaciones
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
              {items.length} productos
            </span>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
              <p className="text-xs font-medium text-slate-600">
                Este prospecto aún no tiene ítems guardados en su carrito o historial.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Cuando agregue artículos y solicite cotización, aparecerán listados aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const product = item.products;
                if (!product) return null;

                return (
                  <div
                    key={item.id}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden relative shrink-0 flex items-center justify-center">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-contain p-1.5"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">📦</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/product/${product.id}`}
                          target="_blank"
                          className="text-xs font-semibold text-slate-900 hover:underline truncate block max-w-[200px] sm:max-w-sm"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                          <span>Cant: {item.quantity}</span>
                          <span>•</span>
                          <span>${Number(product.price).toLocaleString()} c/u</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                        ${(Number(product.price) * item.quantity).toLocaleString()}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadProfilePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto py-12 text-center font-mono text-xs text-slate-400">
          Cargando perfil del prospecto...
        </div>
      }
    >
      <LeadProfileContent params={params} />
    </Suspense>
  );
}