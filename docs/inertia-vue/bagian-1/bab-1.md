---
title: Bab 1 - Apa itu Inertia.js dan Mengapa Kamu Butuh Ini
---

# Bab 1: Apa itu Inertia.js dan Mengapa Kamu Butuh Ini

:::info Bagian I - Jembatan
Bab ini membuka pintu menuju Inertia.js: apa masalahnya, apa solusinya, dan kapan Inertia adalah alat yang tepat.
:::

## 1.1 Masalah yang Inertia Selesaikan

Kamu sudah lama pakai Blade. Routing, Controller, Model, Migration - semua terasa natural. Tapi ada satu hal yang selalu mengganjal: **Blade cocok untuk halaman tradisional, tapi kurang ideal untuk UI yang interaktif.**

Beberapa keterbatasan Blade yang umum dirasakan:

- Setiap navigasi memicu **full page reload**.
- Interaktivitas (dropdown, modal, autocomplete, drag-and-drop) butuh JavaScript yang ditulis manual di atas Blade.
- Tidak ada reactivity - jika data berubah, kamu harus reload halaman untuk melihat perubahannya.
- Bundle JavaScript modern (Vue, React) "bertabrakan" dengan Blade karena keduanya sama-sama ingin mengontrol DOM.

Alternatif yang selama ini banyak dipakai adalah **memisahkan project menjadi dua**:

1. Backend berfungsi **murni sebagai REST API** (Laravel).
2. Frontend berfungsi sebagai **Vue SPA terpisah** dengan Vue Router + Axios.

Polanya jadi terpisah - dan di sinilah letak masalahnya.

## 1.2 Dampak Pemisahan SPA Terpisah

Membangun API + SPA terpisah terdengar modern, tapi menimbulkan **double pekerjaan**:

| Masalah | Penjelasan |
| --- | --- |
| Double routing | Laravel route (API) dan Vue Router (frontend) - dua sumber kebenaran. |
| Double auth | Session Laravel untuk Blade, token (Sanctum/JWT) untuk SPA. |
| Double validasi | Validasi di backend (FormRequest) dan di frontend (VeeValidate/Yup). |
| CORS | Konfigurasi keamanan tambahan agar SPA bisa akses API. |
| Duplikasi model | Model backend + TypeScript interface/frontend. |
| Overhead deploy | Dua build pipeline, dua server, dua environment. |

Inertia hadir sebagai **jalan tengah**: *"monolith yang terasa seperti SPA"*. Tidak ada REST API baru, tidak ada token, tidak ada double routing - Laravel tetap Laravel.

## 1.3 Apa Sebenarnya Inertia.js?

> Inertia **bukan** framework baru. Ia adalah **protokol** yang menghubungkan sisi server (Laravel) dan sisi client (Vue) tanpa membuat layer API terpisah.

Inertia menggantikan Blade sebagai **layer view**, bukan menggantikan Laravel. Pool keahlianmu tetap berguna - kamu menulis controller yang sama, model yang sama, validasi yang sama.

Tiga komponen inti Inertia:

```text
+------------------------+      +--------------------+
|  Server Adapter        |      |  Client Adapter    |
|  (inertia-laravel)     |<---->|  (@inertiajs/vue3) |
|                        |      |                    |
|  - Inertia::render()   |      |  - <Link>         |
|  - HandleInertiaReq    |      |  - useForm()      |
|  - Share data          |      |  - usePage()       |
+------------------------+      +--------------------+
                  ^
                  |
        Protokol HTTP khusus
        (header X-Inertia, JSON)
```

::: details Penjelasan Kode
- Diagram ASCII ini menggambarkan arsitektur dua sisi Inertia. Sisi kiri (`Server Adapter`) berjalan di dalam Laravel via package `inertia-laravel`; sisi kanan (`Client Adapter`) berjalan di browser via package `@inertiajs/vue3`.
- `Inertia::render()` — API server yang kamu panggil di controller. Bertindak menggantikan `view()` Blade, menghasilkan JSON berisi `{ component, props, url, version }`.
- `HandleInertiaReq` (singkatan dari `HandleInertiaRequests`) — middleware di sisi server yang mendeteksi header `X-Inertia: true` pada request masuk dan memutuskan format response (HTML penuh vs JSON).
- `Share data` — mekanisme mengirim data global (mis. user yang sedang login, flash errors) ke semua halaman tanpa harus dideklarasi ulang di setiap controller.
- `&lt;Link>` — komponen Vue pengganti `&lt;a>` standar yang mengintercept click untuk melakukan navigasi via XHR agar tidak full reload.
- `useForm()` — composable untuk state form: handle `v-model`, submit, dan melampirkan error validasi otomatis dari backend ke `form.errors`.
- `usePage()` — composable untuk mengakses `page.props` dari dalam komponen apa pun, termasuk shared data dari server.
- Garis penghubung `<---->` menyimbolkan komunikasi via HTTP standar; panah `^` menunjuk protokol HTTP khusus (header `X-Inertia` + body JSON) sebagai "bahasa" antar dua adapter.
:::

1. **Server Adapter** (`inertia-laravel`): mengubah `Inertia::render()` menjadi JSON yang dipahami client.
2. **Client Adapter** (`@inertiajs/vue3`): menerima JSON, mengganti page component Vue.
3. **Protokol HTTP**: request pertama kirim HTML penuh, request berikutnya kirim JSON via header `X-Inertia: true`.

## 1.4 Perbandingan Tiga Pendekatan

