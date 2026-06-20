import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

// ─── GET: Order detail for admin ─────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

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
        user:users (
          name,
          email
        ),
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
          variant_id,
          variant:product_variants (
            id,
            sku,
            product:products (
              id,
              name,
              slug,
              images:product_images (
                url,
                order
              )
            )
          )
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !dbOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const rawUser = dbOrder.user;
    const user = Array.isArray(rawUser) ? rawUser[0] : rawUser;

    const rawShipping = dbOrder.shipping_addresses;
    const shippingAddress = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping;

    const orderItems = (dbOrder.order_items || []).map((item: any) => {
      const rawVariant = item.variant;
      const variant = Array.isArray(rawVariant) ? rawVariant[0] : rawVariant;
      
      let mappedVariant = null;
      if (variant) {
        const rawProduct = variant.product;
        const product = Array.isArray(rawProduct) ? rawProduct[0] : rawProduct;
        
        let mappedProduct = null;
        if (product) {
          const sortedImages = (product.images || []).sort((a: any, b: any) => a.order - b.order);
          const mainImage = sortedImages.slice(0, 1);
          mappedProduct = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            images: mainImage,
          };
        }

        mappedVariant = {
          id: variant.id,
          sku: variant.sku,
          product: mappedProduct,
        };
      }

      return {
        id: item.id,
        productName: item.product_name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: Number(item.price),
        variantId: item.variant_id,
        variant: mappedVariant,
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
      user: user ? { name: user.name, email: user.email } : null,
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
    console.error("[Admin Order Detail GET] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ─── PATCH: Update order status (fulfillment) ─────────────────────────────────
export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await props.params;

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, trackingNumber } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const validStatuses: OrderStatus[] = [
      "PENDING", "PROCESSING", "SHIPPED", "DELIVERED",
      "COMPLETED", "CANCELLED", "EXPIRED", "FAILED",
    ];

    if (!validStatuses.includes(status as OrderStatus)) {
      return NextResponse.json({ error: "Invalid order status value" }, { status: 400 });
    }

    // Require tracking number when moving to SHIPPED
    if (status === "SHIPPED" && (!trackingNumber || !trackingNumber.trim())) {
      return NextResponse.json(
        { error: "Nomor resi (tracking number) wajib diisi saat status SHIPPED" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      status,
    };
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber.trim();
    }

    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    console.log(
      `[Admin] Order ${orderId} → ${status} by ${session.user.email}${trackingNumber ? ` (resi: ${trackingNumber})` : ""}`
    );

    const mappedUpdatedOrder = {
      id: updatedOrder.id,
      status: updatedOrder.status,
      trackingNumber: updatedOrder.tracking_number,
    };

    return NextResponse.json(mappedUpdatedOrder);
  } catch (error: any) {
    console.error("[Admin Order Detail PATCH] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
