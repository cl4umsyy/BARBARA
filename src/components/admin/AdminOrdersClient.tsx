"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { Eye, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderRow {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: string | number;
  paymentStatus: string;
  status: string;
  paymentMethod: string | null;
  paymentType: string | null;
  paidAt: string | null;
  user: { name: string; email: string } | null;
}

interface FetchResult {
  orders: OrderRow[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Status badge configs ─────────────────────────────────────────────────────
const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID:    "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED:  "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING:    "bg-amber-100 text-amber-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED:    "bg-blue-100 text-blue-700",
  DELIVERED:  "bg-teal-100 text-teal-700",
  COMPLETED:  "bg-emerald-100 text-emerald-700",
  CANCELLED:  "bg-red-100 text-red-700",
  EXPIRED:    "bg-gray-100 text-gray-500",
  FAILED:     "bg-red-100 text-red-700",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatIDR = (value: number | string) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const POLL_INTERVAL_MS = 15_000; // 15 seconds

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-brand-light animate-pulse">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="py-4 pr-4">
              <div className="h-3 bg-brand-light rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminOrdersClient() {
  const [data, setData] = useState<FetchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filter/search state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [, startTransition] = useTransition();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, paymentFilter]);

  // ─── Fetch orders ───────────────────────────────────────────────────────
  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          ...(statusFilter !== "ALL" && { status: statusFilter }),
          ...(paymentFilter !== "ALL" && { payment: paymentFilter }),
          ...(debouncedSearch && { q: debouncedSearch }),
        });

        const res = await fetch(`/api/admin/orders?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }

        const result: FetchResult = await res.json();
        startTransition(() => {
          setData(result);
          setLastUpdated(new Date());
          setSecondsAgo(0);
        });
      } catch (err: any) {
        setError(err.message || "Gagal memuat data order.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, statusFilter, paymentFilter, debouncedSearch]
  );

  // Initial + filter-change fetch
  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  // Polling: refresh every 15s silently
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // "X seconds ago" ticker
  useEffect(() => {
    if (!lastUpdated) return;
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastUpdated]);

  const handleManualRefresh = () => fetchOrders(false);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Controls: search + filters + refresh */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray-light" />
          <input
            type="text"
            id="admin-orders-search"
            placeholder="Cari order, nama, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-brand-light bg-brand-white focus:border-brand-black outline-none transition-colors rounded-lg"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Payment status filter */}
          <select
            id="admin-orders-payment-filter"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs border border-brand-light py-2 px-3 bg-brand-white focus:border-brand-black outline-none transition-colors rounded-lg cursor-pointer"
          >
            <option value="ALL">Semua Payment</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {/* Order status filter */}
          <select
            id="admin-orders-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-brand-light py-2 px-3 bg-brand-white focus:border-brand-black outline-none transition-colors rounded-lg cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Refresh button */}
          <button
            id="admin-orders-refresh-btn"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 text-xs border border-brand-light py-2 px-3 bg-brand-white hover:border-brand-black transition-colors rounded-lg cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Last updated indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isRefreshing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
        <p className="text-[10px] text-brand-gray-light uppercase tracking-wider">
          {isRefreshing
            ? "Memperbarui data..."
            : lastUpdated
            ? `Terakhir diperbarui: ${secondsAgo < 5 ? "baru saja" : `${secondsAgo}s yang lalu`} · Auto-refresh tiap 15 detik`
            : "Memuat..."}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-xs font-medium rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div className="border border-brand-light bg-brand-white overflow-hidden rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-light bg-brand-light/30">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  Order ID
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  Customer
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  Total
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  Metode
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  Payment
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-gray-light text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            {isLoading && !data ? (
              <TableSkeleton />
            ) : !data || data.orders.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={8} className="py-16 text-center text-xs font-bold uppercase tracking-widest text-brand-gray-light">
                    {error ? "Gagal memuat data." : "Tidak ada order ditemukan."}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-brand-light">
                {data.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="group hover:bg-brand-light/20 transition-colors"
                  >
                    {/* Order Number */}
                    <td className="px-4 py-4 text-xs font-bold text-brand-black whitespace-nowrap">
                      {order.orderNumber}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-xs text-brand-gray whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-4">
                      <p className="text-xs font-bold text-brand-black">
                        {order.user?.name ?? "Guest"}
                      </p>
                      <p className="text-[10px] text-brand-gray-light truncate max-w-[140px]">
                        {order.user?.email}
                      </p>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4 text-xs font-bold text-brand-black whitespace-nowrap">
                      {formatIDR(order.total)}
                    </td>

                    {/* Payment Method */}
                    <td className="px-4 py-4 text-xs text-brand-gray whitespace-nowrap">
                      <span className="block">{order.paymentMethod ?? "—"}</span>
                      {order.paymentType && (
                        <span className="text-[10px] text-brand-gray-light capitalize">
                          {order.paymentType.replace(/_/g, " ")}
                        </span>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm ${
                          PAYMENT_STATUS_STYLES[order.paymentStatus] ??
                          "bg-brand-light text-brand-gray-light"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                      {order.paidAt && (
                        <p className="text-[9px] text-brand-gray-light mt-0.5">
                          {formatDate(order.paidAt)}
                        </p>
                      )}
                    </td>

                    {/* Order Status */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-sm ${
                          ORDER_STATUS_STYLES[order.status] ??
                          "bg-brand-light text-brand-gray-light"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 border border-brand-black text-brand-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 hover:bg-brand-black hover:text-brand-white transition-all duration-300 cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Fulfill</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-4 py-4 border-t border-brand-light flex items-center justify-between">
            <p className="text-[10px] text-brand-gray-light uppercase tracking-wider">
              Menampilkan {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} dari {data.total} order
            </p>
            <div className="flex items-center gap-2">
              <button
                id="admin-orders-prev-page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-brand-light hover:border-brand-black transition-colors disabled:opacity-40 rounded cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-brand-black">
                {page} / {data.totalPages}
              </span>
              <button
                id="admin-orders-next-page"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-1.5 border border-brand-light hover:border-brand-black transition-colors disabled:opacity-40 rounded cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Total count */}
      {data && (
        <p className="text-[10px] text-brand-gray-light uppercase tracking-wider text-right">
          Total: {data.total} order ditemukan
        </p>
      )}
    </div>
  );
}
