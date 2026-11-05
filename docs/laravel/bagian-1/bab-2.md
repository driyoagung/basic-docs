---
title: Bab 2 — Setup & Instalasi Project
---

# 📖 Bab 2 — Setup & Instalasi Project

## 2.1 📦 Kebutuhan Sistem

```bash
# Cek versi PHP (minimal 8.2)
php --version

# Cek Composer (package manager PHP)
composer --version

# Cek Node.js (untuk asset Vite)
node --version

# Cek MySQL
mysql --version
```

**Penjelasan perintah:**

- **`php --version`** — Mengecek versi PHP yang terinstall. Laravel 12 butuh PHP 8.2+. Output biasanya seperti `PHP 8.3.0 (cli)`. Jika lebih lama, update PHP dulu via Laragon/Herd/Homebrew.
- **`composer --version`** — Mengecek Composer, package manager PHP. Output: `Composer version 2.7.x`. Composer dipakai untuk install Laravel + dependency-nya.
- **`node --version`** — Mengecek Node.js. Dipakai oleh Vite untuk build asset frontend. Laravel 12 butuh Node 18+.
- **`mysql --version`** — Mengecek MySQL client. Versi 8.0+ recommended. Bisa juga pakai MariaDB (drop-in replacement).

> 💡 **Rekomendasi Tools:**
> Gunakan **Laragon** (Windows) atau **Herd** (Mac) untuk setup lokal yang paling mudah.
> Keduanya sudah include PHP, MySQL, dan Nginx dalam satu paket.

## 2.2 🚀 Membuat Project Baru

```bash
# Buat project Laravel baru
composer create-project laravel/laravel nama-project

# Atau menggunakan Laravel Installer (lebih cepat)
composer global require laravel/installer
laravel new nama-project

# Masuk ke folder project
cd nama-project

# Jalankan dev server
php artisan serve
# Buka browser → http://localhost:8000

# Di terminal lain, jalankan Vite untuk asset
npm install && npm run dev
```

**Penjelasan setiap baris:**

- **`composer create-project laravel/laravel nama-project`** — Download Laravel versi terbaru + semua dependency ke folder `nama-project`. Proses ini butuh internet dan 1-3 menit.
- **`composer global require laravel/installer`** — Install Laravel Installer secara global. Hanya perlu sekali.
- **`laravel new nama-project`** — Buat project Laravel via installer. Lebih cepat dari `composer create-project` karena pakai cache.
- **`cd nama-project`** — Masuk ke folder project yang baru dibuat.
- **`php artisan serve`** — Jalankan development server PHP di port 8000. Hapus terminal ini untuk stop server.
- **`npm install`** — Install dependency Node.js (Vite, plugins). Hanya perlu sekali saat clone project.
- **`npm run dev`** — Jalankan Vite dev server yang compile asset (CSS, JS) secara hot-reload. Buka di terminal lain.

## 2.3 ⚙️ Konfigurasi File `.env`

```ini
# .env — konfigurasi environment (jangan commit ke Git!)

APP_NAME=NamaAplikasi
APP_ENV=local
APP_KEY=base64:... # Di-generate otomatis saat install
APP_DEBUG=true
APP_URL=http://localhost:8000

# Konfigurasi Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nama_database
DB_USERNAME=root
DB_PASSWORD=

# Konfigurasi Mail (untuk kirim email)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=email@gmail.com
MAIL_PASSWORD=app_password
```

**Penjelasan baris per baris:**

- **`APP_NAME`** — Nama aplikasi. Dipakai di title, email, notifikasi, dll.
- **`APP_ENV`** — Environment: `local` (development), `production` (live). Affects error reporting, caching.
- **`APP_KEY`** — Encryption key 32 karakter. **WAJIB** unik per project. Auto-generated saat install.
- **`APP_DEBUG`** — `true` di development untuk lihat error detail. **HARUS `false`** di production.
- **`APP_URL`** — Base URL aplikasi. Dipakai untuk generate link absolute.
- **`DB_CONNECTION`** — Driver database: `mysql`, `pgsql`, `sqlite`, `sqlsrv`.
- **`DB_HOST/PORT/DATABASE/USERNAME/PASSWORD`** — Konfigurasi koneksi DB.
- **`MAIL_MAILER`** — Driver email: `smtp`, `sendmail`, `log`, `mailgun`.
- **`MAIL_HOST/PORT/USERNAME/PASSWORD`** — SMTP server credentials. Gunakan **App Password** (bukan password utama) untuk Gmail.

