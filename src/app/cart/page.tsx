"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/stores/useCartStore";
import { QuantitySelector } from "@/components/cart/QuantitySelector";
import { Button } from "@/components/ui/Button";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, getCartTotal, getCartCount } = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Eliminate hydration mismatch warnings
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Stage 4 Logging: Displaying cart items
  useEffect(() => {
    if (isHydrated) {
      console.log(`[LOG][Stage 4] Displaying cart items. Total Item Count: ${getCartCount()}`);
      items.forEach((item) => {
        const calculatedTotal = item.price * item.quantity;
        console.log(` - Item: "${item.name}" | Size: "${item.size}" | Color: "${item.color}" | Qty: ${item.quantity} | Unit Price: ${item.price} | Total: ${calculatedTotal} (Math: ${item.price} * ${item.quantity} = ${calculatedTotal})`);
      });
    }
  }, [isHydrated, items, getCartCount]);

  if (!isHydrated) {
    return (
      <div className="w-full bg-brand-white flex-1 flex items-center justify-center py-32">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-bold text-brand-gray-light">
            Loading cart...
          </p>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const shippingCost = subtotal > 500000 || subtotal === 0 ? 0 : 35000; // Free shipping over 500k IDR
  const total = subtotal + shippingCost;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-brand-white flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 bg-brand-light flex items-center justify-center mb-6 border border-brand-light rounded-xl">
          <ShoppingBag className="w-6 h-6 text-brand-gray-light" />
        </div>
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-brand-black">
          Your Cart is Empty
        </h1>
        <p className="text-xs text-brand-gray mt-2 max-w-sm leading-relaxed">
          Browse our collections and discover new releases. Add contemporary unisex streetwear to your bag.
        </p>
        <Link href="/shop" className="mt-8">
          <Button variant="primary">Shop Collection</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-brand-white flex-1">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-16 flex flex-col gap-10">
        
        {/* Header */}
        <div className="border-b border-brand-light pb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
            Shopping Bag
          </p>
          <h1 className="text-2xl md:text-5xl font-black tracking-widest text-brand-black mt-1">
            CART ({getCartCount()})
          </h1>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Cart Items List (8 columns) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4 md:gap-6 border-b border-brand-light pb-6 items-start"
              >
                {/* Product Image */}
                <Link
                  href={`/shop/${item.slug || item.productId}`} // Use link to shop details
                  className="relative aspect-[3/4] w-24 md:w-32 bg-brand-light shrink-0 overflow-hidden border border-brand-light rounded-xl"
                >
                  <Image
                    src={item.imageUrl || "/images/placeholder.jpg"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Link
                      href={`/shop/${item.slug || item.productId}`}
                      className="text-sm font-bold uppercase tracking-wider text-brand-black hover:opacity-70 transition-opacity"
                    >
                      {item.name}
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-gray font-medium">
                      <span>Size: <strong className="text-brand-black">{item.size}</strong></span>
                      <span>Color: <strong className="text-brand-black">{item.color}</strong></span>
                    </div>
                    
                    {/* Price (Mobile only) */}
                    <span className="text-sm font-extrabold text-brand-black md:hidden mt-2">
                      {formatPrice(item.price)}
                    </span>

                    {/* Quantity Selector */}
                    <div className="mt-4">
                      <QuantitySelector
                        variantId={item.variantId}
                        quantity={item.quantity}
                        maxStock={item.maxStock}
                      />
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-between items-end md:items-end gap-4 shrink-0">
                    {/* Price (Desktop only) */}
                    <span className="hidden md:inline text-sm font-extrabold text-brand-black">
                      {formatPrice(item.price)}
                    </span>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="text-brand-gray hover:text-red-500 transition-colors p-1.5 cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden md:inline">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary (4 columns) */}
          <div className="lg:col-span-4 bg-brand-light p-6 md:p-8 flex flex-col gap-6 rounded-2xl border border-brand-light shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-black border-b border-brand-gray-light/20 pb-4">
              Order Summary
            </h3>

            <div className="flex flex-col gap-3 text-xs text-brand-gray border-b border-brand-gray-light/20 pb-4 font-bold">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-brand-black">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Estimate</span>
                <span className="text-brand-black">
                  {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-[10px] text-brand-gray-light font-medium leading-relaxed">
                  Beli {formatPrice(500000 - subtotal)} lagi untuk gratis biaya pengiriman.
                </p>
              )}
            </div>

            <div className="flex justify-between items-end">
              <span className="text-xs font-black uppercase tracking-widest text-brand-black">
                Total Price
              </span>
              <span className="text-lg font-black text-brand-black">
                {formatPrice(total)}
              </span>
            </div>

            <Link href="/checkout" className="w-full pt-4">
              <button className="w-full font-bold uppercase tracking-[0.2em] text-sm py-5 transition-all duration-300 ease-out rounded-xl border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black cursor-pointer flex items-center justify-center gap-2">
                Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>

            <Link href="/shop" className="text-center text-[10px] uppercase font-black tracking-widest text-brand-gray hover:text-brand-black transition-colors py-2 block">
              Continue Shopping
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
