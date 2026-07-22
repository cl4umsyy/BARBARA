"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, ArrowRight, Star, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { ReviewModal } from "./ReviewModal";

interface OrderItem {
  id: string;
  productId: string;
  productSlug?: string | null;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  imageUrl: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string | null;
  paymentStatus: string;
  createdAt: string;
  orderItems: OrderItem[];
}

interface Review {
  id: string;
  orderId: string;
  productId: string;
  rating: number;
  review: string;
  reviewImages: string[];
  createdAt: string;
}

interface OrdersClientProps {
  userId: string;
  orders: Order[];
  initialReviews: Review[];
}

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

export const OrdersClient: React.FC<OrdersClientProps> = ({ userId, orders, initialReviews }) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [selectedOrderItem, setSelectedOrderItem] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenReview = (orderId: string, orderItemId: string, productId: string, productName: string) => {
    const existing = reviews.find((r) => r.orderId === orderId && r.productId === productId) || null;
    setSelectedOrder(orderId);
    setSelectedOrderItem(orderItemId);
    setSelectedProduct(productId);
    setSelectedProductName(productName);
    setActiveReview(existing);
    setIsModalOpen(true);
  };

  const handleReviewSubmitSuccess = (savedReview: Review) => {
    setReviews((prev) => {
      const exists = prev.some((r) => r.orderId === savedReview.orderId && r.productId === savedReview.productId);
      if (exists) {
        return prev.map((r) => (r.orderId === savedReview.orderId && r.productId === savedReview.productId ? savedReview : r));
      } else {
        return [savedReview, ...prev];
      }
    });
    const isEdit = reviews.some((r) => r.orderId === savedReview.orderId && r.productId === savedReview.productId);
    showToast(isEdit ? "Ulasan produk berhasil diperbarui!" : "Terima kasih! Ulasan produk berhasil dikirim.");
  };

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-brand-black text-brand-white border border-brand-light/35 px-6 py-4 rounded-xl shadow-xl flex items-center gap-2 animate-slide-in">
          <p className="text-xs font-bold uppercase tracking-wider">{toast.message}</p>
        </div>
      )}

      {orders.map((order) => {
        const statusInfo = getStatusLabelAndStyle(order.status, order.paymentStatus);
        const isSelesai = order.status === "DELIVERED" || order.status === "COMPLETED";

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

            {/* Order Card Content (Lists each product separately) */}
            <div className="p-6 flex flex-col gap-6">
              {order.orderItems.map((item, idx) => {
                // Find review for this product
                const review = reviews.find((r) => r.orderId === order.id && r.productId === item.productId);

                return (
                  <div key={item.id} className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 last:pb-0 border-b border-brand-light/50 last:border-b-0`}>
                    <div className="flex items-start gap-4 flex-1">
                      {/* Product Thumbnail */}
                      <div className="relative w-20 h-20 overflow-hidden bg-brand-light border border-brand-light rounded-xl flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            sizes="80px"
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
                        <Link href={`/shop/${item.productSlug || item.productId}`} className="hover:opacity-75">
                          <h4 className="font-bold text-brand-black text-sm truncate leading-snug">
                            {item.productName}
                          </h4>
                        </Link>
                        <p className="text-[11px] text-brand-gray mt-1 font-medium">
                          Ukuran: <span className="font-bold text-brand-black uppercase">{item.size || "-"}</span>
                          <span className="mx-2">|</span>
                          Warna: <span className="font-bold text-brand-black capitalize">{item.color || "-"}</span>
                        </p>
                        <p className="text-[11px] text-brand-gray mt-1 font-medium">
                          {item.quantity} barang x {formatPrice(item.price)}
                        </p>

                        {/* Review Status Display */}
                        {isSelesai && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                            {review ? (
                              <>
                                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase tracking-wide">
                                  Sudah Diulas
                                </span>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < review.rating ? "fill-amber-400 text-amber-400" : "text-brand-light fill-brand-light/30"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-brand-gray-light font-medium">
                                  Diulas pada {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(review.createdAt))}
                                </span>
                              </>
                            ) : (
                              <span className="text-brand-gray-light bg-brand-light px-2 py-0.5 rounded border border-brand-light uppercase tracking-wide">
                                Belum Diulas
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Financial & Action */}
                    <div className="flex flex-row md:flex-col md:items-end justify-between w-full md:w-auto pt-4 md:pt-0 gap-4">
                      <div className="text-left md:text-right hidden md:block">
                        <p className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">
                          Subtotal Produk
                        </p>
                        <p className="font-black text-brand-black text-sm mt-0.5 tracking-wide">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>

                      {isSelesai && (
                        <button
                          onClick={() => handleOpenReview(order.id, item.id, item.productId, item.productName)}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider border-2 border-brand-black bg-brand-white text-brand-black hover:bg-brand-black hover:text-brand-white px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer"
                        >
                          {review ? "Edit Ulasan" : "Beri Ulasan"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Card Footer: Financial overview */}
            <div className="bg-[#fbfbfb] px-6 py-4 border-t border-brand-light flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-brand-gray-light uppercase">Total Belanja:</span>
                <span className="font-black text-brand-black text-sm tracking-wide">{formatPrice(order.total)}</span>
              </div>
              
              <Link href={`/orders/${order.id}`} className="flex-shrink-0">
                <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-brand-gray hover:text-brand-black transition-colors cursor-pointer">
                  Detail Pesanan
                  <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
          </div>
        );
      })}

      {/* Review Modal popup */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        orderId={selectedOrder}
        orderItemId={selectedOrderItem}
        productId={selectedProduct}
        productName={selectedProductName}
        existingReview={activeReview}
        onSubmitSuccess={handleReviewSubmitSuccess}
      />
    </div>
  );
};
