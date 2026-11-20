---
title: "Bab 21 — Partisi, Pooling & Skala"
---

# 🚀 Bab 21 — Partisi, Pooling & Skala

> 🎯 **Tujuan Bab:** menjaga performa tetap stabil ketika data dan koneksi bertambah.

## 21.1 📈 Skala Vertikal Dulu

Sebelum arsitektur rumit:

1. tambah RAM/CPU/disk;
2. perbaiki query dan index;
3. pasang connection pooling;
4. pertimbangkan replika baca;
5. baru partisi atau sharding.

Sebagian besar masalah “database lambat” bukan masalah kapasitas, melainkan query, index, atau koneksi yang buruk.

## 21.2 🧩 Partisi Deklaratif

Partisi membagi satu tabel logis menjadi beberapa tabel fisik.

### Range

```sql
CREATE TABLE events (
  id         BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id    BIGINT NOT NULL,
  jenis      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2025_01 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE events_2025_02 PARTITION OF events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

### List

```sql
CREATE TABLE orders (
  id      BIGINT GENERATED ALWAYS AS IDENTITY,
  wilayah TEXT NOT NULL,
  total   NUMERIC(12,2),
  PRIMARY KEY (id, wilayah)
) PARTITION BY LIST (wilayah);

CREATE TABLE orders_jabar PARTITION OF orders FOR VALUES IN ('jabar');
CREATE TABLE orders_jatim PARTITION OF orders FOR VALUES IN ('jatim');
```

### Hash

```sql
CREATE TABLE sessions (
  id      UUID NOT NULL,
  user_id BIGINT NOT NULL,
  data    JSONB,
  PRIMARY KEY (id)
) PARTITION BY HASH (id);

CREATE TABLE sessions_0 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_1 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE sessions_2 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE sessions_3 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

## 21.3 ✂️ Partition Pruning

Planner hanya membaca partisi yang relevan:

```sql
EXPLAIN
SELECT * FROM events
WHERE created_at >= '2025-02-01'
  AND created_at <  '2025-03-01';
```

Jika pruning bekerja, hanya `events_2025_02` yang dipindai. Pastikan kondisi memakai kolom partisi secara langsung.

## 21.4 ⚠️ Batasan Partisi

- Primary key dan unique constraint **harus menyertakan kolom partisi**.
- Foreign key dari tabel lain ke tabel terpartisi didukung, tetapi perhatikan versi PostgreSQL.
- Terlalu banyak partisi memperlambat planning.
- Partisi tidak otomatis mempercepat semua query; index tetap perlu.
- `UPDATE` yang mengubah kolom partisi memindahkan baris antar partisi.

## 21.5 🔄 Maintenance Partisi

Membuat partisi baru:

```sql
CREATE TABLE events_2025_03 PARTITION OF events
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
```

Melepas partisi lama:

```sql
ALTER TABLE events DETACH PARTITION events_2025_01;
```

Setelah detach, partisi menjadi tabel biasa dan bisa diarsipkan atau dihapus.

Default partition menampung baris yang tidak cocok:

```sql
CREATE TABLE events_lain PARTITION OF events DEFAULT;
```

> ⚠️ Default partition bisa memperlambat pembuatan partisi baru karena harus diperiksa.

## 21.6 🔌 Connection Pooling

PostgreSQL menangani koneksi sebagai proses. Terlalu banyak koneksi menghabiskan RAM dan CPU context switching.

Cek jumlah koneksi:

```sql
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;
```

Batas:

```sql
SHOW max_connections;
```

Jangan menaikkan `max_connections` sembarangan. Gunakan pooler.

## 21.7 🧰 PgBouncer

PgBouncer adalah connection pooler populer.

```ini
[databases]
toko = host=127.0.0.1 port=5432 dbname=toko

[pgbouncer]
listen_port = 6432
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

Mode:

| Mode | Arti | Catatan |
|---|---|---|
| `session` | Satu koneksi server per klien | Paling kompatibel |
| `transaction` | Koneksi dilepas setelah transaksi | Umum, hemat |
| `statement` | Dilepas setelah statement | Paling ketat |

Pada `transaction` mode, fitur yang bergantung pada sesi bisa bermasalah:

- temporary table;
- `SET` sesi;
- advisory lock sesi;
- prepared statement (dukungan tergantung versi PgBouncer/driver).

Uji aplikasi Anda sebelum memakai mode ini.

## 21.8 📖 Replika Baca

Replika baca membantu query berat seperti laporan.

```sql
-- di primary
SELECT client_addr, state, sent_lsn, replay_lsn
FROM pg_stat_replication;
```

Keterlambatan replikasi:

```sql
SELECT now() - pg_last_xact_replay_timestamp() AS lag;
```

Jalankan di replika. Query laporan di replika, tetapi **baca data yang baru ditulis dari primary** untuk menghindari data basi.

## 21.9 🧮 Connection Budget

Hitung kebutuhan koneksi:

```
jumlah worker aplikasi × pool size per worker
+ migration/admin
+ monitoring
+ cadangan
```

Jika aplikasi punya 20 worker dan tiap worker membuka 20 koneksi, Anda sudah memakai 400 koneksi. Pooler membantu menekan angka ini.

## 21.10 🎬 Studi Kasus: Tabel Events

Tanpa partisi, tabel events 500 juta baris makin lambat.

Solusi:

1. partisi bulanan berdasarkan `created_at`;
2. index pada `(user_id, created_at)`;
3. arsipkan partisi lama dengan `DETACH`;
4. query selalu menyertakan rentang `created_at`.

Hasil: pruning memindai satu partisi, maintenance lebih mudah, dan arsip tidak mengganggu tabel utama.

## 📌 Ringkasan

- Optimasi query dan pooling sebelum partisi.
- Partisi membantu data besar dan maintenance, bukan menggantikan index.
- Unique constraint harus menyertakan kolom partisi.
- PgBouncer transaction mode efisien dengan beberapa batasan.
- Replika baca cocok untuk laporan, tetapi waspadai lag.

## 🧪 Latihan

1. Buat tabel events terpartisi per bulan.
2. Buktikan pruning dengan `EXPLAIN`.
3. Detach satu partisi lama.
4. Hitung connection budget aplikasi Anda.
5. Jelaskan kapan replika baca tidak cocok.

::: tip 💡 Tips
Partisi adalah solusi operasional jangka panjang. Mulai dari yang sederhana; jangan partisi tabel yang belum besar hanya karena terlihat canggih.
:::
