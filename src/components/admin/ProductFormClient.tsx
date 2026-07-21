"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductInput } from "@/validators/product";
import { Plus, Trash2, Upload, Loader2, Image as ImageIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface ProductFormClientProps {
  categories: Category[];
  initialProduct?: {
    id: string;
    name: string;
    description: string;
    price: number;
    material: string | null;
    care: string | null;
    categoryId: string;
    collection: string | null;
    gender: string | null;
    images: { url: string }[];
    variants: { size: string; color: string; colorHex: string; stock: number; sku: string }[];
  };
}

import { COLORS_OPTIONS } from "@/components/shop/ShopCatalogClient";

const getColorHex = (colorName: string) => {
  const colors: Record<string, string> = {
    hitam: "#000000",
    putih: "#ffffff",
    "abu-abu": "#808080",
    abu: "#808080",
    biru: "#3b82f6",
    merah: "#ef4444",
    hijau: "#22c55e",
    kuning: "#facc15",
    orange: "#fb923c",
    ungu: "#7c3aed",
    pink: "#db2777",
    coklat: "#78350f",
    beige: "#f5f5dc",
    cream: "#fffdd0",
    navy: "#000080",
    olive: "#808000",
    khaki: "#c3b091",
    maroon: "#800000",
    tosca: "#40e0d0",
    cyan: "#00ffff",
    gold: "#ffd700",
    silver: "#c0c0c0",

    // English fallbacks
    black: "#000000",
    white: "#ffffff",
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    gray: "#808080",
    grey: "#808080",
    charcoal: "#333333",
    purple: "#7c3aed",
    brown: "#78350f",
  };
  const name = colorName.toLowerCase().trim();
  return colors[name] || "#000000";
};

export const ProductFormClient: React.FC<ProductFormClientProps> = ({
  categories,
  initialProduct,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!initialProduct;

  // Setup form values
  const defaultValues: Partial<ProductInput> = isEditMode
    ? {
        name: initialProduct.name,
        description: initialProduct.description,
        price: Number(initialProduct.price),
        material: initialProduct.material || "",
        care: initialProduct.care || "",
        categoryId: initialProduct.categoryId,
        collection: (initialProduct.collection || "") as any,
        gender: (initialProduct.gender || "") as any,
        images: initialProduct.images.map((img) => img.url),
        variants: initialProduct.variants.map((v) => ({
          size: v.size as "XS" | "S" | "M" | "L" | "XL" | "XXL",
          color: v.color,
          colorHex: v.colorHex,
          stock: v.stock,
          sku: v.sku,
        })),
      }
    : {
        name: "",
        description: "",
        price: 0,
        material: "",
        care: "",
        categoryId: "",
        collection: "" as any,
        gender: "" as any,
        images: [],
        variants: [{ size: "M", color: "", colorHex: "#000000", stock: 10, sku: "" }],
      };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues as any,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const currentImages = watch("images") || [];

  // Handle image upload via API
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await res.json();
      if (data.url) {
        setValue("images", [...currentImages, data.url], { shouldValidate: true });
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Gagal mengunggah gambar. Pastikan file valid.");
    } finally {
      setUploadingImage(false);
      // Reset input element value to allow uploading same file again
      e.target.value = "";
    }
  };

  // Add manual image URL
  const handleAddManualUrl = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!manualImageUrl.trim()) return;

    try {
      // Basic URL format validation
      new URL(manualImageUrl.trim());
      setValue("images", [...currentImages, manualImageUrl.trim()], { shouldValidate: true });
      setManualImageUrl("");
    } catch {
      alert("Masukkan format URL gambar yang valid (contoh: https://images.unsplash.com/...)");
    }
  };

  // Remove image from form state
  const handleRemoveImage = (index: number) => {
    setValue(
      "images",
      currentImages.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  // Auto-generate SKU suggestions based on product name and variant
  const handleGenerateSKU = (index: number) => {
    const productName = watch("name");
    const variant = watch(`variants.${index}`);
    if (!productName || !variant.color || !variant.size) {
      alert("Isi Nama Produk, Warna Varian, dan Ukuran terlebih dahulu.");
      return;
    }

    const namePrefix = productName
      .slice(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "B");
    const colorPrefix = variant.color
      .slice(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "X");
    const sizePrefix = variant.size.toUpperCase();
    const randomSuffix = Math.floor(100 + Math.random() * 900);

    const skuSuggestion = `BBR-${namePrefix}-${colorPrefix}-${sizePrefix}-${randomSuffix}`;
    setValue(`variants.${index}.sku`, skuSuggestion, { shouldValidate: true });
  };

  // Extract message from react-hook-form error node (handles root, message, etc.)
  const getErrMsg = (errNode: any): string | null => {
    if (!errNode) return null;
    if (typeof errNode.message === "string" && errNode.message) return errNode.message;
    if (errNode.root?.message) return errNode.root.message;
    return null;
  };

  // Called when react-hook-form validation FAILS (before submit)
  const onValidationError = (errs: any) => {
    console.warn("Form validation errors:", errs);
    const messages: string[] = [];

    const nameMsg = getErrMsg(errs.name);
    if (nameMsg) messages.push(`• Nama produk: ${nameMsg}`);

    const descMsg = getErrMsg(errs.description);
    if (descMsg) messages.push(`• Deskripsi: ${descMsg}`);

    const catMsg = getErrMsg(errs.categoryId);
    if (catMsg) messages.push(`• Kategori: ${catMsg}`);

    const priceMsg = getErrMsg(errs.price);
    if (priceMsg) messages.push(`• Harga: ${priceMsg}`);

    // images array error: may be at errs.images.root.message or errs.images.message
    const imgMsg = errs.images?.root?.message || errs.images?.message || getErrMsg(errs.images);
    if (imgMsg) messages.push(`• Gambar: ${imgMsg}`);

    // variants array error
    const varMsg = errs.variants?.root?.message || errs.variants?.message || getErrMsg(errs.variants);
    if (varMsg && typeof varMsg === "string") messages.push(`• Varian: ${varMsg}`);

    // Per-variant errors (errs.variants is an array)
    if (Array.isArray(errs.variants)) {
      errs.variants.forEach((v: any, i: number) => {
        if (!v) return;
        const colorMsg = getErrMsg(v.color);
        if (colorMsg) messages.push(`• Varian ${i + 1} - Warna: ${colorMsg}`);
        const stockMsg = getErrMsg(v.stock);
        if (stockMsg) messages.push(`• Varian ${i + 1} - Stok: ${stockMsg}`);
        const skuMsg = getErrMsg(v.sku);
        if (skuMsg) messages.push(`• Varian ${i + 1} - SKU: ${skuMsg}`);
      });
    }

    // Fallback: if we couldn't extract specific messages, show a generic one
    const msg =
      messages.length > 0
        ? messages.join("\n")
        : "Mohon lengkapi semua field yang wajib diisi (nama, deskripsi, kategori, harga, gambar, dan varian).";
    setSubmitError(msg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit form data
  const onSubmitForm = async (data: ProductInput) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Manual pre-flight check (belt-and-suspenders)
    const preflightErrors: string[] = [];
    if (!data.name || data.name.trim().length < 3) preflightErrors.push("• Nama produk minimal 3 karakter");
    if (!data.description || data.description.trim().length < 10) preflightErrors.push("• Deskripsi minimal 10 karakter");
    if (!data.categoryId) preflightErrors.push("• Pilih kategori terlebih dahulu");
    if (!data.gender) preflightErrors.push("• Pilih gender terlebih dahulu");
    if (!data.price || data.price <= 0) preflightErrors.push("• Harga harus lebih dari 0");
    if (!data.images || data.images.length === 0) preflightErrors.push("• Minimal 1 gambar harus ditambahkan. Klik tombol 'Add' setelah memasukkan URL gambar");
    if (!data.variants || data.variants.length === 0) preflightErrors.push("• Minimal 1 varian produk harus diisi");
    
    // Check duplicate color-size combinations
    const combinations = new Set<string>();
    let hasDuplicate = false;
    data.variants?.forEach((v, i) => {
      if (!v.color) preflightErrors.push(`• Varian ${i + 1}: Warna wajib diisi`);
      if (!v.sku || v.sku.length < 3) preflightErrors.push(`• Varian ${i + 1}: SKU minimal 3 karakter`);
      
      const key = `${v.color.trim().toLowerCase()}-${v.size}`;
      if (combinations.has(key)) {
        hasDuplicate = true;
      }
      combinations.add(key);
    });

    if (hasDuplicate) {
      preflightErrors.push("• Tidak boleh membuat variasi dengan kombinasi ukuran dan warna yang sama");
    }

    if (preflightErrors.length > 0) {
      setSubmitError(preflightErrors.join("\n"));
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsSubmitting(false);
      return;
    }

    try {
      // Automatically generate colorHex from color name
      const processedVariants = data.variants.map((v) => ({
        ...v,
        colorHex: getColorHex(v.color),
      }));
      const processedData = {
        ...data,
        variants: processedVariants,
      };

      const url = isEditMode
        ? `/api/admin/products/${initialProduct.id}`
        : "/api/admin/products";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processedData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error || `HTTP ${res.status}: Gagal menyimpan produk`;
        if (res.status === 401) {
          throw new Error("Anda tidak memiliki izin. Silakan login ulang sebagai admin (admin@barbara.com).");
        }
        throw new Error(msg);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      console.error("Submit error:", error);
      setSubmitError(error.message || "Terjadi kesalahan saat menyimpan produk.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <form onSubmit={handleSubmit(onSubmitForm, onValidationError)} className="space-y-12 font-sans">
      {/* Global Error Banner */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-xs font-black uppercase tracking-widest text-red-600">⚠ Gagal Menyimpan Produk</p>
          {submitError.split("\n").map((line, i) => (
            <p key={i} className="text-[11px] text-red-500 font-medium">{line}</p>
          ))}
        </div>
      )}
      {/* Header & Back Action */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-brand-light pb-6">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-gray-light hover:text-brand-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-wider text-brand-black">
            {isEditMode ? "Edit Product" : "New Product"}
          </h1>
          <p className="text-xs text-brand-gray-light uppercase tracking-wider mt-1">
            {isEditMode ? "Modify existing inventory item" : "Create new item in catalogue"}
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-brand-black text-brand-white text-xs font-bold uppercase tracking-widest px-8 py-4 hover:bg-brand-white hover:text-brand-black border border-brand-black transition-all duration-300 rounded-xl cursor-pointer w-full md:w-auto"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmitting ? "Saving..." : isEditMode ? "Update Product" : "Publish Product"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left Section: Core Form Data */}
        <div className="md:col-span-2 space-y-8">
          <div className="border border-brand-light bg-brand-white p-6 md:p-8 space-y-6 rounded-2xl shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black border-b border-brand-light pb-3">
              General Info
            </h2>

            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="e.g. OVERSIZED MONOCHROME HOODIE"
                {...register("name")}
                className="input-minimalist"
              />
              {errors.name && (
                <p className="text-[10px] font-bold text-red-500 uppercase mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
                Description *
              </label>
              <textarea
                placeholder="Enter rich details about design, fitting, styling, etc."
                rows={5}
                {...register("description")}
                className="w-full bg-brand-light border border-transparent p-4 outline-none rounded-xl text-xs text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
              />
              {errors.description && (
                <p className="text-[10px] font-bold text-red-500 uppercase mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Category, Gender, Collection & Price Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
                  Category *
                </label>
                <select
                  {...register("categoryId")}
                  className="w-full bg-brand-light border border-transparent py-3.5 px-4 outline-none rounded-xl text-xs font-bold uppercase tracking-wider text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
                >
                  <option value="">Select Category</option>
                  {categories
                    .filter((cat) => ["Tops", "Bottoms", "Outerwear"].includes(cat.name))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                {errors.categoryId && (
                  <p className="text-[10px] font-bold text-red-500 uppercase mt-1">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
                  Gender *
                </label>
                <select
                  {...register("gender")}
                  className="w-full bg-brand-light border border-transparent py-3.5 px-4 outline-none rounded-xl text-xs font-bold uppercase tracking-wider text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
                >
                  <option value="">Select Gender</option>
                  <option value="MEN">Pria</option>
                  <option value="WOMEN">Wanita</option>
                </select>
                {errors.gender && (
                  <p className="text-[10px] font-bold text-red-500 uppercase mt-1">
                    {errors.gender.message}
                  </p>
                )}
              </div>

              {/* Collection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
                  Collection
                </label>
                <select
                  {...register("collection")}
                  className="w-full bg-brand-light border border-transparent py-3.5 px-4 outline-none rounded-xl text-xs font-bold uppercase tracking-wider text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
                >
                  <option value="">No Collection</option>
                  <option value="NEW_ARRIVALS">New Arrivals</option>
                  <option value="BEST_SELLERS">Best Sellers</option>
                  <option value="GRAPHIC_TEES">Graphic Tees</option>
                  <option value="OVERSIZED_COLLECTION">Oversized Collection</option>
                  <option value="ESSENTIALS">Essentials</option>
                  <option value="LIMITED_EDITION">Limited Edition</option>
                </select>
                {errors.collection && (
                  <p className="text-[10px] font-bold text-red-500 uppercase mt-1">
                    {errors.collection.message}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
                  Price (IDR) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 599000"
                  {...register("price", { valueAsNumber: true })}
                  className="input-minimalist"
                />
                {errors.price && (
                  <p className="text-[10px] font-bold text-red-500 uppercase mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-brand-light">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
                  Material
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100% Cotton French Terry"
                  {...register("material")}
                  className="input-minimalist"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
                  Care Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cold machine wash, dry flat"
                  {...register("care")}
                  className="input-minimalist"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Variant Manager */}
          <div className="border border-brand-light bg-brand-white p-6 md:p-8 space-y-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-light pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-brand-black">
                Product Variants
              </h2>
              <button
                type="button"
                onClick={() =>
                  append({
                    size: "M",
                    color: "",
                    colorHex: "#000000",
                    stock: 5,
                    sku: "",
                  })
                }
                className="flex items-center gap-1 border border-brand-black text-brand-black text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 hover:bg-brand-black hover:text-brand-white transition-all cursor-pointer rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            {errors.variants?.message && (
              <p className="text-[10px] font-bold text-red-500 uppercase">
                {errors.variants.message}
              </p>
            )}

            <div className="space-y-6 divide-y divide-brand-light">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className={`pt-6 first:pt-0 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end`}
                >
                  {/* Size */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-brand-gray-light">
                      Size
                    </label>
                    <select
                      {...register(`variants.${index}.size` as const)}
                      className="w-full bg-brand-light border border-transparent py-2.5 px-3 outline-none rounded-xl text-xs font-bold uppercase tracking-wider text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
 
                  {/* Color */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-brand-gray-light">
                      Warna Varian *
                    </label>
                    <select
                      {...register(`variants.${index}.color` as const)}
                      className="w-full bg-brand-light border border-transparent py-2.5 px-3 outline-none rounded-xl text-xs font-bold uppercase tracking-wider text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
                    >
                      <option value="">Pilih Warna</option>
                      {COLORS_OPTIONS.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                      {field.color && !COLORS_OPTIONS.includes(field.color as any) && (
                        <option value={field.color}>{field.color}</option>
                      )}
                    </select>
                    {(errors.variants as any)?.[index]?.color && (
                      <p className="text-[9px] font-bold text-red-500 mt-1">{(errors.variants as any)[index].color.message}</p>
                    )}
                  </div>
 
                  {/* Stock */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-brand-gray-light">
                      Stock
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      defaultValue={0}
                      {...register(`variants.${index}.stock` as const, {
                        valueAsNumber: true,
                        setValueAs: (v) => (isNaN(Number(v)) ? 0 : Number(v)),
                      })}
                      className="w-full bg-brand-light border border-transparent py-2.5 px-3 outline-none rounded-xl text-xs text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
                    />
                    {(errors.variants as any)?.[index]?.stock && (
                      <p className="text-[9px] font-bold text-red-500 mt-1">{(errors.variants as any)[index].stock.message}</p>
                    )}
                  </div>
 
                  {/* SKU */}
                  <div className="sm:col-span-3 space-y-1 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase tracking-wider text-brand-gray-light">
                        SKU
                      </label>
                      <button
                        type="button"
                        onClick={() => handleGenerateSKU(index)}
                        className="text-[8px] font-black uppercase tracking-widest text-brand-black hover:opacity-75 transition-opacity underline cursor-pointer"
                      >
                        Auto
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="SKU..."
                      {...register(`variants.${index}.sku` as const)}
                      className="w-full bg-brand-light border border-transparent py-2.5 px-3 outline-none rounded-xl text-xs text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
                    />
                    {(errors.variants as any)?.[index]?.sku && (
                      <p className="text-[9px] font-bold text-red-500 mt-1">{(errors.variants as any)[index].sku.message}</p>
                    )}
                  </div>

                  {/* Delete Action */}
                  <div className="sm:col-span-1 flex justify-end pb-1.5">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1.5 text-brand-gray-light hover:text-red-500 transition-colors cursor-pointer"
                        aria-label="Remove Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Image Manager */}
        <div className="md:col-span-1 space-y-6">
          <div className="border border-brand-light bg-brand-white p-6 md:p-8 space-y-6 rounded-2xl shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black border-b border-brand-light pb-3">
              Media Images
            </h2>

            {/* Error display if missing images */}
            {errors.images?.message && (
              <p className="text-[10px] font-bold text-red-500 uppercase">
                {(errors.images as any)?.root?.message || errors.images.message}
              </p>
            )}

            {/* File Drag / Selector */}
            <div className="border border-dashed border-brand-gray-light/60 p-6 text-center space-y-3 relative hover:border-brand-black transition-colors rounded-xl">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={uploadingImage}
                className="absolute inset-0 opacity-0 cursor-pointer rounded-xl"
              />
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-black" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                    Uploading image...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Upload className="w-6 h-6 text-brand-gray-light" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-black">
                    Drag file here
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-brand-gray-light font-bold">
                    or click to choose image file
                  </span>
                </div>
              )}
            </div>

            {/* Manual Image URL Input */}
            <div className="border-t border-brand-light pt-6 space-y-3">
              <label className="text-[9px] font-black uppercase tracking-wider text-brand-gray">
                Tambah via URL publik
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={manualImageUrl}
                  onChange={(e) => setManualImageUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddManualUrl(e as any); } }}
                  className="flex-1 bg-brand-light border border-transparent py-2 px-3 outline-none rounded-xl text-xs text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
                />
                <button
                  onClick={handleAddManualUrl}
                  type="button"
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 transition-colors cursor-pointer rounded-xl border ${
                    manualImageUrl.trim()
                      ? "bg-brand-black text-brand-white border-brand-black hover:bg-brand-gray"
                      : "border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white"
                  }`}
                >
                  + Tambah
                </button>
              </div>
              <p className="text-[9px] text-brand-gray-light">
                ⚠ Setelah memasukkan URL, klik tombol <strong>+ Tambah</strong> untuk menyimpan gambar.
              </p>
            </div>
 
            {/* Image Previews */}
            {currentImages.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-brand-light">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
                  Gallery Preview ({currentImages.length})
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {currentImages.map((url, idx) => (
                    <div
                      key={url + idx}
                      className="group relative aspect-[3/4] border border-brand-light bg-brand-light overflow-hidden rounded-xl"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="bg-brand-black text-brand-white p-1 hover:bg-red-500 transition-colors cursor-pointer rounded-lg"
                          aria-label="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 bg-brand-black text-brand-white text-[8px] font-black uppercase px-1.5 py-0.5 tracking-wider">
                        {idx === 0 ? "PRIMARY" : `IMG ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
