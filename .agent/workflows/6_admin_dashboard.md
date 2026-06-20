---
description: # 🚀 Workflow: Phase 4 — Admin Dashboard Features
---

# 🚀 Workflow: Phase 4 — Admin Dashboard Features

Tahap ini berfokus pada pembangunan halaman administrasi terproteksi (`/admin/*`) untuk mengelola inventaris produk, melacak pesanan masuk, melihat statistik penjualan, dan mengelola pengguna.

---

## 🛠️ Prasyarat & Dokumen Acuan
- **Rules**: [auth.md](file:///d:/BARBARA%20E-commerce/.agent/rules/auth.md), [database.md](file:///d:/BARBARA%20E-commerce/.agent/rules/database.md)
- **Skills**: [auth_implementation.md](file:///d:/BARBARA%20E-commerce/.agent/skills/auth_implementation.md), [database_operations.md](file:///d:/BARBARA%20E-commerce/.agent/skills/database_operations.md)
- **Detail Rinci**:
  - CRUD Produk & Dynamic Varian: [admin_product_variants.md](file:///d:/BARBARA%20E-commerce/.agent/workflows/detail/admin_product_variants.md)

---

## 📋 Langkah-Langkah (Step-by-Step)

### Langkah 1: Setup Admin Layout & Sidebar Navigation
1. Buat layout khusus admin di `src/app/admin/layout.tsx` yang mencakup sidebar menu: Dashboard, Products, Orders, Customers, dan Settings.
2. Integrasikan middleware pengaman agar layout ini mengidentifikasi `session.user.role === 'ADMIN'`. Jika bukan admin, bypass ke halaman utama.

### Langkah 2: Dashboard Overview & Analytics
1. Tampilkan Stats Cards utama: Total Revenue, Total Orders, Total Customers, dan Total Products.
2. Buat grafik visual pergerakan revenue harian/mingguan memanfaatkan chart library sederhana.
3. Tampilkan tabel berisi 5 transaksi pesanan terbaru.

### Langkah 3: CRUD Manajemen Produk & Varian (`/admin/products`)
1. **Daftar Produk**: Buat tabel inventaris yang mencantumkan nama, kategori, harga, sisa stok total, status aktif, dan opsi edit/hapus.
2. **Tambah & Edit Produk**: Desain form input yang mencakup data dasar produk.
3. Implementasikan pengelolaan varian warna dan ukuran (M, L, XL) serta unggah multi-gambar produk menggunakan alur yang dijelaskan pada **Detail: Admin Product CRUD**.

### Langkah 4: Manajemen Pesanan (`/admin/orders`)
1. Tampilkan tabel transaksi masuk lengkap dengan status pembayaran dan status pemrosesan.
2. Buat halaman detail order (`/admin/orders/[id]`) untuk menampilkan data alamat kirim, detail produk yang dipesan, dan timeline status.
3. Sediakan dropdown/tombol bagi admin untuk memperbarui status pesanan secara manual (contoh: mengubah dari `PROCESSING` ke `SHIPPED` dan menginput nomor resi).

---

## 🔍 Kriteria Lulus Uji (Verification)
- [ ] Hanya user dengan role `ADMIN` yang dapat membuka halaman `/admin` tanpa mengalami redirect.
- [ ] Form tambah produk berhasil memvalidasi input harga menggunakan Zod dan menyimpannya sebagai tipe Decimal di database.
- [ ] Tombol delete produk menghapus data gambar dan varian terkait secara otomatis (`onDelete: Cascade`).
- [ ] Perubahan status order di panel admin tercermin secara instan di database.
