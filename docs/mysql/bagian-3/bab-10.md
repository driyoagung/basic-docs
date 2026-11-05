---
title: "Bab 10 — Agregasi & Pengelompokan"
---

# 📊 Bab 10 — Agregasi & Pengelompokan

> 🎯 **Tujuan Bab:** menjawab pertanyaan bisnis seperti "berapa total omzet", "siapa pelanggan teratas", dan "produk apa yang paling laris" memakai `GROUP BY` dan fungsi agregat.

## 10.1 📈 Fungsi Agregat

```sql
SELECT
  COUNT(*)      AS jumlah_order,
  SUM(total)    AS omzet,
  AVG(total)    AS rata_rata,
  MIN(total)    AS terkecil,
  MAX(total)    AS terbesar
FROM orders;
```

| Fungsi | Kegunaan |
|---|---|
| `COUNT` | Menghitung baris |
| `SUM` | Menjumlahkan nilai |
| `AVG` | Rata-rata |
| `MIN` / `MAX` | Nilai terkecil / terbesar |

## 10.2 📊 `GROUP BY`

```sql
SELECT
  status,
  COUNT(*)   AS jumlah,
  SUM(total) AS omzet,
  AVG(total) AS rata_rata
FROM orders
GROUP BY status
ORDER BY omzet DESC;
```

`GROUP BY status` mengelompokkan order berdasarkan status, lalu agregat dihitung per kelompok.

### Aturan Kolom di `SELECT`

Jika memakai `GROUP BY`, kolom yang tidak diagregasi harus muncul di `GROUP BY`.

```sql
-- ✅ Benar
SELECT status, COUNT(*)
FROM orders
GROUP BY status;

-- ❌ Tidak deterministik
SELECT id, status, COUNT(*)
FROM orders
GROUP BY status;
```

> ⚠️ MySQL lama bisa meloloskan query kedua dengan `ONLY_FULL_GROUP_BY` dimatikan, tetapi hasilnya tidak dapat diandalkan. Biarkan `ONLY_FULL_GROUP_BY` aktif.

## 10.3 ⚖️ `WHERE` vs `HAVING`

| Klausa | Kapan dievaluasi | Untuk |
|---|---|---|
| `WHERE` | Sebelum grouping | Menyaring baris |
| `HAVING` | Setelah grouping | Menyaring kelompok |

```sql
SELECT status, SUM(total) AS omzet
FROM orders
WHERE created_at >= '2026-01-01'
GROUP BY status
HAVING SUM(total) > 1000000
ORDER BY omzet DESC;
```

Jangan memakai `HAVING` untuk hal yang bisa dilakukan `WHERE` — `WHERE` lebih cepat karena menyaring lebih awal.

## 10.4 🔢 Varian `COUNT`

```sql
SELECT
  COUNT(*)                  AS semua_baris,
  COUNT(telepon)            AS punya_telepon,
  COUNT(DISTINCT user_id)   AS user_unik
FROM users;
```

| Bentuk | Arti |
|---|---|
| `COUNT(*)` | Semua baris, termasuk yang berisi `NULL` |
| `COUNT(kolom)` | Baris dengan kolom tidak `NULL` |
| `COUNT(DISTINCT kolom)` | Nilai unik yang tidak `NULL` |

## 10.5 🧮 `ROLLUP` untuk Subtotal

```sql
SELECT
  status,
  DATE(created_at) AS tanggal,
  SUM(total)       AS omzet
FROM orders
GROUP BY status, DATE(created_at) WITH ROLLUP;
```

`WITH ROLLUP` menambahkan baris subtotal untuk setiap tingkat pengelompokan, termasuk total keseluruhan. Berguna untuk laporan bertingkat.

## 10.6 🎬 Studi Kasus: Laporan Penjualan

### Omzet harian

```sql
SELECT
  DATE(created_at) AS tanggal,
  COUNT(*)         AS jumlah_order,
  SUM(total)       AS omzet
FROM orders
WHERE status IN ('paid', 'shipped', 'done')
GROUP BY DATE(created_at)
ORDER BY tanggal DESC;
```

### Omzet bulanan

```sql
SELECT
  DATE_FORMAT(created_at, '%Y-%m') AS bulan,
  SUM(total) AS omzet
FROM orders
WHERE status <> 'cancelled'
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY bulan;
```

### Produk terlaris

```sql
SELECT
  p.id,
  p.nama,
  SUM(oi.jumlah) AS terjual
FROM order_items oi
JOIN products p ON p.id = oi.product_id
GROUP BY p.id, p.nama
ORDER BY terjual DESC
LIMIT 10;
```

### Pelanggan teratas

```sql
SELECT
  u.id,
  u.nama,
  COUNT(o.id)   AS jumlah_order,
  SUM(o.total)  AS total_belanja
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status <> 'cancelled'
GROUP BY u.id, u.nama
ORDER BY total_belanja DESC
LIMIT 10;
```

## 10.7 ⚠️ Jebakan Agregasi

- Menjumlahkan `o.total` setelah join ke `order_items` bisa menggandakan nilai.
- `AVG` mengabaikan `NULL`; pastikan itu yang Anda inginkan.
- `SUM` pada data kosong menghasilkan `NULL`, bukan `0`. Gunakan `COALESCE(SUM(...), 0)` jika perlu.
- Jangan campur agregat dan kolom non-agregat tanpa `GROUP BY`.

## 📌 Ringkasan

- Agregat merangkum banyak baris menjadi satu nilai.
- `GROUP BY` mengelompokkan sebelum agregasi.
- `WHERE` menyaring baris; `HAVING` menyaring kelompok.
- `COUNT(*)`, `COUNT(kolom)`, dan `COUNT(DISTINCT ...)` berbeda.
- Hati-hati join yang menggandakan baris saat menjumlahkan.

## 🧪 Latihan

1. Hitung jumlah order dan total omzet per status.
2. Tampilkan omzet per bulan untuk order yang tidak cancelled.
3. Tampilkan 5 produk terlaris berdasarkan jumlah item terjual.
4. Tampilkan pelanggan dengan total belanja di atas 500.000.
5. Jelaskan mengapa `SUM` bisa menghasilkan `NULL`.

::: tip 💡 Tips
Sebelum menjalankan laporan, cek jumlah baris dasar dengan `SELECT COUNT(*)`. Jika angka dasarnya tidak masuk akal, agregat di atasnya juga tidak akan benar.
:::
