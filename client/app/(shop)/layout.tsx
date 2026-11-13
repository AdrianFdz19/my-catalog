import Header from "@/app/components/Header"; // Ajusta tu ruta si es necesario
import { Suspense } from "react";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={
        <header className="h-16 w-full border-b border-slate-200 bg-white/80" />
      }>
        <Header />
      </Suspense>
      {children}
    </>
  );
}