---
title: "Bab 12 — ERD & Normalisasi"
---

# 📐 Bab 12 — ERD & Normalisasi ⭐

> 🎯 **Tujuan Bab:** menerjemahkan kebutuhan bisnis menjadi skema yang benar, memahami normalisasi, dan tahu kapan denormalisasi justru tepat.

## 12.1 🧭 Dari Kebutuhan ke Skema

Mulai dari pertanyaan bisnis, bukan dari tabel.

Contoh kebutuhan toko online:

- pelanggan bisa mendaftar dan punya banyak alamat;
- produk punya kategori;
- pelanggan bisa menaruh produk ke keranjang;
- pesanan berisi banyak produk;
- setiap pesanan punya status dan pembayaran;
- pelanggan bisa memberi ulasan.

Dari kebutuhan itu muncul entitas: `users`, `addresses`, `categories`, `products`, `carts`, `cart_items`, `orders`, `order_items`, `payments`, `reviews`.

### Membaca ERD (Crow's Foot)

```
users ||──o{ orders
```

- `||` = tepat satu;
- `o{` = nol atau banyak;
- garis menghubungkan primary key ke foreign key.

## 12.2 🔢 Kardinalitas & Partisipasi

| Relasi | Contoh | Implementasi |
|---|---|---|
| One-to-one | user ↔ profile | foreign key unik di salah satu tabel |
| One-to-many | user → orders | foreign key di tabel banyak |
| Many-to-many | orders ↔ products | tabel pivot `order_items` |

Partisipasi menjawab: apakah setiap baris **wajib** punya pasangan?

- User wajib punya email, tetapi tidak wajib punya order.
- Order wajib punya user.
- Order wajib punya minimal satu item (aturan aplikasi, bukan foreign key).

## 12.3 🧹 Normalisasi

### 1NF — Satu Nilai per Kolom

```sql
-- ❌ Melanggar 1NF
products: id | nama | warna
          1  | Kaos | merah,biru,hijau
```

Perbaikan:

```sql
product_colors: product_id | warna
                1          | merah
                1          | biru
```

Aturan: tidak ada list dalam satu kolom, tidak ada kolom berulang (`produk_1`, `produk_2`).

### 2NF — Tidak Ada Ketergantungan Parsial

Berlaku untuk composite key. Setiap kolom non-key harus bergantung pada **seluruh** key, bukan sebagian.

```sql
-- ❌ Ketergantungan parsial
order_items: order_id | product_id | nama_produk | jumlah
```

`nama_produk` hanya bergantung pada `product_id`, bukan pada pasangan `(order_id, product_id)`. Pindahkan ke tabel `products`.

### 3NF — Tidak Ada Ketergantungan Transitif

Kolom non-key tidak boleh bergantung pada kolom non-key lain.

```sql
-- ❌ Melanggar 3NF
orders: id | user_id | nama_user | email_user | total
```

`nama_user` dan `email_user` bergantung pada `user_id`, bukan langsung pada `id` order. Simpan di tabel `users`.

### Ringkasan Bentuk Normal

| Bentuk | Aturan Singkat | Masalah yang Dicegah |
|---|---|---|
| **1NF** | Tiap kolom satu nilai | Data "a,b,c" dalam satu kolom |
| **2NF** | Tidak ada ketergantungan parsial pada composite key | Data berulang pada tabel relasi |
| **3NF** | Tidak ada ketergantungan transitif antar kolom non-key | Anomali update (misalnya nama kota tersimpan di tiap baris) |

## 12.4 ⚠️ Anomali Data

| Anomali | Contoh |
|---|---|
| **Insert** | Tidak bisa menambah kategori tanpa produk |
| **Update** | Nama kategori harus diubah di ratusan baris |
| **Delete** | Menghapus order ikut menghilangkan data pelanggan |

Normalisasi mengurangi ketiga anomali ini.

## 12.5 🧩 Denormalisasi yang Disengaja

Normalisasi bukan tujuan akhir. Kadang duplikasi terkontrol lebih baik.

Contoh yang wajar:

- menyimpan `total` di `orders` agar tidak menghitung ulang setiap saat;
- menyimpan `harga` di `order_items` sebagai **snapshot** harga saat transaksi;
- menyimpan `nama_produk` di `order_items` jika riwayat harus tetap terbaca meskipun produk dihapus;
- tabel ringkasan laporan yang diperbarui berkala.

> 💡 **Snapshot harga wajib.** Harga produk bisa berubah. Jika `order_items` hanya menyimpan `product_id`, total pesanan lama akan ikut berubah saat harga diperbarui — itu salah.

## 12.6 🏗️ Pola Desain Umum

| Kebutuhan | Pola |
|---|---|
| Status terbatas | `ENUM` atau tabel referensi |
| Soft delete | kolom `deleted_at` |
| Audit | tabel `audit_logs` atau trigger |
| Timestamps | `created_at`, `updated_at` |
| Uang | `DECIMAL(12,2)` |
| Alamat | tabel terpisah, satu user banyak alamat |
| File | simpan path di database, file di storage |

## 12.7 🚫 Kesalahan Desain yang Sering Terjadi

- Menyimpan banyak nilai dalam satu kolom (CSV).
- Memakai EAV (entity-attribute-value) untuk hampir semua hal.
- Tidak memakai foreign key karena "nanti ribet".
- Menyimpan uang dengan `FLOAT`.
- Menyimpan harga produk tanpa snapshot di item pesanan.
- Membuat tabel baru untuk setiap kategori data yang mirip.
- Tidak memberi index pada kolom yang sering difilter.

## 12.8 🧩 Kapan JSON Masuk Akal?

JSON cocok untuk data yang:

- bentuknya beragam antar baris;
- jarang difilter;
- dibaca sebagai satu kesatuan.

JSON kurang cocok untuk data yang:

- sering di-`JOIN`;
- sering difilter atau diurutkan;
- punya relasi kuat dengan entitas lain.

Contoh wajar: atribut tambahan produk seperti `{"warna":"hitam","ukuran":"L"}`. Contoh kurang wajar: menyimpan semua item order dalam satu kolom JSON.

## 📌 Ringkasan

- Desain dimulai dari kebutuhan, bukan dari tabel.
- Normalisasi mengurangi duplikasi dan anomali.
- 1NF, 2NF, dan 3NF adalah pemeriksaan dasar.
- Denormalisasi boleh dilakukan jika alasannya jelas dan terkontrol.
- Snapshot harga adalah contoh duplikasi yang justru wajib.

## 🧪 Latihan

1. Normalisasi tabel `orders` yang berisi `nama_user`, `email_user`, dan `produk_1..3`.
2. Tentukan relasi antara `users`, `addresses`, dan `orders`.
3. Mengapa `harga` perlu disimpan di `order_items`?
4. Berikan satu contoh data yang cocok disimpan sebagai JSON.
5. Temukan pelanggaran 3NF pada skema buatan Anda sendiri.

::: tip 💡 Tips
Gambar ERD di kertas sebelum menulis SQL. Perubahan di kertas gratis; perubahan skema di data produksi bisa sangat mahal.
:::
