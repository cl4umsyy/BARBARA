"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, PackageX, ArrowRight } from "lucide-react";

interface SearchProductResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  images?: { url: string }[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ProductSearchInputProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onResultClick?: () => void;
  initialValue?: string;
}

export const ProductSearchInput: React.FC<ProductSearchInputProps> = ({
  placeholder = "Cari produk barbara...",
  className = "",
  inputClassName = "",
  onResultClick,
  initialValue = "",
}) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<SearchProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Real-time search effect with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    setHasSearched(false);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Real-time search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      if (onResultClick) onResultClick();
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectProduct = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    if (onResultClick) onResultClick();
    router.push(`/shop/${slug}`);
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-[#F5F5F5] rounded-xl px-4 py-2.5 w-full border border-transparent focus-within:border-brand-black transition-colors"
      >
        <Search className="w-4 h-4 text-brand-gray mr-2.5 flex-shrink-0" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          className={`bg-transparent text-xs md:text-sm font-medium tracking-wide outline-none text-brand-black placeholder-brand-gray-light w-full ${inputClassName}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="p-1 text-brand-gray hover:text-brand-black transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown Results Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-white border border-brand-light/80 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-[440px] flex flex-col divide-y divide-brand-light/50">
          {loading ? (
            <div className="p-6 flex items-center justify-center gap-2 text-brand-gray text-xs font-bold uppercase tracking-wider">
              <Loader2 className="w-4 h-4 animate-spin text-brand-black" />
              <span>Mencari produk...</span>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
              <PackageX className="w-10 h-10 text-brand-gray-light stroke-[1.5]" />
              <p className="text-sm font-bold text-brand-black">Produk tidak ditemukan</p>
              <p className="text-xs text-brand-gray max-w-xs">
                Tidak ada hasil untuk &quot;{query}&quot;. Coba cari nama produk atau kategori lainnya.
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 bg-[#FAF9F6] text-[10px] font-black uppercase tracking-widest text-brand-gray-light flex justify-between items-center">
                <span>Hasil Pencarian ({results.length})</span>
                <span className="text-brand-gray text-[9px] font-medium">Klik produk untuk detail</span>
              </div>
              <div className="overflow-y-auto divide-y divide-brand-light/40">
                {results.map((product) => {
                  const imgUrl =
                    product.images && product.images.length > 0
                      ? product.images[0].url
                      : product.imageUrl || "/images/placeholder.jpg";
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product.slug)}
                      className="p-3 flex items-center gap-3.5 hover:bg-[#F8F8F8] transition-colors cursor-pointer group"
                    >
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-brand-light flex-shrink-0 border border-brand-light/50">
                        <Image
                          src={imgUrl}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {product.category?.name && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gray-light block">
                            {product.category.name}
                          </span>
                        )}
                        <h4 className="text-xs md:text-sm font-bold text-brand-black truncate group-hover:text-brand-black/80 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-xs font-black text-brand-black mt-0.5">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-brand-black">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full p-3 bg-[#F5F5F5] hover:bg-brand-light text-brand-black text-xs font-bold uppercase tracking-wider text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Semua Hasil untuk &quot;{query}&quot;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
