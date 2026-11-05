---
title: Bab 6 — Inertia Page Component — Pengganti Blade View
---

# Bab 6: Inertia Page Component — Pengganti Blade View

:::info Bagian II — Transisi
Bab ini membahas struktur folder `Pages/`, anatomi page component, dan akses URL/route lewat Ziggy.
:::

## 6.1 Struktur Folder `Pages/

Setiap file `.blade.php` kamu ganti dengan file `.vue` di `resources/js/Pages/`. Berikut layout tipikal:

```text
resources/js/
├── Pages/
│   ├── Dashboard.vue
│   ├── Posts/
│   │   ├── Index.vue
│   │   ├── Show.vue
│   │   ├── Create.vue
│   │   └── Edit.vue
│   └── Auth/
│       ├── Login.vue
│       └── Register.vue
├── Layouts/
│   └── AppLayout.vue
├── Components/
│   ├── UI/
│   │   ├── Button.vue
│   │   ├── Modal.vue
│   │   └── Input.vue
│   └── Posts/
│       └── PostCard.vue
└── app.js
```

::: details Penjelasan Kode
- `Pages/` — folder khusus untuk **page components** yang akan dirender Inertia. Setiap file di sini dipetakan satu-satu ke nama komponen di `Inertia::render('Posts/Index')`. Nama relatif terhadap `Pages/`.
- `Posts/Index.vue` — PascalCase untuk nama file. Mengikuti konvensi Vue untuk komponen, berbeda dari Blade yang biasanya pakai `index.blade.php` lowercase.
- `Layouts/AppLayout.vue` — folder layout persisten (lihat Bab 7). Tidak terikat ke route, diimpor oleh page component via `defineOptions({ layout })`.
- `Components/UI/Button.vue` — komponen reusable presentational (`Button`, `Modal`, `Input`). Konvensi populer: folder `UI/` untuk design system lokal.
- `Components/Posts/PostCard.vue` — komponen spesifik fitur. Diletakkan di folder fitur agar mudah ditemukan saat bekerja pada modul `Posts`.
- `app.js` — entry point Vite. Tempat `createInertiaApp({...})` dipanggil.
- Pola ini memisahkan berdasarkan **fungsi/peran** (Page/Layout/Component), bukan tipe file. Lebih mirip pola project Vue/React modern daripada Blade (`views/`, `layouts/`, `components/` Blade semuanya campur).
:::

Aturan:

- Nama file PascalCase (`Index.vue`, bukan `index.vue`).
- Folder fitur, bukan tipe file (`Posts/`, bukan `Views/`).
- Satu komponen per file (Vue convention).

## 6.2 Anatomi Page Component

```vue
<script setup>
// 1. Import lokal — komponen, composable, helper
import AppLayout from '@/Layouts/AppLayout.vue'
import Pagination from '@/Components/UI/Pagination.vue'
import { Link } from '@inertiajs/vue3'

// 2. Definisikan layout (opsional jika default diset di app.js)
defineOptions({ layout: AppLayout })

// 3. Props dari controller
const props = defineProps({
  posts: Array,
  filters: Object,
})

// 4. Logika lokal reaktif (ref, computed, watch)
import { ref } from 'vue'
const search = ref(props.filters.q ?? '')
</script>

<template>
  <!-- 5. Template bebas — Vue standar -->
  <div class="space-y-4">
    <input
      v-model="search"
      placeholder="Cari post..."
      class="rounded border px-3 py-2"
    />

    <ul>
      <li v-for="post in posts.data" :key="post.id">
        <Link :href="route('posts.show', post.id)">{{ post.title }}</Link>
      </li>
    </ul>

    <Pagination :links="posts.links" />
  </div>
</template>
```

::: details Penjelasan Kode
**`&lt;script setup>`** — syntactic sugar Vue 3 Composition API. Top-level deklarasi otomatis tersedia di template, tidak perlu `return` seperti `&lt;script>` klasik.

