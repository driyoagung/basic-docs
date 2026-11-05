---
title: "Bab 9 — JOIN"
---

# 🔗 Bab 9 — JOIN ⭐

> 🎯 **Tujuan Bab:** menggabungkan data dari beberapa tabel dengan benar, memilih jenis JOIN yang tepat, dan menghindari duplikasi serta hasil yang menyesatkan.

## 9.1 🔗 Jenis JOIN

```sql
-- INNER JOIN: hanya baris yang cocok di kedua tabel
SELECT u.nama, o.id AS order_id, o.total
FROM users u
INNER JOIN orders o ON o.user_id = u.id;

-- LEFT JOIN: semua user, termasuk yang belum punya order
SELECT u.nama, COUNT(o.id) AS jumlah_order
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.nama;
```

| JOIN | Hasil |
|---|---|
| `INNER JOIN` | Hanya yang cocok di kedua tabel |
| `LEFT JOIN` | Semua dari tabel kiri + yang cocok di kanan (sisanya `NULL`) |
| `RIGHT JOIN` | Kebalikan `LEFT JOIN` |
| `CROSS JOIN` | Semua kombinasi (hati-hati ukuran hasil) |
| Self join | Tabel di-join dengan dirinya sendiri (hierarki, misalnya kategori) |

> 💡 `RIGHT JOIN` jarang dipakai karena bisa ditulis sebagai `LEFT JOIN` dengan urutan tabel dibalik. Konsistensi memakai `LEFT JOIN` membuat query lebih mudah dibaca.

## 9.2 🧠 Visualisasi Sederhana

```
users              orders
┌────┬──────┐      ┌────┬─────────┬────────┐
│ id │ nama │      │ id │ user_id │ total  │
├────┼──────┤      ├────┼─────────┼────────┤
│ 1  │ Budi │      │ 10 │ 1       │ 150000 │
│ 2  │ Ani  │      │ 11 │ 1       │  90000 │
│ 3  │ Citra│      │ 12 │ 2       │ 200000 │
└────┴──────┘      └────┴─────────┴────────┘
```

`INNER JOIN users × orders` menghasilkan tiga baris: Budi dua kali, Ani satu kali. Citra tidak muncul karena belum punya order.

`LEFT JOIN` dari `users` menghasilkan empat baris: Citra tetap muncul dengan `order_id` dan `total` bernilai `NULL`.

## 9.3 🔁 Join Banyak Tabel

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

Alur berpikirnya:

1. Mulai dari `orders`.
2. Ambil pemilik order dari `users`.
3. Ambil item order dari `order_items`.
4. Ambil nama produk dari `products`.

## 9.4 🕳️ Anti-Join: Mencari yang Tidak Punya Pasangan

```sql
-- User yang belum pernah membuat order
SELECT u.id, u.nama
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;
```

Pola `LEFT JOIN ... WHERE ... IS NULL` adalah cara standar mencari data yang tidak memiliki pasangan.

## 9.5 ⚠️ Kesalahan Umum

### Join menggandakan baris

Jika satu order punya tiga item, join ke `order_items` akan menghasilkan tiga baris untuk order tersebut. Saat menjumlahkan total, Anda bisa menghitung order lebih dari sekali.

```sql
-- ❌ Total bisa berlipat karena join ke item
SELECT SUM(o.total)
FROM orders o
JOIN order_items oi ON oi.order_id = o.id;

-- ✅ Jumlahkan dari tabel yang tepat
SELECT SUM(total) FROM orders;
```

### Kondisi di `ON` vs `WHERE`

Untuk `LEFT JOIN`, kondisi di `ON` dan `WHERE` memberi hasil berbeda.

```sql
-- Filter di ON: semua user tetap muncul, order cancelled jadi NULL
SELECT u.nama, o.id
FROM users u
LEFT JOIN orders o
  ON o.user_id = u.id AND o.status = 'paid';

-- Filter di WHERE: user tanpa order paid ikut hilang
SELECT u.nama, o.id
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.status = 'paid';
```

### Lupa kondisi join

```sql
-- ❌ Cross join tidak sengaja
SELECT * FROM users, orders;
```

Tanpa `ON`, MySQL menganggapnya `CROSS JOIN` dan hasilnya bisa sangat besar.

## 9.6 🎬 Studi Kasus: Laporan Pesanan Lengkap

```sql
SELECT
  o.id AS order_id,
  DATE(o.created_at) AS tanggal,
  u.nama AS pelanggan,
  p.nama AS produk,
  oi.jumlah,
  oi.harga,
  (oi.jumlah * oi.harga) AS subtotal
FROM orders o
JOIN users u        ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p     ON p.id = oi.product_id
ORDER BY o.created_at DESC, o.id DESC;
```

Query ini menjawab: "Siapa membeli apa, berapa banyak, dengan harga berapa?"

## 📌 Ringkasan

- `INNER JOIN` hanya mengambil pasangan yang cocok.
- `LEFT JOIN` mempertahankan semua baris tabel kiri.
- Anti-join memakai `LEFT JOIN ... IS NULL`.
- Join banyak tabel mengikuti alur relasi foreign key.
- Hati-hati duplikasi baris dan perbedaan `ON` vs `WHERE`.

## 🧪 Latihan

1. Tampilkan semua order beserta nama pelanggannya.
2. Tampilkan semua user, termasuk yang belum punya order.
3. Tampilkan produk yang belum pernah terjual.
4. Tampilkan total item per order.
5. Jelaskan mengapa `SUM(o.total)` bisa salah setelah join ke `order_items`.

::: tip 💡 Tips
Sebelum menulis JOIN, gambar dulu tabel dan garis relasinya. Jika Anda tidak bisa menjelaskan "baris apa yang muncul", query akan sulit dipercaya.
:::
