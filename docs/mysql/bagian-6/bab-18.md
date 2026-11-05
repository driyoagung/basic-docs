---
title: "Bab 18 — JSON, Full-Text Search & Fitur Modern"
---

# 🧩 Bab 18 — JSON, Full-Text Search & Fitur Modern

> 🎯 **Tujuan Bab:** memakai tipe JSON secara bijak, membuat generated column yang bisa diindeks, dan mengenal fitur MySQL 8 yang berguna di project nyata.

## 18.1 🧱 Tipe `JSON`

```sql
CREATE TABLE products (
  id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama     VARCHAR(150) NOT NULL,
  atribut  JSON NULL
);

INSERT INTO products (nama, atribut) VALUES
  ('Kaos Polos', '{"warna":"hitam","ukuran":["M","L","XL"],"bahan":"katun"}');
```

Membaca nilai:

```sql
SELECT
  nama,
  atribut->'$.warna'        AS warna_json,
  atribut->>'$.warna'       AS warna_teks,
  JSON_EXTRACT(atribut, '$.bahan') AS bahan
FROM products;
```

| Operator | Hasil |
|---|---|
| `->` | Nilai JSON (bisa dikutip) |
| `->>` | Nilai sebagai teks |

## 18.2 🔎 Memfilter JSON

```sql
SELECT nama
FROM products
WHERE atribut->>'$.warna' = 'hitam';
```

Untuk performa, jangan mengandalkan filter JSON pada kolom besar tanpa index. Solusinya: **generated column** yang diindeks.

## 18.3 🏗️ Generated Column & Index

```sql
ALTER TABLE products
  ADD COLUMN warna VARCHAR(30)
  GENERATED ALWAYS AS (atribut->>'$.warna') STORED;

CREATE INDEX idx_products_warna ON products(warna);
```

Sekarang filter memakai kolom biasa:

```sql
SELECT nama FROM products WHERE warna = 'hitam';
```

| Jenis | Disimpan | Bisa diindeks |
|---|---|---|
| `VIRTUAL` | Tidak | Ya (index di MySQL 8) |
| `STORED` | Ya | Ya |

`STORED` lebih mudah diprediksi; `VIRTUAL` menghemat ruang.

## 18.4 ⚖️ Kapan JSON, Kapan Tabel Biasa?

**Gunakan JSON jika:**

- atribut berbeda-beda antar produk;
- jarang difilter;
- dibaca sebagai satu kesatuan.

**Gunakan tabel/kolom biasa jika:**

- data sering difilter, diurutkan, atau di-join;
- ada relasi kuat;
- integritas data penting.

Contoh buruk: menyimpan seluruh item order dalam satu kolom JSON. Itu menyulitkan laporan dan merusak normalisasi.

## 18.5 🔤 Full-Text Search

Full-text index cocok untuk pencarian kata pada teks panjang.

```sql
ALTER TABLE products
  ADD FULLTEXT INDEX ft_products_nama (nama, deskripsi);

SELECT id, nama
FROM products
WHERE MATCH(nama, deskripsi) AGAINST ('keyboard mekanik' IN NATURAL LANGUAGE MODE);
```

Mode:

| Mode | Perilaku |
|---|---|
| `NATURAL LANGUAGE MODE` | Pencarian bahasa alami |
| `BOOLEAN MODE` | Mendukung operator `+`, `-`, `*` |
| `WITH QUERY EXPANSION` | Memperluas hasil |

Batasan:

- tidak secanggih Elasticsearch;
- aturan stopword dan minimum word length;
- bahasa Indonesia membutuhkan perhatian khusus.

Untuk kebutuhan pencarian skala besar, search engine khusus tetap lebih tepat.

## 18.6 🧮 Fitur Modern MySQL 8

### Invisible Index

Menyembunyikan index dari optimizer tanpa menghapusnya:

```sql
ALTER TABLE products ALTER INDEX idx_products_warna INVISIBLE;
ALTER TABLE products ALTER INDEX idx_products_warna VISIBLE;
```

Berguna untuk menguji dampak penghapusan index dengan aman.

### Descending Index

```sql
CREATE INDEX idx_orders_created_desc
  ON orders(created_at DESC);
```

MySQL 8 mendukung index descending sungguhan, berguna untuk query `ORDER BY ... DESC`.

### `CHECK` Constraint

```sql
ALTER TABLE products
  ADD CONSTRAINT chk_products_harga CHECK (harga >= 0);
```

Ditegakkan sejak MySQL 8.0.16.

## 18.7 🗂️ Partisi Tabel (Pengenalan)

Partisi memecah tabel besar menjadi bagian-bagian berdasarkan aturan.

```sql
CREATE TABLE orders_partisi (
  id         BIGINT UNSIGNED NOT NULL,
  created_at DATE NOT NULL,
  total      DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id, created_at)
)
PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION pmax  VALUES LESS THAN MAXVALUE
);
```

Partisi bukan pengganti index dan tidak selalu mempercepat. Gunakan hanya setelah ada bukti dan pahami batasannya (misalnya foreign key tidak didukung pada tabel terpartisi).

## 📌 Ringkasan

- JSON cocok untuk atribut fleksibel yang jarang difilter.
- Generated column membuat nilai JSON bisa diindeks.
- Full-text index membantu pencarian teks, tetapi bukan pengganti search engine.
- Invisible dan descending index adalah alat tuning yang berguna.
- Partisi adalah opsi lanjutan, bukan solusi otomatis.

## 🧪 Latihan

1. Buat kolom JSON `atribut` dan isi dengan warna serta ukuran.
2. Filter produk berdasarkan warna memakai `->>`.
3. Tambahkan generated column `warna` dan index di atasnya.
4. Buat full-text index pada `nama` dan `deskripsi`, lalu cari "kaos katun".
5. Jelaskan kapan JSON justru menjadi kesalahan desain.

::: tip 💡 Tips
Jika Anda mulai menulis query `JSON_EXTRACT` di banyak tempat, itu tanda data tersebut seharusnya menjadi kolom atau tabel biasa.
:::
