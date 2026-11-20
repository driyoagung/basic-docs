---
title: "Bab 16 — Extension"
---

# 🧰 Bab 16 — Extension

> 🎯 **Tujuan Bab:** memahami cara memasang extension dan memilih extension yang benar-benar dibutuhkan.

## 16.1 🧩 Apa Itu Extension?

Extension adalah paket yang menambahkan tipe data, fungsi, operator, atau fitur baru ke PostgreSQL. Extension dipasang di level database.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Melihat extension terpasang:

```sql
\dx
```

Melihat extension yang tersedia:

```sql
SELECT name, default_version, installed_version
FROM pg_available_extensions
ORDER BY name;
```

Menghapus:

```sql
DROP EXTENSION pg_trgm;
```

## 16.2 📦 Extension yang Sering Dipakai

| Extension | Kegunaan |
|---|---|
| `pg_trgm` | Pencarian fuzzy dan akselerasi `LIKE`/`ILIKE` |
| `citext` | Teks tidak sensitif huruf besar/kecil |
| `pgcrypto` | Fungsi kriptografi dan hashing |
| `PostGIS` | Data geospasial: titik, jarak, area |
| `pgvector` | Penyimpanan dan pencarian vektor untuk AI |
| `pg_stat_statements` | Statistik query untuk tuning |
| `TimescaleDB` | Data time-series |
| `postgres_fdw` | Query database lain dari PostgreSQL |

## 16.3 🔤 `citext`

```sql
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email CITEXT NOT NULL UNIQUE
);
```

Dengan `citext`, `Budi@Mail.com` dan `budi@mail.com` dianggap sama. Alternatif tanpa extension: index pada `lower(email)`.

```sql
CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));
```

## 16.4 🔐 `pgcrypto`

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SELECT crypt('password123', gen_salt('bf'));
SELECT gen_random_uuid();
```

> ⚠️ Untuk password aplikasi, hashing sebaiknya dilakukan di aplikasi dengan Argon2id/bcrypt. `pgcrypto` berguna untuk kebutuhan tertentu, tetapi jangan menyimpan password mentah.

## 16.5 🗺️ PostGIS

PostGIS menambahkan tipe `geometry`/`geography` dan fungsi spasial.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE toko (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama     TEXT NOT NULL,
  lokasi   GEOGRAPHY(POINT, 4326) NOT NULL
);

CREATE INDEX idx_toko_lokasi ON toko USING GIST (lokasi);
```

Mencari toko terdekat:

```sql
SELECT nama,
       ST_Distance(lokasi, ST_MakePoint(106.8272, -6.1754)::geography) AS meter
FROM toko
ORDER BY lokasi <-> ST_MakePoint(106.8272, -6.1754)::geography
LIMIT 5;
```

## 16.6 🧠 `pgvector`

Untuk aplikasi AI yang menyimpan embedding:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE dokumen (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  isi       TEXT NOT NULL,
  embedding VECTOR(1536)
);

CREATE INDEX idx_dokumen_embedding
  ON dokumen USING hnsw (embedding vector_cosine_ops);
```

Query kemiripan:

```sql
SELECT id, isi
FROM dokumen
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 5;
```

## 16.7 📊 `pg_stat_statements`

Extension ini mencatat statistik query. Biasanya perlu ditambahkan ke `shared_preload_libraries` dan restart server.

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Query teratas berdasarkan total waktu:

```sql
SELECT
  calls,
  total_exec_time,
  mean_exec_time,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

## 16.8 🔗 `postgres_fdw`

Mengakses tabel dari database PostgreSQL lain:

```sql
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER server_laporan
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host '10.0.0.5', dbname 'reporting', port '5432');

CREATE USER MAPPING FOR app_toko
  SERVER server_laporan
  OPTIONS (user 'readonly', password 'rahasia');

CREATE FOREIGN TABLE laporan_omzet (
  bulan DATE,
  omzet NUMERIC(14,2)
)
SERVER server_laporan
OPTIONS (schema_name 'public', table_name 'omzet_bulanan');
```

Sekarang `laporan_omzet` bisa di-query seperti tabel lokal.

## 16.9 ⚠️ Risiko Ketergantungan

| Risiko | Dampak |
|---|---|
| Tidak tersedia di managed service | Deployment gagal |
| Upgrade PostgreSQL | Extension belum kompatibel |
| Portabilitas | Pindah database jadi sulit |
| Keamanan | Extension pihak ketiga perlu dipercaya |

Sebelum memakai extension, tanyakan:

1. Apakah benar-benar dibutuhkan?
2. Apakah tersedia di lingkungan produksi?
3. Siapa yang merawat dan memperbarui?
4. Apa rencana jika extension tidak lagi didukung?

## 📌 Ringkasan

- Extension menambah kemampuan tanpa mengubah inti PostgreSQL.
- `pg_trgm`, `citext`, dan `pgcrypto` sering dipakai.
- PostGIS dan pgvector membuka kebutuhan geospasial dan AI.
- `pg_stat_statements` penting untuk tuning.
- Ketergantungan extension harus dikelola dengan sadar.

## 🧪 Latihan

1. Pasang `pg_trgm` dan cari produk dengan typo.
2. Buat tabel dengan kolom `CITEXT` untuk email.
3. Jelaskan kegunaan PostGIS dan pgvector.
4. Tampilkan query paling mahal dengan `pg_stat_statements`.
5. Sebutkan tiga risiko ketergantungan extension.

::: tip 💡 Tips
Catat semua extension di dokumentasi project. Saat pindah hosting atau upgrade, daftar ini menyelamatkan Anda dari kejutan.
:::
