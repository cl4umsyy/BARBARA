# 📏 Rules: SEO & Web Performance (BARBARA E-Commerce)

File ini mendefinisikan aturan dan target untuk Search Engine Optimization (SEO) serta optimasi performa web pada proyek BARBARA E-Commerce.

---

## 1. SEO Implementation Rules

### 1.1 Dynamic Metadata Generation
Setiap halaman Next.js wajib mendefinisikan metadata secara statis atau dinamis menggunakan API metadata Next.js:
- **Static Pages** (About, Contact, FAQ, Size Guide): Definisikan objek `metadata` di `page.tsx` masing-masing halaman.
- **Dynamic Pages** (Product Detail `/shop/[slug]`): Wajib menggunakan fungsi `generateMetadata` untuk mengambil nama produk, deskripsi singkat, dan gambar produk, lalu memetakan ke OpenGraph meta tags secara dinamis.
- **Fallbacks**: Semua metadata harus memiliki fallback value default yang mengarah ke brand BARBARA.

### 1.2 Structured Data (Schema Markup)
- **Product Schema**: Halaman detail produk wajib merender skema JSON-LD (`application/ld+json`) yang berisi informasi terstruktur produk: Nama, Image, Description, SKU, Offers (Price, Currency, Availability - InStock/OutOfStock).
- **Breadcrumb Schema**: Halaman katalog dan detail produk wajib menyertakan skema BreadcrumbList untuk memudahkan Google merayapi struktur navigasi.

### 1.3 Sitemap & Robots.txt
- Wajib memiliki generator sitemap otomatis di `src/app/sitemap.ts` yang menyertakan rute statis dan semua dynamic product slugs dari database.
- File `src/app/robots.txt` harus dikonfigurasi untuk membolehkan perayapan di seluruh halaman katalog produk, tetapi memblokir perayapan di halaman `/cart`, `/checkout`, `/account/*`, dan `/admin/*`.

---

## 2. Performance & Web Vitals Constraints

Semua halaman utama harus dioptimasi agar memenuhi Core Web Vitals target dari Google Lighthouse:

### 2.1 Image Optimization Standard
- **Next.js Image**: Semua render gambar lokal dan eksternal wajib menggunakan komponen `<Image />` dari `next/image`. Dilarang menggunakan tag HTML `<img>` biasa kecuali untuk inline SVG kecil.
- **Responsive Sizes**: Tentukan atribut `sizes` secara presisi agar browser mendownload resolusi gambar yang sesuai dengan viewport (tidak mendownload file gambar berukuran raksasa pada layar mobile).
- **Format**: Gunakan format WebP atau AVIF dengan optimasi kompresi otomatis oleh Next.js server.
- **Priority**: Tambahkan atribut `priority` pada gambar Hero Banner di homepage dan main image di product detail page untuk menekan nilai LCP (Largest Contentful Paint).

### 2.2 Rendering Strategy
- **Static Site Generation (SSG)** / **Incremental Static Regeneration (ISR)**: Gunakan ISR pada katalog produk (`/shop`) dan detail produk (`/shop/[slug]`) dengan revalidation period (misal `revalidate: 3600` / 1 jam) agar halaman dimuat instan tetapi datanya tetap ter-update.
- **Server Side Rendering (SSR)**: Gunakan SSR hanya untuk halaman yang membutuhkan data real-time per user (Cart, Checkout, Account Profile, Admin Dashboard).
- **Client Side Components (`"use client"`)**: Batasi penggunaan client components hanya pada elemen interaktif yang membutuhkan hooks React (state, context, effects). Layout utama dan container page wajib tetap berupa Server Components.