::: warning ⚠️ Peringatan
File `.env` **HARUS** masuk ke `.gitignore`. Jangan pernah commit file ini karena berisi informasi sensitif seperti password database dan API key.
:::

## 2.4 🗂️ Anatomi Folder Project Laravel 12

```
nama-project/
│
├── 📁 app/                     ← Semua logika aplikasi
│   ├── 📁 Http/
│   │   ├── 📁 Controllers/     ← Controller (logika request/response)
│   │   └── 📁 Requests/        ← Form Request (validasi)
│   ├── 📁 Models/              ← Eloquent Models (representasi tabel)
│   ├── 📁 Services/            ← Business logic (opsional, best practice)
│   └── 📁 Providers/
│       └── 📄 AppServiceProvider.php
│
├── 📁 bootstrap/
│   └── 📄 app.php              ← Titik bootstrap aplikasi (Laravel 12: middleware & routing didaftarkan di sini)
│
├── 📁 config/                  ← Semua file konfigurasi
│   ├── 📄 app.php
│   ├── 📄 database.php
│   └── 📄 auth.php
│
├── 📁 database/
│   ├── 📁 migrations/          ← Skema tabel database (versi-terkontrol)
│   ├── 📁 seeders/             ← Pengisi data awal
│   └── 📁 factories/           ← Generator data dummy
│
├── 📁 public/                  ← Document root (index.php ada di sini)
│
├── 📁 resources/
│   ├── 📁 views/               ← Template Blade (.blade.php)
│   ├── 📁 css/
│   └── 📁 js/
│
├── 📁 routes/
│   ├── 📄 web.php              ← Route untuk web (session, CSRF)
│   └── 📄 api.php              ← Route untuk API (stateless) — dibuat manual di L11
│
├── 📁 storage/                 ← File upload, log, cache
├── 📄 .env                     ← Konfigurasi environment
├── 📄 artisan                  ← CLI tool Laravel
└── 📄 composer.json            ← Daftar dependency PHP
```

**Penjelasan setiap folder:**

- **`app/`** — Jantung aplikasi. Semua logic PHP ditulis di sini.
  - `Http/Controllers/` — Class yang handle HTTP request & return response.
  - `Http/Requests/` — Class validasi Form Request (Bab 7).
  - `Models/` — Eloquent Models — representasi tabel database (Bab 10).
  - `Services/` — Business logic terpisah (best practice untuk project besar).
- **`bootstrap/`** — File yang dijalankan saat aplikasi start. Di Laravel 12, `app.php` di sini mendaftarkan middleware, exception handler, dan routing.
- **`config/`** — File konfigurasi untuk semua aspek (app, database, auth, mail, cache, dll). Nilainya bisa di-override via `.env`.
- **`database/`** — Schema dan data database.
  - `migrations/` — Versi terkontrol dari schema DB. Setiap migration adalah satu snapshot.
  - `seeders/` — Isi data awal (misal: user admin default).
  - `factories/` — Template data dummy untuk testing.
- **`public/`** — Document root web server. Apache/Nginx point ke sini. Yang diakses publik adalah isi folder ini (HTML, CSS, JS hasil build).
- **`resources/`** — Asset mentah sebelum di-compile. Blade templates, source CSS/JS, gambar.
- **`routes/`** — Definisi routing aplikasi.
  - `web.php` — Route untuk browser (punya session, CSRF protection).
  - `api.php` — Route untuk API stateless (otomatis prefix `/api`).
- **`storage/`** — Generated files: upload user, log, cache, session. **JANGAN** hapus folder ini.
- **`.env`** — Environment variables (jangan commit!).
- **`artisan`** — CLI Laravel. Run dengan `php artisan <command>`.
- **`composer.json`** — Daftar dependency PHP + script.

> 💡 **Perbedaan `app/Http/Controllers/` vs `app/Services/`:**
> - `Controllers/` → Tangani request HTTP, validasi input, return response
> - `Services/` → Business logic murni (tidak tahu soal HTTP). Dipanggil oleh Controller.

## 2.5 ▶️ Perintah Artisan yang Wajib Dihapal

