import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    
    if (!productId) {
      return NextResponse.json({ error: "Product ID wajib diisi" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId, isShown: true },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          }
        }
      }
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error("[Reviews GET API] Error:", error?.message);
    return NextResponse.json({ error: "Gagal mengambil ulasan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      console.warn("[Reviews POST API] Validation failed: Unauthorized user session.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await req.formData();
    
    // Support both snake_case and camelCase for robust frontend compatibility
    const orderId = (formData.get("order_id") || formData.get("orderId")) as string;
    const productId = (formData.get("product_id") || formData.get("productId")) as string;
    const orderItemId = (formData.get("order_item_id") || formData.get("orderItemId")) as string;
    const ratingStr = formData.get("rating") as string;
    const review = (formData.get("review") || formData.get("comment")) as string;
    const userIdInput = (formData.get("user_id") || formData.get("userId")) as string;
    const files = (formData.getAll("review_images").length > 0 ? formData.getAll("review_images") : formData.getAll("files")) as File[];
    
    console.log("[Reviews POST API] Payload received:", {
      userId,
      userIdInput,
      orderId,
      orderItemId,
      productId,
      ratingStr,
      reviewTextLength: review?.length,
      filesCount: files.length
    });

    if (!orderId || !productId || !ratingStr || !review) {
      console.warn("[Reviews POST API] Validation failed: Missing required fields.");
      return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    if (userIdInput && userIdInput !== userId) {
      console.warn(`[Reviews POST API] Validation failed: Session user ID (${userId}) does not match payload user ID (${userIdInput})`);
      return NextResponse.json({ error: "User ID mismatch" }, { status: 400 });
    }

    const rating = parseInt(ratingStr);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      console.warn("[Reviews POST API] Validation failed: Invalid rating value:", ratingStr);
      return NextResponse.json({ error: "Rating harus berupa angka antara 1 dan 5" }, { status: 400 });
    }

    // Verify order exists, belongs to user, and is DELIVERED, COMPLETED or SELESAI
    console.log(`[Reviews POST API] Fetching order from Supabase: ID=${orderId}, UserID=${userId}`);
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, total, subtotal, shipping_cost, user_id")
      .eq("id", orderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (orderError) {
      console.error("[Reviews POST API] Supabase error fetching order:", orderError);
    }

    if (!order) {
      console.warn(`[Reviews POST API] Validation failed: Order ${orderId} not found for User ${userId}`);
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    console.log("[Reviews POST API] Order found in remote DB:", order);

    const orderStatus = order.status?.toUpperCase();
    if (orderStatus !== "DELIVERED" && orderStatus !== "COMPLETED" && orderStatus !== "SELESAI") {
      console.warn(`[Reviews POST API] Validation failed: Order status is ${orderStatus}, only DELIVERED or COMPLETED/SELESAI allowed.`);
      return NextResponse.json({ error: "Hanya pesanan yang sudah selesai yang dapat diberi ulasan" }, { status: 400 });
    }

    // Verify order items contains the product
    console.log(`[Reviews POST API] Fetching order items for Order ${orderId}`);
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select(`
        id,
        variant:product_variants (
          product_id
        )
      `)
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("[Reviews POST API] Supabase error fetching order items:", itemsError);
      return NextResponse.json({ error: "Gagal memverifikasi produk dalam pesanan" }, { status: 500 });
    }

    const hasProduct = orderItems?.some((item: any) => {
      const rawVariant = item.variant;
      const variant = Array.isArray(rawVariant) ? rawVariant[0] : rawVariant;
      return variant?.product_id === productId;
    });

    if (!hasProduct) {
      console.warn(`[Reviews POST API] Validation failed: Product ${productId} not found in Order Items for Order ${orderId}`);
      return NextResponse.json({ error: "Produk ini tidak ada dalam pesanan Anda" }, { status: 400 });
    }

    // Query product details from database for logging
    const localProduct = await prisma.product.findUnique({
      where: { id: productId }
    });
    console.log("[Reviews POST API] Product found for review:", localProduct);

    // Handle Cloudinary Upload for review images
    const reviewImages: string[] = [];
    console.log(`[Reviews POST API] Uploading ${files.length} images to Cloudinary...`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.size > 0) {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const base64Data = buffer.toString("base64");
          const mimeType = file.type || "image/jpeg";
          const fileUri = `data:${mimeType};base64,${base64Data}`;

          const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload(
              fileUri,
              {
                folder: "reviews",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
          });
          
          console.log(`[Reviews POST API] Cloudinary upload success for image ${i + 1}:`, uploadResult.secure_url);
          reviewImages.push(uploadResult.secure_url);
        } catch (uploadErr: any) {
          console.error(`[Reviews POST API] Cloudinary upload error for image ${i + 1}:`, uploadErr);
          return NextResponse.json({ error: `Gagal mengunggah foto ulasan: ${uploadErr?.message || "Terjadi kesalahan upload"}` }, { status: 500 });
        }
      }
    }

    // Keep existing images if it's an edit and no new images uploaded,
    // or if the frontend sends the list of existing images to retain.
    const existingImagesStr = formData.get("existingImages") as string;
    let finalImages = reviewImages;
    if (existingImagesStr) {
      try {
        const retainedImages = JSON.parse(existingImagesStr) as string[];
        finalImages = [...retainedImages, ...reviewImages];
      } catch (e) {
        // Ignore
      }
    }

    // Retrieve existing review ID from Supabase or Prisma to prevent key conflicts
    console.log(`[Reviews POST API] Checking for existing review for Order ${orderId} and Product ${productId}`);
    const { data: existingRemoteReview, error: remoteFetchError } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("order_id", orderId)
      .eq("product_id", productId)
      .maybeSingle();

    if (remoteFetchError) {
      console.error("[Reviews POST API] Supabase error looking up existing review:", remoteFetchError);
    }

    const existingLocalReview = await prisma.review.findFirst({
      where: {
        orderId,
        productId
      }
    });

    const reviewId = existingRemoteReview?.id || existingLocalReview?.id || crypto.randomUUID();
    console.log("[Reviews POST API] Determined Review ID:", reviewId);

    // Upsert in remote Supabase database
    console.log("[Reviews POST API] Upserting review in remote Supabase database...");
    const { error: remoteUpsertError } = await supabaseAdmin
      .from("reviews")
      .upsert({
        id: reviewId,
        user_id: userId,
        order_id: orderId,
        product_id: productId,
        rating,
        review,
        review_images: finalImages,
        updated_at: new Date().toISOString()
      });

    if (remoteUpsertError) {
      console.error("[Reviews POST API] Supabase upsert failed:", remoteUpsertError);
      return NextResponse.json({ error: `Gagal menyimpan ulasan ke database utama: ${remoteUpsertError.message}` }, { status: 500 });
    }

    // Ensure User and Order exist in local Postgres before upserting the review to prevent foreign key errors
    try {
      if (session.user.email) {
        console.log(`[Reviews POST API] Checking for email collision locally for email ${session.user.email}...`);
        const userWithEmail = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
        
        if (userWithEmail && userWithEmail.id !== userId) {
          console.log(`[Reviews POST API] Local user found with email ${session.user.email} but different ID (${userWithEmail.id}). Renaming local user's email to avoid unique constraint conflict.`);
          await prisma.user.update({
            where: { id: userWithEmail.id },
            data: { email: `${userWithEmail.email}_old_${Date.now()}` }
          });
        }
      }

      console.log(`[Reviews POST API] Ensuring user ${userId} exists locally...`);
      await prisma.user.upsert({
        where: { id: userId },
        update: {
          name: session.user.name || "Customer",
          email: session.user.email || `${userId}@placeholder.com`,
        },
        create: {
          id: userId,
          name: session.user.name || "Customer",
          email: session.user.email || `${userId}@placeholder.com`,
          password: "placeholder_hash",
          role: "CUSTOMER",
        }
      });

      if (order.order_number) {
        console.log(`[Reviews POST API] Checking for order number collision locally for order number ${order.order_number}...`);
        const orderWithNumber = await prisma.order.findUnique({
          where: { orderNumber: order.order_number }
        });
        
        if (orderWithNumber && orderWithNumber.id !== orderId) {
          console.log(`[Reviews POST API] Local order found with number ${order.order_number} but different ID (${orderWithNumber.id}). Renaming local order number to avoid unique constraint conflict.`);
          await prisma.order.update({
            where: { id: orderWithNumber.id },
            data: { orderNumber: `${orderWithNumber.orderNumber}_old_${Date.now()}` }
          });
        }
      }

      console.log(`[Reviews POST API] Ensuring order ${orderId} exists locally...`);
      // Map status correctly
      let localStatus: any = "DELIVERED";
      const remoteStatus = order.status?.toUpperCase();
      if (remoteStatus === "COMPLETED" || remoteStatus === "SELESAI") {
        localStatus = "COMPLETED";
      } else if (remoteStatus === "DELIVERED") {
        localStatus = "DELIVERED";
      } else if (remoteStatus === "SHIPPED") {
        localStatus = "SHIPPED";
      } else if (remoteStatus === "PROCESSING") {
        localStatus = "PROCESSING";
      } else if (remoteStatus === "PENDING") {
        localStatus = "PENDING";
      } else if (remoteStatus === "CANCELLED") {
        localStatus = "CANCELLED";
      } else if (remoteStatus === "EXPIRED") {
        localStatus = "EXPIRED";
      } else if (remoteStatus === "FAILED") {
        localStatus = "FAILED";
      }

      await prisma.order.upsert({
        where: { id: orderId },
        update: {
          status: localStatus,
          total: order.total || 0,
          subtotal: order.subtotal || 0,
          shippingCost: order.shipping_cost || 0,
        },
        create: {
          id: orderId,
          userId: userId,
          orderNumber: order.order_number || `ORD-${orderId.substring(0, 8).toUpperCase()}`,
          status: localStatus,
          total: order.total || 0,
          subtotal: order.subtotal || 0,
          shippingCost: order.shipping_cost || 0,
        }
      });
    } catch (syncErr: any) {
      console.error("[Reviews POST API] Failed to sync user or order locally:", syncErr.message || syncErr);
      return NextResponse.json({ error: `Gagal sinkronisasi data lokal: ${syncErr.message || syncErr}` }, { status: 500 });
    }

    // Upsert in local database (via Prisma)
    console.log("[Reviews POST API] Upserting review in local database...");
    const reviewObj = await prisma.review.upsert({
      where: {
        id: reviewId
      },
      update: {
        rating,
        review,
        reviewImages: finalImages,
      },
      create: {
        id: reviewId,
        userId,
        orderId,
        productId,
        rating,
        review,
        reviewImages: finalImages,
      },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          }
        }
      }
    });

    console.log("[Reviews POST API] Review successfully saved!");
    return NextResponse.json({
      message: "Ulasan berhasil disimpan",
      review: reviewObj,
    });
  } catch (error: any) {
    console.error("[Reviews POST API] FATAL ERROR:", error);
    return NextResponse.json({ error: `Gagal menyimpan ulasan: ${error?.message || "Terjadi kesalahan internal"}` }, { status: 500 });
  }
}
