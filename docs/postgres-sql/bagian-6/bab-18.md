---
title: "Bab 18 — EXPLAIN & Optimasi Query"
---

# ⚡ Bab 18 — EXPLAIN & Optimasi Query

> 🎯 **Tujuan Bab:** membaca rencana eksekusi dan memperbaiki query berdasarkan bukti, bukan tebakan.

## 18.1 🔍 `EXPLAIN`

```sql
EXPLAIN
SELECT * FROM orders WHERE user_id = 42;
```

`EXPLAIN` menampilkan rencana tanpa menjalankan query.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 10;
```

| Opsi | Fungsi |
|---|---|
| `ANALYZE` | Benar-benar menjalankan query |
| `BUFFERS` | Menampilkan penggunaan cache |
| `VERBOSE` | Detail kolom dan output |
| `FORMAT JSON` | Output terstruktur |

> ⚠️ `EXPLAIN ANALYZE` menjalankan query. Hati-hati pada `UPDATE`/`DELETE`; gunakan transaksi dan `ROLLBACK`.

## 18.2 📖 Membaca Rencana

Contoh:

```
Limit  (cost=0.43..12.80 rows=10 width=64) (actual time=0.050..0.120 rows=10 loops=1)
  ->  Index Scan using idx_orders_user_created on orders
        (cost=0.43..1234.00 rows=1000 width=64) (actual time=0.045..0.110 rows=10 loops=1)
        Index Cond: (user_id = 42)
Planning Time: 0.200 ms
Execution Time: 0.150 ms
```

Yang perlu diperhatikan:

- **cost**: perkiraan biaya planner (bukan milidetik);
- **rows**: perkiraan jumlah baris;
- **actual time**: waktu nyata;
- **loops**: berapa kali node dijalankan;
- **Buffers**: shared hit/read.

Jika `rows` perkiraan jauh berbeda dari `actual rows`, statistik mungkin usang.

## 18.3 🗺️ Jenis Scan

| Scan | Arti |
|---|---|
| `Seq Scan` | Membaca seluruh tabel |
| `Index Scan` | Menggunakan index lalu ambil baris |
| `Index Only Scan` | Semua data dari index |
| `Bitmap Index Scan` | Index lalu bitmap, cocok untuk banyak baris |
| `Bitmap Heap Scan` | Ambil baris dari bitmap |

`Seq Scan` tidak selalu buruk. Untuk tabel kecil atau query yang mengambil sebagian besar baris, sequential scan lebih efisien.

## 18.4 🔗 Jenis Join Planner

| Join | Kapan dipilih |
|---|---|
| **Nested Loop** | Satu sisi kecil dan ada index |
| **Hash Join** | Join besar tanpa index yang cocok |
| **Merge Join** | Kedua sisi terurut |

Nested Loop dengan `loops` besar bisa menjadi sumber masalah N+1 di level database.

## 18.5 📊 Statistik Planner

Planner memakai statistik untuk memperkirakan selektivitas.

```sql
ANALYZE orders;
```

Autovacuum biasanya menjalankan `ANALYZE`, tetapi setelah import data besar, jalankan manual.

Melihat statistik kolom:

```sql
SELECT attname, n_distinct, most_common_vals
FROM pg_stats
WHERE tablename = 'orders' AND attname = 'status';
```

## 18.6 🧰 `pg_stat_statements`

Cara terbaik menemukan query yang paling mahal:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_ms,
  ROUND(mean_exec_time::numeric, 2) AS mean_ms,
  rows,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

Fokus pada query dengan total waktu tinggi dan rata-rata tinggi.

## 18.7 🐢 Log Query Lambat

```sql
ALTER SYSTEM SET log_min_duration_statement = '500ms';
SELECT pg_reload_conf();
```

Semua query lebih dari 500 ms dicatat. Gunakan sementara; log bisa cepat membesar.

`auto_explain` mencatat rencana eksekusi query lambat:

```sql
LOAD 'auto_explain';
SET auto_explain.log_min_duration = '500ms';
SET auto_explain.log_analyze = on;
```

Untuk production, konfigurasikan lewat `shared_preload_libraries` dan parameter server.

## 18.8 📄 Pagination: `OFFSET` vs Keyset

`OFFSET` besar lambat:

```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 100000;
```

Keyset pagination:

```sql
SELECT * FROM orders
WHERE (created_at, id) < ('2025-01-01 10:00:00+07', 12345)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

Keyset tetap cepat karena langsung menuju posisi data, bukan melewati ribuan baris.

## 18.9 🔁 N+1 dari Sisi Database

N+1 terjadi saat aplikasi menjalankan satu query untuk daftar, lalu satu query per item.

```
SELECT * FROM orders WHERE user_id = 1;
SELECT * FROM users WHERE id = 1;
SELECT * FROM users WHERE id = 2;
SELECT * FROM users WHERE id = 3;
```

Perbaikan: join atau eager loading.

```sql
SELECT o.id, o.total, u.nama
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.user_id = 1;
```

## 18.10 ⚙️ Tuning Dasar

| Parameter | Fungsi | Catatan |
|---|---|---|
| `shared_buffers` | Cache halaman | Biasanya 25% RAM, ikuti panduan |
| `work_mem` | Memori per operasi sort/hash | Naikkan hati-hati; per koneksi |
| `effective_cache_size` | Perkiraan cache OS | Membantu planner |
| `maintenance_work_mem` | Memori untuk VACUUM/index | Pengaruh ke maintenance |

Jangan menyalin nilai tuning dari internet tanpa memahami beban kerja dan RAM server.

## 18.11 🎬 Studi Kasus

Query awal:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE status = 'paid'
ORDER BY created_at DESC
LIMIT 20;
```

Jika `Seq Scan` dan waktu tinggi:

```sql
CREATE INDEX idx_orders_status_created
  ON orders (status, created_at DESC);
```

Ulangi `EXPLAIN (ANALYZE, BUFFERS)` dan catat:

- jenis scan berubah;
- `actual time` turun;
- `rows` sesuai perkiraan.

## 📌 Ringkasan

- `EXPLAIN` membaca rencana; `ANALYZE` menjalankan query.
- Perhatikan `rows` perkiraan vs aktual dan `actual time`.
- Statistik yang usang menghasilkan rencana buruk.
- `pg_stat_statements` menemukan query paling mahal.
- Keyset pagination lebih baik daripada `OFFSET` besar.

## 🧪 Latihan

1. Jalankan `EXPLAIN` pada query filter `user_id`.
2. Tambahkan index dan bandingkan rencana.
3. Cari query teratas dengan `pg_stat_statements`.
4. Ubah pagination `OFFSET` menjadi keyset.
5. Jelaskan mengapa `Seq Scan` kadang lebih baik.

::: tip 💡 Tips
Optimasi tanpa pengukuran hanyalah tebakan. Simpan output `EXPLAIN` sebelum dan sesudah perubahan agar bisa dibandingkan.
:::
