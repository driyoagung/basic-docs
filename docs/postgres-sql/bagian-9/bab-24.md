---
title: "Bab 24 — Menghubungkan PostgreSQL ke Aplikasi"
---

# 🔌 Bab 24 — Menghubungkan PostgreSQL ke Aplikasi

> 🎯 **Tujuan Bab:** menghubungkan aplikasi ke PostgreSQL dengan aman, efisien, dan mudah dirawat.

## 24.1 🔑 Connection String

```ini
DATABASE_URL=postgresql://app_toko:rahasia@localhost:5432/toko?sslmode=verify-full
```

Jangan menaruh kredensial di kode. Gunakan environment variable atau secret manager.

## 24.2 🟢 Node.js dengan `pg`

```bash
npm install pg
```

```js
import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function getOrder(id) {
  const { rows } = await pool.query(
    'SELECT id, total, status FROM orders WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}
```

Gunakan `$1`, `$2`, bukan penggabungan string.

Transaksi:

```js
const client = await pool.connect();
try {
  await client.query('BEGIN');

  const { rows } = await client.query(
    'SELECT stok FROM products WHERE id = $1 FOR UPDATE',
    [id]
  );

  if (rows[0].stok < jumlah) throw new Error('Stok tidak cukup');

  await client.query('UPDATE products SET stok = stok - $1 WHERE id = $2', [jumlah, id]);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

## 24.3 🟣 Laravel

`.env`:

```ini
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=toko
DB_USERNAME=app_toko
DB_PASSWORD=rahasia
```

Query:

```php
$orders = DB::select(
    'SELECT id, total FROM orders WHERE user_id = ?',
    [$userId]
);
```

Transaksi:

```php
DB::transaction(function () use ($id, $jumlah) {
    $produk = DB::table('products')
        ->where('id', $id)
        ->lockForUpdate()
        ->first();

    if ($produk->stok < $jumlah) {
        throw new \RuntimeException('Stok tidak cukup');
    }

    DB::table('products')
        ->where('id', $id)
        ->decrement('stok', $jumlah);
});
```

Migrasi:

```bash
php artisan make:migration create_orders_table
php artisan migrate
```

## 24.4 🐍 Django

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "toko",
        "USER": "app_toko",
        "PASSWORD": os.environ["DB_PASSWORD"],
        "HOST": "127.0.0.1",
        "PORT": "5432",
        "CONN_MAX_AGE": 60,
    }
}
```

Query dengan parameter:

```python
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute(
        "SELECT id, total FROM orders WHERE user_id = %s",
        [user_id],
    )
    rows = cursor.fetchall()
```

## 24.5 🐹 Go dengan `pgx`

```go
pool, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
if err != nil {
    log.Fatal(err)
}
defer pool.Close()

var total int64
err = pool.QueryRow(ctx,
    "SELECT COUNT(*) FROM orders WHERE user_id = $1", userID,
).Scan(&total)
```

## 24.6 🧠 ORM & Query Builder

ORM mempercepat pengembangan, tetapi:

- periksa query yang dihasilkan (N+1);
- gunakan eager loading;
- jangan menyembunyikan query berat di balik magic;
- pastikan migrasi menghasilkan tipe PostgreSQL yang tepat (`NUMERIC`, `TIMESTAMPTZ`, `JSONB`).

Contoh di Laravel:

```php
$orders = Order::with('items')
    ->where('status', 'paid')
    ->latest()
    ->paginate(20);
```

## 24.7 🧵 Koneksi & Pool

- Batasi `max` koneksi per instance aplikasi.
- Gunakan PgBouncer untuk banyak worker.
- Jangan membuka koneksi baru per request tanpa pool.
- Tutup koneksi dengan benar.
- Sesuaikan `statement_timeout` agar query liar tidak menggantung.

```sql
SET statement_timeout = '5s';
SET idle_in_transaction_session_timeout = '30s';
```

## 24.8 🩺 Health Check

```sql
SELECT 1;
```

Untuk kesiapan yang lebih baik:

```sql
SELECT
  pg_is_in_recovery() AS replika,
  now() AS waktu,
  (SELECT count(*) FROM pg_stat_activity) AS koneksi;
```

Jangan memakai health check yang menjalankan query berat.

## 24.9 🧯 Menangani Error

| SQLSTATE | Arti | Tindakan |
|---|---|---|
| `23505` | Unique violation | Tampilkan pesan ramah |
| `23503` | Foreign key violation | Validasi relasi |
| `40001` | Serialization failure | Retry |
| `40P01` | Deadlock | Retry |
| `57014` | Query dibatalkan | Periksa timeout |

Jangan menampilkan pesan database mentah ke pengguna.

## 24.10 🎬 Studi Kasus: Aplikasi Toko

- Laravel + `pgsql`;
- PgBouncer transaction mode;
- `NUMERIC(12,2)` untuk uang;
- `JSONB` untuk atribut produk;
- transaksi + `lockForUpdate` untuk stok;
- index pada FK dan kolom pencarian;
- backup harian + uji restore.

## 📌 Ringkasan

- Gunakan connection string dari environment.
- Parameterized query mencegah SQL injection.
- Pool dan timeout mencegah kehabisan koneksi.
- ORM tetap perlu diperiksa query-nya.
- Pahami SQLSTATE untuk penanganan error yang tepat.

## 🧪 Latihan

1. Hubungkan Node.js ke database `toko`.
2. Tulis query parameterized untuk mencari order.
3. Buat transaksi pengurangan stok.
4. Konfigurasi Laravel ke PostgreSQL.
5. Tambahkan health check sederhana.

::: tip 💡 Tips
Aktifkan logging query di development, tetapi matikan atau batasi di production agar tidak membocorkan data sensitif dan memenuhi disk.
:::
