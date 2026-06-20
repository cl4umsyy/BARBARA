import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import ProfileClient from "@/components/profile/ProfileClient";
import { Metadata } from "next";

export const revalidate = 0; // Disable cache to fetch live data

export const metadata: Metadata = {
  title: "Profil Saya - barbara",
  description: "Kelola informasi profil, alamat pengiriman, dan keamanan akun Anda di barbara.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/profile");
  }

  const userId = session.user.id;

  // Fetch user profile data directly from database
  let userResult = await supabaseAdmin
    .from("users")
    .select("id, name, email, phone, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();

  let user = userResult.data;
  let userError = userResult.error;

  if (userError && userError.code === "42703") {
    const fallbackUserResult = await supabaseAdmin
      .from("users")
      .select("id, name, email, created_at")
      .eq("id", userId)
      .maybeSingle();
    
    if (fallbackUserResult.error) {
      userError = fallbackUserResult.error;
    } else {
      user = fallbackUserResult.data ? {
        ...fallbackUserResult.data,
        phone: null,
        avatar_url: null,
      } : null;
      userError = null;
    }
  }

  if (userError || !user) {
    console.error("Profile page: User not found in DB or error:", userError);
    redirect("/");
  }

  // Fetch shipping addresses directly from database
  let addressResult = await supabaseAdmin
    .from("addresses")
    .select("id, label, recipient_name, phone, street, city, province, district, postal_code, is_default, created_at")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  let dbAddresses = addressResult.data;
  let addressError = addressResult.error;

  if (addressError && addressError.code === "42703") {
    const fallbackAddrResult = await supabaseAdmin
      .from("addresses")
      .select("id, label, recipient_name, phone, street, city, province, postal_code, is_default")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });

    if (fallbackAddrResult.error) {
      addressError = fallbackAddrResult.error;
    } else {
      dbAddresses = (fallbackAddrResult.data || []).map((addr: any) => {
        let district = "";
        let city = addr.city;
        if (addr.city && addr.city.includes(" | ")) {
          const parts = addr.city.split(" | ");
          district = parts[0];
          city = parts[1];
        }
        return {
          id: addr.id,
          label: addr.label,
          recipient_name: addr.recipient_name,
          phone: addr.phone,
          street: addr.street,
          city,
          province: addr.province,
          district,
          postal_code: addr.postal_code,
          address_detail: addr.street,
          is_default: addr.is_default,
          created_at: new Date().toISOString(),
        };
      });
      addressError = null;
    }
  }

  const initialProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    avatarUrl: user.avatar_url || "",
    createdAt: user.created_at,
  };

  const initialAddresses = (dbAddresses || []).map((addr: any) => ({
    id: addr.id,
    label: addr.label,
    recipientName: addr.recipient_name,
    phone: addr.phone,
    street: addr.street,
    city: addr.city,
    province: addr.province,
    district: addr.district || "",
    postalCode: addr.postal_code,
    addressDetail: addr.address_detail || addr.street,
    isDefault: addr.is_default,
    createdAt: addr.created_at,
  }));

  return (
    <ProfileClient 
      initialProfile={initialProfile} 
      initialAddresses={initialAddresses} 
    />
  );
}
