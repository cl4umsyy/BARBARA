import { create } from "zustand";

interface FavoriteState {
  favoriteIds: Set<string>;
  count: number;
  isLoaded: boolean;
  isLoading: boolean;

  fetchFavorites: () => Promise<void>;
  toggleFavorite: (productId: string) => Promise<"added" | "removed" | "auth_required">;
  isFavorite: (productId: string) => boolean;
  setFavoriteIds: (ids: string[]) => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favoriteIds: new Set(),
  count: 0,
  isLoaded: false,
  isLoading: false,

  fetchFavorites: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const res = await fetch("/api/favorites/count");
      if (!res.ok) {
        set({ isLoaded: true, isLoading: false });
        return;
      }
      const { count } = await res.json();

      // Also fetch the product IDs
      const listRes = await fetch("/api/favorites");
      if (!listRes.ok) {
        set({ count: count ?? 0, isLoaded: true, isLoading: false });
        return;
      }
      const favorites: { productId: string }[] = await listRes.json();
      const ids = new Set(favorites.map((f) => f.productId));

      set({ favoriteIds: ids, count: ids.size, isLoaded: true, isLoading: false });
    } catch {
      set({ isLoaded: true, isLoading: false });
    }
  },

  toggleFavorite: async (productId: string) => {
    const state = get();
    const wasLiked = state.favoriteIds.has(productId);

    // Optimistic update
    const newIds = new Set(state.favoriteIds);
    if (wasLiked) {
      newIds.delete(productId);
    } else {
      newIds.add(productId);
    }
    set({ favoriteIds: newIds, count: newIds.size });

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (res.status === 401) {
        // Revert optimistic update
        set({ favoriteIds: state.favoriteIds, count: state.favoriteIds.size });
        return "auth_required";
      }

      if (!res.ok) {
        // Revert on error
        set({ favoriteIds: state.favoriteIds, count: state.favoriteIds.size });
        return wasLiked ? "added" : "removed";
      }

      const data = await res.json();
      return data.action as "added" | "removed";
    } catch {
      // Revert on network error
      set({ favoriteIds: state.favoriteIds, count: state.favoriteIds.size });
      return wasLiked ? "added" : "removed";
    }
  },

  isFavorite: (productId: string) => {
    return get().favoriteIds.has(productId);
  },

  setFavoriteIds: (ids: string[]) => {
    const newSet = new Set(ids);
    set({ favoriteIds: newSet, count: newSet.size, isLoaded: true });
  },
}));
