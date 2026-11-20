---
title: "Bab 25 — Dari MySQL ke PostgreSQL"
---

# 🔄 Bab 25 — Dari MySQL ke PostgreSQL

> 🎯 **Tujuan Bab:** memindahkan aplikasi MySQL ke PostgreSQL tanpa kehilangan data dan tanpa kejutan perilaku.

## 25.1 🗺️ Perbedaan Tipe Data

| MySQL | PostgreSQL | Catatan |
|---|---|---|
| `INT AUTO_INCREMENT` | `BIGINT GENERATED ALWAYS AS IDENTITY` | Atau `SERIAL` |
| `TINYINT(1)` | `BOOLEAN` | MySQL sering memakainya sebagai boolean |
| `DATETIME` | `TIMESTAMPTZ` | Pertimbangkan zona waktu |
| `TIMESTAMP` | `TIMESTAMPTZ` | Perilaku berbeda |
| `DECIMAL` | `NUMERIC` | Sama-sama exact |
| `DOUBLE` | `DOUBLE PRECISION` | |
| `TEXT` | `TEXT` | |
| `BLOB` | `BYTEA` | |
| `JSON` | `JSONB` | Lebih cepat dan bisa di-index |
| `ENUM(...)` | `ENUM` atau `CHECK` | PostgreSQL enum lebih kaku |
| `SET(...)` | `TEXT[]` atau tabel relasi | |
| `UNSIGNED` | Tidak ada | Gunakan `CHECK` |
| `CHAR(n)` | `CHAR(n)` | Padding berbeda |
| `ZEROFILL` | Tidak ada | Format di aplikasi |

Uang selalu `NUMERIC`, bukan `FLOAT`/`DOUBLE`.

## 25.2 🔤 Sintaks Dasar

| MySQL | PostgreSQL |
|---|---|
| `` `nama` `` | `"nama"` |
| `IFNULL(a,b)` | `COALESCE(a,b)` |
| `NOW()` | `now()` |
| `CURDATE()` | `CURRENT_DATE` |
| `DATE_FORMAT(t,'%Y-%m')` | `to_char(t,'YYYY-MM')` |
| `STR_TO_DATE` | `to_date` / `to_timestamp` |
| `CONCAT(a,b)` | `a || b` atau `concat()` |
| `LIMIT 10,20` | `LIMIT 20 OFFSET 10` |
| `GROUP_CONCAT` | `string_agg` |
| `FIND_IN_SET` | `= ANY(array)` atau join |
| `REGEXP` | `~` / `~*` |
| `RAND()` | `random()` |
| `LAST_INSERT_ID()` | `RETURNING id` |

## 25.3 🧱 Identitas & Sequence

