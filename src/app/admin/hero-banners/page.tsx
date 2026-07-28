import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { HeroBannersClient } from "@/components/admin/HeroBannersClient";
import { ShopErrorFallback } from "@/components/shop/ShopErrorFallback";

export const revalidate = 0; // Always fetch fresh hero banners

const INITIAL_HERO_BANNERS = [
  {
    title: "Oversized Streetwear Core",
    description: "Koleksi Kaos & Tops Oversized Heavyweight Premium Barbara",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600",
    buttonText: "Belanja Tops",
    categorySlug: "tops",
    buttonLink: "/shop?category=tops",
    order: 1,
    isActive: true,
  },
  {
    title: "Cyberpunk & Techwear Outerwear",
    description: "Jaket Ripstop & Heavy Puffer dengan Monokrom Cutting Presisi",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600",
    buttonText: "Lihat Outerwear",
    categorySlug: "outerwear",
    buttonLink: "/shop?category=outerwear",
    order: 2,
    isActive: true,
  },
  {
    title: "Minimalist Utility Bottoms",
    description: "Celana Cargo Heavyweight & Utility Shorts untuk Streetwear Harian",
    imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600",
    buttonText: "Jelajahi Bottoms",
    categorySlug: "bottoms",
    buttonLink: "/shop?category=bottoms",
    order: 3,
    isActive: true,
  },
];

export default async function AdminHeroBannersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/hero-banners");
  }

  let banners: any[] = [];
  let dbError: any = null;
  let categories: any[] = [];

  try {
    if (prisma.heroBanner) {
      const count = await prisma.heroBanner.count();

      // Auto-seed default banners if table is empty
      if (count === 0) {
        await prisma.heroBanner.createMany({
          data: INITIAL_HERO_BANNERS,
        });
      }

      banners = await prisma.heroBanner.findMany({
        orderBy: { order: "asc" },
      });
    }

    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
  } catch (err: any) {
    console.error("[AdminHeroBannersPage Server] Database error:", err);
    dbError = err;
  }

  if (dbError) {
    return (
      <div className="px-4 py-16 md:px-8 lg:px-16 font-sans">
        <ShopErrorFallback
          error={dbError.message || String(dbError)}
          code="ADMIN_HERO_BANNERS_DB_ERROR"
          title="Dashboard Hero Banner Terganggu"
          message="Gagal memuat daftar hero banner dari database karena kesalahan koneksi berikut:"
        />
      </div>
    );
  }

  const formattedBanners = banners.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description || "",
    imageUrl: b.imageUrl,
    buttonText: b.buttonText || "Belanja Sekarang",
    buttonLink: b.buttonLink || "/shop",
    categorySlug: b.categorySlug || "",
    order: b.order,
    isActive: b.isActive,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  return (
    <React.Suspense
      fallback={
        <div className="py-20 text-center text-xs font-bold uppercase tracking-widest text-brand-gray-light font-sans bg-brand-white border border-brand-light">
          Memuat Kelola Hero Banner...
        </div>
      }
    >
      <HeroBannersClient
        initialBanners={formattedBanners}
        availableCategories={categories}
      />
    </React.Suspense>
  );
}
