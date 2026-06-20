---
description: # 🚀 Workflow: Phase 1 — Project Setup & Design System
---

# 🚀 Workflow: Phase 1 — Project Setup & Design System

Tahap ini berfokus pada inisialisasi project, instalasi dependencies, konfigurasi Tailwind CSS 4, setup Google Fonts Montserrat, dan pembuatan pondasi design system yang monochrome, bold & edgy.

---

## 🛠️ Prasyarat & Dokumen Acuan
- **Rules**: [design_system.md](file:///d:/BARBARA%20E-commerce/.agent/rules/design_system.md)
- **Skills**: [setup_design_system.md](file:///d:/BARBARA%20E-commerce/.agent/skills/setup_design_system.md)

---

## 📋 Langkah-Langkah (Step-by-Step)

### Langkah 1: Inisialisasi Project Next.js
1. Jalankan generator Next.js di terminal:
   ```bash
   npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
2. Pastikan versi Next.js minimal versi 15 dan React minimal versi 19.

### Langkah 2: Instalasi Dependencies Inti
1. Instal package pendukung yang didefinisikan dalam tech stack PRD:
   ```bash
   npm install @prisma/client zustand lucide-react framer-motion @hookform/resolvers react-hook-form zod swiper bcrypt next-auth@beta midtrans-client
   ```
2. Instal devDependencies:
   ```bash
   npm install -D prisma ts-node @types/bcrypt @types/node @types/react typescript eslint prettier eslint-config-prettier
   ```

### Langkah 3: Setup Font Montserrat
1. Edit file [layout.tsx](file:///d:/BARBARA%20E-commerce/src/app/layout.tsx) sesuai panduan **Skills: Setup Design System**.
2. Daftarkan CSS variable `--font-montserrat` dan integrasikan ke class HTML utama agar font Montserrat digunakan di seluruh bagian website secara default.

### Langkah 4: Konfigurasi Tailwind CSS 4 & Custom CSS
1. Edit file [globals.css](file:///d:/BARBARA%20E-commerce/src/app/globals.css).
2. Terapkan aturan monochrome color tokens dan mapping font family Montserrat yang didefinisikan di **Rules: Design System & Styling**.
3. Buat custom utility CSS classes seperti `.input-minimalist` untuk input field bergaya minimalis-underlined.

### Langkah 5: Pembuatan Reusable UI Components
Buat komponen visual dasar yang bebas dari rounded corners (ciri khas bold & edgy) di direktori `src/components/ui/`:
1. **[Button.tsx](file:///d:/BARBARA%20E-commerce/src/components/ui/Button.tsx)**: Implementasikan tombol dengan animasi hover inversi warna (hitam ⇄ putih) sesuai standar komponen di **Skills: Setup Design System**.
2. **Input.tsx**: Buat input dengan label text uppercase, berukuran kecil, dan menggunakan garis bawah saja sebagai pembatas border.
3. **Badge.tsx**: Untuk label status produk ("NEW", "SALE", "SOLD OUT") menggunakan layout flat tanpa border-radius.

---

## 🔍 Kriteria Lulus Uji (Verification)
- [ ] Project Next.js berjalan tanpa error saat dijalankan dengan perintah `npm run dev`.
- [ ] Font Montserrat berhasil dimuat di browser (bisa dicek melalui Inspect Element).
- [ ] Tombol-tombol UI menampilkan efek hover inversi warna yang smooth tanpa delay visual.
- [ ] Tampilan input field menggunakan border-bottom minimalis sesuai instruksi desain.
