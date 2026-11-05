---
title: "Bab 14 — Index"
---

# 🗂️ Bab 14 — Index ⭐

> 🎯 **Tujuan Bab:** memahami cara kerja index, memilih kolom yang tepat, dan menghindari index yang justru memperlambat.

## 14.1 🔍 Apa itu Index?

> 💡 **Analogi:** index seperti daftar isi di buku. Tanpa daftar isi, Anda harus membaca halaman satu per satu (*full table scan*). Dengan daftar isi, Anda langsung melompat ke halaman yang dicari.

```sql
-- Tanpa index: MySQL memeriksa semua baris
SELECT * FROM orders WHERE user_id = 42;

-- Menambah index
CREATE INDEX idx_orders_user ON orders(user_id);
```

Setelah index dibuat, MySQL bisa menemukan baris yang cocok tanpa memindai seluruh tabel.

## 14.2 🌳 Cara Kerja Index (B-Tree)

InnoDB memakai struktur **B-Tree** untuk index biasa. Secara konseptual:

```
              [50]
            /      \
        [20]        [80]
       /    \      /    \
    [10]  [30]  [60]  [90]
```

Pencarian nilai bergerak dari akar ke daun, mirip pencarian pada kamus. Jumlah langkah tumbuh logaritmik, bukan linear.

Index menyimpan nilai kolom yang diurutkan beserta penunjuk ke baris asli. Karena itu:

- pencarian kesetaraan cepat;
- pencarian rentang cepat;
- pengurutan bisa memanfaatkan index;
- tetapi setiap tulis harus memperbarui index.

## 14.3 🧩 Jenis Index

| Jenis | Kegunaan |
|---|---|
| **Primary** | Identitas unik, otomatis dibuat |
| **Unique** | Mencegah duplikat + mempercepat pencarian |
| **Biasa (non-unique)** | Mempercepat filter/join |
| **Composite** | Beberapa kolom dalam satu index |
| **Full-text** | Pencarian teks (Bab 18) |
| **Prefix** | Sebagian awal kolom teks panjang |

## 14.4 🔢 Composite Index & Aturan Leftmost Prefix

```sql
CREATE INDEX idx_orders_user_status
  ON orders(user_id, status, created_at);
```

Index ini berguna untuk:

- `WHERE user_id = 1`
- `WHERE user_id = 1 AND status = 'paid'`
- `WHERE user_id = 1 AND status = 'paid' AND created_at >= '2026-01-01'`

Index ini **kurang berguna** untuk:

- `WHERE status = 'paid'` (tanpa `user_id`)
- `WHERE created_at >= '2026-01-01'` (tanpa kolom sebelumnya)

Itulah **leftmost prefix**: index dipakai dari kolom paling kiri secara berurutan.

## 14.5 🎯 Covering Index

Covering index terjadi ketika semua kolom yang dibutuhkan query sudah ada di index, sehingga MySQL tidak perlu membaca baris tabel.

```sql
CREATE INDEX idx_products_kategori_harga
  ON products(kategori_id, harga);

SELECT kategori_id, harga
FROM products
WHERE kategori_id = 3;
```

Query di atas bisa dijawab langsung dari index. Ini lebih cepat karena mengurangi I/O.

## 14.6 🚫 Kapan Index Tidak Dipakai

Index sering diabaikan jika:

- kolom dibungkus fungsi: `WHERE YEAR(created_at) = 2026`;
- wildcard di depan: `WHERE nama LIKE '%budi'`;
- tipe data tidak cocok: kolom `VARCHAR` dibandingkan dengan angka;
- selectivity sangat rendah: kolom `aktif` yang hanya berisi 0/1;
- tabel sangat kecil: full scan lebih murah.

Perbaikan untuk kasus fungsi:

```sql
-- ❌ Index tidak dipakai
WHERE YEAR(created_at) = 2026

-- ✅ Index bisa dipakai
WHERE created_at >= '2026-01-01'
  AND created_at <  '2027-01-01'
```

## 14.7 💰 Harga Index

Index tidak gratis:

- memakan ruang disk;
- memperlambat `INSERT`, `UPDATE`, `DELETE`;
- perlu dirawat saat data berubah.

Karena itu, jangan mengindeks semua kolom. Indeks yang baik berasal dari query nyata, bukan tebakan.

## 14.8 🔗 Index pada Foreign Key

InnoDB **tidak otomatis** membuat index pada kolom foreign key (kecuali ada index yang cocok). Padahal join dan pengecekan foreign key sering membutuhkannya.

```sql
CREATE INDEX idx_order_items_product
  ON order_items(product_id);
```

Tanpa index ini, menghapus produk atau join ke produk bisa memindai seluruh `order_items`.

## 14.9 📊 Cardinality & Selektivitas

**Cardinality** adalah jumlah nilai berbeda dalam sebuah kolom.

- `email` punya cardinality tinggi → index sangat berguna.
- `aktif` (0/1) punya cardinality rendah → index sering tidak dipakai.

**Selektivitas** = proporsi baris yang tersaring. Index paling berguna saat query hanya mengambil sebagian kecil baris.

## 14.10 🎬 Contoh Praktis

```sql
-- Query lambat
SELECT id, total
FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 10;
```

Index yang sesuai:

```sql
CREATE INDEX idx_orders_user_created
  ON orders(user_id, created_at);
```

Index ini membantu filter `user_id` sekaligus urutan `created_at`.

## 📌 Ringkasan

- Index mempercepat baca dengan biaya tulis dan ruang.
- B-Tree mendukung pencarian kesetaraan dan rentang.
- Composite index mengikuti aturan leftmost prefix.
- Covering index menghindari pembacaan tabel.
- Fungsi pada kolom dan wildcard di depan membatalkan index.
- Foreign key perlu index eksplisit.

## 🧪 Latihan

1. Buat index untuk query `WHERE status = 'paid' ORDER BY created_at`.
2. Jelaskan mengapa `WHERE status = 'paid'` tidak memakai index `(user_id, status)`.
3. Buat covering index untuk query `SELECT nama, harga FROM products WHERE kategori_id = ?`.
4. Cari query di project Anda yang memakai fungsi pada kolom tanggal dan tulis ulang.
5. Ukur dampak index dengan `EXPLAIN` sebelum dan sesudah.

::: tip 💡 Tips
Buat index berdasarkan query yang benar-benar sering jalan. Setiap index tambahan harus bisa dijelaskan manfaatnya.
:::
