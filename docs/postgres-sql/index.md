---
layout: home

hero:
  name: "Ebook Database PostgreSQL"
  text: "Dari Nol Sampai Siap Dipakai di Project Nyata"
  tagline: "SQL modern, JSONB, extension, MVCC, performa, dan keamanan — dipahami langsung, bukan hanya lewat ORM."
  actions:
    - theme: brand
      text: "🐘 Mulai Belajar"
      link: /bagian-1/bab-1
    - theme: alt
      text: "📚 Lihat Daftar Bab"
      link: /bagian-1/index
    - theme: alt
      text: "🗺️ Peta Perjalanan"
      link: /bagian-9/index

features:
  - icon: 🐘
    title: PostgreSQL 16+
    details: "Fokus pada PostgreSQL 16 ke atas: SQL standar, JSONB, array, range, extension, dan fitur yang benar-benar dipakai di production."
  - icon: 🧠
    title: Paham di Balik ORM
    details: "Tahu query yang dijalankan Prisma, Eloquent, atau Drizzle, kenapa lambat, dan cara memperbaikinya dengan EXPLAIN."
  - icon: 📐
    title: Desain Skema Sejak Awal
    details: "ERD, normalisasi, TIMESTAMPTZ, NUMERIC, snapshot harga, dan pola desain yang mencegah masalah mahal di kemudian hari."
  - icon: 🧩
    title: Fitur Khas PostgreSQL
    details: "JSONB dengan index GIN, full-text search, pg_trgm, array, enum, range, dan extension yang membedakan PostgreSQL."
  - icon: 🔒
    title: Konsistensi & Keamanan
    details: "Transaksi, MVCC, locking, VACUUM, role, RLS, prepared statement, backup, dan uji restore."
  - icon: 🏆
    title: Project Toko Online
    details: "Bangun database toko online lengkap: skema, seed data, laporan, JSONB, pencarian, transaksi checkout, dan backup."
---

## 🎯 Untuk Siapa Ebook Ini?

Ebook ini untuk pemula yang ingin belajar database relasional dari awal dengan PostgreSQL, developer yang sudah mengenal MySQL dan ingin tahu apa yang berbeda, serta developer aplikasi yang selama ini hanya memakai ORM.

Tidak perlu pengalaman database sebelumnya. Jika Anda sudah pernah memakai MySQL, ada jembatan cepat di awal dan bab khusus migrasi di akhir.

## 🤔 Mengapa PostgreSQL?

```
POSTGRESQL DIKENAL KARENA:
✅ Kepatuhan tinggi pada standar SQL
✅ Tipe data sangat kaya (JSONB, array, range, uuid, enum, tipe kustom)
✅ Ekosistem extension (PostGIS, pgvector, pg_trgm, pg_stat_statements)
✅ Fitur query matang (CTE, window function, LATERAL, DISTINCT ON, upsert)
✅ Model transaksi MVCC yang kuat
✅ Open source dengan lisensi permisif
```

> 💡 **Analogi:** jika MySQL adalah mobil keluarga yang praktis dan ada di mana-mana, PostgreSQL adalah mobil dengan bagasi dan fitur lebih lengkap. Untuk kebanyakan kebutuhan keduanya cukup; PostgreSQL unggul ketika Anda butuh fitur data yang lebih kaya.

## 🔄 Jembatan Cepat: MySQL vs PostgreSQL

| Hal | MySQL | PostgreSQL |
|---|---|---|
| Auto-increment | `AUTO_INCREMENT` | `GENERATED ... AS IDENTITY` |
| Kutip identifier | `` `nama` `` | `"nama"` |
| Perbandingan teks | Umumnya tidak sensitif huruf | Sensitif huruf; pakai `ILIKE` |
| Boolean | `TINYINT(1)` | `BOOLEAN` |
| Mengembalikan hasil INSERT | Tidak ada | `RETURNING` |
| Upsert | `ON DUPLICATE KEY UPDATE` | `ON CONFLICT DO UPDATE` |
| Tampilkan tabel | `SHOW TABLES;` | `\dt` |
| JSON | `JSON` | `JSON` dan `JSONB` |

## 💡 Asumsi yang Dipakai