**Bagian 1 — Import:**
- `import AppLayout from '@/Layouts/AppLayout.vue'` — alias `@` merujuk `resources/js/` (dikonfigurasi di `vite.config.js`). Import layout yang akan dipakai page ini.
- `import { Link } from '@inertiajs/vue3'` — komponen `&lt;Link>` pengganti `&lt;a>` yang terhubung ke router Inertia. Saat diklik, dia melakukan visit via XHR alih-alih reload penuh, lalu meng-update URL dan swap page component.

**Bagian 2 — Layout:**
- `defineOptions({ layout: AppLayout })` — macro compiler Vue 3.3+. Memberitahu Inertia untuk membungkus page ini dengan `AppLayout`. Jika tidak ditulis, page pakai default dari `app.js` (`page.default.layout`).
- Pakai macro ini (bukan `&lt;script>` option biasa) supaya layout **persistent** — pertahankan instance navbar saat navigasi.

**Bagian 3 — Props:**
- `defineProps({ posts: Array, filters: Object })` — terima data dari controller. Nama prop harus cocok dengan key di array `Inertia::render(...)`.
- `Object` di sini longgar — cocok untuk paginator `{ data, links, meta }`. TypeScript memberi tipe lebih ketat bila perlu.

**Bagian 4 — Logika reaktif:**
- `import { ref } from 'vue'` — `ref` membuat value reaktif. Bisa ditaruh di mana pun dalam `&lt;script setup>` (urutan tidak wajib, namun lazim ditaruh setelah defineProps).
- `const search = ref(props.filters.q ?? '')` — inisialisasi `search` dengan value filter saat ini (untuk pre-fill input). `??` adalah nullish coalescing — pakai `''` jika `filters.q` null/undefined.

**Bagian 5 — Template:**
- `v-model="search"` — two-way binding: input memperbarui `search`, dan `search` memperbarui value input.
- `posts.data` — paginator punya nested `data`, jadi iterasi harus pakai `posts.data`, bukan `posts` langsung. Akses aman karena controller pasti mengirim paginator (Kalau ragu, validasi via `defineProps` TypeScript).
- `:key="post.id"` — key unik untuk `v-for` agar Vue bisa bedakan item saat list berubah/perubahan urutan.
- `&lt;Link :href="route('posts.show', post.id)">` — pakai helper `route()` dari Ziggy (lihat §6.6) untuk generate URL berdasarkan named route Laravel. `Link` meng-handle navigasi Inertia.
- `&lt;Pagination :links="posts.links" />` — teruskan object `links` paginator ke komponen child. Compositional dan reusable.
:::

## 6.3 Perbedaan Page Component vs Komponen Biasa

| Aspek | Page (`Pages/`) | Komponen (`Components/`) |
| --- | --- | --- |
| Dirender oleh | Controller (server) | Page component (Vue) |
| Menerima props dari | Server (Inertia) | Parent komponen Vue |
| Pernah pakai `defineOptions({ layout })` | Sering | Hampir tidak pernah |
| Lokasi konvensional | `Pages/` | `Components/`, `Layouts/` |

Komponen biasa bersifat reusable — dipakai oleh banyak page. Page component spesifik ke satu route/halaman.

## 6.4 Memakai Komponen Biasa di Page Component

Import & pakai seperti Vue biasa:

```vue
<script setup>
import PostCard from '@/Components/Posts/PostCard.vue'

defineProps({ posts: Array })
</script>

<template>
  <div class="grid grid-cols-3 gap-4">
    <PostCard
      v-for="post in posts"
      :key="post.id"
      :post="post"
    />
  </div>
</template>
```

