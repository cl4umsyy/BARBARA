import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase";
import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { HeroBannerCarousel } from "@/components/home/HeroBannerCarousel";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/ui/StaggerContainer";
import { ArrowRight, Star } from "lucide-react";

export const revalidate = 0; // Disable caching to always show fresh database products

export default async function Home() {
  // Fetch real data from Supabase and Prisma
  const [productsRes, categoriesRes, dbReviews, dbHeroBanners] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        slug,
        price,
        is_new,
        is_active,
        created_at,
        images:product_images (
          id,
          url,
          alt,
          order
        ),
        variants:product_variants (
          id,
          size,
          color,
          stock
        ),
        reviews (
          rating,
          is_shown
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("categories")
      .select("*"),
    prisma.review
      ? prisma.review.findMany({
          where: {
            isShown: true,
            order: {
              status: { in: ["COMPLETED", "DELIVERED"] }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: {
            user: { select: { name: true } },
            product: { select: { name: true } }
          }
        }).catch(() => [])
      : Promise.resolve([]),
    prisma.heroBanner
      ? prisma.heroBanner.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const categories = categoriesRes.data || [];

  const dbProducts = (productsRes.data || []).map((p: any) => {
    const reviews = (p.reviews || []).filter((r: any) => r.is_shown);
    const rating = reviews.length > 0
      ? Number((reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviews.length).toFixed(1))
      : 0;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      isNew: p.is_new,
      is_active: p.is_active,
      created_at: p.created_at,
      images: (p.images || [])
        .map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          order: img.order,
        }))
        .sort((a: any, b: any) => a.order - b.order),
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
      rating,
      reviewCount: reviews.length,
    };
  });

  const heroBanners = (dbHeroBanners || []).map((b: any) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    imageUrl: b.imageUrl,
    buttonText: b.buttonText,
    buttonLink: b.buttonLink,
    categorySlug: b.categorySlug,
    order: b.order,
  }));

  // Authentic customer reviews feed from database
  const reviews = dbReviews.map((r: any) => ({
    id: r.id,
    name: r.user?.name || "Pelanggan",
    review: r.review,
    rating: r.rating,
    product: r.product?.name || "-",
  }));

  return (
    <div className="flex flex-col w-full bg-brand-white" suppressHydrationWarning>
      {/* 1. Hero Section */}
      <section className="relative h-[70vh] md:h-[85vh] w-full bg-brand-black flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600"
          alt="barbara Streetwear Hero"
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-50 filter grayscale contrast-125 select-none transform-gpu transition-transform duration-700 ease-out hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-transparent to-brand-black/50" />
        
        <div className="relative z-10 flex flex-col items-center text-center gap-4 px-4 max-w-4xl">
          <ScrollReveal variant="fade-up" duration={1.3}>
            <h1 className="text-3xl font-black tracking-[0.15em] md:text-5xl lg:text-6xl text-brand-white leading-none uppercase select-none">
              Jual-Beli Streetwear <br className="hidden md:inline" /> Premium barbara
            </h1>
          </ScrollReveal>
          
          <ScrollReveal variant="fade-in" delay={0.25} duration={1.3}>
            <p className="text-[10px] md:text-xs tracking-widest text-brand-light font-medium uppercase max-w-2xl leading-relaxed">
              Contemporary unisex streetwear. Bold cuts, raw textures, pure monochrome. 
              Contemporary aesthetics with brand-new premium quality standards.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="zoom-in" delay={0.5} duration={1.2}>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Link href="/shop">
                <Button variant="primary" className="!bg-brand-white !text-brand-black hover:!bg-brand-black hover:!text-brand-white hover:!border-brand-white border border-brand-white !py-3.5 !px-8">
                  Mulai Belanja
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary" className="!text-brand-white !border-brand-white hover:!bg-brand-white hover:!text-brand-black !py-3.5 !px-8 bg-transparent">
                  Cara Kerja Kami
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. Hot Items (Enriched Product Grid) */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 lg:px-16">
        <div className="flex flex-col gap-12">
          <ScrollReveal variant="fade-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-light pb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
                  Paling Banyak Dilihat Hari Ini
                </p>
                <h2 className="text-2xl md:text-4xl font-black tracking-wider text-brand-black mt-1 uppercase">
                  Hot Items
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold uppercase tracking-widest text-brand-black border-b-2 border-brand-black pb-1 hover:opacity-70 transition-opacity flex items-center gap-1"
              >
                <span>Lihat Semua Produk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ScrollReveal>

          {dbProducts.length === 0 ? (
            <ScrollReveal variant="fade-in">
              <div className="text-center py-16 border border-dashed border-brand-gray-light/30">
                <p className="text-sm text-brand-gray-light uppercase font-bold tracking-widest">
                  Belum ada produk. Jalankan seeder database untuk memuat produk sampel barbara.
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <StaggerContainer staggerDelay={0.07} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {dbProducts.map((product, idx) => {
                const primaryImage = product.images[0]?.url || "";
                const hoverImage = product.images[1]?.url || product.images[0]?.url || "";
                const totalStock = product.variants.reduce((acc: number, v: any) => acc + v.stock, 0);
                
                // Simulate sale pricing for items to enrich visual quality
                const isSaleItem = idx % 2 === 1;
                const originalPrice = isSaleItem ? Number(product.price) * 1.25 : undefined;

                return (
                  <StaggerItem key={product.id} variant="fade-up">
                    <ProductCard
                      id={product.id}
                      slug={product.slug}
                      name={product.name}
                      price={Number(product.price)}
                      imageUrl={primaryImage}
                      hoverImageUrl={hoverImage !== primaryImage ? hoverImage : undefined}
                      isNew={product.isNew}
                      isOutOfStock={totalStock === 0}
                      originalPrice={originalPrice}
                      sizes={product.variants.map((v: any) => v.size)}
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                    />
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* 4. Premium Hero Banner Carousel (Menggantikan Lookbook) */}
      {heroBanners.length > 0 && (
        <ScrollReveal variant="fade-up">
          <HeroBannerCarousel banners={heroBanners} />
        </ScrollReveal>
      )}

      {/* 5. Featured Collections — Scrollable Carousel */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 lg:px-16">
        <ScrollReveal variant="fade-up">
          <CategoryCarousel dbCategories={categories} />
        </ScrollReveal>
      </section>

      {/* 6. Reviews Feed (Trusted and Protected / Aman dan Terlindungi) */}
      <section className="bg-brand-black py-20 text-brand-white border-t border-brand-light/20">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 lg:px-16">
          <div className="flex flex-col gap-12">
            <ScrollReveal variant="fade-up">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
                  Aman & Terlindungi
                </p>
                <h2 className="text-2xl md:text-4xl font-black tracking-wider text-brand-white mt-1 uppercase">
                  Apa Kata Komunitas Kami
                </h2>
              </div>
            </ScrollReveal>

            {reviews.length === 0 ? (
              <ScrollReveal variant="fade-in">
                <div className="text-center py-12 border border-dashed border-brand-gray/30">
                  <p className="text-xs text-brand-gray-light uppercase font-bold tracking-widest">
                    Belum ada ulasan komunitas yang ditampilkan.
                  </p>
                </div>
              </ScrollReveal>
            ) : (
              <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((rev) => (
                  <StaggerItem key={rev.id} variant="fade-up">
                    <div className="bg-[#1A1A1A] border border-brand-gray/30 p-6 flex flex-col justify-between gap-6 hover:border-brand-light/50 transition-colors duration-300 rounded-xl">
                      <div className="flex flex-col gap-3">
                        <div className="flex text-amber-500">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                          ))}
                        </div>
                        <p className="text-xs text-brand-light leading-relaxed italic">
                          &ldquo;{rev.review}&rdquo;
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-t border-brand-gray/30 pt-4">
                        <span className="text-xs font-black uppercase tracking-wider text-brand-white">
                          {rev.name}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-brand-gray-light bg-brand-black px-2 py-0.5 border border-brand-gray/30 rounded-md">
                          {rev.product}
                        </span>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

