---
title: "Bab 22 — Deployment"
---

# 📖 Bab 22 — Deployment

Aplikasi Inertia adalah aplikasi Laravel biasa dengan aset yang dibangun Vite. Deploy-nya tidak jauh berbeda dari Laravel pada umumnya — kecuali bila Anda memakai SSR, yang menambah proses Node. Bab ini membahas build, environment, optimasi, deploy ke VPS/Forge, dan masalah yang paling sering muncul.

---

## 22.1 📦 Build Asset Production

```bash
npm ci
npm run build
```

Hasil build:

```text
public/build/
├── assets/            ← JS, CSS, font (ber-hash)
└── manifest.json      ← peta aset untuk @vite
```

| Perintah | Fungsi |
|---|---|
| `npm ci` | Install sesuai `package-lock.json` |
| `npm run build` | Build client (+ SSR bila dikonfigurasi) |
| `php artisan optimize` | Cache config, route, view |

> ⚠️ **Jangan jalankan `npm run dev` di produksi.** Gunakan hasil `npm run build`; Vite dev server hanya untuk development.

---

## 22.2 🔐 Konfigurasi `.env` Production

```ini
APP_NAME="Toko Admin"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://admin.toko.example

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=toko
DB_USERNAME=toko
DB_PASSWORD=rahasia-kuat

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

| Variabel | Nilai produksi |
|---|---|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` (wajib) |
| `APP_URL` | URL HTTPS sebenarnya |
| `SESSION_DRIVER` | `database` atau `redis` |
| `QUEUE_CONNECTION` | `database`/`redis` |

```bash
php artisan key:generate --force   # hanya bila APP_KEY kosong
php artisan config:cache
```

> 🚨 **`APP_DEBUG=true` di produksi membocorkan kredensial database dan stack trace.** Periksa sebelum go-live.

---

## 22.3 ⚡ Optimasi Laravel

```bash
php artisan optimize        # config + route + view cache
php artisan storage:link    # agar file upload dapat diakses
php artisan migrate --force # migration di produksi
```

| Perintah | Efek |
|---|---|
| `config:cache` | Satu file config, lebih cepat |
| `route:cache` | Route di-cache (hati-hati closure) |
| `view:cache` | Blade dikompilasi |
| `optimize:clear` | Bersihkan semua cache |

> ⚠️ **Setelah mengubah `.env`, jalankan `php artisan config:cache` lagi.** Tanpa itu, nilai lama tetap dipakai.

---

## 22.4 🖥️ Deploy ke VPS (Nginx + PHP-FPM)

Struktur direktori:

```text
/var/www/toko/
├── current/          ← rilis aktif (symlink)
├── releases/         ← rilis per tanggal
└── shared/
    ├── .env
    └── storage/
```

Konfigurasi Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name admin.toko.example;
    root /var/www/toko/current/public;

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

| Langkah | Perintah |
|---|---|
| Ambil kode | `git pull` / deploy tool |
| Install | `composer install --no-dev --optimize-autoloader` |
| Build | `npm ci && npm run build` |
| Migrasi | `php artisan migrate --force` |
| Cache | `php artisan optimize` |
| Permission | `chown -R www-data:www-data storage bootstrap/cache` |

Alternatif: **Laravel Forge** mengotomatiskan sebagian besar langkah di atas.

---

## 22.5 🔄 Queue Worker & SSR dengan Supervisor

**Queue worker:**

```ini
[program:toko-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/toko/current/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/toko/current/storage/logs/worker.log
```

**SSR (bila dipakai, Bab 18):**

```ini
[program:toko-ssr]
command=node /var/www/toko/current/bootstrap/ssr/ssr.js
autostart=true
autorestart=true
user=www-data
numprocs=1
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

| Proses | Wajib? |
|---|---|
| PHP-FPM | ✅ |
| Queue worker | Bila memakai queue |
| SSR Node | Hanya bila SSR aktif |
| Scheduler | Bila ada task terjadwal |

> 💡 **Scheduler** membutuhkan cron: `* * * * * cd /var/www/toko/current && php artisan schedule:run >> /dev/null 2>&1`.

---

## 22.6 🧯 Masalah Umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| Halaman putih / aset 404 | Build belum jalan atau `APP_URL` salah | `npm run build`, perbaiki `APP_URL` |
| "Vite manifest not found" | `public/build` tidak ada | Jalankan build di server |
| Mixed content | Aset dimuat via HTTP | Paksa HTTPS, `APP_URL=https://...` |
| 419 setiap submit | Session/CSRF bermasalah | Cek `SESSION_DOMAIN`, cookie, `APP_KEY` |
| Perubahan tidak terlihat | Cache config/route | `php artisan optimize:clear` lalu `optimize` |
| Upload tidak tampil | `storage:link` belum | `php artisan storage:link` |
| SSR 500 | Proses Node mati | Cek Supervisor & log SSR |
| User melihat versi lama | Asset versioning | Pastikan build baru + reload |

```text
Deploy baru tidak terlihat?
   │
   ├─ npm run build sudah?
   ├─ php artisan optimize sudah?
   ├─ config:cache memakai .env baru?
   └─ browser cache / service worker?
```

---

## 22.7 ✅ Checklist Sebelum Go-Live

| Area | Periksa |
|---|---|
| **Environment** | `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` HTTPS |
| **Database** | Migration jalan, seeder role/permission ada |
| **Aset** | `npm run build` sukses, `public/build` ada |
| **Storage** | `storage:link`, permission `storage` & `bootstrap/cache` |
| **Cache** | `php artisan optimize` setelah config final |
| **Auth** | Login/logout/register/reset password diuji |
| **RBAC** | Viewer/editor tidak bisa akses route terlarang |
| **Upload** | File tersimpan dan tampil |
| **Error** | 403/404/419/500 ramah, tanpa stack trace |
| **Backup** | Database & file upload terjadwal |
| **Monitoring** | Log, uptime, queue, SSR (bila ada) |
| **HTTPS** | Sertifikat valid, redirect HTTP → HTTPS |

---

## 22.8 🎬 Alur Deploy Singkat

```bash
# di server
cd /var/www/toko/current

git pull origin main
composer install --no-dev --optimize-autoloader
npm ci
npm run build

php artisan migrate --force
php artisan optimize

sudo supervisorctl restart all
```

```text
git pull → composer → npm build → migrate → optimize → restart
   │
   ▼
Cek: halaman login, dashboard, CRUD, upload, 403/404
```

> 💡 **Deploy pertama kali paling rawan.** Setelah itu, biasakan urutan yang sama setiap rilis agar tidak ada langkah terlewat.

---

## ✅ Checklist Bab 22

- **Build** — `npm ci && npm run build`; jangan pakai dev server di produksi.
- **`.env`** — `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` HTTPS.
- **Optimasi** — `php artisan optimize`, `storage:link`, migrate.
- **Web server** — Nginx root ke `public/`, PHP-FPM benar.
- **Supervisor** — queue worker dan SSR (bila dipakai) dengan `autorestart`.
- **Masalah umum** — manifest, mixed content, 419, cache, storage.
- **Checklist go-live** — auth, RBAC, upload, error, backup, monitoring.
- **Konsistensi** — urutan deploy yang sama setiap rilis.

---

🎉 **Selamat!** Anda telah menyelesaikan Ebook Laravel + Inertia.js + React — dari fondasi hingga aplikasi full stack siap produksi. Kembali ke [Beranda](/).
