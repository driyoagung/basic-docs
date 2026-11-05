---
title: "Bab 1 — Mengenal Database & DBMS"
---

# 📘 Bab 1 — Mengenal Database & DBMS

> 🎯 **Tujuan Bab:** memahami apa itu data, database, dan DBMS, serta mengapa aplikasi serius tidak cukup menyimpan data di file teks atau spreadsheet.

## 1.1 🤔 Data, Database, dan DBMS

Tiga istilah ini sering tertukar.

| Istilah | Arti sederhana | Contoh |
|---|---|---|
| **Data** | Fakta mentah yang belum diolah | `Budi`, `150000`, `2026-01-10` |
| **Database** | Kumpulan data yang terorganisasi | Database `toko` berisi tabel `users`, `orders` |
| **DBMS** | Perangkat lunak untuk mengelola database | MySQL, PostgreSQL, SQLite |

Jadi, **MySQL adalah DBMS**, sedangkan **`toko` adalah database** yang dikelola oleh MySQL.

DBMS bertanggung jawab untuk:

- menyimpan data ke disk;
- mengatur siapa yang boleh membaca dan menulis;
- menjaga data tetap konsisten saat banyak pengguna mengakses bersamaan;
- menyediakan bahasa query (SQL);
- melakukan backup, restore, dan pemulihan setelah crash.

## 1.2 🗂️ Mengapa Tidak Cukup Memakai File atau Spreadsheet?

Menyimpan data di file CSV atau spreadsheet memang mudah untuk 100 baris. Masalahnya muncul saat data tumbuh dan dipakai banyak orang.

| Kebutuhan | File teks / spreadsheet | Database |
|---|---|---|
| Akses bersamaan | Rawan bentrok dan overwrite | Dikelola dengan transaksi dan lock |
| Pencarian cepat | Membaca seluruh file | Index dan query optimizer |
| Relasi antar data | Harus dicocokkan manual | Foreign key dan JOIN |
| Validasi | Tergantung disiplin pengguna | Constraint di tingkat database |
| Keamanan | Siapa pun yang punya file bisa membuka | User, privilege, dan enkripsi |
| Pemulihan | Bergantung pada backup manual | Transaksi, log, dan backup teruji |

> 💡 **Analogi:** file teks seperti buku catatan lepas. Database seperti perpustakaan dengan katalog, rak, aturan peminjaman, dan penjaga. Semakin besar koleksinya, semakin besar manfaat strukturnya.

## 1.3 🏗️ Arsitektur Client–Server

MySQL berjalan sebagai **server**. Aplikasi Anda berperan sebagai **client**.

```
┌─────────────────────┐        koneksi TCP        ┌──────────────────────┐
│  Aplikasi (client)  │ ────────────────────────▶ │  MySQL Server        │
│  PHP / Node.js      │                           │  ┌────────────────┐  │
│  DBeaver / CLI      │ ◀──────────────────────── │  │ Database: toko │  │
└─────────────────────┘        hasil query        │  └────────────────┘  │
                                                  └──────────────────────┘
```

Alurnya:

1. Aplikasi membuka koneksi ke alamat dan port MySQL (default `localhost:3306`).
2. Aplikasi mengirim perintah SQL.
3. Server memvalidasi hak akses, menjalankan query, lalu mengembalikan hasil.
4. Koneksi ditutup atau dikembalikan ke connection pool.

Pemisahan ini penting: database bisa berada di server lain, dan aplikasi tidak perlu tahu cara data disimpan di disk.

## 1.4 🔤 Apa itu SQL?

**SQL (Structured Query Language)** adalah bahasa standar untuk berkomunikasi dengan database relasional.

```sql
SELECT nama, email
FROM users
WHERE aktif = 1
ORDER BY nama;
```

SQL dibagi menjadi beberapa kelompok:

| Kelompok | Fungsi | Contoh |
|---|---|---|
| **DDL** | Mendefinisikan struktur | `CREATE`, `ALTER`, `DROP` |
| **DML** | Memanipulasi data | `INSERT`, `UPDATE`, `DELETE` |
| **DQL** | Mengambil data | `SELECT` |
| **DCL** | Mengatur hak akses | `GRANT`, `REVOKE` |
| **TCL** | Mengatur transaksi | `COMMIT`, `ROLLBACK` |

SQL bersifat **deklaratif**: Anda menjelaskan *apa* yang ingin diambil, bukan *bagaimana* mengambilnya. Query optimizer MySQL yang menentukan cara tercepat.

## 1.5 🧱 Istilah Dasar

| Istilah | Arti |
|---|---|
| **Database** | Wadah untuk kumpulan tabel |
| **Tabel** | Kumpulan data dengan struktur kolom yang sama |
| **Baris (row)** | Satu data lengkap, misalnya satu user |
| **Kolom (column)** | Satu atribut, misalnya `email` |
| **Skema (schema)** | Definisi struktur database atau tabel |
| **Primary key** | Kolom yang menjadi identitas unik tiap baris |
| **Foreign key** | Kolom yang merujuk ke primary key tabel lain |
| **Index** | Struktur bantu untuk mempercepat pencarian |

Contoh tabel `users`:

```
id | nama | email              | aktif
---+------+--------------------+------
1  | Budi | budi@mail.com      | 1
2  | Ani  | ani@mail.com       | 1
```

- `id` adalah primary key.
- Setiap baris adalah satu user.
- `nama`, `email`, dan `aktif` adalah kolom.

## 1.6 🕰️ Sejarah Singkat

Pada 1970, **E. F. Codd** dari IBM memperkenalkan model relasional: data disimpan dalam tabel dan dihubungkan lewat nilai, bukan pointer fisik. Ide ini menjadi dasar SQL dan hampir semua database modern.

Perjalanan singkatnya:

- **1970-an** — model relasional dan SQL lahir.
- **1995** — MySQL dirilis, populer karena ringan dan open-source.
- **2000-an** — MySQL menjadi tulang punggung banyak aplikasi web (termasuk WordPress dan Laravel).
- **2010-an** — MySQL 5.6/5.7 menambah performa dan JSON.
- **2018-sekarang** — MySQL 8.x membawa CTE, window function, role, dan peningkatan keamanan.

Hari ini MySQL tetap menjadi salah satu database relasional paling banyak dipakai di dunia, terutama untuk aplikasi web.

## 📌 Ringkasan

- Data adalah fakta mentah; database adalah kumpulan data terorganisasi; DBMS adalah perangkat lunak pengelolanya.
- File dan spreadsheet tidak cukup untuk data besar, banyak pengguna, dan relasi kompleks.
- MySQL bekerja dengan arsitektur client–server dan berkomunikasi memakai SQL.
- Tabel terdiri dari baris dan kolom; primary key memberi identitas unik.
- Model relasional sudah berumur lebih dari 50 tahun karena strukturnya kuat.

## 🧪 Latihan

1. Jelaskan perbedaan database dan DBMS dengan kata-kata sendiri.
2. Sebutkan tiga masalah yang muncul jika data toko online disimpan di spreadsheet.
3. Gambarkan alur aplikasi Laravel mengirim query ke MySQL dan menerima hasil.
4. Untuk tabel `products`, tentukan kolom apa saja yang mungkin ada dan kolom mana yang cocok menjadi primary key.
5. Cari satu aplikasi yang Anda pakai sehari-hari dan tebak data apa yang mungkin disimpan di database relasional.

::: tip 💡 Tips
Sebelum lanjut, pastikan Anda bisa menjawab: "Kalau MySQL mati, di mana data tetap tersimpan?" Jawabannya ada di disk server, bukan di memori aplikasi. Bab 16 dan 20 akan membahas bagaimana data dijaga tetap aman.
:::
