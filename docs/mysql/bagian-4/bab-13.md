---
title: "Bab 13 — Studi Kasus Desain: Toko Online"
---

# 🛒 Bab 13 — Studi Kasus Desain: Toko Online

> 🎯 **Tujuan Bab:** merancang skema toko online langkah demi langkah, dari kebutuhan sampai `CREATE TABLE`, lalu mengevaluasi apakah desainnya menjawab pertanyaan bisnis.

## 13.1 📋 Mengumpulkan Kebutuhan

| Area | Kebutuhan |
|---|---|
| **User** | Daftar, login, profil, banyak alamat |
| **Katalog** | Kategori, produk, gambar, stok, harga |
| **Keranjang** | Satu keranjang aktif per user, banyak item |
| **Pesanan** | Banyak item, snapshot harga, status, alamat pengiriman |
| **Pembayaran** | Metode, status, waktu bayar |
| **Ulasan** | Rating dan komentar per produk |

Pertanyaan bisnis yang harus bisa dijawab:

- Produk apa yang paling laris?
- Berapa omzet per bulan?
- Pelanggan mana yang paling banyak belanja?
- Berapa stok yang tersisa?
- Pesanan mana yang belum dibayar?

## 13.2 🗺️ ERD Langkah demi Langkah

```
users (1) ────< addresses (N)
users (1) ────< orders (N)
users (1) ──── (1) carts
users (1) ────< reviews (N)

categories (1) ────< products (N)
products (1) ────< product_images (N)

carts (1) ────< cart_items (N) >──── products (1)
orders (1) ────< order_items (N) >──── products (1)
orders (1) ────< payments (N)
products (1) ────< reviews (N)
```

Keputusan penting:

- `order_items` menyimpan `harga` dan `nama_produk` sebagai snapshot.
- `orders` menyimpan `total` untuk mempercepat laporan.
- `addresses` dipisah dari `users` karena satu user bisa punya banyak alamat.
- `payments` dipisah karena satu order bisa punya percobaan pembayaran lebih dari satu.

## 13.3 🏗️ Menerjemahkan ERD ke `CREATE TABLE`

```sql
CREATE DATABASE IF NOT EXISTS toko
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE toko;

CREATE TABLE users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  telepon       VARCHAR(30) NULL,
  aktif         TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE addresses (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  label       VARCHAR(50) NOT NULL DEFAULT 'Utama',
  penerima    VARCHAR(100) NOT NULL,
  telepon     VARCHAR(30) NOT NULL,
  alamat      TEXT NOT NULL,
  kota        VARCHAR(100) NOT NULL,
  provinsi    VARCHAR(100) NOT NULL,
  kode_pos    VARCHAR(10) NOT NULL,
  is_default  TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_addresses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE categories (
  id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama      VARCHAR(100) NOT NULL UNIQUE,
  parent_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE products (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kategori_id BIGINT UNSIGNED NOT NULL,
  nama        VARCHAR(150) NOT NULL,
  slug        VARCHAR(180) NOT NULL UNIQUE,
  deskripsi   TEXT NULL,
  harga       DECIMAL(12,2) NOT NULL CHECK (harga >= 0),
  stok        INT NOT NULL DEFAULT 0 CHECK (stok >= 0),
  aktif       TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (kategori_id) REFERENCES categories(id)
    ON DELETE RESTRICT,
  INDEX idx_products_kategori (kategori_id),
  INDEX idx_products_aktif_harga (aktif, harga)
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  path       VARCHAR(255) NOT NULL,
  urutan     INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE carts (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id    BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  jumlah     INT NOT NULL CHECK (jumlah > 0),
  CONSTRAINT fk_cart_items_cart
    FOREIGN KEY (cart_id) REFERENCES carts(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_cart_product (cart_id, product_id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  address_id    BIGINT UNSIGNED NOT NULL,
  total         DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  status        ENUM('pending','paid','shipped','done','cancelled')
                NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_address
    FOREIGN KEY (address_id) REFERENCES addresses(id)
    ON DELETE RESTRICT,
  INDEX idx_orders_user_created (user_id, created_at),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NOT NULL,
  nama_produk   VARCHAR(150) NOT NULL,
  harga         DECIMAL(12,2) NOT NULL CHECK (harga >= 0),
  jumlah        INT NOT NULL CHECK (jumlah > 0),
  CONSTRAINT fk_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT,
  INDEX idx_items_order (order_id),
  INDEX idx_items_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  metode      ENUM('transfer','va','ewallet','cod') NOT NULL,
  jumlah      DECIMAL(12,2) NOT NULL CHECK (jumlah > 0),
  status      ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at     TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE RESTRICT,
  INDEX idx_payments_order (order_id)
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar   TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_review_user_product (user_id, product_id)
) ENGINE=InnoDB;
```

## 13.4 ✅ Mengevaluasi Desain

| Pertanyaan | Jawaban dari Skema |
|---|---|
| Produk terlaris? | `order_items` GROUP BY `product_id` |
| Omzet per bulan? | `orders.total` GROUP BY bulan |
| Pelanggan teratas? | `orders` GROUP BY `user_id` |
| Stok tersisa? | `products.stok` |
| Pesanan belum dibayar? | `orders.status = 'pending'` + `payments` |
| Alamat pengiriman? | `orders.address_id` |

Desain ini menjawab semua pertanyaan awal tanpa mengubah struktur.

## 13.5 📈 Mendesain untuk Pertumbuhan

Saat data membesar:

- **Index** pada kolom yang sering difilter dan diurutkan.
- **Arsip** order lama ke tabel terpisah.
- **Partisi** tabel besar berdasarkan rentang tanggal (pengenalan di Bab 18).
- **Read replica** untuk laporan berat.
- **Cache** untuk halaman katalog yang sering dibaca.

Jangan mengoptimasi sebelum ada bukti. Ukur dulu dengan `EXPLAIN` dan slow query log.

## 📌 Ringkasan

- Kebutuhan bisnis menentukan entitas dan relasi.
- Tabel pivot menyelesaikan many-to-many.
- Snapshot harga dan nama produk di `order_items` melindungi riwayat.
- Index dan foreign key adalah bagian dari desain, bukan tambahan belakangan.
- Desain yang baik menjawab pertanyaan bisnis tanpa query aneh.

## 🧪 Latihan

1. Jalankan seluruh `CREATE TABLE` di atas pada database `toko`.
2. Masukkan dua user, tiga kategori, lima produk, dan satu order lengkap.
3. Tulis query untuk menampilkan isi order beserta nama produk dan subtotal.
4. Tambahkan tabel `wishlists` dan rancang relasinya.
5. Diskusikan apakah `carts.user_id` sebaiknya `UNIQUE`.

::: tip 💡 Tips
Simpan skema final di file `schema.sql` dan masukkan ke version control. Perubahan skema harus melalui migration, bukan edit manual di server produksi.
:::
