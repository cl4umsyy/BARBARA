import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await props.params;

    const { data: dbOrder, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        total,
        payment_method,
        payment_status,
        midtrans_id,
        midtrans_transaction_id,
        payment_type,
        paid_at,
        shipping_method,
        tracking_number,
        created_at,
        updated_at,
        shipping_addresses (
          recipient_name,
          phone,
          street,
          city,
          province,
          postal_code
        ),
        order_items (
          id,
          product_name,
          size,
          color,
          quantity,
          price,
          variant:product_variants (
            product:products (
              images:product_images (
                url,
                order
              )
            )
          )
        )
      `)
      .eq("id", orderId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error || !dbOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const rawShipping = dbOrder.shipping_addresses;
    const shippingAddress = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping;

    const orderItems = (dbOrder.order_items || []).map((item: any) => {
      const rawVariant = item.variant;
      const variant = Array.isArray(rawVariant) ? rawVariant[0] : rawVariant;
      let imageUrl = null;
      if (variant?.product) {
        const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
        if (product?.images && product.images.length > 0) {
          const sortedImages = [...product.images].sort((a: any, b: any) => a.order - b.order);
          imageUrl = sortedImages[0]?.url || null;
        }
      }

      return {
        id: item.id,
        productName: item.product_name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: Number(item.price),
        imageUrl,
      };
    });

    const order = {
      id: dbOrder.id,
      orderNumber: dbOrder.order_number,
      status: dbOrder.status,
      subtotal: Number(dbOrder.subtotal),
      shippingCost: Number(dbOrder.shipping_cost),
      total: Number(dbOrder.total),
      paymentMethod: dbOrder.payment_method,
      paymentStatus: dbOrder.payment_status,
      midtransId: dbOrder.midtrans_id,
      midtransTransactionId: dbOrder.midtrans_transaction_id,
      paymentType: dbOrder.payment_type,
      paidAt: dbOrder.paid_at,
      shippingMethod: dbOrder.shipping_method,
      trackingNumber: dbOrder.tracking_number,
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at,
      shippingAddress: shippingAddress ? {
        recipientName: shippingAddress.recipient_name,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        province: shippingAddress.province,
        postalCode: shippingAddress.postal_code,
      } : null,
      orderItems,
    };

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("[User Order Detail GET] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