::: details Penjelasan Kode
- `import PostCard from '@/Components/Posts/PostCard.vue'` — import komponen lokal. SFC Vue otomatis ter-register di `&lt;script setup>` — tidak perlu tulis `components: { PostCard }` seperti Options API.
- `defineProps({ posts: Array })` — menerima `posts` dari controller. Prop iterasi langsung dengan `v-for`.
- `&lt;div class="grid grid-cols-3 gap-4">` — utility class Tailwind. Membentuk grid 3 kolom dengan gap 4 unit (1rem).
- `v-for="post in posts"` — iterasi array `posts`. Tidak ada `.data` karena controller mengirim array biasa (bukan paginator) — bedakan dengan contoh §6.2 yang pakai paginator.
- `:key="post.id"` — key wajib untuk v-for agar Vue efisien tracking elemen.
- `:post="post"` — oper prop `post` ke `PostCard`. Komponen child terima via `defineProps({ post: Object })`.
- Struktur ini murni Vue — Inertia tidak mengganggu pola parent-child. PostCard tidak tahu bahwa data berasal dari server Laravel.
:::

`PostCard.vue` adalah komponen biasa yang menerima `post` sebagai prop dari parent — tidak tahu-menahu soal Inertia.

## 6.5 Komunikasi Child → Page Component

Komponen biasa bisa emit event ke parent:

```vue
<!-- Components/Posts/PostCard.vue -->
<script setup>
defineProps({ post: Object })
const emit = defineEmits(['edit', 'delete'])
</script>

<template>
  <button @click="emit('edit', post)">Edit</button>
  <button @click="emit('delete', post.id)">Hapus</button>
</template>
```

::: details Penjelasan Kode
- `defineProps({ post: Object })` — terima data post dari parent (page component).
- `const emit = defineEmits(['edit', 'delete'])` — deklarasikan event yang akan dipancarkan komponen ini. Macro compiler ini memberi type-check di IDE bila pakai TS.
- `emit('edit', post)` — emit event `edit` dengan payload `post` (object). Parent bisa listen `@edit`.
- `emit('delete', post.id)` — emit `delete` dengan payload hanya ID. Lebih ringan, karena parent biasanya hanya butuh id untuk request hapus ke server.
- `@click="emit(...)"` — handler click inline. Bila logika lebih kompleks, pindahkan ke function di `&lt;script setup>`.
- Pola ini standar Vue — tidak ada keterlibatan Inertia di sini. Komunikasi parent-child murni di client.
:::

```vue
<!-- Pages/Posts/Index.vue -->
<template>
  <PostCard
    v-for="post in posts.data"
    :key="post.id"
    :post="post"
    @edit="onEdit"
    @delete="onDelete"
  />
</template>
```

::: details Penjelasan Kode
- `@edit="onEdit"` — listen event `edit` dari `PostCard`. Saat child `emit('edit', post)`, method `onEdit(post)` di parent akan dipanggil dengan payload yang sama.
- `@delete="onDelete"` — sama, lintas payload `post.id`. Method `onDelete(id)` di parent biasanya melakukan konfirmasi lalu `router.delete(route('posts.destroy', id))`.
- Catatan: handler `onEdit`/`onDelete` harus dideklarasikan di `&lt;script setup>` (tidak ada di cuplikan ini karena fokus ke template).
- Perhatikan `posts.data` — paginator. Bila controller mengirim array biasa (bukan paginator), pakai `posts` langsung.
- Mendengarkan event via `@event` sama persis seperti Vue biasa. Inertia tidak mengubah sistem event Vue.
:::

Pola yang sama dengan SPA Vue biasa — Inertia tidak mengubah ini.

## 6.6 Akses URL & Route di Vue — Ziggy

Install Ziggy:

```bash
composer require tightenco/ziggy
```

Setelah `@routes` di root template, helper `route()` tersedia di window. Atau import sebagai module:

```js
// vite.config.js
import { defineConfig } from 'vite'
import ziggy from 'ziggy-js'

resolve: {
  alias: {
    ziggy: 'ziggy-js',
  },
}
```

