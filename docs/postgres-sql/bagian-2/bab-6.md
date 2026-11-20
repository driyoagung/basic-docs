---
title: "Bab 6 — Filtering, Fungsi & Tanggal"
---

# 🔎 Bab 6 — Filtering, Fungsi & Tanggal

> 🎯 **Tujuan Bab:** menyaring data dengan tepat dan memakai fungsi PostgreSQL untuk laporan sehari-hari.

## 6.1 🎯 `WHERE`

```sql
SELECT * FROM products WHERE harga > 500000;
SELECT * FROM products WHERE kategori_id IN (1, 2, 3);
SELECT * FROM products WHERE harga BETWEEN 100000 AND 500000;
SELECT * FROM products WHERE nama LIKE 'Key%';
```

`LIKE` sensitif huruf besar/kecil. PostgreSQL menyediakan `ILIKE`:

```sql
SELECT * FROM products WHERE nama ILIKE '%keyboard%';
```

`ILIKE` berguna untuk pencarian sederhana, tetapi untuk data besar pertimbangkan index trigram (`pg_trgm`).

## 6.2 🕳️ NULL dan Perbandingan

`NULL` berarti "tidak diketahui", bukan nol atau string kosong.

```sql
SELECT * FROM users WHERE telepon IS NULL;
SELECT * FROM users WHERE telepon IS NOT NULL;
```

Perbandingan dengan `NULL` menghasilkan `NULL` (bukan `TRUE`/`FALSE`):

```sql
SELECT NULL = NULL;  -- NULL
```

Untuk membandingkan termasuk NULL:

```sql
SELECT * FROM users WHERE telepon IS DISTINCT FROM '08123';
```

`IS DISTINCT FROM` menganggap `NULL` sebagai nilai yang bisa dibandingkan.

## 6.3 📑 `ORDER BY`, `LIMIT`, `OFFSET`

```sql
SELECT id, nama, harga
FROM products
ORDER BY harga DESC, nama ASC
LIMIT 20 OFFSET 40;
```

Mengatur posisi NULL:

```sql
SELECT * FROM products ORDER BY diskon DESC NULLS LAST;
SELECT * FROM products ORDER BY diskon ASC NULLS FIRST;
```

`OFFSET` besar lambat karena PostgreSQL tetap harus melewati baris. Untuk pagination produksi, gunakan **keyset pagination** (lihat Bab 18).

## 6.4 🔤 Fungsi String

```sql
SELECT
  nama || ' — ' || sku        AS label,
  UPPER(nama)                 AS nama_besar,
  LOWER(email)                AS email_kecil,
  SUBSTRING(nama FROM 1 FOR 3) AS awalan,
  TRIM('  halo  ')            AS bersih,
  REPLACE(nama, 'Laptop', 'Notebook') AS ganti,
  SPLIT_PART('a,b,c', ',', 2) AS bagian_kedua
FROM products;
```

`||` adalah operator penggabungan string. Jika salah satu operand `NULL`, hasilnya `NULL`; gunakan `COALESCE` bila perlu.

## 6.5 🔢 Fungsi Angka

```sql
SELECT
  ROUND(1234.567, 2) AS bulat_2,
  CEIL(4.1)          AS ke_atas,
  FLOOR(4.9)         AS ke_bawah,
  ABS(-17)           AS absolut;
```

## 6.6 📅 Fungsi Tanggal & Waktu

```sql
SELECT
  now()                          AS sekarang,
  date_trunc('month', now())     AS awal_bulan,
  extract(year FROM now())       AS tahun,
  to_char(now(), 'YYYY-MM-DD')   AS format_tanggal,
  now() + INTERVAL '7 days'      AS seminggu_lagi,
  now() - INTERVAL '2 hours'     AS dua_jam_lalu;
```

| Fungsi | Kegunaan |
|---|---|
| `now()` | Waktu sekarang (`TIMESTAMPTZ`) |
| `date_trunc('month', ts)` | Awal bulan |
| `extract(field FROM ts)` | Ambil bagian waktu |
| `to_char(ts, format)` | Format tampilan |
| `age(ts1, ts2)` | Selisih sebagai interval |

## 6.7 🧮 `CASE`, `COALESCE`, `NULLIF`

```sql
SELECT
  nama,
  harga,
  CASE
    WHEN harga >= 1000000 THEN 'mahal'
    WHEN harga >= 300000  THEN 'sedang'
    ELSE 'murah'
  END AS kategori_harga,
  COALESCE(diskon, 0) AS diskon_efektif,
  NULLIF(stok, 0)     AS stok_tidak_nol
FROM products;
```

- `CASE` untuk logika kondisional.
- `COALESCE` mengambil nilai non-NULL pertama.
- `NULLIF(a, b)` menghasilkan `NULL` jika `a = b`.

## 6.8 🔄 Casting

```sql
SELECT '5'::int + 2;
SELECT CAST('2025-01-01' AS date);
SELECT harga::text FROM products;
```

Casting berguna saat tipe data tidak cocok. Tetapi casting pada kolom di `WHERE` bisa membuat index tidak terpakai:

```sql
-- index pada created_at bisa tidak dipakai
WHERE created_at::date = '2025-01-01'
```

Lebih baik:

```sql
WHERE created_at >= '2025-01-01'
  AND created_at <  '2025-01-02'
```

## 6.9 🔢 `generate_series`

Membuat deret angka atau tanggal:

```sql
SELECT generate_series(1, 5);
SELECT generate_series('2025-01-01'::date, '2025-01-05', '1 day');
```

Berguna untuk laporan yang harus menampilkan hari tanpa transaksi:

```sql
SELECT d::date AS tanggal, COALESCE(SUM(o.total), 0) AS omzet
FROM generate_series('2025-01-01'::date, '2025-01-31', '1 day') AS d
LEFT JOIN orders o ON o.created_at::date = d::date
GROUP BY d
ORDER BY d;
```

## 6.10 🧪 Praktik

```sql
SELECT
  nama,
  harga,
  CASE WHEN stok = 0 THEN 'habis' ELSE 'tersedia' END AS status_stok,
  to_char(created_at, 'DD Mon YYYY') AS dibuat
FROM products
WHERE nama ILIKE '%keyboard%'
  AND harga BETWEEN 100000 AND 1000000
ORDER BY harga DESC
LIMIT 10;
```

## 📌 Ringkasan

- `ILIKE` untuk pencarian tidak sensitif huruf.
- `NULL` bukan nilai biasa; gunakan `IS NULL` dan `IS DISTINCT FROM`.
- `date_trunc`, `extract`, `to_char`, dan `INTERVAL` adalah alat utama laporan waktu.
- Hindari fungsi pada kolom di `WHERE` jika ingin index terpakai.
- `generate_series` membantu membuat laporan lengkap tanpa lubang tanggal.

## 🧪 Latihan

1. Cari produk yang namanya mengandung "kaos" tanpa peduli huruf besar/kecil.
2. Tampilkan user yang nomor teleponnya NULL.
3. Hitung omzet per bulan memakai `date_trunc`.
4. Tampilkan produk dengan kategori harga memakai `CASE`.
5. Buat deret tanggal seminggu dan join dengan tabel order.

::: tip 💡 Tips
Untuk filter tanggal, gunakan rentang `>= awal AND < akhir` daripada `::date = ...`. Selain lebih cepat, cara ini menghindari kesalahan zona waktu.
:::
