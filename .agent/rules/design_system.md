# 📏 Rules: Design System & Styling (BARBARA E-Commerce)

File ini mendefinisikan aturan visual, warna, tipografi, dan gaya penulisan stylesheet untuk proyek BARBARA E-Commerce. Semua agent yang berkontribusi pada codebase ini harus mematuhi aturan berikut.

---

## 1. Color System (Strict Monochrome)
BARBARA menggunakan palet warna monochrome murni dengan warna semantik yang terbatas untuk indikator status. **Dilarang menggunakan warna aksen non-monochrome di luar daftar berikut.**

### CSS Variables / Tailwind Utility Mapping:
- **Primary Black**: `#000000` (Tailwind: `bg-black`, `text-black`)
- **Secondary Dark**: `#1A1A1A` (Tailwind: `bg-[#1a1a1a]`, `text-[#1a1a1a]`)
- **Body Gray**: `#333333` (Tailwind: `text-[#333333]`)
- **Disabled/Placeholder Gray**: `#999999` (Tailwind: `text-[#999999]`, `border-[#999999]`)
- **Light Background**: `#F5F5F5` (Tailwind: `bg-[#f5f5f5]`)
- **Pure White**: `#FFFFFF` (Tailwind: `bg-white`, `text-white`)

### Semantic Colors (Hanya untuk Status):
- **Success**: `#22C55E` (Tailwind: `text-green-500` / `bg-green-500`) - Untuk stok tersedia, transaksi sukses.
- **Error**: `#EF4444` (Tailwind: `text-red-500` / `bg-red-500`) - Untuk stok kosong, error validasi, gagal bayar.
- **Warning**: `#F59E0B` (Tailwind: `text-amber-500` / `bg-amber-500`) - Untuk stok menipis (< 5 pcs).

---

## 2. Typography Rules
Semua elemen teks harus menggunakan font **Montserrat** dengan aturan formatting berikut:

- **Logo**: Montserrat 900 (Black), uppercase, tracking-wider (letter-spacing).
- **H1 (Hero Heading)**: Montserrat 800 (ExtraBold), uppercase, tracking-widest (minimal `tracking-[0.15em]`), size `text-4xl md:text-7xl`.
- **H2 (Section Heading)**: Montserrat 700 (Bold), uppercase, tracking-wider, size `text-3xl md:text-5xl`.
- **H3 (Subheading)**: Montserrat 700 (Bold), uppercase, size `text-2xl md:text-3xl`.
- **Body Text**: Montserrat 400 (Regular), normal case, line-height `leading-relaxed`.
- **Buttons**: Montserrat 700 (Bold), uppercase, tracking-widest (minimal `tracking-[0.2em]`).
- **Prices**: Montserrat 700 (Bold), tracking-tight.

---

## 3. Layout & Grid Standards
- **Grid Layout**: Gunakan grid 12-kolom pada desktop (`grid-cols-12`).
- **Container**: Batasi container utama dengan `max-w-7xl` (1440px) dan tambahkan padding horizontal yang konsisten (`px-4 md:px-8 lg:px-16`).
- **Spacing Scale**: Gunakan kelipatan 8px (Tailwind space/padding/margin helpers: `p-2`, `p-4`, `p-6`, `p-8`, `p-12`, `p-16`).
- **Aspect Ratio**: 
  - Gambar produk wajib menggunakan rasio **3:4** (portrait layout) dengan `object-cover`.
  - Gambar banner menggunakan rasio **16:9** atau full viewport `h-screen`.

---

## 4. Component Styling Rules

### 4.1 Buttons
- **Primary Button**: Background hitam, teks putih, tanpa rounded corners (`rounded-none`), padding tinggi (`py-4 px-10`), uppercase. Efek hover wajib melakukan **inversi warna** (background putih, border 2px solid hitam, teks hitam) secara smooth.
- **Secondary Button**: Border 2px solid hitam, background transparan, teks hitam, tanpa rounded corners (`rounded-none`). Efek hover mengisi background menjadi hitam penuh dengan teks putih.

### 4.2 Input Fields
- Wajib menggunakan design **minimalist-underlined**. Input field tidak boleh memiliki border box penuh. Gunakan border bawah saja (`border-b border-[#e0e0e0] border-t-0 border-x-0 bg-transparent rounded-none outline-none focus:border-black transition-colors`).
- Label input diletakkan di atas input field, menggunakan font-size kecil (`text-xs`), uppercase, dan tracking-wider.

### 4.3 Badges (NEW, SALE, SOLD OUT)
- Badges menggunakan background hitam solid dengan teks putih atau border hitam tipis tanpa rounded corners.
- Wajib menggunakan uppercase.

---

## 5. Transition & Animation Guidelines
Semua animasi wajib menggunakan **Framer Motion** untuk menjaga konsistensi micro-interactions:
- **Hover Transitions**: Wajib menambahkan `transition-all duration-300 ease-out` pada hover properties.
- **Page Transitions**: Transisi antar halaman wajib menggunakan simple fade-in dan subtle slide up.
- **Staggered Animations**: Komponen list (seperti grid produk) wajib dirender dengan animasi staggered (satu per satu dengan delay 50-100ms).
