import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ConfirmationClient } from "@/components/checkout/ConfirmationClient";

export const dynamic = "force-dynamic"; // Never cache — always fetch fresh from DB

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface ConfirmationPageProps {
  searchParams: SearchParams;
}

export default async function ConfirmationPage(props: ConfirmationPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const searchParams = await props.searchParams;
  const orderId =
    typeof searchParams.orderId === "string" ? searchParams.orderId : undefined;

  if (!orderId) {
    redirect("/shop");
  }

  // Fetch order directly from DB — status reflects what webhook has set
  const { data: orderData, error } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_number,
      payment_status,
      total,
      midtrans_id,
      midtrans_transaction_id,
      payment_type,
      paid_at,
      shipping_addresses (
        recipient_name,
        phone,
        street,
        city,
        province,
        postal_code
      )
    `)
    .eq("id", orderId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !orderData) {
    redirect("/shop");
  }

  const rawShipping = orderData.shipping_addresses;
  const shippingAddress = Array.isArray(rawShipping)
    ? rawShipping[0]
    : rawShipping;

  let currentPaymentStatus = orderData.payment_status;
  let currentPaidAt = orderData.paid_at;
  let currentPaymentType = orderData.payment_type;
  let currentMidtransTransactionId = orderData.midtrans_transaction_id;

  // If DB status is still PENDING, perform a live check against Midtrans REST API BEFORE rendering
  if (currentPaymentStatus === "PENDING") {
    try {
      const { getMidtransTransactionStatus } = await import("@/lib/midtrans");
      const mtResult = await getMidtransTransactionStatus(orderData.id);
      const transactionStatus = mtResult.transaction_status;
      const fraudStatus = mtResult.fraud_status;

      if (
        transactionStatus === "settlement" ||
        (transactionStatus === "capture" && fraudStatus === "accept")
      ) {
        currentPaymentStatus = "PAID";
        currentPaidAt = mtResult.settlement_time
          ? new Date(mtResult.settlement_time).toISOString()
          : new Date().toISOString();
        currentPaymentType = mtResult.payment_type || currentPaymentType;
        currentMidtransTransactionId = mtResult.transaction_id || currentMidtransTransactionId;

        // Update database immediately in Server Component
        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "PAID",
            status: "PROCESSING",
            payment_type: currentPaymentType,
            midtrans_transaction_id: currentMidtransTransactionId,
            paid_at: currentPaidAt,
          })
          .eq("id", orderData.id);

        // Empty user cart in database
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
        const mappedPaymentStatus = transactionStatus === "expire" ? "EXPIRED" : "FAILED";
        const mappedOrderStatus =
          transactionStatus === "expire"
            ? "EXPIRED"
            : transactionStatus === "cancel"
            ? "CANCELLED"
            : "FAILED";
        currentPaymentStatus = mappedPaymentStatus;

        await supabaseAdmin
          .from("orders")
          .update({
            payment_status: mappedPaymentStatus,
            status: mappedOrderStatus,
          })
          .eq("id", orderData.id);
      }
    } catch (mtErr) {
      console.warn("[ConfirmationPage SSR] Live status check error:", mtErr);
    }
  }

  const order = {
    id: orderData.id,
    orderNumber: orderData.order_number,
    paymentStatus: currentPaymentStatus,
    total: orderData.total,
    midtransId: orderData.midtrans_id,
    midtransTransactionId: currentMidtransTransactionId,
    paymentType: currentPaymentType,
    paidAt: currentPaidAt,
    shippingAddress: shippingAddress
      ? {
          recipientName: shippingAddress.recipient_name,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          city: shippingAddress.city,
          province: shippingAddress.province,
          postalCode: shippingAddress.postal_code,
        }
      : null,
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <div className="w-full bg-brand-white flex-1">
      <div className="mx-auto max-w-3xl px-4 py-16 md:py-24 flex flex-col items-center gap-10">

        {/* Client component owns all polling + UI state */}
        <ConfirmationClient
          orderId={order.id}
          orderNumber={order.orderNumber}
          initialPaymentStatus={order.paymentStatus}
          totalAmount={formatPrice(Number(order.total))}
          snapToken={order.midtransId}
          initialMidtransTransactionId={order.midtransTransactionId}
          initialPaymentType={order.paymentType}
          initialPaidAt={order.paidAt}
        />

        {/* Shipping details — static, always shown */}
        {order.shippingAddress && (
          <div className="w-full border border-brand-light p-6 md:p-8 flex flex-col gap-4 rounded-xl shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-black border-b border-brand-light pb-3">
              Shipping Destination
            </h3>
            <div className="text-xs text-brand-gray flex flex-col gap-2 font-medium">
              <p>
                <strong className="text-brand-black uppercase">Recipient:</strong>{" "}
                {order.shippingAddress.recipientName}
              </p>
              <p>
                <strong className="text-brand-black uppercase">Phone:</strong>{" "}
                {order.shippingAddress.phone}
              </p>
              <p>
                <strong className="text-brand-black uppercase">Address:</strong>{" "}
                {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.province}, {order.shippingAddress.postalCode}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
