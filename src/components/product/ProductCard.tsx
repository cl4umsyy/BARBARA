"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/Badge";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { Heart, Star } from "lucide-react";

interface ProductCardProps {
  id?: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  hoverImageUrl?: string;
  isNew?: boolean;
  isOutOfStock?: boolean;
  originalPrice?: number;
  sizes?: string[];
  brand?: string;
  condition?: string;
  likesCount?: number;
  rating?: number;
  reviewCount?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  slug,
  name,
  price,
  imageUrl,
  hoverImageUrl,
  isNew = true,
  isOutOfStock = false,
  originalPrice,
  sizes = ["M", "L", "XL"],
  brand = "Vintage",
  condition = "Baik",
  likesCount: initialLikesCount,
  rating,
  reviewCount,
}) => {
  const { data: session } = useSession();
  const isFavorite = useFavoriteStore((s) => (id ? s.isFavorite(id) : false));
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const openModal = useAuthModalStore((s) => s.openModal);

  const [likesCount, setLikesCount] = useState(() => {
    if (initialLikesCount !== undefined) return initialLikesCount;
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

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      openModal("login");
      return;
    }

    if (!id) return;

    const wasLiked = isFavorite;
    // Optimistic likes count update
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));
    await toggleFavorite(id);
  };

  return (
    <div className="group relative flex flex-col bg-brand-white border border-brand-light/35 p-3 hover:shadow-md transition-shadow duration-300 rounded-xl" suppressHydrationWarning>
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

        {/* Heart/Like Button at bottom right */}
        <button
          onClick={handleLikeClick}
          className="absolute bottom-3 right-3 z-10 py-1 px-2.5 bg-brand-white/90 backdrop-blur-sm hover:bg-brand-white rounded-full text-brand-black shadow-md border border-brand-light/35 flex items-center gap-1 transition-all duration-300 cursor-pointer"
          aria-label="Favorit"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors duration-300 ${isFavorite ? "fill-red-500 text-red-500" : "text-brand-black"
              }`}
          />
          <span className="text-[10px] font-black text-brand-black">{likesCount}</span>
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

        {/* Brand */}
        <div className="text-[11px] font-bold text-brand-gray-light uppercase tracking-wider mb-0.5">
          {brand}
        </div>

        {/* Size + Condition */}
        <div className="text-xs text-brand-gray-light mb-1.5 font-medium">
          {sizes && sizes.length > 0 ? sizes.join(", ") : "M"} · {condition}
        </div>

        {/* Product Title */}
        <Link
          href={`/shop/${slug}`}
          className="text-xs md:text-sm font-bold uppercase tracking-wider text-brand-black hover:opacity-70 transition-opacity line-clamp-1"
        >
          {name}
        </Link>

        {/* Rating Stars */}
        {rating !== undefined && rating > 0 && (
          <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-brand-black">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-brand-light fill-brand-light/30"
                    }`}
                />
              ))}
            </div>
            <span>{rating.toFixed(1)}</span>
            <span className="text-brand-gray-light font-medium">({reviewCount})</span>
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-center justify-between mt-2" suppressHydrationWarning>
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
        </div>

      </div>
    </div>
  );
};
