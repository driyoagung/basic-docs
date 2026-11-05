---
title: Bab 21 — SEO & SSR dengan Inertia
---

# Bab 21: SEO & SSR dengan Inertia

:::info Bagian V — Ekosistem & Tooling
Bab ini menjelaskan masalah SEO di SPA, solusi `<Head>`, dan setup Inertia SSR untuk konten yang dir-render di server.
:::

## 21.1 Masalah SEO pada SPA

SPA tradisional (termasuk Inertia tanpa SSR):

- Browser load HTML shell kosong.
- Search engine crawler menerima shell kosong — tidak melihat konten.
- Google sudah cukup execute JS, tetapi hasilnya tidak konsisten.

Tanpa SSR, Inertia cukup baik untuk aplikasi di balik login (dashboard, admin). Untuk halaman publik (blog, landing, e-commerce product page), mungkin **perlu** SSR.

## 21.2 `<Head>` Component Inertia

Untuk atur `<title>` & meta tag per halaman, pakai komponen `<Head>`:

```vue
<script setup>
import { Head } from '@inertiajs/vue3'
</script>

<template>
  <Head>
    <title>Daftar Post</title>
    <meta name="description" content="Kumpulan artikel terbaru" />
  </Head>

  <h1>Daftar Post</h1>
  <!-- ... -->
</template>
```

::: details Penjelasan Kode
- `import { Head } from '@inertiajs/vue3'` — komponen Inertia untuk manipulasi `&lt;head>` HTML secara reaktif dan SSR-safe.
- `&lt;Head>` — bukan render `&lt;head>` baru, tapi inject children (`&lt;title>`, `&lt;meta>`) ke `&lt;head>` document. Saat navigasi, tag lama diganti otomatis.
- `&lt;title>Daftar Post&lt;/title>` — title halaman; di-render ke `&lt;head>` saat component mount dan di-hapus saat unmount.
- `&lt;meta name="description" ...>` — meta standar SEO; Inertia akan replace(tag) setiap navigasi sehingga meta tidak menumpuk.
:::

Atau props:

```vue
<Head title="Daftar Post" description="Kumpulan artikel" />
```

## 21.3 Title Template

Set title template di root agar suffix otomatis:

```js
import { createInertiaApp } from '@inertiajs/vue3'

createInertiaApp({
  title: (title) => `${title} - MyApp`, // template
  /* ... */
})
```

::: details Penjelasan Kode
- `title: (title) => \`${title} - MyApp\`` — function yang membungkus title dengan suffix brand. Dipanggil untuk setiap navigasi halaman.
- Tanpa arg `title`, default menjadi string kosong sehingga hasil template ` - MyApp`. Beri fallback di function bila perlu: `title => \`${title ? title + ' - ' : ''}MyApp\``.
:::

Pakai di page:

```vue
<Head title="Daftar Post" />
<!-- title di browser: "Daftar Post - MyApp" -->
```

## 21.4 Atur Meta for Open Graph

```vue
<Head>
  <title>{{ post.title }}</title>
  <meta name="description" :content="post.excerpt" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" :content="post.title" />
  <meta property="og:description" :content="post.excerpt" />
  <meta property="og:image" :content="post.thumbnail_url" />
  <meta property="og:url" :content="route('posts.show', post.slug)" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" :content="post.title" />
  <meta name="twitter:image" :content="post.thumbnail_url" />
</Head>
```

::: details Penjelasan Kode
- `:content="post.title"` — binding reaktif; bila `post` berubah (mis. via partial reload), meta ikut update otomatis.
- `&lt;meta property="og:*">` — Open Graph untuk Facebook/WhatsApp preview; og:image, og:title, og:description dipakai saat link di-share.
- `route('posts.show', post.slug)` — helper Laravel `route` untuk URL. Di-shared via Inertia harus di-expose global atau di bungkus composable.
- `&lt;meta name="twitter:card" content="summary_large_image">` — kartu preview Twitter; image besar mengisi viewport.
- Inertia akan memasukkan semua ini ke `&lt;head>` secara reaktif — saat navigasi, og tag diganti agar tidak kotor dari halaman sebelumnya.
:::

## 21.5 Canonical URL

```vue
<Head>
  <link rel="canonical" :href="route('posts.show', post.slug)" />
</Head>
```

::: details Penjelasan Kode
- `rel="canonical"` — memberi tahu search engine URL kanonik halaman. Mencegah duplicate content penalty bila halaman accessible lewat beberapa URL (mis. dengan query string).
:::

## 21.6 Full SSR dengan Inertia

Inertia dapat rendering di server Node.js. Setup di Laravel:

```bash
# Buat SSR entry point
php artisan inertia:setup-ssr
```

Perintah ini:

- Membuat `resources/js/ssr.js`.
- Memberi instruksi konfigurasi `vite.config.js` (output `ssr-manifest.json`).

`resources/js/ssr.js`:

```js
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createInertiaApp } from '@inertiajs/vue3'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
    return pages[`./Pages/${name}.vue`]
  },
  setup({ App, props }) {
    return createSSRApp({ render: () => h(App, props) })
  },
  render: renderToString,
})
```

::: details Penjelasan Kode
- `createSSRApp` (bukan `createApp`) — membuat app Vue dengan mode SSR; tidak ada warning tentang DOM API yang tidak tersedia di server.
- `renderToString` dari `@vue/server-renderer` — function yang merender app jadi string HTML. Diberikan ke Inertia via option `render`.
- `setup({ App, props })` — di SSR, tidak mount ke element (server tidak punya DOM). Hanya return app instance, sisanya di-render lewat `render()`.
- `resolve` pake `eager: true` — semua page dimuat langsung di bundle SSR server. Acceptable untuk server bundle (deduplikasi client lazy load).
:::

