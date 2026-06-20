# Detail — Database Schema & Relational Design

Jalankan workflow desain skema database BARBARA. Baca `workflows/1-2_database_schema.md`, lalu terapkan relasi, tipe data, dan indexing ke `prisma/schema.prisma`.

## Dokumen acuan

- Rule: `.cursor/rules/database.mdc`
- Skill: `.cursor/skills/database-operations/SKILL.md` (baca `reference.md` untuk template)

## Tugas

1. Definisikan model Prisma lengkap dengan naming conventions (PascalCase model, snake_case table)
2. Terapkan `onDelete` sesuai diagram relasi workflow (Cascade vs Restrict)
3. Gunakan `Decimal(12, 2)` untuk semua kolom harga — bukan Float
4. Tambahkan `@unique` pada slug, orderNumber, sku; `@@index` pada FK dan filter kombinasi
5. Sinkronkan skema: `npx prisma db push` atau `npx prisma migrate dev`

## Relasi kritis

- Cascade: Product → ProductImage/ProductVariant; Cart → CartItem; Order → OrderItem/ShippingAddress
- Restrict: Category → Product; ProductVariant → OrderItem; User → Order

## Verifikasi

- [ ] Semua relasi punya `onDelete` eksplisit
- [ ] Kolom harga memakai Decimal
- [ ] Index dan unique constraint sesuai workflow
- [ ] `npx prisma db push` / migrate sukses tanpa error

Laporkan model yang dibuat dan relasi `onDelete` masing-masing.
