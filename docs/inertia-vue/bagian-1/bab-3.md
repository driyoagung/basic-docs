---
title: Bab 3 — Cara Kerja Inertia — Mental Model yang Benar
---

# Bab 3: Cara Kerja Inertia — Mental Model yang Benar

:::info Bagian I — Jembatan
Bab ini menjelaskan apa yang terjadi di balik layar saat kamu navigasi dengan Inertia — penting untuk debug dan memahami error.
:::

## 3.1 Request Pertama (Full Page Load)

Saat user pertama kali mengakses URL `https://app.test/posts`:

1. Browser kirim GET request standar ke Laravel.
2. Laravel route berjalan → controller → `Inertia::render('Posts/Index', [...props])`.
3. Server adapter Inertia membuat JSON berisi `{ component, props, url, version }`.
4. JSON ini **di-embed** ke dalam HTML `app.blade.php` di dalam `<div id="app" data-page="...JSON...">`.
5. Browser menerima HTML penuh, load Vue (via Vite), lalu `createInertiaApp` mount dan hydrate JSON tersebut menjadi page component Vue.

Hasilnya: halaman penuh dengan konten — bukan shell kosong seperti SPA biasa.

```html
<div id="app" data-page='{"component":"Posts/Index","props":{"posts":[...]},"url":"/posts","version":"..."}'></div>
```

::: details Penjelasan Kode
- `&lt;div id="app" ...>` — elemen dengan id `app` tempat Vue di-mount. Selector ini cocok dengan `el` yang dikirim ke `setup({ el })` di `createInertiaApp`.
- `data-page='...'` — atribut data HTML yang berisi JSON Inertia (single-quoted karena nilai JSON memakai double-quote). Inertia client membaca atribut ini saat startup untuk hydrate page component pertama tanpa menunggu XHR.
- Struktur JSON: `component` (nama page Vue, dipetakan fungsi `resolve`), `props` (data dari controller, dikirim ke `defineProps`), `url` (URL saat ini untuk disinkronkan ke History API), `version` (hash asset current; dipakai mendeteksi perubahan build saat masih dev session).
- Inilah yang membuat request pertama menghasilkan HTML lengkap dengan konten awal — bukti Inertia bukan shell-only SPA.
:::

## 3.2 Request Berikutnya (Inertia Request)

Setelah page pertama loaded, user klik `<Link :href="route('posts.show', 1)">`:

1. Komponen `<Link>` Inertia **intercept** click → tidak benar-benar navigasi standar.
2. Inertia kirim XHR `GET /posts/1` dengan header khusus:
   - `X-Inertia: true`
   - `X-Inertia-Version: <hash>`
   - `X-Requested-With: XMLHttpRequest`
3. Server adapter Inertia di Laravel mendeteksi header `X-Inertia: true`.
4. Alih-alih render HTML penuh, server hanya kembalikan **JSON response**:
   ```json
   {
     "component": "Posts/Show",
     "props": { "post": { ... } },
     "url": "/posts/1",
     "version": "..."
   }
   ```
5. Client adapter menerima JSON → ganti page component aktif dari `Posts/Index.vue` ke `Posts/Show.vue` → update `page.props`.
6. **URL di address bar diperbarui** dengan History API → terasa seperti SPA.

Tidak ada full page reload setelahnya.

::: details Penjelasan Kode
- Response JSON punya struktur identik dengan JSON yang tertanam di `data-page` pada full load — `component`, `props`, `url`, `version`. Konsistensi ini membuat logic client bisa sama persis baik untuk initial hydration maupun navigasi XHR.
- `component: "Posts/Show"` — string nama yang dilewatkan ke fungsi `resolve` di `app.js`; Adapter Vue akan swap komponen aktif tanpa unmount seluruh aplikasi (router-view style).
- `props: { post: {...} }` — data spesifik halaman; otomatis reaktif karena `usePage().props` adalah reactive object Vue. Saat server kirim props baru, semua `usePage().props.post.title` re-render otomatis.
- `url: "/posts/1"` — URL baru; client adapter memakai `history.pushState` agar address bar berubah, tombol back/forward tetap jalan, dan re-load halaman akan kembali memicu full load (yang valid karena `url` cocok).
- `version` — hash asset saat build Vite. Client menyimpan versi sebelumnya; kalau yang baru berbeda, server kirim 409 → client reload penuh untuk ambil asset terbaru.
:::

## 3.3 Membaca Respons Inertia di DevTools

