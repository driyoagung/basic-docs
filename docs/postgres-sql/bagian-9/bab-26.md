---
title: "Bab 26 — Project Akhir: Database Toko Online"
---

# 🏆 Bab 26 — Project Akhir: Database Toko Online

> 🎯 **Tujuan Bab:** membangun database toko online lengkap dari desain sampai operasi, sebagai bukti penguasaan materi.

## 26.1 🎯 Ruang Lingkup

Anda akan membangun database `toko` dengan:

- pengguna dan alamat;
- kategori dan produk;
- keranjang;
- pesanan dan pembayaran;
- ulasan;
- pencarian produk;
- laporan penjualan;
- keamanan role;
- backup dan restore.

Skema dasar ada di Bab 12. Project ini menambahkan data, query, operasi, dan pengujian.

## 26.2 🧱 Langkah 1 — Bangun Skema

Buat file `schema.sql` berisi:

1. `CREATE DATABASE toko;`
2. `\c toko`
3. semua tabel dari Bab 12;
4. index;
5. trigger `updated_at`;
6. constraint.

Jalankan:

```bash
psql -U postgres -f schema.sql
```

Verifikasi:

```sql
\dt
\d orders
\d order_items
```

## 26.3 🌱 Langkah 2 — Isi Data

Buat `seed.sql`:

```sql
INSERT INTO categories (nama, slug) VALUES
  ('Elektronik', 'elektronik'),
  ('Fashion', 'fashion'),
  ('Buku', 'buku');

INSERT INTO products (kategori_id, nama, slug, harga, stok, attrs) VALUES
  (1, 'Laptop 14 inci', 'laptop-14', 12000000, 5,
   '{"ram":16,"storage":"512GB SSD","warna":"hitam"}'),
  (1, 'Keyboard Mekanik', 'keyboard-mekanik', 750000, 20,
   '{"switch":"biru","layout":"TKL"}'),
  (2, 'Kaos Polos', 'kaos-polos', 90000, 100,
   '{"bahan":"katun","ukuran":["M","L","XL"]}'),
  (3, 'Buku PostgreSQL', 'buku-postgresql', 150000, 30,
   '{"halaman":400,"bahasa":"Indonesia"}');

INSERT INTO users (nama, email, password_hash) VALUES
  ('Budi', 'budi@mail.com', 'x'),
  ('Sari', 'sari@mail.com', 'x');
```

Untuk data besar:

```sql
INSERT INTO orders (user_id, total, status, created_at)
SELECT
  (1 + (i % 2)),
  (50000 + (i % 20) * 10000),
  CASE WHEN i % 5 = 0 THEN 'pending' ELSE 'paid' END,
  now() - (i || ' hours')::interval
FROM generate_series(1, 1000) AS i;
```

## 26.4 🔎 Langkah 3 — Katalog & Pencarian

Daftar produk aktif dengan kategori:

```sql
SELECT
  p.id,
  p.nama,
  c.nama AS kategori,
  p.harga,
  p.stok
FROM products p
JOIN categories c ON c.id = p.kategori_id
WHERE p.aktif = TRUE
ORDER BY p.harga
LIMIT 20;
```

Pencarian full-text:

```sql
ALTER TABLE products
  ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('indonesian', nama || ' ' || COALESCE(deskripsi, ''))
  ) STORED;

CREATE INDEX idx_products_search ON products USING GIN (search_vector);

SELECT nama, harga
FROM products
WHERE search_vector @@ plainto_tsquery('indonesian', 'keyboard mekanik')
ORDER BY harga;
```

Filter JSONB:

```sql
SELECT nama, attrs->>'warna' AS warna
FROM products
WHERE attrs @> '{"warna":"hitam"}';
```

## 26.5 🛒 Langkah 4 — Keranjang

Tambahkan item:

```sql
INSERT INTO cart_items (cart_id, product_id, jumlah)
VALUES (1, 2, 1)
ON CONFLICT (cart_id, product_id)
DO UPDATE SET jumlah = cart_items.jumlah + EXCLUDED.jumlah;
```

Lihat keranjang:

```sql
SELECT
  p.nama,
  ci.jumlah,
  p.harga,
  (ci.jumlah * p.harga) AS subtotal
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
WHERE ci.cart_id = 1;
```

Total:

```sql
SELECT COALESCE(SUM(ci.jumlah * p.harga), 0) AS total
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
WHERE ci.cart_id = 1;
```

## 26.6 💳 Langkah 5 — Checkout Transaksional

Checkout harus:

1. mengunci stok;
2. memeriksa ketersediaan;
3. membuat order;
4. menyalin item dan harga;
5. mengurangi stok;
6. membuat pembayaran;
7. mengosongkan keranjang.

```sql
BEGIN;

-- 1. kunci baris produk
SELECT id, harga, stok
FROM products
WHERE id IN (2, 3)
FOR UPDATE;

-- 2. buat order
INSERT INTO orders (user_id, address_id, total, status)
VALUES (1, 1, 0, 'pending')
RETURNING id;
-- misal menghasilkan 1001

-- 3. salin item + snapshot harga
INSERT INTO order_items (order_id, product_id, nama_produk, harga, jumlah)
SELECT 1001, p.id, p.nama, p.harga, ci.jumlah
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
WHERE ci.cart_id = 1;

-- 4. kurangi stok
UPDATE products p
SET stok = p.stok - ci.jumlah
FROM cart_items ci
WHERE ci.cart_id = 1
  AND ci.product_id = p.id;

-- 5. hitung total
UPDATE orders o
SET total = (
  SELECT SUM(harga * jumlah)
  FROM order_items
  WHERE order_id = o.id
)
WHERE o.id = 1001;

-- 6. pembayaran
INSERT INTO payments (order_id, metode, jumlah, status)
SELECT id, 'transfer', total, 'pending'
FROM orders
WHERE id = 1001;

-- 7. kosongkan keranjang
DELETE FROM cart_items WHERE cart_id = 1;

COMMIT;
```

