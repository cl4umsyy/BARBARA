export interface CollectionItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
}

export const COLLECTIONS_LIST: CollectionItem[] = [
  {
    id: "NEW_ARRIVALS",
    slug: "new-arrivals",
    name: "New Arrivals",
    description: "Produk terbaru yang baru dirilis di BARBARA.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
  },
  {
    id: "BEST_SELLERS",
    slug: "best-sellers",
    name: "Best Sellers",
    description: "Produk yang paling banyak dibeli oleh pelanggan.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
  },
  {
    id: "GRAPHIC_TEES",
    slug: "graphic-tees",
    name: "Graphic Tees",
    description: "Koleksi kaos dengan desain grafis dan artwork eksklusif.",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
  },
  {
    id: "OVERSIZED_COLLECTION",
    slug: "oversized-collection",
    name: "Oversized Collection",
    description: "Koleksi kaos dan hoodie oversized dengan fit longgar dan nyaman.",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
  },
  {
    id: "ESSENTIALS",
    slug: "essentials",
    name: "Essentials",
    description: "Koleksi pakaian basic dan minimalis untuk dipakai setiap hari.",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
  },
  {
    id: "LIMITED_EDITION",
    slug: "limited-edition",
    name: "Limited Edition",
    description: "Produk edisi terbatas dengan stok yang sangat sedikit.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
  },
];

/**
 * Normalizes collection query string parameters (comma-separated or single)
 * into matching database Collection enum IDs (e.g. "new-arrivals" -> "NEW_ARRIVALS").
 */
export function normalizeCollectionParam(param?: string): string[] {
  if (!param) return [];
  
  const rawItems = param.split(",").map((s) => s.trim()).filter(Boolean);
  const result: string[] = [];

  for (const raw of rawItems) {
    const rawUpper = raw.toUpperCase();
    const rawNormalized = raw.replace(/-/g, "_").toUpperCase();

    // Check against canonical COLLECTIONS_LIST
    const match = COLLECTIONS_LIST.find(
      (c) =>
        c.id === rawUpper ||
        c.id === rawNormalized ||
        c.slug.toLowerCase() === raw.toLowerCase()
    );

    if (match) {
      if (!result.includes(match.id)) {
        result.push(match.id);
      }
    } else if (rawNormalized) {
      // Fallback in case a raw enum string was supplied
      if (!result.includes(rawNormalized)) {
        result.push(rawNormalized);
      }
    }
  }

  return result;
}

/**
 * Gets Collection metadata by either its ID (e.g. "NEW_ARRIVALS") or slug (e.g. "new-arrivals").
 */
export function getCollectionByIdOrSlug(idOrSlug: string): CollectionItem | undefined {
  const target = idOrSlug.trim();
  const targetUpper = target.toUpperCase();
  const targetNormalized = target.replace(/-/g, "_").toUpperCase();

  return COLLECTIONS_LIST.find(
    (c) =>
      c.id === targetUpper ||
      c.id === targetNormalized ||
      c.slug.toLowerCase() === target.toLowerCase()
  );
}
