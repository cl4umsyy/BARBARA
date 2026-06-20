import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getMidtransTransactionStatus } from "@/lib/midtrans";

// ─── Map Midtrans transaction_status to our DB enums ─────────────────────────
function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): {
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  orderStatus: "PENDING" | "PROCESSING" | "CANCELLED" | "EXPIRED" | "FAILED";
  isPaid: boolean;
} {
  switch (transactionStatus) {
    case "capture":
      if (fraudStatus === "accept") {
        return { paymentStatus: "PAID", orderStatus: "PROCESSING", isPaid: true };
      }
      return { paymentStatus: "PENDING", orderStatus: "PENDING", isPaid: false };
    case "settlement":
      return { paymentStatus: "PAID", orderStatus: "PROCESSING", isPaid: true };
    case "pending":
      return { paymentStatus: "PENDING", orderStatus: "PENDING", isPaid: false };
    case "expire":
      return { paymentStatus: "EXPIRED", orderStatus: "EXPIRED", isPaid: false };
    case "cancel":
      return { paymentStatus: "FAILED", orderStatus: "CANCELLED", isPaid: false };
    case "deny":
    case "failure":
      return { paymentStatus: "FAILED", orderStatus: "FAILED", isPaid: false };
    default:
      return { paymentStatus: "PENDING", orderStatus: "PENDING", isPaid: false };
  }
}

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await props.params;

    // ── 1. Fetch order from DB ────────────────────────────────────────────
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, payment_status, status, paid_at, payment_type, midtrans_id, midtrans_transaction_id")
      .eq("id", orderId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ── 2. If already in terminal paid state, return immediately ──────────
    if (order.payment_status === "PAID") {
      return NextResponse.json({
        orderId: order.order_number,
        paymentStatus: "paid",
        orderStatus: order.status.toLowerCase(),
        paidAt: order.paid_at,
        paymentType: order.payment_type,
        snapToken: null,
      });
    }

    // ── 3. Directly query Midtrans for latest transaction status ──────────
    let midtransStatus: string | null = null;
    let midtransFraudStatus: string | undefined;
    let midtransPaymentType: string | undefined;
    let midtransTransactionId: string | undefined;
    let midtransSettlementTime: string | undefined;

    try {
      console.log(`[Status Check] Querying Midtrans for order: ${order.id}`);
      const mtResult = await getMidtransTransactionStatus(order.id);
      
      midtransStatus = mtResult.transaction_status;
      midtransFraudStatus = mtResult.fraud_status;
      midtransPaymentType = mtResult.payment_type;
      midtransTransactionId = mtResult.transaction_id;
      midtransSettlementTime = mtResult.settlement_time;

      console.log(
        `[Status Check] Midtrans responded → order: ${order.order_number}, ` +
        `status: ${midtransStatus}, fraud: ${midtransFraudStatus ?? "none"}`
      );
    } catch (mtError: any) {
      console.warn(
        `[Status Check] Midtrans query failed for ${order.id}: ${mtError?.message}`
      );
      return NextResponse.json({
        orderId: order.order_number,
        paymentStatus: order.payment_status.toLowerCase(),
        orderStatus: order.status.toLowerCase(),
        paidAt: order.paid_at,
        paymentType: order.payment_type,
        snapToken: order.midtrans_id,
      });
    }

    // ── 4. Map Midtrans status and check if DB update is needed ───────────
    if (!midtransStatus) {
      return NextResponse.json({
        orderId: order.order_number,
        paymentStatus: order.payment_status.toLowerCase(),
        orderStatus: order.status.toLowerCase(),
        paidAt: order.paid_at,
        paymentType: order.payment_type,
        snapToken: order.midtrans_id,
      });
    }

    const { paymentStatus, orderStatus, isPaid } = mapMidtransStatus(
      midtransStatus,
      midtransFraudStatus
    );

    const currentDbStatus = order.payment_status;
    const statusChanged = paymentStatus !== currentDbStatus;

    if (statusChanged) {
      console.log(
        `[Status Check] ✅ Status changed for order ${order.order_number}: ` +
        `${currentDbStatus} → ${paymentStatus}. Updating DB...`
      );

      const paidAt = isPaid
        ? midtransSettlementTime
          ? new Date(midtransSettlementTime)
          : new Date()
        : null;

      const { error: updateErr } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: paymentStatus,
          status: orderStatus,
          payment_type: midtransPaymentType || null,
          midtrans_transaction_id: midtransTransactionId || null,
          transaction_status: midtransStatus || null,
          fraud_status: midtransFraudStatus || null,
          settlement_time: midtransSettlementTime || null,
          paid_at: paidAt ? paidAt.toISOString() : null,
        })
        .eq("id", order.id);

      if (updateErr) throw updateErr;

      console.log(`[Status Check] ✅ DB updated for order ${order.order_number}`);

      return NextResponse.json({
        orderId: order.order_number,
        paymentStatus: paymentStatus.toLowerCase(),
        orderStatus: orderStatus.toLowerCase(),
        paidAt,
        paymentType: midtransPaymentType ?? order.payment_type,
        snapToken: isPaid ? null : order.midtrans_id,
      });
    }

    // ── 5. No change — return current DB status ───────────────────────────
    return NextResponse.json({
      orderId: order.order_number,
      paymentStatus: order.payment_status.toLowerCase(),
      orderStatus: order.status.toLowerCase(),
      paidAt: order.paid_at,
      paymentType: order.payment_type,
      snapToken: order.midtrans_id,
    });
  } catch (error: any) {
    console.error("[Order Status API] Unexpected error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
