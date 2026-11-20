---
title: "Bab 5 — CRUD, RETURNING & Upsert"
---

# 🔄 Bab 5 — CRUD, `RETURNING` & Upsert

> 🎯 **Tujuan Bab:** menulis operasi data harian dengan fitur PostgreSQL yang menghemat query dan menjaga konsistensi.

## 5.1 ➕ `INSERT`

Satu baris:

```sql
INSERT INTO users (nama, email)
VALUES ('Budi', 'budi@mail.com');
```

Banyak baris:

```sql
INSERT INTO users (nama, email) VALUES
  ('Sari', 'sari@mail.com'),
  ('Andi', 'andi@mail.com');
```

Dari tabel lain:

```sql
INSERT INTO users_arsip (id, nama, email)
SELECT id, nama, email
FROM users
WHERE created_at < '2024-01-01';
```

## 5.2 🔁 `RETURNING`

`RETURNING` mengembalikan nilai dari baris yang baru ditulis.

```sql
INSERT INTO users (nama, email)
VALUES ('Rina', 'rina@mail.com')
RETURNING id, created_at;
```

Tanpa `RETURNING`, Anda perlu query kedua untuk mendapatkan id. Dengan `RETURNING`, satu round-trip cukup.

Bisa juga pada `UPDATE` dan `DELETE`:

```sql
UPDATE products
SET harga = harga * 1.1
WHERE kategori_id = 3
RETURNING id, nama, harga;

DELETE FROM carts
WHERE created_at < now() - INTERVAL '30 days'
RETURNING id;
```

## 5.3 🔀 Upsert dengan `ON CONFLICT`

```sql
INSERT INTO products (sku, nama, harga)
VALUES ('LP-001', 'Laptop', 15000000)
ON CONFLICT (sku)
DO UPDATE SET
  nama  = EXCLUDED.nama,
  harga = EXCLUDED.harga;
```

`EXCLUDED` merujuk pada baris yang gagal dimasukkan.

Hanya abaikan konflik:

```sql
INSERT INTO products (sku, nama, harga)
VALUES ('LP-001', 'Laptop', 15000000)
ON CONFLICT (sku) DO NOTHING;
```

Syarat: kolom konflik harus memiliki `UNIQUE` atau `PRIMARY KEY`.

## 5.4 🧩 `MERGE` (PostgreSQL 15+)

`MERGE` menggabungkan data dari sumber lain dengan aturan yang lebih eksplisit.

```sql
MERGE INTO products p
USING (VALUES ('LP-001', 'Laptop Baru', 15500000)) AS v(sku, nama, harga)
ON p.sku = v.sku
WHEN MATCHED THEN
  UPDATE SET nama = v.nama, harga = v.harga
WHEN NOT MATCHED THEN
  INSERT (sku, nama, harga) VALUES (v.sku, v.nama, v.harga);
```

Kapan memakai:

- `ON CONFLICT` untuk insert/upsert sederhana;
- `MERGE` untuk aturan yang lebih kompleks dan banyak kondisi.

## 5.5 🔗 `UPDATE ... FROM` dan `DELETE ... USING`

Update berdasarkan tabel lain:

```sql
UPDATE order_items oi
SET harga = p.harga
FROM products p
WHERE oi.product_id = p.id
  AND oi.harga IS NULL;
```

Hapus berdasarkan tabel lain:

```sql
DELETE FROM cart_items ci
USING carts c
WHERE ci.cart_id = c.id
  AND c.created_at < now() - INTERVAL '60 days';
```

## 5.6 📤 `COPY` untuk Data Massal

Export ke file di server:

```sql
COPY users TO '/tmp/users.csv' WITH (FORMAT csv, HEADER true);
```

Import:

```sql
COPY users (nama, email)
FROM '/tmp/users.csv'
WITH (FORMAT csv, HEADER true);
```

Dari sisi client:

```text
\copy users TO 'users.csv' WITH (FORMAT csv, HEADER true)
\copy users (nama, email) FROM 'users.csv' WITH (FORMAT csv, HEADER true)
```

`COPY` jauh lebih cepat daripada ribuan `INSERT` untuk data besar. Perhatikan izin file dan validasi data setelah import.

## 5.7 ⚠️ Kebiasaan Aman

Sebelum `UPDATE` atau `DELETE`:

```sql
-- 1. Lihat baris yang akan terpengaruh
SELECT * FROM orders WHERE status = 'pending' AND created_at < '2024-01-01';

-- 2. Jalankan dalam transaksi
BEGIN;
DELETE FROM orders WHERE status = 'pending' AND created_at < '2024-01-01';
-- periksa jumlah baris
ROLLBACK; -- atau COMMIT;
```

Selalu pakai `WHERE`. `DELETE` tanpa `WHERE` menghapus seluruh tabel.

## 5.8 🎬 Studi Kasus: Menghubungkan Data dengan `RETURNING`

Membuat order dan item tanpa query id terpisah:

```sql
BEGIN;

WITH order_baru AS (
  INSERT INTO orders (user_id, total, status)
  VALUES (1, 750000, 'pending')
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, nama_produk, harga, jumlah)
SELECT id, 1, 'Keyboard Mekanik', 750000, 1
FROM order_baru;

COMMIT;
```

Pola `WITH ... INSERT ... RETURNING` memungkinkan satu pernyataan membuat induk dan anak secara konsisten.

## 📌 Ringkasan

- `RETURNING` menghilangkan kebutuhan query id kedua.
- `ON CONFLICT` adalah upsert idiomatik PostgreSQL.
- `MERGE` cocok untuk aturan penggabungan yang kompleks.
- `UPDATE ... FROM` dan `DELETE ... USING` menghubungkan operasi dengan tabel lain.
- `COPY` adalah cara cepat memindahkan data massal.

## 🧪 Latihan

1. Insert user dan kembalikan `id` serta `created_at`.
2. Lakukan upsert produk berdasarkan `sku`.
3. Update harga produk dari tabel harga baru memakai `UPDATE ... FROM`.
4. Export tabel `users` ke CSV dan import kembali ke tabel baru.
5. Tulis transaksi yang membuat order beserta item memakai `RETURNING`.

::: tip 💡 Tips
Biasakan menjalankan `SELECT` dengan kondisi yang sama sebelum `UPDATE`/`DELETE`. Ini kebiasaan kecil yang mencegah bencana besar.
:::
