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

  const order = {
    id: orderData.id,
    orderNumber: orderData.order_number,
    paymentStatus: orderData.payment_status,
    total: orderData.total,
    midtransId: orderData.midtrans_id,
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
