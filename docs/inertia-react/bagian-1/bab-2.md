---
title: "Bab 2 — Setup Project"
---

# 📖 Bab 2 — Setup Project

Cara tercepat memulai Laravel + Inertia + React adalah **Laravel Breeze** dengan preset React. Breeze menyiapkan entry point Inertia, root Blade, layout, halaman auth, Tailwind, dan konfigurasi Vite sekaligus. Bab ini membedah hasil instalasinya supaya Anda tahu file mana yang penting dan mengapa.

---

## 2.1 🚀 Instalasi dengan Breeze

Prasyarat: PHP 8.2+, Composer, Node 18+, dan database (MySQL/SQLite).

```bash
laravel new toko-inertia
cd toko-inertia

composer require laravel/breeze --dev
php artisan breeze:install react
# Pilih: dark mode? testing framework? (Pest direkomendasikan)

php artisan migrate
npm install
npm run dev
php artisan serve
```

Alternatif bila project sudah ada:

```bash
composer require inertiajs/inertia-laravel
php artisan inertia:middleware
npm install @inertiajs/react react react-dom
npm install -D @vitejs/plugin-react
```

| Langkah | Hasil |
|---|---|
| `breeze:install react` | Inertia, React, Tailwind, halaman auth, layout |
| `php artisan migrate` | Tabel `users`, `password_reset_tokens`, `sessions` |
| `npm run dev` | Vite dev server (hot reload) |
| `php artisan serve` | Server Laravel di `http://127.0.0.1:8000` |

> ⚠️ **Dua terminal.** `npm run dev` dan `php artisan serve` harus berjalan bersamaan. Jika lupa Vite, halaman akan error karena aset belum dibangun.

---

## 2.2 🗂️ Anatomi Folder Project

```text
toko-inertia/
├── app/
│   ├── Http/
│   │   ├── Controllers/              ← return Inertia::render(...)
│   │   └── Middleware/
│   │       └── HandleInertiaRequests.php   ← ⭐ shared data
│   └── Models/
├── bootstrap/
│   └── app.php                       ← daftar middleware (Laravel 11)
├── resources/
│   ├── css/app.css
│   ├── js/
│   │   ├── app.jsx                   ← ⭐ entry point Inertia
│   │   ├── bootstrap.js
│   │   ├── Pages/                    ← ⭐ satu file = satu halaman
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Auth/
│   │   │   └── Products/
│   │   │       ├── Index.jsx
│   │   │       ├── Create.jsx
│   │   │       └── Edit.jsx
│   │   ├── Layouts/                  ← layout bersama
│   │   └── Components/               ← komponen reusable
│   └── views/
│       └── app.blade.php             ← ⭐ satu-satunya Blade
├── routes/
│   ├── web.php                       ← semua route aplikasi
│   └── auth.php                      ← route Breeze
├── vite.config.js
└── package.json
```

Hal yang perlu diingat:

- **`Pages/` adalah cermin dari nama komponen Inertia.** `Inertia::render('Products/Index')` mencari `Pages/Products/Index.jsx`.
- **`Layouts/` dan `Components/` tidak dirender langsung** oleh Inertia; keduanya diimpor oleh halaman.
- **Tidak ada `routes/api.php`** yang wajib untuk fitur aplikasi ini.

---

## 2.3 📄 Tiga File Inti

### 1. Root Blade — `resources/views/app.blade.php`

Satu-satunya file Blade yang dibutuhkan:

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
```

| Direktif | Fungsi |
|---|---|
| `@routes` | Menyuntikkan daftar route Ziggy ke JavaScript |
| `@viteReactRefresh` | Hot reload React saat development |
| `@vite([...])` | Memuat entry + komponen halaman yang sedang dibuka |
| `@inertiaHead` | Menghormati `<Head>` dari React |
| `@inertia` | Tempat React di-mount |

### 2. Entry Point — `resources/js/app.jsx`

```jsx
import './bootstrap'
import '../css/app.css'

import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'

