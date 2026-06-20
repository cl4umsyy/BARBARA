import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

// Midtrans status → our PaymentStatus / OrderStatus mapping
function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): {
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  orderStatus: "PENDING" | "PROCESSING" | "CANCELLED" | "EXPIRED" | "FAILED";
  isPaid: boolean;
  shouldRestoreStock: boolean;
} {
  switch (transactionStatus) {
    case "capture":
      if (fraudStatus === "accept") {
        return { paymentStatus: "PAID", orderStatus: "PROCESSING", isPaid: true, shouldRestoreStock: false };
      }
      // fraud_status === "challenge" — wait for manual review
      return { paymentStatus: "PENDING", orderStatus: "PENDING", isPaid: false, shouldRestoreStock: false };

    case "settlement":
      return { paymentStatus: "PAID", orderStatus: "PROCESSING", isPaid: true, shouldRestoreStock: false };

    case "pending":
      return { paymentStatus: "PENDING", orderStatus: "PENDING", isPaid: false, shouldRestoreStock: false };

    case "expire":
      return { paymentStatus: "EXPIRED", orderStatus: "EXPIRED", isPaid: false, shouldRestoreStock: true };

    case "cancel":
      return { paymentStatus: "FAILED", orderStatus: "CANCELLED", isPaid: false, shouldRestoreStock: true };

    case "deny":
      return { paymentStatus: "FAILED", orderStatus: "FAILED", isPaid: false, shouldRestoreStock: true };

    default:
      return { paymentStatus: "PENDING", orderStatus: "PENDING", isPaid: false, shouldRestoreStock: false };
  }
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      settlement_time,
    } = body;

    console.log(`[Webhook] Received notification for order: ${order_id}, status: ${transaction_status}, payment_type: ${payment_type}`);

    // ─── 1. Verify Signature Key ─────────────────────────────────────────────
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    if (!serverKey) {
      console.error("[Webhook] MIDTRANS_SERVER_KEY is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const hashData = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const calculatedSignature = crypto
      .createHash("sha512")
      .update(hashData)
      .digest("hex");

    if (calculatedSignature !== signature_key) {
      console.warn(`[Webhook] Signature mismatch for order: ${order_id}. Possible forgery attempt.`);
      return NextResponse.json({ error: "Invalid Signature Key" }, { status: 400 });
    }

    // ─── 2. Fetch the corresponding order ────────────────────────────────────
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        status,
        payment_status,
        order_items (
          variant_id,
          quantity
        )
      `)
      .eq("id", order_id)
      .maybeSingle();

    if (orderErr || !order) {
      console.warn(`[Webhook] Order not found: ${order_id}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ─── 3. Idempotency: skip if already in a terminal paid state ────────────
    if (
      order.payment_status === "PAID" &&
      (transaction_status === "settlement" || transaction_status === "capture")
    ) {
      console.log(`[Webhook] Order ${order_id} already PAID. Skipping duplicate notification.`);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // ─── 4. Map status ───────────────────────────────────────────────────────
    const { paymentStatus, orderStatus, isPaid, shouldRestoreStock } =
      mapMidtransStatus(transaction_status, fraud_status);

    // ─── 5. Determine paidAt timestamp ──────────────────────────────────────
    let paidAt: Date | null = null;
    if (isPaid) {
      paidAt = settlement_time ? new Date(settlement_time) : new Date();
    }

    // ─── 6. Update order + restore stock sequentially ────────────────────────
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        payment_type: payment_type || null,
        midtrans_transaction_id: transaction_id || null,
        transaction_status: transaction_status || null,
        fraud_status: fraud_status || null,
        settlement_time: settlement_time || null,
        paid_at: paidAt ? paidAt.toISOString() : null,
      })
      .eq("id", order_id);

    if (updateErr) throw updateErr;

    // Restore stock only if transitioning to a terminal failure state
    // and the order was NOT already cancelled (avoid double-restore)
    if (shouldRestoreStock && order.status !== "CANCELLED" && order.status !== "EXPIRED" && order.status !== "FAILED") {
      const orderItems = (order as any).order_items || [];
      console.log(`[Webhook] Restoring stock for ${orderItems.length} item(s) on order ${order_id}`);
      for (const item of orderItems) {
        // Fetch current stock first
        const { data: variant } = await supabaseAdmin
          .from("product_variants")
          .select("stock")
          .eq("id", item.variant_id)
          .maybeSingle();

        if (variant) {
          await supabaseAdmin
            .from("product_variants")
            .update({ stock: variant.stock + item.quantity })
            .eq("id", item.variant_id);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Webhook] ✅ Order ${order_id} updated → paymentStatus: ${paymentStatus}, orderStatus: ${orderStatus} (${duration}ms)`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Webhook] ❌ Processing error after ${duration}ms:`, error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
