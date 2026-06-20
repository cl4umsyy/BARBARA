# 📏 Rules: Payment Integration (BARBARA E-Commerce)

File ini mendefinisikan aturan integrasi Midtrans Payment Gateway, pemrosesan order checkout, penanganan webhook, serta pencegahan fraud transaksi.

---

## 1. Environment & Keys Control
- **Sandbox Mode**: Semua proses development dan staging wajib menggunakan Midtrans Sandbox API (`https://api.sandbox.midtrans.com`).
- **Production Mode**: Hanya aktif saat environment variable `MIDTRANS_IS_PRODUCTION` diset ke `true`.
- **Credential Storage**: `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` harus diletakkan di file `.env.local`. **Dilarang keras mengekspos Server Key ke client-side JavaScript.**

---

## 2. Order Creation & Booking Flow
Untuk mencegah masalah inkonsistensi stok saat pembayaran tertunda:
- **Order State**: Saat checkout dimulai, buat data `Order` dengan status awal `PENDING` dan status pembayaran `PENDING`.
- **Stok Lock**: Kurangi stok produk secara langsung di database saat `Order` dibuat (status `PENDING`). 
- **Auto-Cancellation**: Buat scheduler atau worker untuk membatalkan `Order` (mengembalikan stok ke semula) jika pembayaran tidak diselesaikan dalam batas waktu yang ditentukan oleh Midtrans (default 24 jam).

---

## 3. Webhook (Notification Handler) Security
Webhook endpoint `/api/payment/notification` sangat rawan terhadap manipulasi jika tidak diamankan. Wajib mematuhi protokol keamanan berikut:

### 3.1 Signature Key Verification
Sebelum memperbarui status transaksi di database, backend **wajib** melakukan validasi signature key yang dikirim oleh Midtrans:
- **Formula**: `SHA512(order_id + status_code + gross_amount + ServerKey)`
- Cocokkan hash hasil kalkulasi backend dengan header/body `signature_key` dari request Midtrans. Jika tidak cocok, kembalikan status HTTP `400 Bad Request` dan abaikan request tersebut.

### 3.2 Transaction Status Mapping
Status transaksi dari Midtrans wajib dipetakan secara presisi ke database local:
- `capture` / `settlement` -> Ubah `Order.paymentStatus` menjadi `PAID`, ubah `Order.status` menjadi `PROCESSING`.
- `pending` -> Tetapkan `Order.paymentStatus` sebagai `PENDING`.
- `deny` / `cancel` / `expire` -> Ubah `Order.paymentStatus` menjadi `FAILED`, ubah `Order.status` menjadi `CANCELLED`, dan kembalikan stok produk.

---

## 4. Client-Side Payment Flow
- Gunakan **Midtrans Snap JS** (`https://app.sandbox.midtrans.com/snap/snap.js`) untuk menampilkan modal pembayaran di dalam website.
- Jangan melakukan redirect langsung ke halaman luar jika memungkinkan; gunakan popup modal Snap untuk menjaga seamless user experience di halaman checkout.
- Setelah transaksi selesai/gagal di modal Snap, arahkan user ke halaman konfirmasi yang sesuai (`/checkout/confirmation?orderId=...`).
