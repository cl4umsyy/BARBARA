import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const revalidate = 0; // Disable dynamic caching for checkout pages

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/checkout");
  }

  // Fetch the default/first address of the logged in user
  let { data: dbAddress } = await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("is_default", true)
    .maybeSingle();

  if (!dbAddress) {
    const { data: fallbackAddress } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .limit(1)
      .maybeSingle();
    dbAddress = fallbackAddress;
  }

  const initialAddress = dbAddress
    ? {
        recipientName: dbAddress.recipient_name,
        phone: dbAddress.phone,
        street: dbAddress.street,
        city: dbAddress.city,
        province: dbAddress.province,
        postalCode: dbAddress.postal_code,
      }
    : null;

  return (
    <div className="w-full bg-brand-white flex-1">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-16 flex flex-col gap-10">
        
        {/* Header */}
        <div className="border-b border-brand-light pb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
            Secure Checkout
          </p>
          <h1 className="text-2xl md:text-5xl font-black tracking-widest text-brand-black mt-1">
            CHECKOUT
          </h1>
        </div>

        {/* Form & summary client area */}
        <CheckoutClient initialAddress={initialAddress} />

      </div>
    </div>
  );
}
