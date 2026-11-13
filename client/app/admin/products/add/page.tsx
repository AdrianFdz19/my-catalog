"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category_id: "",
    description: "",
    price: "",
    stock: "0",
    is_active: true,
    tag: "",
  });

  // Estado para las imágenes seleccionadas (archivos y sus previsualizaciones)
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Estado para controlar qué imagen se está viendo en pantalla grande
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      name,
      slug: generatedSlug,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejador para la selección de múltiples imágenes estilo Marketplace
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    // Acumulamos las nuevas imágenes con las que ya existían
    setImages((prev) => [...prev, ...filesArray]);

    // Creamos URLs temporales para la previsualización visual
    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  // Manejador para eliminar una imagen de la lista
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prev) =>
      prev.filter((_, index) => {
        // Liberamos la memoria del objeto URL creado
        URL.revokeObjectURL(prev[indexToRemove]);
        return index !== indexToRemove;
      })
    );
  };

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Guardamos las rutas internas por si necesitamos hacer rollback
    const uploadedPaths: string[] = [];

    try {
      const uploadedImageUrls: string[] = [];

      // PASO 1 y 2: Iterar, subir a Supabase Storage y obtener sus URLs públicas
      for (const file of images) {
        const fileExt = file.name.split(".").pop();
        const randomString = Math.random().toString(36).substring(2, 9);
        const filePath = `${Date.now()}-${randomString}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }

        uploadedPaths.push(filePath);

        const { data: publicData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          uploadedImageUrls.push(publicData.publicUrl);
        }
      }

      // PASO 3: Enviar payload al API Route Handler
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        images: uploadedImageUrls,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar el producto.");
      }

      alert("Producto guardado correctamente.");
      router.push("/");
      router.refresh();

    } catch (error) {
      // Rollback: Si algo falló después de subir imágenes, las borramos del bucket
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("products").remove(uploadedPaths);
      }

      console.error("Error en el proceso:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Hubo un error al guardar el producto."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <nav className="text-sm text-slate-500 mb-1">
              <Link href="/products" className="hover:text-slate-800 transition">
                Products
              </Link>{" "}
              / <span className="text-slate-900 font-medium">Add New</span>
            </nav>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Add New Product
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create a new catalog item and index its description for AI search.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="add-product-form"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
            >
              {isSubmitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>

        {/* Form Grid */}
        <form
          id="add-product-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column: Core Product Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
                General Information
              </h2>

              {/* Product Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g., MacBook Pro 14 M3 (Refurbished - Grade A)"
                  className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg border border-slate-300 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent">
                  <span className="px-3 py-2 text-sm text-slate-500 select-none border-r border-slate-300">
                    /products/
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="macbook-pro-14-m3"
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tag" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Etiqueta / Tag (Opcional)
                </label>
                <input
                  type="text"
                  id="tag"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  placeholder="Ej. Nuevo, Oferta, Destacado"
                  className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              {/* SECCIÓN DE IMÁGENES ESTILO FACEBOOK MARKETPLACE */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Product Images <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Upload multiple photos. The first image will be used as the cover.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Previsualizaciones de imágenes seleccionadas */}
                  {imagePreviews.map((src, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedImageModal(src)} // Al hacer clic en la tarjeta se abre en grande
                      className="relative group h-28 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-sm cursor-pointer"
                      title="Haz clic para ver en grande"
                    >
                      <Image
                        src={src}
                        alt={`Preview ${index}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Ícono demostrativo al pasar el cursor para ampliar */}
                      <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>

                      {/* Botón para eliminar (X) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Evita que se abra el modal al querer borrar la foto
                          handleRemoveImage(index);
                        }}
                        className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition shadow-md z-10"
                        title="Eliminar imagen"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {index === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded pointer-events-none">
                          Portada
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Tarjeta de botón para agregar más fotos */}
                  <label className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/60 rounded-xl h-28 flex flex-col items-center justify-center cursor-pointer transition text-slate-500">
                    <svg className="w-6 h-6 mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs font-medium text-slate-600">Add Photos</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Description (Crucial for RAG embedding quality) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Description & Specs <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    Used for semantic AI search
                  </span>
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Include detailed specifications, condition, battery health, included accessories, and ideal use cases..."
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition resize-y"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Organization, Pricing & Inventory */}
          <div className="space-y-6">
            {/* Organization */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Organization
              </h2>

              <div>
                <label
                  htmlFor="category_id"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  required
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="block text-sm font-medium text-slate-700">
                    Active Status
                  </span>
                  <span className="text-xs text-slate-500">
                    Visible in public catalog
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_active}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: !prev.is_active,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${formData.is_active ? "bg-slate-900" : "bg-slate-200"
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_active ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Pricing & Inventory
              </h2>

              {/* Price */}
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm">
                    $
                  </span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label
                  htmlFor="stock"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* MODAL DE IMAGEN EN PANTALLA COMPLETA (LIGHTBOX) */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Botón flotante para cerrar */}
            <button
              type="button"
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition backdrop-blur-md z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Imagen ampliada */}
            <div className="relative w-full h-full min-h-[60vh]">
              <Image
                src={selectedImageModal}
                alt="Vista ampliada"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