createInertiaApp({
  title: (title) => `${title} - Toko`,

  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.jsx`,
      import.meta.glob('./Pages/**/*.jsx'),
    ),

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },

  progress: { color: '#4B5563' },
})
```

**Penjelasan:**

- **`resolve`** — mengubah nama komponen (`Products/Index`) menjadi modul halaman. `import.meta.glob` membuat Vite memecah bundle per halaman (code splitting otomatis).
- **`setup`** — titik mount React; `props` di sini adalah page object dari Laravel.
- **`progress`** — progress bar saat navigasi, memberi umpan balik tanpa spinner manual.

### 3. Middleware — `app/Http/Middleware/HandleInertiaRequests.php`

Mendaftarkannya di `bootstrap/app.php` (Laravel 11):

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\HandleInertiaRequests::class,
    ]);
})
```

Middleware ini bertugas menyediakan **shared data** (`auth`, `flash`, dsb) dan menangani versi aset. Isinya dibahas di Bab 7.

---

## 2.4 🔧 Ziggy — Helper `route()` di JavaScript

Ziggy mengekspos route Laravel ke frontend sehingga Anda tidak menulis URL manual.

```jsx
import { route } from 'ziggy-js'

route('products.index')                 // /products
route('products.show', 5)               // /products/5
route('products.edit', { product: 5 })  // /products/5/edit
```

Tanpa Ziggy, Anda menulis string seperti `/products/5/edit` — rawan salah saat route berubah. Dengan Ziggy, perubahan `routes/web.php` otomatis tercermin.

| Kebutuhan | Pemakaian |
|---|---|
| Route tanpa parameter | `route('dashboard')` |
| Route dengan ID | `route('products.edit', product.id)` |
| Route dengan query | `route('products.index', { search: 'laptop' })` |
| Cek route aktif | `route().current('products.*')` |

> 💡 **Bila `route()` tidak dikenali:** pastikan `@routes` ada di `app.blade.php` atau impor dari `ziggy-js`. Jangan mencampur dua cara sekaligus.

---

## 2.5 ✅ Verifikasi Instalasi

Sebelum lanjut, pastikan semuanya berjalan:

1. Buka `http://127.0.0.1:8000` — halaman welcome Breeze tampil.
2. Buka `/register`, buat akun, lalu login — diarahkan ke `/dashboard`.
3. Buka DevTools → Network, klik menu — request memiliki header `X-Inertia: true`.
4. Ubah teks di `Pages/Dashboard.jsx` — halaman berubah tanpa reload penuh (hot reload).

```bash
# Cek route terdaftar
php artisan route:list

# Cek build produksi
npm run build
```

Jika langkah 3 gagal, kemungkinan middleware Inertia belum terdaftar atau `app.blade.php` tidak memakai `@inertia`.

---

## 2.6 🧱 Struktur Halaman Awal Breeze

Breeze membuat beberapa halaman yang bisa langsung dipelajari:

| File | Isi |
|---|---|
| `Pages/Dashboard.jsx` | Halaman setelah login, memakai `AuthenticatedLayout` |
| `Pages/Auth/Login.jsx` | Form login dengan `useForm` |
| `Pages/Auth/Register.jsx` | Form register |
| `Layouts/AuthenticatedLayout.jsx` | Navbar + container untuk halaman login |
| `Layouts/GuestLayout.jsx` | Layout halaman auth |
| `Components/TextInput.jsx` | Input reusable + `InputError` |

Membaca file-file ini adalah cara tercepat memahami pola Inertia React yang idiomatik — dan semuanya akan dibahas ulang di bab-bab berikutnya.

---

## ✅ Checklist Bab 2

- **Breeze React** — jalur tercepat: Inertia, React, Tailwind, auth, dan Vite sekaligus.
- **Dua proses** — `npm run dev` dan `php artisan serve` harus berjalan bersamaan.
- **`app.blade.php`** — satu-satunya Blade; berisi `@routes`, `@vite`, `@inertiaHead`, `@inertia`.
- **`app.jsx`** — entry point; `resolve` memetakan nama komponen ke file di `Pages/`.
- **`HandleInertiaRequests`** — didaftarkan di `bootstrap/app.php`; sumber shared data.
- **Ziggy** — `route()` menghindari URL hardcode.
- **Verifikasi** — login berhasil, header `X-Inertia: true` terlihat, `npm run build` lulus.

---

⏭️ Lanjut ke [🔄 Bab 3 — Cara Kerja Inertia](/bagian-1/bab-3) untuk melanjutkan!
