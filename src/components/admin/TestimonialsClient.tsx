"use client";

import React, { useState, useMemo } from "react";
import {
  Star,
  Search,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Quote,
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";

export interface TestimonialItem {
  id: string;
  name: string;
  rating: number;
  review: string;
  productName: string;
  isActive: boolean;
  orderNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface TestimonialsClientProps {
  initialTestimonials: TestimonialItem[];
}

export const TestimonialsClient: React.FC<TestimonialsClientProps> = ({
  initialTestimonials,
}) => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(initialTestimonials);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Notification state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Filtered testimonials
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? item.isActive
          : !item.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [testimonials, searchTerm, statusFilter]);

  // Paginated testimonials
  const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage) || 1;
  const paginatedTestimonials = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTestimonials.slice(start, start + itemsPerPage);
  }, [filteredTestimonials, currentPage, itemsPerPage]);

  // Toggle active status (Status Tampil)
  const handleToggleStatus = async (item: TestimonialItem) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah status testimoni.");
      }

      setTestimonials((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, isActive: data.isActive } : t))
      );
      showNotification(
        "success",
        `Status testimoni dari ${item.name} berhasil diubah menjadi ${
          data.isActive ? "Aktif (Tampil di Home)" : "Nonaktif (Disembunyikan)"
        }.`
      );
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan.");
    }
  };

  const totalActive = testimonials.filter((t) => t.isActive).length;
  const totalInactive = testimonials.length - totalActive;

  return (
    <div className="flex flex-col gap-8 font-sans pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 border shadow-xl transition-all duration-300 ${
            notification.type === "success"
              ? "bg-brand-black text-brand-white border-green-500"
              : "bg-red-950 text-red-100 border-red-500"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider">
            {notification.message}
          </span>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-brand-gray-light hover:text-brand-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-light pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Quote className="w-6 h-6 text-brand-black" />
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-brand-black">
              Kelola Testimoni Komunitas
            </h1>
          </div>
          <p className="text-xs text-brand-gray mt-1 uppercase tracking-wide">
            Atur ulasan pelanggan dari pesanan selesai yang tampil di bagian &ldquo;Apa Kata Komunitas Kami&rdquo; di Halaman Home.
          </p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-light p-4 border border-brand-light/80 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-light">
            Total Review Selesai
          </span>
          <span className="text-2xl font-black text-brand-black">
            {testimonials.length}
          </span>
        </div>
        <div className="bg-green-50/50 p-4 border border-green-200 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">
            Tampil di Home (Aktif)
          </span>
          <span className="text-2xl font-black text-green-800">
            {totalActive}
          </span>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-200 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Disembunyikan (Nonaktif)
          </span>
          <span className="text-2xl font-black text-gray-700">
            {totalInactive}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-brand-light/50 p-4 border border-brand-light">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-light" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, produk, atau isi ulasan..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-brand-white border border-brand-light pl-10 pr-4 py-2 text-xs text-brand-black placeholder:text-brand-gray-light focus:outline-none focus:border-brand-black font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-brand-white border border-brand-light p-1 self-start sm:self-auto">
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              statusFilter === "ALL"
                ? "bg-brand-black text-brand-white"
                : "text-brand-gray hover:text-brand-black"
            }`}
          >
            Semua ({testimonials.length})
          </button>
          <button
            onClick={() => {
              setStatusFilter("ACTIVE");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              statusFilter === "ACTIVE"
                ? "bg-green-700 text-white"
                : "text-brand-gray hover:text-green-700"
            }`}
          >
            Aktif ({totalActive})
          </button>
          <button
            onClick={() => {
              setStatusFilter("INACTIVE");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              statusFilter === "INACTIVE"
                ? "bg-gray-700 text-white"
                : "text-brand-gray hover:text-gray-700"
            }`}
          >
            Nonaktif ({totalInactive})
          </button>
        </div>
      </div>

      {/* Testimonials Table */}
      <div className="border border-brand-light bg-brand-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black text-brand-white border-b border-brand-black text-[10px] font-black uppercase tracking-widest">
                <th className="py-4 px-4">Nama Pelanggan</th>
                <th className="py-4 px-4">Rating</th>
                <th className="py-4 px-4">Produk Dibeli</th>
                <th className="py-4 px-4">Isi Ulasan</th>
                <th className="py-4 px-4 text-center">Status Tampil</th>
                <th className="py-4 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light text-xs font-medium">
              {paginatedTestimonials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-gray-light uppercase font-bold tracking-widest">
                    Tidak ada ulasan pembeli yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedTestimonials.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-light/40 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-4 font-black uppercase text-brand-black whitespace-nowrap">
                      <div>
                        {item.name}
                        {item.orderNumber && (
                          <div className="text-[9px] font-mono font-normal text-brand-gray-light mt-0.5">
                            {item.orderNumber}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center text-amber-500 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < item.rating
                                ? "fill-amber-500 text-amber-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-[11px] font-bold text-brand-black">
                          ({item.rating})
                        </span>
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-block bg-brand-light text-brand-black font-bold uppercase text-[10px] tracking-wider px-2.5 py-1 border border-brand-light/80">
                        {item.productName}
                      </span>
                    </td>

                    {/* Review text */}
                    <td className="py-4 px-4 max-w-xs md:max-w-md">
                      <p className="text-brand-dark italic line-clamp-2">
                        &ldquo;{item.review}&rdquo;
                      </p>
                    </td>

                    {/* Status Toggle Badge */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          item.isActive
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                        }`}
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          item.isActive
                            ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                            : "bg-green-50 text-green-800 border-green-300 hover:bg-green-100"
                        }`}
                        title={item.isActive ? "Sembunyikan dari Home" : "Tampilkan di Home"}
                      >
                        {item.isActive ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                            <span>Sembunyikan</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-green-600" />
                            <span>Tampilkan</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredTestimonials.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-brand-light bg-brand-light/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gray">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTestimonials.length)} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredTestimonials.length)} dari {filteredTestimonials.length} Testimoni
            </span>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
