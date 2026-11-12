"use client";

import React, { useState } from "react";
import Link from "next/link";

// Replace with dynamic categories fetched from Supabase
const MOCK_CATEGORIES = [
  { id: 1, name: "Laptops" },
  { id: 2, name: "Cameras" },
  { id: 3, name: "Accessories" },
];

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category_id: "",
    description: "",
    price: "",
    stock: "0",
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Connect to Express API or Next.js Server Action
      console.log("Submitting product payload:", {
        ...formData,
        category_id: Number(formData.category_id),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
      });
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
              href="/products"
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
                  {MOCK_CATEGORIES.map((cat) => (
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
    </div>
  );
}