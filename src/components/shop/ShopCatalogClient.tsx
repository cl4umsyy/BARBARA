"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, ChevronLeft, X, RotateCcw, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductSkeleton } from "./ProductSkeleton";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  isNew: boolean;
  isActive: boolean;
  createdAt: string;
  brand: string;
  condition: string;
  likesCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  sizes: string[];
  colors: string[];
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    order: number;
  }>;
  variants: Array<{
    id: string;
    size: string;
    color: string;
    stock: number;
  }>;
  rating?: number;
  reviewCount?: number;
}

interface ShopCatalogClientProps {
  initialProducts: Product[];
  initialTotal: number;
  initialPages: number;
  categories: Category[];
}

// Predefined Filter Options
const SIZES_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
export const COLORS_OPTIONS = [
  "Hitam",
  "Putih",
  "Abu-Abu",
  "Biru",
  "Merah",
  "Hijau",
  "Kuning",
  "Orange",
  "Ungu",
  "Pink",
  "Coklat",
  "Beige",
  "Cream",
  "Navy",
  "Olive",
  "Khaki",
  "Maroon",
  "Tosca",
  "Cyan",
  "Gold",
  "Silver"
];
const BRANDS_OPTIONS = ["Nike", "Adidas", "Puma", "New Balance", "Vintage", "Lainnya"];
const CONDITIONS_OPTIONS = ["Baru", "Sangat Baik", "Baik", "Cukup"];

const PRICE_RANGES = [
  { label: "Rp 0 - Rp 100.000", min: 0, max: 100000, key: "0-100k" },
  { label: "Rp 100.001 - Rp 250.000", min: 100001, max: 250000, key: "100k-250k" },
  { label: "Rp 250.001 - Rp 500.000", min: 250001, max: 500000, key: "250k-500k" },
  { label: "Di atas Rp 500.000", min: 500001, max: undefined, key: "above-500k" },
];

const SORT_OPTIONS = [
  { label: "Terbaru", value: "latest" },
  { label: "Harga Terendah", value: "price-asc" },
  { label: "Harga Tertinggi", value: "price-desc" },
  { label: "Paling Populer", value: "popular" },
  { label: "Paling Banyak Disukai", value: "likes" },
];

