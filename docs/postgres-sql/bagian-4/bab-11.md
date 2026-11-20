---
title: "Bab 11 — ERD, Normalisasi & Desain Skema"
---

# 📐 Bab 11 — ERD, Normalisasi & Desain Skema

> 🎯 **Tujuan Bab:** menerjemahkan kebutuhan bisnis menjadi entitas, relasi, dan skema PostgreSQL yang sehat.

## 11.1 🧠 Dari Kebutuhan ke Entitas

Mulai dari pertanyaan bisnis:

- Siapa yang membeli? → `users`
- Apa yang dibeli? → `products`
- Bagaimana pengelompokannya? → `categories`
- Di mana pesanannya? → `orders`, `order_items`
- Bagaimana pembayarannya? → `payments`
- Bagaimana ulasannya? → `reviews`

Setiap **kata benda** yang penting biasanya menjadi entitas. Setiap **kata kerja** biasanya menjadi relasi.

## 11.2 🗺️ ERD & Kardinalitas

| Kardinalitas | Contoh |
|---|---|
| **1 : 1** | User ↔ profil |
| **1 : N** | User → orders |
| **N : M** | Products ↔ categories |

ERD membantu melihat:

- primary key tiap entitas;
- foreign key;
- tabel pivot untuk N:M;
- atribut yang benar-benar milik entitas.

## 11.3 🧹 Normalisasi

### 1NF — Nilai Atomik

Jangan menyimpan banyak nilai dalam satu kolom.

```
❌ telepon: "0811, 0812, 0813"
✅ tabel user_phones(user_id, nomor)
```

### 2NF — Bergantung pada Seluruh Key

Pada composite key, atribut harus bergantung pada seluruh key, bukan sebagian.

```
❌ order_items(order_id, product_id, nama_produk, harga)
```

`nama_produk` dan `harga` bergantung pada `product_id`, bukan pasangan key. Simpan snapshot harga di `order_items` **dengan sengaja** (lihat 11.4), tetapi nama produk sebaiknya diambil dari `products` atau disalin sebagai snapshot yang jelas tujuannya.

### 3NF — Tidak Ada Ketergantungan Transitif

```
❌ products(id, nama, kategori_id, nama_kategori)
✅ products(id, nama, kategori_id) + categories(id, nama)
```

## 11.4 🎯 Denormalisasi yang Disengaja

Normalisasi bukan tujuan akhir. Kadang denormalisasi masuk akal:

| Kasus | Alasan |
|---|---|
| `orders.total` | Menghindari menjumlah ulang setiap saat |
| `order_items.harga` | Snapshot harga saat transaksi |
| `order_items.nama_produk` | Riwayat tetap benar meski produk berubah |
| `products.jumlah_terjual` | Mempercepat laporan (dengan risiko konsistensi) |

Kuncinya: **sengaja**, terdokumentasi, dan ada mekanisme menjaga konsistensi.

## 11.5 🧩 Fitur PostgreSQL yang Memengaruhi Desain

| Fitur | Kapan Dipakai |
|---|---|
| **JSONB** | Atribut produk yang berbeda-beda |
| **Array** | Daftar kecil yang jarang difilter |
| **ENUM** | Nilai status yang stabil |
| **Domain** | Tipe dengan constraint berulang |
| **Schema** | Memisahkan `app`, `reporting`, `audit` |

Contoh domain:

```sql
CREATE DOMAIN harga_rupiah AS NUMERIC(12,2)
  CHECK (VALUE >= 0);

CREATE TABLE products (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama  TEXT NOT NULL,
  harga harga_rupiah NOT NULL
);
```

## 11.6 🧱 Pola Umum

### Status

```sql
status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending','paid','shipped','done','cancelled'))
```

### Soft Delete

```sql
deleted_at TIMESTAMPTZ NULL
```

Query default menambahkan `WHERE deleted_at IS NULL`. Ingat: data tetap ada dan memengaruhi index.

### Audit Log

```sql
CREATE TABLE audit_log (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabel      TEXT NOT NULL,
  aksi       TEXT NOT NULL,
  data_lama  JSONB,
  data_baru  JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `created_at` / `updated_at`

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

## 11.7 ⚠️ Tidak Ada `ON UPDATE CURRENT_TIMESTAMP`

MySQL punya `ON UPDATE CURRENT_TIMESTAMP`. PostgreSQL tidak. Gunakan trigger:

```sql
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

Alternatif: aplikasi selalu mengisi `updated_at`. Pilih satu pendekatan dan konsisten.

## 11.8 🚫 Kesalahan Desain yang Sering Terjadi

| Kesalahan | Dampak |
|---|---|
| Tidak ada foreign key | Data yatim dan tidak konsisten |
| Menyimpan CSV di satu kolom | Sulit difilter dan di-join |
| Semua data JSONB | Kehilangan constraint dan relasi |
| Uang memakai `FLOAT` | Pembulatan salah |
| Waktu memakai `TIMESTAMP` | Zona waktu kacau |
| Status berupa teks bebas | Nilai tidak konsisten |
| Tidak ada index pada FK | Join dan delete lambat |

## 11.9 🧪 Praktik: Evaluasi Desain

Pertanyaan yang harus bisa dijawab skema Anda:

1. Siapa pelanggan dengan total belanja terbesar?
2. Produk apa yang paling laris bulan lalu?
3. Berapa omzet per kategori?
4. Apakah ada order tanpa pembayaran?
5. Berapa stok tersisa per produk?

Jika satu pertanyaan membutuhkan query yang sangat aneh, pertimbangkan ulang desain.

## 📌 Ringkasan

- Entitas berasal dari kata benda penting dalam kebutuhan bisnis.
- Normalisasi mengurangi duplikasi dan anomali.
- Denormalisasi boleh, asal disengaja dan dijaga.
- PostgreSQL menyediakan JSONB, array, enum, domain, dan schema.
- Foreign key, tipe data tepat, dan index pada FK adalah fondasi.

## 🧪 Latihan

1. Gambar ERD sederhana untuk toko online.
2. Normalisasi tabel yang menyimpan kategori sebagai teks berulang.
3. Buat domain `harga_rupiah` dan pakai di tabel produk.
4. Buat trigger `updated_at` untuk tabel `products`.
5. Sebutkan tiga kesalahan desain dan cara menghindarinya.

::: tip 💡 Tips
Desain skema adalah investasi jangka panjang. Luangkan waktu di awal; perubahan tipe data dan relasi setelah data besar jauh lebih mahal.
:::
