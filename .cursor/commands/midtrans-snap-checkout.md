# Detail — Midtrans Snap Integration & Checkout Flow

Jalankan workflow pembayaran Midtrans BARBARA. Baca `workflows/4_midtrans_snap_checkout.md`, lalu implementasikan alur checkout end-to-end.

## Dokumen acuan

- Rule: `.cursor/rules/payment.mdc`
- Skill: `.cursor/skills/payment-integration/SKILL.md` (baca `reference.md` untuk template)

## Tugas

1. **POST `/api/orders`** — validasi Zod, buat Order `PENDING`, lock stok (`decrement`), kosongkan cart DB, return orderId
2. **POST `/api/payment/create`** — auth, generate Snap token, simpan ke `Order.midtransId`
3. **Client Snap** — load `snap.js`, `window.snap.pay()` dengan callback onSuccess/onPending/onError
4. **Webhook `/api/payment/notification`** — verifikasi SHA512 signature, update status, restore stok jika gagal

## Env vars

```
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
```

## Status mapping

- `settlement` / `capture` (fraud accept) → PAID + PROCESSING
- `pending` → PENDING
- `deny` / `cancel` / `expire` → FAILED + CANCELLED + restore stok

## Verifikasi

- [ ] Place Order mengunci stok dan membuat Order PENDING
- [ ] Snap modal muncul dengan token valid
- [ ] Redirect ke `/checkout/confirmation?orderId=...` setelah bayar
- [ ] Webhook menolak signature invalid (400)

Laporkan endpoint yang dibuat dan alur transaksi yang sudah teruji.
