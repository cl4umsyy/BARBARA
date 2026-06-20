"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/stores/useCartStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Image from "next/image";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void;
    };
  }
}

const checkoutSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required"),
  phone: z.string().min(5, "Valid phone number is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(3, "Postal code is required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

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

export const CheckoutClient: React.FC<CheckoutClientProps> = ({
  initialAddress,
}) => {
  const router = useRouter();
  const { items, getCartTotal, getCartCount, clearCart } = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(""); // Progress label shown in button
  const [orderError, setOrderError] = useState("");

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddressList, setShowAddressList] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipientName: initialAddress?.recipientName || "",
      phone: initialAddress?.phone || "",
      street: initialAddress?.street || "",
      city: initialAddress?.city || "",
      province: initialAddress?.province || "",
      postalCode: initialAddress?.postalCode || "",
    },
  });

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("/api/addresses");
        if (!res.ok) throw new Error("Gagal memuat alamat");
        const data = await res.json();
        const addressList = data.addresses || [];
        setAddresses(addressList);

        if (addressList.length > 0) {
          // Select default or first
          const defaultAddr = addressList.find((addr: SavedAddress) => addr.isDefault) || addressList[0];
          setSelectedAddressId(defaultAddr.id);
          
          // Auto-fill form
          setValue("recipientName", defaultAddr.recipientName);
          setValue("phone", defaultAddr.phone);
          setValue("street", defaultAddr.addressDetail || defaultAddr.street);
          
          let cityVal = defaultAddr.city;
          if (defaultAddr.district && !defaultAddr.city.includes(defaultAddr.district)) {
            cityVal = `${defaultAddr.district} | ${defaultAddr.city}`;
          }
          setValue("city", cityVal);
          setValue("province", defaultAddr.province);
          setValue("postalCode", defaultAddr.postalCode);
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [setValue]);

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setValue("recipientName", addr.recipientName);
    setValue("phone", addr.phone);
    setValue("street", addr.addressDetail || addr.street);
    
    let cityVal = addr.city;
    if (addr.district && !addr.city.includes(addr.district)) {
      cityVal = `${addr.district} | ${addr.city}`;
    }
    setValue("city", cityVal);
    setValue("province", addr.province);
    setValue("postalCode", addr.postalCode);
  };

  const handleInputChange = () => {
    setSelectedAddressId(null);
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

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    setOrderError("");

    try {
      // ── STEP 1: Sync local Zustand cart → PostgreSQL database ─────────────
      // ROOT FIX: backend reads cart from DB, not from localStorage/Zustand.
      // We must sync first so the DB has the current items.
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
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
            // Redirect to confirmation so user can retry payment
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

        {/* Saved Addresses Section */}
        <div className="bg-brand-light/40 p-5 rounded-2xl border border-brand-light">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black">
                Pilih Alamat Pengiriman
              </h3>
              <p className="text-[11px] text-brand-gray mt-1">
                Pilih dari alamat profil untuk mempermudah pengisian formulir.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddressList(!showAddressList)}
                  className="text-[10px] font-black uppercase tracking-widest border-b-2 border-brand-black pb-0.5 hover:opacity-75 flex items-center gap-1 shrink-0"
                >
                  {showAddressList ? "Sembunyikan Alamat" : "Pilih Alamat"}
                  <svg
                    className={`w-2.5 h-2.5 transition-transform duration-250 ${showAddressList ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              <Link
                href="/profile"
                className="text-[10px] font-black uppercase tracking-widest border-b-2 border-brand-black pb-0.5 hover:opacity-75 shrink-0"
              >
                {addresses.length > 0 ? "Kelola Alamat" : "Tambah Alamat"}
              </Link>
            </div>
          </div>

          {isLoadingAddresses ? (
            <div className="flex items-center gap-2 py-4">
              <div className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-medium text-brand-gray">Memuat alamat Anda...</span>
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-brand-white p-5 rounded-xl border border-brand-light text-center py-6 mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-gray-light">
                Belum ada alamat tersimpan
              </p>
              <p className="text-[10px] text-brand-gray mt-1 mb-4">
                Tambahkan alamat pengiriman di profil Anda untuk memudahkan pengisian data checkout di masa mendatang.
              </p>
              <Link
                href="/profile"
                className="inline-block text-[10px] font-black uppercase tracking-widest bg-brand-black text-brand-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Tambah Alamat
              </Link>
            </div>
          ) : (
            showAddressList && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`cursor-pointer bg-brand-white p-4 rounded-xl transition-all relative flex flex-col justify-between min-h-[140px] select-none ${
                        isSelected
                          ? "border-2 border-brand-black shadow-sm ring-1 ring-brand-black"
                          : "border border-brand-light hover:border-brand-gray-light"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 pr-4">
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
            )
          )}
        </div>

        {orderError && (
          <div className="bg-red-50 text-red-500 p-4 border border-red-200 text-xs font-bold uppercase tracking-wider rounded-xl">
            {orderError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Input
            label="Recipient Name"
            placeholder="John Doe"
            error={errors.recipientName?.message}
            {...register("recipientName", { onChange: handleInputChange })}
            disabled={isSubmitting}
          />

          <Input
            label="Phone Number"
            placeholder="08123456789"
            error={errors.phone?.message}
            {...register("phone", { onChange: handleInputChange })}
            disabled={isSubmitting}
          />

          <Input
            label="Street Address"
            placeholder="Apartment, suite, unit, building, street, etc."
            error={errors.street?.message}
            {...register("street", { onChange: handleInputChange })}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="City"
              placeholder="Jakarta Selatan"
              error={errors.city?.message}
              {...register("city", { onChange: handleInputChange })}
              disabled={isSubmitting}
            />

            <Input
              label="Province"
              placeholder="DKI Jakarta"
              error={errors.province?.message}
              {...register("province", { onChange: handleInputChange })}
              disabled={isSubmitting}
            />

            <Input
              label="Postal Code"
              placeholder="12345"
              error={errors.postalCode?.message}
              {...register("postalCode", { onChange: handleInputChange })}
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-5 flex items-center justify-center gap-2"
              disabled={isSubmitting}
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
        </form>
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
