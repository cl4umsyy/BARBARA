import { supabaseAdmin } from "@/lib/supabase";
import { ProductFormClient } from "@/components/admin/ProductFormClient";
import Link from "next/link";
import { ArrowLeft, Star, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";


export default async function AdminEditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let product = null;
  let categories: any[] = [];
  let productReviews: any[] = [];

  try {
    const { data: dbCategories, error: catErr } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (catErr) throw catErr;
    categories = dbCategories || [];

    const [productRes, reviewsRes] = await Promise.all([
      supabaseAdmin
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
        .maybeSingle(),
      supabaseAdmin
        .from("reviews")
        .select(`
          id,
          rating,
          review,
          review_images,
          is_shown,
          admin_reply,
          admin_replied_at,
          created_at,
          users:user_id (
            name,
            email
          )
        `)
        .eq("product_id", id)
        .order("created_at", { ascending: false })
    ]);

    if (productRes.error) throw productRes.error;
    const dbProduct = productRes.data;

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

    if (!reviewsRes.error && reviewsRes.data) {
      productReviews = reviewsRes.data.map((r: any) => {
        const rawUser = r.users;
        const user = Array.isArray(rawUser) ? rawUser[0] : rawUser;
        return {
          id: r.id,
          rating: r.rating,
          review: r.review,
          reviewImages: r.review_images || [],
          isShown: r.is_shown,
          adminReply: r.admin_reply,
          adminRepliedAt: r.admin_replied_at,
          createdAt: r.created_at,
          userName: user?.name || "Customer",
          userEmail: user?.email || "",
        };
      });
    }
  } catch (error) {
    console.error("Failed to load product or reviews for editing:", error);
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

  return (
    <div className="space-y-12">
      <ProductFormClient categories={categories} initialProduct={formattedProduct} />

      {/* Product Reviews List */}
      <div className="border border-brand-light bg-brand-white p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-wider text-brand-black">
            Ulasan Terkait Produk
          </h3>
          <p className="text-xs text-brand-gray-light mt-0.5">
            Daftar seluruh ulasan pelanggan untuk produk ini. Kelola visibilitas dan balasan selengkapnya di menu{" "}
            <Link href="/admin/reviews" className="underline hover:text-brand-black font-semibold">
              Reviews
            </Link>
            .
          </p>
        </div>

        {productReviews.length === 0 ? (
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gray-light py-8 text-center border-t border-brand-light border-dashed">
            Belum ada ulasan untuk produk ini.
          </p>
        ) : (
          <div className="divide-y divide-brand-light border-t border-brand-light">
            {productReviews.map((r: any) => (
              <div key={r.id} className="py-6 first:pt-4 last:pb-0 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-black">{r.userName}</span>
                    <span className="text-[10px] text-brand-gray-light">({r.userEmail})</span>
                  </div>
                  <span className="text-[10px] text-brand-gray-light">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(r.createdAt))}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r.rating ? "fill-amber-400 text-amber-400" : "text-brand-light fill-brand-light/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border ${
                    r.isShown 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {r.isShown ? "Aktif" : "Disembunyikan"}
                  </span>
                </div>

                <p className="text-brand-gray leading-relaxed whitespace-pre-wrap">{r.review}</p>

                {r.adminReply && (
                  <div className="mt-2 pl-4 border-l-2 border-brand-black bg-[#fbfbfb] p-4 rounded-r-xl space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-brand-black block">
                      Balasan Resmi Admin
                    </span>
                    <p className="text-brand-gray leading-relaxed whitespace-pre-wrap">{r.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