Buka DevTools → Network → klik link Inertia. Perhatikan:

- **Request headers**:
  ```
  X-Inertia: true
  X-Inertia-Version: 96f750a8b0c641e08d3784f821b67f56
  X-Requested-With: XMLHttpRequest
  Accept: text/html, application/xhtml+xml
  ```
- **Response**: JSON dengan key `component`, `props`, `url`, `version`.
- **Status code**: `200 OK` untuk render normal, `303 Redirect` untuk redirect, `409 Conflict` jika version mismatch (asset berubah saat development).

::: details Penjelasan Kode
- `X-Inertia: true` — header boolean sederhana yang menjadi "tanda tangkap" server. Middleware `HandleInertiaRequests` (server adapter) mengecek `$request->header('X-Inertia')` untuk memilih: return HTML penuh (false/absent) atau JSON (true).
- `X-Inertia-Version` — hash asset frontend yang saat ini dimuat browser. Saat dev, hash ini menjadi acuan agar tidak ada konflik script lama dengan view Laravel baru.
- `X-Requested-With: XMLHttpRequest` — menandai request sebagai AJAX. Laravel middleware CSRF (`VerifyCsrfToken`) mengizinkan request ini tanpa perlu token form, asalkan header ini ada (kondisi AJAX exception).
- `Accept: text/html, application/xhtml+xml` — Inertia meminta HTML secara semantik karena paling dekat dengan behavior asli browser, walau response aktual adalah JSON. Beberapa tooling jaringan yang ketat terkadang kaget — ini by design.
- `303 Redirect` — Laravel mengembalikan 303 (bukan 302) untuk redirect setelah POST/PUT, mengikuti HTTP spec agar browser selalu pakai GET untuk redirect berikutnya.
:::

:::warning Inertia JSON ≠  REST API
JSON yang dikembalikan server **bukan konsumsi umum** — hanya untuk Inertia client adapter. Jangan pakai endpoint ini sebagai API untuk mobile app. Buat terpisah di `routes/api.php` jika butuh REST API publik.
:::

## 3.4 Version Mismatch & Asset Reload

Setiap kali asset frontend di-build (Vite hash berubah), `version` di root template akan berubah. Saat user klik link dengan versi lama:

- Server kembalikan **409 Conflict**.
- Client adapter otomatis **reload halaman penuh** untuk mengambil asset baru.

Inilah mengapa HMR kadang memicu reload penuh saat kamu mengubah file `app.js` atau mengedit asset secara struktural.

## 3.5 Perbedaan Dengan SPA Konvensional

| Aspek | SPA konvensional (Vue Router) | Inertia |
| --- | --- | --- |
| Routing | Vue Router (client) | Laravel route (server) |
| Navigasi | `router.push('/path')` | Komponen `<Link>` atau `router.visit()` |
| Data fetching | Axios/Fetch → REST API | Lewat props dari controller |
| Auth | Token (Sanctum/JWT) | Session Laravel |
| Single source of truth | Kadang ambigu | Server (Laravel) |

Inertia bukan SPA penuh — ia meminjam **sebagian** konsep SPA (smooth navigation, reactivity) sambil mempertahankan mental model server-driven Laravel.

## 3.6 Konsep `Page Component`

Setiap "halaman" di aplikasi = satu file `.vue` di `resources/js/Pages/`. Aturan:

- Nama file = nama yang dipanggil di `Inertia::render()`.
- `Inertia::render('Posts/Index')` → `resources/js/Pages/Posts/Index.vue`.
- Pasangan `component` ←— file Vue ditentukan oleh fungsi `resolve` di `app.js`:
   ```js
   resolve: name => {
     const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
     return pages[`./Pages/${name}.vue`]
   }
   ```

::: details Penjelasan Kode
- `resolve: name => { ... }` — arrow function yang menerima string nama komponen (dari server, mis. `'Posts/Index'`) dan wajib return modul Vue yang sesuai di `pages` map.
- `import.meta.glob('./Pages/**/*.vue', { eager: true })` — fitur Vite yang mengumpulkan semua file `.vue` dalam pola glob. Hasilnya object literal `{ './Pages/Welcome.vue': () => module, './Pages/Posts/Index.vue': ... }`. `eager: true` memuat semuanya saat build (sinkron). Tanpa `eager`, akan jadi dynamic import per-route (lazy, code-split).
- `pages[`./Pages/${name}.vue`]` — lookup key object berdasarkan path yang dikonstruksi dari `name`. Mis. `'Posts/Index'` → `'./Pages/Posts/Index.vue'`. Konvensi: nama komponen dari server harus persis cocok dengan path relatif (PascalCase folder & file).
:::

