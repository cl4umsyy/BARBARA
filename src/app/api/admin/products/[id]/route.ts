import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { productSchema } from "@/validators/product";
import { extractPublicId, deleteFromCloudinary } from "@/lib/cloudinary";

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// PUT /api/admin/products/[id] - Update product details, variants, and images
export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await props.params;

    // 1. Authorization check
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

    // 3. Verify product exists
    const { data: existingProduct, error: existErr } = await supabaseAdmin
      .from("products")
      .select("id, name, slug")
      .eq("id", productId)
      .maybeSingle();

    if (existErr || !existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 4. Generate slug if name changed
    let slug = existingProduct.slug;
    if (data.name !== existingProduct.name) {
      const baseSlug = slugify(data.name);
      slug = baseSlug;
      let count = 0;
      while (true) {
        const { data: duplicate, error: dupErr } = await supabaseAdmin
          .from("products")
          .select("id")
          .eq("slug", slug)
          .neq("id", productId)
          .maybeSingle();

        if (dupErr) throw dupErr;
        if (!duplicate) break;
        count++;
        slug = `${baseSlug}-${count}`;
      }
    }

    // 5. Update product core fields
    const { data: product, error: updateErr } = await supabaseAdmin
      .from("products")
      .update({
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        material: data.material || null,
        care: data.care || null,
        category_id: data.categoryId,
        collection: data.collection || null,
      })
      .eq("id", productId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Synchronize variants
    const { data: dbVariants, error: varGetErr } = await supabaseAdmin
      .from("product_variants")
      .select("*")
      .eq("product_id", productId);

    if (varGetErr) throw varGetErr;

    const incomingSKUs = data.variants.map((v) => v.sku);

    // Identify variants to delete
    const variantsToDelete = (dbVariants || []).filter(
      (v) => !incomingSKUs.includes(v.sku)
    );

    for (const v of variantsToDelete) {
      // Check if variant is referenced in order_items
      const { data: isTied, error: tieErr } = await supabaseAdmin
        .from("order_items")
        .select("id")
        .eq("variant_id", v.id)
        .maybeSingle();

      if (tieErr) throw tieErr;

      if (!isTied) {
        // Clean cart_items referencing it
        const { error: cartDelErr } = await supabaseAdmin
          .from("cart_items")
          .delete()
          .eq("variant_id", v.id);
        if (cartDelErr) throw cartDelErr;

        // Delete variant
        const { error: varDelErr } = await supabaseAdmin
          .from("product_variants")
          .delete()
          .eq("id", v.id);
        if (varDelErr) throw varDelErr;
      } else {
        // Set stock to 0 to make it unavailable but keep for historical orders
        const { error: varUpdErr } = await supabaseAdmin
          .from("product_variants")
          .update({ stock: 0 })
          .eq("id", v.id);
        if (varUpdErr) throw varUpdErr;
      }
    }

    // Upsert incoming variants
    for (const v of data.variants) {
      const existing = (dbVariants || []).find((ev) => ev.sku === v.sku);
      if (existing) {
        const { error: varUpdErr } = await supabaseAdmin
          .from("product_variants")
          .update({
            size: v.size,
            color: v.color,
            color_hex: v.colorHex,
            stock: v.stock,
          })
          .eq("id", existing.id);
        if (varUpdErr) throw varUpdErr;
      } else {
        const { error: varInsErr } = await supabaseAdmin
          .from("product_variants")
          .insert({
            id: crypto.randomUUID(),
            product_id: productId,
            size: v.size,
            color: v.color,
            color_hex: v.colorHex,
            stock: v.stock,
            sku: v.sku,
          });
        if (varInsErr) throw varInsErr;
      }
    }

    // Sync images with Cloudinary & Database
    // 1. Fetch current images from database to identify removals
    const { data: dbImages, error: imgGetErr } = await supabaseAdmin
      .from("product_images")
      .select("url, public_id")
      .eq("product_id", productId);
    if (imgGetErr) throw imgGetErr;

    // 2. Identify images removed in this update
    const incomingUrls = data.images || [];
    const removedImages = (dbImages || []).filter(
      (img) => img.public_id && !incomingUrls.includes(img.url)
    );

    // 3. Delete removed images from Cloudinary
    for (const img of removedImages) {
      if (img.public_id) {
        try {
          await deleteFromCloudinary(img.public_id);
        } catch (err) {
          console.error(`Error deleting image ${img.public_id} from Cloudinary:`, err);
        }
      }
    }

    // 4. Delete old database records
    const { error: imgDelErr } = await supabaseAdmin
      .from("product_images")
      .delete()
      .eq("product_id", productId);
    if (imgDelErr) throw imgDelErr;

    // 5. Insert new database records including public_id
    if (data.images && data.images.length > 0) {
      const { error: imgInsErr } = await supabaseAdmin
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
      if (imgInsErr) throw imgInsErr;
    }

    const mappedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      material: product.material,
      care: product.care,
      categoryId: product.category_id,
      collection: product.collection,
      isActive: product.is_active,
      isNew: product.is_new,
    };

    return NextResponse.json(mappedProduct);
  } catch (error: any) {
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product permanently or soft-deactivate if in orders
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await props.params;

    // 1. Authorization check
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch variants to see if any are tied to orders
    const { data: variants, error: varErr } = await supabaseAdmin
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);

    if (varErr) throw varErr;

    const variantIds = (variants || []).map((v) => v.id);

    let tiedOrderItem = null;
    if (variantIds.length > 0) {
      const { data: tiedItem, error: tieErr } = await supabaseAdmin
        .from("order_items")
        .select("id")
        .in("variant_id", variantIds)
        .limit(1)
        .maybeSingle();

      if (tieErr) throw tieErr;
      tiedOrderItem = tiedItem;
    }

    if (tiedOrderItem) {
      // Soft-deactivate the product instead of deleting to preserve order history integrity
      const { data: deactivated, error: deactErr } = await supabaseAdmin
        .from("products")
        .update({ is_active: false })
        .eq("id", productId)
        .select()
        .single();

      if (deactErr) throw deactErr;

      return NextResponse.json({
        success: true,
        message: "Product deactivated instead of deleted because it is tied to orders.",
        product: {
          id: deactivated.id,
          name: deactivated.name,
          slug: deactivated.slug,
          isActive: deactivated.is_active,
        },
      });
    }

    // Fetch images before deleting the product so we have their public_ids
    const { data: dbImages, error: imgGetErr } = await supabaseAdmin
      .from("product_images")
      .select("public_id")
      .eq("product_id", productId);

    if (!imgGetErr && dbImages && dbImages.length > 0) {
      for (const img of dbImages) {
        if (img.public_id) {
          try {
            await deleteFromCloudinary(img.public_id);
          } catch (err) {
            console.error(`Error deleting image ${img.public_id} from Cloudinary:`, err);
          }
        }
      }
    }

    // Safe to delete permanently from Supabase
    const { error: delErr } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", productId);

    if (delErr) throw delErr;

    return NextResponse.json({
      success: true,
      message: "Product deleted permanently.",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
