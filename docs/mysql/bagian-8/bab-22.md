---
title: "Bab 22 — Sekilas PostgreSQL & Pilihan Database Lain"
---

# 🐘 Bab 22 — Sekilas PostgreSQL & Pilihan Database Lain

> 🎯 **Tujuan Bab:** mengetahui posisi MySQL dibanding PostgreSQL dan database lain, serta mampu memilih berdasarkan kebutuhan — bukan tren.

## 22.1 ⚖️ MySQL vs PostgreSQL

| Aspek | MySQL | PostgreSQL |
|---|---|---|
| **Reputasi** | Sederhana, sangat luas dipakai, banyak hosting mendukung | Kaya fitur, ketat terhadap standar SQL |
| **Tipe data** | Cukup lengkap | Lebih kaya (array, range, `JSONB`, tipe kustom) |
| **JSON** | Tipe `JSON` | `JSON` dan `JSONB` (lebih fleksibel untuk index) |
| **Ekstensi** | Terbatas | Ekosistem ekstensi luas (misalnya PostGIS) |
| **Fitur query lanjutan** | Window function, CTE (sejak 8.0) | Sangat lengkap sejak lama |
| **Cocok untuk** | Aplikasi web umum, CMS, e-commerce | Analitik kompleks, data geospasial, tipe data khusus |

> ⚠️ **Catatan:** kedua database sangat matang dan mampu menangani sebagian besar aplikasi. Perbedaan di tabel bersifat **kecenderungan umum**, bukan aturan mutlak, dan terus berubah seiring versi.

## 22.2 🔄 Perbedaan Sintaks yang Sering Membingungkan

| Kebutuhan | MySQL | PostgreSQL |
|---|---|---|
| ID otomatis | `AUTO_INCREMENT` | `GENERATED ALWAYS AS IDENTITY` / `SERIAL` |
| Identifier | `` `nama` `` | `"nama"` |
| Batas baris | `LIMIT 10` | `LIMIT 10` |
| Upsert | `ON DUPLICATE KEY UPDATE` | `ON CONFLICT ... DO UPDATE` |
| Boolean | `TINYINT(1)` | `BOOLEAN` |
| Waktu sekarang | `NOW()` | `NOW()` |
| String concat | `CONCAT(a,b)` | `a || b` |
| JSON ambil teks | `->>` | `->>` |

Contoh upsert PostgreSQL:

```sql
INSERT INTO users (email, nama)
VALUES ('budi@mail.com', 'Budi')
ON CONFLICT (email)
DO UPDATE SET nama = EXCLUDED.nama;
```

## 22.3 📦 Apa yang Mudah Dibawa?

**Mudah dibawa:**

- SQL standar: `SELECT`, `JOIN`, `GROUP BY`, transaksi;
- desain skema yang ternormalisasi;
- migration yang dikelola ORM.

**Sulit dibawa:**

- fitur spesifik vendor (JSONB, enum, tipe khusus);
- stored procedure dan trigger kompleks;
- tuning index dan query hint;
- konfigurasi replikasi.

ORM dan migration membantu portabilitas, tetapi tidak menghilangkan perbedaan perilaku.

## 22.4 🧩 Database Lain yang Perlu Diketahui

| Database | Kapan Dipertimbangkan |
|---|---|
| **MariaDB** | Fork MySQL, kompatibel tinggi, alternatif hosting |
| **SQLite** | Prototipe, aplikasi desktop/mobile, tanpa server |
| **Redis** | Cache, session, rate limiting, antrean |
| **MongoDB** | Dokumen fleksibel, skema dinamis |
| **Elasticsearch** | Pencarian teks dan analitik log |
| **PostgreSQL** | Fitur kaya, analitik, geospasial |

## 22.5 🧠 Kerangka Memilih Database

Jawab pertanyaan berikut secara berurutan:

1. **Bentuk data** — tabel relasional, dokumen, key-value, graf?
2. **Konsistensi** — butuh ACID ketat atau eventual consistency cukup?
3. **Pola akses** — banyak baca, banyak tulis, laporan analitik?
4. **Skala** — vertikal cukup atau butuh horizontal?
5. **Tim** — keahlian dan ekosistem yang sudah dikuasai?
6. **Operasional** — siapa yang merawat, bagaimana backup dan monitoring?

Sering kali jawabannya bukan satu database, melainkan kombinasi:

```
MySQL (data utama) + Redis (cache/session) + Elasticsearch (pencarian)
```

## 22.6 🎬 Studi Kasus: Memilih untuk Toko Online

| Kebutuhan | Pilihan |
|---|---|
| User, produk, order, pembayaran | MySQL |
| Session login & cache katalog | Redis |
| Pencarian produk | MySQL full-text untuk awal, Elasticsearch saat skala besar |
| Laporan omzet berat | Read replica MySQL |

Mulai sederhana. Tambahkan komponen hanya ketika ada masalah nyata yang terukur.

## 📌 Ringkasan

- MySQL dan PostgreSQL sama-sama matang; pilih berdasarkan kebutuhan.
- Perbedaan sintaks utama ada pada ID otomatis, identifier, dan upsert.
- SQL standar dan desain yang baik membuat migrasi lebih mudah.
- Banyak sistem sukses memakai lebih dari satu jenis database.
- Pilihan database adalah keputusan arsitektur, bukan preferensi pribadi.

## 🧪 Latihan

1. Sebutkan tiga perbedaan utama MySQL dan PostgreSQL.
2. Tulis versi PostgreSQL dari upsert MySQL.
3. Kapan SQLite lebih tepat daripada MySQL?
4. Rancang kombinasi database untuk aplikasi berita dengan pencarian.
5. Buat kerangka keputusan untuk memilih database pada project berikutnya.

::: tip 💡 Tips
Jangan memilih database karena "katanya lebih cepat". Pilih berdasarkan pola data, konsistensi, dan kemampuan tim merawatnya.
:::
