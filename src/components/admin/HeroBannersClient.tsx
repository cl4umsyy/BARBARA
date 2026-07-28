"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Upload,
  ExternalLink,
  Sliders,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface HeroBannerItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  categorySlug: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface HeroBannersClientProps {
  initialBanners: HeroBannerItem[];
  availableCategories: CategoryOption[];
}

export const HeroBannersClient: React.FC<HeroBannersClientProps> = ({
  initialBanners,
  availableCategories,
}) => {
  const [banners, setBanners] = useState<HeroBannerItem[]>(initialBanners);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HeroBannerItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    buttonText: "Belanja Sekarang",
    categorySlug: "",
    buttonLink: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<HeroBannerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification toast
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

  // Open add modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      buttonText: "Belanja Sekarang",
      categorySlug: availableCategories[0]?.slug || "",
      buttonLink: availableCategories[0]?.slug ? `/shop?category=${availableCategories[0].slug}` : "/shop",
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (item: HeroBannerItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      imageUrl: item.imageUrl,
      buttonText: item.buttonText || "Belanja Sekarang",
      categorySlug: item.categorySlug || "",
      buttonLink: item.buttonLink || "/shop",
      isActive: item.isActive,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle image file upload to Cloudinary via API
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      // Upload via products API or dedicated upload handler
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: uploadData,
      });

      // Fallback: If product API requires product schema, convert file to data URL for Cloudinary upload
      if (!res.ok) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
            showNotification("success", "Gambar berhasil diunggah.");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      showNotification("error", "Gagal mengunggah gambar. Gunakan URL gambar langsung.");
    } finally {
      setIsUploading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) {
      errors.title = "Judul banner wajib diisi.";
    }
    if (!formData.imageUrl.trim()) {
      errors.imageUrl = "Gambar banner wajib diisi.";
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
      // Auto-compute buttonLink if categorySlug is selected and buttonLink is empty
      const payload = {
        ...formData,
        buttonLink: formData.buttonLink.trim()
          ? formData.buttonLink.trim()
          : formData.categorySlug
          ? `/shop?category=${formData.categorySlug}`
          : "/shop",
      };

      if (editingItem) {
        // Edit existing banner
        const res = await fetch(`/api/admin/hero-banners/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.errors) setFormErrors(data.errors);
          throw new Error(data.error || "Gagal memperbarui banner.");
        }

        setBanners((prev) =>
          prev.map((b) => (b.id === editingItem.id ? data : b))
        );
        showNotification("success", "Hero Banner berhasil diperbarui.");
      } else {
        // Add new banner
        const res = await fetch("/api/admin/hero-banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.errors) setFormErrors(data.errors);
          throw new Error(data.error || "Gagal menambahkan banner.");
        }

        setBanners((prev) => [...prev, data]);
        showNotification("success", "Hero Banner baru berhasil ditambahkan.");
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (item: HeroBannerItem) => {
    try {
      const res = await fetch(`/api/admin/hero-banners/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah status banner.");
      }

      setBanners((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, isActive: data.isActive } : b))
      );
      showNotification(
        "success",
        `Status banner "${item.title}" diubah menjadi ${
          data.isActive ? "Aktif" : "Nonaktif"
        }.`
      );
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan.");
    }
  };

  // Move banner order up/down
  const handleMoveOrder = async (index: number, direction: "UP" | "DOWN") => {
    const newBanners = [...banners];
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    // Swap elements
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;

    // Update order indices
    const updatedWithOrder = newBanners.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setBanners(updatedWithOrder);

    try {
      const res = await fetch("/api/admin/hero-banners/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updatedWithOrder.map((item) => ({ id: item.id, order: item.order })),
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan urutan banner.");
      }
      showNotification("success", "Urutan tampil banner berhasil diperbarui.");
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan urutan.");
    }
  };

  // Delete banner
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/hero-banners/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus banner.");
      }

      setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      showNotification("success", `Banner "${deleteTarget.title}" berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (err: any) {
      showNotification("error", err.message || "Terjadi kesalahan saat menghapus.");
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCount = banners.filter((b) => b.isActive).length;

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
            <Sliders className="w-6 h-6 text-brand-black" />
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-brand-black">
              Kelola Hero Banner Carousel
            </h1>
          </div>
          <p className="text-xs text-brand-gray mt-1 uppercase tracking-wide">
            Atur gambar slide banner utama, judul, deskripsi, link kategori tujuan, dan urutan tampil pada halaman Home.
          </p>
        </div>

        <Button
          onClick={handleOpenAddModal}
          className="!bg-brand-black !text-brand-white hover:!bg-brand-dark flex items-center justify-center gap-2 !py-3 !px-6 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Banner Baru</span>
        </Button>
      </div>

      {/* Info Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-light p-4 border border-brand-light/80 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-light">
            Total Hero Banner
          </span>
          <span className="text-2xl font-black text-brand-black">
            {banners.length}
          </span>
        </div>
        <div className="bg-green-50/50 p-4 border border-green-200 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">
            Tampil di Home Carousel (Aktif)
          </span>
          <span className="text-2xl font-black text-green-800">
            {activeCount}
          </span>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-200 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Disembunyikan (Nonaktif)
          </span>
          <span className="text-2xl font-black text-gray-700">
            {banners.length - activeCount}
          </span>
        </div>
      </div>

      {/* Banners List */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-black uppercase tracking-wider text-brand-black">
          Daftar Slide Banner (Urutan Tampil Top ke Down)
        </span>

        {banners.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-brand-light bg-brand-white text-xs text-brand-gray-light font-bold uppercase tracking-widest">
            Belum ada Hero Banner. Klik tombol &ldquo;Tambah Banner Baru&rdquo; untuk membuat slide pertama.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {banners.map((item, index) => (
              <div
                key={item.id}
                className={`bg-brand-white border p-4 md:p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 transition-all shadow-sm ${
                  item.isActive ? "border-brand-light" : "border-gray-200 opacity-60 bg-gray-50"
                }`}
              >
                {/* Banner Thumbnail Preview */}
                <div className="relative w-full lg:w-72 h-44 bg-brand-black overflow-hidden shrink-0 group rounded-sm border border-brand-black/20">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 288px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                    <span className="bg-brand-black text-brand-white text-[9px] font-bold uppercase tracking-widest px-2 py-1">
                      Order #{item.order}
                    </span>
                  </div>
                </div>

                {/* Banner Details */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base md:text-lg font-black uppercase tracking-wide text-brand-black">
                      {item.title}
                    </h3>
                    <span
                      className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 border ${
                        item.isActive
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-gray-200 text-gray-700 border-gray-300"
                      }`}
                    >
                      {item.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-brand-gray line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-brand-black mt-2">
                    <div className="flex items-center gap-1.5 bg-brand-light px-3 py-1 border border-brand-light">
                      <span className="text-[10px] text-brand-gray uppercase">Tombol:</span>
                      <span className="font-bold uppercase tracking-wide">{item.buttonText}</span>
                    </div>

                    {item.categorySlug && (
                      <div className="flex items-center gap-1.5 bg-brand-light px-3 py-1 border border-brand-light">
                        <span className="text-[10px] text-brand-gray uppercase">Kategori Target:</span>
                        <span className="font-bold uppercase tracking-wide text-red-600">
                          {item.categorySlug}
                        </span>
                      </div>
                    )}

                    {item.buttonLink && (
                      <a
                        href={item.buttonLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] text-brand-gray hover:text-brand-black font-mono underline"
                      >
                        <span>{item.buttonLink}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Controls & Action Buttons */}
                <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-3 border-t lg:border-t-0 lg:border-l border-brand-light pt-4 lg:pt-0 lg:pl-6 shrink-0">
                  {/* Order Up/Down */}
                  <div className="flex items-center gap-1 bg-brand-light p-1 border border-brand-light">
                    <button
                      onClick={() => handleMoveOrder(index, "UP")}
                      disabled={index === 0}
                      className="p-1.5 hover:bg-brand-white disabled:opacity-30 transition-colors"
                      title="Naikkan Urutan"
                    >
                      <ArrowUp className="w-4 h-4 text-brand-black" />
                    </button>
                    <span className="text-xs font-bold px-2">{item.order}</span>
                    <button
                      onClick={() => handleMoveOrder(index, "DOWN")}
                      disabled={index === banners.length - 1}
                      className="p-1.5 hover:bg-brand-white disabled:opacity-30 transition-colors"
                      title="Turunkan Urutan"
                    >
                      <ArrowDown className="w-4 h-4 text-brand-black" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`p-2 border transition-colors ${
                        item.isActive
                          ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                      }`}
                      title={item.isActive ? "Nonaktifkan Banner" : "Aktifkan Banner"}
                    >
                      {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 bg-brand-white text-brand-black hover:bg-brand-light border border-brand-light transition-colors"
                      title="Edit Banner"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                      title="Hapus Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-brand-white border border-brand-black w-full max-w-xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-brand-light pb-4">
              <h2 className="text-lg font-black uppercase tracking-wider text-brand-black flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span>{editingItem ? "Edit Hero Banner" : "Tambah Hero Banner Baru"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-brand-gray hover:text-brand-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                  Judul Banner <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Oversized Streetwear Core"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: "" });
                  }}
                  className={`w-full border p-2.5 text-xs text-brand-black focus:outline-none uppercase ${
                    formErrors.title
                      ? "border-red-500 bg-red-50/30"
                      : "border-brand-light focus:border-brand-black"
                  }`}
                />
                {formErrors.title && (
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                    {formErrors.title}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                  Deskripsi Singkat Banner
                </label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat yang tampil di atas gambar banner..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-brand-light focus:border-brand-black p-2.5 text-xs text-brand-black focus:outline-none"
                />
              </div>

              {/* Image URL & Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                  Gambar Banner <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="URL gambar (https://...)"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      if (formErrors.imageUrl) setFormErrors({ ...formErrors, imageUrl: "" });
                    }}
                    className={`flex-1 border p-2.5 text-xs text-brand-black focus:outline-none font-mono ${
                      formErrors.imageUrl
                        ? "border-red-500 bg-red-50/30"
                        : "border-brand-light focus:border-brand-black"
                    }`}
                  />
                  <label className="bg-brand-black text-brand-white hover:bg-brand-dark px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
                {formErrors.imageUrl && (
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                    {formErrors.imageUrl}
                  </span>
                )}

                {/* Preview Image */}
                {formData.imageUrl && (
                  <div className="relative h-32 w-full bg-brand-black border border-brand-light overflow-hidden mt-1">
                    <Image
                      src={formData.imageUrl}
                      alt="Banner Preview"
                      fill
                      sizes="500px"
                      className="object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-[10px] text-brand-white font-bold uppercase tracking-wider">
                        Pratinjau Banner
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Button Text & Target Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Button Text */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                    Teks Tombol CTA
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Belanja Sekarang"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    className="w-full border border-brand-light focus:border-brand-black p-2.5 text-xs text-brand-black focus:outline-none uppercase"
                  />
                </div>

                {/* Category Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                    Kategori Target Shop
                  </label>
                  <select
                    value={formData.categorySlug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      setFormData({
                        ...formData,
                        categorySlug: slug,
                        buttonLink: slug ? `/shop?category=${slug}` : "/shop",
                      });
                    }}
                    className="w-full border border-brand-light focus:border-brand-black p-2.5 text-xs text-brand-black focus:outline-none uppercase bg-brand-white"
                  >
                    <option value="">-- Semua Produk (/shop) --</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name} ({cat.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Link (Manual URL override) */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-black">
                  URL Tujuan Tombol (Otomatis dari Kategori jika kosong)
                </label>
                <input
                  type="text"
                  placeholder="/shop?category=outerwear"
                  value={formData.buttonLink}
                  onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                  className="w-full border border-brand-light focus:border-brand-black p-2.5 text-xs text-brand-black focus:outline-none font-mono"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between border-t border-b border-brand-light py-3 my-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-black">
                    Status Aktif (Tampil di Home)
                  </span>
                  <span className="text-[10px] text-brand-gray uppercase">
                    Aktifkan agar banner ini muncul pada slider carousel di halaman Home
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 accent-brand-black cursor-pointer"
                />
              </div>

              {/* Actions */}
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
                    : "Tambah Banner"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-brand-white border border-red-600 w-full max-w-md shadow-2xl p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 border border-red-200 text-red-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-black uppercase tracking-wider text-brand-black">
                  Konfirmasi Hapus Banner
                </h3>
                <p className="text-xs text-brand-gray leading-relaxed">
                  Apakah Anda yakin ingin menghapus banner{" "}
                  <strong className="text-brand-black uppercase">&ldquo;{deleteTarget.title}&rdquo;</strong>?
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
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
                {isDeleting ? "Menghapus..." : "Ya, Hapus Banner"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
