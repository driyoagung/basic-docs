# 🐬 Ebook Database MySQL — Dari Nol Sampai Siap Dipakai di Project Nyata
### Memahami Database, SQL vs NoSQL, Query, Desain Skema, Performa, dan Keamanan

---

> 🎯 **Untuk Siapa Ebook Ini?**
> Pemula yang ingin memahami database dari dasar, sekaligus developer
> (Laravel, Node.js, PHP, dsb.) yang selama ini hanya memakai ORM dan ingin
> benar-benar mengerti apa yang terjadi di balik layar. Tidak perlu pengalaman
> database sebelumnya.

---

> 💡 **Asumsi yang Dipakai di Struktur Ini**
> - **MySQL 8.x** (8.0 atau 8.4 LTS) dengan engine **InnoDB**
> - Latihan memakai studi kasus **toko online** yang konsisten di semua bab
> - Fokus utama **MySQL**; NoSQL dibahas sebagai wawasan umum, PostgreSQL sebagai perbandingan singkat
> - Jika versi MySQL Anda berbeda, beberapa fitur (CTE, window function, `CHECK`) mungkin tidak tersedia pada versi lama (5.7 ke bawah)

---

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

> 💡 **Analogi:**
> Database adalah **fondasi rumah**. Tampilan (frontend) bisa diganti kapan saja,
> tetapi fondasi yang salah sulit diperbaiki setelah rumah berdiri. Skema
> database yang buruk akan terus menghantui project bertahun-tahun.

---

## 🧰 Tools yang Digunakan

| Tool | Fungsi |
|---|---|
| **MySQL 8.x** | Database utama |
| **MySQL CLI (`mysql`)** | Latihan perintah SQL langsung |
| **DBeaver / TablePlus / MySQL Workbench** | Antarmuka grafis |
| **Docker** | Menjalankan MySQL tanpa install manual |
| **mysqldump** | Backup & restore |
| **Bahasa pemrograman** | Contoh koneksi dari PHP/Node.js |

---

## 🗺️ Peta Perjalanan Belajar

```
🟢 BAGIAN I    Fondasi: Database, SQL vs NoSQL & Setup      → Bab 1  – 4
🔵 BAGIAN II   SQL Dasar                                    → Bab 5  – 7
🟡 BAGIAN III  Relasi & Query Lanjutan                      → Bab 8  – 11
🟠 BAGIAN IV   Desain Database                              → Bab 12 – 13
🔴 BAGIAN V    Index, Performa & Transaksi                  → Bab 14 – 16
🟣 BAGIAN VI   Fitur Lanjutan MySQL                         → Bab 17 – 18
⚫ BAGIAN VII  Administrasi & Keamanan                      → Bab 19 – 20
🌐 BAGIAN VIII Integrasi Aplikasi & Sekilas PostgreSQL      → Bab 21 – 22
🏆 BAGIAN IX   Project: Database Toko Online                → Bab 23
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 9 Bagian | 23 Bab
```

---

## ⭐ Bab Paling Kritis

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 9** — JOIN | Inti dari database relasional: menggabungkan data antar tabel |
| 🥈 | **Bab 12** — Normalisasi & Desain Skema | Kesalahan desain paling mahal untuk diperbaiki |
| 🥉 | **Bab 14** — Index | Penyebab utama query lambat |
| 🏅 | **Bab 16** — Transaksi & ACID | Menjaga data tetap konsisten (uang, stok, pesanan) |

---

---

# 🟢 BAGIAN I — Fondasi: Database, SQL vs NoSQL & Setup

> 🎯 **Tujuan:** Memahami apa itu database, mengenal jenis-jenisnya
> (termasuk SQL vs NoSQL), lalu menyiapkan MySQL.

---

## 📖 Bab 1 — Mengenal Database & DBMS

- 1.1 🤔 Apa itu data, database, dan DBMS (*Database Management System*)
- 1.2 🗂️ Mengapa tidak cukup memakai file teks / spreadsheet?
- 1.3 🏗️ Arsitektur client–server: aplikasi, server database, dan koneksi
- 1.4 🔤 Apa itu SQL: bahasa untuk "berbicara" dengan database relasional
- 1.5 🧱 Istilah dasar: database, tabel, baris (row), kolom (column), skema
- 1.6 🕰️ Sejarah singkat: dari model relasional (E. F. Codd) sampai database modern

```
SERVER DATABASE (MySQL)
└── Database: toko
    ├── Tabel: users        ← kumpulan baris & kolom
    │   ├── id | nama   | email
    │   ├── 1  | Budi   | budi@mail.com
    │   └── 2  | Ani    | ani@mail.com
    ├── Tabel: products
    └── Tabel: orders
```

---

