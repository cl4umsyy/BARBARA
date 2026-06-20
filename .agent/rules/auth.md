# 📏 Rules: Authentication & Security (BARBARA E-Commerce)

File ini mendefinisikan aturan keamanan, autentikasi pengguna, otorisasi, dan proteksi endpoint pada proyek BARBARA E-Commerce menggunakan NextAuth.js (Auth.js) v5.

---

## 1. Authentication Engine Setup
- **Framework**: NextAuth.js (Auth.js) versi 5 (App Router compatible).
- **Session Strategy**: Database-backed sessions atau JWT (JSON Web Token) strategy. Jika menggunakan database session, integrasikan dengan PrismaAdapter.
- **Providers**:
  1. **Credentials Provider**: Login menggunakan email & password. Password wajib di-hash menggunakan **bcrypt** atau **argon2** sebelum disimpan ke database. Dilarang menyimpan password dalam bentuk plaintext.
  2. **Social Login Providers**: Google OAuth & Facebook OAuth. Email dari OAuth provider harus diverifikasi dan dicocokkan dengan akun lokal jika emailnya sama (account linking).

---

## 2. Authorization & Roles Protection
BARBARA memiliki dua level role user utama: `CUSTOMER` (default) dan `ADMIN`.

### 2.1 Router / Page Protection
- **Customer Pages**: Halaman `/account/*`, `/checkout`, dan sub-halamannya wajib diproteksi. Jika user belum login mengakses halaman ini, redirect ke `/auth/login`.
- **Admin Pages**: Halaman `/admin/*` dan sub-halamannya **wajib** diproteksi dengan ketat. 
  - Jika user belum login, redirect ke `/auth/login`.
  - Jika user sudah login tetapi rolenya bukan `ADMIN`, kembalikan halaman HTTP Error 403 Forbidden atau redirect ke homepage `/` dengan pesan peringatan.
- **Auth Pages**: Halaman `/auth/login` dan `/auth/register` tidak boleh diakses oleh user yang sudah masuk (session active). Lakukan redirect ke `/` (untuk customer) atau `/admin` (untuk admin) secara otomatis.

---

## 3. API Route Protection
Setiap API route di `/api/user/*`, `/api/cart/*`, `/api/orders/*`, dan `/api/admin/*` wajib memvalidasi sesi aktif di sisi server:
- Gunakan handler `auth()` dari NextAuth untuk mengambil session.
- **Constraint**: Jika session null, API wajib mengembalikan status HTTP `401 Unauthorized` dengan format response JSON: `{ "error": "Unauthorized" }`.
- **Admin Constraints**: API di dalam `/api/admin/*` wajib memeriksa `session.user.role === 'ADMIN'`. Jika tidak terpenuhi, kembalikan status HTTP `403 Forbidden` dengan response `{ "error": "Forbidden" }`.

---

## 4. Input Validation & Data Cleansing
- **Zod Schemas**: Semua payload input dari client yang masuk ke API handler wajib divalidasi menggunakan skema Zod sebelum diproses ke database.
- **Data Sanitization**: Pastikan input email selalu diubah menjadi lowercase (`.toLowerCase()`) dan di-trim untuk mencegah duplikasi akun akibat case-sensitivity.
- **Error Handling**: Jika validasi input gagal, kembalikan status HTTP `400 Bad Request` beserta detail error validasinya.

---

## 5. Security Environment
- **Secrets**: Nilai `NEXTAUTH_SECRET` wajib berupa string acak dengan entropy tinggi (minimal 32 karakter) dan dideklarasikan di file `.env.local`.
- **HTTPS**: Pastikan cookie session diset dengan opsi `secure: true` saat aplikasi berjalan di lingkungan production.
- **CSRF Protection**: Gunakan proteksi CSRF bawaan dari NextAuth.js untuk mengamankan request mutasi POST/PATCH/DELETE.
