---
title: "Bab 3 — Konsep Database Relasional"
---

# 🧱 Bab 3 — Konsep Database Relasional

> 🎯 **Tujuan Bab:** memahami tabel, baris, kolom, tipe data, primary key, foreign key, relasi, skema, dan ERD — fondasi sebelum menulis SQL.

## 3.1 📋 Tabel, Baris, Kolom, dan Tipe Data

Tabel adalah struktur utama database relasional.

```
users
┌────┬──────┬────────────────┬───────┐
│ id │ nama │ email          │ aktif │
├────┼──────┼────────────────┼───────┤
│ 1  │ Budi │ budi@mail.com  │ 1     │
│ 2  │ Ani  │ ani@mail.com   │ 1     │
│ 3  │ Citra│ citra@mail.com │ 0     │
└────┴──────┴────────────────┴───────┘
```

- **Baris** mewakili satu entitas (satu user).
- **Kolom** mewakili satu atribut.
- **Tipe data** menentukan nilai apa yang boleh masuk.

| Tipe | Contoh | Catatan |
|---|---|---|
| `BIGINT` | `1`, `42` | Bilangan bulat besar, umum untuk ID |
| `VARCHAR(100)` | `'Budi'` | Teks dengan batas panjang |
| `TEXT` | deskripsi panjang | Untuk teks besar |
| `DECIMAL(12,2)` | `150000.00` | Presisi tepat, untuk uang |
| `DATE` | `'2026-01-10'` | Tanggal saja |
| `DATETIME` | `'2026-01-10 14:30:00'` | Tanggal dan waktu |
| `TINYINT(1)` | `1` / `0` | Umum dipakai sebagai boolean |
| `JSON` | `{"warna":"hitam"}` | Data semi-terstruktur |

Memilih tipe data yang tepat sejak awal mencegah masalah seperti uang yang menjadi `150000.00000001` karena memakai `FLOAT`.

## 3.2 🔑 Primary Key

**Primary key** adalah kolom (atau gabungan kolom) yang menjadi identitas unik setiap baris.

Sifat primary key:

- nilainya unik;
- tidak boleh `NULL`;
- biasanya tidak berubah setelah dibuat;
- otomatis memiliki index.

Contoh:

```sql
CREATE TABLE users (
  id    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama  VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE
);
```

`AUTO_INCREMENT` membuat MySQL mengisi `id` secara otomatis.

## 3.3 🔗 Foreign Key

**Foreign key** adalah kolom yang merujuk ke primary key tabel lain. Ia menjaga agar relasi tidak menunjuk ke data yang tidak ada.

```sql
CREATE TABLE orders (
  id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  total   DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Dengan foreign key:

- `orders.user_id` harus ada di `users.id`;
- user yang masih punya order tidak bisa dihapus seenaknya (tergantung aksi referensial);
- integritas data dijaga oleh database, bukan hanya oleh aplikasi.

## 3.4 🔄 Jenis Relasi

### One-to-One (1:1)

Satu baris di tabel A berhubungan dengan satu baris di tabel B.

```
users (1) ──── (1) profiles
```

Contoh: satu user punya satu profil detail.

### One-to-Many (1:N)

Satu baris di tabel A berhubungan dengan banyak baris di tabel B.

```
users (1) ────< orders (N)
```

Contoh: satu user punya banyak order, tetapi satu order hanya milik satu user.

### Many-to-Many (N:N)

Banyak baris di tabel A berhubungan dengan banyak baris di tabel B. Relasi ini membutuhkan **tabel pivot** (tabel penghubung).

```
products (N) >──< order_items >──< orders (N)
```

Contoh: satu order berisi banyak produk, dan satu produk bisa muncul di banyak order. Tabel `order_items` menyimpan `order_id`, `product_id`, `jumlah`, dan `harga_saat_itu`.

## 3.5 🗂️ Skema dan Mengapa Penting

**Skema** adalah definisi struktur: tabel apa saja yang ada, kolomnya, tipe datanya, constraint, dan relasinya.

Skema yang baik:

- mencegah data tidak valid masuk;
- membuat query lebih mudah ditulis;
- mengurangi duplikasi;
- mendokumentasikan aturan bisnis di tempat yang tepat.

Skema yang buruk akan terasa mahal saat data sudah banyak. Inilah alasan Bab 12 dan 13 membahas desain secara khusus.

## 3.6 📐 ERD Sederhana

**ERD (Entity Relationship Diagram)** adalah gambar hubungan antar entitas.

```
users (1) ────< orders (N) >──── order_items (N) >──── products (1)
   Satu user punya banyak order; satu order berisi banyak item;
   tiap item merujuk ke satu produk
```

Cara membacanya:

- kotak = entitas/tabel;
- garis = relasi;
- `1` dan `N` = kardinalitas;
- `<` menunjukkan sisi "banyak".

ERD tidak harus rumit. Bahkan sketsa di kertas sebelum menulis `CREATE TABLE` bisa menyelamatkan berjam-jam perbaikan nanti.

## 📌 Ringkasan

- Tabel terdiri dari baris dan kolom dengan tipe data tertentu.
- Primary key memberi identitas unik; foreign key menjaga relasi.
- Relasi umum: one-to-one, one-to-many, many-to-many (butuh tabel pivot).
- Skema adalah cetak biru database.
- ERD membantu berpikir sebelum menulis SQL.

## 🧪 Latihan

1. Tentukan primary key yang tepat untuk tabel `products`, `orders`, dan `order_items`.
2. Gambarkan relasi one-to-many antara `categories` dan `products`.
3. Mengapa relasi many-to-many membutuhkan tabel pivot? Beri contoh.
4. Pilih tipe data untuk: harga produk, tanggal lahir, status pesanan, dan deskripsi produk.
5. Gambar ERD sederhana untuk fitur "user menulis review produk".

::: tip 💡 Tips
Biasakan menamai kolom foreign key dengan pola `<tabel>_id`, misalnya `user_id`, `product_id`. Konsistensi ini membuat query dan ORM jauh lebih mudah dibaca.
:::
