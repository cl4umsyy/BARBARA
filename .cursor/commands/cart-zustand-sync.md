# Detail — Zustand Cart & Database Sync Flow

Jalankan workflow keranjang belanja BARBARA. Baca `workflows/5_cart_zustand_sync.md`, lalu implementasikan Zustand store dan sync ke database.

## Dokumen acuan

- Skill: `.cursor/skills/cart-checkout/SKILL.md` (baca `reference.md` untuk template)

## Tugas

1. Buat `src/stores/useCartStore.ts` — Zustand + `persist`, key `barbara-cart-storage`
2. Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getCartTotal`, `getCartCount`
3. Cap quantity di `maxStock` pada add/update
4. Buat `src/components/cart/QuantitySelector.tsx`
5. Buat **POST `/api/cart/sync`** — auth required, merge local items dengan DB cart, validasi stok
6. Trigger sync di client saat session berubah ke `authenticated`

## Merge logic (server)

- Cari/buat Cart user
- Item sama variantId → jumlahkan qty, cap di stok `ProductVariant`
- Item baru → buat CartItem
- Gunakan `prisma.$transaction`
- Return merged items → overwrite Zustand state

## Verifikasi

- [ ] Cart persist di LocalStorage setelah refresh
- [ ] Qty tidak bisa melebihi `maxStock`
- [ ] Login trigger POST `/api/cart/sync` dan state ter-update dari DB
- [ ] Guest cart tetap di LocalStorage sebelum login

Laporkan store, API sync, dan trigger client yang diimplementasikan.
