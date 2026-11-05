---
title: "Bab 19 — User, Privilege & Keamanan"
---

# 👤 Bab 19 — User, Privilege & Keamanan

> 🎯 **Tujuan Bab:** menjalankan MySQL dengan hak akses minimal, melindungi dari SQL injection, dan menghindari kesalahan konfigurasi yang sering terjadi di production.

## 19.1 👥 Membuat User & Memberi Hak Akses

```sql
CREATE USER 'app_toko'@'%' IDENTIFIED BY 'password_kuat_sekali';
GRANT SELECT, INSERT, UPDATE, DELETE ON toko.* TO 'app_toko'@'%';
FLUSH PRIVILEGES;
```

Prinsip **least privilege**: beri hak sekecil mungkin yang masih cukup untuk aplikasi.

| Kebutuhan | Hak |
|---|---|
| Aplikasi baca-tulis | `SELECT, INSERT, UPDATE, DELETE` |
| Aplikasi hanya baca | `SELECT` |
| Migration | `ALTER, CREATE, DROP, INDEX, REFERENCES` |
| Backup | `SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER` |

Jangan memberi `ALL PRIVILEGES` kecuali benar-benar perlu.

## 19.2 🎭 Role di MySQL 8

Role mengelompokkan privilege agar mudah dikelola.

```sql
CREATE ROLE 'role_app';
GRANT SELECT, INSERT, UPDATE, DELETE ON toko.* TO 'role_app';
GRANT 'role_app' TO 'app_toko'@'%';
SET DEFAULT ROLE 'role_app' TO 'app_toko'@'%';
```

## 19.3 🚫 Mengapa Aplikasi Tidak Boleh Memakai `root`

Akun `root` bisa:

- menghapus database;
- mengubah user dan privilege;
- mematikan server;
- membaca semua data.

Jika kredensial aplikasi bocor, penyerang mendapat kendali penuh. Aplikasi harus memakai akun terbatas.

## 19.4 💉 SQL Injection & Prepared Statement

SQL injection terjadi saat input pengguna disisipkan langsung ke query.

```php
// ❌ Berbahaya
$sql = "SELECT * FROM users WHERE email = '$email'";
```

Jika `$email` berisi `' OR '1'='1`, query berubah menjadi selalu benar.

Perbaikan dengan prepared statement:

```php
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
```

```js
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE email = ?',
  [email]
);
```

Aturan:

- gunakan placeholder (`?` atau `:nama`);
- jangan menyusun SQL dengan penggabungan string;
- validasi input tetap penting, tetapi bukan pengganti prepared statement.

## 19.5 🔑 Menyimpan Password

Jangan pernah menyimpan password dalam teks biasa.

```php
$hash = password_hash($password, PASSWORD_ARGON2ID);
$valid = password_verify($input, $hash);
```

| Algoritma | Catatan |
|---|---|
| **Argon2id** | Rekomendasi modern |
| **bcrypt** | Umum dan aman |
| MD5 / SHA1 | ❌ Jangan dipakai untuk password |

Password hash bersifat satu arah. Jika lupa password, lakukan reset, bukan "melihat" password lama.

## 19.6 🔐 Enkripsi Koneksi (TLS)

Aktifkan TLS agar data tidak dikirim dalam teks biasa, terutama jika database tidak berada di mesin yang sama dengan aplikasi.

```sql
SHOW VARIABLES LIKE '%ssl%';
```

Konfigurasi aplikasi biasanya memiliki opsi `sslmode` atau `ssl`. Pastikan sertifikat diverifikasi, bukan sekadar "pakai TLS".

## 19.7 🌐 Jangan Membuka Port 3306 ke Internet

Port MySQL default adalah `3306`. Jika terbuka ke publik:

- bot akan mencoba login terus-menerus;
- celah keamanan bisa dieksploitasi;
- data bisa dicuri.

Langkah pengamanan:

- batasi firewall ke IP aplikasi;
- gunakan private network / VPC;
- gunakan SSH tunnel untuk akses admin;
- matikan akses eksternal jika tidak perlu.

## 19.8 🗝️ Simpan Kredensial di `.env`

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=toko
DB_USERNAME=app_toko
DB_PASSWORD=password_kuat_sekali
```

Jangan commit `.env` ke repository. Tambahkan ke `.gitignore` dan gunakan secret manager di production.

## 19.9 🔁 Rotasi & Audit

- ganti password secara berkala;
- cabut akses user yang tidak dipakai;
- tinjau privilege setiap beberapa bulan;
- aktifkan log koneksi dan error;
- pantau percobaan login gagal.

## ✅ Checklist Keamanan

- [ ] Aplikasi tidak memakai `root`
- [ ] Hak akses minimal
- [ ] Prepared statement di semua query berinput
- [ ] Password disimpan sebagai hash
- [ ] TLS aktif jika koneksi melewati jaringan
- [ ] Port 3306 tidak terbuka ke publik
- [ ] Kredensial di `.env`, tidak di kode
- [ ] Backup terenkripsi dan teruji

## 📌 Ringkasan

- Least privilege mengurangi dampak kebocoran.
- Role memudahkan pengelolaan hak akses.
- Prepared statement adalah pertahanan utama SQL injection.
- Password harus di-hash dengan algoritma modern.
- Jangan pernah mengekspos port database ke internet.

## 🧪 Latihan

1. Buat user `app_baca` yang hanya bisa `SELECT` pada database `toko`.
2. Buat role `role_kasir` dengan hak terbatas pada tabel `orders`.
3. Ubah satu query rentan menjadi prepared statement.
4. Jelaskan mengapa MD5 tidak cocok untuk password.
5. Tulis checklist keamanan untuk server MySQL sederhana.

::: tip 💡 Tips
Uji hak akses dengan benar-benar login sebagai user aplikasi, bukan hanya membaca daftar `GRANT`. Kadang hak yang tidak diinginkan tetap lolos lewat role atau database wildcard.
:::
