---
layout: home

hero:
  name: "Ebook Database MySQL"
  text: "Dari Nol Sampai Siap Dipakai di Project Nyata"
  tagline: "Pahami database langsung, bukan hanya lewat ORM — SQL, desain skema, index, transaksi, keamanan, sampai project toko online."
  actions:
    - theme: brand
      text: "🐬 Mulai Belajar"
      link: /bagian-1/bab-1
    - theme: alt
      text: "📚 Lihat Daftar Bab"
      link: /bagian-1/index
    - theme: alt
      text: "🗺️ Peta Perjalanan"
      link: /bagian-9/index

features:
  - icon: 🐬
    title: MySQL 8.x & InnoDB
    details: "Fokus pada MySQL 8.0/8.4 LTS dengan engine InnoDB — transaksi, foreign key, CTE, window function, dan fitur modern yang benar-benar dipakai."
  - icon: 🧠
    title: Paham di Balik ORM
    details: "Tahu query apa yang sebenarnya dijalankan Eloquent atau Prisma, kenapa lambat, dan cara memperbaikinya tanpa menebak-nebak."
  - icon: 📐
    title: Desain Skema Sejak Awal
    details: "ERD, normalisasi, snapshot harga, dan pola desain yang mencegah masalah mahal sebelum aplikasi tumbuh besar."
  - icon: ⚡
    title: Performa yang Bisa Dibuktikan
    details: "Index, EXPLAIN, slow query log, dan optimasi pagination — diukur sebelum dan sesudah, bukan sekadar teori."
  - icon: 🔐
    title: Aman & Bisa Dipulihkan
    details: "Least privilege, prepared statement, backup rutin, dan uji restore. Data yang tidak bisa dipulihkan sama saja dengan data yang hilang."
  - icon: 🏆
    title: Project Toko Online
    details: "Bangun database toko online lengkap: skema, seed data, query laporan, transaksi checkout, view, trigger audit, dan backup."
---

## 🎯 Untuk Siapa Ebook Ini?

Ebook ini untuk pemula yang ingin memahami database dari dasar, sekaligus developer yang selama ini hanya memakai ORM dan ingin benar-benar mengerti apa yang terjadi di balik layar. Tidak perlu pengalaman database sebelumnya.

Kalau Anda pernah merasa:

- query terasa lambat tetapi tidak tahu penyebabnya,
- takut mengubah skema karena takut merusak data,
- bingung membedakan `INNER JOIN` dan `LEFT JOIN`,
- atau sekadar mengikuti tutorial tanpa paham SQL yang dihasilkan ORM,

maka ebook ini disusun untuk Anda.

## 🤔 Mengapa Belajar Database Secara Langsung?

```
TANPA PAHAM DATABASE (hanya pakai ORM):
User.where('status', 'active').with('orders').get()
→ Terasa mudah, sampai aplikasi lambat dan Anda tidak tahu penyebabnya
→ Query N+1, tidak ada index, transaksi salah, data tidak konsisten

DENGAN PAHAM DATABASE:
→ Tahu query apa yang sebenarnya dijalankan
→ Tahu kenapa query lambat dan cara memperbaikinya
→ Mendesain skema yang benar sejak awal (sulit diperbaiki belakangan!)
→ Mengamankan data dari kesalahan dan serangan
```

> 💡 **Analogi:** database adalah fondasi rumah. Tampilan (frontend) bisa diganti kapan saja, tetapi fondasi yang salah sulit diperbaiki setelah rumah berdiri. Skema database yang buruk akan terus menghantui project bertahun-tahun.

## 💡 Asumsi yang Dipakai

- **MySQL 8.x** (8.0 atau 8.4 LTS) dengan engine **InnoDB**
- Latihan memakai studi kasus **toko online** yang konsisten di semua bab
- Fokus utama **MySQL**; NoSQL dibahas sebagai wawasan umum, PostgreSQL sebagai perbandingan singkat
- Jika versi MySQL Anda berbeda, beberapa fitur (CTE, window function, `CHECK`) mungkin tidak tersedia pada versi lama (5.7 ke bawah)

