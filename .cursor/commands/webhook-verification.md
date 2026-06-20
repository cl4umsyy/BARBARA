# Detail — Webhook Verification & Ngrok Testing

Jalankan workflow pengujian webhook Midtrans BARBARA. Baca `workflows/7_webhook_verification.md`, lalu setup tunnel lokal dan verifikasi signature.

## Dokumen acuan

- Rule: `.cursor/rules/payment.mdc`
- Skill: `.cursor/skills/payment-integration/SKILL.md`

## Tugas

1. Pastikan `src/app/api/payment/notification/route.ts` ada dengan verifikasi SHA512:
   ```
   SHA512(order_id + status_code + gross_amount + ServerKey)
   ```
2. Setup Ngrok tunnel ke port 3000
3. Konfigurasi Payment Notification URL di Midtrans Sandbox Dashboard
4. Uji simulasi pembayaran (CC simulator / VA) dan pantau update status order di DB

## Langkah Ngrok

```bash
npm run dev
ngrok config add-authtoken <YOUR_TOKEN>
ngrok http 3000
```

Set webhook URL: `https://<ngrok-subdomain>.ngrok-free.app/api/payment/notification`

## Constraints

- Signature mismatch → HTTP 400, **jangan** update DB
- `settlement`/`capture` (accept) → PAID + PROCESSING
- `deny`/`cancel`/`expire` → FAILED + CANCELLED + restore stok

## Verifikasi

- [ ] Ngrok forward request Midtrans ke localhost
- [ ] Signature invalid ditolak (400)
- [ ] Simulasi sukses mengubah order ke PAID/PROCESSING di DB
- [ ] Simulasi expire/cancel restore stok varian

Laporkan hasil uji webhook dan log error jika ada.
