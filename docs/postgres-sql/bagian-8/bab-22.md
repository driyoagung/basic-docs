---
title: "Bab 22 — Role, Hak Akses & Keamanan"
---

# 🛡️ Bab 22 — Role, Hak Akses & Keamanan

> 🎯 **Tujuan Bab:** menerapkan prinsip hak minimum dan melindungi data dari akses yang tidak semestinya.

## 22.1 👤 Role

Di PostgreSQL, user dan group sama-sama disebut **role**.

```sql
CREATE ROLE app_toko LOGIN PASSWORD 'ganti-di-secret-manager';
CREATE ROLE readonly NOLOGIN;
CREATE ROLE report NOLOGIN;
```

| Atribut | Arti |
|---|---|
| `LOGIN` | Bisa terhubung |
| `SUPERUSER` | Hak penuh (hindari untuk aplikasi) |
| `CREATEDB` | Bisa membuat database |
| `CREATEROLE` | Bisa membuat role |
| `NOINHERIT` | Tidak otomatis mewarisi hak |

Cek role:

```sql
\du
```

## 22.2 🧱 Hak Minimum

Jangan memakai superuser untuk aplikasi.

```sql
GRANT CONNECT ON DATABASE toko TO app_toko;
GRANT USAGE ON SCHEMA public TO app_toko;

GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA public TO app_toko;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public TO app_toko;
```

Untuk role baca saja:

```sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
```

Hak default untuk tabel baru:

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_toko;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO app_toko;
```

Tanpa `ALTER DEFAULT PRIVILEGES`, tabel baru tidak otomatis memberi hak.

## 22.3 🚫 Mencabut Hak Publik

Secara default, `PUBLIC` bisa membuat objek di schema `public` pada beberapa versi/konfigurasi. Batasi:

```sql
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app_toko, readonly;
```

Periksa juga akses ke database:

```sql
REVOKE ALL ON DATABASE toko FROM PUBLIC;
GRANT CONNECT ON DATABASE toko TO app_toko, readonly;
```

## 22.4 🎭 Role Group

```sql
GRANT readonly TO report;
GRANT app_toko TO budi;
```

`budi` mewarisi hak `app_toko`. Role group menyederhanakan pengelolaan hak.

## 22.5 🏠 Row Level Security

RLS membatasi baris yang bisa dilihat/diubah per user.

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_milik_user ON orders
  FOR SELECT
  USING (user_id = current_setting('app.user_id', true)::bigint);
```

Aplikasi menetapkan user aktif:

```sql
SET LOCAL app.user_id = '42';
SELECT * FROM orders;
```

Tanpa `SET LOCAL`, nilai bisa bocor antar request pada koneksi pool. Selalu set di awal transaksi dan reset otomatis saat transaksi selesai.

Untuk pemilik tabel, RLS tidak otomatis berlaku:

```sql
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
```

Contoh policy tulis:

```sql
CREATE POLICY order_tulis_user ON orders
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::bigint)
  WITH CHECK (user_id = current_setting('app.user_id', true)::bigint);
```

## 22.6 🔐 Koneksi Aman

Aktifkan SSL/TLS dan verifikasi sertifikat:

```
host=db.example.com dbname=toko user=app_toko sslmode=verify-full
```

`sslmode`:

| Mode | Verifikasi |
|---|---|
| `disable` | Tidak ada |
| `require` | Enkripsi, tanpa verifikasi CA |
| `verify-ca` | Verifikasi CA |
| `verify-full` | Verifikasi CA + hostname |

Gunakan `verify-full` di production.

## 22.7 🧾 `pg_hba.conf`

Contoh aturan:

```
# TYPE  DATABASE  USER       ADDRESS         METHOD
host    toko      app_toko   10.0.0.0/24     scram-sha-256
hostssl toko      app_toko   0.0.0.0/0       scram-sha-256
local   all       postgres                   peer
```

Prinsip:

- batasi alamat;
- gunakan `scram-sha-256`, bukan `trust`/`md5`;
- pisahkan akses admin dan aplikasi;
- reload dengan `SELECT pg_reload_conf();`.

## 22.8 🧪 SQL Injection

Gunakan parameterized query. Jangan menyusun SQL dengan penggabungan string.

```php
DB::select('SELECT * FROM users WHERE email = ?', [$email]);
```

```js
await client.query('SELECT * FROM users WHERE email = $1', [email]);
```

Di dalam fungsi PL/pgSQL, gunakan `EXECUTE ... USING` untuk query dinamis:

```sql
EXECUTE 'SELECT * FROM products WHERE nama = $1' USING p_nama;
```

## 22.9 🔑 Rahasia & Enkripsi

- Jangan simpan password database di kode atau repo.
- Gunakan secret manager atau environment variable.
- Hash password aplikasi dengan Argon2id/bcrypt.
- Enkripsi disk/volume dan backup.
- Batasi akses ke backup; backup berisi data sensitif.

## 22.10 📋 Audit

Aktifkan logging koneksi dan error:

```sql
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_min_duration_statement = '500ms';
SELECT pg_reload_conf();
```

Untuk audit perubahan data, gunakan trigger audit (Bab 20) atau ekstensi audit khusus. Simpan log di lokasi yang tidak bisa dihapus oleh role aplikasi.

## 22.11 🎬 Checklist Keamanan

- [ ] Aplikasi tidak memakai superuser.
- [ ] Hak diberikan per role, bukan per orang.
- [ ] `PUBLIC` dicabut dari schema/database.
- [ ] `ALTER DEFAULT PRIVILEGES` dikonfigurasi.
- [ ] RLS dipakai untuk data multi-tenant.
- [ ] SSL `verify-full` di production.
- [ ] `pg_hba.conf` ketat.
- [ ] Query memakai parameter.
- [ ] Backup terenkripsi dan diuji restore.
- [ ] Log audit aktif.

## 📌 Ringkasan

- Role dan grant adalah fondasi keamanan PostgreSQL.
- Prinsip hak minimum mengurangi dampak kebocoran.
- RLS melindungi data per baris, tetapi harus dipakai dengan benar.
- Koneksi wajib terenkripsi dan dibatasi.
- SQL injection dicegah dengan parameterized query.

## 🧪 Latihan

1. Buat role `app_toko` dan `readonly`.
2. Beri hak minimum ke tabel `orders`.
3. Aktifkan RLS pada `orders`.
4. Uji policy dengan dua user berbeda.
5. Periksa `pg_hba.conf` dan pastikan tidak ada `trust`.

::: tip 💡 Tips
Uji hak akses dengan benar-benar login sebagai role tersebut. Melihat dari superuser tidak membuktikan apa pun.
:::
