import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Package } from "lucide-react";
import { OrdersClient } from "@/components/orders/OrdersClient";

export const revalidate = 0; // Disable caching to fetch live order data

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/orders");
  }

  const userId = session.user.id;

  // Fetch orders from DB directly
  const { data: dbOrders, error } = await supabaseAdmin
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

  if (error) {
    console.error("Error fetching orders:", error);
  }

  // Fetch initial reviews written by this user
  const { data: dbReviews, error: reviewsErr } = await supabaseAdmin
    .from("reviews")
    .select("id, order_id, product_id, rating, review, review_images, created_at")
    .eq("user_id", userId);

  if (reviewsErr) {
    console.error("Error fetching user reviews:", reviewsErr);
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

  const orders = (dbOrders || []).map((o: any) => {
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
    <div className="w-full bg-brand-white flex-1">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-16 flex flex-col gap-10">
        
        {/* Header */}
        <div className="border-b border-brand-light pb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
            Riwayat Transaksi
          </p>
          <h1 className="text-2xl md:text-5xl font-black tracking-widest text-brand-black mt-1">
            PESANAN SAYA
          </h1>
        </div>

        {/* Content */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-brand-light flex items-center justify-center mb-6 border border-brand-light rounded-2xl">
              <Package className="w-6 h-6 text-brand-gray-light" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-brand-black">
              Belum Ada Pesanan
            </h2>
            <p className="text-xs text-brand-gray mt-2 max-w-sm leading-relaxed">
              Anda belum melakukan pemesanan apa pun. Jelajahi katalog kami dan mulai belanja produk streetwear barbara.
            </p>
            <Link href="/shop" className="mt-8">
              <button className="font-bold uppercase tracking-[0.2em] text-xs py-4 px-8 border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black rounded-xl transition-all duration-300 cursor-pointer">
                Mulai Belanja
              </button>
            </Link>
          </div>
        ) : (
          <OrdersClient userId={userId} orders={orders} initialReviews={initialReviews} />
        )}
      </div>
    </div>
  );
}
