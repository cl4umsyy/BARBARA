import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const revalidate = 0; // Disable dynamic caching to support updates

type Params = Promise<{ slug: string }>;

interface ProductDetailPageProps {
  params: Params;
}

export async function generateMetadata(
  props: ProductDetailPageProps
): Promise<Metadata> {
  const { slug } = await props.params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: slug },
        { id: slug }
      ],
      isActive: true,
    },
    include: {
      images: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!product) {
    return {
      title: "Product Not Found | barbara",
    };
  }

  const title = `${product.name} | barbara`;
  const description = product.description;
  const imageUrl = product.images[0]?.url || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ProductDetailPage(props: ProductDetailPageProps) {
  const { slug } = await props.params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: slug },
        { id: slug }
      ],
      isActive: true,
    },
    include: {
      images: {
        orderBy: { order: "asc" },
      },
      variants: true,
      reviews: {
        where: { isShown: true },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return (
      <div className="w-full bg-brand-white py-24 md:py-32">
        <div className="mx-auto max-w-xl px-6 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-brand-light/50 border border-brand-light flex items-center justify-center rounded-full text-brand-black mb-2">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-brand-black">
            Produk Tidak Ditemukan
          </h1>
          <p className="text-xs md:text-sm text-brand-gray leading-relaxed font-sans max-w-md">
            Maaf, produk yang Anda cari saat ini tidak tersedia, dinonaktifkan, atau tautan yang Anda gunakan tidak valid. Silakan kembali ke katalog untuk melihat koleksi kami yang lain.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-4">
            <Link
              href="/shop"
              className="flex-1 text-center font-black uppercase tracking-wider text-xs border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black px-6 py-4 rounded-xl transition-all duration-300 cursor-pointer"
            >
              Kembali ke Katalog
            </Link>
            <Link
              href="/"
              className="flex-1 text-center font-black uppercase tracking-wider text-xs border-2 border-brand-light bg-brand-white text-brand-black hover:bg-brand-light px-6 py-4 rounded-xl transition-all duration-300 cursor-pointer"
            >
              Halaman Utama
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reviews = (product.reviews || []).map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    userAvatar: r.user.avatarUrl,
    rating: r.rating,
    review: r.review,
    reviewImages: r.reviewImages || [],
    adminReply: r.adminReply,
    adminRepliedAt: r.adminRepliedAt ? r.adminRepliedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  const averageRating = reviews.length > 0
    ? Number((reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1))
    : 0;

  // Convert schema fields to expected component shapes
  const formattedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    material: product.material,
    care: product.care,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      order: img.order,
    })),
    variants: product.variants
      .map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        stock: v.stock,
        sku: v.sku,
      }))
      .sort((a, b) => a.size.localeCompare(b.size)),
    reviews,
    averageRating,
    reviewCount: reviews.length,
  };

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  // Product Schema Markup JSON-LD
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images.map((img) => img.url),
    "description": product.description,
    "sku": product.variants[0]?.sku || product.id,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "IDR",
      "price": formattedProduct.price,
      "availability": product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "url": `${baseUrl}/shop/${slug}`,
    },
  };

  // Breadcrumb Schema Markup JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Shop",
        "item": `${baseUrl}/shop`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `${baseUrl}/shop/${slug}`,
      },
    ],
  };

  return (
    <div className="w-full bg-brand-white">
      {/* Schema Markups */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-16">
        <ProductDetailClient product={formattedProduct} />
      </div>
    </div>
  );
}
