"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ShopFiltersProps {
  categories: Category[];
  maxPriceInDb: number;
}

export const ShopFilters: React.FC<ShopFiltersProps> = ({
  categories,
  maxPriceInDb,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL
  const activeCategory = searchParams.get("category") || "";
  const activeSize = searchParams.get("size") || "";
  const activeSort = searchParams.get("sort") || "latest";
  const activeSearch = searchParams.get("search") || "";
  const activePriceMax = searchParams.get("price_max") 
    ? Number(searchParams.get("price_max")) 
    : maxPriceInDb;

  // Local state for pricing slider (to avoid slow renders while dragging)
  const [sliderVal, setSliderVal] = useState(activePriceMax);

  useEffect(() => {
    setSliderVal(activePriceMax);
  }, [activePriceMax]);

  const updateFilters = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Clear search if updating major filters, unless intended
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });

    router.push(`/shop?${params.toString()}`);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderVal(Number(e.target.value));
  };

  const handlePriceMouseUp = () => {
    updateFilters({ price_max: sliderVal });
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const clearAllFilters = () => {
    router.push("/shop");
  };

  const sizes = ["M", "L", "XL"];

  return (
    <div className="flex flex-col gap-8 w-full md:w-64 shrink-0 border-r border-brand-light pr-0 md:pr-8">
      {/* Search status */}
      {activeSearch && (
        <div className="bg-brand-light p-4 flex items-center justify-between rounded-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-black truncate">
            Search: &quot;{activeSearch}&quot;
          </span>
          <button
            onClick={() => updateFilters({ search: null })}
            className="text-xs text-brand-gray-light hover:text-brand-black ml-2 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-brand-black">
          Categories
        </h3>
        <div className="flex flex-wrap md:flex-col gap-2">
          <button
            onClick={() => updateFilters({ category: null })}
            className={`text-left text-xs uppercase tracking-wider py-2 px-3 md:px-0 font-bold border md:border-0 rounded-lg cursor-pointer transition-colors ${
              !activeCategory
                ? "bg-brand-black text-brand-white md:bg-transparent md:text-brand-black md:font-black border-brand-black"
                : "text-brand-gray hover:text-brand-black border-brand-light md:hover:pl-1"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilters({ category: cat.slug })}
              className={`text-left text-xs uppercase tracking-wider py-2 px-3 md:px-0 font-bold border md:border-0 rounded-lg cursor-pointer transition-colors ${
                activeCategory === cat.slug
                  ? "bg-brand-black text-brand-white md:bg-transparent md:text-brand-black md:font-black border-brand-black"
                  : "text-brand-gray hover:text-brand-black border-brand-light md:hover:pl-1"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes (M, L, XL only) */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-brand-black">
          Sizes
        </h3>
        <div className="flex gap-2">
          {sizes.map((sz) => (
            <button
              key={sz}
              onClick={() => updateFilters({ size: activeSize === sz ? null : sz })}
              className={`w-10 h-10 flex items-center justify-center text-xs font-black border uppercase tracking-wider transition-colors cursor-pointer rounded-xl ${
                activeSize === sz
                  ? "bg-brand-black text-brand-white border-brand-black"
                  : "border-brand-light hover:border-brand-black text-brand-black"
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-black">
            Max Price
          </h3>
          <span className="text-xs font-bold text-brand-black">
            {formatPrice(sliderVal)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={maxPriceInDb}
          value={sliderVal}
          onChange={handlePriceChange}
          onMouseUp={handlePriceMouseUp}
          onTouchEnd={handlePriceMouseUp}
          className="w-full accent-brand-black cursor-pointer bg-brand-light h-1 rounded-full outline-none appearance-none"
        />
        <div className="flex items-center justify-between text-[10px] text-brand-gray-light font-bold">
          <span>{formatPrice(0)}</span>
          <span>{formatPrice(maxPriceInDb)}</span>
        </div>
      </div>

      {/* Sorting */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-brand-black">
          Sort By
        </h3>
        <select
          value={activeSort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className="w-full text-xs font-bold uppercase tracking-wider py-3 px-4 border border-[#e0e0e0] bg-brand-white outline-none rounded-xl cursor-pointer focus:border-brand-black transition-colors"
        >
          <option value="latest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Clear Button */}
      {(activeCategory || activeSize || activeSort !== "latest" || activeSearch || activePriceMax !== maxPriceInDb) && (
        <button
          onClick={clearAllFilters}
          className="w-full py-3 text-center border-2 border-brand-black bg-transparent text-brand-black text-xs font-black uppercase tracking-widest hover:bg-brand-black hover:text-brand-white transition-all cursor-pointer rounded-xl"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};
