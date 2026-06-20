# 📏 Rules: Database & ORM (BARBARA E-Commerce)

File ini mendefinisikan aturan pemodelan database, naming conventions, relasi, dan penggunaan Prisma ORM untuk memastikan integritas data dan performa query.

---

## 1. Database Engine & Schema Definition
- **Engine**: PostgreSQL.
- **ORM**: Prisma (schema disimpan di `prisma/schema.prisma`).
- **Naming Conventions**:
  - Model Name: PascalCase, Singular (contoh: `User`, `ProductVariant`).
  - Table Name (via `@@map`): snake_case, Plural (contoh: `@@map("users")`, `@@map("product_variants")`).
  - Column/Field Name: camelCase (contoh: `createdAt`, `colorHex`).
  - Database Column (via `@map` jika diperlukan): snake_case (contoh: `@map("color_hex")`).

---

## 2. Relational Integrity Rules
Untuk menjaga konsistensi data, semua relasi wajib mendefinisikan perilaku penghapusan (`onDelete`) secara eksplisit:

- **Cascade Delete (`onDelete: Cascade`)**:
  - Diperbolehkan untuk child tables yang tidak bisa berdiri sendiri tanpa parent-nya.
  - Contoh: Jika `Product` dihapus, maka `ProductImage` dan `ProductVariant` wajib terhapus secara otomatis (`onDelete: Cascade`).
  - Jika `Order` dihapus, maka `OrderItem` dan `ShippingAddress` terkait wajib terhapus (`onDelete: Cascade`).
  - Jika `Cart` dihapus, `CartItem` wajib terhapus (`onDelete: Cascade`).

- **Restrict/Prevent Delete (`onDelete: Restrict` atau `onDelete: NoAction`)**:
  - Wajib digunakan untuk data historis atau referensi krusial yang tidak boleh hilang begitu saja.
  - Contoh: `ProductVariant` tidak boleh dihapus secara cascade jika sudah terikat dengan `OrderItem` (gunakan `onDelete: Restrict`).
  - Penghapusan `User` tidak boleh secara otomatis menghapus `Order` historisnya demi keperluan pembukuan keuangan (atau diatur agar userID diset ke NULL / relasi diset ke `Restrict`).

---

## 3. Data Types & Precision Standards
- **Mata Uang & Harga**: 
  - Wajib menggunakan tipe data `Decimal` (Prisma) atau `Decimal(12, 2)` di PostgreSQL untuk semua kolom harga, subtotal, shipping cost, dan total. Jangan menggunakan Float atau Double untuk menghindari error presisi matematika floating-point.
- **Stock & Quantity**:
  - Wajib menggunakan tipe data `Int`. Wajib memiliki constraint minimum `0`.
- **Status Enum**:
  - Gunakan `String` atau `@db.VarChar` dengan validasi di tingkat aplikasi (Zod) untuk fleksibilitas migrasi status, atau definisikan `enum` Prisma secara presisi (contoh status order: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).

---

## 4. Performance & Indexing
- Setiap foreign key wajib dibuatkan indeks indeksasi eksplisit jika kolom tersebut sering digunakan dalam pencarian (`WHERE`) atau penggabungan (`JOIN` / `include` Prisma).
- Gunakan `@unique` pada kolom slug (seperti `Product.slug`, `Category.slug`) dan `Order.orderNumber`.
- Indeks gabungan (`@@index`) harus dibuat jika query sering menyaring berdasarkan kombinasi field tertentu (contoh: filter produk berdasarkan `categoryId` dan `isActive`).

---

## 5. Prisma Client Standard Usage
- Selalu gunakan implementasi **Prisma Client Singleton** untuk menghindari leak koneksi database saat live-reload di development environment (pastikan merujuk ke file `src/lib/prisma.ts`).
- **Dilarang keras** menulis raw SQL queries menggunakan `$queryRaw` kecuali jika query relasional sangat kompleks dan tidak bisa ditangani secara efisien oleh API standar Prisma.
