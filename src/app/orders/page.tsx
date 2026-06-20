import React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Package, ArrowRight } from "lucide-react";

export const revalidate = 0; // Disable caching to fetch live order data

const formatPrice = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

// Map DB status to Indonesian labels and premium badge colors
const getStatusLabelAndStyle = (status: string, paymentStatus: string) => {
  if (status === "CANCELLED" || status === "EXPIRED" || status === "FAILED" || paymentStatus === "FAILED" || paymentStatus === "EXPIRED") {
    return { label: "Dibatalkan", classes: "bg-red-50 text-red-700 border-red-200" };
  }
  if (paymentStatus === "PENDING") {
    return { label: "Menunggu Pembayaran", classes: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (paymentStatus === "PAID") {
    if (status === "PENDING") {
      return { label: "Pembayaran Berhasil", classes: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (status === "PROCESSING") {
      return { label: "Diproses", classes: "bg-violet-50 text-violet-700 border-violet-200" };
    }
    if (status === "SHIPPED") {
      return { label: "Dikirim", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    }
    if (status === "DELIVERED" || status === "COMPLETED") {
      return { label: "Selesai", classes: "bg-green-50 text-green-700 border-green-200" };
    }
  }
  return { label: "Menunggu Pembayaran", classes: "bg-amber-50 text-amber-700 border-amber-200" };
};

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
          product:products (
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

  const orders = (dbOrders || []).map((o: any) => {
    const orderItems = (o.order_items || []).map((item: any) => {
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
          <div className="flex flex-col gap-8">
            {orders.map((order) => {
              const statusInfo = getStatusLabelAndStyle(order.status, order.paymentStatus);
              const totalItems = order.orderItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
              const firstItem = order.orderItems[0];

              return (
                <div 
                  key={order.id} 
                  className="bg-brand-white border border-brand-light rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-wrap justify-between items-center bg-[#fbfbfb] px-6 py-4 border-b border-brand-light gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-xs">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">
                          Nomor Pesanan
                        </p>
                        <p className="font-black text-brand-black tracking-wide mt-0.5">
                          {order.orderNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">
                          Tanggal Pemesanan
                        </p>
                        <p className="font-medium text-brand-black mt-0.5">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border ${statusInfo.classes}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Order Card Content */}
                  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Product Thumbnail */}
                      <div className="relative w-20 h-20 overflow-hidden bg-brand-light border border-brand-light rounded-xl flex-shrink-0">
                        {firstItem?.imageUrl ? (
                          <Image
                            src={firstItem.imageUrl}
                            alt={firstItem.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand-light">
                            <Package className="w-5 h-5 text-brand-gray-light" />
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-brand-black text-sm truncate leading-snug">
                          {firstItem?.productName || "Produk barbara"}
                        </h4>
                        <p className="text-[11px] text-brand-gray mt-1 font-medium">
                          Ukuran: <span className="font-bold text-brand-black uppercase">{firstItem?.size || "-"}</span>
                          <span className="mx-2">|</span>
                          Warna: <span className="font-bold text-brand-black capitalize">{firstItem?.color || "-"}</span>
                        </p>
                        <p className="text-[11px] text-brand-gray mt-1 font-medium">
                          {firstItem?.quantity} barang x {formatPrice(firstItem?.price || 0)}
                        </p>

                        {totalItems > 1 && (
                          <p className="text-[10px] font-bold text-brand-gray-light uppercase mt-2 tracking-wider">
                            + {totalItems - 1} produk lainnya
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Financial & Action */}
                    <div className="flex flex-row md:flex-col md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-brand-light pt-4 md:pt-0 gap-4">
                      <div className="text-left md:text-right">
                        <p className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">
                          Total Belanja
                        </p>
                        <p className="font-black text-brand-black text-base mt-0.5 tracking-wide">
                          {formatPrice(order.total)}
                        </p>
                      </div>

                      <Link href={`/orders/${order.id}`} className="flex-shrink-0">
                        <button className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider border-2 border-brand-black bg-brand-white text-brand-black hover:bg-brand-black hover:text-brand-white px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer">
                          Detail Pesanan
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
