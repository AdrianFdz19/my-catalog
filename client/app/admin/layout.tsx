import type { Metadata } from "next";
import AdminClientLayout from "../components/AdminClientLayout";

export const metadata: Metadata = {
    title: "Panel de Administración | Mi Catálogo",
    description: "Gestión interna de productos, inventario, categorías y prospectos comerciales.",
    robots: {
        index: false,
        follow: false, // Evita que los buscadores indexen el panel privado de admin
    },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminClientLayout>{children}</AdminClientLayout>;
}