"use client";

import React, { useState, useMemo } from "react";
import {
  Star,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface TestimonialItem {
  id: string;
  name: string;
  rating: number;
  review: string;
  productName: string;
  isActive: boolean;
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    rating: 5,
    productName: "",
    review: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<TestimonialItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Handle open add modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      rating: 5,
      productName: "",
      review: "",
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (item: TestimonialItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      rating: item.rating,
      productName: item.productName,
      review: item.review,
      isActive: item.isActive,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = "Nama pelanggan wajib diisi.";
    }
    if (!formData.productName.trim()) {
      errors.productName = "Nama produk yang dibeli wajib diisi.";
    }
    if (!formData.review.trim()) {
      errors.review = "Isi ulasan wajib diisi.";
    }
    if (formData.rating < 1 || formData.rating > 5) {
      errors.rating = "Rating harus antara 1 sampai 5 bintang.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add / Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (editingItem) {
        // Edit existing
        const res = await fetch(`/api/admin/testimonials/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.errors) setFormErrors(data.errors);
          throw new Error(data.error || "Gagal memperbarui testimoni.");
        }

        setTestimonials((prev) =>
          prev.map((t) => (t.id === editingItem.id ? data : t))
        );
        showNotification("success", "Testimoni berhasil diperbarui.");
      } else {
        // Add new
        const res = await fetch("/api/admin/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.errors) setFormErrors(data.errors);
          throw new Error(data.error || "Gagal menambahkan testimoni.");
        }

        setTestimonials((prev) => [data, ...prev]);
        showNotification("success", "Testimoni baru berhasil ditambahkan.");
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status
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
        `Status testimoni ${item.name} berhasil diubah menjadi ${
          data.isActive ? "Aktif" : "Nonaktif"
        }.`
      );
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan.");
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/testimonials/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus testimoni.");
      }

      setTestimonials((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showNotification("success", `Testimoni dari ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan saat menghapus.");
    } finally {
      setIsDeleting(false);
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
            Atur ulasan & testimoni pelanggan yang tampil di bagian &ldquo;Apa Kata Komunitas Kami&rdquo; di Halaman Home.
          </p>
        </div>

        <Button
          onClick={handleOpenAddModal}
          className="!bg-brand-black !text-brand-white hover:!bg-brand-dark flex items-center justify-center gap-2 !py-3 !px-6"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Testimoni</span>
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-light p-4 border border-brand-light/80 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-light">
            Total Testimoni
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
            className="w-full bg-brand-white border border-brand-light pl-10 pr-4 py-2 text-xs text-brand-black placeholder:text-brand-gray-light focus:outline-none focus:border-brand-black uppercase font-medium"
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
                    Tidak ada testimoni yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedTestimonials.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-light/40 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-4 font-black uppercase text-brand-black whitespace-nowrap">
                      {item.name}
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

                    {/* Status Toggle */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          item.isActive
                            ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                        }`}
                        title="Klik untuk mengubah status tampil di Home"
                      >
                        {item.isActive ? (
                          <>
                            <Eye className="w-3 h-3 text-green-600" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-gray-500" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-brand-black hover:bg-brand-light border border-transparent hover:border-brand-light transition-colors"
                          title="Edit Testimoni"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                          title="Hapus Testimoni"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredTestimonials.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-brand-light bg-brand-light/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gray">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTestimonials.length)} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredTestimonials.length)} dari {filteredTestimonials.length} Testimoni
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-brand-light bg-brand-white text-brand-black hover:bg-brand-light disabled:opacity-40 disabled:hover:bg-brand-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold uppercase tracking-wider px-3">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-brand-light bg-brand-white text-brand-black hover:bg-brand-light disabled:opacity-40 disabled:hover:bg-brand-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Testimonial Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-brand-white border border-brand-black w-full max-w-lg shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-brand-light pb-4">
              <h2 className="text-lg font-black uppercase tracking-wider text-brand-black">
                {editingItem ? "Edit Testimoni" : "Tambah Testimoni Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-brand-gray hover:text-brand-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nama Pelanggan */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                  Nama Pelanggan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rian H."
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                  }}
                  className={`w-full border p-2.5 text-xs text-brand-black focus:outline-none uppercase ${
                    formErrors.name
                      ? "border-red-500 bg-red-50/30"
                      : "border-brand-light focus:border-brand-black"
                  }`}
                />
                {formErrors.name && (
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                    {formErrors.name}
                  </span>
                )}
              </div>

              {/* Nama Produk */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                  Nama Produk yang Dibeli <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Oversized Noir Tee"
                  value={formData.productName}
                  onChange={(e) => {
                    setFormData({ ...formData, productName: e.target.value });
                    if (formErrors.productName)
                      setFormErrors({ ...formErrors, productName: "" });
                  }}
                  className={`w-full border p-2.5 text-xs text-brand-black focus:outline-none uppercase ${
                    formErrors.productName
                      ? "border-red-500 bg-red-50/30"
                      : "border-brand-light focus:border-brand-black"
                  }`}
                />
                {formErrors.productName && (
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                    {formErrors.productName}
                  </span>
                )}
              </div>

              {/* Rating Bintang */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                  Rating Bintang (1 - 5) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formData.rating
                            ? "fill-amber-500 text-amber-500"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-brand-black">
                    {formData.rating} / 5 Bintang
                  </span>
                </div>
                {formErrors.rating && (
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                    {formErrors.rating}
                  </span>
                )}
              </div>

              {/* Isi Ulasan */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                  Isi Ulasan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan teks testimoni pelanggan..."
                  value={formData.review}
                  onChange={(e) => {
                    setFormData({ ...formData, review: e.target.value });
                    if (formErrors.review) setFormErrors({ ...formErrors, review: "" });
                  }}
                  className={`w-full border p-2.5 text-xs text-brand-black focus:outline-none ${
                    formErrors.review
                      ? "border-red-500 bg-red-50/30"
                      : "border-brand-light focus:border-brand-black"
                  }`}
                />
                {formErrors.review && (
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                    {formErrors.review}
                  </span>
                )}
              </div>

              {/* Status Tampil Toggle */}
              <div className="flex items-center justify-between border-t border-b border-brand-light py-3 my-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-black">
                    Tampilkan di Halaman Home
                  </span>
                  <span className="text-[10px] text-brand-gray uppercase">
                    Status Aktif akan membuat ulasan ini muncul di section &ldquo;Apa Kata Komunitas Kami&rdquo;
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-5 h-5 accent-brand-black cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="!py-2.5 !px-5"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="!bg-brand-black !text-brand-white hover:!bg-brand-dark !py-2.5 !px-6"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingItem
                    ? "Simpan Perubahan"
                    : "Tambah Testimoni"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-brand-white border border-red-600 w-full max-w-md shadow-2xl p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 border border-red-200 text-red-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-black uppercase tracking-wider text-brand-black">
                  Konfirmasi Hapus Testimoni
                </h3>
                <p className="text-xs text-brand-gray leading-relaxed">
                  Apakah Anda yakin ingin menghapus testimoni dari{" "}
                  <strong className="text-brand-black uppercase">{deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="bg-brand-light p-3 border border-brand-light text-xs text-brand-dark italic">
              &ldquo;{deleteTarget.review}&rdquo;
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-brand-light">
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="!py-2.5 !px-5"
              >
                Batal
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="!bg-red-600 !text-white hover:!bg-red-700 !py-2.5 !px-6 border border-red-700"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