## 🧰 Tools yang Digunakan

| Tool | Fungsi |
|---|---|
| **MySQL 8.x** | Database utama |
| **MySQL CLI (`mysql`)** | Latihan perintah SQL langsung |
| **DBeaver / TablePlus / MySQL Workbench** | Antarmuka grafis |
| **Docker** | Menjalankan MySQL tanpa install manual |
| **mysqldump** | Backup & restore |
| **PHP (PDO) / Node.js (`mysql2`)** | Contoh koneksi dari aplikasi |

## 🗺️ Peta Perjalanan Belajar

```
🚀 BAGIAN I     Fondasi: Database, SQL vs NoSQL & Setup      → Bab 1  – 4
📜 BAGIAN II    SQL Dasar                                    → Bab 5  – 7
🔗 BAGIAN III   Relasi & Query Lanjutan                      → Bab 8  – 11
📐 BAGIAN IV    Desain Database                              → Bab 12 – 13
⚡ BAGIAN V     Index, Performa & Transaksi                  → Bab 14 – 16
🧰 BAGIAN VI    Fitur Lanjutan MySQL                         → Bab 17 – 18
🛡️ BAGIAN VII   Administrasi & Keamanan                      → Bab 19 – 20
🌐 BAGIAN VIII  Integrasi Aplikasi & Sekilas PostgreSQL      → Bab 21 – 22
🏆 BAGIAN IX    Project: Database Toko Online                → Bab 23
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 9 Bagian | 23 Bab
```

## ⭐ Bab Paling Kritis

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 9 — JOIN** | Inti dari database relasional: menggabungkan data antar tabel |
| 🥈 | **Bab 12 — Normalisasi & Desain Skema** | Kesalahan desain paling mahal untuk diperbaiki |
| 🥉 | **Bab 14 — Index** | Penyebab utama query lambat |
| 🏅 | **Bab 16 — Transaksi & ACID** | Menjaga data tetap konsisten (uang, stok, pesanan) |

## 🚀 Jalur Cepat

Tidak harus membaca semua bab dulu. Sesuaikan dengan kebutuhan Anda.

| Tujuan | Bab yang Dibaca |
|---|---|
| **Cukup untuk memakai database** | 1 → 3 → 4 → 5 → 6 → 7 |
| **Membangun fitur aplikasi** | Jalur dasar + 8 → 9 → 10 → 16 |
| **Memperbaiki performa** | 14 → 15 → 11 |
| **Merancang database baru** | 3 → 12 → 13 → 14 |
| **Siap produksi** | 16 → 19 → 20 → 21 |
| **Paham menyeluruh** | Semua bab berurutan |

## 📦 Yang Akan Anda Bangun

Sepanjang ebook, Anda akan membangun database **toko online** yang konsisten:

```
users ──< orders ──< order_items >── products >── categories
  │                                  │
  ├──< carts                         ├──< reviews
  ├──< payments
  └──< addresses
```

Di bab akhir, database ini dilengkapi seed data, query laporan, index, transaksi checkout, view, trigger audit, dan skrip backup.

::: tip 💡 Cara Membaca Ebook Ini
- Mulai dari **Bab 1** jika baru pertama kali menyentuh database
- Gunakan **jalur cepat** di atas jika sudah punya tujuan spesifik
- Ketik ulang contoh SQL, jangan hanya dibaca — otot SQL terbentuk dari latihan
- Setiap bab punya bagian **Latihan**; kerjakan sebelum lanjut
- Prasyarat: tidak ada. Cukup rasa ingin tahu dan terminal.
:::

::: warning ⚠️ Catatan Versi
Semua contoh di ebook ini diuji pada **MySQL 8.x**. Jika memakai MySQL 5.7, fitur seperti CTE, window function, `CHECK`, dan role mungkin tidak tersedia. Untuk produksi, gunakan versi yang masih didukung.
:::

## 📎 Setelah Selesai

Sudah menyelesaikan semua bab? Lanjutkan ke [Referensi](/referensi) untuk sumber belajar lanjutan, atau baca [Penutup](/penutup) untuk rangkuman perjalanan dan langkah berikutnya.
