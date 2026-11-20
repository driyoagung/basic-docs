# 🐘 Ebook Database PostgreSQL — Dari Nol Sampai Siap Dipakai di Project Nyata
### SQL Modern, Fitur Khas PostgreSQL (JSONB, Extension, MVCC), Performa, dan Keamanan

---

> 🎯 **Untuk Siapa Ebook Ini?**
> - **Pemula** yang ingin belajar database relasional dari awal dengan PostgreSQL
> - **Developer yang sudah kenal MySQL** dan ingin tahu apa yang berbeda (ada jembatannya di awal dan di Bab 25)
> - **Developer aplikasi** (Node.js, Laravel, Next.js, Prisma, dsb.) yang ingin paham apa yang sebenarnya terjadi di balik ORM

---

> 💡 **Asumsi yang Dipakai di Struktur Ini**
> - **PostgreSQL 16 ke atas** (disarankan memakai versi terbaru yang masih didukung)
> - Beberapa fitur bergantung versi dan **akan diberi catatan versi** di dalam bab (contoh: `MERGE` sejak 15)
> - Latihan memakai studi kasus **toko online** yang sama seperti ebook MySQL, supaya pembaca bisa membandingkan
> - Konsep umum database (apa itu DBMS, SQL vs NoSQL) dibahas ringkas di sini, dan lebih lengkap di ebook MySQL Bab 2

---

## 🤔 Mengapa PostgreSQL?

```
POSTGRESQL DIKENAL KARENA:
✅ Kepatuhan tinggi pada standar SQL
✅ Tipe data yang sangat kaya (JSONB, array, range, uuid, enum, tipe kustom)
✅ Ekosistem extension (PostGIS untuk geospasial, pgvector untuk vektor/AI,
   pg_trgm untuk pencarian fuzzy, dsb.)
✅ Fitur query lanjutan yang matang (CTE, window function, LATERAL, upsert)
✅ Model transaksi MVCC yang kuat
✅ Open source dengan lisensi permisif, tidak dimiliki satu perusahaan
```

> 💡 **Analogi:**
> Jika MySQL adalah **mobil keluarga yang praktis dan ada di mana-mana**,
> PostgreSQL adalah **mobil dengan bagasi dan fitur yang lebih lengkap**.
> Untuk kebanyakan kebutuhan keduanya sama-sama cukup. PostgreSQL unggul
> ketika Anda butuh fitur data yang lebih kaya.

---

## 🔄 Jembatan Cepat: MySQL vs PostgreSQL

> Untuk pembaca yang sudah membaca ebook MySQL. Detail lengkapnya ada di Bab 25.

| Hal | MySQL | PostgreSQL |
|---|---|---|
| **Auto-increment** | `AUTO_INCREMENT` | `GENERATED ... AS IDENTITY` (atau `SERIAL` gaya lama) |
| **Kutip nama kolom/tabel** | Backtick `` ` `` | Kutip ganda `"` |
| **Perbandingan teks** | Umumnya *tidak* membedakan huruf besar/kecil (collation default) | **Membedakan** huruf besar/kecil; pakai `ILIKE` untuk pencarian tidak sensitif |
| **Boolean** | `TINYINT(1)` | Tipe `BOOLEAN` asli |
| **Gabung string** | `CONCAT()` | `\|\|` (atau `CONCAT()`) |
| **Mengembalikan baris hasil INSERT** | Tidak ada | `RETURNING` |
| **FULL OUTER JOIN** | Tidak didukung langsung | Didukung |
| **Upsert** | `ON DUPLICATE KEY UPDATE` | `ON CONFLICT DO UPDATE` |
| **Tampilkan tabel** | `SHOW TABLES;` | `\dt` (di `psql`) |
| **JSON** | `JSON` | `JSON` dan `JSONB` (biner, bisa di-index) |

---

## 🧰 Tools yang Digunakan

| Tool | Fungsi |
|---|---|
| **PostgreSQL 16+** | Database utama |
| **psql** | Client command line bawaan |
| **DBeaver / pgAdmin / TablePlus** | Antarmuka grafis |
| **Docker** | Menjalankan PostgreSQL tanpa install manual |
| **pg_dump / pg_restore** | Backup & restore |
| **PgBouncer** | Connection pooler (pengenalan) |
| **Bahasa pemrograman** | Contoh koneksi dari Node.js / PHP |

---

## 🗺️ Peta Perjalanan Belajar

```
🟢 BAGIAN I    Fondasi & Setup                              → Bab 1  – 3
🔵 BAGIAN II   SQL Dasar di PostgreSQL                      → Bab 4  – 6
🟡 BAGIAN III  Relasi & Query Lanjutan                      → Bab 7  – 10
🟠 BAGIAN IV   Desain Database                              → Bab 11 – 12
🟣 BAGIAN V    Fitur Khas PostgreSQL                        → Bab 13 – 16
🔴 BAGIAN VI   Index, Performa & Transaksi                  → Bab 17 – 19
⚙️ BAGIAN VII  Pemrograman di Database & Skala              → Bab 20 – 21
⚫ BAGIAN VIII Administrasi & Keamanan                      → Bab 22 – 23
🏆 BAGIAN IX   Integrasi, Migrasi & Project                 → Bab 24 – 26
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 9 Bagian | 26 Bab
```

---

## ⭐ Bab Paling Kritis

| Prioritas | Bab | Mengapa Kritis |
|---|---|---|
| 🥇 | **Bab 8** — JOIN | Inti database relasional |
| 🥈 | **Bab 13** — JSONB | Fitur yang paling sering jadi alasan orang memilih PostgreSQL |
| 🥉 | **Bab 17** — Index | PostgreSQL punya banyak jenis index; memilih yang tepat menentukan performa |
| 🏅 | **Bab 19** — Transaksi, MVCC & VACUUM | Memahami cara PostgreSQL menjaga konsistensi dan "membersihkan" dirinya sendiri |

