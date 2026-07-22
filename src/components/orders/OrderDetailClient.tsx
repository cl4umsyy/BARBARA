"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, CheckCircle2, Package, Truck, Calendar, MapPin, 
  CreditCard, Clock, ExternalLink, X, Star
} from "lucide-react";
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

interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
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
  midtransId: string | null;
  paymentType: string | null;
  paidAt: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  shippingAddress: ShippingAddress | null;
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

interface OrderDetailClientProps {
  userId: string;
  order: Order;
  initialReviews?: Review[];
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
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dateString));
};

// Mocks for tracking timeline
const getMockTrackingTimeline = (trackingNumber: string, status: string) => {
  const steps = [
    { time: "10:30", date: "Hari 1", desc: "Pesanan berhasil dibuat oleh pelanggan." },
    { time: "11:15", date: "Hari 1", desc: "Pembayaran telah berhasil diverifikasi oleh Midtrans." },
    { time: "14:00", date: "Hari 1", desc: "Pesanan sedang diproses oleh penjual." },
    { time: "17:30", date: "Hari 1", desc: "Pesanan telah dikemas dan disiapkan untuk pengiriman." },
  ];

  if (status === "SHIPPED" || status === "DELIVERED" || status === "COMPLETED") {
    steps.push(
      { time: "09:00", date: "Hari 2", desc: `Paket dengan resi ${trackingNumber} telah diserahkan ke Jasa Pengiriman.` },
      { time: "13:45", date: "Hari 2", desc: "Paket sedang dalam transit di gudang sortir Jakarta Pusat." },
      { time: "22:10", date: "Hari 2", desc: "Paket sedang dalam perjalanan ke hub kota tujuan." }
    );
  }

  if (status === "DELIVERED" || status === "COMPLETED") {
    steps.push(
      { time: "08:30", date: "Hari 3", desc: "Kurir sedang membawa paket menuju alamat pengiriman." },
      { time: "11:05", date: "Hari 3", desc: "Paket telah berhasil diterima oleh yang bersangkutan." }
    );
  }

  return steps.reverse();
};

