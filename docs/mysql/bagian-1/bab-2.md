---
title: "Bab 2 — SQL vs NoSQL: Peta Besar Dunia Database"
---

# ⚖️ Bab 2 — SQL vs NoSQL: Peta Besar Dunia Database ⭐

> 🎯 **Tujuan Bab:** memberi wawasan agar Anda tahu di mana posisi MySQL dan kapan sebaiknya memilih jenis database lain. Bab ini bukan ajakan meninggalkan SQL.

## 2.1 ⚖️ Perbandingan Dasar

| Aspek | SQL (Relasional) | NoSQL |
|---|---|---|
| **Struktur data** | Tabel, baris, kolom (skema tetap) | Beragam: dokumen, key-value, graf, dsb. |
| **Skema** | Didefinisikan di awal, ketat | Fleksibel / dinamis |
| **Bahasa query** | SQL (standar) | Bervariasi per produk |
| **Relasi** | Kuat (JOIN, foreign key) | Umumnya lemah / ditangani aplikasi |
| **Konsistensi** | Kuat (ACID) | Bervariasi; sebagian memilih konsistensi akhir |
| **Skala** | Vertikal lebih mudah; horizontal lebih rumit | Banyak yang dirancang untuk horizontal (sharding) |
| **Cocok untuk** | Data terstruktur, transaksi, laporan | Data fleksibel, volume besar, kebutuhan khusus |

> ⚠️ **Catatan:** tabel di atas adalah **generalisasi**. Batasnya makin kabur: MySQL dan PostgreSQL punya tipe JSON, dan beberapa database NoSQL kini mendukung transaksi.

## 2.2 🧩 Jenis-jenis NoSQL & Contohnya

| Jenis | Cara Menyimpan | Contoh Produk | Contoh Kasus Pakai |
|---|---|---|---|
| **Document** | Dokumen mirip JSON | MongoDB, CouchDB | Katalog produk dengan atribut beragam, CMS |
| **Key-Value** | Pasangan kunci → nilai | Redis, Memcached | Cache, session login, rate limiting, antrean |
| **Wide-Column** | Kolom dikelompokkan per keluarga | Cassandra, HBase | Data time-series skala sangat besar, log |
| **Graph** | Node & relasi | Neo4j | Jejaring sosial, rekomendasi, deteksi fraud |
| **Search Engine** | Index teks terbalik | Elasticsearch, OpenSearch | Pencarian teks & analitik log |
| **Time-Series** | Data berurutan waktu | InfluxDB, TimescaleDB | Monitoring, sensor IoT |

Penting: **NoSQL bukan satu teknologi**, melainkan payung untuk beberapa model data yang berbeda. Mempelajari "NoSQL" tanpa menyebut jenisnya sama kaburnya dengan menyebut "SQL" untuk semua database relasional.

## 2.3 🔄 Contoh: Data yang Sama di Dua Dunia

SQL memecah data ke beberapa tabel:

```
users:  | id | nama |
orders: | id | user_id | total |

Ambil pesanan user: JOIN users dan orders
```

NoSQL dokumen menyimpan data bersarang:

```json
{
  "_id": 1,
  "nama": "Budi",
  "orders": [
    { "id": 10, "total": 150000 },
    { "id": 11, "total": 90000 }
  ]
}
```

```
Ambil pesanan user: baca satu dokumen
```

Keduanya benar. Perbedaannya adalah **bentuk pertanyaan yang paling sering diajukan**. Jika Anda sering butuh laporan lintas entitas, model relasional lebih nyaman. Jika data selalu dibaca sebagai satu dokumen utuh, model dokumen bisa lebih sederhana.

## 2.4 🧠 ACID vs BASE & Teorema CAP

| Konsep | Ringkasan |
|---|---|
| **ACID** | *Atomicity, Consistency, Isolation, Durability* — jaminan transaksi (dibahas detail di Bab 16) |
| **BASE** | *Basically Available, Soft state, Eventual consistency* — pendekatan banyak sistem terdistribusi |
| **CAP** | Pada sistem terdistribusi yang mengalami partisi jaringan, harus memilih antara konsistensi dan ketersediaan |

ACID bukan berarti "lebih baik" secara mutlak. Ia adalah pilihan desain yang sangat cocok untuk uang, stok, dan pesanan, tetapi bisa menjadi beban untuk data yang cukup *eventually consistent*.

## 2.5 ✅ Kapan Memilih yang Mana?

| Kebutuhan | Pilihan Wajar |
|---|---|
| Transaksi keuangan, stok, pesanan | **SQL** |
| Data berelasi kuat, banyak laporan | **SQL** |
| Cache, session, penghitung real-time | **Key-Value (Redis)** |
| Atribut data sangat beragam antar item | **Document** (atau kolom JSON di SQL) |
| Pencarian teks penuh skala besar | **Search engine** |
| Relasi berlapis (jaringan pertemanan) | **Graph** |

> 💡 **Polyglot Persistence:** project nyata sering **memakai beberapa database sekaligus**. Contoh: MySQL untuk data utama, Redis untuk cache dan session, Elasticsearch untuk pencarian.

## 2.6 🧠 Mitos yang Sering Beredar

| Mitos | Kenyataannya |
|---|---|
| "NoSQL lebih cepat dari SQL" | Tergantung pola akses. SQL dengan index yang tepat bisa sangat cepat. |
| "SQL tidak bisa diskalakan" | Bisa, lewat read replica, sharding, dan arsitektur aplikasi yang baik. |
| "NoSQL tidak punya skema" | Skema tetap ada, hanya berpindah ke aplikasi dan lebih longgar. |
| "SQL hanya untuk data kecil" | Banyak sistem besar memakai MySQL/PostgreSQL sebagai inti. |

## 2.7 🗺️ Peta Ringan Keluarga SQL

| Database | Karakter Singkat |
|---|---|
| **MySQL** | Populer di web, ekosistem luas, mudah dipakai |
| **MariaDB** | Fork MySQL, kompatibel cukup tinggi |
| **PostgreSQL** | Kaya fitur, ketat standar, ekstensi kuat |
| **SQLite** | Database file, tanpa server, cocok untuk prototipe |
| **SQL Server** | Ekosistem Microsoft |
| **Oracle** | Enterprise, fitur besar, biaya besar |

Untuk kebanyakan aplikasi bisnis, **SQL adalah titik awal yang aman**. Pindah ke database lain lebih mudah jika data sudah terstruktur dan query dipisahkan dari kode presentasi.

## 📌 Ringkasan

- SQL dan NoSQL adalah pilihan desain, bukan pertandingan.
- Pahami bentuk data dan pola akses sebelum memilih.
- ACID penting untuk transaksi; BASE cocok untuk sistem terdistribusi tertentu.
- Banyak aplikasi nyata memakai lebih dari satu database.
- MySQL adalah titik awal yang kuat untuk data transaksional dan relasional.

## 🧪 Latihan

1. Untuk aplikasi kasir toko, database jenis apa yang paling tepat? Jelaskan alasannya.
2. Kapan Redis lebih masuk akal daripada tabel MySQL?
3. Berikan contoh data yang lebih nyaman disimpan sebagai dokumen JSON.
4. Jelaskan mengapa "NoSQL lebih cepat" tidak selalu benar.
5. Rancang kombinasi database untuk aplikasi e-commerce: data utama, cache, dan pencarian.

::: tip 💡 Tips
Jangan memilih teknologi karena tren. Mulai dari pertanyaan: data seperti apa, siapa yang menulis, siapa yang membaca, dan konsistensi seperti apa yang dibutuhkan. Jawaban itu biasanya menunjukkan pilihan yang tepat.
:::
