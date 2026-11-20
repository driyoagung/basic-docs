---
title: "Bab 9 — Agregasi & Pengelompokan"
---

# 📊 Bab 9 — Agregasi & Pengelompokan

> 🎯 **Tujuan Bab:** merangkum data menjadi laporan yang benar, termasuk agregasi bersyarat dan subtotal.

## 9.1 🧮 Agregat Dasar

```sql
SELECT
  COUNT(*)   AS jumlah_order,
  SUM(total) AS omzet,
  AVG(total) AS rata_rata,
  MIN(total) AS terkecil,
  MAX(total) AS terbesar
FROM orders
WHERE status = 'paid';
```

| Fungsi | Arti |
|---|---|
| `COUNT(*)` | Jumlah baris |
| `COUNT(kolom)` | Jumlah baris dengan nilai non-NULL |
| `SUM` | Jumlah |
| `AVG` | Rata-rata |
| `MIN` / `MAX` | Nilai minimum/maksimum |

## 9.2 📦 `GROUP BY` dan `HAVING`

```sql
SELECT status, COUNT(*) AS jumlah, SUM(total) AS omzet
FROM orders
GROUP BY status
HAVING COUNT(*) > 5
ORDER BY omzet DESC;
```

Aturan penting: kolom yang tidak diagregasi harus muncul di `GROUP BY`.

```sql
-- Salah
SELECT status, user_id, COUNT(*) FROM orders GROUP BY status;
```

PostgreSQL ketat: `user_id` harus ada di `GROUP BY` atau dibungkus agregat.

## 9.3 🎯 `FILTER`: Agregasi Bersyarat

Cara bersih menghitung subset tanpa `CASE`:

```sql
SELECT
  status,
  COUNT(*)                                AS jumlah,
  SUM(total)                              AS omzet,
  COUNT(*) FILTER (WHERE total > 1000000) AS pesanan_besar
FROM orders
GROUP BY status;
```

`FILTER` lebih mudah dibaca daripada:

```sql
SUM(CASE WHEN total > 1000000 THEN 1 ELSE 0 END)
```

## 9.4 🧵 `string_agg`, `array_agg`, `jsonb_agg`

Menggabungkan nilai per grup:

```sql
SELECT
  o.id AS order_id,
  string_agg(p.nama, ', ' ORDER BY p.nama) AS daftar_produk,
  array_agg(p.id ORDER BY p.nama)          AS product_ids,
  jsonb_agg(jsonb_build_object('id', p.id, 'nama', p.nama)) AS produk_json
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p    ON p.id = oi.product_id
GROUP BY o.id;
```

| Fungsi | Hasil |
|---|---|
| `string_agg` | Teks dipisah delimiter |
| `array_agg` | Array PostgreSQL |
| `jsonb_agg` | Array JSONB (cocok untuk API) |

## 9.5 🧱 `GROUPING SETS`, `ROLLUP`, `CUBE`

Subtotal dan total keseluruhan:

```sql
SELECT
  kategori_id,
  status,
  SUM(total) AS omzet
FROM orders o
JOIN products p ON p.id = o.product_id
GROUP BY ROLLUP (kategori_id, status);
```

| Fitur | Menghasilkan |
|---|---|
| `ROLLUP (a, b)` | (a,b), (a), () |
| `CUBE (a, b)` | (a,b), (a), (b), () |
| `GROUPING SETS (...)` | Kombinasi yang Anda tentukan |

Gunakan `GROUPING()` untuk membedakan subtotal dari nilai asli.

## 9.6 📈 Statistik & Median

```sql
SELECT
  percentile_cont(0.5) WITHIN GROUP (ORDER BY total) AS median,
  percentile_cont(0.9) WITHIN GROUP (ORDER BY total) AS p90
FROM orders
WHERE status = 'paid';
```

`percentile_cont` menghitung interpolasi; `percentile_disc` mengambil nilai diskret.

## 9.7 🎬 Studi Kasus: Laporan Penjualan

### Harian

```sql
SELECT
  created_at::date AS tanggal,
  COUNT(*)         AS jumlah_order,
  SUM(total)       AS omzet
FROM orders
WHERE status IN ('paid', 'shipped', 'done')
GROUP BY created_at::date
ORDER BY tanggal;
```

### Bulanan

```sql
SELECT
  date_trunc('month', created_at) AS bulan,
  SUM(total)                      AS omzet
FROM orders
WHERE status IN ('paid', 'shipped', 'done')
GROUP BY date_trunc('month', created_at)
ORDER BY bulan;
```

### Per kategori

```sql
SELECT
  c.nama AS kategori,
  SUM(oi.jumlah * oi.harga) AS omzet
FROM order_items oi
JOIN products p    ON p.id = oi.product_id
JOIN categories c  ON c.id = p.kategori_id
JOIN orders o      ON o.id = oi.order_id
WHERE o.status IN ('paid', 'shipped', 'done')
GROUP BY c.nama
ORDER BY omzet DESC;
```

### Rata-rata nilai order per status

```sql
SELECT
  status,
  ROUND(AVG(total), 2) AS rata_rata,
  COUNT(*) FILTER (WHERE total = 0) AS order_nol
FROM orders
GROUP BY status;
```

## 9.8 ⚠️ Jebakan Agregasi

- `COUNT(*)` setelah join bisa menghitung baris anak, bukan induk.
- `AVG` mengabaikan `NULL`; perhatikan jumlah sampel.
- `SUM` pada kolom `NULL` bisa `NULL`; gunakan `COALESCE(SUM(...), 0)`.
- `GROUP BY` pada ekspresi harus konsisten dengan `SELECT`.

## 📌 Ringkasan

- `GROUP BY` meringkas baris; `HAVING` menyaring hasil agregat.
- `FILTER` membuat agregasi bersyarat lebih bersih.
- `array_agg` dan `jsonb_agg` berguna untuk API.
- `ROLLUP`/`CUBE` menghasilkan subtotal.
- `percentile_cont` menghitung median dan persentil.

## 🧪 Latihan

1. Hitung jumlah order dan omzet per status.
2. Hitung pesanan bernilai di atas 1 juta memakai `FILTER`.
3. Tampilkan daftar produk per order dengan `string_agg`.
4. Buat laporan omzet bulanan.
5. Hitung median nilai order.

::: tip 💡 Tips
Saat laporan terasa aneh, pecah query menjadi dua: satu untuk memeriksa baris mentah, satu untuk agregasi. Kesalahan agregasi biasanya berasal dari data yang sudah menggandakan sebelum dijumlahkan.
:::
