---
title: "Bab 7 — Filtering, Sorting & Fungsi"
---

# 🔎 Bab 7 — Filtering, Sorting & Fungsi

> 🎯 **Tujuan Bab:** mengambil data yang tepat dengan `WHERE`, mengurutkan dan membatasi hasil, serta memakai fungsi bawaan MySQL untuk kebutuhan sehari-hari.

## 7.1 🎯 Operator di `WHERE`

```sql
SELECT *
FROM products
WHERE harga BETWEEN 100000 AND 500000
  AND stok > 0;
```

| Operator | Contoh | Arti |
|---|---|---|
| `=` | `status = 'paid'` | Sama dengan |
| `<>` / `!=` | `status <> 'cancelled'` | Tidak sama |
| `>` `<` `>=` `<=` | `harga >= 100000` | Perbandingan |
| `BETWEEN` | `harga BETWEEN 100000 AND 500000` | Rentang inklusif |
| `IN` | `status IN ('paid','shipped')` | Salah satu nilai |
| `LIKE` | `nama LIKE 'Key%'` | Pola teks |
| `IS NULL` | `deleted_at IS NULL` | Nilai kosong |

## 7.2 🧠 `AND`, `OR`, `NOT` dan Prioritas

`AND` dievaluasi sebelum `OR`. Gunakan tanda kurung agar maksudnya jelas.

```sql
-- ❌ Membingungkan
SELECT * FROM orders
WHERE status = 'paid' OR status = 'shipped' AND total > 500000;

-- ✅ Jelas
SELECT * FROM orders
WHERE (status = 'paid' OR status = 'shipped')
  AND total > 500000;
```

## 7.3 🕳️ `NULL`: Jebakan yang Sering Terlupa

`NULL` berarti "tidak ada nilai", bukan string kosong dan bukan nol.

```sql
-- ❌ Tidak akan pernah benar
SELECT * FROM users WHERE telepon = NULL;

-- ✅
SELECT * FROM users WHERE telepon IS NULL;
SELECT * FROM users WHERE telepon IS NOT NULL;
```

Akibat lain:

- `NULL + 10` menghasilkan `NULL`;
- `NULL = NULL` menghasilkan `NULL` (bukan true);
- `COUNT(kolom)` mengabaikan `NULL`, sedangkan `COUNT(*)` menghitung semua baris.

## 7.4 📊 `ORDER BY`, `LIMIT`, `OFFSET`

```sql
SELECT id, nama, harga
FROM products
ORDER BY harga DESC, nama ASC
LIMIT 10 OFFSET 20;
```

- `ASC` naik (default), `DESC` turun.
- `LIMIT 10` mengambil 10 baris.
- `OFFSET 20` melewati 20 baris pertama.

> ⚠️ `OFFSET` besar makin lambat karena MySQL tetap harus melewati baris yang dilewati. Untuk pagination skala besar, gunakan keyset pagination (dibahas di Bab 15).

## 7.5 🔤 Fungsi String

```sql
SELECT
  CONCAT(nama_depan, ' ', nama_belakang) AS nama_lengkap,
  UPPER(email) AS email_besar,
  SUBSTRING(nama, 1, 3) AS inisial,
  TRIM('  Budi  ') AS bersih,
  REPLACE(telepon, '-', '') AS telepon_angka
FROM users;
```

| Fungsi | Kegunaan |
|---|---|
| `CONCAT` | Menggabungkan teks |
| `UPPER` / `LOWER` | Mengubah kapitalisasi |
| `SUBSTRING` | Mengambil sebagian teks |
| `TRIM` | Menghapus spasi di tepi |
| `REPLACE` | Mengganti bagian teks |
| `LENGTH` / `CHAR_LENGTH` | Panjang byte / karakter |

## 7.6 🔢 Fungsi Angka

```sql
SELECT
  ROUND(harga * 1.11, 0) AS harga_pajak,
  CEIL(4.1) AS ke_atas,
  FLOOR(4.9) AS ke_bawah,
  ABS(-25) AS absolut;
```

| Fungsi | Kegunaan |
|---|---|
| `ROUND` | Membulatkan |
| `CEIL` / `FLOOR` | Bulat ke atas / bawah |
| `ABS` | Nilai absolut |
| `MOD` | Sisa bagi |

## 7.7 📅 Fungsi Tanggal

```sql
SELECT
  NOW() AS sekarang,
  DATE_FORMAT(created_at, '%d-%m-%Y') AS tanggal_indonesia,
  DATEDIFF(NOW(), created_at) AS umur_hari,
  DATE_ADD(created_at, INTERVAL 7 DAY) AS seminggu_kemudian
FROM orders;
```

| Fungsi | Kegunaan |
|---|---|
| `NOW()` | Waktu sekarang |
| `CURDATE()` | Tanggal sekarang |
| `DATE_FORMAT` | Format tampilan tanggal |
| `DATEDIFF` | Selisih hari |
| `DATE_ADD` / `DATE_SUB` | Menambah / mengurangi waktu |

> 💡 Simpan tanggal dalam tipe tanggal, bukan `VARCHAR`. Baru format saat ditampilkan.

## 7.8 🔀 Ekspresi Kondisional

```sql
SELECT
  nama,
  harga,
  CASE
    WHEN harga >= 1000000 THEN 'Premium'
    WHEN harga >= 300000 THEN 'Menengah'
    ELSE 'Murah'
  END AS segmen
FROM products;
```

| Fungsi | Kegunaan |
|---|---|
| `CASE WHEN` | Logika bercabang |
| `IF` | Logika sederhana dua cabang |
| `IFNULL` | Ganti `NULL` dengan nilai lain |
| `COALESCE` | Ambil nilai tidak `NULL` pertama |

```sql
SELECT nama, IFNULL(telepon, '-') AS telepon
FROM users;

SELECT COALESCE(telepon, email, 'tidak ada kontak') AS kontak
FROM users;
```

## 7.9 🔍 Pola `LIKE` dan Batasannya

```sql
SELECT * FROM products WHERE nama LIKE 'Key%';    -- diawali "Key"
SELECT * FROM products WHERE nama LIKE '%SQL%';   -- mengandung "SQL"
SELECT * FROM products WHERE nama LIKE '_uku%';   -- satu karakter lalu "uku"
```

> ⚠️ `LIKE '%kata'` dengan wildcard di depan biasanya **tidak memakai index** dan bisa lambat pada tabel besar. Untuk pencarian teks serius, gunakan full-text index (Bab 18).

## 📌 Ringkasan

- `WHERE` menyaring baris; gunakan tanda kurung untuk logika campuran.
- `NULL` harus diuji dengan `IS NULL`, bukan `= NULL`.
- `ORDER BY` + `LIMIT` + `OFFSET` untuk urutan dan pagination.
- Fungsi string, angka, tanggal, dan `CASE` mengurangi pekerjaan di aplikasi.
- `LIKE '%...'` tidak ramah index.

## 🧪 Latihan

1. Tampilkan produk dengan harga antara 100.000 dan 500.000 dan stok lebih dari 0.
2. Tampilkan user yang `telepon`-nya `NULL`.
3. Urutkan order dari total terbesar, ambil 5 teratas.
4. Tampilkan nama produk dalam huruf besar dan harga setelah pajak 11%.
5. Buat kolom `segmen` memakai `CASE` berdasarkan harga.
6. Tampilkan order yang dibuat dalam 30 hari terakhir.

::: tip 💡 Tips
Saat query terasa salah, sederhanakan: mulai dari `SELECT * FROM tabel` lalu tambah satu kondisi setiap kali. Debugging query jauh lebih mudah secara bertahap.
:::
