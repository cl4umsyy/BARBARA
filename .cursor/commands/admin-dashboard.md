# Phase 4 — Admin Dashboard Features

Jalankan workflow admin BARBARA. Baca `workflows/6_admin_dashboard.md`, lalu bangun panel admin terproteksi.

## Dokumen acuan

- Rules: `.cursor/rules/auth.mdc`, `.cursor/rules/database.mdc`
- Skills: `.cursor/skills/auth-implementation/`, `.cursor/skills/database-operations/`
- Detail: `workflows/6-1_admin_product_variants.md`

## Tugas

1. **Layout admin** — `src/app/admin/layout.tsx` dengan sidebar: Dashboard, Products, Orders, Customers, Settings
2. **Dashboard** — stats cards (Revenue, Orders, Customers, Products), chart revenue, 5 order terbaru
3. **Products `/admin/products`** — tabel inventaris, form tambah/edit (rujuk detail product variants)
4. **Orders `/admin/orders`** — tabel transaksi, detail `/admin/orders/[id]`, update status + nomor resi

## Constraints

- Hanya `session.user.role === 'ADMIN'` — middleware + API 403
- Validasi harga dengan Zod, simpan sebagai Decimal
- Delete product cascade hapus images & variants
- Semua API `/api/admin/*` wajib cek role ADMIN

## Verifikasi

- [ ] Non-admin tidak bisa akses `/admin`
- [ ] Form produk validasi Zod + Decimal di DB
- [ ] Delete product cascade ke images/variants
- [ ] Update status order tersimpan di DB

Laporkan halaman admin yang selesai dan API routes yang dibuat.
