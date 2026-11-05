---
title: "Bab 15 — EXPLAIN & Optimasi Query"
---

# 🚦 Bab 15 — EXPLAIN & Optimasi Query

> 🎯 **Tujuan Bab:** membaca rencana eksekusi MySQL, menemukan query lambat, dan memperbaikinya berdasarkan bukti — bukan tebakan.

## 15.1 🔍 `EXPLAIN`

```sql
EXPLAIN SELECT *
FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 10;
```

Output `EXPLAIN` berisi kolom penting:

| Kolom | Arti |
|---|---|
| `type` | Cara MySQL mengakses tabel |
| `possible_keys` | Index yang mungkin dipakai |
| `key` | Index yang benar-benar dipakai |
| `rows` | Perkiraan baris yang diperiksa |
| `filtered` | Persentase baris lolos filter |
| `Extra` | Informasi tambahan |

### Nilai `type` dari yang terbaik

```
system → const → eq_ref → ref → range → index → ALL
```

- `const` / `eq_ref` — sangat cepat, biasanya lewat primary key.
- `ref` — memakai index non-unique.
- `range` — pencarian rentang.
- `index` — memindai seluruh index.
- `ALL` — full table scan; biasanya perlu diperbaiki.

### `Extra` yang perlu diperhatikan

| Extra | Arti |
|---|---|
| `Using index` | Covering index, bagus |
| `Using where` | Filter setelah akses |
| `Using filesort` | Sorting tambahan, bisa lambat |
| `Using temporary` | Tabel sementara, sering pada `GROUP BY` besar |

## 15.2 ⏱️ `EXPLAIN ANALYZE`

MySQL 8 mendukung `EXPLAIN ANALYZE`, yang benar-benar menjalankan query dan melaporkan waktu aktual.

```sql
EXPLAIN ANALYZE
SELECT u.nama, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.nama;
```

Gunakan ini untuk membandingkan perkiraan `rows` dengan kenyataan. Selisih besar menandakan statistik index perlu diperbarui (`ANALYZE TABLE`).

## 15.3 🐌 Slow Query Log

Aktifkan log query lambat:

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

Lalu periksa file log yang ditunjuk `slow_query_log_file`. Ini cara menemukan query yang benar-benar berdampak, bukan hanya query yang terlihat mencurigakan.

## 15.4 🔁 Masalah N+1 dari Sisi Database

N+1 terjadi saat aplikasi menjalankan satu query untuk daftar, lalu satu query tambahan untuk setiap baris.

```
1 query: SELECT * FROM orders LIMIT 100
100 query: SELECT * FROM users WHERE id = ?  -- satu per order
```

Perbaikan:

- gunakan `JOIN`;
- gunakan eager loading di ORM (`with('user')` di Laravel, `include` di Prisma);
- batasi kolom yang diambil.

Aktifkan query log aplikasi untuk melihat pola ini.

## 15.5 📄 Pagination: `OFFSET` Besar

```sql
-- Makin besar offset, makin lambat
SELECT * FROM orders
ORDER BY id
LIMIT 20 OFFSET 100000;
```

MySQL tetap harus melewati 100.000 baris. Untuk data besar, gunakan **keyset pagination**:

```sql
SELECT *
FROM orders
WHERE id > 100000
ORDER BY id
LIMIT 20;
```

Aplikasi menyimpan `id` terakhir sebagai cursor. Hasilnya jauh lebih cepat dan stabil.

## 15.6 ✂️ Hindari `SELECT *`

```sql
-- ❌ Mengambil semua kolom, termasuk yang tidak perlu
SELECT * FROM products;

-- ✅ Ambil yang dipakai
SELECT id, nama, harga FROM products;
```

Manfaat:

- lebih sedikit data dikirim;
- covering index lebih mungkin;
- data sensitif tidak ikut terbawa.

## 15.7 ⚙️ Tuning Dasar: Buffer Pool InnoDB

InnoDB menyimpan halaman data di **buffer pool**. Jika buffer pool cukup besar, query membaca dari memori, bukan disk.

```sql
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
```

Untuk server khusus database, ukuran buffer pool sering dibuat 50–70% RAM. Jangan mengubahnya tanpa memahami dampaknya ke sistem operasi dan proses lain.

## 15.8 🎬 Studi Kasus: 8 Detik menjadi Milidetik

Query awal:

```sql
SELECT *
FROM orders
WHERE user_id = 42
ORDER BY created_at DESC;
```

Langkah diagnosis:

1. `EXPLAIN` menunjukkan `type: ALL` dan `rows: 500000`.
2. Tidak ada index pada `user_id`.
3. Ditambahkan composite index `(user_id, created_at)`.
4. `EXPLAIN` berubah menjadi `type: ref` dan `rows: 12`.
5. Waktu turun dari 8 detik menjadi beberapa milidetik.

Pelajaran: optimasi dimulai dari pengukuran, bukan dari menambah index acak.

## ✅ Checklist Optimasi

- [ ] Ukur query dengan `EXPLAIN` / `EXPLAIN ANALYZE`
- [ ] Pastikan `type` bukan `ALL` untuk tabel besar
- [ ] Cek `rows` dan `filtered`
- [ ] Hindari fungsi pada kolom yang diindeks
- [ ] Hindari `LIKE '%...'`
- [ ] Batasi kolom dan baris
- [ ] Perbaiki pagination dengan keyset
- [ ] Cek N+1 di query log aplikasi
- [ ] Ukur ulang setelah perubahan

## 📌 Ringkasan

- `EXPLAIN` menunjukkan rencana akses; `EXPLAIN ANALYZE` menunjukkan waktu nyata.
- `type: ALL` pada tabel besar adalah tanda bahaya.
- Slow query log membantu menemukan masalah nyata.
- N+1 dan `OFFSET` besar adalah penyebab umum kelambatan.
- Optimasi harus diukur sebelum dan sesudah.

## 🧪 Latihan

1. Jalankan `EXPLAIN` pada query filter `user_id` dan baca kolom `type`, `key`, `rows`.
2. Bandingkan `OFFSET` besar dengan keyset pagination.
3. Temukan satu query N+1 di project Anda dan perbaiki dengan join/eager loading.
4. Aktifkan slow query log dan cari satu query lambat.
5. Tulis ulang query yang memakai `YEAR(created_at)` agar memakai index.

::: tip 💡 Tips
Simpan output `EXPLAIN` sebelum dan sesudah optimasi. Angka `rows` yang turun drastis adalah bukti yang jauh lebih kuat daripada perasaan "sepertinya lebih cepat".
:::
