---
title: Bab 2 — Setup Project Laravel + Inertia + Vue
---

# Bab 2: Setup Project Laravel + Inertia + Vue

:::info Bagian I — Jembatan
Bab ini panduan step-by-step menyiapkan project Laravel + Inertia.js + Vue 3 + Tailwind CSS dari nol, atau via Laravel Breeze.
:::

## 2.1 Prasyarat

Pastikan environment kamu sudah memenuhi:

| Tools | Versi | Catatan |
| --- | --- | --- |
| PHP | 8.2+ | Wajib untuk Laravel 11 |
| Composer | 2.6+ | Dependency manager PHP |
| Node.js | 18+ / 20+ LTS | Untuk build asset |
| npm / pnpm | npm 10+ atau pnpm 9+ | Bebas, pilih satu |
| Database | MySQL 8 / SQLite / Postgres | SQLite cukup untuk lokal |

## 2.2 Membuat Project Laravel Baru

Cara dengan Composer:

```bash
composer create-project laravel/laravel inertia-app
cd inertia-app
php artisan key:generate
```

::: details Penjelasan Kode
- `composer create-project laravel/laravel inertia-app` — mengunduh skeleton Laravel terbaru ke folder `inertia-app`. Composer menjalankan `composer install` otomatis dan menyiapkan struktur direktori standar (`app/`, `routes/`, `config/`, dll).
- `cd inertia-app` — masuk ke direktori project yang baru dibuat agar perintah artisan berikutnya berjalan di lokasi yang tepat.
- `php artisan key:generate` — membuat string acak (`APP_KEY`) dan menulisnya ke `.env`. Key ini dipakai Laravel untuk enkripsi data session, CSRF token, dan signed URL; tanpa key, banyak fitur akan error.
:::

Atau gunakan Laravel installer:

```bash
laravel new inertia-app
```

