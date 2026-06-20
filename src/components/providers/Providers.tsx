"use client";

import React, { useEffect } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useCartStore, CartItem } from "@/stores/useCartStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthModalListener } from "@/components/auth/AuthModalListener";

function CartSync() {
  const { data: session, status } = useSession();
  const { items, setItems } = useCartStore();
  const [isInitialSynced, setIsInitialSynced] = React.useState(false);

  // Helper to compare cart structures and prevent state update loops
  const isSameCart = (a: CartItem[], b: CartItem[]) => {
    if (a.length !== b.length) return false;
    return a.every((item) => {
      const match = b.find((x) => x.variantId === item.variantId);
      return match && match.quantity === item.quantity;
    });
  };

  useEffect(() => {
    // Reset sync flag if user logs out
    if (status === "unauthenticated") {
      setIsInitialSynced(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const syncCart = async () => {
        try {
          if (!isInitialSynced) {
            // ── A. INITIAL MOUNT / LOGIN SYNC: Fetch DB cart and merge with local cart ──
            const getRes = await fetch("/api/cart/sync", { method: "GET" });
            if (getRes.status === 401) {
              await signOut({ redirect: false });
              return;
            }

            if (!getRes.ok) {
              console.error("Failed to fetch database cart on initial load");
              return;
            }

            const getData = await getRes.json();
            const dbItems: CartItem[] = Array.isArray(getData.items) ? getData.items : [];

            // Merge logic: use Math.max to prevent looping/doubling of existing items
            let hasChanges = false;
            const mergedItems: CartItem[] = [...dbItems];

            for (const localItem of items) {
              const matchedDbItem = mergedItems.find(
                (item) => item.variantId === localItem.variantId
              );

              if (matchedDbItem) {
                if (localItem.quantity > matchedDbItem.quantity) {
                  matchedDbItem.quantity = Math.min(localItem.quantity, matchedDbItem.maxStock);
                  hasChanges = true;
                }
              } else {
                mergedItems.push({
                  ...localItem,
                  quantity: Math.min(localItem.quantity, localItem.maxStock),
                });
                hasChanges = true;
              }
            }

            if (hasChanges) {
              // Save merged guest cart to DB
              const postRes = await fetch("/api/cart/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                  mergedItems.map((item) => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                  }))
                ),
              });

              if (postRes.ok) {
                const postData = await postRes.json();
                if (postData && Array.isArray(postData.items)) {
                  setItems(postData.items);
                }
              }
            } else if (!isSameCart(items, dbItems)) {
              // No DB changes, but local state must match DB cart (e.g. page refresh)
              setItems(dbItems);
            }

            setIsInitialSynced(true);
          } else {
            // ── B. SUBSEQUENT UPDATES: Overwrite server cart with current local cart ──
            const postRes = await fetch("/api/cart/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                items.map((item) => ({
                  variantId: item.variantId,
                  quantity: item.quantity,
                }))
              ),
            });

            if (postRes.ok) {
              const postData = await postRes.json();
              if (postData && Array.isArray(postData.items)) {
                // Avoid infinite state-trigger loop by checking equality first
                if (!isSameCart(items, postData.items)) {
                  setItems(postData.items);
                }
              }
            }
          }
        } catch (error) {
          console.error("Cart synchronization error:", error);
        }
      };

      syncCart();
    }
  }, [status, session, items, isInitialSynced, setItems]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartSync />
      <AuthModalListener />
      <AuthModal />
      {children}
    </SessionProvider>
  );
}
