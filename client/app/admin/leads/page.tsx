"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/leads");
        if (!res.ok) throw new Error("Error al obtener los usuarios");

        const json = await res.json();
        setUsers(json.data || []);
      } catch (error) {
        console.error("Error cargando leads:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Filtrar usuarios en tiempo real por nombre, teléfono o correo
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ENCABEZADO Y NAVEGACIÓN */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-950 transition-colors mb-3"
            >
              ← Volver al Panel Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Panel de Prospectos (Leads)
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Clientes que han guardado sus datos de contacto desde el carrito de cotización.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-xs text-xs font-mono">
              <span className="text-slate-400">Total leads:</span>{" "}
              <span className="font-bold text-slate-950">{users.length}</span>
            </div>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-md bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:border-slate-950 transition-all"
          />
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-16 text-center shadow-sm">
            <p className="text-slate-500 text-sm font-mono animate-pulse">
              Cargando registros de usuarios...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">No se encontraron prospectos</h2>
            <p className="mt-1 text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
              {searchTerm ? "No hay resultados para tu búsqueda." : "Aún ningún usuario ha enviado sus datos de contacto en el carrito."}
            </p>
          </div>
        ) : (
          <>
            {/* 📱 VISTA MÓVIL: Tarjetas individuales en columna */}
            <div className="block sm:hidden space-y-4">
              {filteredUsers.map((user) => {
                const formattedDate = new Date(user.created_at).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                const cleanPhone = user.phone ? user.phone.replace(/\D/g, "") : "";
                const waMessage = encodeURIComponent(
                  `Hola ${user.name}, te contactamos de la tienda respecto a tu cotización reciente.`
                );
                const waLink = `https://wa.me/${cleanPhone}?text=${waMessage}`;

                return (
                  <div key={user.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {/* Enlace al perfil desde móvil */}
                        <Link href={`/admin/leads/${user.id}`}>
                          <h3 className="text-sm font-bold text-slate-950 hover:text-emerald-700 transition-colors">
                            {user.name} ↗
                          </h3>
                        </Link>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {formattedDate}
                        </p>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 font-bold text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase text-[10px]">Teléfono:</span>
                        {user.phone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-700 font-semibold hover:text-emerald-600 hover:underline inline-flex items-center gap-1"
                          >
                            {user.phone} ↗
                          </a>
                        ) : (
                          <span className="text-slate-300">No proporcionado</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 uppercase text-[10px]">Correo:</span>
                        {user.email ? (
                          <a href={`mailto:${user.email}`} className="text-slate-700 truncate max-w-[180px] hover:underline">
                            {user.email}
                          </a>
                        ) : (
                          <span className="text-slate-300">No proporcionado</span>
                        )}
                      </div>
                    </div>

                    {user.phone && (
                      <div className="pt-2">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs"
                        >
                          <span>Contactar por WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 💻 VISTA ESCRITORIO: Tabla tradicional optimizada */}
            <div className="hidden sm:block bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-6">Cliente / Empresa</th>
                      <th className="py-4 px-6">Teléfono</th>
                      <th className="py-4 px-6">Correo</th>
                      <th className="py-4 px-6">Fecha de Cotización</th>
                      <th className="py-4 px-6 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredUsers.map((user) => {
                      const formattedDate = new Date(user.created_at).toLocaleString("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      });

                      const cleanPhone = user.phone ? user.phone.replace(/\D/g, "") : "";
                      const waMessage = encodeURIComponent(
                        `Hola ${user.name}, te contactamos de la tienda respecto a tu cotización reciente.`
                      );
                      const waLink = `https://wa.me/${cleanPhone}?text=${waMessage}`;

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* ✅ Enlace correctamente colocado dentro de la celda td */}
                          <td className="py-4 px-6 font-bold text-slate-950">
                            <Link
                              href={`/admin/leads/${user.id}`}
                              className="hover:text-emerald-700 hover:underline transition-colors"
                            >
                              {user.name}
                            </Link>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-600">
                            {user.phone ? (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1"
                              >
                                {user.phone} ↗
                              </a>
                            ) : (
                              <span className="text-slate-300">No proporcionado</span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-600">
                            {user.email ? (
                              <a href={`mailto:${user.email}`} className="hover:underline">
                                {user.email}
                              </a>
                            ) : (
                              <span className="text-slate-300">No proporcionado</span>
                            )}
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-500 text-[11px]">
                            {formattedDate}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {user.phone && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-xl border border-emerald-200/60 transition-colors"
                              >
                                <span>Contactar</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}