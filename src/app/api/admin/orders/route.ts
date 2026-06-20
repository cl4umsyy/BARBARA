import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const statusFilter = searchParams.get("status") ?? undefined;
    const paymentFilter = searchParams.get("payment") ?? undefined;
    const searchQuery = searchParams.get("q") ?? undefined;

    let userIds: string[] | null = null;
    if (searchQuery) {
      const { data: matchedUsers } = await supabaseAdmin
        .from("users")
        .select("id")
        .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);

      userIds = (matchedUsers || []).map((u) => u.id);
    }

    let query = supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        total,
        payment_method,
        payment_status,
        midtrans_id,
        midtrans_transaction_id,
        payment_type,
        paid_at,
        shipping_method,
        tracking_number,
        created_at,
        updated_at,
        user:users (
          name,
          email
        )
      `, { count: "exact" });

    if (statusFilter && statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }

    if (paymentFilter && paymentFilter !== "ALL") {
      query = query.eq("payment_status", paymentFilter);
    }

    if (searchQuery) {
      if (userIds && userIds.length > 0) {
        query = query.or(`order_number.ilike.%${searchQuery}%,user_id.in.(${userIds.join(",")})`);
      } else {
        query = query.ilike("order_number", `%${searchQuery}%`);
      }
    }

    const start = (page - 1) * limit;
    const end = page * limit - 1;

    const { data: dbOrders, count, error } = await query
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) throw error;

    const total = count || 0;

    const orders = (dbOrders || []).map((o: any) => {
      const rawUser = o.user;
      const user = Array.isArray(rawUser) ? rawUser[0] : rawUser;

      return {
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        subtotal: Number(o.subtotal),
        shippingCost: Number(o.shipping_cost),
        total: Number(o.total),
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        midtransId: o.midtrans_id,
        midtransTransactionId: o.midtrans_transaction_id,
        paymentType: o.payment_type,
        paidAt: o.paid_at,
        shippingMethod: o.shipping_method,
        trackingNumber: o.tracking_number,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        user: user ? { name: user.name, email: user.email } : null,
      };
    });

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("[Admin Orders API] Error:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