Di aplikasi nyata, gunakan satu transaksi dan tangani error dengan `ROLLBACK`.

## 26.7 💰 Langkah 6 — Laporan

Omzet bulanan:

```sql
SELECT
  date_trunc('month', created_at) AS bulan,
  COUNT(*) AS jumlah_order,
  SUM(total) AS omzet
FROM orders
WHERE status IN ('paid','shipped','done')
GROUP BY 1
ORDER BY 1;
```

Produk terlaris:

```sql
SELECT
  oi.nama_produk,
  SUM(oi.jumlah) AS terjual,
  SUM(oi.jumlah * oi.harga) AS omzet
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status IN ('paid','shipped','done')
GROUP BY oi.nama_produk
ORDER BY terjual DESC
LIMIT 10;
```

Pelanggan terbaik:

```sql
SELECT
  u.nama,
  COUNT(o.id) AS jumlah_order,
  SUM(o.total) AS total_belanja
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status IN ('paid','shipped','done')
GROUP BY u.id, u.nama
ORDER BY total_belanja DESC
LIMIT 10;
```

Materialized view:

```sql
CREATE MATERIALIZED VIEW mv_omzet_bulanan AS
SELECT
  date_trunc('month', created_at) AS bulan,
  COUNT(*) AS jumlah_order,
  SUM(total) AS omzet
FROM orders
WHERE status IN ('paid','shipped','done')
GROUP BY 1;

CREATE UNIQUE INDEX uq_mv_omzet_bulanan ON mv_omzet_bulanan (bulan);
```

Refresh:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_omzet_bulanan;
```

## 26.8 🛡️ Langkah 7 — Keamanan

```sql
CREATE ROLE app_toko LOGIN PASSWORD 'rahasia';
CREATE ROLE readonly NOLOGIN;

GRANT CONNECT ON DATABASE toko TO app_toko, readonly;
GRANT USAGE ON SCHEMA public TO app_toko, readonly;

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public TO app_toko;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_toko;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO readonly;
```

RLS untuk order:

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;

CREATE POLICY order_milik_user ON orders
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::bigint)
  WITH CHECK (user_id = current_setting('app.user_id', true)::bigint);
```

## 26.9 ⚡ Langkah 8 — Performa

Periksa query checkout:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, harga, stok
FROM products
WHERE id IN (2, 3)
FOR UPDATE;
```

Periksa laporan:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT oi.nama_produk, SUM(oi.jumlah)
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'paid'
GROUP BY oi.nama_produk
ORDER BY 2 DESC
LIMIT 10;
```

Tambahkan index jika perlu:

```sql
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

Cek query mahal:

```sql
SELECT calls, total_exec_time, query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

## 26.10 💾 Langkah 9 — Backup & Restore

Backup:

```bash
pg_dump -U postgres -d toko -Fc -f toko.dump
```

Restore ke database uji:

```bash
createdb -U postgres toko_uji
pg_restore -U postgres -d toko_uji toko.dump
```

Verifikasi jumlah data:

```sql
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM order_items;
```

## 26.11 ✅ Langkah 10 — Uji

| Uji | Harapan |
|---|---|
| Checkout stok cukup | Order dibuat, stok berkurang |
| Checkout stok kurang | Gagal, tidak ada perubahan |
| Dua checkout bersamaan | Tidak ada stok negatif |
| Pencarian produk | Hasil relevan |
| RLS user lain | Tidak bisa melihat order orang lain |
| Restore backup | Data utuh |
| Query laporan | Selesai dalam waktu wajar |

## 26.12 📦 Deliverable

Kumpulkan:

1. `schema.sql`;
2. `seed.sql`;
3. `queries.sql` berisi laporan;
4. `roles.sql`;
5. `backup.sh` atau prosedur backup;
6. `README.md` berisi cara menjalankan;
7. screenshot `EXPLAIN` sebelum/sesudah index;
8. catatan keputusan desain.

## 26.13 🧠 Evaluasi Diri

- Apakah semua relasi memiliki foreign key?
- Apakah uang memakai `NUMERIC`?
- Apakah waktu memakai `TIMESTAMPTZ`?
- Apakah checkout aman dari race condition?
- Apakah pencarian memakai index?
- Apakah role aplikasi bukan superuser?
- Apakah backup pernah diuji restore?
- Apakah query laporan sudah diukur?

## 📌 Ringkasan

- Project akhir menggabungkan desain, SQL, keamanan, performa, dan operasi.
- Checkout adalah inti yang harus transaksional dan aman.
- Laporan membutuhkan index dan agregasi yang tepat.
- Backup harus diuji, bukan hanya dibuat.
- Dokumentasi keputusan adalah bagian dari hasil kerja.

## 🧪 Latihan

1. Selesaikan seluruh langkah project.
2. Uji checkout bersamaan dari dua sesi.
3. Ukur laporan sebelum dan sesudah index.
4. Terapkan RLS dan uji dengan dua user.
5. Restore backup ke database baru.

::: tip 💡 Tips
Bangun project ini bertahap dan commit setiap langkah. Jika ada yang salah, Anda bisa kembali ke titik terakhir yang berfungsi tanpa mengulang semuanya.
:::
