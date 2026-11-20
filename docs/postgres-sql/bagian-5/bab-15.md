---
title: "Bab 15 — Full-Text Search & Pencarian Fuzzy"
---

# 🔤 Bab 15 — Full-Text Search & Pencarian Fuzzy

> 🎯 **Tujuan Bab:** membangun pencarian teks yang relevan dan toleran terhadap typo tanpa langsung memindahkan semuanya ke search engine.

## 15.1 ❌ Mengapa `LIKE '%kata%'` Tidak Cukup

```sql
SELECT * FROM products WHERE deskripsi LIKE '%keyboard mekanik%';
```

Masalahnya:

- tidak memahami kata dasar (stemming);
- tidak memberi peringkat relevansi;
- tidak toleran typo;
- `%kata%` tidak bisa memakai index B-Tree biasa;
- hasil bisa lambat pada tabel besar.

## 15.2 🧠 `tsvector` dan `tsquery`

- **`tsvector`** adalah representasi dokumen yang sudah dipecah menjadi lexeme.
- **`tsquery`** adalah query pencarian.

```sql
SELECT to_tsvector('indonesian', 'Keyboard mekanik dengan switch biru');
```

Hasilnya berisi lexeme seperti `keyboard`, `mekanik`, `switch`, `biru`.

```sql
SELECT to_tsquery('indonesian', 'keyboard & mekanik');
```

## 15.3 🔎 Operator `@@`

```sql
SELECT nama, deskripsi
FROM products
WHERE to_tsvector('indonesian', nama || ' ' || COALESCE(deskripsi, ''))
      @@ plainto_tsquery('indonesian', 'keyboard mekanik');
```

| Fungsi | Kegunaan |
|---|---|
| `to_tsvector(config, text)` | Membuat vektor dari teks |
| `to_tsquery(config, query)` | Query dengan operator `&`, `|`, `!` |
| `plainto_tsquery(config, text)` | Query aman dari input pengguna |
| `websearch_to_tsquery(config, text)` | Mirip pencarian web |
| `phraseto_tsquery(config, text)` | Frasa |

Untuk input pengguna, gunakan `plainto_tsquery` atau `websearch_to_tsquery` agar karakter khusus tidak menjadi error.

## 15.4 🏆 Peringkat & Cuplikan

```sql
SELECT
  nama,
  ts_rank(
    to_tsvector('indonesian', nama || ' ' || COALESCE(deskripsi, '')),
    plainto_tsquery('indonesian', 'keyboard mekanik')
  ) AS skor,
  ts_headline(
    'indonesian',
    deskripsi,
    plainto_tsquery('indonesian', 'keyboard mekanik'),
    'StartSel=<b>, StopSel=</b>'
  ) AS cuplikan
FROM products
WHERE to_tsvector('indonesian', nama || ' ' || COALESCE(deskripsi, ''))
      @@ plainto_tsquery('indonesian', 'keyboard mekanik')
ORDER BY skor DESC;
```

`ts_rank` memberi skor relevansi. `ts_headline` menyorot kata yang cocok.

## 15.5 ⚡ Index GIN & Kolom Generated

Cara paling rapi: simpan `tsvector` di kolom generated.

```sql
ALTER TABLE products
  ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('indonesian', nama || ' ' || COALESCE(deskripsi, ''))
  ) STORED;

CREATE INDEX idx_products_search ON products USING GIN (search_vector);
```

Query menjadi sederhana:

```sql
SELECT nama
FROM products
WHERE search_vector @@ plainto_tsquery('indonesian', 'keyboard mekanik');
```

Cek konfigurasi bahasa yang tersedia:

```sql
\dF
```

Jika `indonesian` tidak tersedia di instalasi Anda, gunakan `simple` atau konfigurasi kustom.

## 15.6 🔤 Pencarian Fuzzy dengan `pg_trgm`

`pg_trgm` memecah teks menjadi trigram dan mendukung pencarian mirip.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT similarity('keyboard', 'keybord');  -- nilai 0..1
```

Filter:

```sql
SELECT nama
FROM products
WHERE nama % 'keybord'
ORDER BY similarity(nama, 'keybord') DESC;
```

Index untuk `LIKE`/`ILIKE`:

```sql
CREATE INDEX idx_products_nama_trgm
  ON products USING GIN (nama gin_trgm_ops);
```

Sekarang `ILIKE '%keyboard%'` bisa memanfaatkan index trigram.

## 15.7 ⚖️ Batasan & Kapan Beralih

Full-text search PostgreSQL cocok untuk:

- katalog produk skala kecil-menengah;
- pencarian internal;
- kebutuhan tanpa infrastruktur tambahan.

Beralih ke Elasticsearch/OpenSearch/Meilisearch ketika:

- butuh faceting dan agregasi pencarian kompleks;
- volume dokumen sangat besar;
- butuh toleransi typo dan sinonim yang canggih;
- butuh fitur bahasa lanjutan.

## 15.8 🎬 Studi Kasus: Kotak Pencarian Produk

```sql
WITH q AS (
  SELECT plainto_tsquery('indonesian', 'keyboard mekanik') AS query
)
SELECT
  p.nama,
  ts_rank(p.search_vector, q.query) AS skor
FROM products p, q
WHERE p.search_vector @@ q.query
ORDER BY skor DESC
LIMIT 20;
```

Jika hasil kosong, fallback ke trigram:

```sql
SELECT nama, similarity(nama, 'keybord') AS skor
FROM products
WHERE nama % 'keybord'
ORDER BY skor DESC
LIMIT 20;
```

## 📌 Ringkasan

- `tsvector`/`tsquery` memahami kata dan memberi peringkat.
- `plainto_tsquery` aman untuk input pengguna.
- Index GIN pada kolom generated membuat pencarian cepat.
- `pg_trgm` menangani typo dan mempercepat `ILIKE`.
- Search engine khusus tetap lebih tepat untuk kebutuhan skala besar.

## 🧪 Latihan

1. Buat kolom `search_vector` generated pada tabel produk.
2. Cari produk dengan `plainto_tsquery`.
3. Tampilkan skor dan cuplikan dengan `ts_rank`/`ts_headline`.
4. Pasang `pg_trgm` dan cari produk dengan typo.
5. Bandingkan hasil full-text dan trigram.

::: tip 💡 Tips
Selalu uji pencarian dengan kata yang benar-benar diketik pengguna: salah ketik, singkatan, dan bahasa campuran. Pencarian yang bagus di contoh belum tentu bagus di dunia nyata.
:::
