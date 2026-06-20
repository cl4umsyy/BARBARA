# Phase 3 — Customer Frontend Features

Jalankan workflow frontend customer BARBARA. Baca `workflows/3_frontend_customer.md`, lalu implementasikan halaman shop, cart, dan checkout.

## Dokumen acuan

- Rules: `.cursor/rules/design-system.mdc`, `.cursor/rules/payment.mdc`, `.cursor/rules/seo-performance.mdc`
- Skills: `.cursor/skills/setup-design-system/`, `.cursor/skills/cart-checkout/`, `.cursor/skills/payment-integration/`
- Detail: `workflows/5_cart_zustand_sync.md`, `workflows/4_midtrans_snap_checkout.md`

## Tugas

1. **Homepage** — Navbar, Footer, New Arrivals, Categories Grid (data dari DB)
2. **Katalog `/shop`** — grid responsif, filter kategori/ukuran (M, L, XL), harga, sort; `ProductCard` dengan hover image swap
3. **Detail `/shop/[slug]`** — galeri, size/color selector, size guide modal, ADD TO CART / WISHLIST
4. **Cart `/cart`** — Zustand store + `QuantitySelector`, persist LocalStorage
5. **Checkout `/checkout`** — form alamat (Zod + React Hook Form), integrasi Midtrans Snap

## Constraints

- Patuhi design system monochrome (Montserrat, rounded-none, Framer Motion)
- Filter ukuran hanya M, L, XL
- Cart sync ke DB saat login (POST `/api/cart/sync`)
- Gunakan `next/image` dengan `sizes` presisi

## Verifikasi

- [ ] Cart persist setelah refresh
- [ ] Filter ukuran M/L/XL berfungsi
- [ ] Checkout memanggil `/api/payment/create` dan membuka Snap modal
- [ ] `clearCart()` setelah Snap token berhasil

Laporkan halaman yang selesai dan yang masih pending.
