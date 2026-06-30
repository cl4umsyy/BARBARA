import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { productSchema } from "@/validators/product";
import { extractPublicId } from "@/lib/cloudinary";

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// GET /api/admin/products - List all products with details
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbProducts, error } = await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        price,
        material,
        care,
        is_new,
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
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map to camelCase to match original Prisma output
    const products = (dbProducts || []).map((p: any) => {
      const sortedImages = (p.images || []).sort((a: any, b: any) => a.order - b.order);
      const mainImage = sortedImages.slice(0, 1);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        material: p.material,
        care: p.care,
        isNew: p.is_new,
        isActive: p.is_active,
        createdAt: p.created_at,
        categoryId: p.category_id,
        category: p.category ? { name: p.category.name } : null,
        variants: p.variants || [],
        images: mainImage,
      };
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create a new product with variants and images
export async function POST(req: Request) {
  try {
    // 1. Authorization Check
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse & Validate request body
    const body = await req.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // 3. Generate slug
    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    let count = 0;
    
    // Safety check for duplicate slugs
    while (true) {
      const { data: existing, error: existErr } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existErr) throw existErr;
      if (!existing) break;
      count++;
      slug = `${baseSlug}-${count}`;
    }

    const productId = crypto.randomUUID();

    // 4. Insert product
    const { data: newProduct, error: prodErr } = await supabaseAdmin
      .from("products")
      .insert({
        id: productId,
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        material: data.material || null,
        care: data.care || null,
        category_id: data.categoryId,
        collection: data.collection || null,
        is_active: true,
        is_new: true,
      })
      .select()
      .single();

    if (prodErr) throw prodErr;

    try {
      // Create variants
      if (data.variants && data.variants.length > 0) {
        const { error: varErr } = await supabaseAdmin
          .from("product_variants")
          .insert(
            data.variants.map((v) => ({
              id: crypto.randomUUID(),
              product_id: productId,
              size: v.size,
              color: v.color,
              color_hex: v.colorHex,
              stock: v.stock,
              sku: v.sku,
            }))
          );
        if (varErr) throw varErr;
      }

      // Create images
      if (data.images && data.images.length > 0) {
        const { error: imgErr } = await supabaseAdmin
          .from("product_images")
          .insert(
            data.images.map((url, index) => ({
              id: crypto.randomUUID(),
              product_id: productId,
              url,
              alt: `${data.name} image ${index + 1}`,
              order: index,
              public_id: extractPublicId(url),
            }))
          );
        if (imgErr) throw imgErr;
      }
    } catch (insertError) {
      // Manual transaction rollback on failure
      await supabaseAdmin.from("products").delete().eq("id", productId);
      throw insertError;
    }

    // Map output to match the format of expected return
    const mappedProduct = {
      id: newProduct.id,
      name: newProduct.name,
      slug: newProduct.slug,
      description: newProduct.description,
      price: Number(newProduct.price),
      material: newProduct.material,
      care: newProduct.care,
      categoryId: newProduct.category_id,
      collection: newProduct.collection,
      isActive: newProduct.is_active,
      isNew: newProduct.is_new,
    };

    return NextResponse.json(mappedProduct, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
