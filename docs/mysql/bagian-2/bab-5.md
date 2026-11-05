---
title: "Bab 5 — DDL: Membuat Database & Tabel"
---

# 🏗️ Bab 5 — DDL: Membuat Database & Tabel

> 🎯 **Tujuan Bab:** membuat database dan tabel dengan tipe data serta constraint yang tepat, lalu mengubah struktur tanpa merusak data.

## 5.1 🏗️ Membuat Database & Tabel

```sql
CREATE DATABASE toko
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE toko;

CREATE TABLE users (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  saldo      DECIMAL(12,2) NOT NULL DEFAULT 0,
  aktif      TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Perhatikan:

- `BIGINT UNSIGNED` memberi ruang ID yang besar dan tidak negatif;
- `DECIMAL(12,2)` menyimpan uang dengan dua digit desimal;
- `NOT NULL` mencegah nilai kosong;
- `UNIQUE` mencegah email ganda;
- `DEFAULT` mengisi nilai otomatis.

## 5.2 📦 Tipe Data MySQL

| Kategori | Tipe | Catatan |
|---|---|---|
| **Bilangan bulat** | `TINYINT`, `INT`, `BIGINT` | Pilih ukuran sesuai kebutuhan |
| **Desimal** | `DECIMAL(p,s)` | ✅ Untuk uang (presisi tepat) |
| **Pecahan** | `FLOAT`, `DOUBLE` | ⚠️ Tidak presisi, jangan untuk uang |
| **Teks** | `CHAR`, `VARCHAR`, `TEXT` | `VARCHAR` untuk teks pendek |
| **Tanggal & waktu** | `DATE`, `DATETIME`, `TIMESTAMP` | Perbedaan zona waktu & rentang |
| **Boolean** | `TINYINT(1)` / `BOOLEAN` | MySQL menyimpan sebagai angka |
| **Pilihan terbatas** | `ENUM`, `SET` | Kelebihan & kekurangannya |
| **JSON** | `JSON` | Dibahas di Bab 18 |
| **Biner** | `BLOB` | Umumnya lebih baik simpan file di storage, bukan DB |

### Uang Harus `DECIMAL`, Bukan `FLOAT`

```sql
-- ❌ Jangan
harga FLOAT

-- ✅ Gunakan
harga DECIMAL(12,2)
```

`FLOAT` menyimpan aproksimasi biner. Penjumlahan berulang bisa menghasilkan nilai seperti `0.30000000000000004`. Untuk uang, gunakan `DECIMAL` atau simpan dalam satuan terkecil (misalnya rupiah tanpa desimal).

### `DATETIME` vs `TIMESTAMP`

| Tipe | Rentang | Zona waktu |
|---|---|---|
| `DATETIME` | 1000–9999 | Disimpan apa adanya |
| `TIMESTAMP` | 1970–2038 | Dikonversi ke UTC |

Untuk `created_at` dan `updated_at`, `TIMESTAMP` sering dipakai karena otomatis menyesuaikan zona waktu server. Untuk tanggal lahir atau jadwal yang tidak boleh bergeser, `DATETIME` atau `DATE` lebih aman.

## 5.3 🔧 Mengubah Struktur Tabel

### Menambah kolom

```sql
ALTER TABLE users
  ADD COLUMN telepon VARCHAR(20) NULL AFTER email;
```

### Mengubah kolom

```sql
ALTER TABLE users
  MODIFY COLUMN telepon VARCHAR(30) NULL;
```

### Menghapus kolom

```sql
ALTER TABLE users
  DROP COLUMN telepon;
```

### Rename tabel

```sql
RENAME TABLE users TO pelanggan;
```

### `TRUNCATE` vs `DELETE`

```sql
TRUNCATE TABLE users;  -- hapus semua baris, cepat, reset AUTO_INCREMENT
DELETE FROM users;     -- hapus semua baris, bisa di-ROLLBACK, tidak reset AUTO_INCREMENT
```

> ⚠️ `TRUNCATE` tidak bisa di-`ROLLBACK` dan akan gagal jika tabel direferensikan foreign key. Untuk data produksi, selalu pikirkan dua kali sebelum menghapus.

## 5.4 🧭 Konvensi Penamaan

Konsistensi lebih penting daripada aturan tertentu. Pilih satu gaya dan pakai di seluruh project.

| Gaya | Contoh |
|---|---|
| **snake_case** (umum di MySQL) | `order_items`, `created_at` |
| **camelCase** | `orderItems`, `createdAt` |
| **PascalCase** | `OrderItems`, `CreatedAt` |

Rekomendasi untuk ebook ini:

- tabel: **snake_case jamak** (`users`, `orders`, `products`);
- kolom: **snake_case** (`user_id`, `created_at`);
- primary key: `id`;
- foreign key: `<tabel>_id` (`user_id`, `product_id`);
- index: `idx_<tabel>_<kolom>`.

Nama yang jelas menghemat waktu debugging bertahun-tahun.

## 5.5 🔍 Melihat Struktur Tabel

```sql
DESCRIBE users;
SHOW CREATE TABLE users;
SHOW INDEX FROM users;
```

`SHOW CREATE TABLE` sangat berguna untuk:

- melihat definisi lengkap termasuk charset dan engine;
- menyalin struktur tabel ke lingkungan lain;
- membandingkan skema antar environment.

## 📌 Ringkasan

- DDL mendefinisikan struktur, bukan isi data.
- Pilih tipe data yang tepat; uang selalu `DECIMAL`.
- `NOT NULL`, `UNIQUE`, dan `DEFAULT` adalah pertahanan pertama kualitas data.
- `ALTER TABLE` memungkinkan evolusi skema.
- Konvensi penamaan yang konsisten membuat database lebih mudah dirawat.

## 🧪 Latihan

1. Buat tabel `products` dengan kolom `id`, `nama`, `harga`, `stok`, dan `created_at`.
2. Tambahkan kolom `deskripsi TEXT NULL` setelah `nama`.
3. Ubah `nama` menjadi `VARCHAR(150) NOT NULL`.
4. Buat tabel `categories` dengan `id` dan `nama` unik.
5. Jalankan `SHOW CREATE TABLE products` dan jelaskan setiap barisnya.

::: tip 💡 Tips
Sebelum `ALTER TABLE` di data produksi, cek apakah operasi tersebut mengunci tabel lama. Untuk tabel besar, perubahan struktur bisa memakan waktu dan mengganggu aplikasi.
:::
