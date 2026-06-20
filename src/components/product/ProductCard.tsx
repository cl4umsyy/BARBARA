"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Heart } from "lucide-react";

interface ProductCardProps {
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  hoverImageUrl?: string;
  isNew?: boolean;
  isOutOfStock?: boolean;
  originalPrice?: number;
  sizes?: string[];
}

export const ProductCard: React.FC<ProductCardProps> = ({
  slug,
  name,
  price,
  imageUrl,
  hoverImageUrl,
  isNew = true,
  isOutOfStock = false,
  originalPrice,
  sizes = ["M", "L", "XL"],
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(() => {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = slug.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 25) + 3;
  });

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <div className="group relative flex flex-col bg-brand-white border border-brand-light/35 p-3 hover:shadow-md transition-shadow duration-300 rounded-xl">
      {/* Image Wrapper with 3:4 aspect ratio */}
      <Link
        href={`/shop/${slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-brand-light block rounded-xl"
      >
        {/* Status Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {isOutOfStock ? (
            <Badge variant="outline" className="!text-[9px] !px-2 !py-0.5">SOLD OUT</Badge>
          ) : isNew ? (
            <Badge className="!text-[9px] !px-2 !py-0.5">NEW</Badge>
          ) : null}
          {originalPrice && !isOutOfStock && (
            <Badge variant="outline" className="!bg-red-500 !text-white !border-transparent !text-[9px] !px-2 !py-0.5">
              SALE
            </Badge>
          )}
        </div>

        {/* Heart/Like Button */}
        <button
          onClick={handleLikeClick}
          className="absolute top-3 right-3 z-10 p-1.5 bg-brand-white/80 backdrop-blur-sm hover:bg-brand-white rounded-full text-brand-black shadow-sm transition-all duration-300 cursor-pointer"
          aria-label="Like Product"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-300 ${
              isLiked ? "fill-red-500 text-red-500" : "text-brand-black"
            }`}
          />
        </button>

        {/* Primary Image */}
        <Image
          src={imageUrl || "/images/placeholder.jpg"}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          priority={false}
        />

        {/* Hover Image Swap */}
        {!isOutOfStock && hoverImageUrl && (
          <Image
            src={hoverImageUrl}
            alt={`${name} hover`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 absolute inset-0"
          />
        )}

        {/* Sold out overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-brand-black/20 flex items-center justify-center backdrop-blur-[2px]" />
        )}
      </Link>

      {/* Product Information */}
      <div className="flex flex-col pt-3 font-sans">
        
        {/* Sizes Indicator */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          {sizes.map((size) => (
            <span
              key={size}
              className="text-[9px] font-bold text-brand-gray-light border border-brand-light px-1.5 py-0.5 rounded-lg"
            >
              {size}
            </span>
          ))}
        </div>

        {/* Product Title */}
        <Link
          href={`/shop/${slug}`}
          className="text-xs md:text-sm font-bold uppercase tracking-wider text-brand-black hover:opacity-70 transition-opacity line-clamp-1"
        >
          {name}
        </Link>

        {/* Pricing & Likes Row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-xs md:text-sm font-black text-brand-black">
              {formatPrice(price)}
            </span>
            {originalPrice && (
              <span className="text-[10px] md:text-xs text-brand-gray-light line-through font-medium">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-brand-gray-light font-bold flex items-center gap-1">
            <Heart className="w-3 h-3 text-brand-gray-light fill-brand-gray-light/30" />
            {likesCount}
          </span>
        </div>

      </div>
    </div>
  );
};
