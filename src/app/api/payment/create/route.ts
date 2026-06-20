import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { snap } from "@/lib/midtrans";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();

    // Fetch order along with items and shipping address from Supabase
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_number,
        total,
        shipping_cost,
        order_items (
          id,
          variant_id,
          product_name,
          size,
          color,
          quantity,
          price
        ),
        shipping_addresses (
          recipient_name,
          phone,
          street,
          city,
          province,
          postal_code
        )
      `)
      .eq("id", orderId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const rawOrderItems = (order as any).order_items || [];
    const shippingAddress = (order as any).shipping_addresses;

    // Build item details for Midtrans
    console.log(`[LOG][Stage 6] Preparing Midtrans Snap transaction details. Order ID: "${order.id}", Order Number: "${order.order_number}"`);
    const itemDetails = rawOrderItems.map((item: any) => {
      const calculatedSubtotal = Math.round(Number(item.price)) * item.quantity;
      console.log(` - Midtrans Item: "${item.product_name}" (${item.size}/${item.color}) | Price: ${Math.round(Number(item.price))} | Qty: ${item.quantity} | Subtotal: ${calculatedSubtotal} (Math: ${Math.round(Number(item.price))} * ${item.quantity} = ${calculatedSubtotal})`);
      return {
        id: item.variant_id,
        price: Math.round(Number(item.price)),
        quantity: item.quantity,
        name: item.product_name.substring(0, 50), // Midtrans name character limit
      };
    });

    // Add shipping fee as an item details line if applicable
    const shippingFee = Math.round(Number(order.shipping_cost));
    if (shippingFee > 0) {
      console.log(` - Midtrans Shipping Fee added: ${shippingFee}`);
      itemDetails.push({
        id: "shipping-fee",
        price: shippingFee,
        quantity: 1,
        name: "Shipping Fee",
      });
    }

    // Build transaction parameter parameter for Midtrans Snap API
    const parameter = {
      transaction_details: {
        order_id: order.id,
        gross_amount: Math.round(Number(order.total)),
      },
      item_details: itemDetails,
      customer_details: {
        first_name: shippingAddress?.recipient_name || session.user.name || "Customer",
        email: session.user.email || undefined,
        phone: shippingAddress?.phone || "",
      },
    };

    console.log(` - Midtrans Gross Amount Parameter: ${parameter.transaction_details.gross_amount}`);
    console.log(`[LOG][Stage 6] Sending payment initialization to Midtrans Snap API...`);

    // Call Midtrans Snap client to get token
    const transaction = await snap.createTransaction(parameter);

    // Save Midtrans Snap Token (midtrans_id) and payment_method into Order table
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        midtrans_id: transaction.token,
        payment_method: "Midtrans Snap",
      })
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ token: transaction.token });
  } catch (error: any) {
    console.error("Midtrans transaction generation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
