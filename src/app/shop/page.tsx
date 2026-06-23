import React from "react";
import prisma from "@/lib/prisma";
import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { ShopErrorFallback } from "@/components/shop/ShopErrorFallback";

export const revalidate = 0; // Disable dynamic caching for search queries to reflect real-time filter changes

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface ShopPageProps {
  searchParams: SearchParams;
}

export default async function ShopPage(props: ShopPageProps) {
  const searchParams = await props.searchParams;

  // Parse parameters matching our filter/sort API
  const categoryParam = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const brandParam = typeof searchParams.brand === "string" ? searchParams.brand : undefined;
  const colorParam = typeof searchParams.color === "string" ? searchParams.color : undefined;
  const sizeParam = typeof searchParams.size === "string" ? searchParams.size : undefined;
  const conditionParam = typeof searchParams.condition === "string" ? searchParams.condition : undefined;
  const minPriceParam = typeof searchParams.minPrice === "string" ? searchParams.minPrice : undefined;
  const maxPriceParam = typeof searchParams.maxPrice === "string" ? searchParams.maxPrice : undefined;
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "latest";
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const limit = typeof searchParams.limit === "string" ? parseInt(searchParams.limit, 10) : 12;

  const where: any = {
    isActive: true, // Only show active products
  };

  // Categories
  if (categoryParam) {
    const categories = categoryParam.split(",").map(c => c.trim().toLowerCase()).filter(Boolean);
    if (categories.length > 0) {
      where.categorySlug = { in: categories };
    }
  }

  // Brands
  if (brandParam) {
    const brands = brandParam.split(",").map(b => b.trim()).filter(Boolean);
    if (brands.length > 0) {
      where.brand = { in: brands };
    }
  }

  // Conditions
  if (conditionParam) {
    const conditions = conditionParam.split(",").map(c => c.trim()).filter(Boolean);
    if (conditions.length > 0) {
      where.condition = { in: conditions };
    }
  }

  // Prices
  const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined && !isNaN(minPrice)) {
      where.price.gte = minPrice;
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      where.price.lte = maxPrice;
    }
  }

  // Sizes (contains ,M,)
  if (sizeParam) {
    const sizes = sizeParam.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    if (sizes.length > 0) {
      where.OR = sizes.map(sz => ({
        size: { contains: `,${sz},` }
      }));
    }
  }

  // Colors (contains ,Hitam,)
  if (colorParam) {
    const colors = colorParam.split(",").map(c => c.trim()).filter(Boolean);
    if (colors.length > 0) {
      const colorConditions = colors.map(cl => ({
        color: { contains: `,${cl},` }
      }));

      if (where.OR) {
        const sizeOR = where.OR;
        delete where.OR;
        where.AND = [
          { OR: sizeOR },
          { OR: colorConditions }
        ];
      } else {
        where.OR = colorConditions;
      }
    }
  }

  const skip = (page - 1) * limit;

  // Sorting
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") {
    orderBy = { price: "asc" };
  } else if (sort === "price-desc") {
    orderBy = { price: "desc" };
  } else if (sort === "popular" || sort === "likes" || sort === "paling-populer" || sort === "paling-banyak-disukai") {
    orderBy = { likesCount: "desc" };
  }

  // Fetch initial records parallelly on server-side with connection crash-resilience
  let productsList: any[] = [];
  let totalCount = 0;
  let categoriesList: any[] = [];
  let dbError: any = null;

  try {
    const [products, total, dbCategoriesList] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: { orderBy: { order: "asc" } },
          category: true,
          variants: true,
          reviews: {
            where: { isShown: true },
          },
        },
      }),
      prisma.product.count({ where }),
      prisma.category.findMany(),
    ]);
    productsList = products;
    totalCount = total;
    categoriesList = dbCategoriesList;
  } catch (err: any) {
    console.error("[ShopPage Server] Database connection error:", err);
    dbError = err;
  }

  if (dbError) {
    return (
      <ShopErrorFallback 
        error={dbError.message || String(dbError)} 
        code="SHOP_CATALOG_DB_ERROR" 
      />
    );
  }

  // Map products data
  const mappedProducts = productsList.map((product: any) => {
    const cleanSizes = product.size 
      ? product.size.split(",").map((s: string) => s.trim()).filter(Boolean) 
      : [];
    const cleanColors = product.color 
      ? product.color.split(",").map((c: string) => c.trim()).filter(Boolean) 
      : [];

    const reviews = product.reviews || [];
    const rating = reviews.length > 0
      ? Number((reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviews.length).toFixed(1))
      : 0;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      isNew: product.isNew,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      brand: product.brand || "Vintage",
      condition: product.condition || "Baik",
      likesCount: product.likesCount,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      sizes: cleanSizes,
      colors: cleanColors,
      images: product.images.map((img: any) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        order: img.order,
      })),
      variants: product.variants.map((v: any) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
      rating,
      reviewCount: reviews.length,
    };
  });

  const mappedCategories = categoriesList.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
  }));

  return (
    <ShopCatalogClient
      initialProducts={mappedProducts}
      initialTotal={totalCount}
      initialPages={Math.ceil(totalCount / limit)}
      categories={mappedCategories}
    />
  );
}
