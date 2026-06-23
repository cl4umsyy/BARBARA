"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Star, 
  Search, 
  Eye, 
  EyeOff, 
  Trash2, 
  MessageSquare, 
  Calendar, 
  X, 
  ChevronRight,
  Filter,
  ExternalLink
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useSearchParams } from "next/navigation";

interface Review {
  id: string;
  rating: number;
  review: string;
  reviewImages: string[];
  isShown: boolean;
  adminReply: string | null;
  adminRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  orderNumber: string;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
}

interface ReviewsClientProps {
  initialReviews: Review[];
}

export const ReviewsClient: React.FC<ReviewsClientProps> = ({ initialReviews }) => {
  const searchParams = useSearchParams();
  const initialSearch = searchParams ? searchParams.get("search") || "" : "";
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [search, setSearch] = useState(initialSearch);
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "shown" | "hidden">("all");

  // Modal & interactive states
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Stats calculation
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
    : 0;

  const starCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  // Visibility toggle
  const handleToggleVisibility = async (reviewId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, isShown: !currentStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, isShown: !currentStatus } : r))
        );
        showToast(data.message);
      } else {
        showToast(data.error || "Gagal mengubah status visibilitas", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus ulasan ini secara permanen?")) return;

    try {
      const response = await fetch(`/api/admin/reviews?reviewId=${reviewId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        showToast(data.message);
        if (isDetailOpen) setIsDetailOpen(false);
      } else {
        showToast(data.error || "Gagal menghapus ulasan", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  // Reply submit
  const handleOpenReplyModal = (review: Review) => {
    setReplyingToId(review.id);
    setReplyText(review.adminReply || "");
    setIsReplyOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyingToId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/reviews/${replyingToId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      const data = await response.json();
      if (response.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === replyingToId
              ? {
                  ...r,
                  adminReply: replyText.trim() || null,
                  adminRepliedAt: replyText.trim() ? new Date().toISOString() : null,
                }
              : r
          )
        );
        showToast(data.message);
        setIsReplyOpen(false);
        setReplyingToId(null);
        setReplyText("");
      } else {
        showToast(data.error || "Gagal mengirim balasan", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search matching
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.product.name.toLowerCase().includes(search.toLowerCase()) ||
      r.user.name.toLowerCase().includes(search.toLowerCase()) ||
      r.review.toLowerCase().includes(search.toLowerCase());

    const matchesRating = ratingFilter === "all" || r.rating === ratingFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "shown" && r.isShown) ||
      (statusFilter === "hidden" && !r.isShown);

    return matchesSearch && matchesRating && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-brand-black text-brand-white border border-brand-light/35 px-6 py-4 rounded-xl shadow-xl flex items-center gap-2 animate-slide-in">
          <p className="text-xs font-bold uppercase tracking-wider">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gray-light">
          Reputasi Toko
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-wider md:text-4xl text-brand-black">
          Ulasan & Rating
        </h1>
        <p className="text-sm text-brand-gray-light mt-1">
          Pantau feedback pelanggan, filter ulasan sensitif, dan berikan balasan resmi admin.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Summary (Card 1) */}
        <div className="bg-brand-white border border-brand-light p-6 md:p-8 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-brand-gray-light">
              Rating Rata-rata Toko
            </span>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-5xl font-black text-brand-black">{averageRating}</span>
              <span className="text-xs text-brand-gray-light font-bold uppercase">dari 5.0</span>
            </div>
            <div className="flex items-center gap-1 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.round(averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-brand-light fill-brand-light/30"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-brand-gray-light font-bold uppercase tracking-wide mt-6 border-t border-brand-light pt-4">
            Berdasarkan {totalReviews} ulasan terkumpul
          </p>
        </div>

        {/* Rating Breakdown (Card 2-3 spanned) */}
        <div className="bg-brand-white border border-brand-light p-6 md:p-8 rounded-2xl lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-brand-gray-light">
              Distribusi Rating Pelanggan
            </span>
            <div className="mt-4 space-y-3">
              {(Object.keys(starCounts) as unknown as Array<keyof typeof starCounts>)
                .sort((a, b) => Number(b) - Number(a))
                .map((star) => {
                  const count = starCounts[star];
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-4 text-xs font-medium">
                      <span className="w-4 font-bold text-brand-black">{star}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 h-2 bg-brand-light rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-black rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-brand-gray-light font-bold">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className="mt-4 border-t border-brand-light pt-3 text-[10px] text-brand-gray-light flex justify-between uppercase font-bold">
            <span>Ulasan Aktif: {reviews.filter(r => r.isShown).length}</span>
            <span>Ulasan Disembunyikan: {reviews.filter(r => !r.isShown).length}</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-[#fbfbfb] border border-brand-light p-6 rounded-2xl shadow-sm flex flex-col gap-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-brand-gray-light" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama produk, nama pelanggan, atau isi ulasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-white border border-brand-light px-11 py-3 text-xs font-semibold rounded-xl focus:border-brand-black transition-all outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Rating Star Filters */}
            <div className="flex border border-brand-light rounded-xl overflow-hidden bg-brand-white">
              <button
                onClick={() => setRatingFilter("all")}
                className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider cursor-pointer border-r border-brand-light last:border-r-0 transition-colors ${
                  ratingFilter === "all" ? "bg-brand-black text-brand-white" : "hover:bg-brand-light/40 text-brand-black"
                }`}
              >
                Semua Rating
              </button>
              {[5, 4, 3, 2, 1].map((val) => (
                <button
                  key={val}
                  onClick={() => setRatingFilter(val)}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider cursor-pointer border-r border-brand-light last:border-r-0 flex items-center gap-1 transition-colors ${
                    ratingFilter === val ? "bg-brand-black text-brand-white" : "hover:bg-brand-light/40 text-brand-black"
                  }`}
                >
                  <span>{val}</span>
                  <Star className={`w-3 h-3 ${ratingFilter === val ? "fill-brand-white" : "fill-amber-400 text-amber-400"}`} />
                </button>
              ))}
            </div>

            {/* Visibility filters */}
            <div className="flex border border-brand-light rounded-xl overflow-hidden bg-brand-white">
              {(["all", "shown", "hidden"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider cursor-pointer border-r border-brand-light last:border-r-0 transition-colors ${
                    statusFilter === status ? "bg-brand-black text-brand-white" : "hover:bg-brand-light/40 text-brand-black"
                  }`}
                >
                  {status === "all" ? "Semua Status" : status === "shown" ? "Aktif" : "Disembunyikan"}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-gray-light">
            Menampilkan {filteredReviews.length} dari {totalReviews} ulasan
          </div>
        </div>
      </div>

      {/* Reviews Table Card */}
      <div className="border border-brand-light bg-brand-white p-6 md:p-8 rounded-2xl shadow-sm">
        {filteredReviews.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold uppercase tracking-widest text-brand-gray-light">
            Tidak ada ulasan yang cocok dengan kriteria filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-light text-[10px] font-black uppercase tracking-widest text-brand-gray-light">
                  <th className="pb-4 w-12">Produk</th>
                  <th className="pb-4">Nama Produk</th>
                  <th className="pb-4">Pelanggan</th>
                  <th className="pb-4">Rating</th>
                  <th className="pb-4 max-w-xs">Isi Ulasan</th>
                  <th className="pb-4">Tanggal</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-light">
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="group hover:bg-[#fcfcfc] transition-colors">
                    {/* Product Image */}
                    <td className="py-4 pr-3">
                      <div className="relative aspect-[3/4] w-10 border border-brand-light bg-brand-light overflow-hidden rounded-lg">
                        {r.product.image ? (
                          <Image
                            src={r.product.image}
                            alt={r.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">No Image</div>
                        )}
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="py-4 pr-3">
                      <Link 
                        href={`/shop/${r.product.slug}`}
                        target="_blank"
                        className="text-xs font-bold text-brand-black hover:opacity-75 tracking-wide flex items-center gap-1.5"
                      >
                        <span className="truncate max-w-[120px]">{r.product.name}</span>
                        <ExternalLink className="w-3 h-3 text-brand-gray-light shrink-0" />
                      </Link>
                      <p className="text-[9px] text-brand-gray-light font-medium uppercase tracking-wide mt-0.5">
                        Pesanan: {r.orderNumber}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-4 pr-3">
                      <p className="text-xs font-bold text-brand-black leading-tight">
                        {r.user.name}
                      </p>
                      <p className="text-[9px] text-brand-gray-light">
                        {r.user.email}
                      </p>
                    </td>

                    {/* Rating */}
                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? "fill-amber-400 text-amber-400" : "text-brand-light fill-brand-light/30"
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="py-4 pr-3 max-w-xs">
                      <p className="text-xs text-brand-gray line-clamp-2 leading-relaxed">
                        {r.review}
                      </p>
                      {r.adminReply && (
                        <div className="mt-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-1.5 py-0.5 rounded w-max">
                          <MessageSquare className="w-3 h-3" />
                          Sudah Dibalas
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4 pr-3 text-[10px] text-brand-gray-light font-medium">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(r.createdAt))}
                    </td>

                    {/* Visibility status badge */}
                    <td className="py-4 pr-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                          r.isShown
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {r.isShown ? "Aktif" : "Sembunyi"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 text-right shrink-0">
                      <div className="inline-flex gap-2">
                        {/* Detail */}
                        <button
                          onClick={() => {
                            setSelectedReview(r);
                            setIsDetailOpen(true);
                          }}
                          className="px-2.5 py-1.5 border border-brand-light text-brand-gray hover:text-brand-black hover:border-brand-black text-[9px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                        >
                          Detail
                        </button>

                        {/* Visibility Toggle Button */}
                        <button
                          onClick={() => handleToggleVisibility(r.id, r.isShown)}
                          className={`px-2.5 py-1.5 border text-[9px] font-bold uppercase tracking-wider rounded-lg cursor-pointer flex items-center justify-center shrink-0 ${
                            r.isShown
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                              : "border-green-200 text-green-700 hover:bg-green-50"
                          }`}
                          title={r.isShown ? "Sembunyikan Ulasan" : "Tampilkan Ulasan"}
                        >
                          {r.isShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>

                        {/* Reply */}
                        <button
                          onClick={() => handleOpenReplyModal(r)}
                          className="px-2.5 py-1.5 bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black border border-brand-black text-[9px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
                        >
                          Balas
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="px-2.5 py-1.5 border border-red-100 text-red-600 hover:bg-red-50 text-[9px] font-bold uppercase tracking-wider rounded-lg cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedReview(null);
        }}
        title="Detail Ulasan Pelanggan"
      >
        {selectedReview && (
          <div className="space-y-6 font-sans text-xs">
            {/* Customer & Product details */}
            <div className="flex gap-4 border-b border-brand-light pb-4">
              <div className="relative aspect-[3/4] w-16 border border-brand-light bg-brand-light overflow-hidden rounded-xl">
                {selectedReview.product.image && (
                  <Image
                    src={selectedReview.product.image}
                    alt={selectedReview.product.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase font-bold tracking-wider text-brand-gray-light">Produk Terulas</span>
                <h4 className="text-sm font-black uppercase text-brand-black tracking-wide truncate mt-0.5">
                  {selectedReview.product.name}
                </h4>
                <p className="text-[10px] text-brand-gray-light mt-1">
                  Oleh: <span className="font-bold text-brand-black">{selectedReview.user.name}</span> ({selectedReview.user.email})
                </p>
                <p className="text-[10px] text-brand-gray-light">
                  Nomor Pesanan: <span className="font-mono text-brand-black">{selectedReview.orderNumber}</span>
                </p>
              </div>
            </div>

            {/* Stars & Text */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-brand-gray-light">Isi Ulasan & Rating</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < selectedReview.rating ? "fill-amber-400 text-amber-400" : "text-brand-light fill-brand-light/30"
                    }`}
                  />
                ))}
                <span className="font-bold text-brand-black ml-1.5">{selectedReview.rating}.0 / 5.0</span>
              </div>
              <p className="text-xs text-brand-gray bg-brand-light/40 border border-brand-light/60 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                {selectedReview.review}
              </p>
            </div>

            {/* User uploaded images */}
            {selectedReview.reviewImages && selectedReview.reviewImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold tracking-wider text-brand-gray-light">Foto dari Pembeli</span>
                <div className="flex flex-wrap gap-2">
                  {selectedReview.reviewImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveZoomImage(img)}
                      className="relative w-16 h-16 border border-brand-light bg-brand-light rounded-xl overflow-hidden cursor-pointer hover:opacity-85"
                    >
                      <Image
                        src={img}
                        alt={`Foto ulasan pembeli ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin reply content */}
            <div className="border-t border-brand-light pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-brand-gray-light">Balasan Resmi Admin</span>
                {selectedReview.adminReply && selectedReview.adminRepliedAt && (
                  <span className="text-[9px] text-brand-gray-light">
                    Dikirim pada {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(selectedReview.adminRepliedAt))}
                  </span>
                )}
              </div>
              {selectedReview.adminReply ? (
                <p className="text-xs text-brand-black bg-green-50/50 border border-green-100 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {selectedReview.adminReply}
                </p>
              ) : (
                <p className="text-xs text-brand-gray-light italic pl-1">Belum ada balasan admin resmi untuk ulasan ini.</p>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 border-t border-brand-light pt-4">
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenReplyModal(selectedReview);
                }}
                className="px-4 py-2 bg-brand-black text-brand-white border border-brand-black hover:bg-brand-white hover:text-brand-black text-xs font-bold uppercase tracking-widest rounded-xl cursor-pointer"
              >
                {selectedReview.adminReply ? "Edit Balasan" : "Balas Ulasan"}
              </button>
              <button
                onClick={() => handleDeleteReview(selectedReview.id)}
                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-widest rounded-xl cursor-pointer"
              >
                Hapus Ulasan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Admin Reply Modal */}
      <Modal
        isOpen={isReplyOpen}
        onClose={() => {
          setIsReplyOpen(false);
          setReplyingToId(null);
          setReplyText("");
        }}
        title="Tulis Balasan Resmi Admin"
      >
        <div className="space-y-4 font-sans text-xs">
          <p className="text-xs text-brand-gray-light leading-relaxed">
            Ketik balasan resmi dari Tim Barbara di bawah ini. Balasan ini akan muncul secara publik di halaman produk tepat di bawah ulasan pembeli.
          </p>

          <textarea
            rows={5}
            placeholder="Ketik pesan balasan resmi Anda di sini..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full bg-brand-white border border-brand-light p-4 text-xs font-semibold rounded-xl focus:border-brand-black transition-all outline-none resize-none leading-relaxed"
          />

          <div className="flex justify-end gap-2 border-t border-brand-light pt-4">
            <button
              onClick={() => {
                setIsReplyOpen(false);
                setReplyingToId(null);
                setReplyText("");
              }}
              className="px-4 py-2.5 border border-brand-light hover:border-brand-black text-brand-gray hover:text-brand-black text-xs font-bold uppercase tracking-widest rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSendReply}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-black text-brand-white border border-brand-black hover:bg-brand-white hover:text-brand-black text-xs font-bold uppercase tracking-widest rounded-xl cursor-pointer disabled:opacity-55"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Balasan"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Lightbox zoomed image */}
      {activeZoomImage && (
        <div 
          className="fixed inset-0 z-[100] bg-brand-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setActiveZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <img
              src={activeZoomImage}
              alt="Review image zoom"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
