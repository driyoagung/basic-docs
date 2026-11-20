---
title: "Bab 2 — Instalasi & Mengenal psql"
---

# 🚀 Bab 2 — Instalasi & Mengenal `psql`

> 🎯 **Tujuan Bab:** menjalankan PostgreSQL, terhubung dengan `psql`, dan nyaman menjelajah database dari terminal.

## 2.1 🐳 Instalasi dengan Docker (Disarankan untuk Latihan)

Docker membuat latihan mudah diulang dan tidak mengotori sistem.

```bash
docker run --name pg-belajar \
  -e POSTGRES_PASSWORD=rahasia123 \
  -p 5432:5432 \
  -d postgres:16
```

Cek container:

```bash
docker ps
```

Masuk dengan `psql`:

```bash
docker exec -it pg-belajar psql -U postgres
```

Jika berhasil, Anda akan melihat prompt:

```
postgres=#
```

Buat database latihan:

```sql
CREATE DATABASE toko;
```

Keluar:

```sql
\q
```

## 2.2 💻 Instalasi Lokal

| Sistem | Cara Umum |
|---|---|
| **Windows** | Installer resmi dari postgresql.org |
| **macOS** | Homebrew (`brew install postgresql@16`) atau Postgres.app |
| **Linux (Debian/Ubuntu)** | Repository PGDG, lalu `apt install postgresql` |

Setelah instalasi, biasanya ada user sistem `postgres` dan database `postgres`. Gunakan user itu untuk administrasi awal, lalu buat role aplikasi terpisah.

## 2.3 🧭 Mengenal `psql`

`psql` adalah client command line resmi. Ia mendukung SQL biasa dan **meta-command** yang diawali backslash (`\`).

| Perintah | Fungsi |
|---|---|
| `\l` | Daftar database |
| `\c nama_db` | Pindah database |
| `\dt` | Daftar tabel |
| `\d nama_tabel` | Struktur tabel |
| `\dn` | Daftar schema |
| `\du` | Daftar role |
| `\dv` | Daftar view |
| `\df` | Daftar function |
| `\x` | Tampilan vertikal (baris lebar) |
| `\timing` | Tampilkan waktu eksekusi |
| `\i file.sql` | Jalankan file SQL |
| `\e` | Buka editor untuk query |
| `\q` | Keluar |

Contoh:

```
toko=# \dt
          List of relations
 Schema |  Name   | Type  |  Owner
--------+---------+-------+----------
 public | orders  | table | postgres
 public | users   | table | postgres
```

## 2.4 🖥️ Memakai GUI

| Tool | Catatan |
|---|---|
| **DBeaver** | Gratis, lintas platform, mendukung banyak database |
| **pgAdmin** | Tool resmi, fitur lengkap |
| **TablePlus** | Ringan dan cepat |
| **DataGrip** | Berbayar, cocok untuk power user |

GUI memudahkan eksplorasi, tetapi biasakan tetap menulis SQL. ORM dan GUI menyembunyikan query; Anda perlu tahu apa yang sebenarnya dijalankan.

## 2.5 🔗 Connection String

Format umum:

```
postgresql://user:password@host:5432/nama_database
```

Contoh:

```
postgresql://app_toko:rahasia@127.0.0.1:5432/toko
```

Banyak driver juga membaca variabel environment:

| Variabel | Arti |
|---|---|
| `PGHOST` | Host |
| `PGPORT` | Port |
| `PGDATABASE` | Database |
| `PGUSER` | User |
| `PGPASSWORD` | Password |

Jangan menaruh password di kode. Gunakan `.env` atau secret manager.

## 2.6 🚨 Membaca Pesan Error

PostgreSQL memberi pesan yang cukup jelas. Contoh:

```
ERROR:  relation "user" does not exist
LINE 1: SELECT * FROM user;
                      ^
```

Pesan ini berarti tabel `user` tidak ada. Perhatikan juga **SQLSTATE**, kode lima karakter yang berguna untuk aplikasi:

| SQLSTATE | Arti |
|---|---|
| `23505` | Unique violation |
| `23503` | Foreign key violation |
| `23502` | Not null violation |
| `42P01` | Undefined table |
| `42703` | Undefined column |
| `40001` | Serialization failure (perlu retry) |

Aplikasi yang baik menangani kode ini, bukan hanya mencocokkan teks error.

## 2.7 📦 Memuat Dataset Latihan

Buat database dan tabel awal:

```sql
CREATE DATABASE toko;
\c toko

CREATE TABLE users (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO users (nama, email) VALUES
  ('Budi', 'budi@mail.com'),
  ('Sari', 'sari@mail.com'),
  ('Andi', 'andi@mail.com');
```

Cek isi:

```sql
SELECT * FROM users;
```

Di bab-bab berikutnya, dataset ini akan berkembang menjadi toko online lengkap.

## 2.8 🧰 Perintah `psql` yang Sering Dipakai

```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d toko
psql "postgresql://postgres:rahasia@127.0.0.1:5432/toko"
psql -U postgres -f schema.sql
psql -U postgres -c "SELECT version();"
```

`-c` menjalankan satu perintah, `-f` menjalankan file. Berguna untuk otomatisasi dan CI.

## 📌 Ringkasan

- Docker adalah cara tercepat memulai PostgreSQL untuk latihan.
- `psql` adalah client resmi dengan meta-command yang kuat.
- Connection string dan variabel `PG*` memudahkan koneksi.
- SQLSTATE membantu aplikasi menangani error dengan tepat.
- Biasakan membuat database dan dataset latihan yang bisa diulang.

## 🧪 Latihan

1. Jalankan PostgreSQL dengan Docker dan masuk memakai `psql`.
2. Buat database `toko` dan tabel `users`.
3. Tampilkan daftar tabel dengan `\dt` dan struktur dengan `\d users`.
4. Jalankan query memakai `psql -c`.
5. Sebutkan SQLSTATE untuk unique violation dan foreign key violation.

::: tip 💡 Tips
Simpan semua perintah setup dalam file `schema.sql`. Saat latihan rusak, Anda bisa membangun ulang database dalam hitungan detik.
:::
