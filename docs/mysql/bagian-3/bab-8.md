---
title: "Bab 8 — Constraint & Relasi Antar Tabel"
---

# 🔐 Bab 8 — Constraint & Relasi Antar Tabel

> 🎯 **Tujuan Bab:** menjaga integritas data dengan constraint, memahami aksi foreign key, dan membangun relasi one-to-many serta many-to-many.

## 8.1 🛡️ Constraint

Constraint adalah aturan yang dipaksakan database.

| Constraint | Fungsi |
|---|---|
| `NOT NULL` | Kolom wajib berisi nilai |
| `UNIQUE` | Tidak boleh ada nilai duplikat |
| `DEFAULT` | Nilai otomatis jika tidak diisi |
| `CHECK` | Nilai harus memenuhi kondisi |
| `PRIMARY KEY` | Identitas unik baris |
| `FOREIGN KEY` | Relasi ke tabel lain |

Contoh:

```sql
CREATE TABLE products (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(150) NOT NULL,
  harga       DECIMAL(12,2) NOT NULL CHECK (harga >= 0),
  stok        INT NOT NULL DEFAULT 0 CHECK (stok >= 0),
  kategori_id BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_products_category
    FOREIGN KEY (kategori_id) REFERENCES categories(id)
);
```

`CHECK` mulai benar-benar ditegakkan di MySQL 8.0.16+. Di versi lama, constraint ini diabaikan.

## 8.2 🔗 Aksi Referensial

Saat baris induk dihapus atau diubah, apa yang terjadi pada baris anak?

| Aksi | Perilaku |
|---|---|
| `RESTRICT` | Tolak penghapusan jika masih ada anak |
| `NO ACTION` | Mirip `RESTRICT` di InnoDB |
| `CASCADE` | Ikut hapus / ubah anak |
| `SET NULL` | Set foreign key anak menjadi `NULL` |

```sql
CREATE TABLE order_items (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  jumlah     INT NOT NULL CHECK (jumlah > 0),
  harga      DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT
);
```

> ⚠️ `CASCADE` sangat kuat. Gunakan hanya jika anak memang tidak bermakna tanpa induk. Untuk data transaksi, `RESTRICT` biasanya lebih aman.

## 8.3 🔄 Relasi One-to-Many

```sql
CREATE TABLE orders (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  total      DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  status     ENUM('pending','paid','shipped','done','cancelled')
             NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);
```

Satu user punya banyak order. Setiap order hanya milik satu user.

## 8.4 🔀 Relasi Many-to-Many dengan Tabel Pivot

Produk dan order punya relasi many-to-many. Tabel pivot `order_items` menyimpan detail per item.

```
orders (1) ────< order_items (N) >──── products (1)
```

Mengapa tidak menyimpan `product_id` langsung di `orders`?

- satu order bisa berisi banyak produk;
- jumlah produk per order tidak tetap;
- harga harus disimpan sebagai snapshot;
- kuantitas per produk perlu dicatat.

## 8.5 🔑 Auto-Increment vs UUID

| Aspek | Auto-increment | UUID |
|---|---|---|
| Ukuran | 8 byte (`BIGINT`) | 16 byte (`BINARY(16)`) atau 36 char |
| Urutan | Berurutan, ramah index | Acak, index lebih tersebar |
| Prediksi | Mudah ditebak | Sulit ditebak |
| Distribusi | Butuh koordinasi saat sharding | Bisa dibuat di client |
| Debug | Mudah dibaca | Panjang |

Untuk kebanyakan aplikasi, **auto-increment sudah cukup**. UUID berguna saat ID dibuat di client, data digabung dari banyak sumber, atau ID tidak boleh mudah ditebak.

## 8.6 🧩 Composite Key

Composite key adalah primary key yang terdiri dari dua kolom atau lebih.

```sql
CREATE TABLE product_tags (
  product_id BIGINT UNSIGNED NOT NULL,
  tag_id     BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, tag_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

Composite key mencegah pasangan duplikat dan sering dipakai pada tabel pivot.

## 8.7 ⚖️ Kapan Memakai Foreign Key?

**Pakai foreign key jika:**

- data harus konsisten;
- aplikasi tidak ingin menangani orphan row;
- tim menghargai dokumentasi relasi di database.

**Sebagian tim menghindarinya jika:**

- butuh performa tulis ekstrem;
- melakukan sharding lintas server;
- migrasi data lama yang kotor.

Untuk aplikasi bisnis biasa, foreign key hampir selalu layak dipakai.

## 📌 Ringkasan

- Constraint menjaga kualitas data di tingkat database.
- Aksi referensial menentukan nasib anak saat induk berubah.
- One-to-many memakai foreign key; many-to-many memakai tabel pivot.
- Auto-increment cocok untuk mayoritas aplikasi; UUID untuk kebutuhan khusus.
- Composite key berguna untuk tabel pivot.

## 🧪 Latihan

1. Buat tabel `reviews` dengan foreign key ke `users` dan `products`.
2. Tambahkan `CHECK` agar rating berada di antara 1 dan 5.
3. Buat tabel pivot `product_tags`.
4. Jelaskan kapan `ON DELETE CASCADE` berbahaya.
5. Bandingkan auto-increment dan UUID untuk tabel `orders`.

::: tip 💡 Tips
Selalu beri nama constraint secara eksplisit (`fk_orders_user`, `chk_products_harga`). Nama otomatis MySQL bisa berubah dan menyulitkan migrasi.
:::
