import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  addItem: (newItem: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, qty: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem, qty = 1) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(
          (item) => item.variantId === newItem.variantId
        );

        if (existingItem) {
          const updatedQty = Math.min(
            existingItem.quantity + qty,
            newItem.maxStock
          );
          set({
            items: currentItems.map((item) =>
              item.variantId === newItem.variantId
                ? { ...item, quantity: updatedQty }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...currentItems,
              { ...newItem, quantity: Math.min(qty, newItem.maxStock) },
            ],
          });
        }
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter((item) => item.variantId !== variantId),
        });
      },

      updateQuantity: (variantId, qty) => {
        const currentItems = get().items;
        const targetItem = currentItems.find(
          (item) => item.variantId === variantId
        );
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
        return get().items.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );
      },

      getCartCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      setItems: (items) => set({ items }),
    }),
    {
      name: "barbara-cart-storage", // local storage key
    }
  )
);
