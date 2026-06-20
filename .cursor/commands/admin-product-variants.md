# Detail — Admin Product CRUD with Dynamic Variants

Jalankan workflow CRUD produk admin BARBARA. Baca `workflows/6-1_admin_product_variants.md`, lalu implementasikan form dan API produk.

## Dokumen acuan

- Rules: `.cursor/rules/auth.mdc`, `.cursor/rules/database.mdc`
- Skill: `.cursor/skills/database-operations/SKILL.md`

## Tugas

1. Buat `src/validators/product.ts` — Zod schema produk + varian (size M/L/XL, colorHex, stock, sku, images)
2. Form di `/admin/products/new` dan `/admin/products/[id]` — React Hook Form + Zod
3. Upload gambar → `/api/admin/upload` atau Vercel Blob/Cloudinary → simpan URL ke form state
4. **POST `/api/admin/products`** — auth ADMIN, `$transaction`: Product + ProductVariant + ProductImage
5. **PUT/PATCH/DELETE `/api/admin/products/[id]`** — update aman; jangan hapus varian yang sudah di OrderItem

## Zod schema (wajib)

- `size`: enum `M` | `L` | `XL`
- `colorHex`: regex `#RRGGBB`
- `price`: number positive, min 1000
- `variants`: min 1 item
- `images`: min 1 URL

## Verifikasi

- [ ] Form validasi gagal menampilkan error Zod
- [ ] Create product + variants + images dalam satu transaksi
- [ ] Edit tidak menghapus varian yang terikat OrderItem
- [ ] Non-admin mendapat 403 pada API admin

Laporkan validator, form pages, dan API routes yang dibuat.
