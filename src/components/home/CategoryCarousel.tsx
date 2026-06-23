"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

const STATIC_CATEGORIES = [
  {
    id: "tops",
    name: "Tops",
    slug: "tops",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
  },
  {
    id: "bottoms",
    name: "Bottoms",
    slug: "bottoms",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
  },
  {
    id: "footwear",
    name: "Footwear",
    slug: "footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
  },
  {
    id: "outerwear",
    name: "Outerwear",
    slug: "outerwear",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800",
  },
  {
    id: "dresses",
    name: "Dresses",
    slug: "dresses",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800",
  },
  {
    id: "accessories",
    name: "Accessories",
    slug: "accessories",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800",
  },
];

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
  "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800",
];

interface Props {
  dbCategories?: Category[];
}

export function CategoryCarousel({ dbCategories }: Props) {
  // Merge DB categories with static ones
  const merged = STATIC_CATEGORIES.map((sc) => {
    const db = dbCategories?.find((d) => d.slug === sc.slug);
    return db ? { ...sc, name: db.name, image: db.image || sc.image } : sc;
  });

  // Add any extra DB categories not in static list
  dbCategories?.forEach((db) => {
    if (!merged.find((m) => m.slug === db.slug)) {
      merged.push({
        id: db.id,
        name: db.name,
        slug: db.slug,
        image: db.image || FALLBACK_IMAGES[merged.length % FALLBACK_IMAGES.length],
      });
    }
  });

  const displayedCategories = merged.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      {/* Header row: title + arrow link */}
      <div className="flex items-center gap-1">
        <h2 className="text-base font-black tracking-tight text-brand-black">
          Koleksi pilihan
        </h2>
        <Link
          href="/collections"
          aria-label="Lihat semua koleksi"
          className="flex items-center justify-center text-brand-black hover:opacity-60 transition-opacity"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
        </Link>
      </div>

      {/* Grid track */}
      <div className="grid grid-cols-3 gap-4 overflow-hidden">
        {displayedCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group flex flex-col gap-2"
          >
            {/* Image card */}
            <div className="relative w-full overflow-hidden rounded-2xl bg-brand-light" style={{ aspectRatio: "4/3" }}>
              <Image
                src={cat.image || FALLBACK_IMAGES[0]}
                alt={`${cat.name} Collection`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Subtle hover overlay */}
              <div className="absolute inset-0 rounded-2xl bg-brand-black/0 group-hover:bg-brand-black/10 transition-colors duration-300" />
            </div>

            {/* Name below card */}
            <p className="text-sm font-medium text-brand-black text-center tracking-wide group-hover:opacity-60 transition-opacity">
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
