import React from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { OrderDetailClient } from "@/components/orders/OrderDetailClient";

export const revalidate = 0; // Live fetching of details

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/orders/${id}`);
  }

  // Fetch the order from the database
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
          product_id,
          product:products (
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
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !dbOrder) {
    notFound();
  }

  // Fetch reviews for this order
  const { data: dbReviews } = await supabaseAdmin
    .from("reviews")
    .select("id, order_id, product_id, rating, review, review_images, created_at")
    .eq("order_id", id);

  const initialReviews = (dbReviews || []).map((r: any) => ({
    id: r.id,
    orderId: r.order_id,
    productId: r.product_id,
    rating: r.rating,
    review: r.review,
    reviewImages: r.review_images || [],
    createdAt: r.created_at,
  }));

  const rawShipping = dbOrder.shipping_addresses;
  const shippingAddress = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping;

  const orderItems = (dbOrder.order_items || []).map((item: any) => {
    const rawVariant = item.variant;
    const variant = Array.isArray(rawVariant) ? rawVariant[0] : rawVariant;
    let imageUrl = null;
    let productId = "";
    let productSlug = null;
    if (variant) {
      productId = variant.product_id;
      if (variant.product) {
        const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
        productSlug = product?.slug || null;
        if (product?.images && product.images.length > 0) {
          const sortedImages = [...product.images].sort((a: any, b: any) => a.order - b.order);
          imageUrl = sortedImages[0]?.url || null;
        }
      }
    }

    return {
      id: item.id,
      productId,
      productSlug,
      productName: item.product_name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: Number(item.price),
      imageUrl,
    };
  });

  let currentPaymentStatus = dbOrder.payment_status;
  let currentOrderStatus = dbOrder.status;
  let currentPaidAt = dbOrder.paid_at;
  let currentPaymentType = dbOrder.payment_type;
  let currentMidtransTransactionId = dbOrder.midtrans_transaction_id;

  if (currentPaymentStatus === "PENDING") {
    try {
      const { getMidtransTransactionStatus } = await import("@/lib/midtrans");
      const mtResult = await getMidtransTransactionStatus(dbOrder.id);
      const transactionStatus = mtResult.transaction_status;
      const fraudStatus = mtResult.fraud_status;

      if (
        transactionStatus === "settlement" ||
        (transactionStatus === "capture" && fraudStatus === "accept")
      ) {
        currentPaymentStatus = "PAID";
        currentOrderStatus = "PROCESSING";
        currentPaidAt = mtResult.settlement_time
          ? new Date(mtResult.settlement_time).toISOString()
          : new Date().toISOString();
        currentPaymentType = mtResult.payment_type || currentPaymentType;
        currentMidtransTransactionId = mtResult.transaction_id || currentMidtransTransactionId;

        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "PAID",
            status: "PROCESSING",
            payment_type: currentPaymentType,
            midtrans_transaction_id: currentMidtransTransactionId,
            paid_at: currentPaidAt,
          })
          .eq("id", dbOrder.id);

        const { data: cart } = await supabaseAdmin
          .from("carts")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (cart) {
          await supabaseAdmin
            .from("cart_items")
            .delete()
            .eq("cart_id", cart.id);
        }
      } else if (
        transactionStatus === "deny" ||
        transactionStatus === "cancel" ||
        transactionStatus === "expire"
      ) {
        currentPaymentStatus = transactionStatus === "expire" ? "EXPIRED" : "FAILED";
        currentOrderStatus =
          transactionStatus === "expire"
            ? "EXPIRED"
            : transactionStatus === "cancel"
            ? "CANCELLED"
            : "FAILED";

        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: currentPaymentStatus,
            status: currentOrderStatus,
          })
          .eq("id", dbOrder.id);
      }
    } catch (mtErr) {
      console.warn("[OrderDetailPage SSR] Live status check error:", mtErr);
    }
  }

  const order = {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    status: currentOrderStatus,
    subtotal: Number(dbOrder.subtotal),
    shippingCost: Number(dbOrder.shipping_cost),
    total: Number(dbOrder.total),
    paymentMethod: dbOrder.payment_method,
    paymentStatus: currentPaymentStatus,
    midtransId: dbOrder.midtrans_id,
    midtransTransactionId: currentMidtransTransactionId,
    paymentType: currentPaymentType,
    paidAt: currentPaidAt,
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

  return (
    <div className="w-full bg-brand-white flex-1">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-16 flex flex-col gap-6">
        <OrderDetailClient userId={session.user.id} order={order} initialReviews={initialReviews} />
      </div>
    </div>
  );
}
