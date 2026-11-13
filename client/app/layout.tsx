import "./globals.css";

export const metadata = {
  title: "Mijail Catálogo - Tecnología & Seguridad",
  description: "Catálogo exclusivo de laptops, equipos de cómputo y cámaras de seguridad.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}