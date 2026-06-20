import React, { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";

export const revalidate = 0; // Disable dynamic caching for search queries

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface ShopPageProps {
  searchParams: SearchParams;
}

export default async function ShopPage(props: ShopPageProps) {
  const searchParams = await props.searchParams;

  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const size = typeof searchParams.size === "string" ? searchParams.size : undefined;
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "latest";
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const priceMax = typeof searchParams.price_max === "string" ? Number(searchParams.price_max) : undefined;

  // Build filter query for Supabase
  let selectFields = `
    id,
    name,
    slug,
    price,
    is_new,
    is_active,
    created_at,
    images:product_images (
      id,
      url,
      alt,
      order
    )
  `;

  // Dynamic select for category and size joins
  if (category) {
    selectFields += `, category:categories!inner(slug)`;
  } else {
    selectFields += `, category:categories(slug)`;
  }

  if (size) {
    selectFields += `, variants:product_variants!inner(id, size, color, stock)`;
  } else {
    selectFields += `, variants:product_variants(id, size, color, stock)`;
  }

  let query = supabaseAdmin
    .from("products")
    .select(selectFields)
    .eq("is_active", true);

  if (category) {
    query = query.eq("categories.slug", category);
  }

  if (size) {
    query = query.eq("product_variants.size", size);
  }

  if (priceMax !== undefined) {
    query = query.lte("price", priceMax);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Execute database operations
  const [productsRes, categoriesRes, maxPriceRes] = await Promise.all([
    query,
    supabaseAdmin.from("categories").select("*"),
    supabaseAdmin
      .from("products")
      .select("price")
      .eq("is_active", true)
      .order("price", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const rawProducts = productsRes.data || [];
  const products = rawProducts.map((product: any) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    isNew: product.is_new,
    is_active: product.is_active,
    created_at: product.created_at,
    images: (product.images || [])
      .map((img: any) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        order: img.order,
      }))
      .sort((a: any, b: any) => a.order - b.order),
    variants: (product.variants || []).map((v: any) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: v.stock,
    })),
  }));

  const categories = categoriesRes.data || [];
  const maxPriceProduct = maxPriceRes.data;
  const maxPriceInDb = maxPriceProduct ? Math.ceil(Number(maxPriceProduct.price)) : 1000000;

  return (
    <div className="w-full bg-brand-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 lg:px-16 flex flex-col gap-10">
        
        {/* Header */}
        <div className="border-b border-brand-light pb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
            Collections Catalog
          </p>
          <h1 className="text-2xl md:text-5xl font-black tracking-widest text-brand-black mt-1">
            SHOP ALL
          </h1>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Sidebar Filters */}
          <Suspense fallback={<div className="w-full md:w-64 h-96 bg-brand-light animate-pulse" />}>
            <ShopFilters
              categories={categories}
              maxPriceInDb={maxPriceInDb}
            />
          </Suspense>

          {/* Product Grid */}
          <div className="flex-1 w-full">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-brand-gray-light/30 text-center px-4">
                <p className="text-sm font-extrabold uppercase tracking-widest text-brand-gray-light">
                  No products found
                </p>
                <p className="text-xs text-brand-gray mt-2">
                  Try adjusting your filter categories or resetting price constraints.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {products.map((product) => {
                  const primaryImage = product.images[0]?.url || "";
                  const hoverImage = product.images[1]?.url || product.images[0]?.url || "";
                  const totalStock = product.variants.reduce((acc: number, v: any) => acc + v.stock, 0);

                  return (
                    <ProductCard
                      key={product.id}
                      slug={product.slug}
                      name={product.name}
                      price={Number(product.price)}
                      imageUrl={primaryImage}
                      hoverImageUrl={hoverImage !== primaryImage ? hoverImage : undefined}
                      isNew={product.isNew}
                      isOutOfStock={totalStock === 0}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
