---
title: "Bab 19 — Transaksi, MVCC, Locking & VACUUM"
---

# 🔒 Bab 19 — Transaksi, MVCC, Locking & VACUUM

> 🎯 **Tujuan Bab:** menjaga konsistensi data saat banyak transaksi berjalan bersamaan, dan menjaga database tetap sehat.

## 19.1 🧱 Transaksi & ACID

| Properti | Arti |
|---|---|
| **Atomicity** | Semua berhasil atau semua dibatalkan |
| **Consistency** | Data tetap memenuhi aturan |
| **Isolation** | Transaksi tidak saling mengganggu secara liar |
| **Durability** | Data tersimpan setelah `COMMIT` |

```sql
BEGIN;

UPDATE products SET stok = stok - 1 WHERE id = 1;
INSERT INTO order_items (order_id, product_id, jumlah)
VALUES (10, 1, 1);

COMMIT;
```

Jika ada error:

```sql
ROLLBACK;
```

## 19.2 💾 Savepoint

```sql
BEGIN;
UPDATE products SET stok = stok - 1 WHERE id = 1;
SAVEPOINT setelah_stok;
INSERT INTO payments (order_id, metode, jumlah)
VALUES (10, 'transfer', 100000);
ROLLBACK TO SAVEPOINT setelah_stok;
COMMIT;
```

`SAVEPOINT` memungkinkan membatalkan sebagian pekerjaan tanpa membatalkan seluruh transaksi.

## 19.3 🧠 MVCC

PostgreSQL memakai **Multiversion Concurrency Control**. Saat baris di-update, versi lama tetap ada sampai tidak diperlukan lagi.

Konsekuensi:

- pembaca tidak memblokir penulis;
- penulis tidak memblokir pembaca;
- versi lama menumpuk dan perlu dibersihkan oleh `VACUUM`;
- `UPDATE` sebenarnya membuat baris baru, bukan menimpa di tempat.

## 19.4 🏝️ Level Isolasi

| Level | Dirty Read | Non-repeatable Read | Phantom |
|---|---|---|---|
| Read Committed (default) | Tidak | Ya | Ya |
| Repeatable Read | Tidak | Tidak | Tidak* |
| Serializable | Tidak | Tidak | Tidak |

\*Di PostgreSQL, Repeatable Read memakai snapshot dan mencegah phantom, tetapi masih bisa mengalami serialization anomaly. Serializable menambahkan pemeriksaan konflik.

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT * FROM products WHERE id = 1;
-- baris yang sama tetap konsisten sampai COMMIT
COMMIT;
```

## 19.5 ⚠️ Anomali & Retry

Pada Serializable, konflik bisa menghasilkan error:

```
ERROR: could not serialize access due to concurrent update
SQLSTATE: 40001
```

Aplikasi harus menangkap SQLSTATE `40001` dan mengulang transaksi:

```php
for ($attempt = 1; $attempt <= 3; $attempt++) {
    try {
        DB::transaction(function () {
            // baca, hitung, tulis
        });
        break;
    } catch (\Illuminate\Database\QueryException $e) {
        if ($e->getCode() !== '40001' || $attempt === 3) {
            throw $e;
        }
        usleep(50000 * $attempt);
    }
}
```

Retry juga diperlukan untuk deadlock (`40P01`).

## 19.6 🔐 Row Lock

```sql
BEGIN;

SELECT * FROM products WHERE id = 1 FOR UPDATE;
UPDATE products SET stok = stok - 1 WHERE id = 1;

COMMIT;
```

| Klausa | Arti |
|---|---|
| `FOR UPDATE` | Kunci baris untuk update |
| `FOR NO KEY UPDATE` | Lebih ringan, tidak mengunci FK |
| `FOR SHARE` | Kunci bersama |
| `FOR KEY SHARE` | Kunci lemah untuk FK |
| `NOWAIT` | Gagal langsung jika terkunci |
| `SKIP LOCKED` | Lewati baris yang terkunci |

## 19.7 📥 Antrean dengan `SKIP LOCKED`

Pola umum worker:

```sql
BEGIN;

