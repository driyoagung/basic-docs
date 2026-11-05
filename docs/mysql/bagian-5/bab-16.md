---
title: "Bab 16 — Transaksi, ACID & Locking"
---

# 🔒 Bab 16 — Transaksi, ACID & Locking ⭐

> 🎯 **Tujuan Bab:** menjaga data tetap konsisten saat beberapa operasi dan pengguna berjalan bersamaan.

## 16.1 🔒 Transaksi

Transaksi adalah satu unit kerja yang harus berhasil seluruhnya atau gagal seluruhnya.

```sql
START TRANSACTION;

UPDATE accounts SET saldo = saldo - 100000 WHERE id = 1;
UPDATE accounts SET saldo = saldo + 100000 WHERE id = 2;

COMMIT;
```

Jika ada masalah:

```sql
ROLLBACK;
```

Contoh nyata: transfer saldo. Tidak boleh saldo terpotong dari pengirim tetapi tidak masuk ke penerima.

## 16.2 🧱 ACID

| Huruf | Arti | Penjelasan |
|---|---|---|
| **A** | Atomicity | Semua operasi berhasil atau semua dibatalkan |
| **C** | Consistency | Data tetap memenuhi aturan/constraint |
| **I** | Isolation | Transaksi tidak saling mengganggu secara sembarangan |
| **D** | Durability | Data yang sudah `COMMIT` tetap ada meskipun server mati |

## 16.3 🎛️ `COMMIT`, `ROLLBACK`, `SAVEPOINT`

```sql
START TRANSACTION;

UPDATE products SET stok = stok - 1 WHERE id = 1;

SAVEPOINT setelah_kurangi_stok;

UPDATE orders SET status = 'paid' WHERE id = 10;

-- Batalkan hanya langkah terakhir
ROLLBACK TO SAVEPOINT setelah_kurangi_stok;

COMMIT;
```

`autocommit` menentukan apakah setiap perintah langsung disimpan:

```sql
SHOW VARIABLES LIKE 'autocommit';
```

Saat `autocommit = 1` (default), setiap `INSERT`/`UPDATE` langsung permanen kecuali Anda membuka transaksi eksplisit.

## 16.4 🗄️ Storage Engine

| Engine | Transaksi | Foreign Key | Catatan |
|---|---|---|---|
| **InnoDB** | ✅ | ✅ | Default MySQL modern |
| **MyISAM** | ❌ | ❌ | Lama, tidak cocok untuk transaksi |

Selalu gunakan **InnoDB** untuk aplikasi modern.

## 16.5 🔀 Isolation Level

| Level | Perilaku |
|---|---|
| `READ UNCOMMITTED` | Bisa membaca data yang belum di-commit |
| `READ COMMITTED` | Hanya membaca data yang sudah di-commit |
| `REPEATABLE READ` | Default InnoDB; hasil baca konsisten dalam transaksi |
| `SERIALIZABLE` | Paling ketat, paling banyak locking |

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

## 16.6 ⚠️ Masalah Konkurensi

| Masalah | Arti |
|---|---|
| **Dirty read** | Membaca data yang belum di-commit |
| **Non-repeatable read** | Data yang sama berubah saat dibaca ulang |
| **Phantom read** | Muncul baris baru yang cocok dengan kondisi |

Isolation level mengatur kompromi antara konsistensi dan konkurensi.

## 16.7 🔐 Lock & `SELECT ... FOR UPDATE`

Lock mencegah dua transaksi mengubah baris yang sama secara bersamaan.

```sql
START TRANSACTION;

SELECT stok
FROM products
WHERE id = 1
FOR UPDATE;

-- Jika stok cukup
UPDATE products SET stok = stok - 1 WHERE id = 1;

COMMIT;
```

`FOR UPDATE` mengunci baris sampai transaksi selesai. Tanpa ini, dua checkout bisa membaca stok yang sama dan menyebabkan **overselling**.

## 16.8 💥 Deadlock

Deadlock terjadi saat dua transaksi saling menunggu lock yang dipegang pihak lain.

```
Transaksi A: lock baris 1 → menunggu baris 2
Transaksi B: lock baris 2 → menunggu baris 1
```

MySQL mendeteksi deadlock dan membatalkan salah satu transaksi. Cara mengurangi:

- akses baris dalam urutan yang konsisten;
- jaga transaksi tetap singkat;
- hindari menunggu input pengguna di tengah transaksi;
- gunakan index agar lock tidak melebar.

## 16.9 🎬 Studi Kasus: Checkout Tanpa Race Condition

```sql
START TRANSACTION;

SELECT stok
FROM products
WHERE id = 1
FOR UPDATE;

-- Aplikasi memeriksa stok di sini
UPDATE products
SET stok = stok - 1
WHERE id = 1 AND stok >= 1;

INSERT INTO order_items (order_id, product_id, nama_produk, harga, jumlah)
VALUES (10, 1, 'Keyboard Mekanik', 750000, 1);

UPDATE orders SET total = total + 750000 WHERE id = 10;

COMMIT;
```

Jika stok tidak cukup, `ROLLBACK` dan kembalikan pesan ke pengguna.

## 📌 Ringkasan

- Transaksi menjaga operasi multi-langkah tetap konsisten.
- ACID adalah jaminan utama database relasional.
- InnoDB mendukung transaksi dan foreign key.
- Isolation level mengatur kompromi konsistensi vs konkurensi.
- `SELECT ... FOR UPDATE` mencegah overselling.
- Deadlock dikurangi dengan urutan akses yang konsisten dan transaksi singkat.

## 🧪 Latihan

1. Tulis transaksi transfer saldo antar dua akun.
2. Praktikkan `SAVEPOINT` dan `ROLLBACK TO SAVEPOINT`.
3. Simulasikan dua transaksi checkout yang berebut stok.
4. Jelaskan perbedaan dirty read dan phantom read.
5. Sebutkan tiga cara mengurangi deadlock.

::: tip 💡 Tips
Jangan menaruh panggilan API eksternal atau menunggu input pengguna di dalam transaksi. Semakin lama transaksi terbuka, semakin besar peluang lock dan deadlock.
:::
