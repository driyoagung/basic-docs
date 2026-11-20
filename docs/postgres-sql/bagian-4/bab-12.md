---
title: "Bab 12 — Studi Kasus Desain: Toko Online"
---

# 🛒 Bab 12 — Studi Kasus Desain: Toko Online

> 🎯 **Tujuan Bab:** menerjemahkan ERD toko online menjadi skema PostgreSQL lengkap yang siap dipakai.

## 12.1 📋 Kebutuhan

| Area | Entitas |
|---|---|
| Pengguna | `users`, `addresses` |
| Katalog | `categories`, `products`, `product_images` |
| Keranjang | `carts`, `cart_items` |
| Pesanan | `orders`, `order_items`, `payments` |
| Ulasan | `reviews` |

Aturan bisnis utama:

- satu user punya banyak alamat;
- satu produk punya satu kategori utama;
- satu user punya satu keranjang aktif;
- order menyimpan snapshot harga;
- pembayaran bisa beberapa percobaan;
- ulasan unik per user per produk.

## 12.2 🧱 Skema Dasar

```sql
CREATE DATABASE toko;
\c toko
```

### Users

```sql
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  telepon       TEXT,
  aktif         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Addresses

```sql
CREATE TABLE addresses (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL DEFAULT 'utama',
  penerima   TEXT NOT NULL,
  telepon    TEXT NOT NULL,
  alamat     TEXT NOT NULL,
  kota       TEXT NOT NULL,
  provinsi   TEXT NOT NULL,
  kode_pos   TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
```

### Categories

```sql
CREATE TABLE categories (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  nama      TEXT NOT NULL,
  slug      TEXT NOT NULL UNIQUE
);
```

### Products

```sql
CREATE TABLE products (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kategori_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  nama        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  deskripsi   TEXT,
  harga       NUMERIC(12,2) NOT NULL CHECK (harga >= 0),
  stok        INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
  aktif       BOOLEAN NOT NULL DEFAULT TRUE,
  attrs       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_kategori ON products(kategori_id);
CREATE INDEX idx_products_aktif_harga ON products(aktif, harga);
CREATE INDEX idx_products_attrs ON products USING GIN (attrs);
```

### Product Images

```sql
CREATE TABLE product_images (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT,
  urutan     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
```

### Carts

```sql
CREATE TABLE carts (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Cart Items

```sql
CREATE TABLE cart_items (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cart_id    BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  jumlah     INTEGER NOT NULL CHECK (jumlah > 0),
  UNIQUE (cart_id, product_id)
);
```

### Orders

```sql
CREATE TABLE orders (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  address_id  BIGINT REFERENCES addresses(id) ON DELETE SET NULL,
  total       NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','paid','shipped','done','cancelled')),
  catatan     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
```

### Order Items

```sql
CREATE TABLE order_items (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id     BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  nama_produk  TEXT NOT NULL,
  harga        NUMERIC(12,2) NOT NULL CHECK (harga >= 0),
  jumlah       INTEGER NOT NULL CHECK (jumlah > 0),
  UNIQUE (order_id, product_id)
);

CREATE INDEX idx_order_items_product ON order_items(product_id);
```

### Payments

```sql
CREATE TABLE payments (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  metode      TEXT NOT NULL,
  jumlah      NUMERIC(12,2) NOT NULL CHECK (jumlah > 0),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','paid','failed','refunded')),
  referensi   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_order ON payments(order_id);
```

### Reviews

```sql
CREATE TABLE reviews (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
```

## 12.3 ⏱️ Trigger `updated_at`

```sql
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

## 12.4 🧩 JSONB vs Kolom Biasa

Gunakan `attrs JSONB` untuk atribut yang berbeda antar kategori:

```sql
INSERT INTO products (kategori_id, nama, slug, harga, stok, attrs)
VALUES
  (1, 'Laptop 14 inci', 'laptop-14', 12000000, 5,
   '{"ram": 16, "storage": "512GB SSD", "warna": "hitam"}'),
  (2, 'Kaos Polos', 'kaos-polos', 90000, 100,
   '{"bahan": "katun", "ukuran": ["M","L","XL"]}');
```

Jangan memindahkan `harga`, `stok`, atau `kategori_id` ke JSONB. Kolom yang sering difilter dan di-join harus tetap kolom biasa.

## 12.5 🌱 Seed Data

```sql
INSERT INTO categories (nama, slug) VALUES
  ('Elektronik', 'elektronik'),
  ('Fashion', 'fashion'),
  ('Buku', 'buku');

INSERT INTO users (nama, email, password_hash) VALUES
  ('Budi', 'budi@mail.com', 'x'),
  ('Sari', 'sari@mail.com', 'x');
```

Untuk data besar, gunakan `generate_series`:

```sql
INSERT INTO users (nama, email, password_hash)
SELECT
  'User ' || i,
  'user' || i || '@mail.com',
  'x'
FROM generate_series(1, 1000) AS i;
```

## 12.6 🔍 Evaluasi Desain

Coba jawab pertanyaan berikut dengan skema ini:

1. Berapa omzet bulan ini?
2. Produk apa yang paling laris?
3. Siapa pelanggan dengan belanja terbesar?
4. Berapa order yang belum dibayar?
5. Produk mana yang stoknya menipis?

Jika semua bisa dijawab dengan query wajar, skema sudah berada di jalur yang benar.

## 📌 Ringkasan

- Skema toko online memisahkan katalog, keranjang, pesanan, dan pembayaran.
- Snapshot harga di `order_items` melindungi riwayat transaksi.
- JSONB cocok untuk atribut variatif, bukan untuk kolom inti.
- Foreign key dan index pada kolom relasi wajib.
- Trigger `updated_at` menggantikan `ON UPDATE CURRENT_TIMESTAMP` milik MySQL.

## 🧪 Latihan

1. Jalankan seluruh DDL di bab ini pada database `toko`.
2. Tambahkan seed data untuk 10 produk.
3. Tulis query omzet bulanan.
4. Tulis query produk terlaris.
5. Jelaskan mengapa `order_items.harga` disimpan terpisah dari `products.harga`.

::: tip 💡 Tips
Simpan semua DDL dalam file `schema.sql` dan seed dalam `seed.sql`. Dengan begitu Anda bisa membangun ulang database kapan saja.
:::