::: details Penjelasan Kode
- `import { defineConfig } from 'vite'` — helper Vite untuk membangun config object dengan autocomplete tipe.
- `import ziggy from 'ziggy-js'` — contoh import; meski di potongan ini tidak langsung dipakai, biasanya untuk plugin kustom. Ziggy inti sendiri tetap bekerja tanpa baris ini.
- `resolve.alias.ziggy: 'ziggy-js'` — alias agar `import route from 'ziggy'` di kode Vue resolve ke package `ziggy-js`. Berguna bila kamu pakai named import seperti `import { route } from 'ziggy'`. Tanpa alias, kamu harus pakai nama package asli (`'ziggy-js'`).
- Konfigurasi ini opsional — Ziggy bisa juga dipakai via global `window.route()` yang disuntik blade directive `@routes`. Tapi pendekatan ESM lebih bersih dan tree-shakeable.
- Vite resolve.alias sangat berguna juga untuk alias lain seperti `@` → `resources/js/` (biasanya sudah diset di scaffold Laravel Breeze/Jetstream).
:::

Penggunaan di komponen:

```vue
<script setup>
import { route } from 'ziggy-js'
</script>

<template>
  <Link :href="route('posts.show', post.id)">Lihat</Link>
  <Link :href="route('posts.edit', { post: post.id })">Edit</Link>
  <Link :href="route('admin.users.index')">Admin</Link>
</template>
```

::: details Penjelasan Kode
- `import { route } from 'ziggy-js'` — ambil helper `route` sebagai named import. Ziggy 2.x juga support default export (`import route from 'ziggy'`).
- `route('posts.show', post.id)` — generate URL ke named route `posts.show` dengan parameter `{ post: post.id }`. Parameter tunggal otomatis dipetakan ke key utama route binding (di sini `{post}`).
- `route('posts.edit', { post: post.id })` — bentuk eksplisit dengan object. Berguna saat route punya banyak parameter, mis. `route('projects.tasks.edit', { project, task })`.
- `route('admin.users.index')` — route tanpa parameter. Klik link → Inertia visit URL → render `Admin/Users/Index.vue`.
- `:href` wajib pakai `:` (binding) karena nilai hasil `route()` adalah string dinamis. Tanpa `:`, Vue akan treat sebagai literal string `route(...)` — tidak di-evaluate.
- Output URL mengikuti konfigurasi Laravel (`APP_URL`), jadi konsisten dengan yang ada di server-side.
:::

API persis seperti helper `route()` di Blade — mendukung named route, parameter, query, default.

## 6.7 Cek Route Aktif

Ziggy menyediakan `route().current()` untuk cek nama route yang sedang aktif:

```js
import { route } from 'ziggy-js'

route().current('posts.*')          // true jika di halaman posts
route().current('posts.show')       // true jika persis posts.show
route().current('posts.show', post) // true jika param cocok
```

::: details Penjelasan Kode
- `route().current('posts.*')` — wildcard `*` mencocokkan apapun setelah `posts.`. True di semua halaman `posts.index`, `posts.show`, `posts.create`, dst. Berguna untuk highlight menu sidebar.
- `route().current('posts.show')` — exact match. True hanya jika route saat ini persis `posts.show`.
- `route().current('posts.show', post)` — cek juga parameter. Berguna bila kamu ingin tahu "apakah kita sedang melihat post ini?" (mis. untuk tombol "Lihat post ini" yang harus disabled saat sudah di halaman itu).
- `route()` (tanpa argumen) — mengembalikan object helper Ziggy yang punya method `current()`, `params()`, `has()`, dll. Bukan string URL.
- Implementasi umum: assign ke prop `:active` NavLink untuk styling otomatis sesuai halaman aktif.
:::

Bagus untuk menandai menu sidebar yang aktif:

```vue
<NavLink :href="route('posts.index')" :active="route().current('posts.*')">
  Posts
</NavLink>
```

## 6.8 Akses URL Aktif

Untuk mendapatkan URL halaman ini:

```js
import { usePage } from '@inertiajs/vue3'

const page = usePage()

console.log(page.url) // '/posts?page=2'
console.log(page.component) // 'Posts/Index'
console.log(page.version) // hash asset
```