export const ShopCatalogClient: React.FC<ShopCatalogClientProps> = ({
  initialProducts,
  initialTotal,
  initialPages,
  categories,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Dropdown state (which filter dropdown is open)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Products and Pagination state
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalProducts, setTotalProducts] = useState<number>(initialTotal);
  const [totalPages, setTotalPages] = useState<number>(initialPages);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    return parseInt(searchParams.get("page") || "1", 10);
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Selected filters state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>("latest");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [categoryGender, setCategoryGender] = useState<"pria" | "wanita" | null>(null);
  const [sizeGender, setSizeGender] = useState<"pria" | "wanita" | null>(null);

  // Load initial filters from URL on mount
  useEffect(() => {
    const parseParam = (key: string): string[] => {
      const val = searchParams.get(key);
      return val ? val.split(",").filter(Boolean) : [];
    };

    setSelectedCategories(parseParam("category"));
    setSelectedCollections(parseParam("collection"));
    setSelectedSizes(parseParam("size"));
    setSelectedColors(parseParam("color"));
    setSelectedBrands(parseParam("brand"));
    setSelectedConditions(parseParam("condition"));
    setSelectedGender(searchParams.get("gender") || "");
    setSelectedSort(searchParams.get("sort") || "latest");
    setCurrentPage(parseInt(searchParams.get("page") || "1", 10));

    // Handle price range matching from minPrice & maxPrice query parameters
    const min = searchParams.get("minPrice");
    const max = searchParams.get("maxPrice");
    if (min || max) {
      const minVal = min ? parseInt(min, 10) : 0;
      const maxVal = max ? parseInt(max, 10) : undefined;
      const matched = PRICE_RANGES.find(r => r.min === minVal && r.max === maxVal);
      if (matched) {
        setSelectedPriceRanges([matched.key]);
      }
    } else {
      setSelectedPriceRanges([]);
    }
  }, [searchParams]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch products from API when filters change
  const fetchFilteredProducts = async (
    categoriesList: string[],
    sizesList: string[],
    colorsList: string[],
    brandsList: string[],
    conditionsList: string[],
    priceRangesList: string[],
    sortVal: string,
    pageNum: number,
    collectionsList: string[] = selectedCollections,
    genderVal: string = selectedGender
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoriesList.length > 0) params.set("category", categoriesList.join(","));
      if (collectionsList.length > 0) params.set("collection", collectionsList.join(","));
      if (sizesList.length > 0) params.set("size", sizesList.join(","));
      if (colorsList.length > 0) params.set("color", colorsList.join(","));
      if (brandsList.length > 0) params.set("brand", brandsList.join(","));
      if (conditionsList.length > 0) params.set("condition", conditionsList.join(","));
      if (genderVal) params.set("gender", genderVal);
      if (sortVal && sortVal !== "latest") params.set("sort", sortVal);
      if (pageNum > 1) params.set("page", String(pageNum));

      // Resolve price ranges min/max
      if (priceRangesList.length > 0) {
        const activeRange = PRICE_RANGES.find(r => priceRangesList.includes(r.key));
        if (activeRange) {
          params.set("minPrice", String(activeRange.min));
          if (activeRange.max !== undefined) {
            params.set("maxPrice", String(activeRange.max));
          }
        }
      }

      // Update URL query parameters without full page reload
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ path: newUrl }, "", newUrl);

      // Fetch from API
      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotalProducts(data.total);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger filters update
  const handleFilterChange = (type: string, value: string) => {
    let newCategories = [...selectedCategories];
    let newCollections = [...selectedCollections];
    let newSizes = [...selectedSizes];
    let newColors = [...selectedColors];
    let newBrands = [...selectedBrands];
    let newConditions = [...selectedConditions];
    let newPriceRanges = [...selectedPriceRanges];
    let newSort = selectedSort;
    let newPage = 1; // Reset to page 1 on filter change
 
    if (type === "category") {
      newCategories = newCategories.includes(value)
        ? newCategories.filter(x => x !== value)
        : [...newCategories, value];
      setSelectedCategories(newCategories);
    } else if (type === "collection") {
      newCollections = newCollections.includes(value)
        ? newCollections.filter(x => x !== value)
        : [...newCollections, value];
      setSelectedCollections(newCollections);
    } else if (type === "size") {
      newSizes = newSizes.includes(value)
        ? newSizes.filter(x => x !== value)
        : [...newSizes, value];
      setSelectedSizes(newSizes);
    } else if (type === "color") {
      newColors = newColors.includes(value)
        ? newColors.filter(x => x !== value)
        : [...newColors, value];
      setSelectedColors(newColors);
    } else if (type === "brand") {
      newBrands = newBrands.includes(value)
        ? newBrands.filter(x => x !== value)
        : [...newBrands, value];
      setSelectedBrands(newBrands);
    } else if (type === "condition") {
      newConditions = newConditions.includes(value)
        ? newConditions.filter(x => x !== value)
        : [...newConditions, value];
      setSelectedConditions(newConditions);
    } else if (type === "price") {
      // Allow single price bracket selection or replace
      newPriceRanges = newPriceRanges.includes(value)
        ? []
        : [value];
      setSelectedPriceRanges(newPriceRanges);
    } else if (type === "sort") {
      newSort = value;
      setSelectedSort(newSort);
      setActiveDropdown(null); // Close sort dropdown immediately
    }

    setCurrentPage(newPage);
    fetchFilteredProducts(
      newCategories,
      newSizes,
      newColors,
      newBrands,
      newConditions,
      newPriceRanges,
      newSort,
      newPage,
      newCollections
    );
  };

  // Change page
  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
    fetchFilteredProducts(
      selectedCategories,
      selectedSizes,
      selectedColors,
      selectedBrands,
      selectedConditions,
      selectedPriceRanges,
      selectedSort,
      pageNum,
      selectedCollections
    );
    // Smooth scroll back to top of product list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Hierarchical category selection handler (Gender + Category)
  const handleHierarchicalCategoryChange = (gender: "pria" | "wanita", slug: string) => {
    let newCategories = [...selectedCategories];
    let newGender: string = gender;

    if (newCategories.includes(slug) && selectedGender === gender) {
      newCategories = newCategories.filter((x) => x !== slug);
      if (newCategories.length === 0 && selectedSizes.length === 0) {
        newGender = "";
      }
    } else {
      newCategories = newCategories.includes(slug) ? newCategories : [...newCategories, slug];
      newGender = gender;
    }

    setSelectedCategories(newCategories);
    setSelectedGender(newGender);
    setCurrentPage(1);

    fetchFilteredProducts(
      newCategories,
      selectedSizes,
      selectedColors,
      selectedBrands,
      selectedConditions,
      selectedPriceRanges,
      selectedSort,
      1,
      selectedCollections,
      newGender
    );
  };

  // Hierarchical size selection handler (Gender + Size)
  const handleHierarchicalSizeChange = (gender: "pria" | "wanita", sz: string) => {
    let newSizes = [...selectedSizes];
    let newGender: string = gender;

    if (newSizes.includes(sz) && selectedGender === gender) {
      newSizes = newSizes.filter((x) => x !== sz);
      if (newSizes.length === 0 && selectedCategories.length === 0) {
        newGender = "";
      }
    } else {
      newSizes = newSizes.includes(sz) ? newSizes : [...newSizes, sz];
      newGender = gender;
    }

    setSelectedSizes(newSizes);
    setSelectedGender(newGender);
    setCurrentPage(1);

    fetchFilteredProducts(
      selectedCategories,
      newSizes,
      selectedColors,
      selectedBrands,
      selectedConditions,
      selectedPriceRanges,
      selectedSort,
      1,
      selectedCollections,
      newGender
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedBrands([]);
    setSelectedConditions([]);
    setSelectedPriceRanges([]);
    setSelectedSort("latest");
    setSelectedCollections([]);
    setSelectedGender("");
    setCategoryGender(null);
    setSizeGender(null);
    setCurrentPage(1);

    window.history.pushState({ path: "/shop" }, "", "/shop");

    // Re-fetch clean list
    fetchFilteredProducts([], [], [], [], [], [], "latest", 1, [], "");
  };

  // Toggle single dropdown trigger
  const toggleDropdown = (name: string) => {
    if (activeDropdown !== name) {
      if (name === "category") {
        setCategoryGender(selectedGender === "pria" || selectedGender === "wanita" ? (selectedGender as "pria" | "wanita") : null);
      } else if (name === "size") {
        setSizeGender(selectedGender === "pria" || selectedGender === "wanita" ? (selectedGender as "pria" | "wanita") : null);
      }
    }
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  // Check if any filter is active
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedCollections.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    selectedBrands.length > 0 ||
    selectedConditions.length > 0 ||
    selectedPriceRanges.length > 0 ||
    Boolean(selectedGender) ||
    selectedSort !== "latest";

  return (
    <div className="w-full min-h-screen bg-brand-white text-brand-black pb-24">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-16 flex flex-col gap-6">
        
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
            Katalog Produk
          </p>
          <h1 className="text-3xl md:text-5xl font-black tracking-widest text-brand-black uppercase">
            Explore
          </h1>
        </div>

        {/* Filters and Sorting Container */}
        <div className="relative flex flex-col gap-4 border-t border-b border-brand-light/35 py-4 mt-2">
          {/* Scrollable filter buttons */}
          <div 
            ref={dropdownRef}
            className="flex md:flex-wrap items-center gap-3 overflow-x-auto md:overflow-visible whitespace-nowrap md:whitespace-normal scrollbar-none py-1.5 -mx-4 px-4 md:mx-0 md:px-0"
          >
            {/* 1. Kategori Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("category")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full border cursor-pointer transition-all duration-300 ${
                  selectedCategories.length > 0
                    ? "bg-brand-black text-brand-white border-brand-black"
                    : "border-brand-light hover:border-brand-black bg-brand-white text-brand-black"
                }`}
              >
                Kategori {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === "category" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "category" && (
                  <>
                    {/* Mobile Backdrop */}
                    <div 
                      className="fixed inset-0 bg-brand-black/40 z-40 md:hidden"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bottom-0 left-0 right-0 w-full rounded-t-3xl bg-brand-white border-t border-brand-light/45 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] p-6 max-h-[80vh] overflow-y-auto z-50 md:absolute md:bottom-auto md:top-full md:left-0 md:right-auto md:w-64 md:rounded-2xl md:border md:shadow-xl md:p-4 md:mt-2"
                    >
                      {/* Mobile handle indicator */}
                      <div className="w-12 h-1 bg-brand-light/80 rounded-full mx-auto mb-4 md:hidden" />
                      <div className="flex items-center justify-between mb-4 md:hidden">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-black">Filter Kategori</span>
                        <button onClick={() => setActiveDropdown(null)} className="p-1 hover:bg-brand-light rounded-full cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {!categoryGender ? (
                        <div className="flex flex-col divide-y divide-brand-light/35">
                          <button
                            type="button"
                            onClick={() => setCategoryGender("wanita")}
                            className="flex items-center justify-between py-3 px-1 text-xs font-bold text-brand-black cursor-pointer hover:opacity-70 transition-opacity group"
                          >
                            <span>Womens</span>
                            <ChevronRight className="w-4 h-4 text-brand-black/60 group-hover:text-brand-black transition-colors" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCategoryGender("pria")}
                            className="flex items-center justify-between py-3 px-1 text-xs font-bold text-brand-black cursor-pointer hover:opacity-70 transition-opacity group"
                          >
                            <span>Mens</span>
                            <ChevronRight className="w-4 h-4 text-brand-black/60 group-hover:text-brand-black transition-colors" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => setCategoryGender(null)}
                            className="flex items-center gap-1.5 pb-2 text-[11px] font-black uppercase tracking-wider text-brand-gray hover:text-brand-black border-b border-brand-light/60 cursor-pointer transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Kategori {categoryGender === "pria" ? "Mens" : "Womens"}</span>
                          </button>

                          {categories
                            .filter((cat) => ["tops", "bottom", "bottoms", "outerwear"].includes(cat.slug.toLowerCase()))
                            .map((cat) => {
                              const isChecked = selectedCategories.includes(cat.slug) && selectedGender === categoryGender;
                              return (
                                <label key={cat.id} className="flex items-center gap-2.5 text-xs font-bold text-brand-black uppercase cursor-pointer hover:opacity-80">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleHierarchicalCategoryChange(categoryGender, cat.slug)}
                                    className="w-4 h-4 rounded accent-brand-black cursor-pointer"
                                  />
                                  {cat.name}
                                </label>
                              );
                            })}
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Ukuran Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("size")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full border cursor-pointer transition-all duration-300 ${
                  selectedSizes.length > 0
                    ? "bg-brand-black text-brand-white border-brand-black"
                    : "border-brand-light hover:border-brand-black bg-brand-white text-brand-black"
                }`}
              >
                Size {selectedSizes.length > 0 && `(${selectedSizes.length})`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === "size" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "size" && (
                  <>
                    {/* Mobile Backdrop */}
                    <div 
                      className="fixed inset-0 bg-brand-black/40 z-40 md:hidden"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bottom-0 left-0 right-0 w-full rounded-t-3xl bg-brand-white border-t border-brand-light/45 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] p-6 max-h-[80vh] overflow-y-auto z-50 md:absolute md:bottom-auto md:top-full md:left-0 md:right-auto md:w-48 md:rounded-2xl md:border md:shadow-xl md:p-4 md:mt-2"
                    >
                      {/* Mobile handle indicator */}
                      <div className="w-12 h-1 bg-brand-light/80 rounded-full mx-auto mb-4 md:hidden" />
                      <div className="flex items-center justify-between mb-4 md:hidden">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-black">Filter Size</span>
                        <button onClick={() => setActiveDropdown(null)} className="p-1 hover:bg-brand-light rounded-full cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {!sizeGender ? (
                        <div className="flex flex-col divide-y divide-brand-light/35">
                          <button
                            type="button"
                            onClick={() => setSizeGender("wanita")}
                            className="flex items-center justify-between py-3 px-1 text-xs font-bold text-brand-black cursor-pointer hover:opacity-70 transition-opacity group"
                          >
                            <span>Womens</span>
                            <ChevronRight className="w-4 h-4 text-brand-black/60 group-hover:text-brand-black transition-colors" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSizeGender("pria")}
                            className="flex items-center justify-between py-3 px-1 text-xs font-bold text-brand-black cursor-pointer hover:opacity-70 transition-opacity group"
                          >
                            <span>Mens</span>
                            <ChevronRight className="w-4 h-4 text-brand-black/60 group-hover:text-brand-black transition-colors" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => setSizeGender(null)}
                            className="flex items-center gap-1.5 pb-2 text-[11px] font-black uppercase tracking-wider text-brand-gray hover:text-brand-black border-b border-brand-light/60 cursor-pointer transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Size {sizeGender === "pria" ? "Mens" : "Womens"}</span>
                          </button>

                          {SIZES_OPTIONS.map((sz) => {
                            const isChecked = selectedSizes.includes(sz) && selectedGender === sizeGender;
                            return (
                              <label key={sz} className="flex items-center gap-2.5 text-xs font-bold text-brand-black uppercase cursor-pointer hover:opacity-80">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleHierarchicalSizeChange(sizeGender, sz)}
                                  className="w-4 h-4 rounded accent-brand-black cursor-pointer"
                                />
                                {sz}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Warna Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("color")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full border cursor-pointer transition-all duration-300 ${
                  selectedColors.length > 0
                    ? "bg-brand-black text-brand-white border-brand-black"
                    : "border-brand-light hover:border-brand-black bg-brand-white text-brand-black"
                }`}
              >
                Warna {selectedColors.length > 0 && `(${selectedColors.length})`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === "color" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "color" && (
                  <>
                    {/* Mobile Backdrop */}
                    <div 
                      className="fixed inset-0 bg-brand-black/40 z-40 md:hidden"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bottom-0 left-0 right-0 w-full rounded-t-3xl bg-brand-white border-t border-brand-light/45 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] p-6 max-h-[80vh] overflow-y-auto z-50 md:absolute md:bottom-auto md:top-full md:left-0 md:right-auto md:w-52 md:rounded-2xl md:border md:shadow-xl md:p-4 md:mt-2"
                    >
                      {/* Mobile handle indicator */}
                      <div className="w-12 h-1 bg-brand-light/80 rounded-full mx-auto mb-4 md:hidden" />
                      <div className="flex items-center justify-between mb-4 md:hidden">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-black">Filter Warna</span>
                        <button onClick={() => setActiveDropdown(null)} className="p-1 hover:bg-brand-light rounded-full cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                        {COLORS_OPTIONS.map((color) => (
                          <label key={color} className="flex items-center gap-2.5 text-xs font-bold text-brand-black uppercase cursor-pointer hover:opacity-80">
                            <input
                              type="checkbox"
                              checked={selectedColors.includes(color)}
                              onChange={() => handleFilterChange("color", color)}
                              className="w-4 h-4 rounded accent-brand-black cursor-pointer"
                            />
                            {color}
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 4. Brand Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("brand")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full border cursor-pointer transition-all duration-300 ${
                  selectedBrands.length > 0
                    ? "bg-brand-black text-brand-white border-brand-black"
                    : "border-brand-light hover:border-brand-black bg-brand-white text-brand-black"
                }`}
              >
                Brand {selectedBrands.length > 0 && `(${selectedBrands.length})`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === "brand" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "brand" && (
                  <>
                    {/* Mobile Backdrop */}
                    <div 
                      className="fixed inset-0 bg-brand-black/40 z-40 md:hidden"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bottom-0 left-0 right-0 w-full rounded-t-3xl bg-brand-white border-t border-brand-light/45 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] p-6 max-h-[80vh] overflow-y-auto z-50 md:absolute md:bottom-auto md:top-full md:left-0 md:right-auto md:w-56 md:rounded-2xl md:border md:shadow-xl md:p-4 md:mt-2"
                    >
                      {/* Mobile handle indicator */}
                      <div className="w-12 h-1 bg-brand-light/80 rounded-full mx-auto mb-4 md:hidden" />
                      <div className="flex items-center justify-between mb-4 md:hidden">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-black">Filter Brand</span>
                        <button onClick={() => setActiveDropdown(null)} className="p-1 hover:bg-brand-light rounded-full cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {BRANDS_OPTIONS.map((br) => (
                          <label key={br} className="flex items-center gap-2.5 text-xs font-bold text-brand-black uppercase cursor-pointer hover:opacity-80">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(br)}
                              onChange={() => handleFilterChange("brand", br)}
                              className="w-4 h-4 rounded accent-brand-black cursor-pointer"
                            />
                            {br}
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Harga Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("price")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full border cursor-pointer transition-all duration-300 ${
                  selectedPriceRanges.length > 0
                    ? "bg-brand-black text-brand-white border-brand-black"
                    : "border-brand-light hover:border-brand-black bg-brand-white text-brand-black"
                }`}
              >
                Harga {selectedPriceRanges.length > 0 && `(Selected)`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === "price" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "price" && (
                  <>
                    {/* Mobile Backdrop */}
                    <div 
                      className="fixed inset-0 bg-brand-black/40 z-40 md:hidden"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bottom-0 left-0 right-0 w-full rounded-t-3xl bg-brand-white border-t border-brand-light/45 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] p-6 max-h-[80vh] overflow-y-auto z-50 md:absolute md:bottom-auto md:top-full md:left-0 md:right-auto md:w-72 md:rounded-2xl md:border md:shadow-xl md:p-4 md:mt-2"
                    >
                      {/* Mobile handle indicator */}
                      <div className="w-12 h-1 bg-brand-light/80 rounded-full mx-auto mb-4 md:hidden" />
                      <div className="flex items-center justify-between mb-4 md:hidden">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-black">Filter Harga</span>
                        <button onClick={() => setActiveDropdown(null)} className="p-1 hover:bg-brand-light rounded-full cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {PRICE_RANGES.map((range) => (
                          <label key={range.key} className="flex items-center gap-2.5 text-xs font-bold text-brand-black cursor-pointer hover:opacity-80">
                            <input
                              type="radio"
                              name="price-range"
                              checked={selectedPriceRanges.includes(range.key)}
                              onChange={() => handleFilterChange("price", range.key)}
                              className="w-4 h-4 rounded accent-brand-black cursor-pointer"
                            />
                            {range.label}
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 6. Kondisi Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("condition")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full border cursor-pointer transition-all duration-300 ${
                  selectedConditions.length > 0
                    ? "bg-brand-black text-brand-white border-brand-black"
                    : "border-brand-light hover:border-brand-black bg-brand-white text-brand-black"
                }`}
              >
                Kondisi {selectedConditions.length > 0 && `(${selectedConditions.length})`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === "condition" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "condition" && (
                  <>
                    {/* Mobile Backdrop */}
                    <div 
                      className="fixed inset-0 bg-brand-black/40 z-40 md:hidden"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bottom-0 left-0 right-0 w-full rounded-t-3xl bg-brand-white border-t border-brand-light/45 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] p-6 max-h-[80vh] overflow-y-auto z-50 md:absolute md:bottom-auto md:top-full md:left-0 md:right-auto md:w-48 md:rounded-2xl md:border md:shadow-xl md:p-4 md:mt-2"
                    >
                      {/* Mobile handle indicator */}
                      <div className="w-12 h-1 bg-brand-light/80 rounded-full mx-auto mb-4 md:hidden" />
                      <div className="flex items-center justify-between mb-4 md:hidden">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-black">Filter Kondisi</span>
                        <button onClick={() => setActiveDropdown(null)} className="p-1 hover:bg-brand-light rounded-full cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {CONDITIONS_OPTIONS.map((cond) => (
                          <label key={cond} className="flex items-center gap-2.5 text-xs font-bold text-brand-black uppercase cursor-pointer hover:opacity-80">
                            <input
                              type="checkbox"
                              checked={selectedConditions.includes(cond)}
                              onChange={() => handleFilterChange("condition", cond)}
                              className="w-4 h-4 rounded accent-brand-black cursor-pointer"
                            />
                            {cond}
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Spacer */}
            <div className="flex-grow" />

            {/* 7. Sort Dropdown */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => toggleDropdown("sort")}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full border border-brand-light hover:border-brand-black bg-brand-white text-brand-black cursor-pointer transition-all duration-300"
              >
                Sort By: {SORT_OPTIONS.find(s => s.value === selectedSort)?.label}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === "sort" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === "sort" && (
                  <>
                    {/* Mobile Backdrop */}
                    <div 
                      className="fixed inset-0 bg-brand-black/40 z-40 md:hidden"
                      onClick={() => setActiveDropdown(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bottom-0 left-0 right-0 w-full rounded-t-3xl bg-brand-white border-t border-brand-light/45 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] overflow-hidden z-50 flex flex-col md:absolute md:bottom-auto md:top-full md:right-0 md:left-auto md:w-56 md:rounded-2xl md:border md:shadow-xl md:mt-2"
                    >
                      {/* Mobile handle indicator */}
                      <div className="w-12 h-1 bg-brand-light/80 rounded-full mx-auto mb-4 md:hidden" />
                      <div className="flex items-center justify-between mb-4 px-6 md:hidden">
                        <span className="text-xs font-black uppercase tracking-widest text-brand-black">Urutkan</span>
                        <button onClick={() => setActiveDropdown(null)} className="p-1 hover:bg-brand-light rounded-full cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-col">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleFilterChange("sort", opt.value)}
                            className={`text-left px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b border-brand-light/20 last:border-b-0 transition-colors ${
                              selectedSort === opt.value
                                ? "bg-brand-black text-brand-white"
                                : "bg-brand-white text-brand-black hover:bg-brand-light/40"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Selected Chips & Meta Info Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          {/* Active Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Gender Chip */}
            {selectedGender && (
              <span className="flex items-center gap-1 py-1 px-3 bg-brand-black text-brand-white text-[10px] font-black uppercase tracking-wider rounded-full">
                Gender: {selectedGender === "pria" ? "Mens" : "Womens"}
                <button
                  onClick={() => {
                    setSelectedGender("");
                    fetchFilteredProducts(
                      selectedCategories,
                      selectedSizes,
                      selectedColors,
                      selectedBrands,
                      selectedConditions,
                      selectedPriceRanges,
                      selectedSort,
                      1,
                      selectedCollections,
                      ""
                    );
                  }}
                  className="cursor-pointer hover:opacity-75 text-brand-white ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Category Chips */}
            {selectedCategories.map((slug) => {
              const name = categories.find(c => c.slug === slug)?.name || slug;
              return (
                <span key={slug} className="flex items-center gap-1 py-1 px-3 bg-brand-light text-brand-black text-[10px] font-black uppercase tracking-wider rounded-full border border-brand-light/60">
                  {name}
                  <button onClick={() => handleFilterChange("category", slug)} className="cursor-pointer hover:opacity-60 text-brand-black ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* Collection Chips */}
            {selectedCollections.map((colValue) => {
              const label = colValue.replace(/_/g, " ");
              return (
                <span key={colValue} className="flex items-center gap-1 py-1 px-3 bg-brand-light text-brand-black text-[10px] font-black uppercase tracking-wider rounded-full border border-brand-light/60">
                  Koleksi: {label}
                  <button onClick={() => handleFilterChange("collection", colValue)} className="cursor-pointer hover:opacity-60 text-brand-black ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* Size Chips */}
            {selectedSizes.map((sz) => (
              <span key={sz} className="flex items-center gap-1 py-1 px-3 bg-brand-light text-brand-black text-[10px] font-black uppercase tracking-wider rounded-full border border-brand-light/60">
                Size: {sz}
                <button onClick={() => handleFilterChange("size", sz)} className="cursor-pointer hover:opacity-60 text-brand-black ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Color Chips */}
            {selectedColors.map((color) => (
              <span key={color} className="flex items-center gap-1 py-1 px-3 bg-brand-light text-brand-black text-[10px] font-black uppercase tracking-wider rounded-full border border-brand-light/60">
                Warna: {color}
                <button onClick={() => handleFilterChange("color", color)} className="cursor-pointer hover:opacity-60 text-brand-black ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Brand Chips */}
            {selectedBrands.map((br) => (
              <span key={br} className="flex items-center gap-1 py-1 px-3 bg-brand-light text-brand-black text-[10px] font-black uppercase tracking-wider rounded-full border border-brand-light/60">
                {br}
                <button onClick={() => handleFilterChange("brand", br)} className="cursor-pointer hover:opacity-60 text-brand-black ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Price Chip */}
            {selectedPriceRanges.map((key) => {
              const label = PRICE_RANGES.find(r => r.key === key)?.label || key;
              return (
                <span key={key} className="flex items-center gap-1 py-1 px-3 bg-brand-light text-brand-black text-[10px] font-black uppercase tracking-wider rounded-full border border-brand-light/60">
                  {label}
                  <button onClick={() => handleFilterChange("price", key)} className="cursor-pointer hover:opacity-60 text-brand-black ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* Condition Chips */}
            {selectedConditions.map((cond) => (
              <span key={cond} className="flex items-center gap-1 py-1 px-3 bg-brand-light text-brand-black text-[10px] font-black uppercase tracking-wider rounded-full border border-brand-light/60">
                Kondisi: {cond}
                <button onClick={() => handleFilterChange("condition", cond)} className="cursor-pointer hover:opacity-60 text-brand-black ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 py-1 px-3.5 bg-transparent border border-brand-black hover:bg-brand-black hover:text-brand-white text-brand-black text-[10px] font-black uppercase tracking-wider rounded-full transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filter
              </button>
            )}
          </div>

          {/* Product Count */}
          <div className="text-xs font-bold text-brand-gray-light uppercase tracking-wider">
            {loading ? (
              <span>Memuat produk...</span>
            ) : (
              <span>{totalProducts} produk ditemukan</span>
            )}
          </div>
        </div>

        {/* Catalog List */}
        <div className="mt-4">
          {loading ? (
            // Skeleton Grid
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {Array.from({ length: 8 }).map((_, idx) => (
                <ProductSkeleton key={idx} />
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-brand-light/45 rounded-3xl text-center px-4">
              <p className="text-sm font-black uppercase tracking-widest text-brand-gray-light">
                Tidak ada produk ditemukan
              </p>
              <p className="text-xs text-brand-gray-light/80 mt-2 max-w-sm">
                Coba sesuaikan filter pencarian Anda atau reset kembali semua filter.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 px-6 py-3 border border-brand-black hover:bg-brand-black hover:text-brand-white text-brand-black text-xs font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            // Products Grid
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {products.map((product) => {
                const primaryImage = product.images[0]?.url || "";
                const hoverImage = product.images[1]?.url || product.images[0]?.url || "";
                const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    price={product.price}
                    imageUrl={primaryImage}
                    hoverImageUrl={hoverImage !== primaryImage ? hoverImage : undefined}
                    isNew={product.isNew}
                    isOutOfStock={totalStock === 0}
                    sizes={product.sizes}
                    brand={product.brand}
                    condition={product.condition}
                    likesCount={product.likesCount}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-16 pt-6 border-t border-brand-light/35">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 border border-brand-light rounded-xl text-xs font-black uppercase tracking-wider hover:border-brand-black disabled:opacity-40 disabled:hover:border-brand-light cursor-pointer transition-colors"
            >
              Prev
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  className={`w-9 h-9 border rounded-xl text-xs font-black cursor-pointer transition-colors ${
                    currentPage === pageNum
                      ? "bg-brand-black text-brand-white border-brand-black"
                      : "border-brand-light hover:border-brand-black bg-brand-white text-brand-black"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 border border-brand-light rounded-xl text-xs font-black uppercase tracking-wider hover:border-brand-black disabled:opacity-40 disabled:hover:border-brand-light cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
