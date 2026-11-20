---
title: "Bab 1 — Mengenal PostgreSQL"
---

# 📘 Bab 1 — Mengenal PostgreSQL

> 🎯 **Tujuan Bab:** memahami apa itu PostgreSQL, dari mana asalnya, dan kapan ia menjadi pilihan yang tepat.

## 1.1 🤔 Apa Itu PostgreSQL?

PostgreSQL adalah **database relasional open source** yang dikembangkan oleh komunitas global, bukan oleh satu perusahaan. Ia menyimpan data dalam tabel, mendukung transaksi ACID, dan berbicara dalam SQL standar.

Yang membuatnya istimewa: PostgreSQL adalah **object-relational database**. Artinya, di atas model relasional klasik, ia menambahkan fitur seperti:

- tipe data kustom (composite, domain, enum);
- array dan range;
- JSONB;
- extension yang bisa menambah kemampuan baru.

PostgreSQL sering disingkat **Postgres**. Nama resminya tetap PostgreSQL.

## 1.2 🕰️ Sejarah Singkat

| Tahun | Peristiwa |
|---|---|
| 1986 | Proyek **POSTGRES** dimulai di UC Berkeley |
| 1994 | Dukungan SQL ditambahkan |
| 1996 | Nama berubah menjadi **PostgreSQL** |
| 2000-an | Fitur ACID, MVCC, dan ekosistem extension tumbuh |
| 2010-an | Popularitas meningkat pesat di startup dan enterprise |
| Sekarang | Rilis mayor setiap tahun, didukung komunitas global |

PostgreSQL tidak dimiliki oleh satu vendor. Ia dikelola oleh komunitas dan tersedia di bawah lisensi permisif, sehingga bebas dipakai, dimodifikasi, dan didistribusikan.

## 1.3 ⚖️ Posisi PostgreSQL

PostgreSQL berada di kategori database relasional modern, bersama MySQL, SQL Server, dan Oracle. Yang membedakannya:

| Aspek | PostgreSQL |
|---|---|
| **Standar SQL** | Kepatuhan tinggi |
| **Tipe data** | Sangat kaya |
| **Extension** | Ekosistem luas |
| **JSON** | `JSONB` dengan index GIN |
| **Transaksi** | MVCC matang |
| **Lisensi** | Open source permisif |

> 💡 PostgreSQL bukan "MySQL yang lebih baik". Keduanya punya kekuatan berbeda. PostgreSQL unggul ketika Anda membutuhkan tipe data kaya, query analitik, atau extension khusus.

## 1.4 ✅ Kapan PostgreSQL Cocok Dipilih?

Pilih PostgreSQL ketika:

- data berelasi kuat dan integritasnya penting;
- Anda butuh **JSONB** untuk atribut fleksibel;
- ada kebutuhan **analitik** dan laporan kompleks;
- Anda memerlukan **extension** seperti PostGIS atau pgvector;
- ingin memakai fitur SQL modern tanpa banyak kompromi;
- tim Anda nyaman dengan SQL standar.

Pilih database lain ketika:

- kebutuhan sangat sederhana dan hosting hanya mendukung MySQL;
- beban kerja utama adalah cache atau key-value (Redis);
- data benar-benar dokumen tanpa relasi (MongoDB);
- pencarian teks skala besar lebih tepat ditangani search engine.

## 1.5 🗂️ SQL vs NoSQL Secara Ringkas

| Aspek | SQL (PostgreSQL) | NoSQL (contoh) |
|---|---|---|
| Struktur | Tabel & relasi | Dokumen, key-value, graf |
| Skema | Ketat, terdefinisi | Fleksibel |
| Transaksi | ACID kuat | Bervariasi |
| Query | SQL | API spesifik |
| Cocok untuk | Data relasional & integritas | Data tidak terstruktur, skala tertentu |

Batasnya kini kabur. PostgreSQL dengan JSONB bisa menangani data semi-terstruktur, sementara beberapa database NoSQL menambahkan transaksi. Pilih berdasarkan **kebutuhan**, bukan label.

## 1.6 ☁️ Cara PostgreSQL Dipakai

| Cara | Contoh |
|---|---|
| **Self-hosted** | Install di server sendiri, Docker, VM |
| **Managed** | Amazon RDS, Google Cloud SQL, Azure Database |
| **Platform** | Supabase, Neon, Railway |
| **Lokal** | Docker untuk latihan |

Untuk belajar, Docker adalah cara paling cepat dan aman. Untuk production, managed service mengurangi beban operasional, tetapi tetap memerlukan pemahaman backup, index, dan keamanan.

## 1.7 🔢 Siklus Rilis & Versi

PostgreSQL merilis **satu versi mayor per tahun**. Setiap versi mayor didukung sekitar **lima tahun**.

| Versi | Catatan |
|---|---|
| 13 | Masih didukung pada awal siklus |
| 14 | Fitur performa dan JSONB |
| 15 | `MERGE`, perbaikan privilege `public` |
| 16 | Peningkatan paralelisme dan logical replication |
| 17+ | Rilis lebih baru |

Selalu pakai versi yang masih didukung. Fitur di ebook ini mengacu pada **PostgreSQL 16+**, dengan catatan versi bila berbeda.

## 1.8 🧠 Mental Model yang Benar

Bayangkan PostgreSQL sebagai:

```
Aplikasi  →  Driver  →  Server PostgreSQL
                          ├── Database
                          │    ├── Schema
                          │    │    ├── Tabel
                          │    │    ├── Index
                          │    │    └── View
                          │    └── ...
                          └── Role (user & grup)
```

Satu server PostgreSQL disebut **cluster**. Di dalamnya ada banyak database. Di dalam database ada schema. Di dalam schema ada tabel, index, view, dan objek lain.

## 📌 Ringkasan

- PostgreSQL adalah database relasional open source yang dikembangkan komunitas.
- Ia object-relational: mendukung tipe data kustom, array, range, dan JSONB.
- Cocok untuk data berelasi, analitik, JSON, dan kebutuhan extension.
- Rilis mayor setiap tahun dengan dukungan sekitar lima tahun.
- Gunakan PostgreSQL 16+ untuk mengikuti materi ebook ini.

## 🧪 Latihan

1. Sebutkan tiga fitur yang membedakan PostgreSQL dari database relasional biasa.
2. Jelaskan kapan Anda memilih PostgreSQL dan kapan memilih MySQL.
3. Sebutkan dua cara menjalankan PostgreSQL tanpa instalasi manual.
4. Mengapa memakai versi yang masih didukung itu penting?
5. Gambarkan hubungan cluster, database, schema, dan tabel.

::: tip 💡 Tips
Jangan memilih database hanya karena tren. Tuliskan tiga kebutuhan utama aplikasi Anda, lalu cocokkan dengan kekuatan masing-masing database.
:::