::: details Penjelasan Kode
- `import { usePage } from '@inertiajs/vue3'` — composable untuk akses Inertia page object global. Berisi seluruh state halaman saat ini.
- `const page = usePage()` — panggil di dalam `&lt;script setup>` (atau composable). Mengembalikan reactive `Page` object yang re-otomatis update saat navigasi.
- `page.url` — URL relatif saat ini, termasuk query string. Berguna untuk conditional render berdasarkan page (mis. tampilkan banner hanya di `/dashboard`).
- `page.component` — nama komponen yang sedang dirender (saat ini). Cocok dengan string di `Inertia::render(...)`.
- `page.version` — hash asset saat ini. Saat deploy baru, hash berubah → Inertia otomatis reload penuh agar user dapat asset terbaru.
- `page.props` — object props dari server. Casus umum: `page.props.auth.user` (shared prop), `page.props.flash.success` (flash message). Detail di Bab 11.
- `usePage` adalah composable — wajib dipanggil di setup context, bukan di event handler async biasanya (walaupun masih bisa karena Vue composable persistent).
:::

## 6.9 Mencetak Semua Route untuk Vue

Jika ingin akses route di komponen tanpa window global (recommended untuk Vite/ESM):

```bash
php artisan ziggy:generate
```

Menghasilkan file `resources/js/ziggy.js` yang berisi definisi semua route. Import di mana pun diperlukan:

```js
import route from '@/ziggy'
```

::: details Penjelasan Kode
- `php artisan ziggy:generate` — command Ziggy yang menulis file `resources/js/ziggy.js`. Berisi object JSON semua named route + parameter + URL template.
- Import hasil generate ini dipakai sebagai ganti `window.route` global. Menguntungkan untuk Vite karena:
  - Tree-shakeable bila hanya butuh sebagian route (perlu konfigurasi filter).
  - Tidak tergantung `window` — cocok untuk SSR.
- `import route from '@/ziggy'` — default export adalah function `route()`. Pakai di seluruh app tanpa perlu inject window.
- File `ziggy.js` harus re-generate setiap kali route berubah. Bisa di-hook ke post-autoload Composer, atau jalankan manual. Untuk auto-build, pakai package `tightenco/ziggy` dengan command di `package.json` scripts.
- Alternatif: pakai blade directive `@routes` yang men-generate inline script global. Lebih sederhana tapi tidak tree-shakeable.
:::

:::tip Ziggy 2.x
Pada Ziggy 2, default ekspor adalah function `route`. Gunakan named import jika perlu:
```js
import { route } from 'ziggy'
```
:::

## 6.10 Pola Komponen yang Disarankan

1. **Setiap page minimal menerima prop yang spesifik** untuk halaman itu, tidak bergantung pada global.
2. **State lokal** (search, filter, ui-form) pakai `ref()` atau `reactive()`.
3. **State global** (user, flash) pakai `usePage().props` (lihat Bab 11).
4. **Composable** untuk logika yang dipakai ulang: `usePostFilter()`, `useTableSort()`.
5. **Spot layout** via `defineOptions({ layout: AppLayout })` atau `defineOptions({ layout: [AppLayout, AdminLayout] })` untuk nested.

## 6.11 Contoh Lengkap: Halaman Daftar Post

```vue
<!-- resources/js/Pages/Posts/Index.vue -->
<script setup>
import { ref, watch } from 'vue'
import { Link, router } from '@inertiajs/vue3'
import { route } from 'ziggy-js'
import AppLayout from '@/Layouts/AppLayout.vue'
import Pagination from '@/Components/UI/Pagination.vue'
import PostCard from '@/Components/Posts/PostCard.vue'

defineOptions({ layout: AppLayout })

const props = defineProps({
  posts: Object, // paginator
  filters: Object,
})

const search = ref(props.filters.q ?? '')

watch(search, (value) => {
  router.get(
    route('posts.index'),
    { q: value },
    { preserveState: true, preserveScroll: true, replace: true },
  )
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Daftar Post</h1>
      <Link :href="route('posts.create')" class="rounded bg-blue-600 px-4 py-2 text-white">
        + Buat Post
      </Link>
    </div>

    <input
      v-model="search"
      placeholder="Cari post..."
      class="w-full rounded border px-3 py-2"
    />

    <div class="grid grid-cols-2 gap-4">
      <PostCard v-for="post in posts.data" :key="post.id" :post="post" />
    </div>

    <Pagination :links="posts.links" />
  </div>
</template>
```

