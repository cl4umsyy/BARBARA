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

export const CheckoutClient: React.FC<CheckoutClientProps> = ({
  initialAddress,
}) => {
  const router = useRouter();
  const { items, getCartTotal, getCartCount, clearCart } = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(""); // Progress label shown in button
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    register,
    handleSubmit,
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
            {...register("recipientName")}
            disabled={isSubmitting}
          />

          <Input
            label="Phone Number"
            placeholder="08123456789"
            error={errors.phone?.message}
            {...register("phone")}
            disabled={isSubmitting}
          />

          <Input
            label="Street Address"
            placeholder="Apartment, suite, unit, building, street, etc."
            error={errors.street?.message}
            {...register("street")}
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="City"
              placeholder="Jakarta Selatan"
              error={errors.city?.message}
              {...register("city")}
              disabled={isSubmitting}
            />

            <Input
              label="Province"
              placeholder="DKI Jakarta"
              error={errors.province?.message}
              {...register("province")}
              disabled={isSubmitting}
            />

            <Input
              label="Postal Code"
              placeholder="12345"
              error={errors.postalCode?.message}
              {...register("postalCode")}
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
