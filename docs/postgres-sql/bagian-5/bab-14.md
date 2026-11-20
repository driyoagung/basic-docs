---
title: "Bab 14 — Array, Enum, Range & Tipe Khusus"
---

# 🧱 Bab 14 — Array, Enum, Range & Tipe Khusus

> 🎯 **Tujuan Bab:** memakai tipe data khas PostgreSQL yang menyelesaikan masalah desain tertentu dengan rapi.

## 14.1 🧩 Array

```sql
CREATE TABLE articles (
  id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  judul TEXT NOT NULL,
  tags  TEXT[] NOT NULL DEFAULT '{}'
);

INSERT INTO articles (judul, tags) VALUES
  ('Belajar PostgreSQL', ARRAY['database','sql','postgresql']),
  ('Tips Index', '{database,performa}');
```

Query:

```sql
SELECT * FROM articles WHERE 'sql' = ANY(tags);
SELECT * FROM articles WHERE tags @> ARRAY['database'];
SELECT judul, unnest(tags) AS tag FROM articles;
```

Menggabungkan kembali:

```sql
SELECT judul, array_agg(tag ORDER BY tag) AS tags
FROM articles, unnest(tags) AS tag
GROUP BY judul;
```

Index GIN:

```sql
CREATE INDEX idx_articles_tags ON articles USING GIN (tags);
```

## 14.2 ⚖️ Kapan Array Dipakai?

**Cocok jika:**

- daftar kecil dan jarang diubah;
- tidak perlu foreign key per elemen;
- sering dibaca sebagai satu kesatuan.

**Tidak cocok jika:**

- elemen perlu relasi ke tabel lain;
- sering difilter dan di-join;
- butuh integritas referensial.

Untuk tags yang perlu dikelola sebagai entitas, gunakan tabel `tags` dan `article_tags`.

## 14.3 🏷️ Enum

```sql
CREATE TYPE status_order AS ENUM (
  'pending', 'paid', 'shipped', 'done', 'cancelled'
);

CREATE TABLE orders (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status status_order NOT NULL DEFAULT 'pending'
);
```

| Pendekatan | Kelebihan | Kekurangan |
|---|---|---|
| **Enum** | Ketat, efisien | Menambah nilai perlu `ALTER TYPE` |
| **CHECK** | Mudah diubah | Aturan tersebar di tabel |
| **Tabel referensi** | Fleksibel, bisa metadata | Perlu join |

Menambah nilai enum:

```sql
ALTER TYPE status_order ADD VALUE 'refunded';
```

> ⚠️ Menghapus nilai enum tidak didukung secara langsung. Rencanakan nilai dengan hati-hati.

## 14.4 📆 Range Type

```sql
CREATE TABLE bookings (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id BIGINT NOT NULL,
  periode TSTZRANGE NOT NULL
);

INSERT INTO bookings (room_id, periode) VALUES
  (1, '[2025-01-01 09:00, 2025-01-01 11:00)');
```

Operator range:

| Operator | Arti |
|---|---|
| `&&` | Tumpang tindih |
| `@>` | Mengandung |
| `<@` | Terkandung |
| `-|-` | Bersebelahan |
| `*` | Irisan |

Query bentrok:

```sql
SELECT *
FROM bookings
WHERE room_id = 1
  AND periode && '[2025-01-01 10:00, 2025-01-01 12:00)';
```

## 14.5 🚫 `EXCLUDE`: Mencegah Booking Ganda

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (room_id WITH =, periode WITH &&);
```

Sekarang database menolak booking yang tumpang tindih di ruangan yang sama. Ini contoh aturan bisnis yang paling tepat ditegakkan di database.

## 14.6 🧱 Domain & Tipe Komposit

Domain adalah tipe dengan constraint bawaan:

```sql
CREATE DOMAIN email_valid AS TEXT
  CHECK (VALUE ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

CREATE TABLE users (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email email_valid NOT NULL UNIQUE
);
```

Tipe komposit:

```sql
CREATE TYPE alamat AS (
  jalan  TEXT,
  kota   TEXT,
  kode_pos TEXT
);

CREATE TABLE pelanggan (
  id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rumah  alamat
);
```

Domain berguna untuk aturan yang berulang. Jangan berlebihan; tipe kustom yang terlalu banyak menyulitkan ORM dan developer baru.

## 14.7 🆔 UUID

```sql
CREATE TABLE events (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL
);
```

| Kelebihan | Kekurangan |
|---|---|
| Sulit ditebak | Lebih besar dari bigint |
| Bisa dibuat di client | Index kurang padat |
| Cocok untuk sistem terdistribusi | UUID acak kurang ramah insert |

Untuk tabel besar dengan insert tinggi, `BIGINT IDENTITY` sering lebih efisien. Gunakan UUID untuk ID publik atau kebutuhan terdistribusi.

## 14.8 🌐 `INET` dan `CIDR`

```sql
CREATE TABLE akses (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip    INET NOT NULL,
  subnet CIDR
);

INSERT INTO akses (ip, subnet) VALUES
  ('192.168.1.10', '192.168.1.0/24');

SELECT * FROM akses WHERE ip << '192.168.1.0/24';
```

Tipe jaringan memvalidasi format dan mendukung operator subnet.

## 14.9 🎬 Studi Kasus: Reservasi

```sql
CREATE TABLE reservasi (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ruang_id   BIGINT NOT NULL,
  pelanggan  TEXT NOT NULL,
  periode    TSTZRANGE NOT NULL,
  EXCLUDE USING gist (ruang_id WITH =, periode WITH &&)
);
```

Coba masukkan jadwal bentrok:

```sql
INSERT INTO reservasi (ruang_id, pelanggan, periode) VALUES
  (1, 'Budi', '[2025-02-01 09:00, 2025-02-01 11:00)');

INSERT INTO reservasi (ruang_id, pelanggan, periode) VALUES
  (1, 'Sari', '[2025-02-01 10:00, 2025-02-01 12:00)');
-- ERROR: exclusion violation
```

## 📌 Ringkasan

- Array cocok untuk daftar kecil yang jarang di-join.
- Enum ketat tetapi kurang fleksibel untuk perubahan.
- Range dan `EXCLUDE` sangat kuat untuk mencegah tumpang tindih.
- Domain menyatukan tipe dan constraint.
- UUID berguna untuk ID publik, tetapi pertimbangkan performa index.

## 🧪 Latihan

1. Buat tabel `articles` dengan kolom `tags TEXT[]` dan index GIN.
2. Buat enum status order dan tabel order.
3. Buat tabel booking dengan `EXCLUDE` agar tidak bentrok.
4. Buat domain email dan pakai di tabel users.
5. Bandingkan UUID dan identity untuk tabel events.

::: tip 💡 Tips
Gunakan fitur khas PostgreSQL hanya ketika ia menyederhanakan aturan bisnis. Jika tipe khusus membuat query dan ORM menjadi rumit tanpa manfaat jelas, pilih desain relasional biasa.
:::
