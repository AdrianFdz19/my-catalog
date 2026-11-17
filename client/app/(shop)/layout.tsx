import Header from "@/app/components/Header"; // Ajusta tu ruta si es necesario
import { Suspense } from "react";
import { CartProvider } from "../context/CartProvider";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CartProvider>
        <Suspense fallback={
          <header className="h-16 w-full border-b border-slate-200 bg-white/80" />
        }>
          <Header />
        </Suspense>
        {children}
      </CartProvider>
    </>
  );
}