import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, User, MapPin, CreditCard, ShoppingBag } from "lucide-react";
import { OrderFulfillmentClient } from "@/components/admin/OrderFulfillmentClient";

// Format currency
const formatIDR = (value: number | string) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

// Format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
};

export default async function AdminOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let order = null;

  try {
    const { data: dbOrder, error } = await supabaseAdmin
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
        ),
        shipping_addresses (
          recipient_name,
          phone,
          street,
          city,
          province,
          postal_code
        ),
        order_items (
          id,
          product_name,
          size,
          color,
          quantity,
          price,
          variant_id,
          variant:product_variants (
            id,
            sku,
            product:products (
              id,
              name,
              slug,
              images:product_images (
                url,
                order
              )
            )
          )
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    if (dbOrder) {
      const rawUser = dbOrder.user;
      const user = Array.isArray(rawUser) ? rawUser[0] : rawUser;

      const rawShipping = dbOrder.shipping_addresses;
      const shippingAddress = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping;

      const orderItems = (dbOrder.order_items || []).map((item: any) => {
        const rawVariant = item.variant;
        const variant = Array.isArray(rawVariant) ? rawVariant[0] : rawVariant;
        
        let mappedVariant = null;
        if (variant) {
          const rawProduct = variant.product;
          const product = Array.isArray(rawProduct) ? rawProduct[0] : rawProduct;
          
          let mappedProduct = null;
          if (product) {
            const sortedImages = (product.images || []).sort((a: any, b: any) => a.order - b.order);
            const mainImage = sortedImages.slice(0, 1);
            mappedProduct = {
              id: product.id,
              name: product.name,
              slug: product.slug,
              images: mainImage,
            };
          }

          mappedVariant = {
            id: variant.id,
            sku: variant.sku,
            product: mappedProduct,
          };
        }

        return {
          id: item.id,
          productName: item.product_name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: Number(item.price),
          variantId: item.variant_id,
          variant: mappedVariant,
        };
      });

      order = {
        id: dbOrder.id,
        orderNumber: dbOrder.order_number,
        status: dbOrder.status,
        subtotal: Number(dbOrder.subtotal),
        shippingCost: Number(dbOrder.shipping_cost),
        total: Number(dbOrder.total),
        paymentMethod: dbOrder.payment_method,
        paymentStatus: dbOrder.payment_status,
        midtransId: dbOrder.midtrans_id,
        midtransTransactionId: dbOrder.midtrans_transaction_id,
        paymentType: dbOrder.payment_type,
        paidAt: dbOrder.paid_at ? new Date(dbOrder.paid_at) : null,
        shippingMethod: dbOrder.shipping_method,
        trackingNumber: dbOrder.tracking_number,
        createdAt: new Date(dbOrder.created_at),
        updatedAt: new Date(dbOrder.updated_at),
        user: user ? { name: user.name, email: user.email } : null,
        shippingAddress: shippingAddress ? {
          recipientName: shippingAddress.recipient_name,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          city: shippingAddress.city,
          province: shippingAddress.province,
          postalCode: shippingAddress.postal_code,
        } : null,
        orderItems,
      };
    }
  } catch (error) {
    console.error("Failed to load order from database:", error);
  }

  // Fallback Mock Data for testing if database is offline or not found
  if (!order && (id === "ord1" || id === "ord2" || id === "ord3")) {
    const mockOrdersMap: Record<string, any> = {
      ord1: {
        id: "ord1",
        orderNumber: "BBR-2026-X8Z9F2",
        createdAt: new Date(),
        status: "PROCESSING",
        paymentStatus: "PAID",
        paymentMethod: "Midtrans Snap",
        subtotal: 1215000,
        shippingCost: 35000,
        total: 1250000,
        trackingNumber: null,
        user: { name: "Ahmad S.", email: "ahmad@example.com" },
        shippingAddress: {
          recipientName: "Ahmad S.",
          phone: "08123456789",
          street: "Jl. Boulevard Barat No. 10",
          city: "Jakarta Utara",
          province: "DKI Jakarta",
          postalCode: "14240",
        },
        orderItems: [
          {
            id: "item1",
            productName: "MONOCHROME OVERSINK TEE",
            size: "M",
            color: "Black",
            quantity: 2,
            price: 349000,
            variant: {
              product: {
                images: [
                  { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300" },
                ],
              },
            },
          },
          {
            id: "item2",
            productName: "DARK LINEN BLAZER",
            size: "M",
            color: "Charcoal",
            quantity: 1,
            price: 517000,
            variant: {
              product: {
                images: [
                  { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300" },
                ],
              },
            },
          },
        ],
      },
      ord2: {
        id: "ord2",
        orderNumber: "BBR-2026-P0K1L9",
        createdAt: new Date(Date.now() - 86400000),
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "Midtrans Snap",
        subtotal: 514000,
        shippingCost: 35000,
        total: 549000,
        trackingNumber: null,
        user: { name: "Rina K.", email: "rina@example.com" },
        shippingAddress: {
          recipientName: "Rina K.",
          phone: "08987654321",
          street: "Ruko Gading Boulevard Blok A-5",
          city: "Tangerang",
          province: "Banten",
          postalCode: "15810",
        },
        orderItems: [
          {
            id: "item3",
            productName: "MONOCHROME OVERSINK TEE",
            size: "L",
            color: "Black",
            quantity: 1,
            price: 514000,
            variant: {
              product: {
                images: [
                  { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300" },
                ],
              },
            },
          },
        ],
      },
      ord3: {
        id: "ord3",
        orderNumber: "BBR-2026-Y2F4T1",
        createdAt: new Date(Date.now() - 172800000),
        status: "CANCELLED",
        paymentStatus: "FAILED",
        paymentMethod: "Midtrans Snap",
        subtotal: 2198000,
        shippingCost: 0,
        total: 2198000,
        trackingNumber: null,
        user: { name: "Budi W.", email: "budi@example.com" },
        shippingAddress: {
          recipientName: "Budi W.",
          phone: "087788990011",
          street: "Kuningan Place Tower B Lt. 12",
          city: "Jakarta Selatan",
          province: "DKI Jakarta",
          postalCode: "12940",
        },
        orderItems: [
          {
            id: "item4",
            productName: "DARK LINEN BLAZER",
            size: "XL",
            color: "Charcoal",
            quantity: 2,
            price: 899000,
            variant: {
              product: {
                images: [
                  { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300" },
                ],
              },
            },
          },
        ],
      },
    };
    order = mockOrdersMap[id];
  }

  if (!order) {
    return (
      <div className="space-y-6 font-sans text-center py-20 border border-brand-light bg-brand-white">
        <h1 className="text-xl font-bold uppercase tracking-widest text-brand-black">
          Order Not Found
        </h1>
        <p className="text-xs text-brand-gray-light uppercase tracking-wider">
          The requested order ID does not exist or database connection is offline.
        </p>
        <div className="pt-4">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 border border-brand-black text-brand-black text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-brand-black hover:text-brand-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 font-sans max-w-5xl">
      {/* Top Header & Back Button */}
      <div className="border-b border-brand-light pb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-gray-light hover:text-brand-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders</span>
        </Link>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-brand-black">
              Order Details
            </h1>
            <p className="text-xs text-brand-gray-light uppercase tracking-wider mt-1">
              ID: {order.orderNumber} &bull; Date: {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`inline-block px-3 py-1.5 text-xs font-black uppercase tracking-wider ${
                order.paymentStatus === "PAID"
                  ? "bg-green-100 text-green-700"
                  : order.paymentStatus === "FAILED" || order.paymentStatus === "EXPIRED"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              Payment: {order.paymentStatus}
            </span>
            <span
              className={`inline-block px-3 py-1.5 text-xs font-black uppercase tracking-wider ${
                order.status === "COMPLETED" || order.status === "DELIVERED"
                  ? "bg-green-100 text-green-700"
                  : order.status === "SHIPPED"
                  ? "bg-blue-100 text-blue-700"
                  : order.status === "PROCESSING"
                  ? "bg-purple-100 text-purple-700"
                  : order.status === "CANCELLED" || order.status === "FAILED"
                  ? "bg-red-100 text-red-700"
                  : order.status === "EXPIRED"
                  ? "bg-gray-100 text-gray-500"
                  : "bg-brand-light text-brand-gray-light"
              }`}
            >
              Order: {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Order Invoice Details (ColSpan 2) */}
        <div className="md:col-span-2 space-y-8">
          {/* Order Items Table */}
          <div className="border border-brand-light bg-brand-white p-6 md:p-8 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black flex items-center gap-2 border-b border-brand-light pb-3">
              <ShoppingBag className="w-4 h-4" />
              <span>Items Ordered</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-light">
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light w-14">
                      Item
                    </th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                      Product Name
                    </th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                      Price
                    </th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                      Qty
                    </th>
                    <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light text-right">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-light">
                  {order.orderItems.map((item: any) => {
                    const price = Number(item.price);
                    const qty = item.quantity;
                    const itemSubtotal = price * qty;
                    const primaryImage =
                      item.variant?.product?.images?.[0]?.url || "/placeholder-product.png";

                    return (
                      <tr key={item.id}>
                        {/* Thumbnail */}
                        <td className="py-4 pr-3">
                          <div className="relative aspect-[3/4] w-10 border border-brand-light bg-brand-light overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={primaryImage}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <div>
                              <p className="text-xs font-bold text-brand-black">
                                {item.productName}
                              </p>
                              <p className="text-[9px] uppercase tracking-wider text-brand-gray-light mt-0.5">
                                Size: {item.size} &bull; Color: {item.color}
                              </p>
                            </div>
                            {(order.status === "COMPLETED" || order.status === "DELIVERED") && (
                              <Link
                                href={`/admin/reviews?search=${encodeURIComponent(item.productName)}`}
                                className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-brand-black bg-brand-light px-2.5 py-1 rounded hover:bg-brand-black hover:text-brand-white transition-colors w-max md:ml-2"
                              >
                                Lihat Ulasan
                              </Link>
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 text-xs font-medium text-brand-gray">
                          {formatIDR(price)}
                        </td>

                        {/* Qty */}
                        <td className="py-4 text-xs font-medium text-brand-gray">
                          {qty}
                        </td>

                        {/* Subtotal */}
                        <td className="py-4 text-xs font-bold text-brand-black text-right">
                          {formatIDR(itemSubtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-brand-light pt-6 space-y-2 max-w-xs ml-auto text-right">
              <div className="flex justify-between text-xs text-brand-gray font-medium">
                <span className="uppercase tracking-wider">Subtotal:</span>
                <span>{formatIDR(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-xs text-brand-gray font-medium">
                <span className="uppercase tracking-wider">Shipping:</span>
                <span>
                  {Number(order.shippingCost) === 0 ? "FREE" : formatIDR(Number(order.shippingCost))}
                </span>
              </div>
              <div className="flex justify-between text-sm text-brand-black font-black border-t border-brand-light pt-3">
                <span className="uppercase tracking-wider">Total Amount:</span>
                <span>{formatIDR(Number(order.total))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Status Panel */}
        <div className="space-y-6">
          {/* Customer Profile card */}
          <div className="border border-brand-light bg-brand-white p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black flex items-center gap-2 border-b border-brand-light pb-3">
              <User className="w-4 h-4" />
              <span>Customer</span>
            </h2>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-brand-black">{order.user?.name ?? "Guest User"}</p>
              <p className="text-brand-gray-light">{order.user?.email}</p>
            </div>
          </div>

          {/* Shipping Address card */}
          <div className="border border-brand-light bg-brand-white p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black flex items-center gap-2 border-b border-brand-light pb-3">
              <MapPin className="w-4 h-4" />
              <span>Shipping Address</span>
            </h2>
            <div className="space-y-2 text-xs text-brand-gray">
              <p className="font-bold text-brand-black">
                {order.shippingAddress?.recipientName}
              </p>
              <p>{order.shippingAddress?.phone}</p>
              <p className="leading-relaxed">{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.province}
              </p>
              <p className="font-bold">{order.shippingAddress?.postalCode}</p>
            </div>
          </div>

          {/* Payment Method / Midtrans Details card */}
          <div className="border border-brand-light bg-brand-white p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black flex items-center gap-2 border-b border-brand-light pb-3">
              <CreditCard className="w-4 h-4" />
              <span>Payment Details</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-brand-gray-light uppercase font-bold tracking-wider">Metode</p>
                <p className="font-bold text-brand-black mt-0.5">{order.paymentMethod || "Midtrans Snap"}</p>
              </div>
              {order.paymentType && (
                <div>
                  <p className="text-[10px] text-brand-gray-light uppercase font-bold tracking-wider">Tipe Pembayaran</p>
                  <p className="font-bold text-brand-black mt-0.5 capitalize">{order.paymentType.replace(/_/g, " ")}</p>
                </div>
              )}
              {order.midtransTransactionId && (
                <div>
                  <p className="text-[10px] text-brand-gray-light uppercase font-bold tracking-wider">Midtrans Transaction ID</p>
                  <p className="font-mono text-[10px] text-brand-gray break-all mt-0.5">{order.midtransTransactionId}</p>
                </div>
              )}
              {order.paidAt && (
                <div>
                  <p className="text-[10px] text-brand-gray-light uppercase font-bold tracking-wider">Waktu Pembayaran</p>
                  <p className="font-bold text-emerald-700 mt-0.5">{formatDate(order.paidAt)}</p>
                </div>
              )}
              {order.trackingNumber && (
                <div className="pt-1 border-t border-brand-light">
                  <p className="text-[10px] text-brand-gray-light uppercase font-bold tracking-wider">Nomor Resi</p>
                  <p className="font-mono text-xs font-bold text-blue-600 mt-0.5">{order.trackingNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Panel */}
          <div className="border border-brand-black bg-brand-white p-6 space-y-4 shadow-lg">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black border-b border-brand-light pb-3">
              Fulfillment Control
            </h2>
            <OrderFulfillmentClient
              orderId={order.id}
              currentStatus={order.status}
              currentTrackingNumber={order.trackingNumber}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
