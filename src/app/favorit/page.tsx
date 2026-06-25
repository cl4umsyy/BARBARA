import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Metadata } from "next";
import FavoritClient from "@/components/favorit/FavoritClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Favorit Saya — barbara",
  description: "Lihat dan kelola produk favorit Anda di barbara.",
};

export default async function FavoritPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/favorit");
  }

  let favorites: any[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .select(`
        id,
        product_id,
        created_at,
        product:products (
          id,
          name,
          slug,
          price,
          is_active,
          images:product_images (
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
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    favorites = (data || [])
      .filter((f: any) => f.product !== null)
      .map((f: any) => {
        const p = Array.isArray(f.product) ? f.product[0] : f.product;
        if (!p) return null;

        const sortedImages = (p.images || []).sort(
          (a: any, b: any) => a.order - b.order
        );

        return {
          id: f.id,
          productId: f.product_id,
          createdAt: f.created_at,
          product: {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            isActive: p.is_active,
            imageUrl: sortedImages[0]?.url || null,
            variants: (p.variants || []).map((v: any) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              colorHex: v.color_hex,
              stock: v.stock,
              sku: v.sku,
            })),
          },
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error("FavoritPage: Failed to load favorites:", err);
  }

  return <FavoritClient initialFavorites={favorites} />;
}
