"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/stores/useCartStore";

// ─── Status Configuration ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  paid: {
    icon: <CheckCircle className="w-16 h-16 text-green-500" />,
    title: "Pembayaran Berhasil",
    description:
      "Terima kasih! Pembayaran Anda telah berhasil dikonfirmasi. Pesanan sedang kami proses.",
    bgColor: "bg-green-50/60",
    borderColor: "border-green-200",
    badgeClass: "bg-emerald-100 text-emerald-700",
    showPayNow: false,
    isTerminal: true,
  },
  pending: {
    icon: <AlertTriangle className="w-16 h-16 text-amber-500" />,
    title: "Payment Pending",
    description:
      "Pesanan Anda telah dicatat, silakan selesaikan pembayaran melalui instruksi Midtrans.",
    bgColor: "bg-amber-50/50",
    borderColor: "border-amber-200",
    badgeClass: "bg-amber-100 text-amber-700",
    showPayNow: true,
    isTerminal: false,
  },
  expired: {
    icon: <Clock className="w-16 h-16 text-gray-400" />,
    title: "Pembayaran Kedaluwarsa",
    description:
      "Waktu pembayaran telah habis. Stok pesanan telah dikembalikan. Silakan buat pesanan baru.",
    bgColor: "bg-gray-50/60",
    borderColor: "border-gray-200",
    badgeClass: "bg-gray-100 text-gray-600",
    showPayNow: false,
    isTerminal: true,
  },
  cancelled: {
    icon: <XCircle className="w-16 h-16 text-red-400" />,
    title: "Pembayaran Dibatalkan",
    description:
      "Pembayaran Anda telah dibatalkan. Silakan buat pesanan baru jika ingin mencoba lagi.",
    bgColor: "bg-red-50/50",
    borderColor: "border-red-200",
    badgeClass: "bg-red-100 text-red-700",
    showPayNow: false,
    isTerminal: true,
  },
  failed: {
    icon: <XCircle className="w-16 h-16 text-red-500" />,
    title: "Pembayaran Gagal",
    description:
      "Transaksi ditolak. Silakan coba metode pembayaran lain atau hubungi bank Anda.",
    bgColor: "bg-red-50/60",
    borderColor: "border-red-200",
    badgeClass: "bg-red-100 text-red-700",
    showPayNow: false,
    isTerminal: true,
  },
} as const;

type PaymentStatusKey = keyof typeof STATUS_CONFIG;

const POLL_INTERVAL_MS = 5_000; // 5 seconds as requested

// ─── Props ───────────────────────────────────────────────────────────────────
interface ConfirmationClientProps {
  orderId: string;           // UUID (used for API call)
  orderNumber: string;       // BBR-2026-XXXXX (displayed)
  initialPaymentStatus: string; // from server render (uppercase e.g. "PENDING")
  totalAmount: string;       // formatted IDR string
  snapToken: string | null;
  initialMidtransTransactionId?: string | null;
  initialPaymentType?: string | null;
  initialPaidAt?: string | null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const ConfirmationClient: React.FC<ConfirmationClientProps> = ({
  orderId,
  orderNumber,
  initialPaymentStatus,
  totalAmount,
  snapToken: initialSnapToken,
  initialMidtransTransactionId,
  initialPaymentType,
  initialPaidAt,
}) => {
  // Normalize initial status to lowercase
  const normalize = (s: string): PaymentStatusKey => {
    const lower = s.toLowerCase();
    return (lower in STATUS_CONFIG ? lower : "pending") as PaymentStatusKey;
  };

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusKey>(
    normalize(initialPaymentStatus)
  );
  const [snapToken, setSnapToken] = useState<string | null>(initialSnapToken);
  const [isPaying, setIsPaying] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [midtransTransactionId, setMidtransTransactionId] = useState<string | null>(
    initialMidtransTransactionId || null
  );
  const [paidAt, setPaidAt] = useState<string | null>(initialPaidAt || null);
  const [paymentType, setPaymentType] = useState<string | null>(initialPaymentType || null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const config = STATUS_CONFIG[paymentStatus] ?? STATUS_CONFIG.pending;

  // ─── Poll order status from DB ─────────────────────────────────────────
  const pollStatus = useCallback(async () => {
    try {
      setIsPolling(true);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn("[Polling] Non-OK response:", res.status);
        return;
      }

      const data = await res.json();
      const newStatus = normalize(data.paymentStatus ?? "pending");

      setPollCount((c) => c + 1);

      if (newStatus !== paymentStatus) {
        console.log(`[Polling] Status changed: ${paymentStatus} → ${newStatus}`);
        setPaymentStatus(newStatus);
        if (newStatus === "paid") {
          useCartStore.getState().clearCart();
        }
      }
      
      if (data.paidAt) setPaidAt(data.paidAt);
      if (data.paymentType) setPaymentType(data.paymentType);
      if (data.midtransTransactionId) setMidtransTransactionId(data.midtransTransactionId);
      if (data.snapToken) setSnapToken(data.snapToken);
    } catch (err) {
      console.warn("[Polling] Fetch error:", err);
    } finally {
      setIsPolling(false);
    }
  }, [orderId, paymentStatus]);

  // ─── Start / stop polling ─────────────────────────────────────────────
  useEffect(() => {
    const currentConfig = STATUS_CONFIG[paymentStatus];

    // Stop polling when terminal status reached
    if (currentConfig?.isTerminal) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        console.log(`[Polling] Stopped — terminal status: ${paymentStatus}`);
      }
      return;
    }

    // Run an instant check on mount to ensure fresh status from backend
    pollStatus();

    // Poll every 5 seconds for non-terminal statuses
    pollRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
    console.log(`[Polling] Started for order ${orderId} (every ${POLL_INTERVAL_MS / 1000}s)`);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [paymentStatus, pollStatus, orderId]);

