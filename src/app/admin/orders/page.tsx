import React from "react";
import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";

export const dynamic = "force-dynamic"; // Always server-render (no cache)

export default function AdminOrdersPage() {
  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gray-light">
          Sales
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-wider md:text-4xl text-brand-black">
          Orders
        </h1>
        <p className="text-sm text-brand-gray-light mt-1">
          Monitor order status, track shipping fulfillment, and update delivery codes.
          Data diperbarui otomatis setiap 15 detik dari webhook Midtrans.
        </p>
      </div>

      {/* Client component handles data fetching + polling */}
      <AdminOrdersClient />
    </div>
  );
}
