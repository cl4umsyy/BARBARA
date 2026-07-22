import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan — BARBARA",
  description: "Maaf, halaman yang Anda cari tidak ditemukan. Kembali ke Beranda untuk melanjutkan berbelanja.",
};

export default async function NotFound() {
  let recommendedProducts: any[] = [];
  try {
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      take: 4,
      orderBy: [
        { isNew: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        images: { orderBy: { order: "asc" }, take: 2 },
        category: true,
        variants: true,
      },
    });

    recommendedProducts = dbProducts.map((p: any) => {
      const cleanSizes = p.size
        ? p.size.split(",").map((s: string) => s.trim()).filter(Boolean)
        : p.variants ? Array.from(new Set(p.variants.map((v: any) => v.size))) : [];

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: Number(p.price),
        imageUrl: p.images[0]?.url || "/images/placeholder.jpg",
        hoverImageUrl: p.images[1]?.url || undefined,
        categoryName: p.category?.name || "BARBARA",
        isNew: p.isNew,
        sizes: cleanSizes.length > 0 ? cleanSizes : ["M", "L", "XL"],
      };
    });
  } catch (e) {
    console.error("Failed to load 404 recommended products:", e);
  }

  return (
    <main className="w-full bg-brand-white pt-[4vh] md:pt-[5vh] pb-16 md:pb-24 flex flex-col justify-start items-center text-center">
      <div className="w-full max-w-7xl px-4 md:px-8 lg:px-16 flex flex-col items-center justify-start text-center gap-12 md:gap-16 mx-auto">
        
        {/* ── MINIMALIST HERO SECTION (CENTERED HORIZONTALLY, HIGH VERTICAL POSITION) ── */}
        <div className="w-full max-w-[850px] flex flex-col items-center justify-start text-center gap-5 mx-auto animate-fade-in">
          
          {/* 1. Very Large 404 Number (Bold & Black) */}
          <div className="w-full flex items-center justify-center text-center select-none leading-none">
            <span className="text-8xl sm:text-9xl md:text-[140px] lg:text-[160px] font-black tracking-tight text-brand-black">
              404
            </span>
          </div>

          {/* 2. Title & 3. Description */}
          <div className="w-full flex flex-col items-center justify-center text-center gap-3">
            <h1 className="w-full text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-widest text-brand-black leading-tight whitespace-nowrap">
              Halaman Tidak Ditemukan
            </h1>
            
            <p className="w-full text-center text-xs sm:text-sm md:text-base text-brand-gray-light leading-[1.65] max-w-[620px] font-medium tracking-wide mx-auto">
              Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan. Silakan kembali ke beranda untuk melanjutkan berbelanja.
            </p>
          </div>

          {/* 4. Minimalist CTA Button */}
          <div className="w-full flex items-center justify-center text-center mt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center font-black uppercase tracking-[0.2em] text-xs md:text-sm bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black border-2 border-brand-black px-10 py-4 rounded-xl transition-all duration-300 shadow-sm cursor-pointer"
            >
              Kembali ke Beranda
            </Link>
          </div>

        </div>

        {/* ── RECOMMENDED PRODUCTS (4 CARDS GRID) ───────────────────────── */}
        {recommendedProducts.length > 0 && (
          <div className="w-full border-t border-brand-light/70 pt-14 md:pt-18 flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
                  Rekomendasi Pilihan BARBARA
                </p>
                <h2 className="text-xl md:text-3xl font-black tracking-widest text-brand-black mt-1 uppercase">
                  MUNGKIN ANDA SUKA
                </h2>
              </div>
              
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-black border-b-2 border-brand-black pb-0.5 hover:opacity-70 transition-opacity"
              >
                <span>Lihat Semua Produk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 4 Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {recommendedProducts.slice(0, 4).map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  name={p.name}
                  price={p.price}
                  imageUrl={p.imageUrl}
                  hoverImageUrl={p.hoverImageUrl}
                  brand={p.categoryName}
                  isNew={p.isNew}
                  sizes={p.sizes}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