::: details Penjelasan Kode

**Import:**
- `ref, watch` dari Vue — `ref` untuk state, `watch` untuk side-effect saat state berubah.
- `Link, router` dari `@inertiajs/vue3` — `Link` untuk navigasi deklaratif; `router` untuk navigasi imperatif dari JS.
- `route` dari `ziggy-js` — generator URL named route.
- `AppLayout`, `Pagination`, `PostCard` — komponen lokal.

**Layout & Props:**
- `defineOptions({ layout: AppLayout })` — set layout persistent. Saat user pindah route lain yang pakai `AppLayout`, navbar tidak unmount.
- `defineProps({ posts: Object, filters: Object })` — `posts` berupa paginator (`{ data, links, meta }`). `filters` adalah input query yang dikirim balik controller (pre-fill search).

**State:**
- `const search = ref(props.filters.q ?? '')` — inisialisasi input dari prop. Bila user sudah search lalu refresh page, input tetap terisi sesuai URL.

**Watcher — inti dari live search:**
```js
watch(search, (value) => {
  router.get(
    route('posts.index'),
    { q: value },
    { preserveState: true, preserveScroll: true, replace: true },
  )
})
```
- `watch(search, ...)` — setiap kali `search` berubah (user mengetik), handler dijalankan. Vue otomatis debounce via nextTick, tapi untuk live search sebaiknya tambah debouncer manual (lodash/closure timeout) agar tidak request tiap keystroke.
- `router.get(url, data, options)` — visit ke `posts.index` dengan query `{ q: value }`. Inertia akan kirim GET `?q=...`, lalu re-render page dengan props baru.
- `preserveState: true` — pertahankan state komponen saat ini (input yang sedang difokuskan tidak ke-reset). Penting saat form search agar kursor tetap di tempat.
- `preserveScroll: true` — jangan reset scroll ke atas. Tanpa opsi ini, setiap ketik → scroll lompat ke atas.
- `replace: true` — ganti entri history alih-alih push. Artinya, back button tidak akan loop melalui tiap karakter yang diketik user (sangat penting untuk UX search).

**Template:**
- `&lt;Link :href="route('posts.create')">` — navigasi ke halaman create, XHR request otomatis ke server.
- `&lt;input v-model="search">` — two-way binding, setiap ketik update `search` → trigger `watch`.
- `v-for="post in posts.data"` — paginator, jadi akses `.data`.
- `&lt;Pagination :links="posts.links" />` — komponen reusable yang menerima object `links` (first/last/prev/next).

**Catatan:** Pola `watch` di sini tanpa debounce akan request tiap ketik. Untuk produksi, bungkus dengan debouncer (lihat Bab 8/9 untuk composable `useDebounce`).
:::

## 6.12 Ringkasan Bab

- Page component = file `.vue` di `Pages/`, menggantikan `.blade.php`.
- Struktur folder: PascalCase, categori per fitur (`Posts/`, `Auth/`).
- Menerima props dari server via `defineProps`.
- Memakai komponen biasa dari `Components/` seperti Vue standar.
- Ziggy menyediakan `route()` di JavaScript, sama seperti di Blade.
- Pola: page minimalist, business logic di composable/controller.

:::tip Selanjutnya
[Bab 7](/bagian-2/bab-7) bahas **Layout Persisten** — pengganti `@extends('layouts.app')` agar navbar tidak di-rebuild tiap navigasi.
:::
