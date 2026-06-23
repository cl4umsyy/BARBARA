import React from "react";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { ProductFilters } from "@/components/admin/ProductFilters";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

// Format currency
const formatIDR = (value: number | string) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

export default async function AdminProductsPage(props: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || "";
  const categoryFilter = searchParams.category || "";

  let products: any[] = [];
  let categories: any[] = [];

  try {
    // 1. Fetch categories for filters
    const { data: dbCategories, error: catErr } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (catErr) throw catErr;
    categories = dbCategories || [];

    // 2. Fetch products matching filters
    let selectFields = `
      id,
      name,
      slug,
      price,
      is_active,
      created_at,
      category_id,
      category:categories (
        name
      ),
      variants:product_variants (
        stock
      ),
      images:product_images (
        url,
        order
      ),
      reviews (
        rating
      )
    `;

    let query = supabaseAdmin.from("products").select(selectFields);

    if (categoryFilter) {
      query = query.eq("category_id", categoryFilter);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: dbProducts, error: prodErr } = await query.order("created_at", {
      ascending: false,
    });
    if (prodErr) throw prodErr;

    // Map dbProducts back to Prisma properties
    products = (dbProducts || []).map((p: any) => {
      const sortedImages = (p.images || []).sort((a: any, b: any) => a.order - b.order);
      const mainImage = sortedImages.slice(0, 1);
      const rawCategory = p.category;
      const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;

      const reviews = p.reviews || [];
      const rating = reviews.length > 0
        ? Number((reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviews.length).toFixed(1))
        : 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        isActive: p.is_active,
        category: category ? { name: category.name } : null,
        variants: p.variants || [],
        images: mainImage,
        rating,
        reviewCount: reviews.length,
      };
    });
  } catch (error) {
    console.error("Failed to fetch products from database:", error);
    // Fallback Mock Data for local testing if DB is down
    categories = [
      { id: "cat1", name: "T-Shirts", slug: "t-shirts" },
      { id: "cat2", name: "Jackets", slug: "jackets" },
    ];
    products = [
      {
        id: "prod1",
        name: "MONOCHROME OVERSINK TEE",
        slug: "monochrome-oversink-tee",
        price: 349000,
        isActive: true,
        category: { name: "T-Shirts" },
        images: [{ url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300" }],
        variants: [
          { size: "M", stock: 15 },
          { size: "L", stock: 10 },
          { size: "XL", stock: 5 },
        ],
      },
      {
        id: "prod2",
        name: "DARK LINEN BLAZER",
        slug: "dark-linen-blazer",
        price: 899000,
        isActive: false,
        category: { name: "Jackets" },
        images: [{ url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300" }],
        variants: [
          { size: "M", stock: 3 },
          { size: "L", stock: 0 },
        ],
      },
    ];
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gray-light">
            Catalog
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-wider md:text-4xl text-brand-black">
            Products
          </h1>
          <p className="text-sm text-brand-gray-light mt-1">
            Manage your fashion catalog, variant stocks, and images.
          </p>
        </div>

        <div>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-brand-black text-brand-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 hover:bg-brand-white hover:text-brand-black border border-brand-black transition-all duration-300 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <ProductFilters categories={categories} />

      {/* Products Table Card */}
      <div className="border border-brand-light bg-brand-white p-6 md:p-8 rounded-2xl shadow-sm">
        {products.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold uppercase tracking-widest text-brand-gray-light">
            No products found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-light">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-brand-gray-light w-16">
                    Image
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                    Product
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                    Category
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                    Price
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                    Rating
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                    Ulasan
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                    Total Stock
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                    Status
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-brand-gray-light text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {products.map((product) => {
                  const totalStock = product.variants.reduce(
                    (acc: number, v: any) => acc + v.stock,
                    0
                  );
                  const mainImage = product.images?.[0]?.url || "/placeholder-product.png";

                  return (
                    <tr
                      key={product.id}
                      className="group hover:bg-brand-light/20 transition-colors"
                    >
                      {/* Product Thumbnail */}
                      <td className="py-4 pr-4">
                        <div className="relative aspect-[3/4] w-12 border border-brand-light bg-brand-light overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mainImage}
                            alt={product.name}
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                      </td>

                      {/* Product Name & Details */}
                      <td className="py-4">
                        <p className="text-xs font-bold text-brand-black tracking-wide">
                          {product.name}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-brand-gray-light mt-1 font-semibold">
                          Variants: {product.variants.length} SKU(s)
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-4 text-xs font-medium text-brand-gray">
                        {product.category?.name || "Uncategorized"}
                      </td>

                      {/* Price */}
                      <td className="py-4 text-xs font-bold text-brand-black">
                        {formatIDR(product.price)}
                      </td>

                      {/* Rating */}
                      <td className="py-4 text-xs font-bold text-brand-black">
                        {product.rating > 0 ? `★ ${product.rating}` : "-"}
                      </td>

                      {/* Reviews Count */}
                      <td className="py-4 text-xs font-medium text-brand-gray">
                        {product.reviewCount} ulasan
                      </td>

                      {/* Total Stock */}
                      <td className="py-4 text-xs">
                        <span
                          className={`font-bold ${
                            totalStock === 0
                              ? "text-red-500"
                              : totalStock < 5
                              ? "text-amber-500"
                              : "text-brand-gray"
                          }`}
                        >
                          {totalStock} pcs
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                            product.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-brand-light text-brand-gray-light"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right">
                        <div className="inline-flex gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="inline-flex items-center gap-1 border border-brand-black text-brand-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 hover:bg-brand-black hover:text-brand-white transition-all duration-300 rounded-xl cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </Link>
                          <DeleteProductButton
                            productId={product.id}
                            productName={product.name}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
