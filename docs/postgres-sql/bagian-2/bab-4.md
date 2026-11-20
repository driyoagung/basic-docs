---
title: "Bab 4 — DDL: Tabel & Tipe Data"
---

# 🏗️ Bab 4 — DDL: Tabel & Tipe Data

> 🎯 **Tujuan Bab:** membuat tabel dengan tipe data PostgreSQL yang tepat dan mengubah struktur dengan aman.

## 4.1 🧱 Membuat Tabel

```sql
CREATE TABLE users (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  saldo      NUMERIC(12,2) NOT NULL DEFAULT 0,
  aktif      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Perhatikan:

- `GENERATED ALWAYS AS IDENTITY` adalah cara modern membuat id otomatis.
- `TEXT` menyimpan string tanpa batas panjang yang kaku.
- `NUMERIC(12,2)` menjaga presisi uang.
- `TIMESTAMPTZ` menyimpan waktu beserta zona waktunya.
- `BOOLEAN` adalah tipe asli, bukan `TINYINT(1)`.

## 4.2 📦 Tipe Data PostgreSQL

| Kategori | Tipe | Catatan |
|---|---|---|
| **Bilangan bulat** | `SMALLINT`, `INTEGER`, `BIGINT` | Tidak ada `UNSIGNED` |
| **Desimal** | `NUMERIC(p,s)` | ✅ Untuk uang |
| **Pecahan** | `REAL`, `DOUBLE PRECISION` | ⚠️ Tidak presisi |
| **Teks** | `TEXT`, `VARCHAR(n)`, `CHAR(n)` | `TEXT` dan `VARCHAR` setara performa |
| **Tanggal & waktu** | `DATE`, `TIME`, `TIMESTAMP`, `TIMESTAMPTZ`, `INTERVAL` | ⭐ Utamakan `TIMESTAMPTZ` |
| **Boolean** | `BOOLEAN` | `TRUE`/`FALSE` |
| **UUID** | `UUID` | Bawaan, tanpa extension |
| **JSON** | `JSON`, `JSONB` | `JSONB` untuk query & index |
| **Array** | `INTEGER[]`, `TEXT[]` | Bisa di-index GIN |
| **Enum & range** | `ENUM`, `DATERANGE`, `INT4RANGE` | Fitur khas PostgreSQL |
| **Jaringan** | `INET`, `CIDR` | Alamat IP dan subnet |

## 4.3 🔢 `SERIAL` vs `IDENTITY`

Gaya lama:

```sql
CREATE TABLE lama (
  id SERIAL PRIMARY KEY
);
```

Gaya modern:

```sql
CREATE TABLE modern (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
);
```

`IDENTITY` mengikuti standar SQL, lebih eksplisit, dan menghindari beberapa keanehan `SERIAL`. Untuk proyek baru, gunakan `IDENTITY`.

## 4.4 📝 `TEXT` vs `VARCHAR(n)`

Di PostgreSQL, `TEXT` dan `VARCHAR(n)` disimpan dengan cara yang sama. Perbedaannya:

- `VARCHAR(n)` menolak string lebih dari `n` karakter;
- `TEXT` tidak membatasi panjang.

Gunakan `TEXT` untuk kebanyakan kasus, dan `VARCHAR(n)` hanya jika batas panjang memang aturan bisnis. Validasi panjang di aplikasi tetap penting.

## 4.5 🕰️ `TIMESTAMP` vs `TIMESTAMPTZ`

| Tipe | Menyimpan zona waktu | Disarankan |
|---|---|---|
| `TIMESTAMP` | Tidak | Untuk waktu lokal yang tidak perlu zona |
| `TIMESTAMPTZ` | Ya (disimpan sebagai UTC) | ✅ Untuk hampir semua aplikasi |

Dengan `TIMESTAMPTZ`, `now()` menyimpan waktu absolut. Saat ditampilkan, PostgreSQL menyesuaikan dengan zona waktu sesi.

```sql
SET TIME ZONE 'Asia/Jakarta';
SELECT now();
```

## 4.6 💰 Mengapa Uang Memakai `NUMERIC`

```sql
SELECT 0.1::float + 0.2::float;  -- 0.30000000000000004
SELECT 0.1::numeric + 0.2::numeric; -- 0.3
```

Tipe floating-point menyimpan perkiraan. Untuk uang, gunakan `NUMERIC` agar hasil penjumlahan dan pembulatan dapat dipertanggungjawabkan.

## 4.7 🔧 `ALTER`, `DROP`, `TRUNCATE`, `RENAME`

```sql
ALTER TABLE users ADD COLUMN telepon TEXT;
ALTER TABLE users ALTER COLUMN telepon TYPE VARCHAR(20);
ALTER TABLE users RENAME COLUMN telepon TO no_hp;
ALTER TABLE users DROP COLUMN no_hp;

TRUNCATE TABLE users;          -- hapus semua baris, struktur tetap
DROP TABLE users;              -- hapus tabel
```

`TRUNCATE` lebih cepat daripada `DELETE` tanpa `WHERE`, tetapi tidak bisa di-rollback jika tidak berada dalam transaksi? Di PostgreSQL, `TRUNCATE` **bisa** di-rollback karena DDL transaksional.

## 4.8 🧭 Konvensi Penamaan

| Aturan | Contoh |
|---|---|
| Huruf kecil | `order_items` |
| Snake case | `created_at` |
| Nama tabel jamak | `users`, `orders` |
| Hindari kata kunci | `user` → `users` |
| Hindari huruf besar | `"Users"` memaksa kutip di semua query |

Identifier tanpa kutip dilipat ke huruf kecil. Jika Anda membuat `"Users"`, Anda harus selalu menulis `"Users"` dengan kutip.

## 4.9 🔍 Melihat Struktur

```sql
\d users
\d+ users
```

Atau lewat katalog:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users';
```

`pg_catalog` menyimpan metadata internal. Sebagian besar kebutuhan bisa dipenuhi `information_schema`, tetapi katalog PostgreSQL lebih lengkap.

## 4.10 🧪 Praktik

```sql
CREATE TABLE products (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama        TEXT NOT NULL,
  sku         TEXT NOT NULL UNIQUE,
  harga       NUMERIC(12,2) NOT NULL CHECK (harga >= 0),
  stok        INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
  aktif       BOOLEAN NOT NULL DEFAULT TRUE,
  atribut     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 📌 Ringkasan

- Gunakan `IDENTITY` untuk id otomatis modern.
- `TEXT` dan `VARCHAR` setara performa; batasi hanya jika perlu.
- `TIMESTAMPTZ` adalah pilihan aman untuk waktu.
- `NUMERIC` wajib untuk uang.
- DDL di PostgreSQL transaksional dan bisa di-rollback.
- Nama huruf kecil tanpa kutip menghindari banyak masalah.

## 🧪 Latihan

1. Buat tabel `users` dengan `IDENTITY`, `TEXT`, dan `TIMESTAMPTZ`.
2. Buat tabel `products` dengan `NUMERIC`, `CHECK`, dan `JSONB`.
3. Tambah kolom, ubah tipe, lalu hapus kolom.
4. Bandingkan hasil `0.1 + 0.2` pada `float` dan `numeric`.
5. Tampilkan struktur tabel lewat `\d` dan `information_schema`.

::: tip 💡 Tips
Sekali Anda membuat kolom dengan huruf besar, Anda akan menyesal di setiap query. Gunakan huruf kecil dan snake_case sejak awal.
:::
