"use client";

import React from "react";
import { useCartStore } from "@/stores/useCartStore";

interface QuantitySelectorProps {
  variantId: string;
  quantity: number;
  maxStock: number;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  variantId,
  quantity,
  maxStock,
}) => {
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  return (
    <div className="flex items-center border border-brand-black/20 rounded-xl overflow-hidden max-w-fit select-none bg-white">
      <button
        type="button"
        onClick={() => updateQuantity(variantId, quantity - 1)}
        className="px-4 py-2 hover:bg-brand-black hover:text-brand-white transition-colors cursor-pointer text-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-black disabled:cursor-not-allowed"
        disabled={quantity <= 1}
      >
        -
      </button>
      <span className="px-6 py-2 text-sm font-bold text-brand-black">{quantity}</span>
      <button
        type="button"
        onClick={() => updateQuantity(variantId, quantity + 1)}
        className="px-4 py-2 hover:bg-brand-black hover:text-brand-white transition-colors cursor-pointer text-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-brand-black disabled:cursor-not-allowed"
        disabled={quantity >= maxStock}
      >
        +
      </button>
    </div>
  );
};
