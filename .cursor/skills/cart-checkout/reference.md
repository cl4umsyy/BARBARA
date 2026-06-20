# Cart & Checkout Reference

## 1. Zustand Store (`src/stores/useCartStore.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  size: string;
  color: string;
  price: number;
  imageUrl: string;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, qty: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem, qty = 1) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.variantId === newItem.variantId);

        if (existingItem) {
          const updatedQty = Math.min(existingItem.quantity + qty, newItem.maxStock);
          set({
            items: currentItems.map((item) =>
              item.variantId === newItem.variantId
                ? { ...item, quantity: updatedQty }
                : item
            ),
          });
        } else {
          set({ items: [...currentItems, { ...newItem, quantity: Math.min(qty, newItem.maxStock) }] });
        }
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter((item) => item.variantId !== variantId),
        });
      },

      updateQuantity: (variantId, qty) => {
        const currentItems = get().items;
        const targetItem = currentItems.find((item) => item.variantId === variantId);
        if (!targetItem) return;

        const updatedQty = Math.max(1, Math.min(qty, targetItem.maxStock));
        set({
          items: currentItems.map((item) =>
            item.variantId === variantId ? { ...item, quantity: updatedQty } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getCartTotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },

      getCartCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: 'barbara-cart-storage',
    }
  )
);
```

## 2. QuantitySelector (`src/components/cart/QuantitySelector.tsx`)

```tsx
import React from 'react';
import { useCartStore } from '@/stores/useCartStore';

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
    <div className="flex items-center border border-black max-w-fit select-none">
      <button
        onClick={() => updateQuantity(variantId, quantity - 1)}
        className="px-4 py-2 hover:bg-brand-black hover:text-brand-white transition-colors cursor-pointer text-sm"
        disabled={quantity <= 1}
      >
        -
      </button>
      <span className="px-6 py-2 text-sm font-bold">{quantity}</span>
      <button
        onClick={() => updateQuantity(variantId, quantity + 1)}
        className="px-4 py-2 hover:bg-brand-black hover:text-brand-white transition-colors cursor-pointer text-sm"
        disabled={quantity >= maxStock}
      >
        +
      </button>
    </div>
  );
};
```
