---
description: # 🚀 Workflow: Phase 5 — QA Testing, SEO, & Deployment
---

# 🚀 Workflow: Phase 5 — QA Testing, SEO, & Deployment

Tahap akhir ini berfokus pada pengujian integrasi payment gateway secara real-time di localhost, penataan SEO, optimasi performa web vitals, dan deployment project fullstack ke Vercel.

---

## 🛠️ Prasyarat & Dokumen Acuan
- **Rules**: [seo_performance.md](file:///d:/BARBARA%20E-commerce/.agent/rules/seo_performance.md), [payment.md](file:///d:/BARBARA%20E-commerce/.agent/rules/payment.md)
- **Skills**: [payment_integration.md](file:///d:/BARBARA%20E-commerce/.agent/skills/payment_integration.md)
- **Detail Rinci**:
  - Setup Webhook Lokal & Ngrok: [webhook_verification.md](file:///d:/BARBARA%20E-commerce/.agent/workflows/detail/webhook_verification.md)

---

## 📋 Langkah-Langkah (Step-by-Step)

### Langkah 1: Pengujian Webhook Midtrans Lokal (via Ngrok)
Karena Midtrans membutuhkan internet-accessible URL untuk mengirim callback, gunakan port forwarding di local development:
1. Jalankan aplikasi local: `npm run dev` (berjalan di port `3000`).
2. Terapkan konfigurasi Ngrok, parameter URL webhook pada dashboard Midtrans, serta penulisan logic validasi SHA512 signature key di backend Anda sesuai panduan di **Detail: Webhook Verification & Ngrok**.
3. Lakukan checkout simulasi menggunakan Simulator Kartu Kredit / Virtual Account di Sandbox Midtrans. Pastikan status order di database berubah otomatis menjadi `PAID` / `PROCESSING` saat status di simulator sukses.

### Langkah 2: Setup SEO & Metadata
1. Konfigurasikan dynamic metadata di file `src/app/shop/[slug]/page.tsx` sesuai pedoman di **Rules: SEO & Web Performance**.
2. Pasang JSON-LD script tag di dalam Product Detail Page untuk menyajikan skema perayapan mesin pencari.
3. Buat sitemap dinamis di `src/app/sitemap.ts` dan buat file `src/app/robots.txt` untuk mengatur hak akses crawling bot Google.

### Langkah 3: Optimasi Performa & Web Vitals
1. Ganti semua penggunaan tag `<img>` dengan komponen `<Image />` dari `next/image` di seluruh file frontend.
2. Tambahkan properti `priority` pada gambar hero utama di home dan main product image di detail page untuk meningkatkan skor LCP.
3. Jalankan build lokal `npm run build` untuk memeriksa apakah terdapat error kompilasi TypeScript atau CSS.

### Langkah 4: Deployment ke Vercel
1. Hubungkan repository GitHub Anda ke Vercel.
2. Buat project baru di Vercel Dashboard dan arahkan ke repo tersebut.
3. Daftarkan seluruh list environment variables di panel pengaturan Vercel Environment Variables sesuai dengan daftar di appendix [PRD.md](file:///d:/BARBARA%20E-commerce/PRD.md).
4. Daftarkan postinstall script di `package.json` untuk menjalankan `prisma generate` secara otomatis:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```
5. Trigger build production di Vercel.

---

## 🔍 Kriteria Lulus Uji (Verification)
- [ ] Pengujian webhook di localhost via Ngrok berjalan sukses dan status order berhasil di-update tanpa manipulasi signature key.
- [ ] File `sitemap.xml` dan `robots.txt` dapat diakses secara online di production domain.
- [ ] Google Lighthouse Performance Score pada production build melebihi angka 90 untuk kategori SEO dan Best Practices.
- [ ] Transaksi real menggunakan akun Sandbox Midtrans berhasil diselesaikan dan dicatat secara akurat di database produksi.
