---
title: "Bab 21 — Menghubungkan MySQL ke Aplikasi"
---

# 🔌 Bab 21 — Menghubungkan MySQL ke Aplikasi

> 🎯 **Tujuan Bab:** menghubungkan aplikasi ke MySQL dengan aman, memahami connection pooling, dan memilih antara ORM, query builder, atau raw SQL.

## 21.1 🔄 Alur Koneksi

```
Aplikasi
   │  driver (PDO / mysql2 / JDBC)
   ▼
Koneksi TCP + autentikasi
   ▼
MySQL Server
   │  parser → optimizer → executor
   ▼
Hasil query
```

Driver bertanggung jawab untuk:

- membuka koneksi;
- mengirim query dengan aman;
- mengubah hasil menjadi struktur data aplikasi;
- mengelola transaksi.

## 21.2 🐘 PHP dengan PDO

```php
$dsn = 'mysql:host=127.0.0.1;port=3306;dbname=toko;charset=utf8mb4';

$pdo = new PDO($dsn, 'app_toko', 'password_kuat', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

$stmt = $pdo->prepare('SELECT id, nama, harga FROM products WHERE kategori_id = ?');
$stmt->execute([3]);
$products = $stmt->fetchAll();
```

`ATTR_EMULATE_PREPARES => false` memakai prepared statement asli MySQL, bukan emulasi di sisi PDO.

## 21.3 🟢 Node.js dengan `mysql2`

```js
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'app_toko',
  password: process.env.DB_PASSWORD,
  database: 'toko',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
});

const [rows] = await pool.execute(
  'SELECT id, nama, harga FROM products WHERE kategori_id = ?',
  [3]
);
```

Gunakan `execute` (prepared statement), bukan `query` dengan string yang digabung dari input pengguna.

## 21.4 🏊 Connection Pooling

Membuka koneksi baru untuk setiap request mahal. Connection pool menyimpan koneksi yang bisa dipakai ulang.

| Parameter | Fungsi |
|---|---|
| `connectionLimit` | Jumlah koneksi maksimum |
| `waitForConnections` | Antrekan request jika pool penuh |
| `queueLimit` | Batas antrean |
| `idleTimeout` | Waktu koneksi menganggur |

Aturan praktis:

- sesuaikan pool dengan kapasitas server;
- jangan membuat pool terlalu besar;
- tutup koneksi dengan benar;
- pantau `Threads_connected`.

## 21.5 🧰 ORM vs Query Builder vs Raw SQL

| Pendekatan | Kelebihan | Kekurangan |
|---|---|---|
| **ORM** | Produktif, relasi mudah | Bisa menghasilkan query tak terduga |
| **Query Builder** | Fleksibel, lebih terkontrol | Tetap bisa salah |
| **Raw SQL** | Kontrol penuh, optimal | Rawan injection jika salah |

Pedoman:

- gunakan ORM untuk CRUD umum;
- gunakan query builder untuk query kompleks;
- gunakan raw SQL untuk laporan berat, dengan prepared statement.

## 21.6 🧱 Eloquent & Prisma

### Laravel Eloquent

```php
$orders = Order::with('user')
    ->where('status', 'paid')
    ->latest()
    ->paginate(20);
```

`with('user')` melakukan eager loading untuk menghindari N+1.

### Prisma

```js
const orders = await prisma.order.findMany({
  where: { status: 'paid' },
  include: { user: true },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

Keduanya menghasilkan SQL. Tugas Anda adalah memastikan SQL yang dihasilkan masuk akal.

## 21.7 🔍 Mengintip Query ORM

### Laravel

```php
DB::listen(function ($query) {
    logger($query->sql, $query->bindings);
});
```

Atau gunakan Laravel Debugbar / Telescope.

### Prisma

```js
const prisma = new PrismaClient({ log: ['query'] });
```

Setelah log aktif, cari pola:

```
SELECT * FROM users WHERE id = 1
SELECT * FROM users WHERE id = 2
SELECT * FROM users WHERE id = 3
```

Itu tanda N+1.

## 21.8 🔒 Transaksi dari Aplikasi

### PDO

```php
$pdo->beginTransaction();
try {
    $pdo->prepare('UPDATE products SET stok = stok - ? WHERE id = ?')
        ->execute([1, 1]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}
```

### Prisma

```js
await prisma.$transaction(async (tx) => {
  await tx.product.update({
    where: { id: 1 },
    data: { stok: { decrement: 1 } },
  });
});
```

Pastikan semua operasi yang harus konsisten berada dalam transaksi yang sama.

## ✅ Checklist Integrasi

- [ ] Driver mendukung `utf8mb4`
- [ ] Prepared statement dipakai
- [ ] Connection pool dikonfigurasi
- [ ] Query log aktif saat development
- [ ] N+1 diperiksa
- [ ] Transaksi untuk operasi multi-langkah
- [ ] Kredensial dari environment variable

## 📌 Ringkasan

- Driver menjadi jembatan antara aplikasi dan MySQL.
- Prepared statement melindungi dari SQL injection.
- Connection pool menghemat biaya koneksi.
- ORM produktif, tetapi query-nya harus diperiksa.
- Transaksi aplikasi harus mencakup semua operasi terkait.

## 🧪 Latihan

1. Hubungkan PHP atau Node.js ke database `toko`.
2. Tulis query prepared untuk mengambil produk berdasarkan kategori.
3. Aktifkan query log ORM dan cari N+1.
4. Perbaiki N+1 dengan eager loading atau join.
5. Bungkus operasi checkout dalam transaksi aplikasi.

::: tip 💡 Tips
Semakin tinggi level abstraksi (ORM), semakin penting melihat SQL yang dihasilkan. Abstraksi menyembunyikan kompleksitas, bukan menghilangkannya.
:::