Konfigurasi Vite untuk SSR output:

```js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.js'],
      ssr: 'resources/js/ssr.js',             // ← entry SSR
      refresh: true,
    }),
    vue(),
  ],
  resolve: { alias: { '@': '/resources/js' } },
})
```

::: details Penjelasan Kode
- `input: [...app.css, app.js]` — entry client bundle.
- `ssr: 'resources/js/ssr.js'` — entry SSR bundle. Vite akan build ini terpisah (output `public/build/assets/ssr.js`).
- `refresh: true` — Vite auto-refresh saat file blade berubah dev mode.
- `resolve.alias` — alias `@` ke `/resources/js` untuk `import '@/...'` konsisten client + server.
:::

Jalankan server SSR:

```bash
php artisan inertia:start-ssr
```

Inertia akan offload rendering ke Node.js process — Redis / socket internal menghubungkan Laravel dengan Node process.

Di production, jalankan SSR via Supervisor:

```ini
[program:inertia-ssr]
command=php /var/www/app/artisan inertia:start-ssr
numprocs=1
autostart=true
autorestart=true
```

::: details Penjelasan Kode
- `[program:inertia-ssr]` — deklarasi program Supervisor.
- `command=php /var/www/app/artisan inertia:start-ssr` — perintah yang dijalankan Supervisor. Path absolut agar berjalan terlepas dari working directory.
- `numprocs=1` — hanya satu proses; SSR state, lebih banyak dari 1 tidak bermanfaat dan boros memory.
- `autostart=true` — start otomatis saat Supervisor boot.
- `autorestart=true` — restart otomatis bila proses crash. Keeps SSR alive 24/7.
:::

## 21.7 Build Asset SSR

```bash
npm run build          # build client + ssr bundle
```

Output `public/build/manifest.json` + `public/build/ssr-manifest.json` + `public/build/assets/ssr.js` — dijalankan oleh `inertia:start-ssr`.

## 21.8 Tradeoff SSR

| Keuntungan | Kerugian |
| --- | --- |
| HTML lengkap untuk crawler | Butuh Node.js process |
| First paint lebih cepat untuk konten publik | Kompleksitas deploy bertambah |
| Bisa diakses non-JS | Render server lebih berat |
| Mendukung script structured data | Migrasi daripada CDN |

:::tip Aturan praktis
- Aplikasi internal/behind login: tidak perlu SSR.
- Blog, landing page, e-commerce product page: butuh SSR.
- Hybrid: Breeze login di route biasa, landing page pakai SSR.
:::

## 21.9 Consideration: Vite SSR vs Bun

Untuk v2.x, Inertia SSR mendukung beberapa runtime Node.js. Bun lebih cepat:

```bash
bun run resources/js/ssr.js
```

Tapi Laravel adapter (`inertia:start-ssr`) default pakai Node process. Modifikasi command di Supervisor.

## 21.10 Pola: SSR Only on Public Pages

Hanya sebagian page perlu SSR. Pakai conditional render:

```js
// app.js
import { createInertiaApp } from '@inertiajs/vue3'

createInertiaApp({
  // ... tetap
})
```

Untuk kontrol lebih halus, gunakan strategy render di controller — `Inertia::render('Posts/Show', [...])` tetap sama, hanya di konfigurasi root view SSR-enabled.

## 21.11 Structured Data (JSON-LD)

Untuk artikel / product:

```vue
<Head>
  <script type="application/ld+json" v-html="JSON.stringify(structuredData)" />
</Head>

<script setup>
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.value.title,
  author: { '@type': 'Person', name: post.value.user.name },
  datePublished: post.value.published_at,
}
</script>
```

::: details Penjelasan Kode
- `&lt;script type="application/ld+json">` — tipe MIME khusus untuk JSON-LD (structured data). Search engine (Google) parsing ini untuk rich snippet.
- `v-html="JSON.stringify(structuredData)"` — kasus khusus: Vue normalnya escape konten, tapi di sini perlu HTML literal JSON. Jangan pakai untuk data user-controlled (XSS risk); harus data yang sudah diverified.
- `@context: 'https://schema.org'` — namespace schema standard.
- `@type: 'BlogPosting'` — tipe entitas; ada banyak (BlogPosting, Product, Event, Article, etc.) — pilih sesuai jenis konten.
:::

## 21.12 Pola: Sitemap.xml

Sitemap tetap dibuat di Laravel (blade atau xml). Inertia tidak terlibat — itu URL-to-HTML map.

```php
Route::get('/sitemap.xml', [SitemapController::class, 'index'])
    ->middleware('web');
```

## 21.13 Tips Crawling-friendly Tanpa SSR

Jika tak mau SSR, beberapa hal bantu:

- `robots.txt` yang jelas.
- Sitemap terbaru.
- Canonical URLs.
- Tambah tag `og` + `twitter` untuk preview social share.
- Pakai prerendering statis (static site generator terpisah untuk landing page).

## 21.14 Ringkasan Bab

- SPA Inertia tanpa SSR kurang optimal SEO (HTML shell kosong).
- Komponen `<Head>` atur title, meta tags, OG, canonical per halaman.
- Title template via `createInertiaApp({ title })`.
- Inertia SSR via `inertia:start-ssr` + Supervisor.
- Tradeoff: lebih SEO-friendly tapi butuh Node.js.
- Hybrid: SSR hanya untuk halaman publik, tanpa SSR untuk dashboard.

:::tip Selanjutnya
[Bab 22](/bagian-5/bab-22): Testing aplikasi Inertia — feature test + `assertInertia` + Vitest + Playwright.
:::
