import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Semua Koleksi — BARBARA",
  description:
    "Jelajahi semua koleksi BARBARA: New Arrivals, Best Sellers, Graphic Tees, Oversized Collection, Essentials, dan Limited Edition.",
};

export const revalidate = 0; // Fresh dynamically on load

const COLLECTIONS_LIST = [
  {
    id: "NEW_ARRIVALS",
    name: "New Arrivals",
    description: "Produk terbaru yang baru dirilis di BARBARA.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
  },
  {
    id: "BEST_SELLERS",
    name: "Best Sellers",
    description: "Produk yang paling banyak dibeli oleh pelanggan.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
  },
  {
    id: "GRAPHIC_TEES",
    name: "Graphic Tees",
    description: "Koleksi kaos dengan desain grafis dan artwork eksklusif.",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
  },
  {
    id: "OVERSIZED_COLLECTION",
    name: "Oversized Collection",
    description: "Koleksi kaos dan hoodie oversized dengan fit longgar dan nyaman.",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
  },
  {
    id: "ESSENTIALS",
    name: "Essentials",
    description: "Koleksi pakaian basic dan minimalis untuk dipakai setiap hari.",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
  },
  {
    id: "LIMITED_EDITION",
    name: "Limited Edition",
    description: "Produk edisi terbatas dengan stok yang sangat sedikit.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
  },
];

export default async function CollectionsPage() {
  // Fetch only active products to aggregate counts dynamically on backend/DB representation
  const { data: dbProducts } = await supabaseAdmin
    .from("products")
    .select("collection")
    .eq("is_active", true);

  const productCounts: Record<string, number> = {};
  if (dbProducts) {
    dbProducts.forEach((prod) => {
      if (prod.collection) {
        productCounts[prod.collection] = (productCounts[prod.collection] || 0) + 1;
      }
    });
  }

  return (
    <main className="min-h-screen bg-brand-white">
      {/* Page Header */}
      <section className="border-b border-brand-light bg-brand-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-16 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-gray hover:text-brand-black transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Beranda
          </Link>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-brand-black">
            Semua Koleksi
          </h1>
          <p className="mt-2 text-xs text-brand-gray uppercase tracking-widest font-medium">
            {COLLECTIONS_LIST.length} Koleksi Tersedia
          </p>
        </div>
      </section>

      {/* Collection Grid */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 lg:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {COLLECTIONS_LIST.map((col) => {
            const itemCount = productCounts[col.id] || 0;
            return (
              <Link
                key={col.id}
                href={`/shop?collection=${col.id}`}
                className="group flex flex-col gap-3 border border-brand-light/40 rounded-2xl p-4 bg-brand-white hover:shadow-md transition-all duration-300"
              >
                {/* Image */}
                <div
                  className="relative w-full overflow-hidden rounded-xl bg-brand-light"
                  style={{ aspectRatio: "16/10" }}
                >
                  <Image
                    src={col.image}
                    alt={`${col.name} Collection`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  {/* Subtle dark overlay on hover */}
                  <div className="absolute inset-0 rounded-xl bg-brand-black/0 group-hover:bg-brand-black/10 transition-colors duration-300" />
                </div>

                {/* Info below card */}
                <div className="flex flex-col gap-1 px-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-brand-black tracking-wide group-hover:opacity-75 transition-opacity">
                      {col.name}
                    </p>
                    <span className="text-[9px] bg-brand-light px-2.5 py-0.5 rounded-full font-black uppercase text-brand-black">
                      {itemCount} Produk
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-gray leading-relaxed">{col.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
