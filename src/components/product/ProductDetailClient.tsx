"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/stores/useCartStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Heart, Ruler, Check } from "lucide-react";
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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  material: string | null;
  care: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ProductDetailClientProps {
  product: Product;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product,
}) => {
  const addItem = useCartStore((state) => state.addItem);

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
  const sizes = ["M", "L", "XL"];
  const [selectedSize, setSelectedSize] = useState("");

  // UI States
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

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
    if (!selectedSize) {
      alert("Silakan pilih ukuran terlebih dahulu.");
      return;
    }

    if (!activeVariant) return;

    // Stage 2 Logging: User clicks 'Add to Cart' or 'Beli Sekarang'
    console.log(`[LOG][Stage 2] Add to Cart clicked. Product Name: "${product.name}", Variant SKU: "${activeVariant.sku}", Size: "${activeVariant.size}", Color: "${activeVariant.color}", Price: ${product.price}, Quantity: 1`);

    addItem(
      {
        variantId: activeVariant.id,
        productId: product.id,
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
    setTimeout(() => setIsAdded(false), 2000);
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
            disabled={!selectedSize || (activeVariant && activeVariant.stock <= 0)}
            className={`w-full font-bold uppercase tracking-[0.2em] text-sm py-5 transition-all duration-300 ease-out rounded-xl border-2 border-brand-black focus:outline-none cursor-pointer flex items-center justify-center gap-2 ${
              !selectedSize
                ? "bg-brand-light text-brand-gray-light border-brand-light cursor-not-allowed"
                : isAdded
                ? "bg-brand-white text-green-500 border-green-500 hover:bg-brand-white hover:text-green-500"
                : "bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black"
            }`}
          >
            {isAdded ? (
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

          {/* Add To Wishlist */}
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="w-full font-bold uppercase tracking-[0.2em] text-sm py-5 transition-all duration-300 ease-out rounded-xl border-2 border-brand-black focus:outline-none cursor-pointer bg-transparent text-brand-black hover:bg-brand-black hover:text-brand-white flex items-center justify-center gap-2"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? "fill-brand-black text-brand-black group-hover:fill-brand-white hover:text-brand-white" : ""
              }`}
            />
            {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
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

          <table className="w-full text-left border-collapse text-xs">
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
              <tr className="border-b border-brand-black">
                <td className="py-3 font-bold text-brand-black">XL</td>
                <td className="py-3 text-brand-gray">60</td>
                <td className="py-3 text-brand-gray">78</td>
                <td className="py-3 text-brand-gray">26</td>
              </tr>
            </tbody>
          </table>

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
    </div>
  );
};