MySQL:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100)
);
```

PostgreSQL:

```sql
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama TEXT NOT NULL
);
```

Mengambil ID baru:

```sql
INSERT INTO users (nama) VALUES ('Budi') RETURNING id;
```

## 25.4 ⚠️ `ON DUPLICATE KEY UPDATE`

MySQL:

```sql
INSERT INTO stok (produk_id, jumlah)
VALUES (1, 10)
ON DUPLICATE KEY UPDATE jumlah = jumlah + VALUES(jumlah);
```

PostgreSQL:

```sql
INSERT INTO stok (produk_id, jumlah)
VALUES (1, 10)
ON CONFLICT (produk_id)
DO UPDATE SET jumlah = stok.jumlah + EXCLUDED.jumlah;
```

`EXCLUDED` merujuk nilai yang gagal dimasukkan.

`INSERT IGNORE`:

```sql
INSERT INTO users (email) VALUES ('budi@mail.com')
ON CONFLICT (email) DO NOTHING;
```

## 25.5 🕰️ Waktu & Zona Waktu

MySQL `DATETIME` tidak menyimpan zona waktu. PostgreSQL `TIMESTAMPTZ` menyimpan titik waktu absolut.

```sql
CREATE TABLE events (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Selalu kirim waktu dengan offset atau dalam UTC. Jangan menyimpan waktu lokal tanpa konteks.

## 25.6 🔠 Case Sensitivity & Identifier

- Identifier tanpa quote di PostgreSQL dilipat ke huruf kecil.
- `"Nama"` dan `nama` berbeda.
- Hindari identifier campuran huruf besar; gunakan `snake_case`.
- String comparison case-sensitive kecuali memakai `ILIKE`/`lower()`.

```sql
SELECT * FROM users WHERE email ILIKE 'budi@mail.com';
```

## 25.7 🧮 `GROUP BY` Ketat

MySQL historically mengizinkan kolom tidak diagregasi. PostgreSQL tidak.

```sql
-- gagal di PostgreSQL
SELECT user_id, nama, SUM(total)
FROM orders
GROUP BY user_id;
```

Perbaiki:

```sql
SELECT user_id, SUM(total)
FROM orders
GROUP BY user_id;
```

Atau gunakan agregasi eksplisit:

```sql
SELECT user_id, MAX(nama) AS nama, SUM(total)
FROM orders
GROUP BY user_id;
```

## 25.8 🔢 Integer & Unsigned

PostgreSQL tidak punya `UNSIGNED`.

```sql
CREATE TABLE produk (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stok  INTEGER NOT NULL CHECK (stok >= 0),
  harga NUMERIC(12,2) NOT NULL CHECK (harga >= 0)
);
```

Gunakan `CHECK` untuk aturan yang sebelumnya dijamin `UNSIGNED`.

## 25.9 🧩 JSON & Array

MySQL `JSON` → PostgreSQL `JSONB`.

```sql
CREATE TABLE produk (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attrs JSONB NOT NULL DEFAULT '{}'
);
```

Jika MySQL memakai `SET` atau CSV, pertimbangkan `TEXT[]`:

```sql
tags TEXT[] NOT NULL DEFAULT '{}'
```

Namun jika elemen perlu relasi, buat tabel pivot.

## 25.10 🧰 Alat Migrasi

| Alat | Kegunaan |
|---|---|
| **pgloader** | Migrasi otomatis MySQL → PostgreSQL |
| **AWS SCT** | Konversi skema |
| **Laravel migration** | Bangun ulang skema di PostgreSQL |
| **Dump/restore manual** | Kontrol penuh, cocok untuk skema kecil |

Contoh pgloader:

```text
load database
  from mysql://user:pass@localhost/toko
  into postgresql://user:pass@localhost/toko;

with create tables, create indexes, reset sequences, foreign keys;
```

Opsi seperti `include drop`, `data only`, dan `workers` bisa ditambahkan sesuai kebutuhan. Selalu uji hasil konversi tipe dan constraint.

## 25.11 📋 Checklist Migrasi

- [ ] Petakan semua tipe data.
- [ ] Ganti `AUTO_INCREMENT` dengan identity.
- [ ] Ganti `IFNULL` dengan `COALESCE`.
- [ ] Ganti `ON DUPLICATE KEY` dengan `ON CONFLICT`.
- [ ] Perbaiki `GROUP BY` yang tidak ketat.
- [ ] Ganti identifier backtick dengan double quote.
- [ ] Uji query `LIMIT/OFFSET`, tanggal, dan string.
- [ ] Pindahkan `DATETIME` ke `TIMESTAMPTZ`.
- [ ] Uji performa dan index.
- [ ] Uji restore backup.

## 25.12 🎬 Studi Kasus

Aplikasi MySQL memiliki:

- `INT AUTO_INCREMENT`;
- `DATETIME`;
- `JSON`;
- query `IFNULL` dan `GROUP_CONCAT`;
- `ON DUPLICATE KEY UPDATE`.

Langkah:

1. buat skema PostgreSQL baru;
2. migrasikan data dengan pgloader;
3. ubah query aplikasi;
4. jalankan test suite;
5. bandingkan hasil laporan;
6. uji rollback dan backup.

## 📌 Ringkasan

- Tipe data dan semantik waktu adalah perbedaan terbesar.
- `RETURNING` dan `ON CONFLICT` menggantikan pola MySQL.
- `GROUP BY` PostgreSQL lebih ketat.
- Gunakan alat migrasi, tetapi verifikasi hasilnya.
- Uji aplikasi, bukan hanya skema.

## 🧪 Latihan

1. Konversi tabel MySQL `INT AUTO_INCREMENT` ke PostgreSQL.
2. Ganti `IFNULL` dengan `COALESCE`.
3. Tulis ulang `ON DUPLICATE KEY UPDATE` dengan `ON CONFLICT`.
4. Perbaiki query `GROUP BY` yang tidak valid.
5. Rancang checklist migrasi untuk aplikasi Anda.

::: tip 💡 Tips
Migrasi bukan hanya soal data. Query, ORM, laporan, dan ekspektasi pengguna terhadap waktu juga harus diuji.
:::
