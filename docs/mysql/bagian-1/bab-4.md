---
title: "Bab 4 — Instalasi & Setup MySQL"
---

# 🚀 Bab 4 — Instalasi & Setup MySQL

> 🎯 **Tujuan Bab:** menyiapkan MySQL 8.x, masuk ke CLI, terhubung lewat GUI, memahami charset, dan memuat dataset latihan toko online.

## 4.1 🐳 Cara 1: Docker (Disarankan untuk Latihan)

Docker membuat MySQL mudah dibuang dan diulang tanpa mengotori sistem.

```bash
docker run --name mysql-belajar \
  -e MYSQL_ROOT_PASSWORD=rahasia123 \
  -p 3306:3306 \
  -d mysql:8
```

Masuk ke MySQL CLI:

```bash
docker exec -it mysql-belajar mysql -u root -p
```

Masukkan password `rahasia123` saat diminta.

> ⚠️ **Keamanan:** password di atas hanya untuk latihan lokal. Jangan pernah memakai password lemah di server yang bisa diakses publik.

Untuk menghentikan dan menghapus container latihan:

```bash
docker stop mysql-belajar
docker rm mysql-belajar
```

Data akan hilang saat container dihapus kecuali Anda memakai volume. Untuk latihan awal, itu justru nyaman karena bisa mengulang dari nol.

## 4.2 💻 Cara 2: Instalasi Langsung

| OS | Pilihan Umum |
|---|---|
| **Windows** | MySQL Installer, Laragon, XAMPP |
| **macOS** | Homebrew (`brew install mysql`), Laravel Herd |
| **Linux** | Paket distro (`apt install mysql-server`) |

Setelah instalasi, pastikan service berjalan:

```bash
# Linux
sudo systemctl status mysql

# macOS (Homebrew)
brew services list
```

## 4.3 🖥️ Memakai MySQL CLI

Masuk ke shell MySQL:

```bash
mysql -u root -p
```

Perintah dasar:

```sql
SHOW DATABASES;
USE toko;
SHOW TABLES;
SELECT VERSION();
```

Keluar:

```sql
EXIT;
```

CLI terasa kaku, tetapi penting karena semua contoh di ebook ini bisa dijalankan langsung. GUI hanya lapisan di atas perintah yang sama.

## 4.4 🖱️ Memakai GUI

Pilihan populer:

- **DBeaver** (gratis, lintas platform)
- **TablePlus** (rapi, berbayar untuk fitur lanjutan)
- **MySQL Workbench** (resmi dari Oracle)

Saat membuat koneksi, isi:

| Field | Nilai latihan |
|---|---|
| Host | `127.0.0.1` |
| Port | `3306` |
| User | `root` |
| Password | sesuai saat instalasi |

## 4.5 🗄️ Anatomi Server MySQL

Saat pertama kali terhubung, Anda akan melihat beberapa database sistem:

| Database | Fungsi |
|---|---|
| `mysql` | User, privilege, dan metadata server |
| `information_schema` | Katalog tabel, kolom, index |
| `performance_schema` | Metrik performa |
| `sys` | View bantu untuk monitoring |

**Jangan mengubah database sistem secara manual.** Gunakan perintah SQL resmi seperti `CREATE USER` dan `GRANT`.

## 4.6 🔤 Charset & Collation

MySQL menyimpan teks dengan **charset** dan aturan perbandingan (**collation**).

Untuk aplikasi modern, gunakan:

```sql
CREATE DATABASE toko
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Mengapa `utf8mb4`?

- mendukung emoji dan karakter di luar BMP;
- mendukung aksara internasional;
- merupakan standar de facto untuk aplikasi web modern.

> ⚠️ `utf8` di MySQL lama hanya mendukung maksimal 3 byte, sehingga emoji bisa gagal disimpan. Selalu pilih `utf8mb4`.

## 4.7 📦 Memuat Dataset Latihan

Buat database dan tabel awal:

```sql
CREATE DATABASE IF NOT EXISTS toko
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE toko;

CREATE TABLE users (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  aktif      TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (nama, email) VALUES
  ('Budi', 'budi@mail.com'),
  ('Ani', 'ani@mail.com'),
  ('Citra', 'citra@mail.com');

SELECT * FROM users;
```

Skema lengkap toko online akan dibangun bertahap mulai Bab 5 dan disatukan di Bab 13.

## 4.8 🧭 Cara Membaca Error MySQL

Error MySQL selalu punya kode dan pesan.

```
ERROR 1045 (28000): Access denied for user 'root'@'localhost'
```

Cara membacanya:

- **1045** — autentikasi gagal (password/user salah);
- **1049** — database tidak ditemukan;
- **1062** — duplikat nilai pada kolom `UNIQUE`;
- **1452** — foreign key gagal karena data induk tidak ada;
- **1064** — sintaks SQL salah.

Biasakan membaca pesan, bukan hanya kodenya. Pesan biasanya menyebut nama kolom atau tabel yang bermasalah.

## ✅ Checklist Setup

- [ ] MySQL 8.x berjalan (Docker atau instalasi lokal)
- [ ] Bisa masuk lewat `mysql -u root -p`
- [ ] Bisa menjalankan `SHOW DATABASES;`
- [ ] Database `toko` dibuat dengan `utf8mb4`
- [ ] Tabel `users` berisi tiga baris data
- [ ] Bisa terhubung lewat GUI (opsional)

## 📌 Ringkasan

- Docker adalah cara tercepat untuk latihan yang bisa diulang.
- CLI adalah fondasi; GUI hanya membantu.
- Gunakan `utf8mb4` untuk aplikasi modern.
- Pahami kode error umum agar debugging lebih cepat.
- Dataset toko online akan dipakai konsisten di seluruh ebook.

## 🧪 Latihan

1. Jalankan MySQL lewat Docker dan masuk ke CLI.
2. Buat database `latihan_4` dengan charset `utf8mb4`.
3. Buat tabel `buku` dengan kolom `id`, `judul`, `penulis`, dan `tahun`.
4. Masukkan tiga buku, lalu tampilkan semuanya.
5. Sengaja masukkan email duplikat ke tabel `users` dan baca error yang muncul.

::: tip 💡 Tips
Simpan semua perintah setup di file `setup.sql`. Saat latihan rusak, Anda cukup menjalankan ulang file itu daripada mengingat satu per satu.
:::