---

---

# 🟢 BAGIAN I — Fondasi & Setup

> 🎯 **Tujuan:** Memahami posisi PostgreSQL, menyiapkan environment,
> dan mengenal struktur logis PostgreSQL (cluster, database, schema, role).

---

## 📖 Bab 1 — Mengenal PostgreSQL

- 1.1 🤔 Apa itu PostgreSQL dan siapa yang mengembangkannya (proyek komunitas)
- 1.2 🕰️ Sejarah singkat: dari proyek riset Berkeley hingga database populer
- 1.3 ⚖️ Posisi PostgreSQL: relasional, **object-relational**, dan fiturnya yang melewati batas SQL klasik
- 1.4 ✅ Kapan PostgreSQL cocok dipilih (data berelasi kuat, analitik, JSON, geospasial, kebutuhan extension)
- 1.5 🗂️ Ringkasan **SQL vs NoSQL** (rujukan ke ebook MySQL Bab 2) dan bagaimana JSONB mengaburkan batasnya
- 1.6 ☁️ Cara PostgreSQL dipakai sekarang: self-hosted, managed (RDS, Cloud SQL, dsb.), dan platform seperti Supabase/Neon
- 1.7 🔢 Siklus rilis & versi: satu rilis mayor per tahun, dukungan lima tahun; pentingnya memilih versi yang masih didukung

---

## 📖 Bab 2 — Instalasi & Mengenal `psql`

### 2.1 🚀 Instalasi

```bash
# Docker (disarankan untuk latihan)
docker run --name pg-belajar \
  -e POSTGRES_PASSWORD=rahasia123 \
  -p 5432:5432 -d postgres:16

# Masuk dengan psql
docker exec -it pg-belajar psql -U postgres
```

