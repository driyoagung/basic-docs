---
title: 24.2 - Setup Project & Instalasi
---

# 24.2 Setup Project & Instalasi

:::info Langkah 2 dari 15
Kita siapkan project Laravel baru dengan Inertia + Vue + Tailwind, plus paket pendukung.
:::

## Perintah Instalasi

```bash
# 1. Buat project Laravel baru
composer create-project laravel/laravel task-manager
cd task-manager

# 2. Install Breeze dengan stack Inertia + Vue
composer require laravel/breeze --dev
php artisan breeze:install vue
php artisan migrate

# 3. Install Ziggy (helper route() di JavaScript)
composer require tightenco/ziggy

# 4. Paket UI parallel
npm install @headlessui/vue @heroicons/vue

# 5. Jalankan Vite dev server
npm run dev
```

::: details Penjelasan Kode
- `composer create-project laravel/laravel task-manager` - menjalankan Composer untuk membuat project Laravel baru bernama `task-manager` di folder baru, lengkap dengan dependency awal.
- `composer require laravel/breeze --dev` - memasang paket Breeze sebagai dependency `--dev` (hanya untuk development), karena scaffold auth hanya dibutuhkan saat setup, bukan runtime production.
- `php artisan breeze:install vue` - perintah Artisan dari Breeze yang meng-generate scaffold autentikasi dengan stack **Vue + Inertia** (bukan Blade/React). Ia membuat controller, routes, page component, dan konfigurasi Vite sekaligus.
- `composer require tightenco/ziggy` - memasang Ziggy, paket yang men-ekspos route Laravel ke JavaScript, sehingga helper `route('dashboard')` bisa dipakai di file `.vue`.
- `npm install @headlessui/vue @heroicons/vue` - memasang Headless UI (komponen aksesibel tanpa styling, mis. `Dialog`, `Menu`) dan Heroicons (set ikon SVG yang konsisten).
- `npm run dev` - menjalankan Vite dev server dengan HMR (Hot Module Replacement); saat file `.vue` berubah, browser otomatis reload tanpa refresh penuh.
:::

## Hasil Struktur

```text
resources/js/
├── Components/
├── Layouts/
│   └── AppLayout.vue
├── Pages/
│   ├── Dashboard.vue
│   ├── Auth/
│   └── ...
└── app.js
```

## Apa Saja yang Disiapkan Breeze

- Page components `Auth/Login.vue`, `Register.vue`, `ForgotPassword.vue`, dll.
- Routes di `routes/auth.php`.
- Controller di `app/Http/Controllers/Auth/`.
- Middleware `HandleInertiaRequests`.
- Konfigurasi Tailwind + `vite.config.js`.

## Verifikasi

Buka `http://localhost` - akan muncul halaman landing Breeze. Klik **Login** di kanan atas - harus muncul form login yang sudah jadi.

:::warning Jangan jadikan Breeze kotak hitam
Setelah setup, baca setiap file yang di-generate. Bab-bab berikutnya banyak merujuk file yang sama dengan Breeze - jadi pahami strukturnya.
:::

## Selanjutnya

Setelah project siap, lanjut ke [24.3 - Database: Migration & Model](/bagian-6/bab-24/24-3-migration-model).