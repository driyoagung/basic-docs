---
title: Bab 23 — Optimasi & Deploy ke Produksi
---

# Bab 23: Optimasi & Deploy ke Produksi

:::info Bagian V — Ekosistem & Tooling
Bab ini bahas optimasi build Vite, optimize Laravel, strategi partial reload, dan deploy ke VPS / Forge / Ploi.
:::

## 23.1 Optimasi Asset dengan Vite

Build production:

```bash
npm run build
```

Vite akan:

- Minify JavaScript dan CSS.
- Code splitting per page (jika `resolve` pakai lazy `import.meta.glob`).
- Fingerprint asset (hash dalam nama file) untuk cache-busting.

Hasil di `public/build/`:

- `assets/app-[hash].js`
- `assets/app-[hash].css`
- `manifest.json` untuk mapping nama asli ke fingerprinted.

Vite secara otomatis include asset dari manifest ke root template via `@vite`.

## 23.2 Bundle Analysis

```bash
npm install -D rollup-plugin-visualizer
```

```js
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    laravel(...),
    vue(),
    visualizer({ open: true, filename: 'build/stats.html' }),
  ],
})
```

::: details Penjelasan Kode
- `visualizer({ open: true, filename: 'build/stats.html' })` — plugin Rollup yang menghasilkan treemap HTML dari bundle. `open: true` agar langsung terbuka di browser setelah build.
- Membantu melihat chunk mana terbesar — biasanya: Headless UI, vendor, PrimeVue.
:::

## 23.3 Code Splitting

Default `resolve` dengan `import.meta.glob(..., { eager: true })` me-load semua halaman ke satu bundle. Untuk project besar, lazy:

```js
resolve: name => {
  const pages = import.meta.glob('./Pages/**/*.vue')
  return pages[`./Pages/${name}.vue`]()
}
```

::: details Penjelasan Kode
- `import.meta.glob('./Pages/**/*.vue')` — tanpa `eager: true`, glob mengembalikan map `path → () => import()`. Tiap value adalah function lazy import.
- `pages[...]()` — invoke function untuk trigger dynamic import. Vite akan membuat chunk terpisah per halaman; baru di-download saat user navigate.
- Konsekuensinya: halaman pertama lebih ringan, tradeoff ada loading spinner singkat saat pertama buka halaman baru.
:::

Manual chunk:

```js
// vite.config.js — manualChunks
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', '@inertiajs/vue3'],
          ui: ['@headlessui/vue', '@heroicons/vue'],
        },
      },
    },
  },
})
```

::: details Penjelasan Kode
- `manualChunks` — instruksi Rollup: pindahkan dependensi tertentu ke chunk terpisah dengan nama kustom (`vendor.js`, `ui.js`).
- Berguna untuk cache Inertia panjang: library yang jarang berubah (`vue`, `@inertiajs/vue3`) tidak perlu di-download ulang saat app code berubah.
- `vendor` dan `ui` — bundle ID; nama file hasil: `vendor-[hash].js`, `ui-[hash].js`.
:::

## 23.4 Optimasi Laravel

```bash
php artisan optimize          # cache config, route, view, events sekaligus
php artisan route:cache       # cache semua route (conditional saat pakai closure?)
php artisan config:cache      # cache konfigurasi
php artisan view:cache        # cache view Blade (untuk root template)
php artisan event:cache       # cache event listeners
```

::: details Penjelasan Kode
- `route:cache` — serialize route collection ke file PHP; skip file discovery tiap request. Hanya boleh dipakai jika semua route pakai controller (tidak ada closure inline).
- `config:cache` — merge semua config file ke satu file PHP. Setelah ini, env variable tidak lagi di-baca otomatis — wajib `optimize:clear` setelah ubah `.env`.
- `view:cache` — pre-compile Blade template ke PHP file. Untuk Inertia, hanya root template di `resources/views/app.blade.php` yang perlu.
- `event:cache` — sama, untuk event listener discovery; penghematan di bootstrapping app.
:::

:::warning Route cache tidak support closure
Jika route pakai `Route::get('/', function () { ... })`, `route:cache` akan gagal. Pindahkan closure ke controller.
:::

Hapus cache saat debug:

```bash
php artisan optimize:clear
```

## 23.5 Optimasi Database

- Pakai index pada kolom yang sering di-filter / order.
- Index composite untuk query multi-kolom.
- Pakai `cursorPaginate` untuk dataset besar.
- Caching query mahal (`Cache::remember()`).

```php
$posts = Cache::remember('posts.popular', now()->addHour(), fn () =>
    Post::withCount('likes')->orderBy('likes_count', 'desc')->take(10)->get()
);
```

::: details Penjelasan Kode
- `Cache::remember($key, $ttl, $callback)` — jika `posts.popular` ada di cache, kembalikan langsung. Jika tidak, jalankan callback, simpan hasil, lalu kembalikan.
- `now()->addHour()` — TTL 1 jam; setelah itu cache expired dan callback dijalankan ulang.
- `fn () => Post::withCount('likes')->...` — closure lazy; tidak dieksekusi bila cache hit. Menghemat query mahal.
- `withCount('likes')` — eager aggregate count; tidak memuat relasi penuh. Hindari N+1.
:::