```text
Blade (Lama):
Browser -> Laravel Route -> Controller -> Blade View -> HTML -> Browser

REST API + Vue SPA:
Browser -> Vue Router -> Axios -> Laravel API -> JSON -> Vue -> Browser

Inertia (Baru):
Browser -> Laravel Route -> Controller -> Inertia::render() -> Vue -> Browser
```

::: details Penjelasan Kode
- Diagram alur membandingkan tiga arsitektur berdasarkan jalur request data. Setiap node dipisah `->` untuk menonjolkan langkah & pemilik tiap langkah.
- **Blade (Lama)**: Browser → Route → Controller → Blade View → HTML → Browser. Alur penuh di server; setiap navigasi menghasilkan HTML baru dan browser reload seluruh DOM.
- **REST API + Vue SPA**: Browser hanya men-trigger Vue Router (client-side), kemudian Axios melakukan XHR ke Laravel API yang merespons JSON. Vue merender output. Routing jadi terbagi dua (server punya route API, client punya Vue Router) — sumber konflik & duplikasi.
- **Inertia (Baru)**: Browser tetap pakai Laravel Route → Controller, lalu `Inertia::render()` mengomunikasikan ke Vue melalui respons khusus (HTML di request pertama, JSON di request berikutnya). Tidak ada REST API tambahan; client router digantikan by convention dengan `resolve()` di `app.js`.
- Inti pembeda: pada Inertia, "router" client sebenarnya bukan Vue Router — yang ada hanya swap komponen berdasar `component` dari JSON server. Maka hanya Laravel yang jadi single source of truth untuk routing.
:::

| Aspek | Blade | REST API + SPA | Inertia |
| --- | --- | --- | --- |
| Routing | Laravel | Laravel + Vue Router | Laravel saja |
| View engine | Blade | Vue | Vue |
| Auth | Session Laravel | Token (Sanctum) | Session Laravel |
| Validasi error | Session redirect | Manual di client | Otomatis ke `form.errors` |
| Interaktivitas | Terbatas | Tinggi | Tinggi |
| SEO | Out-of-the-box | Butuh SSR Nuxt | Out-of-the-box + SSR opsional |
| Kompleksitas setup | Rendah | Tinggi | Menengah |

## 1.5 Apa yang TIDAK Berubah

Inertia memperpanjang Laravel, bukan mengganti. Berikut yang tetap persis sama:

- **Routing** di `routes/web.php`.
- **Controller** - logika query, validasi, authorization, semuanya bisa dipertahankan.
- **Model & Eloquent** - relasi, scope, casting, mutator tetap.
- **Middleware** - auth, verified, role, throttle, semua tetap.
- **Validasi** - FormRequest biasa bekerja seamless.
- **Auth** - session-based, `$request->user()` tetap dipakai.

## 1.6 Apa yang BERUBAH

Pemetaan hal-hal yang berubah dari Blade menuju Inertia:

| Blade (dulu) | Inertia (sekarang) |
| --- | --- |
| `return view('posts.index', compact('posts'))` | `return Inertia::render('Posts/Index', ['posts' => $posts])` |
| `resources/views/posts/index.blade.php` | `resources/js/Pages/Posts/Index.vue` |
| `<a href="&#123;&#123; route('posts.index') &#125;&#125;">` | `<Link :href="route('posts.index')">` dari `@inertiajs/vue3` |
| Form HTML + `@csrf` + `@error('field')` | `useForm()` + `v-model` + `form.errors.field` |
| `@extends('layouts.app')` + `@section()` | `defineOptions({ layout: AppLayout })` |
| `View::share('user', $user)` | `HandleInertiaRequests::share()` |

## 1.7 Kapan Inertia adalah Pilihan Tepat

Inertia cocok untuk:

- **Aplikasi web internal**: dashboard, admin panel, SaaS B2B, CMS.
- **Tim kecil** yang ingin fokus ke satu codebase - tidak punya bandwidth split frontend/backend.
- **Project yang butuh interaktivitas** (drag-drop, filter real-time) tapi tidak butuh SEO kritis.
- **Migrasi bertahap** dari Blade: convert satu halaman per satu halaman.
- **Aplikasi yang seluruhnya di balik login** - tidak diakses search engine.

## 1.8 Kapan Inertia Bukan Pilihan Tepat

Inertia **kurang ideal** ketika:

- **SEO sangat kritis**, misalnya blog publik, portal berita. Inertia SSR bisa, tapi kalau performa SEO adalah prioritas mutlak, Nuxt.js + API atau Next.js bisa lebih matang.
- **Mobile app** harus berbagi backend dengan web - lebih baik buat satu API REST bersih yang dikonsumsi web & mobile.
- **Publik facing app** dengan SSR yang kompleks (e-commerce skala besar dengan banyak halaman public) - API + SPA dengan SSR lebih fleksibel.
- **Tim frontend** benar-benar ingin independen, deploy terpisah, dan tidak ingin selalu menunggu backend untuk ubah route.

## 1.9 Ringkasan Bab

- Inertia mengganti **view layer** Blade dengan Vue, bukan menggantikan Laravel.
- Inertia memecahkan masalah SPA terpisah: double routing, double auth, double validasi, CORS.
- Routing, controller, model, validasi, auth, dan middleware **tidak berubah**.
- Yang berubah hanya `return view(...)` menjadi `Inertia::render(...)` dan `.blade.php` menjadi `.vue`.
- Inertia paling cocok untuk dashboard, internal app, dan SaaS - bukan untuk SEO-critical public app.

:::tip Sebelum lanjut ke Bab 2
Pastikan kamu sudah familiar Laravel 11 (routing, controller, Eloquent, migration). Buku ini tidak mengajarkan Laravel dari nol, melainkan bagaimana menambahkan Inertia + Vue di atas Laravel.
:::