## 📖 Bab 2 — SQL vs NoSQL: Peta Besar Dunia Database ⭐

> 🎯 Bab ini memberi wawasan umum agar pembaca tahu **di mana posisi MySQL**
> dan **kapan sebaiknya memilih jenis database lain**.

### 2.1 ⚖️ Perbandingan Dasar

| Aspek | SQL (Relasional) | NoSQL |
|---|---|---|
| **Struktur data** | Tabel, baris, kolom (skema tetap) | Beragam: dokumen, key-value, graf, dsb. |
| **Skema** | Didefinisikan di awal, ketat | Fleksibel / dinamis |
| **Bahasa query** | SQL (standar) | Bervariasi per produk |
| **Relasi** | Kuat (JOIN, foreign key) | Umumnya lemah / ditangani aplikasi |
| **Konsistensi** | Kuat (ACID) | Bervariasi; sebagian memilih konsistensi akhir |
| **Skala** | Terutama vertikal (server lebih besar), horizontal lebih rumit | Banyak yang dirancang untuk horizontal (sharding) |
| **Cocok untuk** | Data terstruktur, transaksi, laporan | Data fleksibel, volume besar, kebutuhan khusus |

> ⚠️ **Catatan:** tabel di atas adalah **generalisasi**. Batasnya makin kabur:
> MySQL dan PostgreSQL punya tipe JSON, dan beberapa database NoSQL kini
> mendukung transaksi.

### 2.2 🧩 Jenis-jenis NoSQL & Contohnya

| Jenis | Cara Menyimpan | Contoh Produk | Contoh Kasus Pakai |
|---|---|---|---|
| **Document** | Dokumen mirip JSON | MongoDB, CouchDB | Katalog produk dengan atribut beragam, CMS |
| **Key-Value** | Pasangan kunci → nilai | Redis, Memcached | Cache, session login, rate limiting, antrean |
| **Wide-Column** | Kolom dikelompokkan per keluarga | Cassandra, HBase | Data time-series skala sangat besar, log |
| **Graph** | Node & relasi | Neo4j | Jejaring sosial, rekomendasi, deteksi fraud |
| **Search Engine** | Index teks terbalik | Elasticsearch, OpenSearch | Pencarian teks & analitik log |
| **Time-Series** | Data berurutan waktu | InfluxDB, TimescaleDB | Monitoring, sensor IoT |

### 2.3 🔄 Contoh: Data yang Sama di Dua Dunia

```
SQL (MySQL) — data dipecah ke beberapa tabel:
users:  | id | nama |
orders: | id | user_id | total |
→ Ambil pesanan user: JOIN users dan orders

NoSQL Document (MongoDB) — data bersarang dalam satu dokumen:
{
  "_id": 1,
  "nama": "Budi",
  "orders": [
    { "id": 10, "total": 150000 },
    { "id": 11, "total": 90000 }
  ]
}
→ Ambil pesanan user: baca satu dokumen
```

### 2.4 🧠 ACID vs BASE & Teorema CAP (Pengenalan Ringan)

| Konsep | Ringkasan |
|---|---|
| **ACID** | *Atomicity, Consistency, Isolation, Durability*: jaminan transaksi (dibahas detail di Bab 16) |
| **BASE** | *Basically Available, Soft state, Eventual consistency*: pendekatan banyak sistem terdistribusi |
| **CAP** | Pada sistem terdistribusi yang mengalami partisi jaringan, harus memilih antara konsistensi dan ketersediaan |

### 2.5 ✅ Kapan Memilih yang Mana?

| Kebutuhan | Pilihan Wajar |
|---|---|
| Transaksi keuangan, stok, pesanan | **SQL** |
| Data berelasi kuat, banyak laporan | **SQL** |
| Cache, session, penghitung real-time | **Key-Value (Redis)** |
| Atribut data sangat beragam antar item | **Document** (atau kolom JSON di SQL) |
| Pencarian teks penuh skala besar | **Search engine** |
| Relasi berlapis (jaringan pertemanan) | **Graph** |

> 💡 **Polyglot Persistence:** project nyata sering **memakai beberapa
> database sekaligus**. Contoh: MySQL untuk data utama, Redis untuk cache dan
> session, Elasticsearch untuk pencarian.

### 2.6 Sub-topik

- 2.6.1 Mitos: "NoSQL lebih cepat dari SQL" (tergantung kasus penggunaan)
- 2.6.2 Mitos: "SQL tidak bisa diskalakan"
- 2.6.3 Mengapa untuk kebanyakan aplikasi bisnis, **SQL adalah titik awal yang aman**
- 2.6.4 Peta ringan keluarga SQL: MySQL, MariaDB, PostgreSQL, SQLite, SQL Server, Oracle

---

## 📖 Bab 3 — Konsep Database Relasional