Page component menerima **props dari server** sebagai `defineProps()`:

```vue
<script setup>
defineProps({ post: Object })
</script>
<template>
  <h1>{{ post.title }}</h1>
</template>
```

::: details Penjelasan Kode
- `defineProps({ post: Object })` — deklarasi props standar Vue 3. Inertia otomatis meneruskan `props.post` dari JSON response ke sini. `Object` adalah constructor built-in JS — Vue memakainya sebagai runtime type-check (warning di dev kalau bukan object).
- Komponen page **hanya** menerima props, tidak boleh menjalankan query database. Query tetap di controller — aturan penting agar Inertia tetap "server-driven".
- `&#123;&#123; post.title &#125;&#125;` — akses field response. Reaktif berkat `usePage()` internal: jika user navigasi ke post lain via `&lt;Link>`, props `post` diganti dengan object baru dan teks `title` re-render otomatis.
- File ini harus **berada di** `resources/js/Pages/&lt;Nama>/&lt;Halaman>.vue` agar dipetakan dengan benar oleh fungsi `resolve`. Nama folder & file case-sensitive di OS Linux/CI.
:::

## 3.7 Komponen Inti Client Adapter

Yang paling sering kamu pakai:

| API | Kegunaan |
| --- | --- |
| `Link` | Komponen pengganti `<a>` untuk navigasi Inertia |
| `router` | Navigasi programatik (`router.visit`, `router.get`, dll) |
| `usePage()` | Akses `page.props` (termasuk shared data) |
| `useForm()` | State form + submit + error tracking |
| `Head` | Atur `<title>` & meta tag per halaman |
| `useRemember()` | Persist state lokal antar navigasi Inertia |

## 3.8 Versi Inertia: v1 vs v2

Buku ini menggunakan **Inertia v2** (rilis 2024). Perbedaan utama dari v1:

| Fitur | v1 | v2 |
| --- | --- | --- |
| `async setup` | Tidak | Ya (komponen bisa lazy async) |
| Polling | Manual | `usePoll()` built-in |
| Prefetch link | Tidak | `<Link prefetch="hover">` |
| Splat props (`*.prop`) | Tidak | Ya — update granular |
| When-visible lazy | Tidak | Ya (lazy props di-render saat scroll) |
| History API | Manual | Built-in dengan `useRemember` |

Upgrade dari v1 ke v2 cukup lancar — sebagian besar API tetap kompatibel.

## 3.9 Aturan Penting yang Sering Dilupakan

1. **Setiap props harus JSON-serializable.** Closure atau instance object tidak bisa dikirim.
2. **Tidak boleh ada logic query di page component.** Komponen hanya menerima props; query tetap di controller.
3. **`page.props` responsif.** Ketika server kirim props baru, `usePage().props` di Vue otomatis reaktif.
4. **Shared data persist.** Data di `HandleInertiaRequests::share()` dikirim di **setiap** render, jadi jangan taruh query berat tanpa `Inertia::lazy()`.
5. **One root template.** Hanya satu file Blade (`app.blade.php`) — semua halaman pakai ini.

## 3.10 Mental Model Singkat

> **Bayangkan Blade, tapi tiap `return view()` mengirim JSON ke satu aplikasi Vue yang sudah ter-mount.**

Itu inti Inertia. Tidak ada magic yang suspect — yang ada adalah **konvensi** bahwa server kirim `{ component, props, url }` dan client tahu bagaimana mengganti halaman.

## 3.11 Ringkasan Bab

- Request pertama = HTML penuh dengan data Inertia di-embed.
- Request berikutnya = JSON via header `X-Inertia: true`.
- Inertia **bukan** REST API — JSON hanya untuk client adapter.
- Routing tetap di Laravel, tidak ada Vue Router.
- Session Laravel tetap jadi auth — tidak ada token.
- Currency utama: page `.vue` + props dari `Inertia::render()`.
- Inertia v2 menambah polling, prefetch, dan lazy props — pakai versi ini.

:::tip Selanjutnya
Pada [Bab 4](/bagian-2/bab-4) kita mulai "transisi" — bagaimana routing dan controller sebenarnya **tidak banyak berubah** dari yang kamu kenal.
:::
