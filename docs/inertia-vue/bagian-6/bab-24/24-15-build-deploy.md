---
title: 24.15 - Build & Deploy
---

# 24.15 Build & Deploy

:::info Langkah 15 dari 15
Persiapan terakhir untuk production: build asset, optimasi Laravel, dan deploy ke server.
:::

## Build Asset Frontend

```bash
# Compile + minify + fingerprint
npm run build
```

Output di `public/build/`:
- `manifest.json` - mapping asset
- `assets/app-[hash].js` - bundled JavaScript
- `assets/app-[hash].css` - bundled CSS

Vite otomatis include asset ke root template via `@vite`.

## Optimasi Laravel

```bash
# Cache semuanya
php artisan optimize

# Atau per-komponen:
php artisan route:cache
php artisan config:cache
php artisan view:cache
php artisan event:cache
```

::: details Penjelasan Kode
- `npm run build` - Vite mode production:Rollup/Bundle minify JS/CSS, code-split per route (lazy chunk), generate hash filename untuk cache busting. Output `manifest.json` digunakan Laravel untuk resolve asset URL.
- `php artisan optimize` - shortcut untuk cache route, config, view, dan event sekaligus. Memon-diskserialize menjadi file PHP - mempercepat bootstrap karena tidak perlu re-parse file konfig/route di setiap request.
- `route:cache` - gabungkan `routes/web.php` + `routes/api.php` menjadi satu route collection yang di-serialize. Sangat cepat untuk ribuan route. **Catatan:** tidak kompatibel dengan closure-based routes - semua closure harus dipindah ke controller.
- `config:cache` - gabungkan semua config dari `config/*.php` + `.env` -> satu file PHP. **Penting:** setelah cache, perubahan `.env` tidak dibaca - harus jalankan `optimize` ulang.
- `view:cache` - pre-compile Blade template ke PHP. Berguna saat ada banyak view; hemat waktu compiler per request.
- `event:cache` - manifest event-listener mapping agar discovery tidak perlu scan directory tiap request.
- Strategi deployment: jalankan `optimize` setelah deploy baru (dan `optimize:clear` sebelumnya untuk invalid cache lama).
:::

:::warning Route cachetidak mendukung closure
Jika route pakai closure, `route:cache` akan gagal. Pindahkan closure ke controller.
:::

## Migrasi Database Produksi

```bash
php artisan migrate --force
```

`--force` wajib di production - skip prompt konfirmasi.

## Storage Link (Jika Belum)

```bash
php artisan storage:link
```

 Agar `storage/app/public` accessible via `public/storage`.

## Konfigurasi Environment Produksi

`.env` di server (BUKAN di repo):

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://task-manager.test

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=task_manager
DB_USERNAME=...
DB_PASSWORD=...

# Variabel untuk Vue (prefix VITE_)
VITE_REVERB_APP_KEY=...
```

::: details Penjelasan Kode
- `APP_ENV=production` - mengaktifkan mode production; banyak komponen Laravel berperilaku berbeda (mis. tidak tampilkan error stack trace, log level warning ke atas).
- `APP_DEBUG=false` - **KRITIS**: jika `true`, exception detail (termasuk env, DB password) bisa tampil ke user. Di production harus false.
- `APP_URL` - basis URL untuk generate link absolut, asset URL, OAuth redirect, dst. Harus sesuai domain asli karena dipakai banyak komponen.
- Env dengan prefix `VITE_` - satu-satunya variabel yang Vite expose ke client-side. Env lain (`DB_PASSWORD`) tidak akan pernah ada di bundle JS; jangan ekspos sensitive data via `VITE_*`.
:::

:::danger Jangan commit `.env`
Pastikan `.env` ada di `.gitignore` dan tidak ter-commit ke repo git.
:::

## Deploy ke VPS (Ubuntu + Nginx)

### Langkah Deploy Manual

```bash
ssh user@server
cd /var/www
git clone https://github.com/you/task-manager.git
cd task-manager
```

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize
php artisan storage:link
```

::: details Penjelasan Kode
- `composer install --no-dev --optimize-autoloader` - install dependency tanpa `require-dev` (PHPUnit, Pest, dll) untuk produksi - mengurangi ukuran. `--optimize-autoloader` convert PSR-4 autoloader ke classmap -> lebih cepat lookup class.
- `npm ci` - clean install berdasarkan `package-lock.json` persis. Beda dari `npm install` yang boleh update lock - `ci` lebih deterministik untuk reproducible builds.
- `npm run build` - generate asset production. Hasil di `public/build` langsung di-serve oleh Nginx.
- Urutan penting: install composer -> build asset -> migrate -> optimize. Kalau `optimize` dijalankan sebelum migrate selesai, cache config bisa membaca schema lama.
:::

### Permission

```bash
chown -R www-data:www-data /var/www/task-manager
chmod -R 775 storage bootstrap/cache
```

::: details Penjelasan Kode
- `chown -R www-data:www-data` - ubah owner semua file menjadi user `www-data` (user yang menjalankan PHP-FPM). Di Ubuntu/Debian default ini user Nginx/PHP-FPM.
- `chmod -R 775 storage bootstrap/cache` - `775` (rwxrwxr-x): owner & group full RWX, other dapat R-X. `storage` dan `bootstrap/cache` harus writable oleh PHP (untuk log, cache view, session file). Tanpa ini, app error saat coba menulis.
- File lain (kode, `vendor`) cukup 755 (executable untuk owner, baca untuk world) - lebih aman.
:::

### Nginx Config

```nginx
server {
    listen 80;
    server_name task-manager.test;
    root /var/www/task-manager/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* { deny all; }
}
```