- 3.1 Tabel, baris, kolom, dan tipe data
- 3.2 **Primary Key**: identitas unik tiap baris
- 3.3 **Foreign Key**: penghubung antar tabel
- 3.4 Jenis relasi: one-to-one, one-to-many, many-to-many (tabel pivot)
- 3.5 Apa itu skema (*schema*) dan mengapa penting
- 3.6 Gambaran ERD (*Entity Relationship Diagram*) sederhana

```
users (1) ────< orders (N) >──── order_items (N) >──── products (1)
   Satu user punya banyak order; satu order berisi banyak item;
   tiap item merujuk ke satu produk
```

---

## 📖 Bab 4 — Instalasi & Setup MySQL

### 4.1 🚀 Cara Instalasi

```bash
# Cara 1: Docker (disarankan untuk latihan, mudah dibuang & diulang)
docker run --name mysql-belajar \
  -e MYSQL_ROOT_PASSWORD=rahasia123 \
  -p 3306:3306 -d mysql:8

# Masuk ke MySQL CLI
docker exec -it mysql-belajar mysql -u root -p
```

- 4.2 Instalasi langsung: Windows (installer / Laragon / XAMPP), macOS (Homebrew / Herd), Linux (apt)
- 4.3 Memakai MySQL CLI: `mysql -u root -p`, perintah dasar (`SHOW DATABASES;`, `USE toko;`)
- 4.4 Memakai GUI (DBeaver / TablePlus / Workbench): koneksi pertama
- 4.5 Anatomi server MySQL: database sistem (`mysql`, `information_schema`, `performance_schema`, `sys`)
- 4.6 Charset & collation: mengapa **utf8mb4** wajib (emoji & karakter internasional)
- 4.7 Memuat dataset latihan (toko online) ke database
- 4.8 Cara membaca error MySQL (kode error & pesan)

---

---

# 🔵 BAGIAN II — SQL Dasar

---

## 📖 Bab 5 — DDL: Membuat Database & Tabel

### 5.1 🏗️ Membuat Database & Tabel

```sql
CREATE DATABASE toko
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE toko;

CREATE TABLE users (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  saldo      DECIMAL(12,2) NOT NULL DEFAULT 0,
  aktif      TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 📦 Tipe Data MySQL

| Kategori | Tipe | Catatan |
|---|---|---|
| **Bilangan bulat** | `TINYINT`, `INT`, `BIGINT` | Pilih ukuran sesuai kebutuhan |
| **Desimal** | `DECIMAL(p,s)` | ✅ Untuk uang (presisi tepat) |
| **Pecahan** | `FLOAT`, `DOUBLE` | ⚠️ Tidak presisi, jangan untuk uang |
| **Teks** | `CHAR`, `VARCHAR`, `TEXT` | `VARCHAR` untuk teks pendek |
| **Tanggal & waktu** | `DATE`, `DATETIME`, `TIMESTAMP` | Perbedaan zona waktu & rentang |
| **Boolean** | `TINYINT(1)` / `BOOLEAN` | MySQL menyimpan sebagai angka |
| **Pilihan terbatas** | `ENUM`, `SET` | Kelebihan & kekurangannya |
| **JSON** | `JSON` | Dibahas di Bab 18 |
| **Biner** | `BLOB` | Umumnya lebih baik simpan file di storage, bukan DB |

### 5.3 Sub-topik

- 5.3.1 `ALTER TABLE` (tambah, ubah, hapus kolom), `DROP`, `TRUNCATE`, `RENAME`
- 5.3.2 Mengapa uang **tidak boleh** memakai `FLOAT`
- 5.3.3 `DATETIME` vs `TIMESTAMP`
- 5.3.4 Konvensi penamaan tabel & kolom (snake_case, jamak/tunggal)
- 5.3.5 Melihat struktur tabel: `DESCRIBE`, `SHOW CREATE TABLE`

---

## 📖 Bab 6 — CRUD: INSERT, SELECT, UPDATE, DELETE

```sql
-- CREATE
INSERT INTO users (nama, email) VALUES ('Budi', 'budi@mail.com');

-- READ
SELECT id, nama, email FROM users WHERE aktif = 1;

-- UPDATE
UPDATE users SET saldo = saldo + 50000 WHERE id = 1;

