import { supabaseAdmin } from "@/lib/supabase";
import { ProductFormClient } from "@/components/admin/ProductFormClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminEditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let product = null;
  let categories: any[] = [];

  try {
    const { data: dbCategories, error: catErr } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (catErr) throw catErr;
    categories = dbCategories || [];

    const { data: dbProduct, error: prodErr } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price,
        material,
        care,
        category_id,
        is_active,
        is_new,
        images:product_images (
          id,
          url,
          alt,
          order
        ),
        variants:product_variants (
          id,
          size,
          color,
          color_hex,
          stock,
          sku
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (prodErr) throw prodErr;

    if (dbProduct) {
      const sortedImages = (dbProduct.images || []).sort((a: any, b: any) => a.order - b.order);
      const sortedVariants = (dbProduct.variants || []).sort((a: any, b: any) =>
        a.size.localeCompare(b.size)
      );

      product = {
        id: dbProduct.id,
        name: dbProduct.name,
        slug: dbProduct.slug,
        description: dbProduct.description,
        price: Number(dbProduct.price),
        material: dbProduct.material,
        care: dbProduct.care,
        categoryId: dbProduct.category_id,
        isActive: dbProduct.is_active,
        isNew: dbProduct.is_new,
        images: sortedImages,
        variants: sortedVariants.map((v: any) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          colorHex: v.color_hex,
          stock: v.stock,
          sku: v.sku,
        })),
      };
    }
  } catch (error) {
    console.error("Failed to load product for editing:", error);
  }

  // Fallback Mock Data for testing if database is offline or not found
  if (!product && (id === "prod1" || id === "prod2")) {
    categories = [
      { id: "cat1", name: "T-Shirts" },
      { id: "cat2", name: "Jackets" },
    ];
    product =
      id === "prod1"
        ? {
            id: "prod1",
            name: "MONOCHROME OVERSINK TEE",
            description:
              "A premium oversized tee featuring pure monochrome accents, drop shoulders, and organic cotton. Perfect streetwear look.",
            price: 349000,
            material: "100% Organic Cotton",
            care: "Cold machine wash, air dry",
            categoryId: "cat1",
            images: [
              { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300" },
            ],
            variants: [
              {
                size: "M",
                color: "Black",
                colorHex: "#000000",
                stock: 15,
                sku: "BBR-TEE-BLK-M",
              },
              {
                size: "L",
                color: "Black",
                colorHex: "#000000",
                stock: 10,
                sku: "BBR-TEE-BLK-L",
              },
              {
                size: "XL",
                color: "Black",
                colorHex: "#000000",
                stock: 5,
                sku: "BBR-TEE-BLK-XL",
              },
            ],
          }
        : {
            id: "prod2",
            name: "DARK LINEN BLAZER",
            description:
              "Tailored minimalist blazer with sharp shoulder padding and clean double breast closures. Sleek unisex styling.",
            price: 899000,
            material: "80% Linen, 20% Cotton",
            care: "Dry clean only",
            categoryId: "cat2",
            images: [
              { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300" },
            ],
            variants: [
              {
                size: "M",
                color: "Charcoal",
                colorHex: "#333333",
                stock: 3,
                sku: "BBR-BLZ-CHR-M",
              },
            ],
          };
  }

  if (!product) {
    return (
      <div className="space-y-6 font-sans text-center py-20 border border-brand-light bg-brand-white">
        <h1 className="text-xl font-bold uppercase tracking-widest text-brand-black">
          Product Not Found
        </h1>
        <p className="text-xs text-brand-gray-light uppercase tracking-wider">
          The requested product ID does not exist or database connection is offline.
        </p>
        <div className="pt-4">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 border border-brand-black text-brand-black text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-brand-black hover:text-brand-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    );
  }

  // Convert decimal to number for Form Component compatibility
  const formattedProduct = {
    ...product,
    price: Number(product.price),
  };

  return <ProductFormClient categories={categories} initialProduct={formattedProduct} />;
}
