---
description: # 🚀 Workflow: Phase 3 — Customer Frontend Features
---

# 🚀 Workflow: Phase 3 — Customer Frontend Features

Tahap ini berfokus pada implementasi halaman utama, katalog produk dengan filter dinamis, keranjang belanja Zustand, checkout flow, dan integrasi pembayaran Midtrans Snap di sisi client.

---

## 🛠️ Prasyarat & Dokumen Acuan
- **Rules**: [design_system.md](file:///d:/BARBARA%20E-commerce/.agent/rules/design_system.md), [payment.md](file:///d:/BARBARA%20E-commerce/.agent/rules/payment.md)
- **Skills**: [setup_design_system.md](file:///d:/BARBARA%20E-commerce/.agent/skills/setup_design_system.md), [cart_checkout.md](file:///d:/BARBARA%20E-commerce/.agent/skills/cart_checkout.md), [payment_integration.md](file:///d:/BARBARA%20E-commerce/.agent/skills/payment_integration.md)
- **Detail Rinci**:
  - Sinkronisasi Cart Zustand & Database: [cart_zustand_sync.md](file:///d:/BARBARA%20E-commerce/.agent/workflows/detail/cart_zustand_sync.md)
  - Pembayaran Midtrans Snap JS & Checkout: [midtrans_snap_checkout.md](file:///d:/BARBARA%20E-commerce/.agent/workflows/detail/midtrans_snap_checkout.md)

---

## 📋 Langkah-Langkah (Step-by-Step)

### Langkah 1: Homepage & Main Layout (`/`)
1. Implementasikan global Navbar (dengan link Shop, About, Contact, search icon, cart count, profile icon) dan global Footer.
2. Tampilkan section "New Arrivals" dan "Categories Grid" menggunakan data riil dari database.

### Langkah 2: Katalog Produk (`/shop`)
1. Buat halaman katalog produk dengan grid layout responsif (`grid-cols-2 md:grid-cols-4`).
2. Pasang filter sidebar/bar:
   - Filter Kategori.
   - Filter Ukuran: batasi hanya rentang ukuran **M, L, XL** (sesuai instruksi perubahan PRD).
   - Filter Harga (range slider) dan Sort by (terbaru, harga terendah, harga tertinggi).
3. Gunakan card komponen `ProductCard` dengan hover effect swap image (menampilkan gambar alternatif produk).

### Langkah 3: Detail Produk (`/shop/[slug]`)
1. Tampilkan Galeri Gambar dengan thumbnail di bawah gambar utama.
2. Buat pemilih varian (Size selector tombol M-XL, Color swatches visual).
3. Tampilkan panduan ukuran (Size Guide) berupa popup modal interaktif.
4. Buat tombol "ADD TO CART" dan "ADD TO WISHLIST" dengan micro-interaction transisi yang smooth.

### Langkah 4: Keranjang Belanja Zustand & DB Sync (`/cart`)
1. Buat file store Zustand di [useCartStore.ts](file:///d:/BARBARA%20E-commerce/src/stores/useCartStore.ts) sesuai panduan **Skills: Cart & Zustand State**.
2. Desain halaman keranjang belanja untuk menampilkan daftar item dan komponen `QuantitySelector`.
3. Implementasikan integrasi sinkronisasi cart dari LocalStorage ke database PostgreSQL saat user login sesuai dengan langkah logis di **Detail: Zustand Cart Sync**.

### Langkah 5: Proses Checkout & Integrasi Midtrans Snap (`/checkout`)
1. Desain form alamat pengiriman yang terikat dengan validation Zod & React Hook Form.
2. Terapkan pemanggilan API token Snap, loading script Snap, dan handler event callback pembayaran Snap secara runut sesuai di **Detail: Midtrans Snap Checkout**.

---

## 🔍 Kriteria Lulus Uji (Verification)
- [ ] Fitur cart dapat menyimpan item secara persisten saat halaman di-refresh.
- [ ] Filter ukuran pada halaman shop membatasi pencarian hanya pada kategori M, L, XL.
- [ ] Tombol bayar pada checkout berhasil menghubungi API `/api/payment/create` dan menampilkan popup modal Midtrans Snap.
- [ ] Cart otomatis kosong (`clearCart()`) setelah transaksi Snap berhasil di-generate.
