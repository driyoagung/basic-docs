---
title: "Bab 10 — Subquery, CTE, Window Function & Fitur Query Khas"
---

# 🧠 Bab 10 — Subquery, CTE, Window Function & Fitur Query Khas

> 🎯 **Tujuan Bab:** menulis query kompleks yang tetap terbaca, termasuk fitur khas PostgreSQL seperti `DISTINCT ON`.

## 10.1 🔍 Subquery

### Di `WHERE`

```sql
SELECT nama, harga
FROM products
WHERE harga > (SELECT AVG(harga) FROM products);
```

### Di `FROM`

```sql
SELECT kategori_id, rata_rata
FROM (
  SELECT kategori_id, AVG(harga) AS rata_rata
  FROM products
  GROUP BY kategori_id
) t
WHERE rata_rata > 500000;
```

### Di `SELECT`

```sql
SELECT
  u.nama,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS jumlah_order
FROM users u;
```

Subquery di `SELECT` bisa menjadi mahal jika dieksekusi per baris. Periksa dengan `EXPLAIN`.

## 10.2 ✅ `EXISTS` vs `IN`

```sql
-- EXISTS: cocok untuk "ada/tidak ada"
SELECT u.nama
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id AND o.total > 1000000
);
```

`EXISTS` biasanya lebih aman untuk subquery yang mengembalikan banyak baris, dan tidak terpengaruh `NULL` seperti `NOT IN`.

```sql
-- Hati-hati jika subquery mengandung NULL
SELECT * FROM products
WHERE id NOT IN (SELECT product_id FROM order_items);
```

Gunakan `NOT EXISTS` untuk menghindari jebakan `NULL`.

## 10.3 🧱 CTE (`WITH`)

```sql
WITH omzet_bulanan AS (
  SELECT
    date_trunc('month', created_at) AS bulan,
    SUM(total) AS omzet
  FROM orders
  WHERE status IN ('paid', 'shipped', 'done')
  GROUP BY date_trunc('month', created_at)
)
SELECT bulan, omzet
FROM omzet_bulanan
ORDER BY bulan;
```

CTE membuat query bertahap dan mudah dibaca. Di PostgreSQL, CTE bisa dioptimasi inline (sejak versi 12), tetapi CTE yang dipakai berkali-kali bisa menjadi materialized.

## 10.4 🔁 CTE Rekursif

Hierarki kategori:

```sql
WITH RECURSIVE pohon_kategori AS (
  SELECT id, nama, parent_id, 1 AS level
  FROM categories
  WHERE parent_id IS NULL

  UNION ALL

  SELECT c.id, c.nama, c.parent_id, p.level + 1
  FROM categories c
  JOIN pohon_kategori p ON c.parent_id = p.id
)
SELECT id, nama, level
FROM pohon_kategori
ORDER BY level, nama;
```

Pastikan ada kondisi berhenti; tanpa itu, query bisa berjalan tanpa akhir.

## 10.5 🪟 Window Function

Window function menghitung tanpa menggabungkan baris.

```sql
SELECT
  id,
  user_id,
  total,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS urutan,
  SUM(total)   OVER (PARTITION BY user_id) AS total_user,
  LAG(total)   OVER (PARTITION BY user_id ORDER BY created_at) AS total_sebelumnya
FROM orders;
```

| Fungsi | Kegunaan |
|---|---|
| `ROW_NUMBER()` | Nomor urut unik |
| `RANK()` / `DENSE_RANK()` | Peringkat (dengan/tanpa celah) |
| `LAG()` / `LEAD()` | Nilai baris sebelumnya/berikutnya |
| `SUM() OVER()` | Total kumulatif atau per grup |

Frame:

```sql
SUM(total) OVER (
  ORDER BY created_at
  ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
) AS total_7_hari
```

## 10.6 🎯 `DISTINCT ON`

Fitur khas PostgreSQL untuk mengambil satu baris pertama per grup.

```sql
SELECT DISTINCT ON (user_id)
  user_id, id, total, created_at
FROM orders
ORDER BY user_id, created_at DESC;
```

Hasilnya: order terbaru untuk setiap user. Urutan `ORDER BY` harus dimulai dengan kolom `DISTINCT ON`.

## 10.7 🔗 `UNION`, `INTERSECT`, `EXCEPT`

```sql
SELECT email FROM users
UNION
SELECT email FROM newsletter_subscribers;

SELECT id FROM products
INTERSECT
SELECT product_id FROM order_items;

SELECT id FROM products
EXCEPT
SELECT product_id FROM order_items;
```

| Operator | Hasil |
|---|---|
| `UNION` | Gabungan tanpa duplikat |
| `UNION ALL` | Gabungan termasuk duplikat |
| `INTERSECT` | Irisan |
| `EXCEPT` | Ada di kiri, tidak di kanan |

## 10.8 ✍️ CTE yang Menulis Data

```sql
WITH order_baru AS (
  INSERT INTO orders (user_id, total, status)
  VALUES (1, 500000, 'pending')
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, nama_produk, harga, jumlah)
SELECT id, 1, 'Mouse', 250000, 2
FROM order_baru;
```

Pola ini menjaga operasi terkait dalam satu pernyataan dan satu transaksi implisit.

## 10.9 🎬 Studi Kasus

### 3 Produk Terlaris per Kategori

```sql
WITH penjualan AS (
  SELECT
    p.id,
    p.nama,
    p.kategori_id,
    SUM(oi.jumlah) AS terjual
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  GROUP BY p.id, p.nama, p.kategori_id
),
peringkat AS (
  SELECT *,
    RANK() OVER (
      PARTITION BY kategori_id
      ORDER BY terjual DESC
    ) AS posisi
  FROM penjualan
)
SELECT * FROM peringkat WHERE posisi <= 3;
```

### Pertumbuhan Omzet Bulanan

```sql
WITH omzet AS (
  SELECT
    date_trunc('month', created_at) AS bulan,
    SUM(total) AS total
  FROM orders
  WHERE status IN ('paid', 'shipped', 'done')
  GROUP BY date_trunc('month', created_at)
)
SELECT
  bulan,
  total,
  LAG(total) OVER (ORDER BY bulan) AS bulan_sebelumnya,
  ROUND(
    100.0 * (total - LAG(total) OVER (ORDER BY bulan))
    / NULLIF(LAG(total) OVER (ORDER BY bulan), 0),
    2
  ) AS pertumbuhan_persen
FROM omzet
ORDER BY bulan;
```

## 📌 Ringkasan

- Subquery bisa berada di `WHERE`, `FROM`, dan `SELECT`.
- `EXISTS`/`NOT EXISTS` lebih aman daripada `IN`/`NOT IN` saat ada NULL.
- CTE membuat query bertahap; CTE rekursif menangani hierarki.
- Window function menghitung tanpa menggabungkan baris.
- `DISTINCT ON` adalah cara ringkas mengambil baris teratas per grup.

## 🧪 Latihan

1. Tampilkan produk dengan harga di atas rata-rata.
2. Cari user yang punya minimal satu order di atas 1 juta memakai `EXISTS`.
3. Buat CTE rekursif untuk hierarki kategori.
4. Tampilkan order terbaru per user dengan `DISTINCT ON`.
5. Hitung pertumbuhan omzet bulanan dengan `LAG`.

::: tip 💡 Tips
Jika query mulai sulit dibaca, pecah menjadi CTE bernama jelas. Query yang mudah dibaca lebih mudah dioptimasi dan di-debug.
:::
