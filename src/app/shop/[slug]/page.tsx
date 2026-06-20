import React from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import type { Metadata } from "next";

export const revalidate = 0;

type Params = Promise<{ slug: string }>;

interface ProductDetailPageProps {
  params: Params;
}

export async function generateMetadata(
  props: ProductDetailPageProps
): Promise<Metadata> {
  const { slug } = await props.params;

  const { data: product } = await supabaseAdmin
    .from("products")
    .select(`
      id,
      name,
      description,
      is_active,
      images:product_images (
        url
      )
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (!product || !product.is_active) {
    return {
      title: "Product Not Found | barbara",
    };
  }

  const title = `${product.name} | barbara`;
  const description = product.description;
  const imageUrl = (product.images as any)?.[0]?.url || "";

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

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      material,
      care,
      is_active,
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
        color_hex,
        stock,
        sku
      )
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !product || !product.is_active) {
    notFound();
  }

  // Convert schema fields to expected component shapes
  const formattedProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    material: product.material,
    care: product.care,
    images: ((product as any).images || [])
      .map((img: any) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        order: img.order,
      }))
      .sort((a: any, b: any) => a.order - b.order),
    variants: ((product as any).variants || [])
      .map((v: any) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        colorHex: v.color_hex,
        stock: v.stock,
        sku: v.sku,
      }))
      .sort((a: any, b: any) => a.size.localeCompare(b.size)),
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
