"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

interface OrderFulfillmentClientProps {
  orderId: string;
  currentStatus: string;
  currentTrackingNumber: string | null;
}

export const OrderFulfillmentClient: React.FC<OrderFulfillmentClientProps> = ({
  orderId,
  currentStatus,
  currentTrackingNumber,
}) => {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate tracking number for SHIPPED status
    if (status === "SHIPPED" && !trackingNumber.trim()) {
      setError("Nomor resi (tracking number) wajib diisi untuk status SHIPPED.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          trackingNumber: status === "SHIPPED" ? trackingNumber : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal memperbarui status pesanan");
      }

      alert("Status pesanan berhasil diperbarui.");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memperbarui pesanan.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-6">
      <div className="space-y-4">
        {/* Status Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
            Order Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-brand-white border border-brand-light py-2.5 px-4 outline-none rounded-none text-xs font-bold uppercase tracking-wider text-brand-black focus:border-brand-black cursor-pointer"
          >
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        {/* Tracking Number Input - Shown conditionally for SHIPPED */}
        {status === "SHIPPED" && (
          <div className="space-y-1.5 animate-fade-in">
            <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray">
              Tracking Number (Nomor Resi) *
            </label>
            <input
              type="text"
              placeholder="e.g. REG123456789ID"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full bg-transparent border-b border-[#e0e0e0] py-2 px-0 outline-none rounded-none text-xs text-brand-black focus:border-brand-black"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-[10px] font-bold text-red-500 uppercase">
            {error}
          </p>
        )}
      </div>

      {/* Action Button */}
      <button
        type="submit"
        disabled={isUpdating}
        className="w-full flex items-center justify-center gap-2 bg-brand-black text-brand-white text-xs font-bold uppercase tracking-widest py-3.5 hover:bg-brand-white hover:text-brand-black border border-brand-black transition-all duration-300 rounded-none cursor-pointer"
      >
        {isUpdating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        <span>{isUpdating ? "Updating..." : "Update Fulfillment"}</span>
      </button>
    </form>
  );
};
