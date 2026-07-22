"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/stores/useCartStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { Modal } from "@/components/ui/Modal";
import { ProductCard } from "@/components/product/ProductCard";
import {
  Heart,
  Ruler,
  Check,
  Star,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  review: string;
  reviewImages: string[];
  createdAt: string;
  adminReply?: string | null;
  adminRepliedAt?: string | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  categoryName?: string;
  isNew?: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  material: string | null;
  care: string | null;
  categoryName?: string;
  categorySlug?: string;
  gender?: string;
  collection?: string | null;
  isNew?: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: RelatedProduct[];
  initialFavoriteIds?: string[];
}

const getColorHex = (colorName: string, defaultHex?: string) => {
  if (defaultHex && defaultHex !== "#000000" && defaultHex.startsWith("#")) {
    return defaultHex;
  }
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
    black: "#000000",
    white: "#ffffff",
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
  };
  const name = (colorName || "").toLowerCase().trim();
  return colors[name] || defaultHex || "#808080";
};

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product,
  relatedProducts = [],
  initialFavoriteIds,
}) => {
  const { data: session } = useSession();
  const addItem = useCartStore((state) => state.addItem);
  const isFavorite = useFavoriteStore((s) => s.isFavorite(product.id));
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const setFavoriteIds = useFavoriteStore((s) => s.setFavoriteIds);
  const isFavLoaded = useFavoriteStore((s) => s.isLoaded);
  const openModal = useAuthModalStore((s) => s.openModal);

  // Seed store with SSR-fetched IDs
  useEffect(() => {
    if (!isFavLoaded && initialFavoriteIds) {
      setFavoriteIds(initialFavoriteIds);
    }
  }, [isFavLoaded, initialFavoriteIds, setFavoriteIds]);

  // Gallery State
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Case-insensitive deduplication of unique colors
  const uniqueColorsMap = new Map<string, ProductVariant>();
  product.variants.forEach((v) => {
    const key = (v.color || "").trim().toLowerCase();
    if (key && !uniqueColorsMap.has(key)) {
      uniqueColorsMap.set(key, v);
    }
  });
  const uniqueColors = Array.from(uniqueColorsMap.values());

  const [selectedColor, setSelectedColor] = useState(
    uniqueColors[0]?.color || ""
  );

  // Unique sizes for the selected color
  const colorVariants = product.variants.filter(
    (v) => (v.color || "").trim().toLowerCase() === (selectedColor || "").trim().toLowerCase()
  );
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const [selectedSize, setSelectedSize] = useState("");

  // UI States
  const [activeTab, setActiveTab] = useState<"info" | "desc" | "specs">("info");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  // Switch image and color
  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    setSelectedSize(""); // Reset size when color changes

    // 1. Match by image alt including color name
    const altIdx = product.images.findIndex((img) =>
      (img.alt || "").toLowerCase().includes(colorName.toLowerCase().trim())
    );

    if (altIdx !== -1) {
      setActiveImageIdx(altIdx);
    } else {
      // 2. Fallback to color index in images array
      const colorIdx = uniqueColors.findIndex(
        (c) => c.color.toLowerCase().trim() === colorName.toLowerCase().trim()
      );
      if (colorIdx !== -1 && colorIdx < product.images.length) {
        setActiveImageIdx(colorIdx);
      }
    }
  };

  // Get active variant based on color and size
  const activeVariant = product.variants.find(
    (v) =>
      (v.color || "").trim().toLowerCase() === (selectedColor || "").trim().toLowerCase() &&
      v.size === selectedSize
  );

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleAddToCart = () => {
    if (isAdding) return;

    if (!selectedSize) {
      alert("Silakan pilih ukuran terlebih dahulu.");
      return;
    }

    if (!activeVariant) return;

    setIsAdding(true);

    addItem(
      {
        variantId: activeVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        size: activeVariant.size,
        color: activeVariant.color,
        price: product.price,
        imageUrl: product.images[0]?.url || "",
        maxStock: activeVariant.stock,
      },
      1
    );

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setIsAdding(false);
    }, 1000);
  };

  const handleToggleFavorit = async () => {
    if (!session?.user) {
      openModal("login");
      return;
    }
    setIsTogglingFav(true);
    await toggleFavorite(product.id);
    setIsTogglingFav(false);
  };

  // Badges helper
  const getBadges = () => {
    const list = [];
    if (product.isNew) list.push({ label: "New Arrival", bg: "bg-black text-white" });
    if (product.collection === "BEST_SELLERS") list.push({ label: "Best Seller", bg: "bg-amber-500 text-white" });
    if (product.collection === "LIMITED_EDITION") list.push({ label: "Limited Edition", bg: "bg-purple-600 text-white" });
    if (product.collection === "ESSENTIALS") list.push({ label: "Essentials", bg: "bg-brand-light text-brand-black border border-brand-light/80" });
    return list;
  };

  const badges = getBadges();

  return (
    <div className="flex flex-col gap-16 md:gap-24 w-full">
      {/* ── MAIN PRODUCT GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

        {/* LEFT COLUMN: IMAGE GALLERY (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4 sticky top-24">
          {/* Main Image View */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-light rounded-3xl border border-brand-light/60 shadow-sm group">
            <Image
              src={product.images[activeImageIdx]?.url || "/images/placeholder.jpg"}
              alt={product.images[activeImageIdx]?.alt || product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Badges Overlay */}
            {badges.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                {badges.map((b) => (
                  <span
                    key={b.label}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${b.bg}`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative aspect-[3/4] w-full overflow-hidden bg-brand-light cursor-pointer border rounded-2xl transition-all duration-200 ${activeImageIdx === idx
                      ? "border-brand-black ring-2 ring-brand-black scale-95"
                      : "border-transparent opacity-65 hover:opacity-100"
                    }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `Thumbnail ${idx}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PRODUCT INFO & PURCHASE OPTIONS (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* 1. Badges & Rating Header */}
          <div className="flex flex-col gap-3 border-b border-brand-light pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-brand-light px-3 py-1 rounded-full text-brand-black">
                {product.categoryName || "Clothing"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray bg-[#f5f5f5] px-2.5 py-1 rounded-full">
                For {product.gender || "Unisex"}
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider text-brand-black leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars */}
            {product.averageRating !== undefined && product.averageRating > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(product.averageRating || 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-brand-light fill-brand-light/30"
                        }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-brand-black">{product.averageRating} / 5.0</span>
                <span className="text-xs text-brand-gray-light font-medium">({product.reviewCount} ulasan)</span>
              </div>
            )}

            {/* Price */}
            <p className="text-2xl md:text-3xl font-black text-brand-black mt-2">
              {formatPrice(product.price)}
            </p>
          </div>

          {/* 2. Product Meta Highlights (Quick Attributes) */}
          <div className="grid grid-cols-2 gap-3 bg-[#fbfbfb] p-4 rounded-2xl border border-brand-light/70 text-xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">Kategori</span>
              <span className="font-bold text-brand-black">{product.categoryName || "Tops"}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">Untuk</span>
              <span className="font-bold text-brand-black">{product.gender || "Pria / Wanita"}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">Warna Terpilih</span>
              <span className="font-bold text-brand-black">{selectedColor || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">Ukuran Terpilih</span>
              <span className="font-bold text-brand-black">{selectedSize || "Belum Dipilih"}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">Stok Tersedia</span>
              <span className={`font-bold ${activeVariant ? (activeVariant.stock > 0 ? "text-green-600" : "text-red-500") : "text-brand-black"}`}>
                {activeVariant ? (activeVariant.stock > 0 ? `${activeVariant.stock} Pcs` : "Stok Habis") : "Pilih Ukuran"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light block">SKU Produk</span>
              <span className="font-bold text-brand-black font-mono text-[11px]">{activeVariant?.sku || "-"}</span>
            </div>
          </div>

          {/* 3. Color Selection */}
          {uniqueColors.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-brand-black">
                  Warna: <span className="font-bold text-brand-gray">{selectedColor}</span>
                </span>
                <span className="text-[10px] text-brand-gray font-bold uppercase tracking-wider">
                  {uniqueColors.length} Pilihan Warna
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {uniqueColors.map((v) => (
                  <button
                    key={v.color}
                    onClick={() => handleColorChange(v.color)}
                    className={`w-9 h-9 rounded-full border cursor-pointer flex items-center justify-center transition-all ${selectedColor.toLowerCase().trim() === v.color.toLowerCase().trim()
                        ? "border-brand-black ring-2 ring-brand-black scale-105"
                        : "border-brand-light hover:border-brand-gray-light"
                      }`}
                    title={v.color}
                  >
                    <span
                      className="w-7 h-7 inline-block rounded-full shadow-inner border border-black/10"
                      style={{ backgroundColor: getColorHex(v.color, v.colorHex) }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Size Selection */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-brand-black">
                Ukuran
              </span>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="flex items-center gap-1.5 text-xs text-brand-gray hover:text-brand-black font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Ruler className="w-4 h-4" />
                Size Guide
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {sizes.map((sz) => {
                const matchedVar = colorVariants.find((v) => v.size === sz);
                const isAvailable = matchedVar && matchedVar.stock > 0;

                return (
                  <button
                    key={sz}
                    onClick={() => isAvailable && setSelectedSize(sz)}
                    disabled={!isAvailable}
                    className={`py-3.5 border font-bold text-xs flex flex-col items-center justify-center transition-all rounded-xl cursor-pointer ${!isAvailable
                        ? "border-brand-light/60 bg-[#f7f7f7] text-brand-gray-light cursor-not-allowed opacity-50 line-through"
                        : selectedSize === sz
                          ? "bg-brand-black text-brand-white border-brand-black shadow-md scale-105"
                          : "border-brand-light/80 bg-brand-white hover:border-brand-black text-brand-black"
                      }`}
                  >
                    <span>{sz}</span>
                    <span className="text-[8px] mt-0.5 font-bold uppercase tracking-tight opacity-75">
                      {matchedVar ? (matchedVar.stock > 0 ? `${matchedVar.stock} Pcs` : "Sold Out") : "N/A"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Actions CTA (Add to Cart & Favorite) */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || !selectedSize || (activeVariant && activeVariant.stock <= 0)}
              className={`w-full font-black uppercase tracking-[0.2em] text-xs py-5 transition-all duration-300 rounded-xl border-2 border-brand-black focus:outline-none cursor-pointer flex items-center justify-center gap-2 ${isAdding || !selectedSize
                  ? "bg-brand-light text-brand-gray-light border-brand-light cursor-not-allowed"
                  : isAdded
                    ? "bg-brand-white text-green-600 border-green-600 hover:bg-brand-white"
                    : "bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black"
                }`}
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-gray-light border-t-transparent rounded-full animate-spin" />
                  Menambahkan...
                </>
              ) : isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  Berhasil Ditambahkan!
                </>
              ) : !selectedSize ? (
                "Pilih Ukuran Dulu"
              ) : activeVariant && activeVariant.stock <= 0 ? (
                "Stok Habis / Sold Out"
              ) : (
                "Tambah Ke Keranjang"
              )}
            </button>

            <button
              onClick={handleToggleFavorit}
              disabled={isTogglingFav}
              className={`w-full font-black uppercase tracking-[0.2em] text-xs py-4 transition-all duration-300 rounded-xl border-2 cursor-pointer flex items-center justify-center gap-2 ${isFavorite
                  ? "bg-red-50 text-red-500 border-red-300 hover:bg-red-500 hover:text-white"
                  : "bg-transparent text-brand-black border-brand-black hover:bg-brand-black hover:text-brand-white"
                }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              {isTogglingFav ? "Memproses..." : isFavorite ? "Sudah Difavoritkan" : "Tambah Ke Favorit"}
            </button>
          </div>

          {/* 6. Shipping & Guarantee Banner */}
          <div className="bg-[#fbfbfb] border border-brand-light/80 p-4 rounded-2xl flex flex-col gap-3 text-xs text-brand-gray">
            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 text-brand-black shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-brand-black uppercase tracking-wider block">Estimasi Pengiriman</span>
                <span className="text-[11px] leading-relaxed">
                  Dikirim dalam <strong>1 – 2 hari kerja</strong>. Estimasi tiba <strong>2 – 5 hari</strong> tergantung lokasi kota tujuan.
                </span>
              </div>
            </div>

            <div className="border-t border-brand-light/60 pt-3 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-brand-black shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-brand-black uppercase tracking-wider block">Jaminan Kualitas BARBARA</span>
                <span className="text-[11px] leading-relaxed">
                  100% Original & Garansi Pengembalian jika terdapat cacat produksi.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── DETAILED TABS: INFORMASI, DESKRIPSI & SPESIFIKASI ─────────── */}
      <div className="border-t border-brand-light pt-12 flex flex-col gap-8">

        {/* Tab Headers */}
        <div className="flex border-b border-brand-light overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("info")}
            className={`pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 cursor-pointer transition-colors whitespace-nowrap ${activeTab === "info"
                ? "border-brand-black text-brand-black"
                : "border-transparent text-brand-gray-light hover:text-brand-black"
              }`}
          >
            Informasi Produk
          </button>
          <button
            onClick={() => setActiveTab("desc")}
            className={`pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 cursor-pointer transition-colors whitespace-nowrap ${activeTab === "desc"
                ? "border-brand-black text-brand-black"
                : "border-transparent text-brand-gray-light hover:text-brand-black"
              }`}
          >
            Deskripsi Produk
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={`pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 cursor-pointer transition-colors whitespace-nowrap ${activeTab === "specs"
                ? "border-brand-black text-brand-black"
                : "border-transparent text-brand-gray-light hover:text-brand-black"
              }`}
          >
            Spesifikasi Produk
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[160px]">
          {/* TAB 1: INFORMASI PRODUK */}
          {activeTab === "info" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <div className="bg-[#fbfbfb] p-5 rounded-2xl border border-brand-light/70 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-gray-light block">
                  Material
                </span>
                <p className="text-xs font-bold text-brand-black">
                  {product.material || "100% Premium Cotton Heavyweight 24s"}
                </p>
              </div>

              <div className="bg-[#fbfbfb] p-5 rounded-2xl border border-brand-light/70 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-gray-light block">
                  Care Instructions
                </span>
                <p className="text-xs font-bold text-brand-black">
                  {product.care || "Cuci dengan air dingin, jemur rata, jangan gunakan pemutih"}
                </p>
              </div>

              <div className="bg-[#fbfbfb] p-5 rounded-2xl border border-brand-light/70 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-gray-light block">
                  Fit / Model
                </span>
                <p className="text-xs font-bold text-brand-black">
                  Oversized Fit (Boxy Cut)
                </p>
              </div>

              <div className="bg-[#fbfbfb] p-5 rounded-2xl border border-brand-light/70 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-gray-light block">
                  Ketebalan Bahan
                </span>
                <p className="text-xs font-bold text-brand-black">
                  24s (Medium-Heavyweight)
                </p>
              </div>

              <div className="bg-[#fbfbfb] p-5 rounded-2xl border border-brand-light/70 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-gray-light block">
                  Asal Produksi
                </span>
                <p className="text-xs font-bold text-brand-black">
                  Made in Indonesia 🇮🇩
                </p>
              </div>

              <div className="bg-[#fbfbfb] p-5 rounded-2xl border border-brand-light/70 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-gray-light block">
                  Berat Produk
                </span>
                <p className="text-xs font-bold text-brand-black">
                  350 gram
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB 2: DESKRIPSI PRODUK */}
          {activeTab === "desc" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 max-w-3xl"
            >
              <p className="text-xs md:text-sm text-brand-gray leading-relaxed whitespace-pre-line">
                {product.description}
              </p>

              <div className="border-t border-brand-light pt-4 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-black">
                  Keunggulan Produk:
                </h4>
                <ul className="text-xs text-brand-gray space-y-2 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                    <span><strong>100% Cotton Heavyweight</strong>: Bahan tebal, halus, dan menyerap keringat.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                    <span><strong>Oversized Fit</strong>: Siluet baju kekinian yang santai dan nyaman dipakai seharian.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                    <span><strong>Soft & Nyaman Dipakai</strong>: Tekstur kain lembut di kulit tanpa menimbulkan iritasi.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                    <span><strong>Jahitan Ganda Presisi</strong>: Jahitan kuat pada kerah, bahu, dan lipatan bawah.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                    <span><strong>Cocok Sehari-hari</strong>: Mudah dipadupadankan untuk berbagai gaya casual streetwear.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SPESIFIKASI PRODUK */}
          {activeTab === "specs" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-xl"
            >
              <div className="overflow-hidden border border-brand-light rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-brand-light bg-[#fbfbfb]">
                      <td className="py-3.5 px-5 font-black uppercase tracking-wider text-brand-black w-1/3">
                        Kategori
                      </td>
                      <td className="py-3.5 px-5 font-medium text-brand-gray">
                        {product.categoryName || "Tops"}
                      </td>
                    </tr>
                    <tr className="border-b border-brand-light">
                      <td className="py-3.5 px-5 font-black uppercase tracking-wider text-brand-black">
                        Gender
                      </td>
                      <td className="py-3.5 px-5 font-medium text-brand-gray">
                        {product.gender || "Pria / Wanita"}
                      </td>
                    </tr>
                    <tr className="border-b border-brand-light bg-[#fbfbfb]">
                      <td className="py-3.5 px-5 font-black uppercase tracking-wider text-brand-black">
                        Warna
                      </td>
                      <td className="py-3.5 px-5 font-medium text-brand-gray">
                        {selectedColor || "Hitam"}
                      </td>
                    </tr>
                    <tr className="border-b border-brand-light">
                      <td className="py-3.5 px-5 font-black uppercase tracking-wider text-brand-black">
                        Material
                      </td>
                      <td className="py-3.5 px-5 font-medium text-brand-gray">
                        {product.material || "Cotton 24s"}
                      </td>
                    </tr>
                    <tr className="border-b border-brand-light bg-[#fbfbfb]">
                      <td className="py-3.5 px-5 font-black uppercase tracking-wider text-brand-black">
                        Fit
                      </td>
                      <td className="py-3.5 px-5 font-medium text-brand-gray">
                        Oversized Fit
                      </td>
                    </tr>
                    <tr className="border-b border-brand-light">
                      <td className="py-3.5 px-5 font-black uppercase tracking-wider text-brand-black">
                        Berat
                      </td>
                      <td className="py-3.5 px-5 font-medium text-brand-gray">
                        350 gram
                      </td>
                    </tr>
                    <tr className="bg-[#fbfbfb]">
                      <td className="py-3.5 px-5 font-black uppercase tracking-wider text-brand-black">
                        Made In
                      </td>
                      <td className="py-3.5 px-5 font-bold text-brand-black">
                        Indonesia
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── SIZE GUIDE MODAL ─────────────────────────────────────────── */}
      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Size Guide"
      >
        <div className="flex flex-col gap-6">
          <p className="text-xs text-brand-gray leading-relaxed">
            Semua ukuran disesuaikan untuk standar oversized unisex BARBARA. Silakan ukur sebelum memesan.
          </p>

          <div className="overflow-x-auto w-full scrollbar-none">
            <table className="w-full min-w-[400px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-brand-black">
                  <th className="py-3 font-bold uppercase tracking-wider text-brand-black">Size</th>
                  <th className="py-3 font-bold uppercase tracking-wider text-brand-black">Chest Width (cm)</th>
                  <th className="py-3 font-bold uppercase tracking-wider text-brand-black">Length (cm)</th>
                  <th className="py-3 font-bold uppercase tracking-wider text-brand-black">Sleeve Length (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-brand-light">
                  <td className="py-3 font-bold text-brand-black">XS</td>
                  <td className="py-3 text-brand-gray">48</td>
                  <td className="py-3 text-brand-gray">66</td>
                  <td className="py-3 text-brand-gray">22</td>
                </tr>
                <tr className="border-b border-brand-light">
                  <td className="py-3 font-bold text-brand-black">S</td>
                  <td className="py-3 text-brand-gray">51</td>
                  <td className="py-3 text-brand-gray">69</td>
                  <td className="py-3 text-brand-gray">23</td>
                </tr>
                <tr className="border-b border-brand-light">
                  <td className="py-3 font-bold text-brand-black">M</td>
                  <td className="py-3 text-brand-gray">54</td>
                  <td className="py-3 text-brand-gray">72</td>
                  <td className="py-3 text-brand-gray">24</td>
                </tr>
                <tr className="border-b border-brand-light">
                  <td className="py-3 font-bold text-brand-black">L</td>
                  <td className="py-3 text-brand-gray">57</td>
                  <td className="py-3 text-brand-gray">75</td>
                  <td className="py-3 text-brand-gray">25</td>
                </tr>
                <tr className="border-b border-brand-light">
                  <td className="py-3 font-bold text-brand-black">XL</td>
                  <td className="py-3 text-brand-gray">60</td>
                  <td className="py-3 text-brand-gray">78</td>
                  <td className="py-3 text-brand-gray">26</td>
                </tr>
                <tr className="border-b border-brand-black">
                  <td className="py-3 font-bold text-brand-black">XXL</td>
                  <td className="py-3 text-brand-gray">63</td>
                  <td className="py-3 text-brand-gray">81</td>
                  <td className="py-3 text-brand-gray">27</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-brand-light p-4 rounded-xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gray-light block">Fitting Note</span>
            <p className="text-xs text-brand-gray mt-1 leading-relaxed">
              Model pria tinggi 182cm mengenakan ukuran L. Model wanita tinggi 170cm mengenakan ukuran M.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── REVIEWS SECTION ───────────────────────────────────────────── */}
      <div className="border-t border-brand-light pt-16 flex flex-col gap-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
            Customer Feedback
          </p>
          <h2 className="text-xl md:text-3xl font-black tracking-widest text-brand-black mt-1">
            ULASAN & RATING
          </h2>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 bg-[#fbfbfb] border border-brand-light p-8 rounded-2xl flex flex-col gap-6">
              <div className="flex flex-col items-center justify-center text-center py-4 border-b border-brand-light/70">
                <span className="text-5xl font-black text-brand-black">
                  {product.averageRating?.toFixed(1) || "0.0"}
                </span>
                <span className="text-xs text-brand-gray font-bold uppercase tracking-wider mt-1">
                  dari 5.0
                </span>
                <div className="flex items-center gap-1 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(product.averageRating || 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-brand-light fill-brand-light/30"
                        }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-brand-gray-light font-medium mt-2">
                  ({product.reviewCount} ulasan)
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const starVal = 5 - idx;
                  const count = product.reviews!.filter((r) => r.rating === starVal).length;
                  const percentage = product.reviews!.length > 0 ? (count / product.reviews!.length) * 100 : 0;
                  return (
                    <div key={starVal} className="flex items-center gap-3 text-xs">
                      <span className="w-3 font-bold text-brand-black">{starVal}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-brand-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-black rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-medium text-brand-gray-light">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-8">
              {product.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="pb-8 border-b border-brand-light last:pb-0 last:border-b-0 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-light border border-brand-light overflow-hidden flex items-center justify-center flex-shrink-0">
                        {rev.userAvatar ? (
                          <Image
                            src={rev.userAvatar}
                            alt={rev.userName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-brand-gray">
                            {rev.userName.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-brand-black">
                          {rev.userName}
                        </h4>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-amber-400 text-amber-400" : "text-brand-light fill-brand-light/30"
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-brand-gray-light font-medium">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(rev.createdAt))}
                    </span>
                  </div>

                  <p className="text-xs text-brand-gray leading-relaxed whitespace-pre-wrap pl-[52px]">
                    {rev.review}
                  </p>

                  {rev.reviewImages && rev.reviewImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-[52px] mt-1">
                      {rev.reviewImages.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setActiveZoomImage(img)}
                          className="relative w-16 h-16 rounded-xl overflow-hidden bg-brand-light border border-brand-light cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <Image
                            src={img}
                            alt={`Ulasan image ${i + 1}`}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {rev.adminReply && (
                    <div className="mt-2 ml-[52px] pl-4 border-l-2 border-brand-black bg-[#fbfbfb] p-4 rounded-r-xl space-y-1">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-[9px] font-black uppercase tracking-wider text-brand-black">
                          Balasan Resmi Tim BARBARA
                        </span>
                        {rev.adminRepliedAt && (
                          <span className="text-[9px] text-brand-gray-light font-medium">
                            {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(rev.adminRepliedAt))}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-gray leading-relaxed whitespace-pre-wrap">
                        {rev.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#fbfbfb] border border-brand-light border-dashed p-16 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gray-light">
              Belum Ada Ulasan
            </span>
            <p className="text-xs text-brand-gray mt-2 max-w-xs leading-relaxed">
              Jadilah yang pertama untuk memberikan ulasan setelah melakukan pembelian produk ini!
            </p>
          </div>
        )}
      </div>

      {/* ── RELATED PRODUCTS SECTION ───────────────────────────────────── */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="border-t border-brand-light pt-16 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
                Rekomendasi Pilihan
              </p>
              <h2 className="text-xl md:text-3xl font-black tracking-widest text-brand-black mt-1 uppercase">
                PRODUK TERKAIT
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-black uppercase tracking-wider border-b-2 border-brand-black pb-0.5 hover:opacity-70 transition-opacity"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <ProductCard
                key={rp.id}
                id={rp.id}
                slug={rp.slug}
                name={rp.name}
                price={rp.price}
                imageUrl={rp.imageUrl}
                brand={rp.categoryName || "BARBARA"}
                isNew={rp.isNew}
              />
            ))}
          </div>
        </div>
      )}

      {/* Review Image Zoom Lightbox */}
      {activeZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-brand-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setActiveZoomImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <img
              src={activeZoomImage}
              alt="Zoomed review image"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
