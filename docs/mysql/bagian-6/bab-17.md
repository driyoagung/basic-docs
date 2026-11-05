---
title: "Bab 17 — View, Stored Procedure, Function, Trigger & Event"
---

# 🧰 Bab 17 — View, Stored Procedure, Function, Trigger & Event

> 🎯 **Tujuan Bab:** mengenal fitur logika di dalam database, memahami kapan menggunakannya, dan kapan sebaiknya logika tetap di aplikasi.

## 17.1 👁️ View

View adalah query tersimpan yang tampil seperti tabel virtual.

```sql
CREATE VIEW v_ringkasan_order AS
SELECT
  o.id            AS order_id,
  u.nama          AS pelanggan,
  o.total,
  o.status,
  DATE(o.created_at) AS tanggal
FROM orders o
JOIN users u ON u.id = o.user_id;
```

Pemakaian:

```sql
SELECT * FROM v_ringkasan_order
WHERE status = 'paid';
```

Manfaat:

- menyederhanakan query kompleks;
- memberi lapisan abstraksi;
- membatasi kolom yang terlihat.

Batasan:

- view tidak menyimpan data (kecuali materialized view, yang tidak ada secara native di MySQL);
- performa tetap bergantung pada query di dalamnya;
- view bertingkat bisa sulit di-debug.

## 17.2 ⚙️ Stored Procedure

Stored procedure adalah kumpulan pernyataan SQL yang disimpan di server.

```sql
DELIMITER //

CREATE PROCEDURE tambah_stok(
  IN p_product_id BIGINT UNSIGNED,
  IN p_jumlah INT
)
BEGIN
  UPDATE products
  SET stok = stok + p_jumlah
  WHERE id = p_product_id;
END //

DELIMITER ;
```

Memanggil:

```sql
CALL tambah_stok(1, 10);
```

Parameter:

| Jenis | Arti |
|---|---|
| `IN` | Masukan |
| `OUT` | Keluaran |
| `INOUT` | Masukan sekaligus keluaran |

## 17.3 🔢 Stored Function

Function mengembalikan satu nilai dan bisa dipakai di dalam query.

```sql
DELIMITER //

CREATE FUNCTION harga_setelah_pajak(
  p_harga DECIMAL(12,2),
  p_persen DECIMAL(5,2)
)
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
  RETURN ROUND(p_harga * (1 + p_persen / 100), 2);
END //

DELIMITER ;
```

```sql
SELECT nama, harga_setelah_pajak(harga, 11) AS harga_pajak
FROM products;
```

> 💡 Function bisa membuat index tidak terpakai jika dipakai pada kolom di `WHERE`. Gunakan dengan bijak.

## 17.4 ⚡ Trigger

Trigger menjalankan aksi otomatis saat `INSERT`, `UPDATE`, atau `DELETE`.

Contoh audit stok:

```sql
CREATE TABLE stok_audit (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  perubahan  INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DELIMITER //

CREATE TRIGGER trg_order_item_after_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET stok = stok - NEW.jumlah
  WHERE id = NEW.product_id;

  INSERT INTO stok_audit (product_id, perubahan)
  VALUES (NEW.product_id, -NEW.jumlah);
END //

DELIMITER ;
```

Trigger berguna untuk audit dan aturan yang harus selalu berjalan. Tetapi:

- efeknya tersembunyi;
- sulit di-debug;
- bisa memicu trigger lain;
- tidak terlihat di kode aplikasi.

## 17.5 ⏰ Event Scheduler

Event menjalankan tugas terjadwal di dalam MySQL.

```sql
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS ev_hapus_cart_lama
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM carts
  WHERE created_at < NOW() - INTERVAL 30 DAY;
```

Gunakan event untuk pembersihan rutin sederhana. Untuk orkestrasi yang kompleks, scheduler aplikasi atau cron biasanya lebih mudah dipantau.

## 17.6 ⚖️ Logika di Database vs Aplikasi

| Aspek | Di Database | Di Aplikasi |
|---|---|---|
| Konsistensi lintas aplikasi | Kuat | Tergantung setiap aplikasi |
| Kemudahan debugging | Sulit | Lebih mudah |
| Version control | Terbatas | Baik |
| Testing | Sulit | Baik |
| Performa dekat data | Baik | Butuh round-trip |

Pedoman praktis:

- gunakan constraint dan foreign key di database;
- gunakan trigger untuk audit yang tidak boleh terlewat;
- simpan logika bisnis utama di aplikasi;
- hindari trigger yang mengubah banyak tabel secara tersembunyi.

## 17.7 🚫 Kapan Menghindari Trigger

Hindari trigger jika:

- logika sering berubah;
- ada banyak alur yang harus dipahami;
- trigger memanggil prosedur kompleks;
- debugging menjadi mimpi buruk karena efeknya tidak terlihat.

Alternatif: jalankan logika di service aplikasi dalam transaksi yang sama.

## 📌 Ringkasan

- View menyederhanakan query dan memberi abstraksi.
- Stored procedure/function menyimpan logika di server.
- Trigger cocok untuk audit dan aturan yang harus selalu berjalan.
- Event scheduler untuk tugas terjadwal sederhana.
- Logika bisnis utama umumnya lebih baik di aplikasi.

## 🧪 Latihan

1. Buat view `v_produk_aktif` yang hanya menampilkan produk aktif.
2. Buat stored procedure untuk menambah stok.
3. Buat function untuk menghitung harga setelah diskon.
4. Buat trigger audit saat harga produk berubah.
5. Diskusikan mengapa trigger stok bisa berbahaya jika aplikasi juga mengurangi stok.

::: tip 💡 Tips
Jika trigger dan aplikasi sama-sama mengubah data yang sama, Anda akan mengalami pengurangan ganda. Tentukan satu sumber kebenaran untuk setiap aturan.
:::
