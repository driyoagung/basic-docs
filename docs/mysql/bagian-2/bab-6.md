---
title: "Bab 6 — CRUD: INSERT, SELECT, UPDATE, DELETE"
---

# 🔄 Bab 6 — CRUD: INSERT, SELECT, UPDATE, DELETE

> 🎯 **Tujuan Bab:** menguasai empat operasi dasar data dan memahami cara melakukannya tanpa merusak database.

## 6.1 ➕ CREATE: `INSERT`

### Satu baris

```sql
INSERT INTO users (nama, email)
VALUES ('Budi', 'budi@mail.com');
```

### Banyak baris sekaligus

```sql
INSERT INTO users (nama, email) VALUES
  ('Ani', 'ani@mail.com'),
  ('Citra', 'citra@mail.com'),
  ('Dewi', 'dewi@mail.com');
```

### `INSERT ... ON DUPLICATE KEY UPDATE`

Gunakan saat data mungkin sudah ada (misalnya berdasarkan `email` unik):

```sql
INSERT INTO users (nama, email, saldo)
VALUES ('Budi', 'budi@mail.com', 50000)
ON DUPLICATE KEY UPDATE
  nama = VALUES(nama),
  saldo = saldo + VALUES(saldo);
```

> 💡 Di MySQL 8.0.20+, `VALUES()` mulai ditinggalkan. Alternatif modern memakai alias:
>
> ```sql
> INSERT INTO users (nama, email, saldo)
> VALUES ('Budi', 'budi@mail.com', 50000) AS baru
> ON DUPLICATE KEY UPDATE
>   nama = baru.nama,
>   saldo = users.saldo + baru.saldo;
> ```

## 6.2 📖 READ: `SELECT`

```sql
SELECT id, nama, email
FROM users
WHERE aktif = 1
ORDER BY nama;
```

### Alias kolom

```sql
SELECT nama AS nama_user, email AS kontak
FROM users;
```

### `DISTINCT`

```sql
SELECT DISTINCT status
FROM orders;
```

### Membatasi kolom

Jangan biasakan `SELECT *` di aplikasi produksi. Ambil kolom yang benar-benar dipakai agar lebih cepat dan tidak membocorkan data sensitif.

## 6.3 ✏️ UPDATE

```sql
UPDATE users
SET saldo = saldo + 50000
WHERE id = 1;
```

### Pola aman sebelum `UPDATE`

Uji dulu dengan `SELECT`:

```sql
SELECT id, nama, saldo
FROM users
WHERE id = 1;
```

Jika hasilnya tepat satu baris yang dimaksud, baru jalankan `UPDATE`.

> ⚠️ **Selalu pakai `WHERE`.** `UPDATE users SET saldo = 0` tanpa `WHERE` akan mengosongkan saldo semua user.

### Update banyak kolom

```sql
UPDATE products
SET harga = harga * 1.1,
    updated_at = NOW()
WHERE kategori_id = 3;
```

## 6.4 🗑️ DELETE

```sql
DELETE FROM users
WHERE id = 1;
```

Pola aman:

```sql
-- 1. Lihat data yang akan dihapus
SELECT * FROM users WHERE id = 1;

-- 2. Cek jumlahnya
SELECT COUNT(*) FROM users WHERE id = 1;

-- 3. Baru hapus
DELETE FROM users WHERE id = 1;
```

> ⚠️ `DELETE FROM users` tanpa `WHERE` menghapus seluruh isi tabel. Foreign key `RESTRICT` bisa menyelamatkan Anda, tetapi jangan bergantung pada itu.

## 6.5 🔁 `REPLACE` vs Upsert

`REPLACE INTO` menghapus baris lama lalu memasukkan baris baru. Efeknya:

- `AUTO_INCREMENT` bisa bertambah;
- trigger `DELETE` ikut berjalan;
- foreign key bisa terpengaruh.

`INSERT ... ON DUPLICATE KEY UPDATE` biasanya lebih aman karena hanya memperbarui kolom yang diminta.

| Perintah | Perilaku |
|---|---|
| `REPLACE` | Hapus + insert ulang |
| `ON DUPLICATE KEY UPDATE` | Update baris yang sudah ada |

## 6.6 🗑️ Soft Delete

Alih-alih menghapus permanen, tandai baris sebagai terhapus:

```sql
ALTER TABLE users
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- "Hapus"
UPDATE users SET deleted_at = NOW() WHERE id = 1;

-- Tampilkan yang aktif saja
SELECT * FROM users WHERE deleted_at IS NULL;
```

Kelebihan:

- data bisa dipulihkan;
- audit trail tetap ada;
- relasi lama tidak putus.

Kekurangan:

- semua query harus menambahkan filter;
- data terus bertambah;
- butuh strategi arsip.

## 6.7 🎬 Studi Kasus: Mengisi Data Toko Online

```sql
INSERT INTO categories (nama) VALUES
  ('Elektronik'),
  ('Fashion'),
  ('Buku');

INSERT INTO products (nama, kategori_id, harga, stok) VALUES
  ('Keyboard Mekanik', 1, 750000, 15),
  ('Kaos Polos', 2, 90000, 50),
  ('Buku SQL Dasar', 3, 120000, 30);

INSERT INTO orders (user_id, total, status) VALUES
  (1, 840000, 'paid'),
  (2, 90000, 'pending');
```

Setelah data masuk, biasakan memeriksa:

```sql
SELECT * FROM products;
SELECT COUNT(*) FROM orders;
```

## 📌 Ringkasan

- `INSERT` menambah, `SELECT` membaca, `UPDATE` mengubah, `DELETE` menghapus.
- Selalu uji dengan `SELECT` sebelum `UPDATE` atau `DELETE`.
- `ON DUPLICATE KEY UPDATE` lebih aman daripada `REPLACE`.
- Soft delete menjaga data tetap bisa dipulihkan.
- Ambil kolom seperlunya, jangan selalu `SELECT *`.

## 🧪 Latihan

1. Tambahkan tiga produk baru ke tabel `products`.
2. Naikkan harga semua produk kategori 1 sebesar 5%.
3. Hapus satu order dengan status `cancelled` setelah memeriksa datanya.
4. Tambahkan kolom `deleted_at` ke `products` dan praktikkan soft delete.
5. Tampilkan nama dan harga produk yang stoknya di bawah 10.

::: tip 💡 Tips
Biasakan menjalankan `SELECT` dengan kondisi yang sama persis sebelum `UPDATE`/`DELETE`. Kebiasaan kecil ini mencegah insiden besar.
:::
