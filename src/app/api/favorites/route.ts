import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/favorites — list all favorites for the logged-in user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const favorites = (data || [])
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

    return NextResponse.json(favorites);
  } catch (error: any) {
    console.error("GET /api/favorites error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/favorites — toggle favorite (add if not exists, remove if exists)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const { data: existing } = await supabaseAdmin
      .from("wishlists")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      // Remove favorite
      const { error } = await supabaseAdmin
        .from("wishlists")
        .delete()
        .eq("id", existing.id);

      if (error) throw error;

      return NextResponse.json({ action: "removed", productId });
    } else {
      // Add favorite
      const { error } = await supabaseAdmin.from("wishlists").insert({
        id: crypto.randomUUID(),
        user_id: session.user.id,
        product_id: productId,
      });

      if (error) throw error;

      return NextResponse.json({ action: "added", productId }, { status: 201 });
    }
  } catch (error: any) {
    console.error("POST /api/favorites error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
