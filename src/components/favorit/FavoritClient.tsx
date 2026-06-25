"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/useCartStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import {
  Heart,
  Search,
  ShoppingBag,
  Trash2,
  X,
  ShoppingCart,
  ExternalLink,
  Loader2,
  Package,
} from "lucide-react";

interface FavoriteVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku: string;
}

interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  isActive: boolean;
  imageUrl: string | null;
  variants: FavoriteVariant[];
}

interface FavoriteItem {
  id: string;
  productId: string;
  createdAt: string;
  product: FavoriteProduct;
}

interface FavoritClientProps {
  initialFavorites: FavoriteItem[];
}

const formatPrice = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);

export default function FavoritClient({ initialFavorites }: FavoritClientProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(initialFavorites);
  const [search, setSearch] = useState("");
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [addingCartIds, setAddingCartIds] = useState<Set<string>>(new Set());
  const [isAddingAll, setIsAddingAll] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const toggleFavorite = useFavoriteStore((s) => s.toggleFavorite);
  const setFavoriteIds = useFavoriteStore((s) => s.setFavoriteIds);
  const isFavLoaded = useFavoriteStore((s) => s.isLoaded);

  // Seed store from SSR data so navbar badge and ProductCard hearts are accurate
  useEffect(() => {
    if (!isFavLoaded) {
      setFavoriteIds(initialFavorites.map((f) => f.productId));
    }
  }, [isFavLoaded, initialFavorites, setFavoriteIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return favorites;
    const q = search.toLowerCase();
    return favorites.filter((f) => f.product.name.toLowerCase().includes(q));
  }, [favorites, search]);

  const handleRemove = useCallback(
    async (productId: string, favoriteId: string) => {
      setRemovingIds((prev) => new Set(prev).add(favoriteId));
      try {
        await toggleFavorite(productId);
        setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      } finally {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(favoriteId);
          return next;
        });
      }
    },
    [toggleFavorite]
  );

  const handleAddToCart = useCallback(
    (item: FavoriteItem) => {
      const { product } = item;
      // Pick variant with most stock
      const bestVariant = [...product.variants]
        .filter((v) => v.stock > 0)
        .sort((a, b) => b.stock - a.stock)[0];

      if (!bestVariant) return;

      setAddingCartIds((prev) => new Set(prev).add(item.id));
      addItem(
        {
          variantId: bestVariant.id,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          size: bestVariant.size,
          color: bestVariant.color,
          price: product.price,
          imageUrl: product.imageUrl || "",
          maxStock: bestVariant.stock,
        },
        1
      );
      setTimeout(() => {
        setAddingCartIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }, 1000);
    },
    [addItem]
  );

  const handleAddAllToCart = useCallback(async () => {
    setIsAddingAll(true);
    for (const item of favorites) {
      const bestVariant = [...item.product.variants]
        .filter((v) => v.stock > 0)
        .sort((a, b) => b.stock - a.stock)[0];
      if (!bestVariant) continue;
      addItem(
        {
          variantId: bestVariant.id,
          productId: item.product.id,
          slug: item.product.slug,
          name: item.product.name,
          size: bestVariant.size,
          color: bestVariant.color,
          price: item.product.price,
          imageUrl: item.product.imageUrl || "",
          maxStock: bestVariant.stock,
        },
        1
      );
    }
    setTimeout(() => setIsAddingAll(false), 800);
  }, [favorites, addItem]);

  const availableCount = favorites.filter((f) =>
    f.product.variants.some((v) => v.stock > 0)
  ).length;

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-10 md:py-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Heart className="w-6 h-6 fill-red-500 text-red-500" />
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-brand-black">
                Favorit Saya
              </h1>
            </div>
            <p className="text-xs text-brand-gray-light font-medium">
              {favorites.length} produk tersimpan
            </p>
          </div>

          {favorites.length > 0 && (
            <button
              onClick={handleAddAllToCart}
              disabled={isAddingAll || availableCount === 0}
              className="inline-flex items-center gap-2 bg-brand-black text-brand-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAddingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              Pindahkan Semua ke Keranjang
            </button>
          )}
        </div>

        {/* Search */}
        {favorites.length > 0 && (
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-light" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk favorit..."
              className="w-full pl-11 pr-10 py-3.5 border border-brand-light bg-brand-white rounded-xl text-sm text-brand-black focus:outline-none focus:border-brand-black transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray-light hover:text-brand-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-red-300" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-widest text-brand-black mb-2">
              Belum ada produk favorit
            </h2>
            <p className="text-sm text-brand-gray-light max-w-sm leading-relaxed mb-8">
              Simpan produk yang kamu suka dengan menekan ikon hati di halaman produk.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-brand-black text-brand-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-xl hover:bg-brand-dark transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Mulai Belanja
            </Link>
          </div>
        )}

        {/* Search empty state */}
        {favorites.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-8 h-8 text-brand-light mb-4" />
            <p className="text-sm font-bold uppercase tracking-wider text-brand-gray-light">
              Tidak ada produk yang cocok dengan &ldquo;{search}&rdquo;
            </p>
          </div>
        )}

        {/* Product Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item) => {
              const { product } = item;
              const isRemoving = removingIds.has(item.id);
              const isAddingCart = addingCartIds.has(item.id);
              const uniqueSizes = [...new Set(product.variants.map((v) => v.size))];
              const uniqueColors = [...new Set(product.variants.map((v) => v.color))];
              const hasStock = product.variants.some((v) => v.stock > 0);

              return (
                <div
                  key={item.id}
                  className={`group bg-brand-white border border-brand-light rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col ${isRemoving ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {/* Product Image */}
                  <Link
                    href={`/shop/${product.slug}`}
                    className="relative aspect-[3/4] w-full overflow-hidden bg-brand-light/40 block"
                  >
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-12 h-12 text-brand-light" />
                      </div>
                    )}

                    {!hasStock && (
                      <div className="absolute inset-0 bg-brand-black/30 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white bg-brand-black/70 px-3 py-1 rounded-full">
                          Habis
                        </span>
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(product.id, item.id);
                      }}
                      disabled={isRemoving}
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-brand-white/90 backdrop-blur-sm border border-brand-light flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm cursor-pointer"
                      title="Hapus dari Favorit"
                    >
                      {isRemoving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <Link
                        href={`/shop/${product.slug}`}
                        className="text-xs font-black uppercase tracking-wider text-brand-black hover:opacity-70 transition-opacity line-clamp-2 leading-relaxed"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm font-black text-brand-black mt-1">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {/* Variants */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {uniqueSizes.slice(0, 4).map((size) => (
                        <span
                          key={size}
                          className="px-2 py-0.5 border border-brand-light rounded-lg font-bold text-brand-gray uppercase"
                        >
                          {size}
                        </span>
                      ))}
                      {uniqueColors.slice(0, 3).map((color) => {
                        const variant = product.variants.find(
                          (v) => v.color === color
                        );
                        return (
                          <span
                            key={color}
                            className="px-2 py-0.5 border border-brand-light rounded-lg font-bold text-brand-gray"
                            style={{
                              borderLeftColor: variant?.colorHex,
                              borderLeftWidth: 3,
                            }}
                          >
                            {color}
                          </span>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!hasStock || isAddingCart}
                        className="w-full flex items-center justify-center gap-2 bg-brand-black text-brand-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isAddingCart ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Ditambahkan!
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {hasStock ? "Tambah ke Keranjang" : "Stok Habis"}
                          </>
                        )}
                      </button>
                      <Link
                        href={`/shop/${product.slug}`}
                        className="w-full flex items-center justify-center gap-2 border border-brand-black text-brand-black text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl hover:bg-brand-black hover:text-brand-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Lihat Produk
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