## 23.6 Inertia-Specific Optimasi

- **Lazy props** (`Inertia::lazy`) → prop hanya dihitung saat diminta dengan `only`.
- **Partial reload** (`router.reload({ only: [...] })`) → hemat bandwidth filter.
- **Prefetch** (`<Link prefetch>`) → navigasi instan untuk link yang sering diklik.
- **Eager loading** dengan `with()` agar tidak N+1.

Contoh partial reload untuk filter:

```js
router.reload({
  only: ['posts', 'filters'],
  data: { q: search.value, status: status.value },
  preserveScroll: true,
})
```

::: details Penjelasan Kode
- `router.reload({ only: [...] })` — partial reload Inertia. Hanya prop `posts` dan `filters` yang diminta ulang ke server; prop lain seperti `auth.user` tetap di client.
- `data: { q: search.value, status: status.value }` — query string yang dikirim sebagai request parameter. Server pakai ini untuk filter query.
- `preserveScroll: true` — agar posisi scroll tidak reset ke atas. Berguna saat user mengubah filter dan hasil list berubah.
- Mengurangi payload JSON yang dikirim server — cepat + hemat bandwidth.
:::

Controller kirim hanya props terkait (gunakan `fn ()` agar lazy):

```php
public function index(Request $request) {
    return Inertia::render('Posts/Index', [
        'posts'   => fn () => Post::query()->filter($request)->paginate(),
        'filters' => $request->only(['q', 'status']),
    ]);
}
```

::: details Penjelasan Kode
- `'posts' => fn () => Post::query()->filter($request)->paginate()` — closure sebagai partial evaluator. Inertia hanya eksekusi closure jika prop `posts` termasuk dalam `only` di partial reload. Bila tidak diminta, closure tidak dipanggil — query tidak dieksekusi. Hemat resource server.
- `'filters' => $request->only(['q', 'status'])` — kirim balik filter yang sedang aktif agar UI bisa menampilkan state input.
:::

## 23.7 Deploy ke VPS (Nginx + Ubuntu)

### Langkah umum

1. Upload kode via Git:
   ```bash
   ssh user@server
   cd /var/www && git clone https://github.com/you/app.git
   cd app
   ```
2. Install dependency:
   ```bash
   composer install --no-dev --optimize-autoloader
   npm ci && npm run build
   ```
3. Migrasi DB:
   ```bash
   php artisan migrate --force
   ```
4. Generate key & cache:
   ```bash
   php artisan key:generate
   php artisan optimize
   php artisan storage:Link
   ```
5. Permission:
   ```bash
   chown -R www-data:www-data /var/www/app
   chmod -R 775 storage bootstrap/cache
   ```

### Nginx config

```nginx
server {
    listen 80;
    server_name app.test;
    root /var/www/app/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known.*) { deny all; }
}
```

