import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin, isMissingColumnError } from "@/lib/supabase";
import ProfileClient from "@/components/profile/ProfileClient";
import { Metadata } from "next";

export const revalidate = 0; // Disable cache to fetch live data

export const metadata: Metadata = {
  title: "Profil Saya - barbara",
  description: "Kelola informasi profil, alamat pengiriman, dan keamanan akun Anda di barbara.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = (tab === "profile" || tab === "addresses" || tab === "orders" || tab === "security") ? tab : "profile";

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

  // Debugging info
  console.log("[DEBUG][ProfilePage Server] DB user result:", {
    id: user?.id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    avatar_url: user?.avatar_url,
  });
  console.log("[DEBUG][ProfilePage Server] NextAuth session user image:", session.user.image);

  if (userError && isMissingColumnError(userError)) {
    console.warn("[DEBUG][ProfilePage Server] avatar_url column is missing in users table! Falling back...");
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

  if (addressError && isMissingColumnError(addressError)) {
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
    avatarUrl: user.avatar_url || session.user.image || "",
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

  // Fetch orders from DB directly
  const { data: dbOrders, error: ordersErr } = await supabaseAdmin
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
      created_at,
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
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (ordersErr) {
    console.error("ProfilePage: Error fetching orders:", ordersErr);
  }

  // Fetch initial reviews written by this user
  const { data: dbReviews, error: reviewsErr } = await supabaseAdmin
    .from("reviews")
    .select("id, order_id, product_id, rating, review, review_images, created_at")
    .eq("user_id", userId);

  if (reviewsErr) {
    console.error("ProfilePage: Error fetching user reviews:", reviewsErr);
  }

  const initialReviews = (dbReviews || []).map((r: any) => ({
    id: r.id,
    orderId: r.order_id,
    productId: r.product_id,
    rating: r.rating,
    review: r.review,
    reviewImages: r.review_images || [],
    createdAt: r.created_at,
  }));

  const initialOrders = (dbOrders || []).map((o: any) => {
    const orderItems = (o.order_items || []).map((item: any) => {
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

    return {
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      subtotal: Number(o.subtotal),
      shippingCost: Number(o.shipping_cost),
      total: Number(o.total),
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
      orderItems,
    };
  });

  return (
    <ProfileClient 
      initialProfile={initialProfile} 
      initialAddresses={initialAddresses} 
      initialOrders={initialOrders}
      initialReviews={initialReviews}
      initialTab={initialTab}
    />
  );
}