::: details Penjelasan Kode
- Block `server` - virtual host untuk task-manager; setiap `server_name` beda bisa punya root-nya sendiri.
- `root /var/www/task-manager/public` - arahkan root ke folder `public` Laravel. Ini titik masuk yang aman - file aplikasi (`app/`, `config/`, `.env`) tidak ter-expose ke web.
- `try_files $uri $uri/ /index.php?$query_string` - cek file static dulu, lalu directory, lalu fallback ke `index.php`. Penting: `?$query_string` meneruskan query string - tanpa ini, route dengan parameter akan rusak.
- `location ~ \.php$` - regex match untuk file `.php`. `fastcgi_pass` menghubungkan ke socket PHP-FPM (lebih cepat dari TCP). Versi `8.3` di path socket - sesuaikan dengan versi PHP di server.
- `fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name` - kirim path file PHP yang harus di-eksekusi. `$realpath_root` resolve symlink (penting untuk zero-downtime deploy via symlink).
- `include fastcgi_params` - sertakan parameter standar FastCGI (HTTP headers seperti `HTTP_HOST`, `REQUEST_METHOD`).
- `location ~ /\.(?!well-known).* { deny all; }` - blokir akses ke dotfile (`.env`, `.git`) dengan negative lookhead `(?!well-known)` - kecuali `.well-known` yang dibutuhkan untuk SSL Let's Encrypt ACME challenge.
:::

## Queue Worker dengan Supervisor

```ini
[program:task-manager-worker]
command=php /var/www/task-manager/artisan queue:work redis --sleep=3 --tries=3
numprocs=2
autostart=true
autorestart=true
user=www-data
```

::: details Penjelasan Kode
- `[program:task-manager-worker]` - deklarasi program Supervisor. Nama akan dipakai saat manage via `supervisorctl`.
- `command=php .../artisan queue:work redis --sleep=3 --tries=3` - jalankan worker Laravel untuk koneksi `redis` queue. `--sleep=3` (idle 3 detik ketika tidak ada job) untuk hemat CPU; `--tries=3` job gagal diretry hingga 3 kali sebelum masuk failed_jobs.
- `numprocs=2` - jalankan 2 worker paralel di pool. Bagus untuk throughput; hati-hati dengan concurrency pada job yang tidak aman paralel (mis. yang lock resource).
- `autostart=true` - supervisor mulai program otomatis saat start. `autorestart=true` - restart saat worker mati (crash/OOM). Uptime tinggi tanpa intervensi.
- `user=www-data` - jalankan sebagai user yang sama dengan web -> permission konsisten.
- Setelah edit file ini di `/etc/supervisor/conf.d/`, jalankan `supervisorctl reread` -> `update` -> `start`.
:::

Aktifkan:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start task-manager-worker:*
```

## Inertia SSR (Opsional)

Untuk konten publik:

```ini
[program:inertia-ssr]
command=php /var/www/task-manager/artisan inertia:start-ssr
numprocs=1
autostart=true
autorestart=true
user=www-data
```

::: details Penjelasan Kode
- `inertia:start-ssr` - menjalankan Node-like server SSR dalam proses PHP polyfill untuk render Vue di server -> first paint lebih cepat untuk SEO/perceived performance.
- `numprocs=1` - cukup 1 proses; SSR bukan worker queue. Bergantung pada load, bisa multi-instance dengan load balancer.
- `autorestart=true` - restart otomatis jika SSR crash; penting karena SSR process rawan memory leak saat banyak render.
- Catatan: lebih cepat jalankan SSR dengan Node native (`npm run ssr`) bila punya deploy script; polyfill PHP lebih sederhana tetapi lebih lambat.
:::

## Deploy via Laravel Forge (Recommended)

1. Buat server di Forge (DigitalOcean / AWS / Hetzner).
2. Tambahkan SSH key GitHub.
3. Buat site, isi source dari GitHub repo.
4. Setup environment via Forge UI.
5. Tambahkan deploy hook:
   ```bash
   composer install --no-dev --optimize-autoloader
   npm ci && npm run build
   php artisan migrate --force
   php artisan optimize
   ```
6. Aktifkan Quick Deploy - `git push` otomatis deploy.

## Deploy via Ploi

Alternatif Forge, fitur serupa:
- Provision server (Ubuntu 22/24).
- Git integration otomatis.
- SSL Let's Encrypt otomatis.
- Queue worker via UI.

## Deploy via Envoyer (Zero Downtime)

Untuk critical project:

1. Push release baru ke folder terpisah.
2. Symlink `current` ke release baru.
3. Jalankan hook (migrate, optimize) sebelum aktivasi.
4. Rollback mudah jika ada masalah.

## Backup

- DB: pakai `spatie/laravel-backup` ke S3.
- Storage: sinkron `storage/app/public` ke S3.
- Code: git tag release.

## Monitoring

- Health check: `spatie/laravel-health` atau route `/up` custom.
- Uptime: UptimeRobot / Sentry.
- Error tracking: Sentry / Bugsnag.

## Hasil Akhir

Setelah menyelesaikan mini project ini, kamu sudah pernah:

- Setup project Laravel + Inertia + Vue dari nol.
- Membuat CRUD lengkap dengan Inertia (tanpa API, tanpa token).
- Validasi form server-side yang terintegrasi mulus dengan `useForm()`.
- Upload file dan manajemen storage.
- Otorisasi dengan Gate & Policy.
- Filter, search, dan pagination dengan partial reload.
- Layout persisten dengan sidebar dan topbar.
- Komponen Vue yang reusable.
- Testing dengan PHPUnit dan `assertInertia()`.
- Deploy ke production.

:::tip Selamat!
Kamu sudah berhasil menyelesaikan perjalanan dari Blade ke Laravel + Inertia + Vue. Lihat [Penutup](/penutup) untuk langkah selanjutnya.
:::