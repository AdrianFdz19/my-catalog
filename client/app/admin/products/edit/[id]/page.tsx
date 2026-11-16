"use client";

import { useState, useEffect, use, Suspense } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: number | string;
  name: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function EditProductContent({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Cargar categorías y datos del producto junto con sus imágenes de la tabla hija
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const catRes = await fetch("/api/categories");
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }

        // Consultamos el producto y las imágenes relacionadas en `product_images`
        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select(`
            *,
            product_images (
              image_url
            )
          `)
          .eq("id", id)
          .single();

        if (prodError || !prodData) {
          throw new Error("No se encontró el producto especificado.");
        }

        setFormData({
          name: prodData.name || "",
          slug: prodData.slug || "",
          category_id: prodData.category_id ? String(prodData.category_id) : "",
          description: prodData.description || "",
          price: prodData.price ? String(prodData.price) : "",
          stock: prodData.stock !== undefined && prodData.stock !== null ? String(prodData.stock) : "0",
          is_active: prodData.is_active ?? true,
          tag: prodData.tag || "",
        });

        // Extraer las URLs de la tabla hija `product_images`
        if (prodData.product_images && Array.isArray(prodData.product_images)) {
          const urls = prodData.product_images.map((img: { image_url: string }) => img.image_url);
          setExistingImages(urls);
        } else if (prodData.image_url) {
          setExistingImages([prodData.image_url]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setErrorMsg(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, supabase]);

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    setNewImages((prev) => [...prev, ...filesArray]);
    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number, type: "existing" | "new") => {
    if (type === "existing") {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setNewImages((prev) => prev.filter((_, i) => i !== index));
      setNewImagePreviews((prev) => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const uploadedPaths: string[] = [];

    try {
      const newlyUploadedUrls: string[] = [];

      // 1. Subir las nuevas imágenes al Storage de Supabase
      for (const file of newImages) {
        const fileExt = file.name.split(".").pop();
        const randomString = Math.random().toString(36).substring(2, 9);
        const filePath = `${Date.now()}-${randomString}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Error al subir la nueva imagen: ${uploadError.message}`);
        }

        uploadedPaths.push(filePath);

        const { data: publicData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          newlyUploadedUrls.push(publicData.publicUrl);
        }
      }

      // 2. Combinar las imágenes existentes que se conservaron + las recién subidas
      const finalImagesArray = [...existingImages, ...newlyUploadedUrls];

      // 3. Enviar payload completo mediante PATCH
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        images: finalImagesArray,
      };

      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar el producto.");
      }

      alert("Producto actualizado correctamente.");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("products").remove(uploadedPaths);
      }

      console.error("Error en el proceso de edición:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Hubo un error al actualizar el producto."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 text-center text-sm font-mono text-slate-400">
        Cargando datos del producto...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <nav className="text-sm text-slate-500 mb-1">
              <Link href="/admin/products" className="hover:text-slate-800 transition">
                Products
              </Link>{" "}
              / <span className="text-slate-900 font-medium">Edit Product</span>
            </nav>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Edit Product: {formData.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Update catalog details and sync changes with the AI assistant index.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="edit-product-form"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition shadow-sm cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        <form
          id="edit-product-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
                General Information
              </h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1.5">
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
                  className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                />
              </div>

              {/* SECCIÓN DE IMÁGENES */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Product Images <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Manage product photos. The first image will be used as the cover.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingImages.map((src, index) => (
                    <div
                      key={`existing-${index}`}
                      onClick={() => setSelectedImageModal(src)}
                      className="relative group h-28 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-sm cursor-pointer"
                    >
                      <Image
                        src={src}
                        alt={`Existing ${index}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index, "existing");
                        }}
                        className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition shadow-md z-10"
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

                  {newImagePreviews.map((src, index) => (
                    <div
                      key={`new-${index}`}
                      onClick={() => setSelectedImageModal(src)}
                      className="relative group h-28 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-sm cursor-pointer"
                    >
                      <Image
                        src={src}
                        alt={`New Preview ${index}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index, "new");
                        }}
                        className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition shadow-md z-10"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {existingImages.length === 0 && index === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded pointer-events-none">
                          Portada
                        </span>
                      )}
                    </div>
                  ))}

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

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description & Specs <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition resize-y"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Organization
              </h2>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-slate-700 mb-1.5">
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

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="block text-sm font-medium text-slate-700">Active Status</span>
                  <span className="text-xs text-slate-500">Visible in public catalog</span>
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
                    formData.is_active ? "bg-slate-900" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.is_active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
                Pricing & Inventory
              </h2>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 text-sm">$</span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-slate-700 mb-1.5">
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

      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition backdrop-blur-md z-10 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative w-full h-full min-h-[60vh]">
              <Image src={selectedImageModal} alt="Vista ampliada" fill className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEditProductPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 py-12 text-center text-sm font-mono text-slate-400">Cargando editor...</div>}>
      <EditProductContent params={params} />
    </Suspense>
  );
}