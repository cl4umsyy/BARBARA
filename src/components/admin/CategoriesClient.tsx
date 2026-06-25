"use client";

import React, { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Tag, Search, X, Loader2, ImageIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  createdAt: string;
}

interface CategoriesClientProps {
  initialCategories: Category[];
}

/* ─────────────────────────────── helpers ─────────────────────────── */
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

/* ─────────────────────────────── modal ──────────────────────────── */
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}
function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg bg-brand-white border border-brand-light rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-brand-light">
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-black">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-brand-gray-light hover:text-brand-black transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── form ───────────────────────────── */
interface CategoryFormProps {
  initial?: Partial<Category>;
  onSubmit: (data: { name: string; description: string; imageUrl: string }) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}
function CategoryForm({ initial, onSubmit, onClose, loading }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!initial?.id) setSlug(slugify(val)); // auto-slug only for new
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, description, imageUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-brand-gray mb-1.5">
          Nama Kategori <span className="text-red-500">*</span>
        </label>
        <input
          value={name}
          onChange={handleNameChange}
          required
          placeholder="Contoh: T-Shirts"
          className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm font-medium text-brand-black focus:outline-none focus:border-brand-black transition-colors"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-brand-gray mb-1.5">
          Slug
        </label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="t-shirts"
          className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm font-mono text-brand-gray bg-[#fafafa] focus:outline-none focus:border-brand-black transition-colors"
        />
        <p className="mt-1 text-[10px] text-brand-gray-light">
          Dibuat otomatis dari nama kategori. Dapat diubah manual.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-brand-gray mb-1.5">
          Deskripsi <span className="text-brand-gray-light">(opsional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Deskripsi singkat kategori..."
          className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm font-medium text-brand-black resize-none focus:outline-none focus:border-brand-black transition-colors"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-brand-gray mb-1.5">
          URL Gambar <span className="text-brand-gray-light">(opsional)</span>
        </label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full border border-brand-light rounded-xl px-4 py-3 text-sm font-medium text-brand-black focus:outline-none focus:border-brand-black transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 border border-brand-light text-brand-gray text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-brand-light/30 transition-colors cursor-pointer disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-brand-black text-brand-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {initial?.id ? "Simpan Perubahan" : "Tambah Kategori"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────── main ───────────────────────────── */
export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  /* ── refresh from API ── */
  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  /* ── add ── */
  const handleAdd = async (data: { name: string; description: string; imageUrl: string }) => {
    setFormLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambah kategori");
      await refresh();
      setShowAddModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  /* ── edit ── */
  const handleEdit = async (data: { name: string; description: string; imageUrl: string }) => {
    if (!editTarget) return;
    setFormLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui kategori");
      await refresh();
      setEditTarget(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus kategori");
      await refresh();
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-brand-black">
            Kategori
          </h1>
          <p className="text-xs text-brand-gray-light mt-1">
            {categories.length} kategori terdaftar
          </p>
        </div>
        <button
          onClick={() => { setError(null); setShowAddModal(true); }}
          className="inline-flex items-center gap-2 bg-brand-black text-brand-white text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-brand-dark transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-3 rounded-xl">
          <X className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-light" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau slug kategori..."
          className="w-full pl-11 pr-4 py-3 border border-brand-light rounded-xl text-sm text-brand-black focus:outline-none focus:border-brand-black transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-gray-light hover:text-brand-black cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-brand-light rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#fafafa] border-b border-brand-light">
                <th className="text-left font-black uppercase tracking-widest text-brand-gray px-6 py-4">
                  Kategori
                </th>
                <th className="text-left font-black uppercase tracking-widest text-brand-gray px-6 py-4">
                  Slug
                </th>
                <th className="text-center font-black uppercase tracking-widest text-brand-gray px-6 py-4">
                  Produk
                </th>
                <th className="text-left font-black uppercase tracking-widest text-brand-gray px-6 py-4">
                  Dibuat
                </th>
                <th className="text-center font-black uppercase tracking-widest text-brand-gray px-6 py-4">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Tag className="w-8 h-8 text-brand-light mx-auto mb-3" />
                    <p className="font-bold uppercase tracking-widest text-brand-gray-light">
                      {search ? "Kategori tidak ditemukan" : "Belum ada kategori"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#fafafa] transition-colors">
                    {/* Name + image */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-light flex-shrink-0 bg-brand-light/20 flex items-center justify-center">
                          {cat.imageUrl ? (
                            <img
                              src={cat.imageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-brand-gray-light" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-brand-black">{cat.name}</p>
                          {cat.description && (
                            <p className="text-[10px] text-brand-gray-light truncate max-w-[200px]">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] bg-brand-light/30 px-2 py-1 rounded-lg text-brand-gray">
                        {cat.slug}
                      </span>
                    </td>

                    {/* Product count */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          cat.productCount > 0
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-brand-light/30 text-brand-gray-light border-brand-light"
                        }`}
                      >
                        {cat.productCount} produk
                      </span>
                    </td>

                    {/* Created at */}
                    <td className="px-6 py-4 text-brand-gray-light">
                      {fmt.format(new Date(cat.createdAt))}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setError(null); setEditTarget(cat); }}
                          title="Edit"
                          className="p-2 rounded-lg border border-brand-light hover:border-brand-black hover:bg-brand-black hover:text-brand-white text-brand-gray transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setError(null); setDeleteTarget(cat); }}
                          title="Hapus"
                          className="p-2 rounded-lg border border-brand-light hover:border-red-500 hover:bg-red-500 hover:text-white text-brand-gray transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Tambah Kategori" onClose={() => setShowAddModal(false)}>
          <CategoryForm
            onSubmit={handleAdd}
            onClose={() => setShowAddModal(false)}
            loading={formLoading}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title="Edit Kategori" onClose={() => setEditTarget(null)}>
          <CategoryForm
            initial={editTarget}
            onSubmit={handleEdit}
            onClose={() => setEditTarget(null)}
            loading={formLoading}
          />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title="Hapus Kategori" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-5">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-black">
                  Hapus &ldquo;{deleteTarget.name}&rdquo;?
                </p>
                <p className="text-xs text-brand-gray-light mt-1">
                  {deleteTarget.productCount > 0
                    ? `Kategori ini memiliki ${deleteTarget.productCount} produk dan tidak dapat dihapus.`
                    : "Tindakan ini tidak dapat dibatalkan."}
                </p>
              </div>
            </div>

            {deleteTarget.productCount > 0 ? (
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-full bg-brand-black text-brand-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-brand-dark transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteLoading}
                  className="flex-1 border border-brand-light text-brand-gray text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-brand-light/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-500 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Hapus
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
