---
description: # 🚀 Workflow: Phase 2 — Database & Backend Implementation
---

# 🚀 Workflow: Phase 2 — Database & Backend Implementation

Tahap ini berfokus pada inisialisasi database PostgreSQL, pembuatan relasi skema Prisma, seeding data produk fashion, konfigurasi NextAuth.js (Auth.js) v5, dan proteksi server middleware.

---

## 🛠️ Prasyarat & Dokumen Acuan
- **Rules**: [database.md](file:///d:/BARBARA%20E-commerce/.agent/rules/database.md), [auth.md](file:///d:/BARBARA%20E-commerce/.agent/rules/auth.md)
- **Skills**: [database_operations.md](file:///d:/BARBARA%20E-commerce/.agent/skills/database_operations.md), [auth_implementation.md](file:///d:/BARBARA%20E-commerce/.agent/skills/auth_implementation.md)
- **Detail Rinci**:
  - Referensi Skema Database Kompleks: [database_schema.md](file:///d:/BARBARA%20E-commerce/.agent/workflows/detail/database_schema.md)
  - Referensi Setup Autentikasi NextAuth: [auth_setup.md](file:///d:/BARBARA%20E-commerce/.agent/workflows/detail/auth_setup.md)

---

## 📋 Langkah-Langkah (Step-by-Step)

### Langkah 1: Setup PostgreSQL & Prisma
1. Inisialisasi Prisma di dalam project:
   ```bash
   npx prisma init
   ```
2. Hubungkan database PostgreSQL Anda dengan menuliskan URI di file `.env.local` pada variabel `DATABASE_URL`.
3. Definisikan tabel dan relasi pada file `schema.prisma` sesuai panduan rinci **Detail: Database Schema**. Pastikan relasi Cascade terpasang secara tepat.
4. Lakukan sinkronisasi skema ke database:
   ```bash
   npx prisma db push
   ```

### Langkah 2: Buat Prisma Client Singleton
1. Buat file helper [prisma.ts](file:///d:/BARBARA%20E-commerce/src/lib/prisma.ts) di bawah folder `src/lib/`.
2. Gunakan implementasi singleton sesuai di **Skills: Database Operations** untuk mencegah memory leaks.

### Langkah 3: Buat Database Seeder
1. Buat file [seed.ts](file:///d:/BARBARA%20E-commerce/prisma/seed.ts) berdasarkan template di **Skills: Database Operations**.
2. Daftarkan script seed di `package.json` dan jalankan perintah `npx prisma db seed` untuk memuat data kategori utama dan produk sampel BARBARA lengkap dengan varian ukuran (M-XL) dan stok awal.

### Langkah 4: Konfigurasi NextAuth.js v5 (Auth.js)
1. Konfigurasikan konfigurasi runtime utama di `src/lib/auth.ts`.
2. Implementasikan `CredentialsProvider` menggunakan validasi `bcrypt` untuk email-password, dan setup callback `JWT` & `Session` sesuai struktur detail di **Detail: NextAuth Configuration**.
3. Buat route API NextAuth di [route.ts](file:///d:/BARBARA%20E-commerce/src/app/api/auth/%5B...nextauth%5D/route.ts).

### Langkah 5: Proteksi Route via Middleware
1. Buat file [middleware.ts](file:///d:/BARBARA%20E-commerce/src/middleware.ts) di folder `src/`.
2. Definisikan logika proteksi halaman edge (redirect pengguna non-login ke `/auth/login` dan memblokir non-admin dari folder `/admin/*`). Rujuk ke kode di **Detail: NextAuth Configuration** untuk contoh penulisan logic middleware yang presisi.

---

## 🔍 Kriteria Lulus Uji (Verification)
- [ ] Database PostgreSQL terhubung dan perintah `npx prisma db push` berhasil tanpa error migrasi.
- [ ] Database terisi data seed awal secara sukses dan bisa diverifikasi dengan membuka `npx prisma studio`.
- [ ] Halaman `/admin` berhasil me-redirect user non-login ke `/auth/login`.
- [ ] API endpoint `/api/auth/session` mengembalikan data user beserta atribut `role` setelah user berhasil login.
