---
description: # 📋 Detail Workflow: Webhook Verification & Ngrok Testing
---

# 📋 Detail Workflow: Webhook Verification & Ngrok Testing

Dokumen ini mendetailkan cara menyiapkan local tunneling menggunakan Ngrok untuk menguji webhook payment Midtrans di localhost, serta cara memverifikasi signature key di server-side.

---

## 1. Topologi Integrasi Webhook Lokal

```
┌─────────────────┐       Internet       ┌──────────────┐       Local Tunnel       ┌───────────────┐
│ Midtrans Server │ ───────────────────> │  Ngrok URL   │ ───────────────────────> │ Local Machine │
│ (Sandbox/Prod)  │                      │ (HTTPS Link) │                          │ (Port 3000)   │
└─────────────────┘                      └──────────────┘                          └───────────────┘
```

---

## 2. Langkah Detail Implementasi

### Langkah 1: Setup Local Tunnel (Ngrok)
Karena Midtrans tidak dapat mengirimkan request HTTP post ke alamat lokal seperti `http://localhost:3000`, kita wajib menggunakan service tunnel.
1. Download dan instal Ngrok pada komputer lokal.
2. Hubungkan akun Ngrok dengan menjalankan perintah otentikasi di terminal:
   ```bash
   ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
   ```
3. Jalankan command forwarding port lokal:
   ```bash
   ngrok http 3000
   ```
4. Salin URL HTTPS yang dihasilkan (contoh: `https://xxxx-xxxx.ngrok-free.app`).

### Langkah 2: Konfigurasi Webhook di Midtrans Dashboard
1. Buka **Midtrans Sandbox Dashboard**.
2. Navigasikan ke menu **Settings > Configuration**.
3. Isi kolom **Payment Notification URL** dengan menyertakan subdomain Ngrok dan path API webhook BARBARA:
   `https://xxxx-xxxx.ngrok-free.app/api/payment/notification`
4. Tekan **Save**. Sekarang, setiap kali terjadi transaksi simulasi di Midtrans, event notifikasinya akan di-forward ke server lokal Anda.

### Langkah 3: Menulis Validasi Signature Key di Server
Untuk mencegah serangan pemalsuan notifikasi pembayaran (di mana seseorang memalsukan request notifikasi status lunas ke API Anda), server-side wajib memvalidasi data menggunakan SHA512 signature key:

1. Buat API router POST di `src/app/api/payment/notification/route.ts`.
2. Dapatkan data JSON body notifikasi.
3. Ekstrak properti: `order_id`, `status_code`, `gross_amount`, dan `signature_key`.
4. Hitung hash signature pembanding menggunakan `crypto` module bawaan Node.js:
   ```typescript
   import crypto from 'crypto';

   const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
   // Rumus pencocokan signature key resmi dari Midtrans:
   const hashSource = `${order_id}${status_code}${gross_amount}${serverKey}`;
   const calculatedHash = crypto
     .createHash('sha512')
     .update(hashSource)
     .digest('hex');

   if (calculatedHash !== signature_key) {
     return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
   }
   ```
5. Jika hash tidak cocok, kembalikan status HTTP `400 Bad Request` dan **jangan pernah mengubah status order di database**.

### Langkah 4: Pemetaan Status Transaksi
Setelah signature tervalidasi dengan aman, perbarui status order di database lokal:
- **`settlement` / `capture` (fraud_status: `accept`)**: Transaksi dibayar penuh. Ubah status order menjadi `PAID` dan order status menjadi `PROCESSING`.
- **`pending`**: Pembayaran masih tertunda (misal: VA belum dibayar). Set status order menjadi `PENDING`.
- **`deny` / `cancel` / `expire`**: Pembayaran ditolak atau melewati batas waktu. Ubah status order menjadi `FAILED` dan status order menjadi `CANCELLED`. Kembalikan stok fisik produk ke database.
