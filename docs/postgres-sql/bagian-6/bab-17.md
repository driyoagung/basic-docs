---
title: "Bab 17 — Index"
---

# 🚦 Bab 17 — Index ⭐

> 🎯 **Tujuan Bab:** memilih jenis index yang tepat dan memahami biayanya.

## 17.1 🗂️ Jenis Index

| Jenis | Cocok untuk |
|---|---|
| **B-Tree** (default) | `=`, `<`, `>`, `BETWEEN`, `ORDER BY` |
| **Hash** | Kesamaan saja |
| **GIN** | JSONB, array, full-text search |
| **GiST** | Geometri, range, pencarian kemiripan |
| **SP-GiST** | Struktur tidak seimbang (IP, prefix) |
| **BRIN** | Tabel sangat besar dengan data berurutan alami |

Untuk sebagian besar kebutuhan, B-Tree adalah pilihan pertama.

## 17.2 🏗️ Index Dasar

```sql
CREATE INDEX idx_orders_user ON orders (user_id);
```

PostgreSQL otomatis membuat index untuk `PRIMARY KEY` dan `UNIQUE`, tetapi **tidak** otomatis untuk foreign key. Tambahkan index pada kolom FK yang sering di-join atau dihapus.

## 17.3 🧩 Composite Index

```sql
CREATE INDEX idx_orders_user_created
  ON orders (user_id, created_at DESC);
```

Urutan kolom penting. Index ini cocok untuk:

```sql
SELECT * FROM orders
WHERE user_id = 42
ORDER BY created_at DESC;
```

Tetapi kurang cocok jika query hanya memfilter `created_at` tanpa `user_id` (kecuali ada kondisi lain).

## 17.4 🎯 Partial Index

Index hanya untuk subset baris:

```sql
CREATE INDEX idx_orders_pending
  ON orders (created_at)
  WHERE status = 'pending';
```

Lebih kecil dan lebih cepat untuk query yang selalu memfilter status tertentu:

```sql
SELECT * FROM orders
WHERE status = 'pending'
ORDER BY created_at;
```

## 17.5 🧮 Index Ekspresi

```sql
CREATE INDEX idx_users_email_lower ON users (lower(email));
```

Query harus memakai ekspresi yang sama:

```sql
SELECT * FROM users WHERE lower(email) = 'budi@mail.com';
```

## 17.6 📦 Covering Index dengan `INCLUDE`

```sql
CREATE INDEX idx_orders_user_cov
  ON orders (user_id) INCLUDE (total, status);
```

Index-only scan bisa terjadi jika semua kolom yang dibutuhkan tersedia di index dan visibility map bersih. `INCLUDE` menambah kolom non-key tanpa memengaruhi urutan.

## 17.7 🚧 `CREATE INDEX CONCURRENTLY`

Membuat index tanpa mengunci tabel secara penuh:

```sql
CREATE INDEX CONCURRENTLY idx_orders_status
  ON orders (status);
```

Catatan:

- tidak bisa dijalankan di dalam transaksi;
- lebih lambat;
- bisa gagal dan meninggalkan index tidak valid;
- periksa `pg_index.indisvalid`.

```sql
SELECT indexrelid::regclass, indisvalid
FROM pg_index
WHERE indrelid = 'orders'::regclass;
```

Jika tidak valid:

```sql
DROP INDEX CONCURRENTLY idx_orders_status;
```

## 17.8 ❌ Kapan Index Tidak Dipakai

- Tabel sangat kecil; sequential scan lebih murah.
- Fungsi diterapkan pada kolom: `WHERE lower(email) = ...` tanpa index ekspresi.
- Tipe data tidak cocok sehingga terjadi cast.
- Statistik usang; jalankan `ANALYZE`.
- Kondisi tidak selektif; planner memilih seq scan.
- Query memakai `LIKE '%kata%'` tanpa index trigram.

## 17.9 💰 Biaya Index

| Biaya | Dampak |
|---|---|
| Ruang disk | Setiap index menambah ukuran |
| Kecepatan tulis | `INSERT`/`UPDATE`/`DELETE` lebih lambat |
| Maintenance | `VACUUM`, `REINDEX`, backup lebih berat |
| Bloat | Index bisa membengkak |

Index bukan gratis. Tambahkan hanya jika ada query yang terbukti membutuhkan.

## 17.10 🔍 Menemukan Index Tidak Terpakai

```sql
SELECT
  relname AS tabel,
  indexrelname AS index,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS ukuran
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
```

`idx_scan = 0` bukan berarti index pasti tidak berguna; bisa jadi statistik baru di-reset atau query jarang berjalan. Pantau dalam periode yang cukup.

Melihat semua index:

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 17.11 🧹 `REINDEX`

```sql
REINDEX INDEX idx_orders_user;
REINDEX TABLE orders;
REINDEX INDEX CONCURRENTLY idx_orders_user;
```

Gunakan jika index rusak atau sangat bloated. `CONCURRENTLY` menghindari lock penuh.

## 17.12 🎬 Studi Kasus

Query lambat:

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 10;
```

Jika muncul `Seq Scan`, tambahkan:

```sql
CREATE INDEX idx_orders_user_created
  ON orders (user_id, created_at DESC);
```

Ulangi `EXPLAIN ANALYZE` dan bandingkan `actual time` serta `rows`.

## 📌 Ringkasan

- B-Tree adalah default; GIN untuk JSONB/array/full-text.
- Composite index harus mengikuti pola query.
- Partial dan expression index menghemat ruang dan waktu.
- `CONCURRENTLY` membantu production, tetapi lebih rumit.
- Setiap index punya biaya tulis dan ruang.

## 🧪 Latihan

1. Buat index pada `orders(user_id)`.
2. Buat composite index untuk filter user dan urutan waktu.
3. Buat partial index untuk order pending.
4. Cari index dengan `idx_scan = 0`.
5. Bandingkan `EXPLAIN` sebelum dan sesudah index.

::: tip 💡 Tips
Index yang tepat lahir dari query nyata, bukan tebakan. Catat query lambat, ukur, baru tambahkan index.
:::
