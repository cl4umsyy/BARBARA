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
  const initialSyncPromiseRef = React.useRef<Promise<void> | null>(null);

  // Helper to compare cart structures and prevent state update loops
  const isSameCart = (a: CartItem[], b: CartItem[]) => {
    if (a.length !== b.length) return false;
    return a.every((item) => {
      const match = b.find((x) => x.variantId === item.variantId);
      return match && match.quantity === item.quantity;
    });
  };

  const prevStatusRef = React.useRef(status);

  useEffect(() => {
    // Reset sync flag if user logs out
    if (status === "unauthenticated") {
      setIsInitialSynced(false);
      initialSyncPromiseRef.current = null;

      if (prevStatusRef.current === "authenticated") {
        console.log("[LOG][CartSync] User logged out. Clearing local cart...");
        useCartStore.getState().clearCart();
      }
    }
    prevStatusRef.current = status;
  }, [status]);

  // 1. Initial login/mount sync: runs EXACTLY once when user is authenticated
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    if (!isInitialSynced && !initialSyncPromiseRef.current) {
      const runInitialSync = async () => {
        try {
          console.log("[LOG][CartSync] Starting initial DB cart sync...");
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

          // Merge logic
          const currentLocalItems = useCartStore.getState().items;
          let hasChanges = false;
          const mergedItems: CartItem[] = [...dbItems];

          for (const localItem of currentLocalItems) {
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
            console.log("[LOG][CartSync] Local guest cart has additional items. Syncing merged cart to DB...");
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
          } else if (!isSameCart(currentLocalItems, dbItems)) {
            console.log("[LOG][CartSync] Overwriting local cart with DB cart...");
            setItems(dbItems);
          }

          setIsInitialSynced(true);
          console.log("[LOG][CartSync] Initial DB cart sync successfully complete!");
        } catch (error) {
          console.error("Cart initial sync error:", error);
        }
      };

      initialSyncPromiseRef.current = runInitialSync();
    }
  }, [status, session, isInitialSynced, setItems]);

  // 2. Subsequent updates: debounced by 500ms, only triggers after initial sync is done
  useEffect(() => {
    if (status !== "authenticated" || !session?.user || !isInitialSynced) return;

    const delayDebounce = setTimeout(async () => {
      try {
        console.log(`[LOG][CartSync] Debounced sync triggered. Syncing ${items.length} items to DB...`);
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
            if (!isSameCart(items, postData.items)) {
              setItems(postData.items);
            }
          }
        }
      } catch (error) {
        console.error("Cart update sync error:", error);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
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
