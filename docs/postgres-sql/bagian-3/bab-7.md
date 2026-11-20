---
title: "Bab 7 — Constraint & Relasi"
---

# 🔐 Bab 7 — Constraint & Relasi

> 🎯 **Tujuan Bab:** menjaga integritas data dengan constraint dan merancang relasi antar tabel yang benar.

## 7.1 🧱 Jenis Constraint

| Constraint | Fungsi |
|---|---|
| `NOT NULL` | Kolom wajib berisi |
| `UNIQUE` | Tidak boleh duplikat |
| `DEFAULT` | Nilai otomatis |
| `CHECK` | Aturan nilai |
| `PRIMARY KEY` | Identitas unik baris |
| `FOREIGN KEY` | Relasi ke tabel lain |

Contoh lengkap:

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

## 7.2 🔗 Aksi Referensial

| Aksi | Perilaku saat induk dihapus/diubah |
|---|---|
| `RESTRICT` | Tolak jika masih ada anak |
| `NO ACTION` | Seperti `RESTRICT`, dicek di akhir transaksi |
| `CASCADE` | Hapus/ubah anak ikut |
| `SET NULL` | Set kolom anak menjadi NULL |
| `SET DEFAULT` | Set kolom anak ke nilai default |

```sql
CREATE TABLE order_items (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT
);
```

> ⚠️ `CASCADE` memudahkan, tetapi juga berbahaya. Pastikan Anda benar-benar ingin data anak ikut terhapus.

## 7.3 🔄 One-to-Many & Many-to-Many

**One-to-many:** satu user punya banyak order.

```sql
CREATE TABLE orders (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id)
);
```

**Many-to-many:** produk punya banyak kategori, kategori punya banyak produk.

```sql
CREATE TABLE product_categories (
  product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
```

Tabel pivot memakai **composite primary key** untuk mencegah duplikasi pasangan.

## 7.4 🆔 Identity vs UUID

| Aspek | `IDENTITY` | `UUID` |
|---|---|---|
| Ukuran | 4/8 byte | 16 byte |
| Urutan | Alami meningkat | Acak (kecuali UUID v7) |
| Index | Lebih padat | Lebih besar |
| Keamanan | Mudah ditebak | Sulit ditebak |
| Cocok untuk | Kebanyakan tabel | ID publik, sistem terdistribusi |

Membuat UUID:

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL
);
```

`gen_random_uuid()` tersedia di PostgreSQL modern tanpa extension tambahan.

> 💡 UUID acak membuat index kurang ramah untuk insert berat. Untuk skala besar, pertimbangkan UUID yang berurutan waktu.

## 7.5 🧩 Composite Key & UNIQUE Gabungan

```sql
CREATE TABLE stok_gudang (
  gudang_id  BIGINT NOT NULL REFERENCES gudang(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  jumlah     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (gudang_id, product_id)
);
```

`UNIQUE` pada beberapa kolom:

```sql
ALTER TABLE users
  ADD CONSTRAINT uq_users_email_tenant UNIQUE (tenant_id, email);
```

## 7.6 🚫 `EXCLUDE`: Mencegah Tumpang Tindih

`EXCLUDE` memastikan tidak ada dua baris yang memenuhi kondisi tertentu. Contoh klasik: booking ruangan yang tidak boleh bentrok.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id BIGINT NOT NULL,
  periode TSTZRANGE NOT NULL,
  EXCLUDE USING gist (room_id WITH =, periode WITH &&)
);
```

`&&` berarti "overlap". Database akan menolak booking yang waktunya bertabrakan di ruangan yang sama.

## 7.7 ⏳ Constraint `DEFERRABLE`

Secara default, constraint dicek segera. `DEFERRABLE` memungkinkan pengecekan ditunda sampai akhir transaksi.

```sql
ALTER TABLE order_items
  ADD CONSTRAINT fk_order
  FOREIGN KEY (order_id) REFERENCES orders(id)
  DEFERRABLE INITIALLY DEFERRED;
```

Berguna saat urutan insert sulit diatur dalam satu transaksi.

## 7.8 🧱 Menambah Constraint ke Tabel Berisi Data

Untuk tabel besar, hindari lock panjang:

```sql
ALTER TABLE orders
  ADD CONSTRAINT chk_total_positif CHECK (total >= 0) NOT VALID;

ALTER TABLE orders VALIDATE CONSTRAINT chk_total_positif;
```

`NOT VALID` menambahkan aturan untuk baris baru tanpa memeriksa seluruh tabel. `VALIDATE` memeriksa data lama dengan lock yang lebih ringan.

## 7.9 🧪 Praktik

```sql
CREATE TABLE categories (
  id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kategori_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  nama        TEXT NOT NULL,
  sku         TEXT NOT NULL UNIQUE,
  harga       NUMERIC(12,2) NOT NULL CHECK (harga >= 0),
  stok        INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0)
);

INSERT INTO categories (nama) VALUES ('Elektronik'), ('Fashion');
INSERT INTO products (kategori_id, nama, sku, harga, stok)
VALUES (1, 'Keyboard', 'KB-001', 750000, 10);
```

Coba langgar constraint:

```sql
INSERT INTO products (kategori_id, nama, sku, harga, stok)
VALUES (999, 'Tidak Ada', 'XX-001', 1000, 1);
-- ERROR: foreign key violation
```

## 📌 Ringkasan

- Constraint adalah pertahanan terakhir integritas data.
- Pilih aksi referensial sesuai dampak yang diinginkan.
- Tabel pivot menyelesaikan relasi many-to-many.
- `EXCLUDE` sangat kuat untuk mencegah jadwal bentrok.
- `NOT VALID` + `VALIDATE` membantu menambah constraint pada tabel besar.

## 🧪 Latihan

1. Buat tabel `orders` dengan foreign key ke `users`.
2. Buat tabel pivot `product_categories`.
3. Tambahkan `CHECK` agar harga tidak negatif.
4. Buat tabel booking dengan `EXCLUDE` agar jadwal tidak bentrok.
5. Tambahkan constraint ke tabel berisi data memakai `NOT VALID`.

::: tip 💡 Tips
Jangan mengganti foreign key dengan validasi di aplikasi saja. Aplikasi bisa punya bug; constraint database tetap menjaga data.
:::
