import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Semua Koleksi — barbara",
  description:
    "Jelajahi semua koleksi barbara: Tops, Bottoms, Footwear, Outerwear, Dresses, dan lebih banyak lagi.",
};

export const revalidate = 60;

const STATIC_CATEGORIES = [
  {
    id: "tops",
    name: "Tops",
    slug: "tops",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
    description: "Kaos, kemeja, hoodie, dan atasan premium",
  },
  {
    id: "bottoms",
    name: "Bottoms",
    slug: "bottoms",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
    description: "Celana cargo, jogger, dan bawahan streetwear",
  },
  {
    id: "footwear",
    name: "Footwear",
    slug: "footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    description: "Sneakers dan alas kaki edgy pilihan",
  },
  {
    id: "outerwear",
    name: "Outerwear",
    slug: "outerwear",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800",
    description: "Jaket, windbreaker, dan outer kontemporer",
  },
  {
    id: "dresses",
    name: "Dresses",
    slug: "dresses",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800",
    description: "Dress dan rok dengan siluet modern",
  },
  {
    id: "accessories",
    name: "Accessories",
    slug: "accessories",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800",
    description: "Topi, tas, ikat pinggang, dan aksesoris lainnya",
  },
];

export default async function CollectionsPage() {
  const { data: dbCategoriesRes } = await supabaseAdmin
    .from("categories")
    .select("*");
  const dbCategories = dbCategoriesRes || [];

  // Merge: DB data takes priority over static
  const merged = STATIC_CATEGORIES.map((sc) => {
    const db = dbCategories.find((d) => d.slug === sc.slug);
    return db
      ? { ...sc, name: db.name, image: db.image || sc.image }
      : sc;
  });

  // Append extra DB categories not in static list
  dbCategories.forEach((db) => {
    if (!merged.find((m) => m.slug === db.slug)) {
      merged.push({
        id: db.id,
        name: db.name,
        slug: db.slug,
        image: db.image || STATIC_CATEGORIES[merged.length % STATIC_CATEGORIES.length].image,
        description: "Jelajahi koleksi ini",
      });
    }
  });

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
            {merged.length} kategori tersedia
          </p>
        </div>
      </section>

      {/* Category Grid */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 lg:px-16 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {merged.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group flex flex-col gap-3"
            >
              {/* Image */}
              <div
                className="relative w-full overflow-hidden rounded-2xl bg-brand-light"
                style={{ aspectRatio: "4/3" }}
              >
                <Image
                  src={cat.image || STATIC_CATEGORIES[0].image}
                  alt={`${cat.name} Collection`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Subtle dark overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-brand-black/0 group-hover:bg-brand-black/10 transition-colors duration-300" />
              </div>

              {/* Info below card */}
              <div className="flex flex-col gap-0.5 px-0.5">
                <p className="text-sm font-bold text-brand-black tracking-wide group-hover:opacity-60 transition-opacity">
                  {cat.name}
                </p>
                <p className="text-[11px] text-brand-gray">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
