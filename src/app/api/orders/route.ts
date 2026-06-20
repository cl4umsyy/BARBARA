import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const checkoutSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required"),
  phone: z.string().min(5, "Valid phone number is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(3, "Postal code is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const addressData = validation.data;
    const userId = session.user.id;

    // 1. Get the user's cart and items
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
              price
            )
          )
        )
      `)
      .eq("user_id", userId)
      .maybeSingle();

    if (cartErr) throw cartErr;

    if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
      throw new Error("Your cart is empty in the database. Add items to cart first.");
    }

    // 2. Verify and decrement variant stocks
    for (const item of cart.cart_items as any[]) {
      const variant = item.product_variants;
      if (!variant) continue;

      if (variant.stock < item.quantity) {
        throw new Error(
          `Stok untuk produk "${variant.products.name}" (${variant.size}/${variant.color}) tidak mencukupi. Tersedia: ${variant.stock}, dipesan: ${item.quantity}.`
        );
      }

      // Decrement stock
      const { error: stockErr } = await supabaseAdmin
        .from("product_variants")
        .update({ stock: variant.stock - item.quantity })
        .eq("id", variant.id);

      if (stockErr) throw stockErr;
    }

    // 3. Calculate financial totals
    console.log(`[LOG][Stage 5] Beginning order financial calculations for User ID: "${userId}"`);
    const subtotal = (cart.cart_items as any[]).reduce((acc, item) => {
      const variant = item.product_variants;
      if (!variant) return acc;

      const itemSubtotal = Number(variant.products.price) * item.quantity;
      console.log(` - Cart Item: "${variant.products.name}" (${variant.size}/${variant.color}) | Price: ${variant.products.price} | Qty: ${item.quantity} | Subtotal: ${itemSubtotal} (Math: ${variant.products.price} * ${item.quantity} = ${itemSubtotal})`);
      return acc + itemSubtotal;
    }, 0);
    
    const shippingCost = subtotal > 500000 ? 0 : 35000;
    const total = subtotal + shippingCost;
    console.log(` - Order Totals: Subtotal: ${subtotal} | Shipping: ${shippingCost} | Total: ${total} (Math: ${subtotal} + ${shippingCost} = ${total})`);

    // 4. Generate unique orderNumber
    const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `BBR-2026-${uniqueCode}`;

    // 5. Create Order records in database
    console.log(`[LOG][Stage 5] Creating order in database. Order Number: "${orderNumber}"`);
    const orderId = crypto.randomUUID();
    
    const { error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        id: orderId,
        user_id: userId,
        order_number: orderNumber,
        status: "PENDING",
        subtotal,
        shipping_cost: shippingCost,
        total,
        payment_status: "PENDING",
      });

    if (orderErr) throw orderErr;

    // Create Order items
    for (const item of cart.cart_items as any[]) {
      const variant = item.product_variants;
      if (!variant) continue;

      console.log(`   - Order Item Saved: "${variant.products.name}" (${variant.size}/${variant.color}) | Qty: ${item.quantity} | Price: ${variant.products.price}`);
      
      const { error: itemErr } = await supabaseAdmin
        .from("order_items")
        .insert({
          id: crypto.randomUUID(),
          order_id: orderId,
          variant_id: variant.id,
          product_name: variant.products.name,
          size: variant.size,
          color: variant.color,
          quantity: item.quantity,
          price: variant.products.price,
        });

      if (itemErr) throw itemErr;
    }

    // Create shipping address
    const { error: addressErr } = await supabaseAdmin
      .from("shipping_addresses")
      .insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        recipient_name: addressData.recipientName,
        phone: addressData.phone,
        street: addressData.street,
        city: addressData.city,
        province: addressData.province,
        postal_code: addressData.postalCode,
      });

    if (addressErr) throw addressErr;

    // 6. Clear user cart items
    const { error: clearCartErr } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id);

    if (clearCartErr) throw clearCartErr;

    return NextResponse.json({ orderId, orderNumber });
  } catch (error: any) {
    console.error("Order creation transaction error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 400 }
    );
  }
}
