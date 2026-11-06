import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* INSIGNIA O ETIQUETA DE ERROR */}
        <span className="inline-block px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-widest text-slate-600 bg-slate-200/70 border border-slate-300 rounded-md">
          Error 404
        </span>

        {/* TÍTULO Y MENSAJE */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Página no encontrada
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Lo sentimos, el recurso o la dirección a la que intentas acceder no existe, fue movida o cambió de enlace.
          </p>
        </div>

        {/* ACCIONES */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl transition-all shadow-sm"
          >
            Volver al Catálogo Principal
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            Soporte por WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}