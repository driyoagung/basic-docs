---
title: "Bab 8 — JOIN"
---

# 🔗 Bab 8 — JOIN ⭐

> 🎯 **Tujuan Bab:** menggabungkan data antar tabel dengan benar, termasuk `LATERAL` dan `FULL OUTER JOIN` yang khas PostgreSQL.

## 8.1 🧠 Ide Dasar JOIN

JOIN mencocokkan baris dari dua tabel berdasarkan kondisi.

```sql
SELECT u.nama, o.id AS order_id, o.total
FROM users u
JOIN orders o ON o.user_id = u.id;
```

Hasilnya hanya user yang punya order. Itu artinya `INNER JOIN` (default `JOIN`).

## 8.2 📊 Jenis JOIN

| JOIN | Hasil |
|---|---|
| `INNER JOIN` | Hanya yang cocok di kedua tabel |
| `LEFT JOIN` | Semua dari kiri + yang cocok di kanan |
| `RIGHT JOIN` | Semua dari kanan + yang cocok di kiri |
| `FULL OUTER JOIN` | Semua dari kedua sisi |
| `CROSS JOIN` | Semua kombinasi |
| Self join | Tabel di-join dengan dirinya sendiri |
| `LATERAL` | Subquery yang boleh merujuk tabel di kiri |

## 8.3 ⬅️ `LEFT JOIN`

Semua user, termasuk yang belum punya order:

```sql
SELECT u.nama, COUNT(o.id) AS jumlah_order
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.nama
ORDER BY jumlah_order DESC;
```

`COUNT(o.id)` menghasilkan 0 untuk user tanpa order. Jika memakai `COUNT(*)`, hasilnya 1 karena baris user tetap ada.

## 8.4 🔁 `FULL OUTER JOIN`

PostgreSQL mendukung `FULL OUTER JOIN` secara langsung.

```sql
SELECT u.id AS user_id, u.nama, o.id AS order_id
FROM users u
FULL OUTER JOIN orders o ON o.user_id = u.id;
```

Berguna untuk audit: menemukan order tanpa user dan user tanpa order dalam satu query.

## 8.5 ➕ `CROSS JOIN`

Semua kombinasi baris:

```sql
SELECT p.nama, g.nama AS gudang
FROM products p
CROSS JOIN gudang g;
```

Gunakan dengan hati-hati; jumlah baris adalah hasil perkalian.

## 8.6 🔄 Self Join

Contoh: karyawan dan atasannya di tabel yang sama.

```sql
SELECT k.nama AS karyawan, a.nama AS atasan
FROM employees k
LEFT JOIN employees a ON a.id = k.atasan_id;
```

Alias berbeda wajib agar tidak bingung.

## 8.7 🧩 Join Banyak Tabel

```sql
SELECT
  o.id            AS order_id,
  u.nama          AS pelanggan,
  p.nama          AS produk,
  oi.jumlah,
  oi.harga,
  (oi.jumlah * oi.harga) AS subtotal
FROM orders o
JOIN users u       ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p    ON p.id = oi.product_id
WHERE o.status = 'paid'
ORDER BY o.id, p.nama;
```

## 8.8 🚀 `JOIN LATERAL`

`LATERAL` memungkinkan subquery merujuk kolom tabel di sebelah kiri. Contoh: 3 order terbaru per user.

```sql
SELECT u.nama, o.id, o.total, o.created_at
FROM users u
JOIN LATERAL (
  SELECT id, total, created_at
  FROM orders
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 3
) o ON TRUE
ORDER BY u.nama, o.created_at DESC;
```

Tanpa `LATERAL`, subquery tidak bisa merujuk `u.id`. Ini pola yang sangat berguna untuk "N terbaru per grup".

## 8.9 🧷 `USING` dan `NATURAL JOIN`

Jika nama kolom sama di kedua tabel:

```sql
SELECT *
FROM orders
JOIN order_items USING (order_id);
```

`NATURAL JOIN` mencocokkan semua kolom bernama sama secara otomatis. Hindari `NATURAL JOIN` karena rapuh: menambah kolom baru bisa mengubah hasil tanpa terlihat.

## 8.10 ⚠️ Kesalahan Umum

### Baris menggandakan

Jika satu order punya 3 item, join ke `order_items` menghasilkan 3 baris order. Saat menghitung total order, gunakan `SUM` dengan hati-hati atau subquery agregat.

```sql
-- Salah: total order bisa terhitung berulang
SELECT o.id, SUM(o.total)
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;
```

### Kondisi di `ON` vs `WHERE`

Pada `LEFT JOIN`, kondisi di `WHERE` bisa mengubahnya menjadi `INNER JOIN`:

```sql
-- Mengembalikan hanya user yang punya order paid
SELECT u.nama, o.id
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.status = 'paid';
```

Jika ingin semua user tetapi hanya order paid yang dihitung:

```sql
SELECT u.nama, o.id
FROM users u
LEFT JOIN orders o
  ON o.user_id = u.id AND o.status = 'paid';
```

## 8.11 🎬 Studi Kasus: Laporan Pesanan Lengkap

```sql
SELECT
  o.id,
  o.created_at::date AS tanggal,
  u.nama AS pelanggan,
  COUNT(oi.id) AS jumlah_item,
  SUM(oi.jumlah * oi.harga) AS total
FROM orders o
JOIN users u        ON u.id = o.user_id
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status IN ('paid', 'shipped', 'done')
GROUP BY o.id, o.created_at, u.nama
ORDER BY o.created_at DESC;
```

## 📌 Ringkasan

- `INNER JOIN` hanya baris yang cocok; `LEFT JOIN` mempertahankan sisi kiri.
- `FULL OUTER JOIN` tersedia langsung di PostgreSQL.
- `LATERAL` menyelesaikan "N terbaru per grup".
- Hati-hati baris menggandakan saat join ke tabel anak.
- Pahami perbedaan kondisi di `ON` dan `WHERE`.

## 🧪 Latihan

1. Tampilkan semua user beserta jumlah order, termasuk yang nol.
2. Cari order yang tidak memiliki item.
3. Tampilkan 3 order terbaru untuk setiap user memakai `LATERAL`.
4. Jelaskan mengapa join ke `order_items` menggandakan baris order.
5. Tulis laporan pesanan lengkap dengan nama user dan produk.

::: tip 💡 Tips
Sebelum join banyak tabel, periksa jumlah baris tiap tabel. Jika hasil akhir jauh lebih besar dari perkiraan, kemungkinan ada relasi one-to-many yang belum diagregasi.
:::
