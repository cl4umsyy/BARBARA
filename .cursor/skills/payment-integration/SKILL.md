---
name: payment-integration
description: Integrates Midtrans Snap checkout, server-side token generation, signature-verified webhooks, and stock restoration for BARBARA E-Commerce. Use when implementing checkout payment, Midtrans API routes, or payment notification handlers.
disable-model-invocation: true
---

# Payment Integration

Patuhi `.cursor/rules/payment.mdc` saat implementasi.

## Workflow

```
Task Progress:
- [ ] Buat src/lib/midtrans.ts (Snap client, sandbox/production flag)
- [ ] Buat POST /api/payment/create (auth + generate Snap token)
- [ ] Buat POST /api/payment/notification (verify signature + update order)
- [ ] Load Snap JS di client checkout (modal, bukan redirect)
- [ ] Redirect ke /checkout/confirmation?orderId=... setelah Snap selesai
```

## Environment

```env
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
MIDTRANS_IS_PRODUCTION=false
```

Server Key **hanya server-side** — tidak pernah ke client.

## Order Flow

1. Checkout → buat `Order` status `PENDING`, payment `PENDING`
2. Kurangi stok saat order dibuat (stock lock)
3. Generate Snap token → tampilkan modal
4. Webhook update status; restore stok jika `deny`/`cancel`/`expire`

## Webhook Signature

```
SHA512(order_id + status_code + gross_amount + ServerKey)
```

Mismatch → `400`, jangan update DB.

## Status Mapping

| Midtrans | paymentStatus | order status | Stok |
|----------|---------------|--------------|------|
| capture (fraud accept) / settlement | PAID | PROCESSING | — |
| pending | PENDING | PENDING | — |
| deny / cancel / expire | FAILED | CANCELLED | restore |

## Code Templates

Midtrans client, create route, webhook handler: [reference.md](reference.md)