- **PostgreSQL 16+** (disarankan versi terbaru yang masih didukung)
- Beberapa fitur diberi catatan versi, misalnya `MERGE` sejak PostgreSQL 15
- Latihan memakai studi kasus **toko online** yang sama seperti ebook MySQL
- Konsep umum database dibahas ringkas; pendalaman ada di ebook MySQL

## 🧰 Tools yang Digunakan

| Tool | Fungsi |
|---|---|
| **PostgreSQL 16+** | Database utama |
| **psql** | Client command line bawaan |
| **DBeaver / pgAdmin / TablePlus** | Antarmuka grafis |
| **Docker** | Menjalankan PostgreSQL tanpa install manual |
| **pg_dump / pg_restore** | Backup & restore |
| **PgBouncer** | Connection pooler (pengenalan) |
| **Node.js (`pg`) / PHP (PDO)** | Contoh koneksi dari aplikasi |

## 🗺️ Peta Perjalanan Belajar

```
🚀 BAGIAN I     Fondasi & Setup                              → Bab 1  – 3
📜 BAGIAN II    SQL Dasar di PostgreSQL                      → Bab 4  – 6
🔗 BAGIAN III   Relasi & Query Lanjutan                      → Bab 7  – 10
📐 BAGIAN IV    Desain Database                              → Bab 11 – 12
🧩 BAGIAN V     Fitur Khas PostgreSQL                        → Bab 13 – 16
⚡ BAGIAN VI    Index, Performa & Transaksi                  → Bab 17 – 19
⚙️ BAGIAN VII   Pemrograman di Database & Skala              → Bab 20 – 21
🛡️ BAGIAN VIII  Administrasi & Keamanan                      → Bab 22 – 23
🏆 BAGIAN IX    Integrasi, Migrasi & Project                 → Bab 24 – 26
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 9 Bagian | 26 Bab
```

## ⭐ Bab Paling Kritis

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 8 — JOIN** | Inti database relasional |
| 🥈 | **Bab 13 — JSONB** | Alasan paling umum orang memilih PostgreSQL |
| 🥉 | **Bab 17 — Index** | Jenis index banyak; memilih yang tepat menentukan performa |
| 🏅 | **Bab 19 — Transaksi, MVCC & VACUUM** | Cara PostgreSQL menjaga konsistensi dan membersihkan dirinya |

## 🚀 Jalur Cepat

| Tujuan | Bab yang Dibaca |
|---|---|
| **Cukup untuk memakai database** | 1 → 2 → 3 → 4 → 5 → 6 |
| **Membangun fitur aplikasi** | Jalur dasar + 7 → 8 → 9 → 19 |
| **Memperbaiki performa** | 17 → 18 → 10 |
| **Merancang database baru** | 3 → 11 → 12 → 17 |
| **Siap produksi** | 19 → 22 → 23 → 24 |
| **Dari MySQL** | 1 → 5 → 6 → 25 → 13 |
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

Di bab akhir, database ini dilengkapi seed data, laporan dengan CTE dan window function, atribut JSONB ber-index GIN, pencarian full-text, transaksi checkout, materialized view, role, dan backup.

## 📎 Setelah Selesai

Sudah menyelesaikan semua bab? Lanjutkan ke [Referensi](/referensi) untuk sumber belajar lanjutan, atau baca [Penutup](/penutup) untuk rangkuman perjalanan dan langkah berikutnya.

::: tip 💡 Cara Membaca Ebook Ini
- Mulai dari **Bab 1** jika baru pertama kali menyentuh database
- Gunakan **jalur cepat** jika sudah punya tujuan spesifik
- Ketik ulang contoh SQL, jangan hanya dibaca
- Setiap bab punya bagian **Latihan**; kerjakan sebelum lanjut
- Prasyarat: tidak ada. Cukup rasa ingin tahu dan terminal.
:::

::: warning ⚠️ Catatan Versi
Semua contoh di ebook ini diuji pada **PostgreSQL 16+**. Jika memakai versi lebih lama, fitur seperti `MERGE`, `JSONB` tertentu, atau perilaku privilege `public` bisa berbeda. Untuk produksi, gunakan versi yang masih didukung.
:::
