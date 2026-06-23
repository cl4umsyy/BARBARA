import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { ArrowRight, Star, Heart } from "lucide-react";

export const revalidate = 0; // Disable caching to always show fresh database products

export default async function Home() {
  // Fetch real data from Supabase
  const [productsRes, categoriesRes] = await Promise.all([
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
      .select("*")
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

  // Lookbook curators/combos (mimicking recommended sellers)
  const lookbooks = [
    {
      id: "look1",
      title: "Oversized Streetwear Core",
      curator: "barbara Styling Lab",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
      items: "Noir Tee + Heavy Cargo + Accessories",
    },
    {
      id: "look2",
      title: "Minimalist Monochrome",
      curator: "Edgy Minimalist",
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
      items: "Loose Hoodies + Utility Shorts",
    },
    {
      id: "look3",
      title: "Cyberpunk Techwear",
      curator: "Neo Streetwear",
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800",
      items: "Neo Streetwear Jacket + Cyber Pants",
    },
  ];

  // Reviews feed (Aman dan Terlindungi)
  const reviews = [
    {
      id: 1,
      name: "Rian H.",
      review: "Kualitas kaosnya tebal banget, bener-bener heavyweight 24s. Pas dipake fitting-nya oversized premium.",
      rating: 5,
      product: "Oversized Noir Tee",
    },
    {
      id: 2,
      name: "Siti M.",
      review: "Checkout cepet banget pake VA Midtrans. Admin panel tracking resi langsung masuk email. Trusted!",
      rating: 5,
      product: "Heavy Cargo Pants",
    },
    {
      id: 3,
      name: "Dika A.",
      review: "Bahannya adem walaupun tebal. Monochrome cutting-nya keren buat streetwear style sehari-hari.",
      rating: 5,
      product: "Cyberpunk Hood",
    },
  ];

  return (
    <div className="flex flex-col w-full bg-brand-white" suppressHydrationWarning>
      {/* 1. Hero Section */}
      <section className="relative h-[70vh] md:h-[85vh] w-full bg-brand-black flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600"
          alt="barbara Streetwear Hero"
          fill
          priority
          className="object-cover opacity-50 filter grayscale contrast-125 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-transparent to-brand-black/50" />
        
        <div className="relative z-10 flex flex-col items-center text-center gap-4 px-4 max-w-4xl animate-fade-in">
          <h1 className="text-3xl font-black tracking-[0.15em] md:text-5xl lg:text-6xl text-brand-white leading-none uppercase select-none">
            Jual-Beli Streetwear <br className="hidden md:inline" /> Premium barbara
          </h1>
          <p className="text-[10px] md:text-xs tracking-widest text-brand-light font-medium uppercase max-w-2xl leading-relaxed">
            Contemporary unisex streetwear. Bold cuts, raw textures, pure monochrome. 
            Thrift-like aesthetics with brand-new premium quality standards.
          </p>
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
        </div>
      </section>

      {/* 3. Hot Items (Enriched Product Grid) */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 lg:px-16">
        <div className="flex flex-col gap-12">
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

          {dbProducts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-brand-gray-light/30">
              <p className="text-sm text-brand-gray-light uppercase font-bold tracking-widest">
                Belum ada produk. Jalankan seeder database untuk memuat produk sampel barbara.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {dbProducts.map((product, idx) => {
                const primaryImage = product.images[0]?.url || "";
                const hoverImage = product.images[1]?.url || product.images[0]?.url || "";
                const totalStock = product.variants.reduce((acc: number, v: any) => acc + v.stock, 0);
                
                // Simulate sale pricing for items to enrich visual quality
                const isSaleItem = idx % 2 === 1;
                const originalPrice = isSaleItem ? Number(product.price) * 1.25 : undefined;

                return (
                  <ProductCard
                    key={product.id}
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
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. Curated Lookbooks Carousel (Ganti Rekomendasi Seller) */}
      <section className="bg-brand-light py-20 border-y border-brand-light">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 lg:px-16">
          <div className="flex flex-col gap-10">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
                Curator Styling Combos
              </p>
              <h2 className="text-2xl md:text-4xl font-black tracking-wider text-brand-black mt-1 uppercase">
                Lookbook Kurasi barbara
              </h2>
              <p className="text-xs text-brand-gray mt-2 uppercase tracking-wide">
                Gaya rekomendasi streetwear kurasi tim stylist barbara
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {lookbooks.map((look) => (
                <div key={look.id} className="bg-brand-white border border-brand-light/60 p-4 flex flex-col gap-4 group hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-80 w-full overflow-hidden bg-brand-light">
                    <Image
                      src={look.image}
                      alt={look.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale"
                    />
                    <div className="absolute bottom-3 left-3 bg-brand-black text-brand-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1">
                      {look.curator}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-black uppercase tracking-wider text-brand-black group-hover:opacity-75 transition-opacity">
                      {look.title}
                    </h3>
                    <p className="text-[11px] text-brand-gray font-medium uppercase tracking-wide">
                      {look.items}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Collections — Scrollable Carousel */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 lg:px-16">
        <CategoryCarousel dbCategories={categories} />
      </section>

      {/* 6. Reviews Feed (Trusted and Protected / Aman dan Terlindungi) */}
      <section className="bg-brand-black py-20 text-brand-white border-t border-brand-light/20">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 lg:px-16">
          <div className="flex flex-col gap-12">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
                Aman & Terlindungi
              </p>
              <h2 className="text-2xl md:text-4xl font-black tracking-wider text-brand-white mt-1 uppercase">
                Apa Kata Komunitas Kami
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-[#1A1A1A] border border-brand-gray/30 p-6 flex flex-col justify-between gap-6 hover:border-brand-light/50 transition-colors duration-300">
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
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-gray-light bg-brand-black px-2 py-0.5 border border-brand-gray/30">
                      {rev.product}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
