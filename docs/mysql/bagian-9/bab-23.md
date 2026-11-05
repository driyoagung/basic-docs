---
title: "Bab 23 — Project Akhir: Database Toko Online"
---

# 🏆 Bab 23 — Project Akhir: Database Toko Online

> 🎯 **Tujuan Bab:** menyatukan seluruh materi menjadi satu database toko online yang lengkap, terukur, aman, dan bisa dipulihkan.

## 23.1 🎯 Yang Akan Dibangun

| Bagian | Isi |
|---|---|
| **Skema** | users, addresses, categories, products, product_images, carts, cart_items, orders, order_items, payments, reviews |
| **Seed data** | Data contoh yang cukup untuk latihan query dan performa |
| **Query laporan** | Omzet harian/bulanan, produk terlaris, pelanggan teratas, stok menipis |
| **Fitur lanjutan** | View laporan, trigger audit stok, transaksi checkout |
| **Performa** | Index yang tepat, bukti dengan `EXPLAIN` sebelum/sesudah |
| **Keamanan** | User khusus aplikasi dengan hak terbatas |
| **Operasional** | Skrip backup & restore |

Skema lengkap ada di [Bab 13](/bagian-4/bab-13). Gunakan database `toko_project` agar latihan sebelumnya tetap utuh.

## 23.2 🚀 Urutan Pengerjaan

```
Step 1  ─ Analisis kebutuhan & gambar ERD
Step 2  ─ Buat database, tabel, constraint, dan foreign key
Step 3  ─ Isi seed data
Step 4  ─ Tulis query CRUD & JOIN untuk fitur utama
Step 5  ─ Buat query laporan (GROUP BY, CTE, window function)
Step 6  ─ Implementasi transaksi checkout
Step 7  ─ Ukur query lambat, tambah index, bandingkan EXPLAIN
Step 8  ─ Buat view, trigger audit, dan user terbatas
Step 9  ─ Backup, hapus, lalu restore
Step 10 ─ Hubungkan ke aplikasi sederhana (PDO atau Node.js)
```

## 23.3 🧱 Step 1–2: Skema

```sql
CREATE DATABASE toko_project
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE toko_project;
```

Buat tabel dengan urutan:

1. `users`
2. `addresses`
3. `categories`
4. `products`
5. `product_images`
6. `carts`
7. `cart_items`
8. `orders`
9. `order_items`
10. `payments`
11. `reviews`

Urutan ini penting karena foreign key membutuhkan tabel induk yang sudah ada.

## 23.4 🌱 Step 3: Seed Data

```sql
INSERT INTO categories (nama) VALUES
  ('Elektronik'), ('Fashion'), ('Buku');

INSERT INTO products (kategori_id, nama, slug, harga, stok) VALUES
  (1, 'Keyboard Mekanik', 'keyboard-mekanik', 750000, 15),
  (1, 'Mouse Wireless', 'mouse-wireless', 250000, 40),
  (2, 'Kaos Polos', 'kaos-polos', 90000, 100),
  (3, 'Buku SQL Dasar', 'buku-sql-dasar', 120000, 25);
```

Untuk data ratusan baris, buat script generator (PHP/Node.js/Python) agar bisa diulang. Pastikan seed tidak melanggar foreign key.

## 23.5 🔎 Step 4: Query Fitur Utama

### Daftar produk aktif dengan kategori

```sql
SELECT p.id, p.nama, c.nama AS kategori, p.harga, p.stok
FROM products p
JOIN categories c ON c.id = p.kategori_id
WHERE p.aktif = 1
ORDER BY p.nama;
```

### Keranjang user

```sql
SELECT
  p.nama,
  ci.jumlah,
  p.harga,
  (ci.jumlah * p.harga) AS subtotal
FROM carts c
JOIN cart_items ci ON ci.cart_id = c.id
JOIN products p    ON p.id = ci.product_id
WHERE c.user_id = 1;
```

### Riwayat pesanan user

```sql
SELECT o.id, o.status, o.total, o.created_at
FROM orders o
WHERE o.user_id = 1
ORDER BY o.created_at DESC;
```

## 23.6 📊 Step 5: Query Laporan

### Omzet bulanan

```sql
SELECT
  DATE_FORMAT(created_at, '%Y-%m') AS bulan,
  COUNT(*) AS jumlah_order,
  SUM(total) AS omzet
FROM orders
WHERE status IN ('paid', 'shipped', 'done')
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY bulan;
```

### Produk terlaris

```sql
SELECT p.id, p.nama, SUM(oi.jumlah) AS terjual
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY p.id, p.nama
ORDER BY terjual DESC
LIMIT 10;
```

### Pelanggan teratas

```sql
SELECT u.id, u.nama, SUM(o.total) AS total_belanja
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status <> 'cancelled'
GROUP BY u.id, u.nama
ORDER BY total_belanja DESC
LIMIT 10;
```

### Stok menipis

```sql
SELECT id, nama, stok
FROM products
WHERE stok < 10
ORDER BY stok ASC;
```

### 3 produk terlaris per kategori

