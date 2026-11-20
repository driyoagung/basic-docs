---
title: "Bab 13 — JSONB"
---

# 🧩 Bab 13 — JSONB ⭐

> 🎯 **Tujuan Bab:** memakai JSONB untuk data fleksibel tanpa mengorbankan performa dan integritas.

## 13.1 🧱 `JSON` vs `JSONB`

| | `JSON` | `JSONB` |
|---|---|---|
| Penyimpanan | Teks apa adanya | Biner terurai |
| Kecepatan query | Lebih lambat | Lebih cepat |
| Bisa di-index | Tidak langsung | ✅ GIN |
| Urutan key | Dipertahankan | Tidak |
| Duplikat key | Dipertahankan | Tidak |
| Disarankan | Jarang | ✅ Umumnya |

Gunakan `JSONB` kecuali Anda benar-benar perlu menyimpan teks JSON persis seperti aslinya.

## 13.2 🏗️ Membuat Kolom JSONB

```sql
CREATE TABLE products (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama  TEXT NOT NULL,
  attrs JSONB NOT NULL DEFAULT '{}'
);

INSERT INTO products (nama, attrs) VALUES
  ('Laptop', '{"ram": 16, "warna": "hitam", "tags": ["gaming","kerja"]}'),
  ('Kaos',   '{"bahan": "katun", "ukuran": ["M","L","XL"]}');
```

## 13.3 🔍 Operator JSONB

| Operator | Arti | Contoh |
|---|---|---|
| `->` | Ambil nilai JSON | `attrs -> 'warna'` |
| `->>` | Ambil nilai sebagai teks | `attrs ->> 'warna'` |
| `#>` | Ambil path array | `attrs #> '{ukuran,0}'` |
| `#>>` | Ambil path sebagai teks | `attrs #>> '{ukuran,0}'` |
| `@>` | Containment | `attrs @> '{"warna":"hitam"}'` |
| `<@` | Terkandung dalam | `'{"warna":"hitam"}' <@ attrs` |
| `?` | Key ada | `attrs ? 'warna'` |
| `?|` | Salah satu key ada | `attrs ?| array['warna','bahan']` |
| `?&` | Semua key ada | `attrs ?& array['ram','warna']` |
| `||` | Gabung JSONB | `attrs || '{"baru": true}'` |
| `-` | Hapus key | `attrs - 'warna'` |

Contoh:

```sql
SELECT nama, attrs->>'warna' AS warna
FROM products
WHERE attrs @> '{"warna":"hitam"}';
```

## 13.4 🧰 Fungsi JSONB

```sql
SELECT
  jsonb_build_object('id', id, 'nama', nama) AS objek,
  attrs->>'ram' AS ram,
  jsonb_typeof(attrs->'tags') AS tipe_tags,
  jsonb_array_length(attrs->'tags') AS jumlah_tag
FROM products;
```

Mengubah nilai:

```sql
UPDATE products
SET attrs = jsonb_set(attrs, '{warna}', '"putih"')
WHERE id = 1;
```

Menggabung:

```sql
UPDATE products
SET attrs = attrs || '{"garansi": "1 tahun"}'
WHERE id = 1;
```

## 13.5 🧭 JSON Path

```sql
SELECT nama
FROM products
WHERE jsonb_path_exists(
  attrs,
  '$.tags[*] ? (@ == "gaming")'
);
```

Mengambil hasil path:

```sql
SELECT jsonb_path_query(attrs, '$.tags[*]')
FROM products
WHERE id = 1;
```

JSON Path berguna untuk kondisi yang kompleks, tetapi query dengan operator `@>` biasanya lebih mudah dioptimasi.

## 13.6 ⚡ Index GIN

```sql
CREATE INDEX idx_products_attrs ON products USING GIN (attrs);
```

Index GIN mempercepat operator seperti `@>`, `?`, `?|`, dan `?&`.

Untuk satu key yang sering difilter, index ekspresi lebih kecil:

```sql
CREATE INDEX idx_products_warna
  ON products ((attrs->>'warna'));
```

Query harus memakai ekspresi yang sama agar index terpakai:

```sql
SELECT * FROM products WHERE attrs->>'warna' = 'hitam';
```

## 13.7 ⚖️ Kapan JSONB, Kapan Tabel Biasa?

**Gunakan JSONB jika:**

- atribut berbeda-beda antar kategori;
- struktur berubah-ubah;
- jarang di-join;
- dibaca sebagai satu kesatuan.

**Gunakan kolom/tabel biasa jika:**

- sering difilter, diurutkan, atau di-join;
- butuh foreign key;
- integritas dan constraint penting;
- data inti bisnis.

> ⚠️ Jangan menjadikan semua data JSONB. Anda akan kehilangan constraint, relasi, dan kemudahan query.

## 13.8 ✅ Validasi Bentuk JSONB

Database bisa memeriksa tipe dan key wajib:

```sql
ALTER TABLE products
  ADD CONSTRAINT chk_attrs_objek CHECK (jsonb_typeof(attrs) = 'object');

ALTER TABLE products
  ADD CONSTRAINT chk_attrs_warna
  CHECK (attrs ? 'warna' OR NOT (attrs ? 'tags'));
```

Validasi bentuk yang kompleks lebih nyaman di aplikasi (misalnya Zod), tetapi constraint database tetap berguna sebagai pertahanan terakhir.

## 13.9 📤 Menghasilkan JSON dari Query

Berguna untuk API:

```sql
SELECT jsonb_agg(
  jsonb_build_object(
    'id', p.id,
    'nama', p.nama,
    'harga', p.harga,
    'attrs', p.attrs
  )
) AS produk
FROM products p
WHERE p.aktif = TRUE;
```

Atau per order:

```sql
SELECT
  o.id,
  jsonb_build_object(
    'pelanggan', u.nama,
    'total', o.total,
    'items', jsonb_agg(
      jsonb_build_object('produk', oi.nama_produk, 'jumlah', oi.jumlah)
    )
  ) AS data
FROM orders o
JOIN users u       ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, u.nama, o.total;
```

## 13.10 🎬 Studi Kasus: Atribut Produk

```sql
SELECT nama, attrs->>'ram' AS ram, attrs->>'warna' AS warna
FROM products
WHERE attrs @> '{"warna":"hitam"}'
  AND (attrs->>'ram')::int >= 16;
```

Dengan index GIN pada `attrs`, filter containment cepat. Untuk filter numerik yang sering, pertimbangkan kolom biasa atau index ekspresi.

## 📌 Ringkasan

- `JSONB` adalah pilihan utama untuk data JSON di PostgreSQL.
- Operator `@>` dan `?` adalah alat filter yang umum.
- Index GIN mempercepat containment dan keberadaan key.
- Index ekspresi cocok untuk satu key yang sering dipakai.
- JSONB bukan pengganti desain relasional yang baik.

## 🧪 Latihan

1. Buat tabel `products` dengan kolom `attrs JSONB`.
2. Filter produk berdasarkan `warna` memakai `@>`.
3. Tambahkan index GIN dan buktikan dengan `EXPLAIN`.
4. Update satu key memakai `jsonb_set`.
5. Hasilkan array JSONB produk untuk API.

::: tip 💡 Tips
Jika Anda mulai menulis `attrs->>'x'` di banyak query dan join, itu tanda `x` seharusnya menjadi kolom biasa.
:::
