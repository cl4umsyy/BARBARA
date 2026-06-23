"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Save, MapPin, Phone, Mail, Clock } from "lucide-react";

interface ContactInfo {
  storeName: string;
  description: string;
  address: string;
  whatsapp: string;
  email: string;
  businessHours: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  googleMapsUrl: string;
}

export const SettingsFormClient: React.FC = () => {
  const [formData, setFormData] = useState<ContactInfo>({
    storeName: "",
    description: "",
    address: "",
    whatsapp: "",
    email: "",
    businessHours: "",
    instagramUrl: "",
    tiktokUrl: "",
    facebookUrl: "",
    googleMapsUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch initial contact information
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const res = await fetch("/api/contact");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            storeName: data.storeName || "",
            description: data.description || "",
            address: data.address || "",
            whatsapp: data.whatsapp || "",
            email: data.email || "",
            businessHours: data.businessHours || "",
            instagramUrl: data.instagramUrl || "",
            tiktokUrl: data.tiktokUrl || "",
            facebookUrl: data.facebookUrl || "",
            googleMapsUrl: data.googleMapsUrl || "",
          });
        } else {
          setErrorMsg("Gagal memuat informasi kontak dari database.");
        }
      } catch (err) {
        console.error("Error fetching contact info:", err);
        setErrorMsg("Koneksi gagal saat memuat informasi kontak.");
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    // Validation checks
    if (
      !formData.storeName ||
      !formData.description ||
      !formData.address ||
      !formData.whatsapp ||
      !formData.email ||
      !formData.businessHours
    ) {
      setErrorMsg("Nama toko, deskripsi, alamat, WhatsApp, email, dan jam operasional wajib diisi.");
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const res = await fetch("/api/admin/contact", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMsg("Informasi kontak toko berhasil diperbarui.");
        // Smooth scroll to top to see notification
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrorMsg(result.error || "Gagal memperbarui informasi kontak.");
      }
    } catch (err) {
      console.error("Error saving contact info:", err);
      setErrorMsg("Terjadi kesalahan jaringan saat menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-black" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Alert Banners */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-xl p-4 uppercase tracking-wider leading-relaxed">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl p-4 uppercase tracking-wider leading-relaxed">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-brand-light bg-brand-white p-6 md:p-8 space-y-6 rounded-2xl shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black border-b border-brand-light pb-3">
              Informasi Toko Utama
            </h2>

            {/* Store Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                  Nama Toko *
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="Contoh: BARBARA"
                  className="input-minimalist font-bold text-xs uppercase tracking-wider"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                  Email Layanan Pelanggan *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Contoh: contact@barbarastore.com"
                  className="input-minimalist font-bold text-xs"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                Deskripsi Toko *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tuliskan deskripsi singkat mengenai toko..."
                rows={4}
                className="w-full bg-brand-light border border-transparent py-3 px-4 outline-none rounded-xl text-brand-black placeholder-brand-gray-light focus:border-brand-black focus:bg-brand-white transition-all duration-200 font-medium text-xs leading-relaxed resize-none"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                Alamat Toko Lengkap *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Tuliskan alamat fisik lengkap..."
                rows={3}
                className="w-full bg-brand-light border border-transparent py-3 px-4 outline-none rounded-xl text-brand-black placeholder-brand-gray-light focus:border-brand-black focus:bg-brand-white transition-all duration-200 font-bold text-xs leading-relaxed resize-none"
                required
              />
            </div>
          </div>

          {/* Socials & Media Links */}
          <div className="border border-brand-light bg-brand-white p-6 md:p-8 space-y-6 rounded-2xl shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black border-b border-brand-light pb-3">
              Media Sosial & Tautan Lokasi
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                  URL Instagram
                </label>
                <input
                  type="url"
                  name="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={handleChange}
                  placeholder="https://instagram.com/..."
                  className="input-minimalist text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                  URL TikTok
                </label>
                <input
                  type="url"
                  name="tiktokUrl"
                  value={formData.tiktokUrl}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@..."
                  className="input-minimalist text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                  URL Facebook
                </label>
                <input
                  type="url"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleChange}
                  placeholder="https://facebook.com/..."
                  className="input-minimalist text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                  URL Google Maps
                </label>
                <input
                  type="url"
                  name="googleMapsUrl"
                  value={formData.googleMapsUrl}
                  onChange={handleChange}
                  placeholder="https://maps.app.goo.gl/..."
                  className="input-minimalist text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Panel for Communications & Save Actions */}
        <div className="space-y-6">
          <div className="border border-brand-light bg-brand-white p-6 md:p-8 space-y-6 rounded-2xl shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-black border-b border-brand-light pb-3">
              Komunikasi & Waktu
            </h2>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                WhatsApp Business *
              </label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="628xxxxxxxxxx (Format kode negara)"
                className="input-minimalist font-bold text-xs"
                required
              />
              <p className="text-[9px] text-brand-gray-light font-medium leading-relaxed">
                Gunakan angka tanpa spasi atau simbol plus (+), e.g., 6281234567890.
              </p>
            </div>

            {/* Business Hours */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                Jam Operasional *
              </label>
              <input
                type="text"
                name="businessHours"
                value={formData.businessHours}
                onChange={handleChange}
                placeholder="Contoh: Senin - Minggu, 09.00 - 21.00 WIB"
                className="input-minimalist font-bold text-xs"
                required
              />
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-brand-black text-brand-white text-xs font-black uppercase tracking-widest hover:opacity-95 disabled:opacity-40 transition-opacity rounded-xl cursor-pointer shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