::: details Penjelasan Kode
- `root /var/www/app/public;` — document root mengarah ke `public/`. Hanya folder ini yang boleh web-accessible; seluruh kode Laravel (`.env`, `config`, `app/`) tidak boleh diakses publik.
- `try_files $uri $uri/ /index.php?$query_string;` — fallback routing Laravel. Coba $uri sebagai file static, lalu cek sebagai folder, lalu fallback ke `index.php` dengan query string dipertahankan. Inilah yang membuat route Laravel bekerja.
- `fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;` — teruskan request PHP ke PHP-FPM via Unix socket (lebih cepat dari TCP). Versi sesuai install (8.2/8.3).
- `fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;` — beritahu PHP-FPM path file yang harus dieksekusi. `$realpath_root` resolve symlink (penting untuk Envoyer zero-downtime).
- `location ~ /\.(?!well-known.*) { deny all; }` — tolak akses file hidden (`.env`, `.git`) kecuali `.well-known/` (Let's Encrypt ACME challenge).
:::

### Environment server

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://app.test
ASSET_URL=https://cdn.app.test   # opsional, untuk serving via CDN
```

::: details Penjelasan Kode
- `APP_DEBUG=false` — wajib false di production. Bila true, error detail (stack trace, env values) tampil ke user — kritikal celah keamanan.
- `APP_URL=https://app.test` — dipakai untuk generate URL absolute ( artisan, mail, etc).
- `ASSET_URL` — Vite + Laravel pakai ini sebagai prefix URL untuk ` asset(...)` dan `@vite`. Berguna saat asset di-serve dari CDN/S3.
:::

## 23.8 Setup Supervisor untuk Queue Worker

```ini
[program:app-worker]
command=php /var/www/app/artisan queue:work redis --sleep=3 --tries=3
numprocs=2
autostart=true
autorestart=true
user=www-data
```

::: details Penjelasan Kode
- `command=php /var/www/app/artisan queue:work redis` — worker process yangakukan job dari queue `redis` connection. Pakai path absolut artisan; tidak bergantung cwd.
- `--sleep=3` — jika tidak ada job, jeda 3 detik sebelum poll lagi. Mengurangi beban Redis/CPU.
- `--tries=3` — maksimum retry job gagal sebelum masuk ke failed_jobs table.
- `numprocs=2` — dua worker paralel. Bisa konsumsi dari queue yang sama atau beda (`--queue=high,default`).
- `user=www-data` — worker berjalan sebagai user web agar permission file storage konsisten dengan PHP-FPM.
- `autorestart=true` — restart bila worker crash; menjaga queue tetap diproses 24/7.
:::

Reload: `supervisorctl reread && supervisorctl update && supervisorctl start app-worker:*`.

## 23.9 Supervisor untuk Inertia SSR (opsional)

```ini
[program:inertia-ssr]
command=php /var/www/app/artisan inertia:start-ssr
numprocs=1
autostart=true
autorestart=true
user=www-data
```

::: details Penjelasan Kode
- `numprocs=1` — hanya satu process SSR; state rendering tidak benefit dari multiple instance dan boros memory.
- Detailed: bootstrapping Node + reload component tree tiap process; multiple procs tidak meningkatkan throughput single user.
- Berjalan sebagai user `www-data` agar konsisten dengan web user.
:::

## 23.10 Deploy via Laravel Forge

1. Buat server di Forge (DigitalOcean / AWS / Linode / Hetzner).
2. Tambahkan SSH key GitHub → Forge provision otomatis server (Nginx, PHP-FPM, MySQL).
3. Buat site, isi source = GitHub repo branch.
4. Setup environment editor di Forge UI.
5. Tambahkan deploy hook:
   ```
   composer install --no-dev --optimize-autoloader
   npm ci && npm run build
   php artisan migrate --force
   php artisan optimize
   ```
6. Aktifkan Quick Deploy — `git push` akan auto deploy.
7. SSL otomatis via Let's Encrypt.

## 23.11 Deploy via Ploi

Alternatif Forge, lebih murah. Fitur serupa:

- Provision server (Ubuntu 22/24).
- Site → Git repo → auto deploy on push.
- Database & SSL otomatis.
- Cron job & queue worker UI.
- SSH isolation per site.

## 23.12 Deploy via Envoyer (zero downtime)

Untuk zero-downtime deploy:

1. Push release ke server baru (folder terpisah).
2. Symlink `current` ke release baru.
3. Jalankan hook (migrate, optimize) sebelum aktivasi.
4. Rollback mudah.

## 23.13 Environment Variables di Produksi

:::danger Jangan commit `.env
- Tambah `.env` ke `.gitignore`.
- Set via Forge/Ploi UI atau manual di server.
:::

Pemisahan `VITE_` prefix:

```ini
VITE_REVERB_APP_KEY=abc123    # di-akses di Vue via import.meta.env.VITE_REVERB_APP_KEY
APP_SECRET=...                 # backend-only, tidak bocor ke frontend
```

::: details Penjelasan Kode
- `VITE_` prefix — konvensi Vite: hanya env variable yang dimulai `VITE_` akan di-expose ke client bundle via `import.meta.env.VITE_*`.
- `APP_SECRET=...` — backend-only. Bila nilai ini tidak ada yang akses via `process.env` di `vite.config.js`, tidak akan masuk bundle client.
- Variabel non-`VITE_`-prefixed **tidak** akan tersedia di `import.meta.env` di Vue.
- Wajib bagi kunci Reverb/Pusher, API key publik Stripe, dll — bukan server secret.
:::

## 23.14 Asset via CDN

`ASSET_URL` mengubah URL asset bila ingin pakai CDN / S3:

```ini
ASSET_URL=https://cdn.app.test/build
```

Vite + Laravel akan menggunakan prefix ini untuk semua asset.

## 23.15 Health Check & Monitoring

Tambahkan endpoint `/up`:

```php
Route::get('/up', function () {
    return response(status: 200);
})->middleware('throttle:60');
```

::: details Penjelasan Kode
- Endpoint `/up` — health check endpoint minimal. Laravel juga punya `health/up` bawaan; ini alternatif ringkas.
- `->middleware('throttle:60')` — limit 60 request per menit per IP agar tidak di-DDoS oleh monitor agresif.
- Monitor dengan UptimeRobot, Sentry, atau Health (spatie/laravel-health).
:::

## 23.16 Backup & Restore

- DB: `spatie/laravel-backup` ke S3.
- Storage: sinkron `/storage/app/public` ke S3 via `s3` filesystem.
- Code: git tag release untuk rollback.

## 23.17 Ringkasan Bab

- `npm run build` minify + fingerprint asset sebagai cache-busting.
- `php artisan optimize` cache route, config, view.
- Inertia-specific: lazy props + partial reload + prefetch.
- Deploy ke Nginx: clone, `composer install --no-dev`, `npm ci && npm run build`, `php artisan migrate --force`, `php artisan optimize`.
- Supervisor untuk queue worker + Inertia SSR.
- Forge / Ploi / Envoyer untuk otomatisasi.
- `.env` di server, bukan di repo. Variabel Vue pakai prefix `VITE_`.

:::tip Selanjutnya
[Bab 24](/bagian-6/bab-24/): rangkum semuanya dengan mini project lengkap — Task Manager dari nol sampai produksi.
:::