SELECT id
FROM jobs
WHERE status = 'queued'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- proses job
UPDATE jobs SET status = 'processing' WHERE id = ...;

COMMIT;
```

Beberapa worker bisa mengambil job berbeda tanpa saling menunggu.

## 19.8 🚫 Deadlock

```
Transaksi A: kunci baris 1, lalu minta baris 2
Transaksi B: kunci baris 2, lalu minta baris 1
```

PostgreSQL mendeteksi deadlock dan membatalkan salah satu transaksi dengan SQLSTATE `40P01`.

Cara mengurangi:

- kunci baris dalam urutan yang konsisten;
- buat transaksi sesingkat mungkin;
- hindari menunggu input pengguna di dalam transaksi;
- gunakan retry.

## 19.9 🧷 Advisory Lock

Untuk kunci logis yang tidak terikat baris:

```sql
SELECT pg_try_advisory_lock(12345);

-- jika TRUE, lanjutkan pekerjaan

SELECT pg_advisory_unlock(12345);
```

Berguna untuk memastikan hanya satu proses menjalankan tugas tertentu (misalnya cron job).

## 19.10 🧹 VACUUM & Autovacuum

`VACUUM` membersihkan versi baris lama dan memperbarui visibility map.

```sql
VACUUM (VERBOSE, ANALYZE) orders;
```

`VACUUM FULL` menulis ulang tabel dan mengunci penuh:

```sql
VACUUM FULL orders;
```

> ⚠️ `VACUUM FULL` membutuhkan ruang disk besar dan lock eksklusif. Di production, pertimbangkan `pg_repack`.

Autovacuum berjalan otomatis. Jangan dimatikan. Untuk tabel dengan update tinggi, turunkan ambangnya:

```sql
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01
);
```

## 19.11 📈 Memantau Kesehatan

Transaksi panjang:

```sql
SELECT pid, now() - xact_start AS durasi, state, query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY durasi DESC;
```

Dead tuple:

```sql
SELECT
  relname,
  n_live_tup,
  n_dead_tup,
  last_autovacuum,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

Transaksi `idle in transaction` yang lama menahan cleanup dan bisa menyebabkan bloat. Atur `idle_in_transaction_session_timeout`.

## 19.12 🎬 Studi Kasus: Stok Barang

```sql
BEGIN;

SELECT stok FROM products WHERE id = 1 FOR UPDATE;

-- aplikasi memeriksa stok
UPDATE products SET stok = stok - 1 WHERE id = 1;

INSERT INTO order_items (order_id, product_id, jumlah)
VALUES (10, 1, 1);

COMMIT;
```

Dengan `FOR UPDATE`, dua pembeli tidak bisa mengurangi stok yang sama secara bersamaan tanpa sinkronisasi.

## 📌 Ringkasan

- Transaksi menjaga atomicity dan konsistensi.
- PostgreSQL memakai MVCC: pembaca dan penulis tidak saling memblokir.
- Serializable membutuhkan retry pada konflik.
- `FOR UPDATE` dan `SKIP LOCKED` penting untuk stok dan antrean.
- VACUUM menjaga database dari bloat.

## 🧪 Latihan

1. Buat transaksi pengurangan stok dengan `FOR UPDATE`.
2. Simulasikan dua sesi yang mengunci baris yang sama.
3. Buat antrean job dengan `SKIP LOCKED`.
4. Cari transaksi berjalan lebih dari 5 menit.
5. Periksa `n_dead_tup` pada tabel orders.

::: tip 💡 Tips
Transaksi yang panjang adalah musuh utama VACUUM. Lakukan pekerjaan berat di luar transaksi, dan jangan menunggu respons pengguna di dalam transaksi.
:::
