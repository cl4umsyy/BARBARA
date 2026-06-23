import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 0; // Disable server caching for this API endpoint to ensure real-time query results

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse filters from query params
    const categoryParam = searchParams.get("category");
    const brandParam = searchParams.get("brand");
    const colorParam = searchParams.get("color");
    const sizeParam = searchParams.get("size");
    const conditionParam = searchParams.get("condition");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "latest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    // Base conditions
    const where: any = {
      isActive: true, // Only show active products
    };

    // Category filter: support multi-value (comma-separated, e.g. "kaos,jaket")
    if (categoryParam) {
      const categories = categoryParam.split(",").map(c => c.trim().toLowerCase()).filter(Boolean);
      if (categories.length > 0) {
        where.categorySlug = {
          in: categories,
        };
      }
    }

    // Brand filter: support multi-value (comma-separated, e.g. "Nike,Adidas")
    if (brandParam) {
      const brands = brandParam.split(",").map(b => b.trim()).filter(Boolean);
      if (brands.length > 0) {
        where.brand = {
          in: brands,
        };
      }
    }

    // Condition filter: support multi-value (comma-separated, e.g. "Baru,Sangat Baik")
    if (conditionParam) {
      const conditions = conditionParam.split(",").map(c => c.trim()).filter(Boolean);
      if (conditions.length > 0) {
        where.condition = {
          in: conditions,
        };
      }
    }

    // Price boundary filters
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

    // Size filter: exact match on comma-padded string (e.g. size includes ",M,")
    if (sizeParam) {
      const sizes = sizeParam.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      if (sizes.length > 0) {
        where.OR = sizes.map(sz => ({
          size: {
            contains: `,${sz},`,
          },
        }));
      }
    }

    // Color filter: exact match on comma-padded string (e.g. color includes ",Hitam,")
    if (colorParam) {
      const colors = colorParam.split(",").map(c => c.trim()).filter(Boolean);
      if (colors.length > 0) {
        const colorConditions = colors.map(cl => ({
          color: {
            contains: `,${cl},`,
          },
        }));

        if (where.OR) {
          // If both sizes and colors filters are used, nest them in an AND structure: (size1 OR size2) AND (color1 OR color2)
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

    // Pagination setup
    const skip = (page - 1) * limit;

    // Sorting maps
    let orderBy: any = { createdAt: "desc" }; // default latest
    if (sort === "price-asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price-desc") {
      orderBy = { price: "desc" };
    } else if (sort === "popular" || sort === "likes" || sort === "paling-populer" || sort === "paling-banyak-disukai") {
      orderBy = { likesCount: "desc" };
    }

    // Execute count and findMany in parallel
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
          category: true,
          variants: true,
          reviews: {
            where: { isShown: true }
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Format products for standard client presentation
    const formattedProducts = products.map((product) => {
      // Decode the comma-padded size and color lists back into arrays for UI
      const cleanSizes = product.size 
        ? product.size.split(",").map(s => s.trim()).filter(Boolean) 
        : [];
      const cleanColors = product.color 
        ? product.color.split(",").map(c => c.trim()).filter(Boolean) 
        : [];

      const reviews = product.reviews || [];
      const rating = reviews.length > 0
        ? Number((reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1))
        : 0;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        isNew: product.isNew,
        isActive: product.isActive,
        createdAt: product.createdAt,
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
        images: product.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          order: img.order,
        })),
        variants: product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
        })),
        rating,
        reviewCount: reviews.length,
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    });
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
