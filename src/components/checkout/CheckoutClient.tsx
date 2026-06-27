"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
 
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void;
    };
  }
}
 
interface CheckoutClientProps {
  initialAddress?: {
    recipientName: string;
    phone: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
  } | null;
}
 
interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  district: string;
  postalCode: string;
  addressDetail: string;
  isDefault: boolean;
  createdAt: string;
}
 
export const CheckoutClient: React.FC<CheckoutClientProps> = () => {
  const router = useRouter();
  const { items, getCartTotal, getCartCount, clearCart } = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(""); // Progress label shown in button
  const [orderError, setOrderError] = useState("");
 
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddressList, setShowAddressList] = useState(false);
 
  useEffect(() => {
    setIsHydrated(true);
  }, []);
 
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("/api/addresses", { cache: "no-store" });
        if (!res.ok) throw new Error("Gagal memuat alamat");
        const data = await res.json();
        const addressList = data.addresses || [];
        setAddresses(addressList);
 
        if (addressList.length > 0) {
          // Select default or first
          const defaultAddr = addressList.find((addr: SavedAddress) => addr.isDefault) || addressList[0];
          setSelectedAddressId(defaultAddr.id);
          setSelectedAddress(defaultAddr);
          setShowAddressList(false); // Default collapse to show summary card
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
 
    fetchAddresses();
  }, []);
 
  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setSelectedAddress(addr);
    setShowAddressList(false); // Auto collapse on select
  };
 
  if (!isHydrated) {
    return (
      <div className="w-full flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
 
  if (items.length === 0) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-gray-light">
          No items to checkout.
        </p>
        <Link
          href="/shop"
          className="text-xs font-bold uppercase tracking-widest border-b-2 border-brand-black pb-1 hover:opacity-75"
        >
          Go To Shop
        </Link>
      </div>
    );
  }
 
  const subtotal = getCartTotal();
  const shippingCost = subtotal > 500000 ? 0 : 35000;
  const total = subtotal + shippingCost;
 
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };
 
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setOrderError("Silakan pilih alamat pengiriman terlebih dahulu.");
      return;
    }
 
    setIsSubmitting(true);
    setOrderError("");
 
    try {
      // ── STEP 1: Sync local Zustand cart → PostgreSQL database ─────────────
      setSubmitStep("Menyinkronkan keranjang...");
      const syncPayload = items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));
 
      const syncRes = await fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload),
      });
 
      if (!syncRes.ok) {
        const syncErr = await syncRes.json().catch(() => ({}));
        throw new Error(syncErr.error || "Gagal menyinkronkan keranjang belanja.");
      }
 
      console.log("[Checkout] ✅ Cart synced to DB.");
 
      // ── STEP 2: Create order + deduct stock ───────────────────────────────
      setSubmitStep("Membuat pesanan...");
      const orderPayload = {
        addressId: selectedAddress.id,
        recipientName: selectedAddress.recipientName,
        phone: selectedAddress.phone,
        street: selectedAddress.addressDetail || selectedAddress.street,
        city: selectedAddress.district && !selectedAddress.city.includes(selectedAddress.district)
          ? `${selectedAddress.district} | ${selectedAddress.city}`
          : selectedAddress.city,
        province: selectedAddress.province,
        postalCode: selectedAddress.postalCode,
      };
 
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
 
      const orderResult = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderResult.error || "Failed to place order.");
      }
 
      const { orderId } = orderResult;
      console.log("[Checkout] ✅ Order created:", orderId);
 
      // ── STEP 3: Get Midtrans Snap token ───────────────────────────────────
      setSubmitStep("Mempersiapkan pembayaran...");
      const snapRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
 
      const snapResult = await snapRes.json();
      if (!snapRes.ok) {
        throw new Error(snapResult.error || "Failed to generate payment token.");
      }
 
      const snapToken = snapResult.token;
      console.log("[Checkout] ✅ Snap token received. Opening popup...");
 
      // ── STEP 4: Open Midtrans Snap popup ──────────────────────────────────
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            clearCart();
            router.push(`/checkout/confirmation?orderId=${orderId}`);
          },
          onPending: () => {
            clearCart();
            router.push(`/checkout/confirmation?orderId=${orderId}`);
          },
          onError: () => {
            alert("Pembayaran gagal. Silakan bayar dari halaman konfirmasi.");
            clearCart();
            router.push(`/checkout/confirmation?orderId=${orderId}`);
          },
          onClose: () => {
            clearCart();
            router.push(`/checkout/confirmation?orderId=${orderId}`);
          },
        });
      } else {
        throw new Error("Midtrans SDK gagal dimuat. Coba refresh halaman.");
      }
    } catch (err: any) {
      console.error("[Checkout] ❌ Error:", err.message);
      setOrderError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
      setSubmitStep("");
    }
  };
 
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      {/* Shipping details form (7 columns) */}
      <div className="lg:col-span-7 flex flex-col gap-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-brand-black border-b border-brand-light pb-4">
          Shipping Address
        </h2>
 
        {isLoadingAddresses ? (
          <div className="flex items-center gap-2 py-4">
            <div className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-medium text-brand-gray">Memuat alamat Anda...</span>
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-brand-white p-8 rounded-2xl border border-brand-light/65 text-center py-10 flex flex-col items-center justify-center">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-gray-light">
              Anda belum memiliki alamat pengiriman.
            </p>
            <p className="text-xs text-brand-gray mt-2 mb-6 max-w-sm leading-relaxed">
              Silakan tambahkan alamat pengiriman di profil Anda terlebih dahulu untuk dapat memproses checkout.
            </p>
            <Link
              href="/profile?tab=addresses"
              className="inline-block text-xs font-black uppercase tracking-widest bg-brand-black text-brand-white px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Tambah Alamat
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Header / Toggle Row */}
            <div className="flex items-center justify-between gap-4 bg-[#fbfbfb] px-5 py-4 rounded-xl border border-brand-light/65">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-black">
                  {showAddressList ? "Buku Alamat Pengiriman" : "Alamat Terpilih"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressList(!showAddressList)}
                className="text-[10px] font-black uppercase tracking-widest border-b-2 border-brand-black pb-0.5 hover:opacity-75 flex items-center gap-1 cursor-pointer shrink-0"
              >
                {showAddressList ? "Kembali ke Ringkasan" : "Ubah Alamat"}
                <svg
                  className={`w-2.5 h-2.5 transition-transform duration-250 ${showAddressList ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
 
            {/* List Selection Grid */}
            {showAddressList ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`cursor-pointer bg-brand-white p-5 rounded-2xl transition-all relative flex flex-col justify-between min-h-[160px] select-none ${
                        isSelected
                          ? "border-2 border-brand-black shadow-sm ring-1 ring-brand-black"
                          : "border border-brand-light hover:border-brand-gray-light"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 pr-6">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-brand-light px-2 py-0.5 rounded text-brand-black">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-black text-brand-white px-1.5 py-0.5 rounded">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-black text-brand-black truncate">
                          {addr.recipientName}
                        </p>
                        <p className="text-[11px] text-brand-gray-light font-bold mt-0.5">
                          {addr.phone}
                        </p>
                        <p className="text-[11px] text-brand-gray font-medium mt-2 line-clamp-2 leading-relaxed">
                          {addr.addressDetail || addr.street}
                        </p>
                      </div>
                      <div className="text-[10px] text-brand-gray-light font-bold mt-2 pt-2 border-t border-brand-light">
                        {addr.district ? `${addr.district}, ` : ""}{addr.city}, {addr.province} {addr.postalCode}
                      </div>
 
                      {isSelected && (
                        <div className="absolute top-3.5 right-3 bg-brand-black text-brand-white rounded-full p-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Selected summary card */
              selectedAddress && (
                <div className="bg-brand-white p-6 rounded-2xl border border-brand-light/80 shadow-sm relative flex flex-col justify-between select-none animate-fade-in">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-brand-light px-2.5 py-1 rounded text-brand-black">
                        {selectedAddress.label}
                      </span>
                      {selectedAddress.isDefault && (
                        <span className="text-[8px] font-black uppercase tracking-widest bg-black text-brand-white px-2 py-0.5 rounded">
                          Utama
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-black text-brand-black uppercase tracking-wide">
                      {selectedAddress.recipientName}
                    </p>
                    <p className="text-[11px] text-brand-gray-light font-bold mt-1">
                      {selectedAddress.phone}
                    </p>
                    <p className="text-[11px] text-brand-gray font-medium mt-3 leading-relaxed">
                      {selectedAddress.addressDetail || selectedAddress.street}
                    </p>
                    <p className="text-[11px] text-brand-gray-light font-bold mt-2 pt-2 border-t border-brand-light">
                      {selectedAddress.district ? `${selectedAddress.district}, ` : ""}{selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
 
        {orderError && (
          <div className="bg-red-50 text-red-500 p-4 border border-red-200 text-xs font-bold uppercase tracking-wider rounded-xl">
            {orderError}
          </div>
        )}
 
        {/* Place Order CTA Section */}
        {addresses.length > 0 && (
          <div className="pt-2">
            <Button
              onClick={handlePlaceOrder}
              variant="primary"
              className="w-full py-5 flex items-center justify-center gap-2"
              disabled={isSubmitting || !selectedAddress}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-white border-t-transparent rounded-full animate-spin" />
                  {submitStep || "Processing..."}
                </>
              ) : (
                "Place Order & Pay"
              )}
            </Button>
          </div>
        )}
      </div>
 
      {/* Order Summary sidebar (5 columns) */}
      <div className="lg:col-span-5 bg-brand-light p-6 md:p-8 flex flex-col gap-6 rounded-2xl border border-brand-light shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-brand-black border-b border-brand-gray-light/20 pb-4">
          Order Summary ({getCartCount()})
        </h3>
 
        <div className="flex flex-col gap-4 max-h-80 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 items-center">
              <div className="relative aspect-[3/4] w-14 bg-brand-white shrink-0 overflow-hidden border border-brand-light rounded-lg">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-black truncate">
                  {item.name}
                </p>
                <p className="text-[10px] text-brand-gray font-medium mt-0.5">
                  Size: {item.size} | Qty: {item.quantity}
                </p>
              </div>
              <span className="text-xs font-bold text-brand-black shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
 
        <div className="border-t border-brand-gray-light/20 pt-4 flex flex-col gap-3 text-xs text-brand-gray font-bold">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-brand-black">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-brand-black">
              {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
            </span>
          </div>
        </div>
 
        <div className="border-t border-brand-gray-light/20 pt-4 flex justify-between items-end">
          <span className="text-xs font-black uppercase tracking-widest text-brand-black">
            Total Price
          </span>
          <span className="text-lg font-black text-brand-black">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  );
};