export const OrderDetailClient: React.FC<OrderDetailClientProps> = ({ userId, order, initialReviews }) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedOrderItem, setSelectedOrderItem] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [activeReview, setActiveReview] = useState<Review | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenReview = (orderId: string, orderItemId: string, productId: string, productName: string) => {
    const existing = reviews.find((r) => r.orderId === orderId && r.productId === productId) || null;
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

  // Map DB status to step values:
  // 1: Paid, 2: Processing, 3: Packed, 4: Shipped, 5: Completed
  let activeStep = 0;
  if (order.paymentStatus === "PAID") {
    activeStep = 1; // Pembayaran Berhasil
    if (order.status === "PROCESSING") activeStep = 3; // Diproses + Dikemas
    if (order.status === "SHIPPED") activeStep = 4; // Dikirim
    if (order.status === "DELIVERED" || order.status === "COMPLETED") activeStep = 5; // Selesai
  }

  // Get status color styling
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
        return { label: "Diproses & Dikemas", classes: "bg-violet-50 text-violet-700 border-violet-200" };
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

  const statusInfo = getStatusLabelAndStyle(order.status, order.paymentStatus);

  // Estimasi Tanggal Tiba (3 days from createdAt)
  const deliveryEstimation = () => {
    const orderDate = new Date(order.createdAt);
    orderDate.setDate(orderDate.getDate() + 3);
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(orderDate);
  };

  // Courier mock (often saved in shipping_method, default to JNE)
  const courierName = order.shippingMethod || "barbara Express (JNE Reguler)";
  const trackingNumber = order.trackingNumber || "N/A";

  const isCancelled = order.status === "CANCELLED" || order.paymentStatus === "FAILED" || order.paymentStatus === "EXPIRED";

  return (
    <div className="flex flex-col gap-8">
      {/* Top action row */}
      <div className="flex items-center justify-between border-b border-brand-light pb-4">
        <Link 
          href="/profile?tab=orders" 
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-gray hover:text-brand-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Pesanan Saya
        </Link>
        <span className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg border ${statusInfo.classes}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Grid: Details (8 cols) + Info Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Details Panel */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Progress Tracker (Hide if cancelled) */}
          {!isCancelled && order.paymentStatus === "PAID" && (
            <div className="bg-[#fcfcfc] border border-brand-light p-6 md:p-8 rounded-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gray mb-6">
                Status Pengiriman
              </h3>
              
              {/* Tracker Steps Layout */}
              <div className="relative flex justify-between items-center w-full mt-4">
                {/* Horizontal bar line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-brand-light -translate-y-1/2 z-0" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-brand-black -translate-y-1/2 z-0 transition-all duration-500 ease-out" 
                  style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
                />

                {/* Steps */}
                {[
                  { step: 1, label: "Pembayaran", icon: CheckCircle2 },
                  { step: 2, label: "Diproses", icon: Clock },
                  { step: 3, label: "Dikemas", icon: Package },
                  { step: 4, label: "Dikirim", icon: Truck },
                  { step: 5, label: "Selesai", icon: CheckCircle2 }
                ].map((item) => {
                  const Icon = item.icon;
                  const isPassed = activeStep >= item.step;
                  const isCurrent = activeStep === item.step;

                  return (
                    <div key={item.step} className="flex flex-col items-center z-10 gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isPassed 
                          ? "bg-brand-black border-brand-black text-brand-white" 
                          : "bg-brand-white border-brand-light text-brand-gray-light"
                      } ${isCurrent ? "ring-4 ring-brand-light" : ""}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider hidden sm:block ${
                        isPassed ? "text-brand-black" : "text-brand-gray-light"
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile text labels */}
              <div className="flex justify-between mt-3 text-[9px] font-black uppercase tracking-widest text-brand-gray-light sm:hidden px-1">
                <span>Bayar</span>
                <span>Proses</span>
                <span>Kemas</span>
                <span>Kirim</span>
                <span>Selesai</span>
              </div>
            </div>
          )}

          {/* Courier details (When Shipped) */}
          {(order.status === "SHIPPED" || order.status === "DELIVERED" || order.status === "COMPLETED") && order.trackingNumber && (
            <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-700">
                  Pesanan Telah Dikirim
                </p>
                <h4 className="text-sm font-bold text-brand-black">
                  Ekspedisi: <span className="text-indigo-900">{courierName}</span>
                </h4>
                <p className="text-xs text-brand-gray">
                  Nomor Resi: <span className="font-mono font-bold text-brand-black">{trackingNumber}</span>
                </p>
              </div>
              <button
                onClick={() => setIsTrackingOpen(true)}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Lacak Pengiriman
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Order Items List */}
          <div className="border border-brand-light rounded-2xl p-6 flex flex-col gap-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-black border-b border-brand-light pb-4">
              Rincian Produk
            </h3>

            <div className="flex flex-col gap-6">
              {order.orderItems.map((item) => {
                const review = reviews.find((r) => r.productId === item.productId);
                const isSelesai = order.status === "DELIVERED" || order.status === "COMPLETED";

                return (
                  <div key={item.id} className="flex gap-4 items-start border-b border-brand-light/50 last:border-b-0 pb-6 last:pb-0">
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
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-brand-gray-light" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${item.productSlug || item.productId}`} className="hover:opacity-75">
                        <h4 className="font-bold text-brand-black text-sm leading-snug">
                          {item.productName}
                        </h4>
                      </Link>
                      <p className="text-xs text-brand-gray mt-1 font-medium">
                        Ukuran: <span className="font-bold text-brand-black uppercase">{item.size}</span>
                        <span className="mx-2">|</span>
                        Warna: <span className="font-bold text-brand-black capitalize">{item.color}</span>
                      </p>
                      <p className="text-xs text-brand-gray mt-1">
                        {item.quantity} x {formatPrice(item.price)}
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
                                    className={`w-3 h-3 ${
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

                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <p className="font-bold text-brand-black text-sm tracking-wide">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {isSelesai && (
                        <button
                          onClick={() => handleOpenReview(order.id, item.id, item.productId, item.productName)}
                          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider border border-brand-black bg-brand-white text-brand-black hover:bg-brand-black hover:text-brand-white px-3.5 py-2 rounded-lg transition-all duration-300 cursor-pointer"
                        >
                          {review ? "Edit Ulasan" : "Beri Ulasan"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Info Panels (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Metadata Panel */}
          <div className="border border-brand-light p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-black border-b border-brand-light pb-3">
              Informasi Pesanan
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">No. Pesanan</p>
                <p className="font-black text-brand-black mt-0.5 tracking-wide">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">Waktu Transaksi</p>
                <p className="font-medium text-brand-gray mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">Estimasi Tiba</p>
                <p className="font-bold text-brand-black mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-gray-light" />
                  {deliveryEstimation()}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-brand-gray-light font-bold">Metode Pembayaran</p>
                <p className="font-bold text-brand-black mt-0.5 uppercase flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-brand-gray-light" />
                  {order.paymentMethod || "Midtrans"} {order.paymentType ? `(${order.paymentType})` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Address Panel */}
          {order.shippingAddress && (
            <div className="border border-brand-light p-6 rounded-2xl flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-black border-b border-brand-light pb-3">
                Alamat Pengiriman
              </h3>

              <div className="text-xs space-y-2">
                <p className="font-black text-brand-black flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-gray-light" />
                  {order.shippingAddress.recipientName}
                </p>
                <p className="text-brand-gray font-medium">
                  {order.shippingAddress.phone}
                </p>
                <p className="text-brand-gray font-medium leading-relaxed">
                  {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.province}, {order.shippingAddress.postalCode}
                </p>
              </div>
            </div>
          )}

          {/* Cost Summary Panel */}
          <div className="border border-brand-light p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-black border-b border-brand-light pb-3">
              Ringkasan Pembayaran
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-brand-gray">
                <span>Subtotal</span>
                <span className="font-bold text-brand-black">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-gray">
                <span>Biaya Pengiriman</span>
                <span className="font-bold text-brand-black">
                  {order.shippingCost === 0 ? "Gratis" : formatPrice(order.shippingCost)}
                </span>
              </div>
              
              <div className="border-t border-brand-light pt-3 flex justify-between items-end font-bold">
                <span className="text-[10px] uppercase tracking-widest text-brand-black">Total Bayar</span>
                <span className="text-base text-brand-black tracking-wide font-black">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Custom Tracking Timeline Modal */}
      {isTrackingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/40 backdrop-blur-sm">
          <div className="bg-brand-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-brand-light max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light bg-[#fbfbfb]">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black uppercase tracking-wider text-brand-black">
                  Lacak Pengiriman
                </h3>
                <p className="text-[10px] text-brand-gray">
                  Resi: <span className="font-mono font-bold text-brand-black">{trackingNumber}</span>
                </p>
              </div>
              <button 
                onClick={() => setIsTrackingOpen(false)}
                className="p-1 rounded-full text-brand-gray hover:text-brand-black hover:bg-brand-light transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable Timeline */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100/50 p-4 rounded-xl text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-indigo-900">Kurir Pengiriman</p>
                  <p className="text-brand-gray font-medium">{courierName}</p>
                </div>
                <a 
                  href={`https://cekresi.com/?noresi=${trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-black uppercase tracking-wider text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  CekResi.com
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Timeline Track */}
              <div className="relative border-l-2 border-brand-light pl-6 ml-3 space-y-6">
                {getMockTrackingTimeline(trackingNumber, order.status).map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle marker */}
                    <div className={`absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border-2 bg-brand-white flex items-center justify-center ${
                      idx === 0 
                        ? "border-brand-black scale-110 shadow" 
                        : "border-brand-light"
                    }`}>
                      {idx === 0 && <div className="w-1.5 h-1.5 rounded-full bg-brand-black" />}
                    </div>

                    <div className="text-xs">
                      <p className={`font-bold ${idx === 0 ? "text-brand-black" : "text-brand-gray"}`}>
                        {step.desc}
                      </p>
                      <p className="text-[10px] text-brand-gray-light font-medium mt-1">
                        {step.date} pukul {step.time} WIB
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-brand-light bg-[#fbfbfb] flex justify-end">
              <button
                onClick={() => setIsTrackingOpen(false)}
                className="font-bold uppercase tracking-wider text-xs px-5 py-3 border border-brand-black hover:bg-brand-black hover:text-brand-white rounded-xl transition-all duration-300 cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Review Modal popup */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        orderId={order.id}
        orderItemId={selectedOrderItem}
        productId={selectedProduct}
        productName={selectedProductName}
        existingReview={activeReview}
        onSubmitSuccess={handleReviewSubmitSuccess}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-brand-black text-brand-white border border-brand-light/35 px-6 py-4 rounded-xl shadow-xl flex items-center gap-2 animate-slide-in">
          <p className="text-xs font-bold uppercase tracking-wider">{toast.message}</p>
        </div>
      )}

    </div>
  );
};
