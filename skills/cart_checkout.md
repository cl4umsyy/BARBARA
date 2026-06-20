# 🛠️ Skills: Cart & Zustand State (BARBARA E-Commerce)

Panduan ini berisi cara membuat keranjang belanja (Shopping Cart) menggunakan Zustand state manager yang terintegrasi dengan LocalStorage untuk persistensi sisi client, serta sinkronisasi data ke database saat login.

---

## 1. Zustand Cart Store (`src/stores/useCartStore.ts`)
Gunakan Zustand dengan middleware `persist` agar keranjang belanja aman dari refresh halaman dan langsung terisi kembali dari LocalStorage.

### Implementasi:
```typescript
// src/stores/useCartStore.ts
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
      name: 'barbara-cart-storage', // key unik untuk LocalStorage
    }
  )
);
```

---

## 2. Quantity Selector Component (`src/components/cart/QuantitySelector.tsx`)
Buat selector kuantitas barang yang aman untuk membatasi order agar tidak melebihi stok yang ada.

### Implementasi:
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

---

## 3. Order Placement & State Syncing
- **Auth Trigger**: Saat user berhasil login, sinkronisasikan `items` dari LocalStorage ke database PostgreSQL melalui endpoint POST `/api/cart/sync`.
- **Checkout Process**:
  1. Validasi stok setiap produk yang berada di cart sekali lagi di tingkat backend sebelum melanjutkan transaksi.
  2. Kosongkan keranjang belanja (`clearCart()`) di state manager hanya jika transaksi Midtrans berhasil terinisiasi dengan status `PENDING` atau `PAID`.
