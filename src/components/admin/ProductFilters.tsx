"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({ categories }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  // Update query params when search or category changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);

    const query = params.toString();
    router.push(`/admin/products${query ? `?${query}` : ""}`);
  }, [search, category, router]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between border-b border-brand-light pb-6">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-brand-light border border-transparent py-2.5 pl-10 pr-4 outline-none rounded-xl text-xs font-bold uppercase tracking-wider text-brand-black focus:border-brand-black focus:bg-brand-white transition-all duration-200"
        />
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-brand-gray-light" />
      </div>

      {/* Category Dropdown */}
      <div className="w-full md:w-56">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-brand-white border border-brand-light py-2.5 px-4 outline-none rounded-xl text-xs font-bold uppercase tracking-wider text-brand-black focus:border-brand-black cursor-pointer transition-all duration-200"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