- 2.2 Instalasi langsung: Windows, macOS (Homebrew / Postgres.app), Linux (apt)
- 2.3 Mengenal `psql` dan **meta-command** (perintah berawalan `\`)

| Perintah | Fungsi |
|---|---|
| `\l` | Daftar database |
| `\c nama_db` | Pindah database |
| `\dt` | Daftar tabel |
| `\d nama_tabel` | Struktur tabel |
| `\du` | Daftar role |
| `\x` | Tampilan hasil vertikal (berguna untuk baris lebar) |
| `\timing` | Tampilkan waktu eksekusi query |
| `\i file.sql` | Jalankan file SQL |
| `\q` | Keluar |

- 2.4 Memakai GUI (DBeaver / pgAdmin / TablePlus)
- 2.5 Connection string (`postgresql://user:pass@host:5432/db`) dan variabel environment `PG*`
- 2.6 Membaca pesan error PostgreSQL (kode `SQLSTATE`)
- 2.7 Memuat dataset latihan (toko online)

---

## 📖 Bab 3 — Struktur Logis: Cluster, Database, Schema & Role

```
CLUSTER (satu instance PostgreSQL)
├── Database: toko
│   ├── Schema: public           ← schema bawaan
│   │   ├── Tabel: users
│   │   └── Tabel: products
│   └── Schema: reporting        ← schema buatan sendiri
│       └── View: ringkasan_omzet
├── Database: postgres           ← database bawaan
└── Role: app_toko, admin, ...   ← user & grup digabung jadi "role"
```

- 3.1 Cluster vs database vs **schema** (satu hal yang membedakan dari MySQL: schema adalah namespace di dalam database)
- 3.2 `search_path`: cara PostgreSQL menemukan tabel tanpa nama schema
- 3.3 Role: user dan grup dalam satu konsep
- 3.4 Database sistem & template (`template0`, `template1`)
- 3.5 Gambaran arsitektur (konseptual saja): proses server, shared buffers, **WAL** (*write-ahead log*), dan mengapa ini penting untuk durabilitas
- 3.6 Kapan memakai banyak schema vs banyak database

---

---

# 🔵 BAGIAN II — SQL Dasar di PostgreSQL

---

## 📖 Bab 4 — DDL: Tabel & Tipe Data

### 4.1 🏗️ Membuat Tabel

```sql
CREATE TABLE users (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  saldo      NUMERIC(12,2) NOT NULL DEFAULT 0,
  aktif      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.2 📦 Tipe Data PostgreSQL

| Kategori | Tipe | Catatan |
|---|---|---|
| **Bilangan bulat** | `SMALLINT`, `INTEGER`, `BIGINT` | Tidak ada versi `UNSIGNED` |
| **Desimal** | `NUMERIC(p,s)` | ✅ Untuk uang (presisi tepat) |
| **Pecahan** | `REAL`, `DOUBLE PRECISION` | ⚠️ Tidak presisi, jangan untuk uang |
| **Teks** | `TEXT`, `VARCHAR(n)`, `CHAR(n)` | `TEXT` dan `VARCHAR` secara performa setara |
| **Tanggal & waktu** | `DATE`, `TIME`, `TIMESTAMP`, `TIMESTAMPTZ`, `INTERVAL` | ⭐ Utamakan `TIMESTAMPTZ` |
| **Boolean** | `BOOLEAN` | Tipe asli |
| **UUID** | `UUID` | Tipe bawaan |
| **JSON** | `JSON`, `JSONB` | Dibahas di Bab 13 |
| **Array** | `INTEGER[]`, `TEXT[]` | Dibahas di Bab 14 |
| **Enum & range** | `ENUM`, `DATERANGE`, `INT4RANGE` | Dibahas di Bab 14 |
| **Jaringan** | `INET`, `CIDR` | |

### 4.3 Sub-topik

- 4.3.1 `SERIAL` (lama) vs **`GENERATED ... AS IDENTITY`** (standar SQL, disarankan)
- 4.3.2 `TEXT` vs `VARCHAR(n)`: kapan membatasi panjang
- 4.3.3 `TIMESTAMP` vs **`TIMESTAMPTZ`**: mengapa menyimpan zona waktu itu penting
- 4.3.4 Mengapa uang memakai `NUMERIC`, bukan `FLOAT`
- 4.3.5 `ALTER TABLE`, `DROP`, `TRUNCATE`, `RENAME`
- 4.3.6 Konvensi penamaan (snake_case, hindari huruf besar agar tidak perlu kutip)
- 4.3.7 Melihat struktur: `\d`, `information_schema`, katalog sistem (`pg_catalog`)

---

## 📖 Bab 5 — CRUD, RETURNING & Upsert

```sql
-- INSERT dengan RETURNING: dapat id baru tanpa query kedua
INSERT INTO users (nama, email)
VALUES ('Budi', 'budi@mail.com')
RETURNING id, created_at;

-- Upsert
INSERT INTO products (sku, nama, harga)
VALUES ('LP-001', 'Laptop', 15000000)
ON CONFLICT (sku)
DO UPDATE SET harga = EXCLUDED.harga;
```

- 5.1 `INSERT`: tunggal, banyak baris, dan `INSERT ... SELECT`
- 5.2 **`RETURNING`** pada INSERT / UPDATE / DELETE
- 5.3 **Upsert** dengan `ON CONFLICT` (`DO NOTHING` vs `DO UPDATE`)
- 5.4 `MERGE` (PostgreSQL 15+): kapan dipakai dibanding upsert
- 5.5 `UPDATE ... FROM` dan `DELETE ... USING` (update/hapus berdasarkan tabel lain)
- 5.6 `COPY` untuk import/export data massal (dan `\copy` di psql)
- 5.7 ⚠️ Selalu pakai `WHERE` pada UPDATE/DELETE, dan kebiasaan memakai transaksi untuk operasi berisiko
- 5.8 🎬 Studi kasus: mengisi data toko online dan memakai `RETURNING` untuk menghubungkan data

---

## 📖 Bab 6 — Filtering, Fungsi & Tanggal

- 6.1 `WHERE`: `=`, `<>`, `BETWEEN`, `IN`, `LIKE`, **`ILIKE`** (tidak sensitif huruf besar/kecil)
- 6.2 **NULL**: `IS NULL`, `IS DISTINCT FROM`, dan jebakan perbandingan dengan NULL
- 6.3 `ORDER BY`, `LIMIT`, `OFFSET`, `NULLS FIRST/LAST`
- 6.4 Fungsi string: `||`, `UPPER`, `LOWER`, `SUBSTRING`, `TRIM`, `REPLACE`, `SPLIT_PART`
- 6.5 Fungsi angka: `ROUND`, `CEIL`, `FLOOR`, `ABS`
- 6.6 Fungsi tanggal: `now()`, `date_trunc`, `extract`, `to_char`, aritmatika dengan **`INTERVAL`**
- 6.7 Kondisional: `CASE WHEN`, `COALESCE`, `NULLIF`
- 6.8 Casting: `::` (misal `'5'::int`) dan `CAST()`
- 6.9 `generate_series()`: membuat deret angka/tanggal untuk latihan dan laporan

```sql
-- Omzet per hari termasuk hari yang tidak ada pesanan
SELECT d::date AS tanggal, COALESCE(SUM(o.total), 0) AS omzet
FROM generate_series('2025-01-01'::date, '2025-01-31', '1 day') AS d
LEFT JOIN orders o ON o.created_at::date = d::date
GROUP BY d
ORDER BY d;
```

---

---

# 🟡 BAGIAN III — Relasi & Query Lanjutan

---

## 📖 Bab 7 — Constraint & Relasi

```sql
CREATE TABLE orders (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  total      NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','paid','shipped','done','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- 7.1 Constraint: `NOT NULL`, `UNIQUE`, `DEFAULT`, `CHECK`, `PRIMARY KEY`, `FOREIGN KEY`
- 7.2 Aksi referensial: `CASCADE`, `RESTRICT`, `SET NULL`, `NO ACTION`
- 7.3 Relasi one-to-many & many-to-many (tabel pivot)
- 7.4 Primary key: identity vs UUID (`gen_random_uuid()`), dampak ke index & urutan
- 7.5 Composite key dan `UNIQUE` pada beberapa kolom
- 7.6 Constraint lanjutan: `EXCLUDE` (mencegah tumpang tindih, mis. jadwal), constraint `DEFERRABLE`
- 7.7 Menambah constraint ke tabel yang sudah berisi data (`NOT VALID` lalu `VALIDATE`)

---

## 📖 Bab 8 — JOIN ⭐

```sql
-- INNER JOIN
SELECT u.nama, o.id AS order_id, o.total
FROM users u
JOIN orders o ON o.user_id = u.id;

-- LEFT JOIN: semua user, termasuk yang belum punya order
SELECT u.nama, COUNT(o.id) AS jumlah_order
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.nama;
```

| JOIN | Hasil |
|---|---|
| `INNER JOIN` | Hanya yang cocok di kedua tabel |
| `LEFT / RIGHT JOIN` | Semua dari satu sisi + yang cocok |
| **`FULL OUTER JOIN`** | Semua dari kedua sisi (PostgreSQL mendukung langsung) |
| `CROSS JOIN` | Semua kombinasi |
| Self join | Tabel di-join dengan dirinya sendiri |
| **`LATERAL`** | Subquery yang boleh merujuk kolom tabel di sebelah kirinya |

### Sub-topik

- 8.1 Visualisasi JOIN dengan data kecil
- 8.2 Join banyak tabel (`users → orders → order_items → products`)
- 8.3 Mencari data tanpa pasangan (`LEFT JOIN ... WHERE ... IS NULL`, `NOT EXISTS`)
- 8.4 **`JOIN LATERAL`**: "N pesanan terbaru per user"
- 8.5 `USING` dan `NATURAL JOIN` (dan mengapa `NATURAL` sebaiknya dihindari)
- 8.6 Kesalahan umum: join menggandakan baris, kondisi di `ON` vs `WHERE`
- 8.7 🎬 Studi kasus: laporan pesanan lengkap beserta nama user & produk

---

## 📖 Bab 9 — Agregasi & Pengelompokan

```sql
SELECT status,
       COUNT(*)                                  AS jumlah,
       SUM(total)                                AS omzet,
       COUNT(*) FILTER (WHERE total > 1000000)   AS pesanan_besar
FROM orders
GROUP BY status;
```

- 9.1 `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`
- 9.2 `GROUP BY`, `HAVING`, dan aturan kolom yang boleh di-`SELECT`
- 9.3 **`FILTER`**: agregasi bersyarat yang lebih bersih daripada `CASE` di dalam agregat
- 9.4 `string_agg`, `array_agg`, `json_agg` / `jsonb_agg`
- 9.5 `GROUPING SETS`, `ROLLUP`, `CUBE` untuk subtotal
- 9.6 Agregat statistik & `percentile_cont` (median)
- 9.7 🎬 Studi kasus: laporan penjualan harian, bulanan, dan per kategori

---

## 📖 Bab 10 — Subquery, CTE, Window Function & Fitur Query Khas

- 10.1 Subquery di `WHERE`, `FROM`, dan `SELECT`; `EXISTS` vs `IN`
- 10.2 **CTE** (`WITH`): query yang mudah dibaca
- 10.3 **CTE rekursif**: hierarki kategori, struktur organisasi
- 10.4 **Window function**: `ROW_NUMBER`, `RANK`, `LAG`, `LEAD`, `SUM() OVER()`, frame (`ROWS BETWEEN`)
- 10.5 **`DISTINCT ON`**: ambil satu baris pertama per grup (khas PostgreSQL)
- 10.6 `UNION`, `INTERSECT`, `EXCEPT`
- 10.7 CTE yang menulis data (`WITH ... INSERT ... RETURNING`)
- 10.8 🎬 Studi kasus: "3 produk terlaris per kategori" dan "pertumbuhan omzet dibanding bulan lalu"

```sql
-- DISTINCT ON: pesanan terbaru tiap user
SELECT DISTINCT ON (user_id) user_id, id, total, created_at
FROM orders
ORDER BY user_id, created_at DESC;
```

---

---

# 🟠 BAGIAN IV — Desain Database

---

## 📖 Bab 11 — ERD, Normalisasi & Desain Skema

- 11.1 Dari kebutuhan bisnis ke entitas, atribut, dan relasi
- 11.2 ERD & kardinalitas
- 11.3 Normalisasi 1NF, 2NF, 3NF dengan contoh sebelum/sesudah (ringkas, rujuk ebook MySQL Bab 12)
- 11.4 **Denormalisasi yang disengaja** (kolom `total`, snapshot harga di `order_items`)
- 11.5 Fitur PostgreSQL yang memengaruhi desain: tipe array/JSONB, `ENUM`, **domain**, **schema** untuk memisahkan area (mis. `app`, `reporting`)
- 11.6 Pola umum: status, soft delete, audit log, `created_at`/`updated_at`
- 11.7 ⚠️ PostgreSQL tidak punya `ON UPDATE CURRENT_TIMESTAMP`: memakai trigger untuk `updated_at`
- 11.8 Kesalahan desain yang paling sering (kolom CSV, tanpa foreign key, JSONB berlebihan)

---

## 📖 Bab 12 — Studi Kasus Desain: Toko Online

- 12.1 Kebutuhan: user, produk, kategori, keranjang, pesanan, pembayaran, ulasan
- 12.2 Merancang ERD langkah demi langkah
- 12.3 Menerjemahkan ERD ke `CREATE TABLE` yang idiomatis PostgreSQL
- 12.4 Menentukan atribut produk yang bervariasi: kolom biasa vs **JSONB**
- 12.5 Menentukan tipe data, constraint, dan aksi foreign key
- 12.6 Mengevaluasi desain terhadap pertanyaan bisnis
- 12.7 Perbandingan hasil desain dengan versi MySQL (apa yang bisa lebih ringkas di PostgreSQL)

---

---

# 🟣 BAGIAN V — Fitur Khas PostgreSQL

> 🎯 **Tujuan:** Mempelajari fitur yang paling sering menjadi alasan
> orang memilih PostgreSQL.

---

## 📖 Bab 13 — JSONB ⭐

### 13.1 🧩 JSON vs JSONB

| | `JSON` | `JSONB` |
|---|---|---|
| Penyimpanan | Teks apa adanya | Format biner terurai |
| Kecepatan baca/query | Lebih lambat | Lebih cepat |
| Bisa di-index | Tidak (langsung) | ✅ Ya (GIN) |
| Urutan key & duplikat | Dipertahankan | Tidak dipertahankan |
| Disarankan untuk | Hampir tidak pernah | ✅ Umumnya pilihan utama |

### 13.2 Contoh

```sql
CREATE TABLE products (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama  TEXT NOT NULL,
  attrs JSONB NOT NULL DEFAULT '{}'
);

INSERT INTO products (nama, attrs)
VALUES ('Laptop', '{"ram": 16, "warna": "hitam", "tags": ["gaming","kerja"]}');

-- Ambil nilai
SELECT attrs->>'warna' FROM products;
-- Filter dengan operator containment
SELECT * FROM products WHERE attrs @> '{"warna": "hitam"}';
-- Index GIN supaya @> cepat
CREATE INDEX idx_products_attrs ON products USING GIN (attrs);
```

### 13.3 Sub-topik

- 13.3.1 Operator utama: `->`, `->>`, `#>`, `@>`, `?`, `||`
- 13.3.2 Fungsi: `jsonb_set`, `jsonb_build_object`, `jsonb_agg`, `jsonb_each`
- 13.3.3 JSON path (`@@`, `jsonb_path_query`)
- 13.3.4 Index GIN pada JSONB dan index ekspresi pada satu key
- 13.3.5 Kapan memakai JSONB, kapan kolom/tabel biasa (**jangan menjadikan semua data JSONB**)
- 13.3.6 Memvalidasi bentuk JSONB dengan `CHECK` atau aplikasi (Zod)
- 13.3.7 Menghasilkan JSON dari query (berguna untuk API)
- 13.3.8 🎬 Studi kasus: atribut produk yang berbeda-beda antar kategori

---

## 📖 Bab 14 — Array, Enum, Range & Tipe Khusus

- 14.1 **Array**: `TEXT[]`, `ANY()`, `unnest`, `array_agg`, dan index GIN
- 14.2 Kapan array pantas dipakai, dan kapan tabel relasi lebih tepat
- 14.3 **Enum** vs `CHECK` vs tabel referensi: kelebihan dan kekurangan
- 14.4 **Range type** (`daterange`, `tstzrange`) dan operator tumpang tindih
- 14.5 `EXCLUDE` + range: mencegah booking ganda
- 14.6 **Domain** dan tipe komposit
- 14.7 `UUID`: `gen_random_uuid()`, dan UUID berurutan waktu untuk performa index
- 14.8 `INET`/`CIDR` dan tipe jaringan
- 14.9 🎬 Studi kasus: sistem reservasi yang menolak jadwal bentrok langsung di database

---

## 📖 Bab 15 — Full-Text Search & Pencarian Fuzzy

- 15.1 Mengapa `LIKE '%kata%'` tidak cukup
- 15.2 `tsvector`, `tsquery`, dan konfigurasi bahasa
- 15.3 `to_tsvector`, `to_tsquery`, `plainto_tsquery`, operator `@@`
- 15.4 Peringkat hasil: `ts_rank`, `ts_headline`
- 15.5 Index **GIN** untuk full-text search & kolom generated `tsvector`
- 15.6 **`pg_trgm`**: pencarian typo-tolerant dan akselerasi `LIKE/ILIKE`
- 15.7 Batasan pada bahasa Indonesia dan kapan beralih ke search engine (Elasticsearch/OpenSearch/Meilisearch)
- 15.8 🎬 Studi kasus: kotak pencarian produk dengan peringkat relevansi

---

## 📖 Bab 16 — Extension

- 16.1 Apa itu extension dan cara memasangnya (`CREATE EXTENSION`)
- 16.2 Extension yang sering dipakai:

| Extension | Kegunaan |
|---|---|
| `pg_trgm` | Pencarian fuzzy |
| `citext` | Teks tidak sensitif huruf besar/kecil |
| `pgcrypto` | Fungsi kriptografi & hashing |
| `PostGIS` | Data geospasial (peta, jarak, area) |
| `pgvector` | Penyimpanan & pencarian vektor (aplikasi AI) |
| `pg_stat_statements` | Statistik query (performa) |
| `TimescaleDB` | Data time-series |

- 16.3 Foreign Data Wrapper (`postgres_fdw`): query database lain seolah satu database
- 16.4 Extension di layanan managed: tidak semua tersedia
- 16.5 Risiko ketergantungan pada extension (portabilitas & upgrade)
- 16.6 🎬 Studi kasus: mencari toko terdekat dengan PostGIS (pengenalan)

---

---

# 🔴 BAGIAN VI — Index, Performa & Transaksi

---

## 📖 Bab 17 — Index ⭐

### 17.1 🔍 Jenis Index di PostgreSQL

| Jenis | Cocok Untuk |
|---|---|
| **B-Tree** (default) | Kesamaan & rentang (`=`, `<`, `>`, `BETWEEN`, `ORDER BY`) |
| **Hash** | Kesamaan saja (jarang dipakai) |
| **GIN** | JSONB, array, full-text search |
| **GiST** | Geometri, range, pencarian kemiripan |
| **SP-GiST** | Struktur data tidak seimbang (mis. IP, prefix) |
| **BRIN** | Tabel sangat besar dengan data berurutan alami (mis. log berdasarkan waktu) |

### 17.2 Contoh

```sql
-- Index biasa
CREATE INDEX idx_orders_user ON orders (user_id);

-- Partial index: hanya baris yang relevan
CREATE INDEX idx_orders_pending ON orders (created_at) WHERE status = 'pending';

-- Index ekspresi
CREATE INDEX idx_users_email_lower ON users (lower(email));

-- Covering index dengan INCLUDE
CREATE INDEX idx_orders_user_cov ON orders (user_id) INCLUDE (total);

-- Membuat index tanpa mengunci tabel (production)
CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status);
```

### 17.3 Sub-topik

- 17.3.1 Cara kerja B-Tree secara konseptual
- 17.3.2 Composite index & urutan kolom
- 17.3.3 **Partial index** dan **index ekspresi**
- 17.3.4 Covering index (`INCLUDE`) & *index-only scan*
- 17.3.5 `CREATE INDEX CONCURRENTLY` dan risikonya
- 17.3.6 Kapan index tidak dipakai (fungsi pada kolom, tipe tidak cocok, tabel kecil)
- 17.3.7 Biaya index: memperlambat tulis, memakan ruang, *bloat*
- 17.3.8 Menemukan index yang tidak terpakai atau duplikat

---

## 📖 Bab 18 — EXPLAIN & Optimasi Query

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 10;
```

- 18.1 Membaca rencana eksekusi: `Seq Scan`, `Index Scan`, `Index Only Scan`, `Bitmap Scan`
- 18.2 Memahami `cost`, `rows` (perkiraan vs aktual), dan `actual time`
- 18.3 Jenis join di planner: Nested Loop, Hash Join, Merge Join
- 18.4 **Statistik planner**: `ANALYZE` dan mengapa statistik usang menghasilkan rencana buruk
- 18.5 **`pg_stat_statements`** untuk menemukan query paling mahal
- 18.6 Log query lambat (`log_min_duration_statement`) dan `auto_explain`
- 18.7 Pagination: `OFFSET` besar vs keyset pagination
- 18.8 Masalah N+1 dari sisi database
- 18.9 Tuning dasar: `shared_buffers`, `work_mem`, `effective_cache_size` (pengenalan, hati-hati `work_mem`)
- 18.10 🎬 Studi kasus: mempercepat query laporan dengan index yang tepat dan bukti `EXPLAIN` sebelum/sesudah

---

## 📖 Bab 19 — Transaksi, MVCC, Locking & VACUUM ⭐

### 19.1 🔒 Transaksi

```sql
BEGIN;
UPDATE accounts SET saldo = saldo - 100000 WHERE id = 1;
UPDATE accounts SET saldo = saldo + 100000 WHERE id = 2;
COMMIT;      -- atau ROLLBACK;
```

### 19.2 Sub-topik

- 19.2.1 **ACID** satu per satu
- 19.2.2 Di PostgreSQL, hampir semua perintah berjalan dalam transaksi (termasuk DDL yang bisa di-rollback)
- 19.2.3 **MVCC**: pembaca tidak memblokir penulis, dan sebaliknya (cara kerja versi baris, tanpa detail internal berlebihan)
- 19.2.4 Isolation level: `READ COMMITTED` (default), `REPEATABLE READ`, `SERIALIZABLE`
- 19.2.5 Masalah konkurensi: non-repeatable read, phantom, *write skew*, dan kesalahan serialisasi (perlu retry)
- 19.2.6 Locking: `SELECT ... FOR UPDATE`, `FOR SHARE`, `SKIP LOCKED` (antrean pekerjaan), `NOWAIT`
- 19.2.7 **Deadlock**: penyebab, deteksi, pencegahan
- 19.2.8 Advisory lock (pengenalan)
- 19.2.9 **VACUUM & autovacuum**: mengapa baris mati menumpuk, *bloat*, dan cara memantaunya
- 19.2.10 Transaksi panjang & "idle in transaction": penyebab masalah klasik
- 19.2.11 🎬 Studi kasus: checkout yang mengurangi stok aman dari race condition; antrean pekerjaan dengan `SKIP LOCKED`

---

---

# ⚙️ BAGIAN VII — Pemrograman di Database & Skala

---

## 📖 Bab 20 — View, Function, Trigger & Procedure

- 20.1 **View**: query tersimpan sebagai tabel virtual
- 20.2 **Materialized view**: hasil disimpan, `REFRESH MATERIALIZED VIEW` (dan `CONCURRENTLY`)
- 20.3 **Function** dengan SQL dan **PL/pgSQL**: variabel, kondisi, loop, penanganan error
- 20.4 **Procedure** (`CALL`) vs function; transaksi di dalam procedure
- 20.5 **Trigger**: `BEFORE`/`AFTER`, `FOR EACH ROW`, contoh `updated_at` otomatis dan audit log
- 20.6 `LISTEN` / `NOTIFY`: notifikasi sederhana antar koneksi
- 20.7 Logika di database vs di aplikasi: kelebihan, kekurangan, pedoman
- 20.8 Kapan menghindari trigger (efek tersembunyi, sulit di-debug)

```sql
-- Contoh: updated_at otomatis
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 📖 Bab 21 — Partisi, Pooling & Skala

- 21.1 **Partisi deklaratif**: `RANGE`, `LIST`, `HASH`, dan kapan benar-benar perlu
- 21.2 Mengelola partisi (menambah, melepas, mengarsipkan data lama)
- 21.3 **Connection pooling**: mengapa koneksi PostgreSQL itu mahal, dan peran **PgBouncer**
- 21.4 Mode pooling (session vs transaction) dan batasannya (mis. prepared statement, `LISTEN`)
- 21.5 Pengenalan **read replica** dan replikasi
- 21.6 Skala vertikal vs horizontal: batas wajar sebelum sharding
- 21.7 Pertimbangan serverless (Neon/Supabase): koneksi, pooler, cold start

---

---

# ⚫ BAGIAN VIII — Administrasi & Keamanan

---

## 📖 Bab 22 — Role, Hak Akses & Keamanan

```sql
CREATE ROLE app_toko LOGIN PASSWORD 'password_kuat';
GRANT CONNECT ON DATABASE toko TO app_toko;
GRANT USAGE ON SCHEMA public TO app_toko;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_toko;
-- Aplikasi TIDAK memakai superuser "postgres"!
```

- 22.1 Role: `LOGIN`, `SUPERUSER`, `CREATEDB`, dan pewarisan hak
- 22.2 `GRANT` / `REVOKE` pada database, schema, tabel, kolom
- 22.3 **Least privilege**: akun aplikasi vs akun migrasi vs akun read-only
- 22.4 Privilege schema `public` (perilaku default berubah di PostgreSQL 15)
- 22.5 `pg_hba.conf`: mengatur siapa boleh terhubung dari mana, dan metode autentikasi (SCRAM)
- 22.6 **Row-Level Security (RLS)**: membatasi baris yang boleh dilihat per user/tenant
- 22.7 **SQL Injection** dan prepared statement
- 22.8 Menyimpan password: hash (bcrypt/argon2), bukan teks biasa
- 22.9 Enkripsi koneksi (TLS) dan enkripsi data sensitif
- 22.10 Jangan membuka port 5432 ke internet; kredensial di `.env`
- 22.11 🎬 Studi kasus: multi-tenant sederhana dengan RLS

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_milik_sendiri ON orders
  USING (user_id = current_setting('app.user_id')::bigint);
```

---

## 📖 Bab 23 — Backup, Restore, Replikasi & Pemeliharaan

```bash
# Backup format custom (bisa restore selektif)
pg_dump -U postgres -Fc toko > toko.dump

# Restore
pg_restore -U postgres -d toko_baru toko.dump
```

- 23.1 Backup logis: `pg_dump`, `pg_dumpall`, format plain vs custom, `pg_restore`
- 23.2 Backup fisik: `pg_basebackup` dan **WAL archiving**
- 23.3 **Point-in-Time Recovery (PITR)**: memulihkan ke menit tertentu (pengenalan konsep)
- 23.4 Strategi backup: jadwal, retensi, **uji restore berkala**
- 23.5 Replikasi streaming vs replikasi logis (pengenalan)
- 23.6 Pemeliharaan rutin: VACUUM/ANALYZE, `REINDEX`, memantau bloat
- 23.7 Monitoring: `pg_stat_activity`, `pg_stat_user_tables`, koneksi, ukuran tabel, replication lag
- 23.8 Upgrade versi mayor: `pg_upgrade` vs dump/restore, rencana & pengujian
- 23.9 Layanan managed: apa yang diurus penyedia dan apa yang tetap tanggung jawab Anda

---

---

# 🏆 BAGIAN IX — Integrasi, Migrasi & Project

---

## 📖 Bab 24 — Menghubungkan PostgreSQL ke Aplikasi

- 24.1 Alur koneksi: aplikasi → driver → server
- 24.2 **Node.js**: `pg` (node-postgres), pool, parameterized query
- 24.3 **PHP / Laravel**: driver `pgsql`, konfigurasi `.env`, perbedaan kecil di migration
- 24.4 **Prisma / Drizzle** dengan PostgreSQL (hubungan dengan ebook Prisma)
- 24.5 **Prepared statement** & parameter (`$1, $2`)
- 24.6 Connection pooling dari sisi aplikasi
- 24.7 Mengintip query yang dibuat ORM (query log) untuk menemukan N+1
- 24.8 Transaksi dari sisi aplikasi & retry untuk kesalahan serialisasi
- 24.9 Memakai fitur khas (JSONB, `RETURNING`, array) lewat ORM dan kapan beralih ke raw SQL

---

## 📖 Bab 25 — Dari MySQL ke PostgreSQL

### 25.1 ⚖️ Perbedaan yang Sering Membuat Tersandung

| Topik | MySQL | PostgreSQL |
|---|---|---|
| Auto-increment | `AUTO_INCREMENT` | `IDENTITY` / `SERIAL` |
| Kutip identifier | `` `nama` `` | `"nama"` |
| Perbandingan teks | Umumnya tidak sensitif huruf | Sensitif huruf; `ILIKE`, `citext` |
| Tipe boolean | `TINYINT(1)` | `BOOLEAN` |
| Tanggal | `DATE_FORMAT`, `DATEDIFF` | `to_char`, `date_trunc`, `INTERVAL` |
| Null-handling | `IFNULL` | `COALESCE` |
| Upsert | `ON DUPLICATE KEY UPDATE` | `ON CONFLICT` |
| `updated_at` otomatis | `ON UPDATE CURRENT_TIMESTAMP` | Trigger |
| Mengembalikan hasil insert | `LAST_INSERT_ID()` | `RETURNING` |
| `GROUP BY` | Lebih longgar pada versi lama | Ketat: kolom harus ada di `GROUP BY` atau agregat |
| `UNSIGNED` | Ada | Tidak ada |
| DDL dalam transaksi | Umumnya auto-commit | Bisa di-rollback |
| Meta-command | `SHOW TABLES` | `\dt` |

### 25.2 Sub-topik

- 25.2.1 Strategi migrasi: skema dulu, lalu data, lalu verifikasi
- 25.2.2 Alat bantu migrasi (mis. `pgloader`) dan batasannya
- 25.2.3 Memeriksa perbedaan tipe data, collation, dan perilaku NULL/boolean
- 25.2.4 Menulis ulang query & fungsi yang spesifik MySQL
- 25.2.5 Menguji performa: index dan statistik harus disesuaikan, bukan disalin mentah
- 25.2.6 Kapan **tidak** perlu migrasi: biaya vs manfaat nyata
- 25.2.7 Memilih untuk project baru: kerangka keputusan MySQL vs PostgreSQL

---

## 📖 Bab 26 — Project Akhir: Database Toko Online

### 26.1 🎯 Yang Akan Dibangun

| Bagian | Isi |
|---|---|
| **Skema** | users, categories, products (JSONB attrs), carts, orders, order_items, payments, reviews |
| **Seed data** | Ratusan hingga ribuan baris memakai `generate_series` |
| **Query laporan** | Omzet harian/bulanan, produk terlaris (window function), pelanggan teratas |
| **Fitur khas PG** | Pencarian full-text, atribut JSONB ber-index GIN, `RETURNING`, upsert |
| **Fitur lanjutan** | Materialized view laporan, trigger `updated_at` & audit |
| **Performa** | Index (partial/ekspresi/GIN) dengan bukti `EXPLAIN (ANALYZE, BUFFERS)` |
| **Konsistensi** | Transaksi checkout aman dari overselling |
| **Keamanan** | Role khusus aplikasi, opsional RLS |
| **Operasional** | `pg_dump` dan uji `pg_restore` |

### 26.2 🚀 Urutan Pengerjaan

```
Step 1 ─ Analisis kebutuhan & ERD
Step 2 ─ Buat schema, tabel, constraint, foreign key
Step 3 ─ Seed data dengan generate_series
Step 4 ─ Query CRUD & JOIN fitur utama (pakai RETURNING)
Step 5 ─ Atribut produk dengan JSONB + index GIN
Step 6 ─ Pencarian produk (full-text + pg_trgm)
Step 7 ─ Laporan: CTE, window function, FILTER, ROLLUP
Step 8 ─ Transaksi checkout + FOR UPDATE / pengendalian race condition
Step 9 ─ Ukur query lambat, tambah index, bandingkan EXPLAIN
Step 10 ─ Materialized view, trigger, role, backup & uji restore
Step 11 ─ Hubungkan ke aplikasi sederhana (Node.js atau Laravel)
```

### 26.3 ✅ Checklist Akhir

```
Desain:      ☐ Ternormalisasi & terukur        ☐ NUMERIC untuk uang, TIMESTAMPTZ untuk waktu
Integritas:  ☐ Foreign key & CHECK            ☐ Snapshot harga di order_items
Performa:    ☐ Index sesuai pola query         ☐ EXPLAIN (ANALYZE, BUFFERS) sudah dicek
Konsistensi: ☐ Transaksi multi-langkah         ☐ Retry untuk kesalahan serialisasi
Perawatan:   ☐ Autovacuum dipantau             ☐ Statistik (ANALYZE) terbaru
Keamanan:    ☐ Aplikasi tidak memakai superuser ☐ Prepared statement
Operasional: ☐ Backup rutin & sudah diuji restore
```

---

## 📊 Ringkasan Struktur Final

```
🐘 EBOOK DATABASE POSTGRESQL
│
├── 🟢 BAGIAN I    — Fondasi & Setup                        Bab 1  – 3
│   ├── Bab 1  ─ Mengenal PostgreSQL
│   ├── Bab 2  ─ Instalasi & Mengenal psql
│   └── Bab 3  ─ Struktur Logis: Cluster, Database, Schema & Role
│
├── 🔵 BAGIAN II   — SQL Dasar di PostgreSQL                Bab 4  – 6
│   ├── Bab 4  ─ DDL: Tabel & Tipe Data
│   ├── Bab 5  ─ CRUD, RETURNING & Upsert
│   └── Bab 6  ─ Filtering, Fungsi & Tanggal
│
├── 🟡 BAGIAN III  — Relasi & Query Lanjutan                Bab 7  – 10
│   ├── Bab 7  ─ Constraint & Relasi
│   ├── Bab 8  ─ JOIN ⭐
│   ├── Bab 9  ─ Agregasi & Pengelompokan
│   └── Bab 10 ─ Subquery, CTE, Window Function & Fitur Query Khas
│
├── 🟠 BAGIAN IV   — Desain Database                        Bab 11 – 12
│   ├── Bab 11 ─ ERD, Normalisasi & Desain Skema
│   └── Bab 12 ─ Studi Kasus Desain: Toko Online
│
├── 🟣 BAGIAN V    — Fitur Khas PostgreSQL                  Bab 13 – 16
│   ├── Bab 13 ─ JSONB ⭐
│   ├── Bab 14 ─ Array, Enum, Range & Tipe Khusus
│   ├── Bab 15 ─ Full-Text Search & Pencarian Fuzzy
│   └── Bab 16 ─ Extension
│
├── 🔴 BAGIAN VI   — Index, Performa & Transaksi            Bab 17 – 19
│   ├── Bab 17 ─ Index ⭐
│   ├── Bab 18 ─ EXPLAIN & Optimasi Query
│   └── Bab 19 ─ Transaksi, MVCC, Locking & VACUUM ⭐
│
├── ⚙️ BAGIAN VII  — Pemrograman di Database & Skala        Bab 20 – 21
│   ├── Bab 20 ─ View, Function, Trigger & Procedure
│   └── Bab 21 ─ Partisi, Pooling & Skala
│
├── ⚫ BAGIAN VIII — Administrasi & Keamanan                Bab 22 – 23
│   ├── Bab 22 ─ Role, Hak Akses & Keamanan (RLS)
│   └── Bab 23 ─ Backup, Restore, Replikasi & Pemeliharaan
│
└── 🏆 BAGIAN IX   — Integrasi, Migrasi & Project           Bab 24 – 26
    ├── Bab 24 ─ Menghubungkan PostgreSQL ke Aplikasi
    ├── Bab 25 ─ Dari MySQL ke PostgreSQL
    └── Bab 26 ─ Project Akhir: Database Toko Online

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total    :  9 Bagian  |  26 Bab
Prasyarat:  Tidak ada (pemula), dengan jembatan khusus untuk pembaca MySQL
Fokus    :  PostgreSQL 16+ dan fitur khasnya (JSONB, extension, MVCC)
Project  :  Database Toko Online (desain → query → performa → keamanan)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

*Ebook Database PostgreSQL — Dari Nol Sampai Siap Dipakai di Project Nyata*
