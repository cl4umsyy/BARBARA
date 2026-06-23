"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ShopErrorFallbackProps {
  error?: string;
  code?: string;
  title?: string;
  message?: string;
  suggestion?: string;
}

export const ShopErrorFallback: React.FC<ShopErrorFallbackProps> = ({
  error = "Koneksi database gagal atau terputus.",
  code = "DATABASE_CONNECTION_ERROR",
  title = "Layanan Toko Terganggu",
  message = "Maaf, kami sedang mengalami kendala dalam menghubungkan ke database toko kami. Halaman ini gagal dimuat karena kesalahan koneksi berikut:",
  suggestion = "Periksa kembali konfigurasi DATABASE_URL pada project settings Vercel Anda dan pastikan tidak terblokir atau salah ketik, lalu deploy ulang. Pastikan juga Anda menggunakan port 6543 (Connection Pooler) di serverless.",
}) => {
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="w-full bg-brand-white py-20 md:py-28 font-sans">
      <div className="mx-auto max-w-xl px-6 text-center flex flex-col items-center gap-6">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 bg-red-50 border border-red-200 flex items-center justify-center rounded-full text-red-600 mb-2">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-brand-black">
          {title}
        </h1>

        {/* Description Message */}
        <p className="text-xs md:text-sm text-brand-gray leading-relaxed max-w-md">
          {message}
        </p>

        {/* Diagnostic Logs Console */}
        <div className="w-full p-4 bg-red-50/50 border border-red-100 rounded-xl text-left text-[11px] font-mono text-red-800 break-words flex flex-col gap-1">
          <div>
            <span className="font-bold text-red-900">Code:</span> {code}
          </div>
          <div>
            <span className="font-bold text-red-900">Diagnostics:</span> {error}
          </div>
        </div>

        {/* Developer Action Hint */}
        <p className="text-[11px] text-brand-gray-light leading-relaxed max-w-sm">
          💡 <strong>Saran perbaikan:</strong> {suggestion}
        </p>

        {/* Actions Button Row */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-4">
          <button
            onClick={handleReload}
            className="flex-1 flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs border-2 border-brand-black bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black px-6 py-4 rounded-xl transition-all duration-300 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang
          </button>
          
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 font-black uppercase tracking-wider text-xs border-2 border-brand-light bg-brand-white text-brand-black hover:bg-brand-light px-6 py-4 rounded-xl transition-all duration-300 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
};
