---
title: "Bab 3 — Struktur Logis: Cluster, Database, Schema & Role"
---

# 🗂️ Bab 3 — Struktur Logis: Cluster, Database, Schema & Role

> 🎯 **Tujuan Bab:** memahami cara PostgreSQL menyusun database, schema, dan role — perbedaan penting dibanding MySQL.

## 3.1 🏢 Cluster, Database, Schema

```
CLUSTER (satu instance PostgreSQL)
├── Database: toko
│   ├── Schema: public           ← schema bawaan
│   │   ├── Tabel: users
│   │   └── Tabel: products
│   └── Schema: reporting        ← schema buatan sendiri
│       └── View: ringkasan_omzet
├── Database: postgres           ← database bawaan
└── Role: app_toko, admin, ...   ← user & grup digabung
```

| Istilah | Arti |
|---|---|
| **Cluster** | Satu instalasi/server PostgreSQL yang menjalankan banyak database |
| **Database** | Kumpulan objek yang terisolasi; koneksi selalu ke satu database |
| **Schema** | Namespace di dalam database untuk mengelompokkan tabel/objek |
| **Role** | Identitas untuk login dan/atau grup hak akses |

Perbedaan besar dari MySQL: MySQL menganggap "database" dan "schema" sebagai hal yang sama. PostgreSQL memisahkannya. Satu database bisa punya banyak schema.

## 3.2 🧭 `search_path`

Saat Anda menulis:

```sql
SELECT * FROM users;
```

PostgreSQL mencari `users` di schema sesuai `search_path`.

```sql
SHOW search_path;
-- "$user", public
```

Artinya: cari schema bernama sama dengan user, lalu `public`.

Membuat schema:

```sql
CREATE SCHEMA reporting;

CREATE TABLE reporting.ringkasan_omzet (
  bulan  DATE PRIMARY KEY,
  omzet  NUMERIC(14,2) NOT NULL
);
```

Memakai schema eksplisit:

```sql
SELECT * FROM reporting.ringkasan_omzet;
```

Mengubah search_path:

```sql
SET search_path TO app, public;
```

> ⚠️ Hati-hati mengubah `search_path` global. Aplikasi dan migrasi bisa bingung jika schema tidak eksplisit.

## 3.3 👤 Role: User dan Grup

Di PostgreSQL, user dan grup disatukan menjadi **role**.

```sql
CREATE ROLE app_toko LOGIN PASSWORD 'password_kuat';
CREATE ROLE read_only NOLOGIN;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only;
GRANT read_only TO app_toko;
```

| Atribut | Arti |
|---|---|
| `LOGIN` | Boleh terhubung |
| `NOLOGIN` | Hanya grup hak akses |
| `SUPERUSER` | Melewati semua pemeriksaan hak |
| `CREATEDB` | Boleh membuat database |
| `CREATEROLE` | Boleh membuat role |

Role bisa menjadi anggota role lain (pewarisan hak). Ini memudahkan pengelolaan akses.

## 3.4 🧱 Database Sistem & Template

| Database | Fungsi |
|---|---|
| `postgres` | Database bawaan untuk administrasi |
| `template0` | Template bersih, tidak boleh diubah |
| `template1` | Template default untuk database baru |

Saat Anda `CREATE DATABASE toko`, PostgreSQL menyalin `template1`. Itu sebabnya extension atau setting yang dipasang di `template1` ikut ke database baru.

## 3.5 🏗️ Arsitektur Konseptual

```
Client
  │
  ▼
Postmaster (proses utama)
  ├── Backend process per koneksi
  ├── Shared buffers (cache halaman)
  ├── WAL (write-ahead log)
  └── Background workers (autovacuum, checkpointer, ...)
```

Yang perlu dipahami:

- **Shared buffers** menyimpan halaman data di memori.
- **WAL** mencatat perubahan sebelum ditulis ke file data, menjamin durabilitas.
- **MVCC** membuat pembaca tidak memblokir penulis.
- **Autovacuum** membersihkan baris mati.

Detail internal tidak perlu dihafal, tetapi konsepnya menjelaskan mengapa PostgreSQL bisa pulih setelah crash dan mengapa `VACUUM` penting.

## 3.6 🗂️ Banyak Schema vs Banyak Database

| Kebutuhan | Pilihan |
|---|---|
| Modul aplikasi yang masih berbagi data | Banyak schema dalam satu database |
| Isolasi total antar aplikasi/tenant | Database terpisah |
| Lingkungan dev/staging/prod | Cluster atau server terpisah |
| Reporting dari data yang sama | Schema `reporting` |

Banyak schema memudahkan join lintas modul. Banyak database memberi isolasi lebih kuat, tetapi tidak bisa join langsung tanpa extension seperti `postgres_fdw`.

## 3.7 🧪 Praktik: Membuat Struktur Awal

```sql
CREATE DATABASE toko;
\c toko

CREATE SCHEMA app;
CREATE SCHEMA reporting;

CREATE TABLE app.users (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE VIEW reporting.v_users AS
SELECT id, nama, email FROM app.users;
```

Cek:

```sql
\dn
\dt app.*
SELECT * FROM reporting.v_users;
```

## 📌 Ringkasan

- Cluster berisi banyak database; database berisi banyak schema.
- Schema adalah namespace, berbeda dari database.
- `search_path` menentukan schema yang dicari lebih dulu.
- Role menyatukan user dan grup.
- WAL dan MVCC adalah fondasi durabilitas dan konkurensi PostgreSQL.

## 🧪 Latihan

1. Buat database `toko` dan dua schema: `app` dan `reporting`.
2. Buat tabel `app.users` dan view `reporting.v_users`.
3. Tampilkan daftar schema dengan `\dn`.
4. Buat role `read_only` dan beri hak `SELECT`.
5. Jelaskan kapan memilih banyak schema vs banyak database.

::: tip 💡 Tips
Gunakan nama schema yang jelas (`app`, `reporting`, `audit`) dan selalu tulis nama schema di migration. Ini mencegah query "hilang" saat `search_path` berubah.
:::