```bash
# Jalankan server development
php artisan serve

# Lihat semua route yang terdaftar
php artisan route:list

# Buat file baru
php artisan make:controller NamaController
php artisan make:model NamaModel -m          # -m = buat migration sekalian
php artisan make:migration create_nama_table
php artisan make:request NamaRequest
php artisan make:seeder NamaSeeder
php artisan make:factory NamaFactory
php artisan make:middleware NamaMiddleware
php artisan make:resource NamaResource       # Untuk API response

# Database
php artisan migrate                          # Jalankan migration
php artisan migrate:rollback                 # Batalkan migration terakhir
php artisan migrate:fresh --seed             # Reset + seed (HAPUS SEMUA DATA!)
php artisan db:seed                          # Jalankan seeder

# Cache & config
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan optimize

# Interaktif PHP shell
php artisan tinker
```

**Penjelasan kelompok perintah:**

- **Server** — `php artisan serve` jalankan dev server di port 8000.
- **Route List** — `php artisan route:list` untuk debugging semua route terdaftar (URL, method, middleware, name).
- **Make (generator file)**:
  - `make:controller` — Generate controller kosong.
  - `make:model -m` — Generate model + migration sekaligus.
  - `make:request` — Generate Form Request class untuk validasi.
  - `make:resource` — Generate API Resource untuk format response.
- **Database**:
  - `migrate` — Jalankan migration pending.
  - `migrate:rollback` — Batalkan migration batch terakhir.
  - `migrate:fresh --seed` — **HAPUS SEMUA TABEL** lalu migrate ulang + seed. Hanya untuk development!
- **Cache** — `optimize` menggabungkan config & route jadi file cache untuk performa.
- **Tinker** — Interactive PHP REPL dengan Laravel context. Cocok untuk testing atau eksperimen cepat.

::: tip 💡 Tips
Gunakan `php artisan make:model Product -a` untuk generate **semua** file terkait sekaligus (Model, Migration, Factory, Seeder, Controller, Form Request).
:::

**Penjelasan flag `-a` (all):**

- `-a` sama dengan `-mcfsr`:
  - `m` = migration
  - `c` = controller
  - `f` = factory
  - `s` = seeder
  - `r` = form request
- Sangat produktif untuk scaffolding modul baru.

## 2.6 🛠️ Setup VS Code yang Direkomendasikan

| Ekstensi                | Fungsi                                       |
| ----------------------- | -------------------------------------------- |
| **PHP Intelephense**    | Autocomplete & type checking PHP             |
| **Laravel Extension Pack** | Kumpulan ekstensi Laravel                  |
| **Blade Formatter**     | Format file Blade otomatis                   |
| **DotENV**              | Syntax highlighting file `.env`              |
| **Thunder Client**      | Testing API langsung dari VS Code            |
| **GitLens**             | Git integration yang lebih powerful          |

**Penjelasan ekstensi:**

- **PHP Intelephense** — Wajib. Memberi autocomplete, type detection, jump-to-definition. Tanpa ini, productivity turun drastis.
- **Laravel Extension Pack** — Bundle beberapa ekstensi Laravel resmi (snippets, route viewer, blade formatter).
- **Blade Formatter** — Auto-format file `.blade.php` saat save (pakai ekstensi Blade Formatter dari `shufo.vscode-blade-formatter`).
- **DotENV** — Highlight syntax untuk file `.env`, agar tidak salah edit.
- **Thunder Client** — Seperti Postman tapi di dalam VS Code. Test endpoint API tanpa switch window.
- **GitLens** — Lihat git blame, history, diff per baris. Sangat membantu tim.

## 📌 Ringkasan Bab 2

| Konsep                    | Penjangan Singkat                                            |
| ------------------------- | ------------------------------------------------------------ |
| Composer                  | Package manager PHP — install Laravel via `composer create-project` |
| `.env`                    | File konfigurasi environment (jangan commit!)                |
| Struktur folder Laravel   | `app/`, `routes/`, `database/`, `resources/`, `config/`      |
| Artisan                   | CLI Laravel — generate file, migrate, dsb                    |
| `php artisan serve`       | Jalankan dev server di `localhost:8000`                      |

---

➡️ Lanjut ke [Bab 3 — MVC: Cara Berpikir Laravel](/bagian-1/bab-3)