  // ─── Handle Pay Now ────────────────────────────────────────────────────
  const handlePayNow = () => {
    if (!snapToken) return;
    setIsPaying(true);

    const snapObj = (window as any).snap;
    if (!snapObj) {
      alert("Midtrans SDK gagal dimuat. Coba refresh halaman.");
      setIsPaying(false);
      return;
    }

    snapObj.pay(snapToken, {
      onSuccess: () => {
        console.log("[Snap] onSuccess — polling backend for status update");
        setIsPaying(false);
        pollStatus();
      },
      onPending: () => {
        console.log("[Snap] onPending — polling backend");
        setIsPaying(false);
        pollStatus();
      },
      onError: () => {
        alert("Terjadi kesalahan pembayaran. Silakan coba kembali.");
        setIsPaying(false);
        pollStatus();
      },
      onClose: () => {
        setIsPaying(false);
        pollStatus();
      },
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`w-full border rounded-2xl shadow-sm flex flex-col items-center text-center gap-6 p-8 md:p-12 transition-all duration-500 ${config.bgColor} ${config.borderColor}`}
    >
      {/* Status Icon — animated entrance */}
      <div className="animate-scale-in">
        {config.icon}
      </div>

      {/* Title + Description */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-brand-black">
          {config.title}
        </h1>
        <p className="text-xs md:text-sm text-brand-gray max-w-md leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Order Summary */}
      <div className="border-t border-brand-gray-light/20 pt-6 w-full grid grid-cols-2 gap-4 text-left text-xs text-brand-gray">
        <div>
          <span className="font-bold uppercase tracking-wider text-brand-gray-light block">
            Nomor Pesanan
          </span>
          <span className="font-black text-brand-black mt-1 block">{orderNumber}</span>
        </div>
        <div>
          <span className="font-bold uppercase tracking-wider text-brand-gray-light block">
            Total Pembayaran
          </span>
          <span className="font-black text-brand-black mt-1 block">{totalAmount}</span>
        </div>
        {midtransTransactionId && (
          <div className="col-span-2 sm:col-span-1">
            <span className="font-bold uppercase tracking-wider text-brand-gray-light block">
              Nomor Transaksi Midtrans
            </span>
            <span className="font-bold text-brand-black mt-1 block truncate">
              {midtransTransactionId}
            </span>
          </div>
        )}
        {paymentType && (
          <div>
            <span className="font-bold uppercase tracking-wider text-brand-gray-light block">
              Metode Pembayaran
            </span>
            <span className="font-bold text-brand-black mt-1 block capitalize">
              {paymentType.replace(/_/g, " ")}
            </span>
          </div>
        )}
        {paidAt && (
          <div className="col-span-2 sm:col-span-1">
            <span className="font-bold uppercase tracking-wider text-brand-gray-light block">
              Tanggal Pembayaran
            </span>
            <span className="font-bold text-emerald-700 mt-1 block">
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(paidAt))}
            </span>
          </div>
        )}
      </div>

      {/* Polling indicator — only shown for pending */}
      {!config.isTerminal && (
        <div className="flex items-center gap-2 text-[11px] text-brand-gray-light">
          <RefreshCw
            className={`w-3.5 h-3.5 ${isPolling ? "animate-spin text-amber-500" : "text-brand-gray-light"}`}
          />
          <span>
            Memeriksa status pembayaran secara otomatis setiap 5 detik…{" "}
            {pollCount > 0 && `(${pollCount}x)`}
          </span>
        </div>
      )}

      {/* Pay Now button — only shown when pending and snapToken exists */}
      {config.showPayNow && snapToken && (
        <div className="flex flex-col gap-3 items-center border-t border-brand-light pt-6 w-full">
          <p className="text-xs text-brand-gray text-center max-w-sm">
            Jika Anda belum menyelesaikan transaksi atau menutup popup pembayaran
            sebelumnya, Anda dapat melanjutkannya di bawah ini.
          </p>
          <button
            id="pay-now-btn"
            onClick={handlePayNow}
            disabled={isPaying}
            className="w-full max-w-xs flex items-center justify-center gap-2 bg-brand-black text-brand-white font-bold uppercase tracking-[0.2em] text-sm py-4 px-8 rounded-xl border-2 border-brand-black hover:bg-brand-white hover:text-brand-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPaying ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Opening Snap...
              </>
            ) : (
              "Pay Now"
            )}
          </button>
        </div>
      )}

      {/* Navigation buttons — always show */}
      <div className="flex flex-wrap gap-3 justify-center w-full pt-2">
        <Link href="/profile?tab=orders">
          <button className="font-bold uppercase tracking-[0.2em] text-xs py-3 px-6 border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black transition-colors cursor-pointer rounded-xl">
            Lihat Pesanan
          </button>
        </Link>
        <Link href="/shop">
          <button className="font-bold uppercase tracking-[0.2em] text-xs py-3 px-6 border-2 border-brand-black bg-transparent text-brand-black hover:bg-brand-black hover:text-brand-white transition-colors cursor-pointer rounded-xl">
            Lanjut Belanja
          </button>
        </Link>
      </div>
    </div>
  );
};
