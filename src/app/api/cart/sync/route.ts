import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify user exists in DB
    const { data: userExists, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (userErr || !userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get cart with its items and variant/product details
    const { data: cart, error: cartErr } = await supabaseAdmin
      .from("carts")
      .select(`
        id,
        cart_items (
          id,
          quantity,
          variant_id,
          product_variants (
            id,
            size,
            color,
            stock,
            product_id,
            products (
              id,
              name,
              price,
              product_images (
                url
              )
            )
          )
        )
      `)
      .eq("user_id", userId)
      .maybeSingle();

    if (cartErr) throw cartErr;

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    // Map DB models to client CartItem format
    const rawItems = cart.cart_items || [];
    const formattedItems = rawItems
      .map((item: any) => {
        const variant = item.product_variants;
        const product = variant?.products;
        // Find main product image or default to empty string
        const primaryImage = product?.product_images?.[0]?.url || "";

        return {
          variantId: variant?.id,
          productId: product?.id,
          name: product?.name,
          size: variant?.size,
          color: variant?.color,
          price: Number(product?.price || 0),
          imageUrl: primaryImage,
          quantity: item.quantity,
          maxStock: variant?.stock || 0,
        };
      })
      .filter((i: any) => i.variantId);

    return NextResponse.json({ items: formattedItems });
  } catch (error: any) {
    console.error("Cart fetch GET error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const localItems: { variantId: string; quantity: number }[] = await req.json();
    const userId = session.user.id;

    // Verify user exists in DB
    const { data: userExists, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (userErr || !userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // 1. Get or create Cart
    let { data: cart, error: cartErr } = await supabaseAdmin
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (cartErr) throw cartErr;

    if (!cart) {
      const cartId = crypto.randomUUID();
      const { data: newCart, error: createCartErr } = await supabaseAdmin
        .from("carts")
        .insert({ id: cartId, user_id: userId })
        .select("id")
        .single();

      if (createCartErr) throw createCartErr;
      cart = newCart;
    }

    const cartId = cart.id;

    // 2. Perform overwrite/sync logic
    const payloadVariantIds = localItems.map((item) => item.variantId);

    if (payloadVariantIds.length > 0) {
      // Remove database cart items that are not in the client payload
      const { error: delErr } = await supabaseAdmin
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId)
        .not("variant_id", "in", `(${payloadVariantIds.map(id => `"${id}"`).join(",")})`);
      
      if (delErr) throw delErr;
    } else {
      // If payload is empty, delete all items
      const { error: delErr } = await supabaseAdmin
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId);

      if (delErr) throw delErr;
    }

    for (const localItem of localItems) {
      // Fetch product variant details to check stock
      const { data: variant, error: varErr } = await supabaseAdmin
        .from("product_variants")
        .select(`
          id,
          stock,
          product:products (
            name
          )
        `)
        .eq("id", localItem.variantId)
        .maybeSingle();

      if (varErr || !variant) continue;

      const stock = variant.stock;
      if (stock <= 0) {
        // If out of stock, delete from database cart
        await supabaseAdmin
          .from("cart_items")
          .delete()
          .eq("cart_id", cartId)
          .eq("variant_id", localItem.variantId);
        continue;
      }

      // Validate target quantity (minimal 1, capped at stock limit)
      const targetQty = Math.max(1, Math.min(localItem.quantity, stock));

      // Stage 3 Logging: When saving/updating items in database
      const productName = (variant.product as any)?.name || "Unknown Product";
      console.log(`[LOG][Stage 3] Saving cart item to database. Cart ID: "${cartId}", Product Name: "${productName}", Variant ID: "${localItem.variantId}", Target Quantity: ${targetQty} (capped at stock: ${stock})`);

      // Check if item already exists in database cart
      const { data: dbItem } = await supabaseAdmin
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("variant_id", localItem.variantId)
        .maybeSingle();

      if (dbItem) {
        // Overwrite quantity with client target quantity (instead of addition)
        await supabaseAdmin
          .from("cart_items")
          .update({ quantity: targetQty })
          .eq("id", dbItem.id);
      } else {
        // Create new database cart item
        await supabaseAdmin
          .from("cart_items")
          .insert({
            id: crypto.randomUUID(),
            cart_id: cartId,
            variant_id: localItem.variantId,
            quantity: targetQty,
          });
      }
    }

    // 3. Retrieve final cart items list
    const { data: updatedCart, error: finalErr } = await supabaseAdmin
      .from("carts")
      .select(`
        id,
        cart_items (
          id,
          quantity,
          variant_id,
          product_variants (
            id,
            size,
            color,
            stock,
            product_id,
            products (
              id,
              name,
              price,
              product_images (
                url
              )
            )
          )
        )
      `)
      .eq("id", cartId)
      .single();

    if (finalErr) throw finalErr;

    const rawItems = updatedCart?.cart_items || [];
    const formattedItems = rawItems
      .map((item: any) => {
        const variant = item.product_variants;
        const product = variant?.products;
        const primaryImage = product?.product_images?.[0]?.url || "";

        return {
          variantId: variant?.id,
          productId: product?.id,
          name: product?.name,
          size: variant?.size,
          color: variant?.color,
          price: Number(product?.price || 0),
          imageUrl: primaryImage,
          quantity: item.quantity,
          maxStock: variant?.stock || 0,
        };
      })
      .filter((i: any) => i.variantId);

    return NextResponse.json({ items: formattedItems });
  } catch (error: any) {
    console.error("Cart sync API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