-- DELETE
DELETE FROM users WHERE id = 1;
```

- 6.1 `INSERT` tunggal, banyak baris, dan `INSERT ... ON DUPLICATE KEY UPDATE`
- 6.2 `SELECT`: memilih kolom, alias (`AS`), `DISTINCT`
- 6.3 `UPDATE` dan `DELETE`
- 6.4 ⚠️ **Selalu pakai `WHERE`** pada UPDATE/DELETE (dan cara mengamankannya)
- 6.5 `REPLACE` vs `INSERT ... ON DUPLICATE KEY UPDATE`
- 6.6 Soft delete: pola kolom `deleted_at`
- 6.7 🎬 Studi kasus: mengisi data toko online (user, produk, order)

---

## 📖 Bab 7 — Filtering, Sorting & Fungsi

- 7.1 `WHERE` dengan operator: `=`, `<>`, `>`, `<`, `BETWEEN`, `IN`, `LIKE`
- 7.2 `AND`, `OR`, `NOT` dan prioritas operator (gunakan tanda kurung)
- 7.3 **NULL**: `IS NULL`, `IS NOT NULL`, dan jebakan `= NULL`
- 7.4 `ORDER BY`, `LIMIT`, `OFFSET` (dasar pagination)
- 7.5 Fungsi string: `CONCAT`, `UPPER`, `SUBSTRING`, `TRIM`, `REPLACE`
- 7.6 Fungsi angka: `ROUND`, `CEIL`, `FLOOR`, `ABS`
- 7.7 Fungsi tanggal: `NOW()`, `DATE_FORMAT`, `DATEDIFF`, `DATE_ADD`
- 7.8 Ekspresi kondisional: `CASE WHEN`, `IF`, `IFNULL`, `COALESCE`
- 7.9 Pola pencarian dengan `LIKE` dan keterbatasannya

---

---

# 🟡 BAGIAN III — Relasi & Query Lanjutan

---

## 📖 Bab 8 — Constraint & Relasi Antar Tabel

```sql
CREATE TABLE orders (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  total      DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  status     ENUM('pending','paid','shipped','done','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);
```

- 8.1 Constraint: `NOT NULL`, `UNIQUE`, `DEFAULT`, `CHECK`, `PRIMARY KEY`, `FOREIGN KEY`
- 8.2 Aksi referensial: `CASCADE`, `RESTRICT`, `SET NULL`, `NO ACTION`
- 8.3 Relasi one-to-many & many-to-many dengan tabel pivot
- 8.4 Primary key: auto-increment vs UUID (kelebihan, kekurangan, dampak ke index)
- 8.5 Composite key
- 8.6 Kapan memakai foreign key dan kapan sebagian tim menghindarinya

---

## 📖 Bab 9 — JOIN ⭐

### 9.1 🔗 Jenis JOIN

```sql
-- INNER JOIN: hanya baris yang cocok di kedua tabel
SELECT u.nama, o.id AS order_id, o.total
FROM users u
INNER JOIN orders o ON o.user_id = u.id;

-- LEFT JOIN: semua user, termasuk yang belum punya order
SELECT u.nama, COUNT(o.id) AS jumlah_order
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.nama;
```

| JOIN | Hasil |
|---|---|
| `INNER JOIN` | Hanya yang cocok di kedua tabel |
| `LEFT JOIN` | Semua dari tabel kiri + yang cocok di kanan (sisanya NULL) |
| `RIGHT JOIN` | Kebalikan LEFT JOIN |
| `CROSS JOIN` | Semua kombinasi (hati-hati ukuran hasil) |
| Self join | Tabel di-join dengan dirinya sendiri (hierarki, mis. kategori) |

### 9.2 Sub-topik

- 9.2.1 Visualisasi JOIN dengan diagram himpunan & data kecil
- 9.2.2 Join banyak tabel (`users → orders → order_items → products`)
- 9.2.3 Mencari data yang **tidak punya** pasangan (`LEFT JOIN ... WHERE ... IS NULL`)
- 9.2.4 Kesalahan umum: join menggandakan baris, kondisi di `ON` vs `WHERE`
- 9.2.5 🎬 Studi kasus: laporan pesanan lengkap beserta nama user & produk

---

## 📖 Bab 10 — Agregasi & Pengelompokan

```sql
SELECT status,
       COUNT(*)      AS jumlah,
       SUM(total)    AS omzet,
       AVG(total)    AS rata_rata
FROM orders
GROUP BY status
HAVING SUM(total) > 1000000
ORDER BY omzet DESC;
```

- 10.1 Fungsi agregat: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`
- 10.2 `GROUP BY` dan aturan kolom yang boleh di-`SELECT`
- 10.3 `WHERE` vs `HAVING`
- 10.4 `COUNT(*)` vs `COUNT(kolom)` vs `COUNT(DISTINCT kolom)`
- 10.5 `ROLLUP` untuk subtotal
- 10.6 🎬 Studi kasus: laporan penjualan harian, bulanan, dan per kategori

---

## 📖 Bab 11 — Subquery, CTE, Window Function & UNION

- 11.1 Subquery di `WHERE`, `FROM`, dan `SELECT`
- 11.2 `EXISTS` vs `IN`
- 11.3 **CTE** (`WITH`) untuk query yang lebih mudah dibaca (MySQL 8+)
- 11.4 CTE rekursif (struktur hierarki, mis. kategori bersarang)
- 11.5 **Window function**: `ROW_NUMBER`, `RANK`, `LAG`, `LEAD`, `SUM() OVER()`
- 11.6 `UNION` vs `UNION ALL`
- 11.7 🎬 Studi kasus: "3 produk terlaris per kategori" dan "pertumbuhan omzet dibanding bulan lalu"

```sql
-- Contoh window function: peringkat produk per kategori
SELECT *
FROM (
  SELECT p.nama, p.kategori_id,
         SUM(oi.jumlah) AS terjual,
         RANK() OVER (PARTITION BY p.kategori_id ORDER BY SUM(oi.jumlah) DESC) AS peringkat
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  GROUP BY p.id, p.nama, p.kategori_id
) t
WHERE peringkat <= 3;
```

---

---

# 🟠 BAGIAN IV — Desain Database

---

## 📖 Bab 12 — ERD & Normalisasi ⭐

### 12.1 📐 Dari Kebutuhan ke Skema

- 12.1.1 Mengidentifikasi entitas, atribut, dan relasi dari kebutuhan bisnis
- 12.1.2 Membaca & menggambar ERD (notasi Crow's Foot)
- 12.1.3 Kardinalitas & partisipasi (wajib / opsional)

### 12.2 🧹 Normalisasi

| Bentuk | Aturan Singkat | Masalah yang Dicegah |
|---|---|---|
| **1NF** | Tiap kolom satu nilai (tanpa list/kolom berulang) | Data "a,b,c" dalam satu kolom |
| **2NF** | Tidak ada ketergantungan parsial pada bagian dari composite key | Data berulang pada tabel relasi |
| **3NF** | Tidak ada ketergantungan transitif antar kolom non-key | Anomali update (mis. nama kota tersimpan di tiap baris) |

```
❌ SEBELUM NORMALISASI (satu tabel besar):
orders: id | nama_user | email_user | produk_1 | produk_2 | produk_3 | total
   → data user berulang, jumlah produk dibatasi 3, rawan tidak konsisten

✅ SETELAH NORMALISASI:
users, orders, order_items, products  → tiap fakta tersimpan di satu tempat
```

### 12.3 Sub-topik

- 12.3.1 Anomali insert, update, dan delete
- 12.3.2 **Denormalisasi** yang disengaja (kolom `total`, snapshot harga) dan alasannya
- 12.3.3 Menyimpan harga pada `order_items` sebagai snapshot (harga produk bisa berubah!)
- 12.3.4 Pola desain umum: status (enum vs tabel referensi), soft delete, audit log, timestamps
- 12.3.5 Kesalahan desain yang paling sering (kolom CSV, EAV berlebihan, tanpa foreign key)
- 12.3.6 Kapan satu kolom JSON masuk akal sebagai pengganti tabel

---

## 📖 Bab 13 — Studi Kasus Desain: Toko Online

- 13.1 Mengumpulkan kebutuhan (user, produk, kategori, keranjang, pesanan, pembayaran, ulasan)
- 13.2 Merancang ERD langkah demi langkah
- 13.3 Menerjemahkan ERD menjadi `CREATE TABLE`
- 13.4 Memilih tipe data, constraint, dan aksi foreign key yang tepat
- 13.5 Mengevaluasi desain: apakah bisa menjawab semua pertanyaan bisnis?
- 13.6 Mendesain untuk pertumbuhan (tabel besar, archive, partisi: pengenalan)

---

---

# 🔴 BAGIAN V — Index, Performa & Transaksi

---

## 📖 Bab 14 — Index ⭐

### 14.1 🔍 Apa itu Index?

> 💡 **Analogi:** index seperti **daftar isi di buku**. Tanpa daftar isi,
> Anda harus membaca halaman satu per satu (*full table scan*). Dengan daftar
> isi, Anda langsung melompat ke halaman yang dicari.

```sql
-- Tanpa index: MySQL memeriksa semua baris
SELECT * FROM orders WHERE user_id = 42;

-- Menambah index
CREATE INDEX idx_orders_user ON orders(user_id);
```

### 14.2 Sub-topik

- 14.2.1 Cara kerja index (B-Tree) secara konseptual
- 14.2.2 Jenis index: primary, unique, biasa, composite (multi-kolom), full-text
- 14.2.3 **Aturan leftmost prefix** pada composite index
- 14.2.4 Covering index
- 14.2.5 Kapan index **tidak** dipakai (fungsi pada kolom, `LIKE '%kata'`, tipe tidak cocok)
- 14.2.6 Harga index: memperlambat tulis, memakan ruang
- 14.2.7 Index pada foreign key
- 14.2.8 Cardinality & selektivitas

---

## 📖 Bab 15 — EXPLAIN & Optimasi Query

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC;
```

- 15.1 Membaca output `EXPLAIN`: `type`, `key`, `rows`, `Extra`
- 15.2 `EXPLAIN ANALYZE` (MySQL 8) untuk waktu eksekusi sebenarnya
- 15.3 Slow query log: menemukan query bermasalah
- 15.4 Masalah N+1 dari sisi database
- 15.5 Pagination: `OFFSET` besar vs keyset pagination
- 15.6 Hindari `SELECT *`, pilih kolom seperlunya
- 15.7 Tuning dasar: ukuran buffer pool InnoDB (pengenalan)
- 15.8 🎬 Studi kasus: mempercepat query laporan dari 8 detik menjadi milidetik

---

## 📖 Bab 16 — Transaksi, ACID & Locking ⭐

### 16.1 🔒 Transaksi

```sql
START TRANSACTION;

UPDATE accounts SET saldo = saldo - 100000 WHERE id = 1;
UPDATE accounts SET saldo = saldo + 100000 WHERE id = 2;

COMMIT;     -- semua berhasil → simpan permanen
-- ROLLBACK; -- ada masalah → batalkan semua
```

### 16.2 Sub-topik

- 16.2.1 **ACID** satu per satu: Atomicity, Consistency, Isolation, Durability
- 16.2.2 `COMMIT`, `ROLLBACK`, `SAVEPOINT`, dan `autocommit`
- 16.2.3 Storage engine: **InnoDB** (transaksi, foreign key) vs MyISAM (lama)
- 16.2.4 Isolation level: `READ COMMITTED`, `REPEATABLE READ` (default InnoDB), `SERIALIZABLE`
- 16.2.5 Masalah konkurensi: dirty read, non-repeatable read, phantom read
- 16.2.6 Lock: row lock, `SELECT ... FOR UPDATE`, mencegah overselling stok
- 16.2.7 **Deadlock**: penyebab, cara mendeteksi, cara menghindari
- 16.2.8 🎬 Studi kasus: checkout yang mengurangi stok tanpa race condition

---

---

# 🟣 BAGIAN VI — Fitur Lanjutan MySQL

---

## 📖 Bab 17 — View, Stored Procedure, Function, Trigger & Event

- 17.1 **View**: query tersimpan sebagai "tabel virtual" (dan kapan berguna)
- 17.2 **Stored procedure** & **stored function**: sintaks, parameter, `DELIMITER`
- 17.3 **Trigger**: aksi otomatis saat INSERT/UPDATE/DELETE (mis. audit log)
- 17.4 **Event scheduler**: tugas terjadwal di dalam MySQL
- 17.5 ⚖️ Logika di database vs di aplikasi: kelebihan, kekurangan, dan pedoman praktis
- 17.6 Kapan menghindari trigger (sulit di-debug, efek tersembunyi)

---

## 📖 Bab 18 — JSON, Full-Text Search & Fitur Modern

- 18.1 Tipe `JSON`: menyimpan, membaca (`->`, `->>`, `JSON_EXTRACT`), memperbarui
- 18.2 Mengindeks nilai JSON lewat **generated column**
- 18.3 Kapan JSON, kapan kolom/tabel biasa (kembali ke Bab 2 & 12)
- 18.4 **Full-text index** (`MATCH ... AGAINST`) dan batasannya dibanding search engine
- 18.5 Generated column (virtual & stored)
- 18.6 Invisible index dan descending index (MySQL 8)
- 18.7 Partisi tabel (pengenalan)

---

---

# ⚫ BAGIAN VII — Administrasi & Keamanan

---

## 📖 Bab 19 — User, Privilege & Keamanan

```sql
CREATE USER 'app_toko'@'%' IDENTIFIED BY 'password_kuat';
GRANT SELECT, INSERT, UPDATE, DELETE ON toko.* TO 'app_toko'@'%';
-- Aplikasi TIDAK memakai root!
```

- 19.1 Membuat user & memberi hak akses seperlunya (*least privilege*)
- 19.2 Role di MySQL 8
- 19.3 Mengapa aplikasi tidak boleh memakai akun `root`
- 19.4 **SQL Injection**: cara kerja serangan dan **prepared statement** sebagai pertahanan
- 19.5 Menyimpan password: hash (bcrypt/argon2), bukan teks biasa
- 19.6 Enkripsi koneksi (TLS) dan enkripsi data sensitif
- 19.7 Jangan membuka port 3306 ke internet
- 19.8 Menyimpan kredensial di `.env`, bukan di kode

---

## 📖 Bab 20 — Backup, Restore & Migrasi

```bash
# Backup
mysqldump -u root -p --single-transaction toko > toko_backup.sql

# Restore
mysql -u root -p toko < toko_backup.sql
```

- 20.1 Logical backup (`mysqldump`) vs physical backup (pengenalan)
- 20.2 Strategi backup: jadwal, retensi, **uji restore secara berkala**
- 20.3 Import & export data (CSV, `LOAD DATA`)
- 20.4 **Migration**: mengelola perubahan skema dengan version control (hubungan dengan Laravel/Prisma)
- 20.5 Replication (primary–replica): pengenalan konsep & kegunaan (read scaling, ketersediaan)
- 20.6 Monitoring dasar: koneksi, slow query, ukuran tabel
- 20.7 Checklist sebelum deploy ke production

---

---

# 🌐 BAGIAN VIII — Integrasi Aplikasi & Sekilas PostgreSQL

---

## 📖 Bab 21 — Menghubungkan MySQL ke Aplikasi

- 21.1 Alur koneksi: aplikasi → driver → server MySQL
- 21.2 Contoh koneksi dengan **PHP (PDO)** dan **Node.js (`mysql2`)**
- 21.3 **Prepared statement** di praktik (aman dari SQL injection)
- 21.4 **Connection pooling** dan mengapa penting
- 21.5 ORM vs query builder vs raw SQL (kapan memakai masing-masing)
- 21.6 Eloquent (Laravel) dan Prisma sebagai contoh ORM, dan SQL apa yang mereka hasilkan
- 21.7 Mengintip query yang dijalankan ORM (query log) untuk mendeteksi N+1
- 21.8 Transaksi dari sisi aplikasi

---

## 📖 Bab 22 — Sekilas PostgreSQL & Pilihan Database Lain

> 🎯 Bab ini sengaja singkat: tujuannya membuat pembaca **tahu apa yang ada**,
> bukan mengajarkan PostgreSQL secara penuh.

### 22.1 ⚖️ MySQL vs PostgreSQL

| Aspek | MySQL | PostgreSQL |
|---|---|---|
| **Reputasi** | Sederhana, sangat luas dipakai, banyak hosting mendukung | Kaya fitur, ketat terhadap standar SQL |
| **Tipe data** | Cukup lengkap | Lebih kaya (array, range, `JSONB`, tipe kustom) |
| **JSON** | Tipe `JSON` | `JSON` dan `JSONB` (dapat di-index secara lebih fleksibel) |
| **Ekstensi** | Terbatas | Ekosistem ekstensi luas (mis. PostGIS untuk data geospasial) |
| **Fitur query lanjutan** | Window function, CTE (sejak 8.0) | Sangat lengkap sejak lama |
| **Cocok untuk** | Aplikasi web umum, CMS, e-commerce | Analitik kompleks, data geospasial, kebutuhan tipe data khusus |

> ⚠️ **Catatan:** kedua database sangat matang dan mampu menangani sebagian
> besar aplikasi. Perbedaan di tabel bersifat **kecenderungan umum**, bukan
> aturan mutlak, dan terus berubah seiring versi. Untuk keputusan serius,
> cek dokumentasi versi yang Anda pakai.

### 22.2 Sub-topik

- 22.2.1 Perbedaan sintaks yang sering membuat bingung (mis. auto-increment vs `SERIAL`/identity, kutip identifier, `LIMIT`)
- 22.2.2 Apa yang mudah dibawa jika suatu hari pindah database (SQL standar) dan apa yang tidak (fitur spesifik vendor)
- 22.2.3 Mengapa memakai ORM/migration membantu portabilitas
- 22.2.4 Sekilas MariaDB (fork MySQL) dan SQLite (database file, cocok untuk prototipe dan aplikasi kecil)
- 22.2.5 Kapan mempertimbangkan database lain: **Redis** (cache/session), **MongoDB** (dokumen fleksibel), **Elasticsearch** (pencarian)
- 22.2.6 Kerangka memilih: kebutuhan data → konsistensi → skala → tim & ekosistem

---

---

# 🏆 BAGIAN IX — Project: Database Toko Online

---

## 📖 Bab 23 — Project Akhir

### 23.1 🎯 Yang Akan Dibangun

| Bagian | Isi |
|---|---|
| **Skema** | users, categories, products, carts, orders, order_items, payments, reviews |
| **Seed data** | Data contoh ratusan baris untuk latihan query & performa |
| **Query laporan** | Omzet harian/bulanan, produk terlaris, pelanggan teratas, stok menipis |
| **Fitur lanjutan** | View laporan, trigger audit stok, transaksi checkout |
| **Performa** | Index yang tepat, bukti dengan `EXPLAIN` sebelum/sesudah |
| **Keamanan** | User khusus aplikasi dengan hak terbatas |
| **Operasional** | Skrip backup & restore |

### 23.2 🚀 Urutan Pengerjaan

```
Step 1 ─ Analisis kebutuhan & gambar ERD
Step 2 ─ Buat database, tabel, constraint, dan foreign key
Step 3 ─ Isi seed data (script atau tool generator)
Step 4 ─ Tulis query CRUD & JOIN untuk fitur utama
Step 5 ─ Buat query laporan (GROUP BY, CTE, window function)
Step 6 ─ Implementasi transaksi checkout (stok aman dari race condition)
Step 7 ─ Ukur query lambat, tambah index, bandingkan dengan EXPLAIN
Step 8 ─ Buat view, trigger audit, dan user dengan hak terbatas
Step 9 ─ Backup, hapus, lalu restore untuk membuktikan backup berfungsi
Step 10 ─ Hubungkan ke aplikasi sederhana (PDO atau Node.js)
```

### 23.3 ✅ Checklist Akhir

```
Desain:      ☐ Terstruktur & ternormalisasi   ☐ Tipe data tepat (DECIMAL untuk uang)
Integritas:  ☐ Foreign key & constraint       ☐ Snapshot harga di order_items
Performa:    ☐ Index pada kolom yang difilter ☐ Query lambat sudah diperiksa EXPLAIN
Konsistensi: ☐ Transaksi untuk operasi multi-langkah
Keamanan:    ☐ Aplikasi tidak memakai root    ☐ Prepared statement
Operasional: ☐ Backup rutin & sudah diuji restore
```

---

## 📊 Ringkasan Struktur Final

```
🐬 EBOOK DATABASE MYSQL
│
├── 🟢 BAGIAN I    — Fondasi: Database, SQL vs NoSQL & Setup   Bab 1  – 4
│   ├── Bab 1  ─ Mengenal Database & DBMS
│   ├── Bab 2  ─ SQL vs NoSQL: Peta Besar Dunia Database ⭐
│   ├── Bab 3  ─ Konsep Database Relasional
│   └── Bab 4  ─ Instalasi & Setup MySQL
│
├── 🔵 BAGIAN II   — SQL Dasar                                 Bab 5  – 7
│   ├── Bab 5  ─ DDL: Membuat Database & Tabel
│   ├── Bab 6  ─ CRUD: INSERT, SELECT, UPDATE, DELETE
│   └── Bab 7  ─ Filtering, Sorting & Fungsi
│
├── 🟡 BAGIAN III  — Relasi & Query Lanjutan                   Bab 8  – 11
│   ├── Bab 8  ─ Constraint & Relasi Antar Tabel
│   ├── Bab 9  ─ JOIN ⭐
│   ├── Bab 10 ─ Agregasi & Pengelompokan
│   └── Bab 11 ─ Subquery, CTE, Window Function & UNION
│
├── 🟠 BAGIAN IV   — Desain Database                           Bab 12 – 13
│   ├── Bab 12 ─ ERD & Normalisasi ⭐
│   └── Bab 13 ─ Studi Kasus Desain: Toko Online
│
├── 🔴 BAGIAN V    — Index, Performa & Transaksi               Bab 14 – 16
│   ├── Bab 14 ─ Index ⭐
│   ├── Bab 15 ─ EXPLAIN & Optimasi Query
│   └── Bab 16 ─ Transaksi, ACID & Locking ⭐
│
├── 🟣 BAGIAN VI   — Fitur Lanjutan MySQL                      Bab 17 – 18
│   ├── Bab 17 ─ View, Stored Procedure, Function, Trigger & Event
│   └── Bab 18 ─ JSON, Full-Text Search & Fitur Modern
│
├── ⚫ BAGIAN VII  — Administrasi & Keamanan                   Bab 19 – 20
│   ├── Bab 19 ─ User, Privilege & Keamanan
│   └── Bab 20 ─ Backup, Restore & Migrasi
│
├── 🌐 BAGIAN VIII — Integrasi Aplikasi & Sekilas PostgreSQL   Bab 21 – 22
│   ├── Bab 21 ─ Menghubungkan MySQL ke Aplikasi
│   └── Bab 22 ─ Sekilas PostgreSQL & Pilihan Database Lain
│
└── 🏆 BAGIAN IX   — Project: Database Toko Online             Bab 23
    └── Bab 23 ─ Project Akhir

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total    :  9 Bagian  |  23 Bab
Prasyarat:  Tidak ada (cocok untuk pemula)
Fokus    :  MySQL 8.x + wawasan SQL vs NoSQL + sekilas PostgreSQL
Project  :  Database Toko Online (desain → query → performa → keamanan)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

*Ebook Database MySQL — Dari Nol Sampai Siap Dipakai di Project Nyata*
