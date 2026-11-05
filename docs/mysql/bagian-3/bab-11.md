---
title: "Bab 11 — Subquery, CTE, Window Function & UNION"
---

# 🧠 Bab 11 — Subquery, CTE, Window Function & UNION

> 🎯 **Tujuan Bab:** menulis query bertingkat yang mudah dibaca dan menjawab pertanyaan analitik yang tidak bisa diselesaikan dengan `GROUP BY` biasa.

## 11.1 🪆 Subquery

Subquery adalah query di dalam query.

### Di `WHERE`

```sql
SELECT nama, harga
FROM products
WHERE harga > (
  SELECT AVG(harga) FROM products
);
```

### Di `FROM`

```sql
SELECT kategori_id, rata_rata
FROM (
  SELECT kategori_id, AVG(harga) AS rata_rata
  FROM products
  GROUP BY kategori_id
) t
WHERE rata_rata > 300000;
```

### Di `SELECT`

```sql
SELECT
  u.nama,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS jumlah_order
FROM users u;
```

Subquery di `SELECT` mudah dibaca, tetapi bisa lambat jika dijalankan per baris. Bandingkan dengan join dan ukur.

## 11.2 🔍 `EXISTS` vs `IN`

```sql
-- EXISTS: berhenti saat menemukan satu kecocokan
SELECT u.id, u.nama
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);

-- IN: membandingkan dengan daftar nilai
SELECT id, nama
FROM users
WHERE id IN (SELECT user_id FROM orders);
```

| Aspek | `EXISTS` | `IN` |
|---|---|---|
| Cocok untuk | Relasi keberadaan | Daftar nilai kecil |
| `NULL` | Tidak terpengaruh | Bisa memberi hasil tak terduga jika subquery menghasilkan `NULL` |
| Performa | Sering lebih baik pada dataset besar | Bisa lambat jika daftar besar |

## 11.3 🧱 CTE (`WITH`)

**Common Table Expression** memberi nama pada subquery sehingga query lebih mudah dibaca.

```sql
WITH omzet_per_user AS (
  SELECT user_id, SUM(total) AS total_belanja
  FROM orders
  WHERE status <> 'cancelled'
  GROUP BY user_id
)
SELECT u.nama, o.total_belanja
FROM users u
JOIN omzet_per_user o ON o.user_id = u.id
ORDER BY o.total_belanja DESC;
```

CTE juga bisa dipakai berlapis:

```sql
WITH omzet AS (
  SELECT user_id, SUM(total) AS total
  FROM orders
  WHERE status <> 'cancelled'
  GROUP BY user_id
),
pelanggan_setia AS (
  SELECT user_id
  FROM orders
  GROUP BY user_id
  HAVING COUNT(*) >= 3
)
SELECT u.nama, o.total
FROM users u
JOIN omzet o ON o.user_id = u.id
JOIN pelanggan_setia p ON p.user_id = u.id
ORDER BY o.total DESC;
```

## 11.4 🔁 CTE Rekursif

CTE rekursif berguna untuk struktur hierarki, misalnya kategori bersarang.

```sql
WITH RECURSIVE kategori_tree AS (
  SELECT id, nama, parent_id, 1 AS level
  FROM categories
  WHERE parent_id IS NULL

  UNION ALL

  SELECT c.id, c.nama, c.parent_id, k.level + 1
  FROM categories c
  JOIN kategori_tree k ON c.parent_id = k.id
)
SELECT * FROM kategori_tree
ORDER BY level, nama;
```

Pastikan relasi benar-benar berhenti. Relasi melingkar bisa membuat query berjalan tanpa akhir.

## 11.5 🪟 Window Function

Window function menghitung nilai tanpa menggabungkan baris menjadi satu seperti `GROUP BY`.

```sql
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
GROUP BY p.id, p.nama, p.kategori_id;
```

Fungsi window populer:

| Fungsi | Kegunaan |
|---|---|
| `ROW_NUMBER()` | Nomor urut unik |
| `RANK()` | Peringkat dengan celah saat seri |
| `DENSE_RANK()` | Peringkat tanpa celah |
| `LAG()` | Nilai baris sebelumnya |
| `LEAD()` | Nilai baris berikutnya |
| `SUM() OVER()` | Akumulasi / total berjalan |

### Pertumbuhan omzet dibanding bulan sebelumnya

```sql
WITH omzet_bulanan AS (
  SELECT
    DATE_FORMAT(created_at, '%Y-%m') AS bulan,
    SUM(total) AS omzet
  FROM orders
  WHERE status <> 'cancelled'
  GROUP BY DATE_FORMAT(created_at, '%Y-%m')
)
SELECT
  bulan,
  omzet,
  LAG(omzet) OVER (ORDER BY bulan) AS omzet_sebelumnya,
  omzet - LAG(omzet) OVER (ORDER BY bulan) AS selisih
FROM omzet_bulanan
ORDER BY bulan;
```

## 11.6 🔗 `UNION` vs `UNION ALL`

```sql
SELECT nama FROM users
UNION
SELECT nama FROM suppliers;
```

| Perintah | Perilaku |
|---|---|
| `UNION` | Menghapus duplikat |
| `UNION ALL` | Mempertahankan semua baris, lebih cepat |

Jika duplikat tidak masalah, gunakan `UNION ALL` untuk menghindari biaya sorting.

## 11.7 🎬 Studi Kasus: 3 Produk Terlaris per Kategori

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
WHERE peringkat <= 3
ORDER BY kategori_id, peringkat;
```

Query ini menggabungkan `GROUP BY`, window function, dan subquery — pola yang sangat umum di laporan analitik.

## 📌 Ringkasan

- Subquery bisa berada di `WHERE`, `FROM`, atau `SELECT`.
- `EXISTS` cocok untuk mengecek keberadaan; `IN` untuk daftar nilai.
- CTE membuat query bertingkat lebih mudah dibaca.
- CTE rekursif menangani hierarki.
- Window function menghitung peringkat dan perbandingan antar baris.
- `UNION ALL` lebih cepat daripada `UNION` jika duplikat boleh ada.

## 🧪 Latihan

1. Tampilkan produk dengan harga di atas rata-rata.
2. Tampilkan user yang punya minimal tiga order memakai `EXISTS`.
3. Tulis ulang query pelanggan teratas memakai CTE.
4. Tampilkan peringkat produk per kategori.
5. Bandingkan omzet bulan ini dan bulan sebelumnya memakai `LAG`.

::: tip 💡 Tips
CTE bukan hanya soal gaya. Memecah query menjadi langkah bernama membuat kesalahan lebih mudah ditemukan: Anda bisa menjalankan setiap CTE secara terpisah.
:::