Pilih **None** untuk starter kit saat ditanya (kita akan setup Inertia manual agar paham strukturnya). Jika ingin cepat, lihat [§2.7 Laravel Breeze](#_2-7-instalasi-dengan-laravel-breeze-cara-cepat).

## 2.3 Instalasi Inertia — Sisi Server (Laravel)

Install package server adapter:

```bash
composer require inertiajs/inertia-laravel
```

Publish middleware Inertia:

```bash
php artisan inertia:middleware
```

Perintah ini membuat file `app/Http/Middleware/HandleInertiaRequests.php`. Daftarkan middleware di `bootstrap/app.php`:

```php
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
    })
    ->create();
```

::: details Penjelasan Kode
- `use App\Http\Middleware\HandleInertiaRequests;` — mengimpor kelas middleware yang baru di-publish. Middleware inilah yang akan mencegat setiap response, mendeteksi header `X-Inertia`, lalu memutuskan apakah harus kembalikan HTML penuh atau JSON Inertia.
- `Application::configure(dirname(__DIR__))` — API bootstrap Laravel 11 yang membaca root project. Ini menggantikan `RouteServiceProvider`/`Kernel.php` gaya lama.
- `->withMiddleware(function (Middleware $middleware) { ... })` — callback untuk mengkustomisasi stack middleware. Di sini kita menambah (append) ke grup `web` (yang berisi session, cookie, encrypt session, share errors, dll).
- `$middleware->web(append: [HandleInertiaRequests::class])` — parameter `append` menambahkan middleware ke **akhir** dari stack `web` yang sudah ada, sehingga middleware Inertia berjalan setelah middleware session. Urutan ini penting karena Inertia butuh session & error data yang sudah ter-populate.
- Mengapa harus didaftarkan? Tanpa middleware ini, server adapter tidak bisa membedakan request standar (butuh HTML) vs Inertia XHR (butuh JSON), dan shared data tidak akan di-inject.
:::

## 2.4 Root Template `app.blade.php`

Inertia hanya butuh **satu file Blade** sebagai root template. Buat `resources/views/app.blade.php`:

```html
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="/favicon.ico" />
    @routes
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @inertiaHead
  </head>
  <body class="bg-gray-50 antialiased">
    @inertia
  </body>
</html>
```

::: details Penjelasan Kode
- `&lt;html lang="&#123;&#123; str_replace('_', '-', app()->getLocale()) &#125;&#125;">` — set atribut `lang` HTML dari konfigurasi locale Laravel (mis. `id` atau `en`). `str_replace('_', '-')` mengonversi format seperti `id_ID` ke `id-ID` yang valid untuk HTML.
- `@routes` — directive dari Ziggy yang menghasilkan tag `&lt;script>` berisi semua nama route Laravel + parameternya, lalu menempelkannya ke objek `window.route` sehingga bisa dipakai di JavaScript.
- `@vite(['resources/css/app.css', 'resources/js/app.js'])` — directive dari `laravel-vite-plugin`. Saat dev, ini menghasilkan tag `&lt;script type="module">` dan `&lt;link>` yang menunjuk ke Vite dev server (HMR). Saat production, ia menulis path ke file yang sudah di-build dengan hash cache-busting.
- `@inertiaHead` — tempat Inertia menyuntikkan elemen yang seharusnya ada di `&lt;head>` per halaman, misalnya `&lt;title>`, meta tag, canonical, dari komponen `&lt;Head>` di Vue. Tanpa directive ini, perubahan title per-halaman tidak akan muncul.
- `@inertia` — titik mount utama. Saat full page load, Inertia akan menulis `&lt;div id="app" data-page="...JSON...">` di posisi ini. Aplikasi Vue kemudian mount ke `#app` dan membaca JSON dari atribut `data-page` untuk hydrate state awal.
- Hanya satu Blade file ini yang ada di seluruh aplikasi — semua halaman Vue akan dirender di dalam `@inertia`.
:::

Penjelasan directive:

- `@inertia` — titik mount Vue (Vue aplikasi akan dirender di sini).
- `@inertiaHead` — mengizinkan Inertia menyuntikkan `<title>`, meta tag dari `page.props` secara dinamis.
- `@routes` — dari Ziggy, generate helper `route()` di window (opsional, dibahas Bab 6).

Konfigurasi root template di config (Laravel 11 otomatis pakai `app.blade.php` jika ada; jika tidak, kamu bisa set manual di `HandleInertiaRequests::rootView()`):

```php
public function rootView(Request $request): string
{
    return 'app';
}
```

::: details Penjelasan Kode
- `public function rootView(Request $request): string` — override method di `HandleInertiaRequests`. Menerima `Request` agar bisa return view berbeda berdasarkan kondisi (mis. layout berbeda untuk admin vs publik).
- `return 'app'` — nama view Blade (tanpa ekstensi) yang dipakai sebagai wrapper HTML penuh. Ini menunjuk ke `resources/views/app.blade.php`. Laravel akan resolve lewat view resolver standar.
- Maven cara ini dipakai hanya kalau konvensi otomatis (`app.blade.php`) tidak cocok — mis. kamu pakai multi-layout atau struktur non-standar.
:::

## 2.5 Instalasi Inertia — Sisi Client (Vue)

Install Vue dan adapter Inertia untuk Vue 3:

```bash
npm install vue @inertiajs/vue3
```

Buat file entry JavaScript `resources/js/app.js`:

```js
import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'

createInertiaApp({
  // resolve: Tentukan file Vue mana yang akan di-render
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
    return pages[`./Pages/${name}.vue`]
  },

  // setup: Mount Vue app ke #app di root template
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
})
```

::: details Penjelasan Kode
- `import { createApp, h } from 'vue'` — `createApp` factory standar Vue 3 untuk membuat instance aplikasi; `h` adalah hyperscript helper untuk membuat VNode secara manual (alternatif dari render template).
- `import { createInertiaApp } from '@inertiajs/vue3'` — fungsi utama adapter Vue. Bertanggung jawab menyiapkan state Inertia, mendengarkan navigasi, memelihara History API, dan mengomunikasikan versi asset ke server.
- `createInertiaApp({...})` — satu-satunya entry point client. Wajib menerima dua callback: `resolve` (petakan nama komponen → modul Vue) dan `setup` (mount aplikasi).
- `resolve: name => { ... }` — menerima `name` string yang dikirim server (mis. `'Posts/Index'`) dan wajib return modul komponen Vue yang sesuai. Inilah "router"-nya Inertia — bukan URL string, tapi pemetaan nama komponen ke file.
- `import.meta.glob('./Pages/**/*.vue', { eager: true })` — fitur Vite untuk mengimpor banyak file sekaligus dengan glob pattern. `eager: true` memuat semua langsung (sinkron) saat build, menghasilkan object map `{ path: module }`. Alternatif: tanpa `eager` untuk lazy-load per-route (code splitting).
- `return pages[`./Pages/${name}.vue`]` — lookup object berdasarkan path yang sudah dikonstruksi. Mis. `name='Posts/Index'` → `./Pages/Posts/Index.vue`.
- `setup({ el, App, props, plugin })` — dijalankan setelah `resolve` selesai. Menerima:
  - `el` — elemen DOM `#app` tempat Vue di-mount.
  - `App` — root component spesial yang dibungkus Inertia (berisi page component aktif + provider).
  - `props` — props awal (dari `data-page` JSON saat full load, atau JSON response XHR pada navigasi berikutnya).
  - `plugin` — Vue plugin resmi Inertia yang mendaftarkan `router`, `usePage`, `useForm`, `&lt;Link>`, `&lt;Head>` ke aplikasi.
- `createApp({ render: () => h(App, props) })` — buat instance Vue dengan render function yang me-render `App` (root Inertia) dan meneruskan `props`. Pakai `h` karena `App` adalah komponen dinamis.
- `.use(plugin)` — daftarkan plugin Inertia agar composable seperti `usePage()`, `useForm()` dapat dipakai di seluruh page component.
- `.mount(el)` — mount ke elemen `#app`. Setelah ini, navigasi link Inertia akan swap page component tanpa reload.
:::

## 2.6 Instalasi Ziggy (Helper `route()`)

Agar bisa pakai `route('posts.show', 1)` di JavaScript sama seperti di Blade:

```bash
composer require tightenco/ziggy
```

Tambahkan directive `@routes` di root template (sudah ada di contoh §2.4). Untuk mengubah agar `route()` bisa di-import di file:

```bash
php artisan ziggy:generate
```

::: details Penjelasan Kode
- `php artisan ziggy:generate` — generate file `resources/js/ziggy.js` (default) berisi definisi semua route Laravel beserta parameternya. Sehingga di kodemu bisa `import { route } from 'ziggy'` alih-alih mengandalkan `window.route` dari `@routes`.
:::

## 2.7 Setup Tailwind CSS v3

Install Tailwind + PostCSS + Autoprefixer:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

::: details Penjelasan Kode
- `npm install -D tailwindcss postcss autoprefixer` — install sebagai dev dependency (`-D`) karena hanya dipakai saat build. PostCSS adalah processor yang menjalankan plugin Tailwind + Autoprefixer.
- `npx tailwindcss init -p` — menjalankan biner Tailwind untuk membuat `tailwind.config.js` dengan default. Flag `-p` (postcss) juga membuat `postcss.config.js` yang otomatis mendaftarkan `tailwindcss` dan `autoprefixer` ke pipeline PostCSS Vite.
:::

Edit `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.vue',
  ],
  theme: { extend: {} },
  plugins: [],
}
```

::: details Penjelasan Kode
- `/** @type {import('tailwindcss').Config} */` — anotasi JSDoc yang memberi tahu editor (& TypeScript language server) tipe object konfigurasi, memungkinkan autocomplete field `theme`, `content`, dll.
- `export default { ... }` — konfigurasi sebagai ES module (Vite mendukung ESM di config).
- `content: [...]` — **paling penting**. Tailwind memindai file di pola ini untuk mencari class yang dipakai, lalu hanya menghasilkan CSS untuk class tersebut (tree-shaking). Tanpa mendaftar `*.vue`, class Tailwind yang kamu tulis di template Vue tidak akan masuk build CSS.
  - `'./resources/**/*.blade.php'` — semua Blade (untuk root template & markup statis).
  - `'./resources/**/*.js'` — termasuk file entry `app.js` dan helper yang memakai class dinamis.
  - `'./resources/**/*.vue'` — semua page component & komponen reusable.
- `theme: { extend: {} }` — kunci `extend` menambah (bukan menimpa) token default Tailwind. Kalau kamu override dengan field top-level `theme: { colors: {...} }`, kamu menghapus palet default seluruhnya.
- `plugins: []` — array plugin PostCSS tambahan, mis. `@tailwindcss/forms` untuk styling input otomatis.
:::

Edit `resources/css/app.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

::: details Penjelasan Kode
- `@tailwind base;` — injeksi layer `base` berisi reset/pre-flight (normalisasi margin, padding default, font inheritance, dll).
- `@tailwind components;` — layer kosong untuk komponen kelas `.btn`, `.card` jika kamu pakai `@layer components` di CSS sendiri.
- `@tailwind utilities;` — layer utama berisi utility class (`text-gray-500`, `flex`, `mt-4`, dll). Inilah yang dipakai tree-shaking berdasarkan file di `content`.
- Urutan tiga directive ini wajib: `base` → `components` → `utilities` agar utility bisa override style component tanpa specificity war.
:::

:::tip Alternatif Tailwind v4 dengan Vite plugin
Untuk Tailwind v4 (2025), gunakan plugin `@tailwindcss/vite`:
```bash
npm install tailwindcss @tailwindcss/vite
```
Lalu dalam `vite.config.js` tambahkan `tailwindcss()` ke plugin, dan `resources/css/app.css` cukup berisi `@import "tailwindcss";`.
:::

## 2.8 Konfigurasi `vite.config.js`

File konfigurasi:

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.js'],
      refresh: true,
    }),
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/js'),
    },
  },
})
```

::: details Penjelasan Kode
- `import { defineConfig } from 'vite'` — helper typing Wrapper agar `vite.config.js` dapat autocomplete & TypeScript support tanpa perlu `tsconfig`.
- `import laravel from 'laravel-vite-plugin'` — plugin Laravel yang menjembatani Vite dengan Blade. Bertanggung jawab menyajikan dev server di `http://localhost:5173`, mengganti URL asset saat build, dan menyuntik entry ke directive `@vite` di Blade.
- `import vue from '@vitejs/plugin-vue'` — compile `.vue` SFC (Single File Component) menjadi JS+bundled CSS. Tanpa ini, Vite tidak tahu cara memproses `&lt;template>`, `&lt;script>`, `&lt;style scoped>`.
- `import path from 'path'` — modul bawaan Node untuk operasi path (di sini membuat alias absolut).
- `input: ['resources/css/app.css', 'resources/js/app.js']` — daftar entry point. Setiap entry akan jadi file output terpisah. `app.js` akan mereferensikan semua dependency (Vue, Inertia, Pages) ter-bundle. `app.css` mereferensikan Tailwind.
- `refresh: true` — mode "BLADE/PHP reload". Saat file Blade atau PHP berubah, Laravel plugin me-refresh halaman browser (bukan HMR Vue). Berguna saat edit root template `app.blade.php`.
- `vue()` — aktifkan proses SFC. Tidak perlu opsi default karena preset Vue 3 sudah ideal.
- `resolve.alias['@'] = path.resolve(__dirname, 'resources/js')` — buat alias `@` yang selalu menunjuk ke folder `resources/js/` terlepas dari lokasi file pemanggil. Berguna menghindari `../../../Layouts/AppLayout.vue` dan ganti dengan `@/Layouts/AppLayout.vue`. `__dirname` adalah direktori file config (root project).
:::

Penjelasan:

- **`laravel-vite-plugin`** — inject asset otomatis ke Blade root template.
- **`@vitejs/plugin-vue`** — menangani `.vue` SFC.
- **Alias `@`** — shortcut untuk `resources/js/`, sehingga import jadi `import AppLayout from '@/Layouts/AppLayout.vue'`.
- **`refresh: true`** — HMR otomatis saat file Blade/PHP berubah.

## 2.9 Verifikasi Setup Awal

Buat satu contoh page component di `resources/js/Pages/Welcome.vue`:

```vue
<script setup>
defineProps({ msg: String })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <h1 class="text-3xl font-bold">{{ msg }}</h1>
  </div>
</template>
```

::: details Penjelasan Kode
- `&lt;script setup>` — syntax Vue 3 Composition API yang ringkas. Variabel/fungsi yang dideklarasikan di sini otomatis tersedia di `&lt;template>` tanpa perlu `return` seperti di `setup()` tradisional.
- `defineProps({ msg: String })` — macro compile-time (bukan runtime function) untuk mendeklarasikan props yang diterima komponen. `msg: String` adalah validasi runtime ringan: Vue memperingatkan di dev kalau `msg` bukan string. Nilai props dikirim dari server via `Inertia::render('Welcome', ['msg' => '...'])` dan otomatis masuk ke sini.
- `&lt;template>` — markup HTML-like yang di-compile Vite menjadi render function. Hanya boleh satu root element; di sini dibungkus `&lt;div>`.
- `&#123;&#123; msg &#125;&#125;` — text interpolation. Aman dari XSS karena Vue otomatis escape HTML.
- Class Tailwind (`min-h-screen`, `flex`, `items-center`, `justify-center`, `text-3xl`, `font-bold`) — utility untuk layout centering dan tipografi. Akan masuk CSS build karena file `.vue` sudah terdaftar di `content` Tailwind config.
:::

Buat route sederhana di `routes/web.php`:

```php
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', ['msg' => 'Halo dari Inertia!']);
});
```

::: details Penjelasan Kode
- `use Inertia\Inertia;` — import facade Inertia yang disediakan `inertia-laravel`. Facade ini yang menyediakan API seperti `Inertia::render()`, `Inertia::share()`, `Inertia::lazy()`.
- `Route::get('/', function () { ... })` — definisi route GET ke `/` dengan closure (anonymous function) sebagai handler. Pada aplikasi nyata, kamu akan pindahkan logic ke method controller (`[WelcomeController::class, 'index']`).
- `return Inertia::render('Welcome', ['msg' => 'Halo dari Inertia!'])` — ekuivalen Inertia dari `return view('welcome', ['msg' => '...'])` di Blade. Argumen pertama adalah nama komponen (dipetakan oleh fungsi `resolve` di `app.js` ke `Pages/Welcome.vue`); argumen kedua adalah array props yang akan dikirim ke Vue.
- Props `msg` otomatis muncul sebagai string JSON di dalam `data-page` root template. Vue page component menerimanya via `defineProps({ msg: String })`.
- Tidak ada perubahan routing — tetap di `routes/web.php`, tetap method standar Laravel. Inertia hanya mengubah apa yang direturn ke browser.
:::

Jalankan dua terminal:

```bash
# Terminal 1
php artisan serve

# Terminal 2
npm run dev
```

Buka `http://localhost:8000`. Kamu akan melihat teks **"Halo dari Inertia!"**. Coba ubah `msg` di controller lalu refresh — Vite HMR akan update tampilan tanpa reload penuh.

## 2.10 Instalasi dengan Laravel Breeze (Cara Cepat)

Jika ingin cepat punya auth siap pakai, gunakan Breeze dengan stack Inertia:

```bash
composer require laravel/breeze --dev
php artisan breeze:install vue
```

::: details Penjelasan Kode
- `composer require laravel/breeze --dev` — install Breeze sebagai dependency dev (`--dev`) karena hanya dipakai untuk scaffolding, bukan runtime production. Paket masuk ke `require-dev` di `composer.json`.
- `php artisan breeze:install vue` — jalankan installer interaktif. Argumen `vue` menentukan stack: Vue + Inertia (bukan `blade` atau `api`). Installer akan: menyalin controller Auth (`ProfileController`, `Auth/AuthenticatedSessionController`, dll), generate page Vue (`Auth/Login.vue`, `Auth/Register.vue`, `Dashboard.vue`), setup `HandleInertiaRequests`, menulis ulang `vite.config.js`, serta menanam migration `users`, `password_reset_tokens`, `sessions` (jika belum ada).
:::

Saat diminta, pilih:

- **Stack**: Vue with Inertia
- **Inertia SSR**: Optional (pilih no jika baru)
- **Testing**: Pest atau PHPUnit (opsional)

Breeze akan otomatis:

- Install `@inertiajs/vue3`, `vue`, Tailwind.
- Generate page components `Auth/Login.vue`, `Auth/Register.vue`, dll.
- Generate `AppLayout.vue` dan komponen UI dasar (Button, Input, Modal, dll).
- Konfigurasi `vite.config.js`, `app.js`, dan `app.blade.php` untukmu.
- Setup `HandleInertiaRequests`.

Setelah instalasi:

```bash
php artisan migrate
npm run dev
```

::: details Penjelasan Kode
- `php artisan migrate` — menjalankan semua migration yang belum di-apply di `database/migrations`. Breeze menambahkan migration untuk `users`, `password_reset_tokens`, `sessions`, dan `failed_jobs` (kalau belum ada). Pastikan `DB_CONNECTION` di `.env` benar (mis. `sqlite` perlu file `database/database.sqlite`).
- `npm run dev` — start Vite dev server. Output menampilkan URL lokal (biasanya `http://localhost:5173`) — Vite dikonfigurasi proxying/Laravel plugin agar asset di-load lewat `@vite` directive.
:::

Buka `http://localhost` — kamu langsung punya halaman login dan register.

:::warning Catatan
Breeze membantu, tapi **jangan jadikan kotak hitam**. Setelah setup, baca setiap file yang di-generate untuk memahami strukturnya. Buku ini banyak merujuk file yang sama dengan Breeze.
:::

## 2.11 Menjalankan Development Server

Workflow harian:

```bash
# Terminal 1 — Laravel backend
php artisan serve

# Terminal 2 — Vite frontend
npm run dev
```

Kalau mau satu perintah (via `concurrently`):

```bash
npm install -D concurrently
```

Tambahkan script di `package.json`:

```json
"dev:all": "concurrently \"php artisan serve\" \"npm run dev\""
```

::: details Penjelasan Kode
- `"dev:all": "concurrently \"php artisan serve\" \"npm run dev\""` — mendefinisikan script npm baru bernama `dev:all`. Saat dijalankan dengan `npm run dev:all`, npm memanggil package `concurrently` yang menampilkan output dua perintah secara paralel dalam satu terminal. Backslash (`\"`) escape tanda kutip agar npm passing string lengkap ke concurrently, bukan dipecah oleh shell npm.
- Tanpa `concurrently` kamu butuh dua jendela terminal; dengan script ini satu terminal cukup untuk menjalankan backend Laravel (port 8000) dan Vite dev server (port 5173) bersamaan.
:::

Lalu cukup `npm run dev:all`.

## 2.12 Ringkasan Bab

- Buat project Laravel baru.
- Install server adapter **inertia-laravel** dan publish `HandleInertiaRequests`.
- Buat **satu** root template `app.blade.php` dengan `@inertia`.
- Install client adapter **@inertiajs/vue3** + Vue, konfigurasi `resources/js/app.js` dengan `createInertiaApp`.
- Setup Tailwind, `vite.config.js` dengan alias `@`.
- Cara cepat: **Laravel Breeze** dengan stack Inertia Vue (recommended untuk pemula).
- Jalankan dua server: `php artisan serve` dan `npm run dev`.

:::tip Selanjutnya
[Bab 3](/bagian-1/bab-3) membahas **mental model** bagaimana semua ini bekerja — penting sebelum mulai coding serius.
:::