```sql
SELECT *
FROM (
  SELECT
    p.nama,
    p.kategori_id,
    SUM(oi.jumlah) AS terjual,
    RANK() OVER (
      PARTITION BY p.kategori_id
      ORDER BY SUM(oi.jumlah) DESC
    ) AS peringkat
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  GROUP BY p.id, p.nama, p.kategori_id
) t
WHERE peringkat <= 3;
```

## 23.7 🔒 Step 6: Transaksi Checkout

```sql
START TRANSACTION;

SELECT stok
FROM products
WHERE id = 1
FOR UPDATE;

UPDATE products
SET stok = stok - 1
WHERE id = 1 AND stok >= 1;

INSERT INTO orders (user_id, address_id, total, status)
VALUES (1, 1, 750000, 'pending');

INSERT INTO order_items (order_id, product_id, nama_produk, harga, jumlah)
VALUES (LAST_INSERT_ID(), 1, 'Keyboard Mekanik', 750000, 1);

COMMIT;
```

Jika stok tidak cukup:

```sql
ROLLBACK;
```

Pastikan aplikasi memeriksa hasil `UPDATE` (affected rows) sebelum melanjutkan.

## 23.8 ⚡ Step 7: Performa

Sebelum menambah index:

```sql
EXPLAIN SELECT *
FROM orders
WHERE user_id = 1
ORDER BY created_at DESC;
```

Jika `type: ALL`:

```sql
CREATE INDEX idx_orders_user_created
  ON orders(user_id, created_at);
```

Ulangi `EXPLAIN` dan catat perubahan `type`, `key`, dan `rows`.

Query laporan yang sering dipakai bisa dibantu index pada:

- `orders(status, created_at)`;
- `order_items(product_id)`;
- `products(kategori_id, harga)`;
- `products(aktif, stok)`.

## 23.9 🧰 Step 8: View, Trigger Audit, User Terbatas

### View laporan

```sql
CREATE VIEW v_omzet_bulanan AS
SELECT
  DATE_FORMAT(created_at, '%Y-%m') AS bulan,
  SUM(total) AS omzet
FROM orders
WHERE status IN ('paid', 'shipped', 'done')
GROUP BY DATE_FORMAT(created_at, '%Y-%m');
```

### Trigger audit stok

Gunakan trigger hanya jika aplikasi tidak juga mengubah stok secara manual. Pilih satu sumber kebenaran.

```sql
CREATE TABLE stok_audit (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  perubahan  INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### User aplikasi

```sql
CREATE USER 'app_toko_project'@'%' IDENTIFIED BY 'password_kuat_sekali';
GRANT SELECT, INSERT, UPDATE, DELETE ON toko_project.* TO 'app_toko_project'@'%';
```

## 23.10 💾 Step 9: Backup & Restore

```bash
mysqldump -u root -p --single-transaction \
  --routines --triggers --events \
  toko_project > toko_project_backup.sql
```

Uji restore:

```bash
mysql -u root -p -e "CREATE DATABASE toko_project_restore"
mysql -u root -p toko_project_restore < toko_project_backup.sql
```

Bandingkan jumlah baris tabel utama:

```sql
SELECT 'orders' AS tabel, COUNT(*) FROM toko_project.orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM toko_project.order_items;
```

## 23.11 🔌 Step 10: Integrasi Aplikasi

Hubungkan aplikasi sederhana (PDO atau `mysql2`) dan tampilkan:

- daftar produk;
- detail order;
- laporan omzet.

Aktifkan query log untuk memastikan tidak ada N+1.

## ✅ Checklist Akhir

```
Desain:      ☐ Terstruktur & ternormalisasi   ☐ Tipe data tepat (DECIMAL untuk uang)
Integritas:  ☐ Foreign key & constraint       ☐ Snapshot harga di order_items
Performa:    ☐ Index pada kolom yang difilter ☐ Query lambat sudah diperiksa EXPLAIN
Konsistensi: ☐ Transaksi untuk operasi multi-langkah
Keamanan:    ☐ Aplikasi tidak memakai root    ☐ Prepared statement
Operasional: ☐ Backup rutin & sudah diuji restore
```

## 📝 Rubrik Penilaian

| Aspek | Bobot | Indikator |
|---|---|---|
| Skema | 25% | Ternormalisasi, foreign key, tipe data tepat |
| Query | 25% | CRUD, JOIN, laporan benar |
| Performa | 20% | Index tepat, bukti EXPLAIN |
| Konsistensi | 15% | Transaksi checkout aman |
| Keamanan & operasional | 15% | Least privilege, backup teruji |

## 📌 Ringkasan

- Project ini menggabungkan desain, query, performa, konsistensi, keamanan, dan operasional.
- Mulai dari skema, lalu data, query, optimasi, dan pengamanan.
- Setiap keputusan harus bisa dijelaskan dan diukur.
- Database yang baik bukan yang paling rumit, tetapi yang paling tepat untuk kebutuhan.

::: tip 💡 Tips
Setelah project selesai, minta orang lain membaca skema Anda dan mencoba menjawab pertanyaan bisnis. Jika mereka kesulitan, mungkin ada bagian desain yang perlu disederhanakan.
:::
