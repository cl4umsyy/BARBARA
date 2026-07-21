"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/stores/useCartStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Heart, Ruler, Check, Star } from "lucide-react";
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

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  material: string | null;
  care: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
}

interface ProductDetailClientProps {
  product: Product;
  initialFavoriteIds?: string[];
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product,
  initialFavoriteIds,
}) => {
  const { data: session } = useSession();
  const addItem = useCartStore((state) => state.addItem);
  const isFavorite = useFavoriteStore((s) => s.isFavorite(product.id));
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const setFavoriteIds = useFavoriteStore((s) => s.setFavoriteIds);
  const isFavLoaded = useFavoriteStore((s) => s.isLoaded);
  const openModal = useAuthModalStore((s) => s.openModal);

  // Seed store with SSR-fetched IDs (avoids an extra API round-trip)
  useEffect(() => {
    if (!isFavLoaded && initialFavoriteIds) {
      setFavoriteIds(initialFavoriteIds);
    }
  }, [isFavLoaded, initialFavoriteIds, setFavoriteIds]);

  // Gallery State
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Variant States
  const uniqueColors = Array.from(
    new Map(product.variants.map((v) => [v.color, v])).values()
  );
  const [selectedColor, setSelectedColor] = useState(
    uniqueColors[0]?.color || ""
  );

  // Get unique sizes for the selected color
  const colorVariants = product.variants.filter(
    (v) => v.color === selectedColor
  );
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const [selectedSize, setSelectedSize] = useState("");

  // UI States
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  // Stage 1 Logging: User opens the product page
  useEffect(() => {
    console.log(`[LOG][Stage 1] Product page opened. Product Name: "${product.name}", Price: ${product.price}, Default Quantity: 1`);
  }, [product.name, product.price]);

  // Get active variant
  const activeVariant = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  const activeColorVariant = uniqueColors.find((c) => c.color === selectedColor);

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

    // Stage 2 Logging: User clicks 'Add to Cart' or 'Beli Sekarang'
    console.log(`[LOG][Stage 2] Add to Cart clicked. Product Name: "${product.name}", Variant SKU: "${activeVariant.sku}", Size: "${activeVariant.size}", Color: "${activeVariant.color}", Price: ${product.price}, Quantity: 1`);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
      {/* Left Column: Image Gallery (7 Columns) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Main Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-brand-light rounded-2xl">
          <Image
            src={product.images[activeImageIdx]?.url || "/images/placeholder.jpg"}
            alt={product.images[activeImageIdx]?.alt || product.name}
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImageIdx(idx)}
                className={`relative aspect-[3/4] w-full overflow-hidden bg-brand-light cursor-pointer border rounded-xl ${
                  activeImageIdx === idx ? "border-brand-black" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `Thumbnail ${idx}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Product Info & Purchase Options (5 Columns) */}
      <div className="lg:col-span-5 flex flex-col gap-8">
        {/* Title, Category, Price */}
        <div className="flex flex-col gap-2 border-b border-brand-light pb-6">
          <h1 className="text-xl md:text-3xl font-extrabold uppercase tracking-widest text-brand-black">
            {product.name}
          </h1>
          {product.averageRating !== undefined && product.averageRating > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.averageRating || 0)
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
          <p className="text-xl md:text-2xl font-black text-brand-black mt-2">
            {formatPrice(product.price)}
          </p>
        </div>

        {/* Description */}
        <div className="text-sm text-brand-gray leading-relaxed">
          {product.description}
        </div>

        {/* Varian: Colors */}
        {uniqueColors.length > 1 && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-brand-black">
              Color: {selectedColor}
            </span>
            <div className="flex gap-3">
              {uniqueColors.map((v) => (
                <button
                  key={v.color}
                  onClick={() => {
                    setSelectedColor(v.color);
                    setSelectedSize(""); // Reset size on color change
                  }}
                  className={`w-8 h-8 rounded-full border cursor-pointer flex items-center justify-center transition-all ${
                    selectedColor === v.color
                      ? "border-brand-black scale-105"
                      : "border-brand-light hover:border-brand-gray-light"
                  }`}
                  title={v.color}
                >
                  <span
                    className="w-6 h-6 inline-block rounded-full"
                    style={{ backgroundColor: v.colorHex }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Varian: Sizes */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-brand-black">
              Size
            </span>
            <button
              onClick={() => setIsSizeGuideOpen(true)}
              className="flex items-center gap-1.5 text-xs text-brand-gray hover:text-brand-black font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Ruler className="w-4 h-4" />
              Size Guide
            </button>
          </div>

          <div className="flex gap-3">
            {sizes.map((sz) => {
              const matchedVar = colorVariants.find((v) => v.size === sz);
              const isAvailable = matchedVar && matchedVar.stock > 0;

              return (
                <button
                  key={sz}
                  onClick={() => isAvailable && setSelectedSize(sz)}
                  disabled={!isAvailable}
                  className={`w-14 h-14 border font-bold text-sm flex flex-col items-center justify-center transition-all rounded-xl cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    selectedSize === sz
                      ? "bg-brand-black text-brand-white border-brand-black"
                      : "border-brand-light hover:border-brand-black text-brand-black"
                  }`}
                >
                  <span>{sz}</span>
                  {matchedVar && (
                    <span className="text-[9px] mt-0.5 font-medium opacity-70">
                      {matchedVar.stock} Pcs
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions Button */}
        <div className="flex flex-col gap-4 pt-4 border-t border-brand-light">
          {/* Add To Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !selectedSize || (activeVariant && activeVariant.stock <= 0)}
            className={`w-full font-bold uppercase tracking-[0.2em] text-sm py-5 transition-all duration-300 ease-out rounded-xl border-2 border-brand-black focus:outline-none cursor-pointer flex items-center justify-center gap-2 ${
              isAdding || !selectedSize
                ? "bg-brand-light text-brand-gray-light border-brand-light cursor-not-allowed"
                : isAdded
                ? "bg-brand-white text-green-500 border-green-500 hover:bg-brand-white hover:text-green-500"
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
                Added to Cart
              </>
            ) : !selectedSize ? (
              "Select Size"
            ) : activeVariant && activeVariant.stock <= 0 ? (
              "Sold Out"
            ) : (
              "Add To Cart"
            )}
          </button>

          {/* Tambah ke Favorit */}
          <button
            onClick={handleToggleFavorit}
            disabled={isTogglingFav}
            className={`w-full font-bold uppercase tracking-[0.2em] text-sm py-5 transition-all duration-300 ease-out rounded-xl border-2 focus:outline-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 ${
              isFavorite
                ? "bg-red-50 text-red-500 border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500"
                : "bg-transparent text-brand-black border-brand-black hover:bg-brand-black hover:text-brand-white"
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? "fill-red-500" : ""
              }`}
            />
            {isTogglingFav
              ? "Memproses..."
              : isFavorite
              ? "Sudah Difavoritkan"
              : "TAMBAH KE FAVORIT"}
          </button>
        </div>

        {/* Product Details Specs */}
        <div className="flex flex-col gap-4 border-t border-brand-light pt-6 text-xs text-brand-gray">
          {product.material && (
            <div className="flex flex-col gap-1">
              <span className="font-black text-brand-black uppercase tracking-wider">
                Material
              </span>
              <span>{product.material}</span>
            </div>
          )}
          {product.care && (
            <div className="flex flex-col gap-1 mt-2">
              <span className="font-black text-brand-black uppercase tracking-wider">
                Care Instructions
              </span>
              <span>{product.care}</span>
            </div>
          )}
        </div>
      </div>

      {/* Size Guide Modal */}
      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Size Guide"
      >
        <div className="flex flex-col gap-6">
          <p className="text-xs text-brand-gray leading-relaxed">
            Semua ukuran disesuaikan untuk standar oversized unisex barbara. Silakan ukur sebelum memesan.
          </p>

          <div className="overflow-x-auto w-full scrollbar-none">
            <table className="w-full min-w-[400px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-brand-black">
                  <th className="py-3 font-bold uppercase tracking-wider text-brand-black">
                    Size
                  </th>
                  <th className="py-3 font-bold uppercase tracking-wider text-brand-black">
                    Chest Width (cm)
                  </th>
                  <th className="py-3 font-bold uppercase tracking-wider text-brand-black">
                    Length (cm)
                  </th>
                  <th className="py-3 font-bold uppercase tracking-wider text-brand-black">
                    Sleeve Length (cm)
                  </th>
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
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gray-light block">
              Fitting Note
            </span>
            <p className="text-xs text-brand-gray mt-1 leading-relaxed">
              Model pria tinggi 182cm mengenakan ukuran L. Model wanita tinggi 170cm mengenakan ukuran M.
            </p>
          </div>
        </div>
      </Modal>

      {/* Reviews Section */}
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
            {/* Rating Summary (4 Columns) */}
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
                      className={`w-5 h-5 ${
                        i < Math.round(product.averageRating || 0)
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

              {/* Star breakdown */}
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

            {/* Reviews List (8 Columns) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {product.reviews.map((rev) => (
                <div 
                  key={rev.id} 
                  className="pb-8 border-b border-brand-light last:pb-0 last:border-b-0 flex flex-col gap-4"
                >
                  {/* Review Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
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
                      {/* Name & Stars */}
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-brand-black">
                          {rev.userName}
                        </h4>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? "fill-amber-400 text-amber-400" : "text-brand-light fill-brand-light/30"
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

                  {/* Review Comment */}
                  <p className="text-xs text-brand-gray leading-relaxed whitespace-pre-wrap pl-[52px]">
                    {rev.review}
                  </p>

                  {/* Review Images */}
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
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin Reply */}
                  {rev.adminReply && (
                    <div className="mt-2 ml-[52px] pl-4 border-l-2 border-brand-black bg-[#fbfbfb] p-4 rounded-r-xl space-y-1">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-[9px] font-black uppercase tracking-wider text-brand-black">
                          Balasan Resmi Tim barbara
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
